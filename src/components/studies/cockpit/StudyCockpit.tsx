"use client";

import { useMemo } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import type { Architecture } from "@/types/architecture";
import type { StudyDoc } from "@/types/study";
import { CockpitProvider, useCockpit, type LensId } from "./state";
import { LensRail, LENS_CATALOG } from "./LensRail";
import { ScenarioBar } from "./ScenarioBar";
import { DecisionTray } from "./DecisionTray";
import { ExplainDrawer } from "./ExplainDrawer";
import { LensColumns } from "./LensColumns";

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
                <LensColumns
                  variants={variants.map((v) => ({
                    runId: v.runId,
                    variantId: v.variantId,
                    label: v.label,
                    failed: v.failed,
                  }))}
                  emptyMessage={lensPlaceholderCopy(currentLens)}
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* === Bottom: decision tray === */}
      <DecisionTray variants={trayVariants} />

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

function lensPlaceholderCopy(id: LensId): string {
  switch (id) {
    case "verdict":      return "The verdict lens summarises which variant wins each axis. Lands with Phase 5.";
    case "architecture": return "Three diagrams render side-by-side here, with linked node highlights. Lands with Phase 5.";
    case "performance":  return "A live response-time curve per variant — drag the scenario slider to watch the lines bend. Lands with Phase 5.";
    case "scale":        return "Per-tier bar charts with a ceiling marker and the first-to-saturate component callout. Lands with Phase 5.";
    case "cost":         return "Stacked monthly cost — compute, data, network, observability, ML. Re-projects on every slider tick. Lands with Phase 5.";
    case "reliability":  return "Failure-mode matrix. Toggle Region Down to see who survives and at what cost. Lands with Phase 5.";
    case "security":     return "Compliance × variant grid with control density per regime. Lands with Phase 5.";
    case "ops":          return "Headcount estimate + day-2 burden score per variant. Lands with Phase 5.";
    case "lockin":       return "Sticky-service inventory and migration cost estimate. Lands with Phase 5.";
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
