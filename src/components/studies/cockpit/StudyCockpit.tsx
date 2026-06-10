"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import type { Architecture } from "@/types/architecture";
import type { StudyDoc } from "@/types/study";
import { CockpitProvider, useCockpit, type LensId, type CockpitPicks } from "./state";
import { LensTabs, LENS_CATALOG } from "./LensTabs";
import { CockpitTopPlane } from "./CockpitTopPlane";
import { DecisionTray } from "./DecisionTray";
import { InspectorPane, InspectorSheet } from "./InspectorPane";
import { VerdictLens } from "./lens/VerdictLens";
import { CostLens } from "./lens/CostLens";
import { ArchitectureLens } from "./lens/ArchitectureLens";
import { CompareArchitectures } from "./CompareArchitectures";
import { LockInLens } from "./lens/LockInLens";
import { OpsLens } from "./lens/OpsLens";
import { SecurityLens } from "./lens/SecurityLens";
import { ReliabilityLens } from "./lens/ReliabilityLens";
import { ScaleLens } from "./lens/ScaleLens";
import { PerformanceLens } from "./lens/PerformanceLens";

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

/**
 * The variant payload the cockpit receives from the server shell. Failed
 * variants have `architecture: null` and `failed: true` — kept as a slot
 * so the column count stays consistent and the user can re-run.
 */
export interface CockpitVariant {
  runId: string;
  variantId: string;
  label: string;
  failed: boolean;
  errorMessage?: string;
  architecture: Architecture | null;
}

export interface StudyCockpitProps {
  study: StudyDoc;
  variants: CockpitVariant[];
}

/**
 * StudyCockpit — outer wrapper. Holds the router + per-action callbacks
 * (synthesize / promote / retry) so the provider can hand promote/retry
 * to every VariantHeader through context, while synthesize stays a
 * direct prop down to the decision tray.
 */
export function StudyCockpit({ study, variants }: StudyCockpitProps) {
  const router = useRouter();
  const [synthBusy, setSynthBusy] = useState(false);

  async function handleSynthesize(picks: Required<CockpitPicks>) {
    if (synthBusy) return;
    setSynthBusy(true);
    const t = toast.loading("Synthesizing your final architecture…");
    try {
      const res = await fetch(`/api/studies/${study.id}/synthesize`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ picks }),
      });
      if (!res.ok) {
        const msg = (await res.text()) || "Synthesis failed";
        toast.error(msg, { id: t });
        setSynthBusy(false);
        return;
      }
      const data = (await res.json()) as { finalRunId: string };
      toast.success("Synthesis started — opening the architecture", { id: t });
      router.push(`/architecture/${data.finalRunId}`);
    } catch (err) {
      toast.error((err as Error).message || "Network error", { id: t });
      setSynthBusy(false);
    }
  }

  async function handlePromote(runId: string) {
    const t = toast.loading("Promoting variant…");
    try {
      const res = await fetch(`/api/studies/${study.id}/promote`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ runId }),
      });
      if (!res.ok) {
        const msg = (await res.text()) || "Promote failed";
        toast.error(msg, { id: t });
        return;
      }
      toast.success("Promoted — opening as a standalone architecture", { id: t });
      router.push(`/architecture/${runId}`);
    } catch (err) {
      toast.error((err as Error).message || "Network error", { id: t });
    }
  }

  async function handleRetry(variantId: string) {
    const t = toast.loading("Charging 40 credits and re-running variant…");
    try {
      const res = await fetch(`/api/studies/${study.id}/retry-variant`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ variantId }),
      });
      if (!res.ok) {
        const msg = (await res.text()) || "Retry failed";
        toast.error(msg, { id: t });
        return;
      }
      toast.success("Retry started — reloading the cockpit", { id: t });
      // The server shell re-renders with the new runId in study.variants[]
      // and the StudyLive fallback streams progress until it lands.
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message || "Network error", { id: t });
    }
  }

  return (
    <CockpitProvider
      studyId={study.id}
      promoteVariant={handlePromote}
      retryVariant={handleRetry}
    >
      <CockpitInner
        study={study}
        variants={variants}
        synthBusy={synthBusy}
        onSynthesize={handleSynthesize}
      />
    </CockpitProvider>
  );
}

function CockpitInner({
  study,
  variants,
  synthBusy,
  onSynthesize,
}: StudyCockpitProps & {
  synthBusy: boolean;
  onSynthesize: (picks: Required<CockpitPicks>) => Promise<void>;
}) {
  const { currentLens } = useCockpit();
  const [view, setView] = useState<"cockpit" | "architectures">("cockpit");

  const trayVariants = useMemo(
    () =>
      variants.map((v) => ({
        variantId: v.variantId,
        label: v.label,
        available: !v.failed,
      })),
    [variants],
  );

  const failedCount = variants.filter((v) => v.failed).length;
  const completedCount = variants.length - failedCount;
  const liveArchCount = variants.filter((v) => !v.failed && v.architecture).length;

  const currentLensMeta =
    LENS_CATALOG.find((l) => l.id === currentLens) ?? LENS_CATALOG[0];

  return (
    <div className="flex h-full min-h-0 flex-col bg-[hsl(var(--paper-2))]/30">
      {/* === Top: header strip === */}
      <header className="border-b border-[hsl(var(--line))] bg-[hsl(var(--card))]">
        <div className="mx-auto w-full max-w-[1800px] flex items-center justify-between gap-3 px-4 md:px-6 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/studies/new"
              className="ms text-[20px] text-[hsl(var(--ink-3))] hover:text-[hsl(var(--ink))] transition-colors"
              aria-label="Back to studies"
              title="New study"
            >
              arrow_back
            </Link>
            <div className="min-w-0">
              <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[hsl(var(--ink-3))]">
                Comparison study · {dimensionLabel(study.dimension)}
              </div>
              <h1 className="display-tight text-[18px] tracking-[-0.02em] truncate">
                {(study.prompt || "Untitled study").slice(0, 90)}
                {(study.prompt || "").length > 90 ? "…" : ""}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {liveArchCount > 0 && (
              <button
                type="button"
                onClick={() => setView((v) => (v === "cockpit" ? "architectures" : "cockpit"))}
                aria-pressed={view === "architectures"}
                className={
                  view === "architectures"
                    ? "inline-flex items-center gap-1.5 rounded-md border border-[hsl(var(--ink))] bg-[hsl(var(--ink))] px-3 py-1.5 text-[12px] text-[hsl(var(--paper))] transition-colors"
                    : "inline-flex items-center gap-1.5 rounded-md border border-[hsl(var(--line))] bg-[hsl(var(--card))] px-3 py-1.5 text-[12px] text-[hsl(var(--ink-2))] transition-colors hover:text-[hsl(var(--ink))] hover:border-[hsl(var(--ink-3))]"
                }
                title={view === "architectures" ? "Back to dashboard" : "Show all architectures side-by-side"}
              >
                <span className="ms text-[15px]" aria-hidden>
                  {view === "architectures" ? "dashboard" : "schema"}
                </span>
                <span className="font-medium whitespace-nowrap">
                  {view === "architectures" ? "Back to dashboard" : "Compare architectures"}
                </span>
              </button>
            )}
            <div className="hidden sm:flex items-center gap-2 text-[11px] text-[hsl(var(--ink-3))] font-mono uppercase tracking-wider">
              <span>{completedCount} ready</span>
              {failedCount > 0 && (
                <span className="text-[hsl(var(--bad))]">
                  · {failedCount} failed
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* === Body: fade-swap between dashboard cockpit and architectures-only view === */}
      <AnimatePresence mode="wait" initial={false}>
        {view === "cockpit" ? (
          <motion.div
            key="cockpit"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28, ease: EASE_OUT_EXPO }}
            className="flex flex-1 min-h-0 flex-col md:flex-row"
          >
            {/* Left: vertical lens rail */}
            <LensTabs />

            {/* Right: scenario + selected view (dashboard OR lens) + inspector */}
            <div className="flex flex-1 min-h-0 flex-col">
              <CockpitTopPlane
                variants={variants}
                showDashboard={currentLens === "dashboard"}
              />

              <div className="flex flex-1 min-h-0 flex-col md:flex-row">
                <main className="flex-1 min-h-0 overflow-auto scrollbar-thin">
                  <div className="mx-auto w-full max-w-[1800px] px-4 md:px-6 py-5 md:py-6">
                    {currentLens !== "dashboard" && (
                      <LensHeader lensId={currentLens} label={currentLensMeta.label} />
                    )}
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={currentLens}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.24, ease: EASE_OUT_EXPO }}
                        className={currentLens === "dashboard" ? "" : "mt-4"}
                      >
                        <LensRouter lens={currentLens} variants={variants} />
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </main>

                <InspectorPane />
              </div>

              {/* Decision tray docked at bottom of right column */}
              <DecisionTray
                variants={trayVariants}
                onSynthesize={onSynthesize}
                busy={synthBusy}
              />
            </div>
          </motion.div>
        ) : (
          <motion.main
            key="architectures"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28, ease: EASE_OUT_EXPO }}
            className="flex-1 min-h-0 overflow-auto scrollbar-thin"
          >
            <div className="mx-auto w-full max-w-[1800px] px-4 md:px-6 py-5 md:py-6">
              <div className="flex items-baseline justify-between border-b border-[hsl(var(--line))] pb-3">
                <div className="flex flex-col gap-0.5">
                  <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[hsl(var(--ink-3))]">
                    Compare
                  </span>
                  <h2 className="display-tight text-[22px] leading-none tracking-[-0.02em]">
                    Full system architectures
                  </h2>
                </div>
                <span className="hidden md:inline text-[12px] text-[hsl(var(--ink-2))] max-w-[44ch] text-right">
                  One full system architecture at a time, using the whole
                  screen. Switch variants above; click any component for
                  detail.
                </span>
              </div>
              <div className="mt-4">
                <CompareArchitectures variants={variants} />
              </div>
            </div>
          </motion.main>
        )}
      </AnimatePresence>

      {/* === Mobile/tablet fallback for the inspector === */}
      <InspectorSheet />
    </div>
  );
}

function LensHeader({ lensId, label }: { lensId: LensId; label: string }) {
  return (
    <div className="flex items-baseline justify-between border-b border-[hsl(var(--line))] pb-3">
      <div className="flex flex-col gap-0.5">
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[hsl(var(--ink-3))]">
          Lens
        </span>
        <h2 className="display-tight text-[22px] leading-none tracking-[-0.02em]">
          {label}
        </h2>
      </div>
      <span className="hidden md:inline text-[12px] text-[hsl(var(--ink-2))] max-w-[44ch] text-right">
        {lensCaption(lensId)}
      </span>
    </div>
  );
}

function lensCaption(id: LensId): string {
  switch (id) {
    case "dashboard":    return "Live verdict and the 9-metric comparison matrix — your starting overview.";
    case "verdict":      return "Who wins which axis — cost, ops, lock-in, attack surface.";
    case "architecture": return "Three diagrams side-by-side. Hover any component to see equivalents in the others; click to zoom.";
    case "performance":  return "Response time vs load — read it as: at your scenario, how does each variant hold up?";
    case "scale":        return "Per-tier ceiling and the bottleneck that hits first.";
    case "cost":         return "Stacked monthly cost projected to your load. Drag the load slider above to project.";
    case "reliability":  return "Failure modes and a region-down simulation. Toggle 'Region down' above.";
    case "security":     return "Controls vs compliance regimes — green = covered, amber = partial, red = missing.";
    case "ops":          return "Headcount required day-2 and where the burden lands (deploy, on-call, observability).";
    case "lockin":       return "Sticky managed services and the rough cost to switch off them.";
  }
}

function LensRouter({
  lens,
  variants,
}: {
  lens: LensId;
  variants: CockpitVariant[];
}) {
  switch (lens) {
    case "dashboard":    return null;
    case "verdict":      return <VerdictLens variants={variants} />;
    case "architecture": return <ArchitectureLens variants={variants} />;
    case "performance":  return <PerformanceLens variants={variants} />;
    case "scale":        return <ScaleLens variants={variants} />;
    case "cost":         return <CostLens variants={variants} />;
    case "reliability":  return <ReliabilityLens variants={variants} />;
    case "security":     return <SecurityLens variants={variants} />;
    case "ops":          return <OpsLens variants={variants} />;
    case "lockin":       return <LockInLens variants={variants} />;
  }
}

function dimensionLabel(id: string): string {
  switch (id) {
    case "cloud":        return "Cloud";
    case "style":        return "Style";
    case "datastore":    return "Datastore";
    case "deployment":   return "Deployment";
    case "cost-posture": return "Cost posture";
    default:             return id;
  }
}
