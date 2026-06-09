"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { DEFAULT_SCENARIO, type Scenario } from "@/lib/studies/scenario";

// Re-export so existing component imports keep working unchanged.
export { DEFAULT_SCENARIO };
export type { Scenario };

/**
 * The six pick slices the user commits in the decision tray. Maps
 * `sliceId → variantId`. A complete pick set has all six keys.
 *
 * Kept as a plain Record (not the zod-checked `Picks` from `types/study`)
 * because partial-tray edits would fail zod parsing. The synthesis API
 * validates completeness server-side.
 */
export type CockpitPicks = Partial<Record<
  "components"
  | "datastore"
  | "messaging"
  | "deployment"
  | "security"
  | "observability",
  string
>>;

/** The full nine-lens catalog. Stable order; ids match the rail shortcuts. */
export type LensId =
  | "verdict"
  | "architecture"
  | "performance"
  | "scale"
  | "cost"
  | "reliability"
  | "security"
  | "ops"
  | "lockin";

/** Right-side explain drawer payload — `null` means closed. */
export interface DrawerPayload {
  title: string;
  body: ReactNode;
  /** Optional secondary line under the title. */
  caption?: string;
}

interface CockpitContextValue {
  studyId: string;
  scenario: Scenario;
  setScenario: (next: Scenario) => void;
  currentLens: LensId;
  setCurrentLens: (id: LensId) => void;
  picks: CockpitPicks;
  setPick: (sliceId: keyof CockpitPicks, variantId: string | undefined) => void;
  drawer: DrawerPayload | null;
  openDrawer: (payload: DrawerPayload) => void;
  closeDrawer: () => void;
  /** runIds currently in flight for a per-variant action (promote/retry). */
  variantBusy: Record<string, "promote" | "retry" | undefined>;
  promoteVariant: (runId: string) => Promise<void>;
  retryVariant: (variantId: string) => Promise<void>;
}

const CockpitContext = createContext<CockpitContextValue | null>(null);

export function CockpitProvider({
  children,
  studyId,
  initialLens = "verdict",
  initialScenario = DEFAULT_SCENARIO,
  promoteVariant,
  retryVariant,
}: {
  children: ReactNode;
  studyId: string;
  initialLens?: LensId;
  initialScenario?: Scenario;
  promoteVariant: (runId: string) => Promise<void>;
  retryVariant: (variantId: string) => Promise<void>;
}) {
  const [scenario, setScenario] = useState<Scenario>(initialScenario);
  const [currentLens, setCurrentLens] = useState<LensId>(initialLens);
  const [picks, setPicks] = useState<CockpitPicks>({});
  const [drawer, setDrawer] = useState<DrawerPayload | null>(null);
  const [variantBusy, setVariantBusy] = useState<
    Record<string, "promote" | "retry" | undefined>
  >({});

  const wrappedPromote = async (runId: string) => {
    if (variantBusy[runId]) return;
    setVariantBusy((prev) => ({ ...prev, [runId]: "promote" }));
    try {
      await promoteVariant(runId);
    } finally {
      setVariantBusy((prev) => {
        const next = { ...prev };
        delete next[runId];
        return next;
      });
    }
  };
  const wrappedRetry = async (variantId: string) => {
    // Key the busy state on the variantId for retry — the runId changes
    // on success, so the slot itself (variantId) is the stable identity.
    if (variantBusy[variantId]) return;
    setVariantBusy((prev) => ({ ...prev, [variantId]: "retry" }));
    try {
      await retryVariant(variantId);
    } finally {
      setVariantBusy((prev) => {
        const next = { ...prev };
        delete next[variantId];
        return next;
      });
    }
  };

  const value = useMemo<CockpitContextValue>(
    () => ({
      studyId,
      scenario,
      setScenario,
      currentLens,
      setCurrentLens,
      picks,
      setPick: (sliceId, variantId) =>
        setPicks((prev) => {
          if (variantId === undefined) {
            // Stable shallow copy without the slice — easier to reason
            // about than `delete` mutation.
            const next: CockpitPicks = { ...prev };
            delete next[sliceId];
            return next;
          }
          return { ...prev, [sliceId]: variantId };
        }),
      drawer,
      openDrawer: (payload) => setDrawer(payload),
      closeDrawer: () => setDrawer(null),
      variantBusy,
      promoteVariant: wrappedPromote,
      retryVariant: wrappedRetry,
    }),
    // wrappedPromote/wrappedRetry close over variantBusy + the prop
    // callbacks; deps below cover the prop identities + state. The
    // wrappers themselves are recreated on each render — cheap.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [studyId, scenario, currentLens, picks, drawer, variantBusy, promoteVariant, retryVariant],
  );

  return (
    <CockpitContext.Provider value={value}>{children}</CockpitContext.Provider>
  );
}

export function useCockpit(): CockpitContextValue {
  const ctx = useContext(CockpitContext);
  if (!ctx) throw new Error("useCockpit must be used inside <CockpitProvider>");
  return ctx;
}
