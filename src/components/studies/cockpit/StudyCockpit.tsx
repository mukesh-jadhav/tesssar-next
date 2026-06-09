"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import type { Architecture } from "@/types/architecture";
import type { StudyDoc } from "@/types/study";
import { CockpitProvider, useCockpit, type LensId, type CockpitPicks } from "./state";
import { LensRail, LENS_CATALOG } from "./LensRail";
import { ScenarioBar } from "./ScenarioBar";
import { DecisionTray } from "./DecisionTray";
import { ExplainDrawer } from "./ExplainDrawer";
import { VerdictLens } from "./lens/VerdictLens";
import { CostLens } from "./lens/CostLens";
import { ArchitectureLens } from "./lens/ArchitectureLens";
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
 * StudyCockpit — the four-plane cockpit shell. Phase 3 wires the chrome
 * and state; Phase 4-5 fills the lenses with projections and content.
 */
export function StudyCockpit(props: StudyCockpitProps) {
  return (
    <CockpitProvider>
      <CockpitInner {...props} />
    </CockpitProvider>
  );
}

function CockpitInner({ study, variants }: StudyCockpitProps) {
  const { currentLens } = useCockpit();
  const router = useRouter();
  const [synthBusy, setSynthBusy] = useState(false);

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

  const currentLensMeta =
    LENS_CATALOG.find((l) => l.id === currentLens) ?? LENS_CATALOG[0];

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

  return (
    <div className="flex h-full min-h-0 flex-col bg-[hsl(var(--paper-2))]/30">
      {/* === Top: brand + back + scenario === */}
      <header className="border-b border-[hsl(var(--line))] bg-[hsl(var(--card))]">
        <div className="flex items-center justify-between gap-3 px-4 md:px-6 py-3">
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
          <div className="hidden sm:flex items-center gap-2 text-[11px] text-[hsl(var(--ink-3))] font-mono uppercase tracking-wider">
            <span>{completedCount} ready</span>
            {failedCount > 0 && (
              <span className="text-[hsl(var(--bad))]">
                · {failedCount} failed
              </span>
            )}
          </div>
        </div>
        <ScenarioBar />
      </header>

      {/* === Middle: lens rail + stage === */}
      <div className="flex flex-1 min-h-0 flex-col md:flex-row">
        <aside className="md:w-[200px] md:shrink-0">
          <LensRail />
        </aside>

        <main className="flex-1 min-h-0 overflow-auto scrollbar-thin">
          <div className="mx-auto w-full max-w-[1400px] px-4 md:px-6 py-5 md:py-6">
            <LensHeader lensId={currentLens} label={currentLensMeta.label} />
            <AnimatePresence mode="wait">
              <motion.div
                key={currentLens}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.24, ease: EASE_OUT_EXPO }}
                className="mt-4"
              >
                <LensRouter lens={currentLens} variants={variants} />
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* === Bottom: decision tray === */}
      <DecisionTray
        variants={trayVariants}
        onSynthesize={handleSynthesize}
        busy={synthBusy}
      />

      {/* === Floating: explain drawer === */}
      <ExplainDrawer />
    </div>
  );
}

function LensHeader({ lensId, label }: { lensId: LensId; label: string }) {
  return (
    <div className="flex items-baseline justify-between border-b border-[hsl(var(--line))] pb-3">
      <span className="section-num">{label}</span>
      <span className="hidden md:inline text-[11px] font-mono uppercase tracking-wider text-[hsl(var(--ink-3))]">
        {lensCaption(lensId)}
      </span>
    </div>
  );
}

function lensCaption(id: LensId): string {
  switch (id) {
    case "verdict":      return "Which variant wins each axis";
    case "architecture": return "Three diagrams · linked highlight";
    case "performance":  return "Response time vs load";
    case "scale":        return "Per-tier ceiling + bottleneck";
    case "cost":         return "Stacked cost · projected to your load";
    case "reliability":  return "Failure modes · region simulation";
    case "security":     return "Controls · compliance regimes";
    case "ops":          return "Headcount · day-2 burden";
    case "lockin":       return "Sticky services · exit cost";
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
