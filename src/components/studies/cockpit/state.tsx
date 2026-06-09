"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

/**
 * Shared shape for the scenario the cockpit is testing. Pure client-side
 * state — never persisted. Phase 4 wires the projection engine; Phase 3
 * just plumbs the values through.
 */
export interface Scenario {
  /** Continuous, 1K → 100M monthly active users. */
  loadMau: number;
  /** Latency budget for p95 reads. */
  latencyBudgetMs: 50 | 200 | 500 | 1000;
  /** When true, the primary region is assumed offline. */
  regionFailureSim: boolean;
  /** Optional ₹ / month ceiling — `undefined` = no ceiling. */
  costCeilingInr?: number;
}

export const DEFAULT_SCENARIO: Scenario = {
  loadMau: 100_000,
  latencyBudgetMs: 200,
  regionFailureSim: false,
  costCeilingInr: undefined,
};

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
  scenario: Scenario;
  setScenario: (next: Scenario) => void;
  currentLens: LensId;
  setCurrentLens: (id: LensId) => void;
  picks: CockpitPicks;
  setPick: (sliceId: keyof CockpitPicks, variantId: string | undefined) => void;
  drawer: DrawerPayload | null;
  openDrawer: (payload: DrawerPayload) => void;
  closeDrawer: () => void;
}

const CockpitContext = createContext<CockpitContextValue | null>(null);

export function CockpitProvider({
  children,
  initialLens = "verdict",
  initialScenario = DEFAULT_SCENARIO,
}: {
  children: ReactNode;
  initialLens?: LensId;
  initialScenario?: Scenario;
}) {
  const [scenario, setScenario] = useState<Scenario>(initialScenario);
  const [currentLens, setCurrentLens] = useState<LensId>(initialLens);
  const [picks, setPicks] = useState<CockpitPicks>({});
  const [drawer, setDrawer] = useState<DrawerPayload | null>(null);

  const value = useMemo<CockpitContextValue>(
    () => ({
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
    }),
    [scenario, currentLens, picks, drawer],
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
