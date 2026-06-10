"use client";

/**
 * CockpitTopPlane — the new headline surface of the cockpit.
 *
 * Replaces the old `ScenarioBar`. Three stacked sections, all visible
 * regardless of which lens the user is on:
 *
 *   1. Scenario controls — slimmer than before; still drives state.
 *   2. Living verdict sentence — one sentence that re-composes whenever
 *      scenario state changes. The reader always sees the answer.
 *   3. Variant scorecards — per-variant {cost, latency, ceiling%,
 *      headcount} that animate when scenario changes. The cause-and-
 *      effect chain is visible without switching panels.
 *
 * Failed variants get a slot so the column count stays consistent and
 * the user can retry.
 */

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useCockpit, type Scenario } from "./state";
import { KpiHero } from "./KpiHero";
import { MetricMatrix } from "./MetricMatrix";
import { estimatedMonthlyRequests } from "@/lib/studies/scenario";
import { computeVerdict } from "@/lib/studies/insights";
import type { CockpitVariant } from "./StudyCockpit";

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

const LATENCY_PRESETS: readonly Scenario["latencyBudgetMs"][] = [
  50, 200, 500, 1000,
];

function sliderToMau(v: number): number {
  const min = Math.log10(1_000);
  const max = Math.log10(100_000_000);
  const lg = min + (v / 1000) * (max - min);
  return Math.round(Math.pow(10, lg));
}

function mauToSlider(mau: number): number {
  const min = Math.log10(1_000);
  const max = Math.log10(100_000_000);
  const lg = Math.log10(Math.max(1_000, Math.min(100_000_000, mau)));
  return Math.round(((lg - min) / (max - min)) * 1000);
}

function formatMauShort(mau: number): string {
  if (mau >= 1_000_000) {
    const m = mau / 1_000_000;
    return `${m >= 10 ? m.toFixed(0) : m.toFixed(1)}M`;
  }
  if (mau >= 1_000) return `${(mau / 1_000).toFixed(0)}K`;
  return mau.toLocaleString("en-IN");
}

function tierForMau(mau: number): "startup" | "growth" | "scale" | "hyperscale" {
  if (mau < 10_000)     return "startup";
  if (mau < 500_000)    return "growth";
  if (mau < 10_000_000) return "scale";
  return "hyperscale";
}

function headcountTierForMau(mau: number): "growth" | "scale" | "hyperscale" {
  if (mau < 500_000)    return "growth";
  if (mau < 10_000_000) return "scale";
  return "hyperscale";
}

export function CockpitTopPlane({
  variants,
  showDashboard = true,
}: {
  variants: CockpitVariant[];
  /** When false, the KpiHero + MetricMatrix band is hidden; only the
   * scenario controls and living verdict render. Used when a non-
   * dashboard lens is selected — the lens body owns the main area. */
  showDashboard?: boolean;
}) {
  const { scenario, setScenario } = useCockpit();

  const sliderValue = useMemo(
    () => mauToSlider(scenario.loadMau),
    [scenario.loadMau],
  );

  const liveVariants = useMemo(
    () =>
      variants
        .filter((v) => !v.failed && v.architecture)
        .map((v) => ({ variantId: v.variantId, label: v.label, arch: v.architecture! })),
    [variants],
  );

  const verdict = useMemo(
    () => computeVerdict(liveVariants, scenario, { regimes: [] }),
    [liveVariants, scenario],
  );

  return (
    <section
      aria-label="Scenario controls and live verdict"
      className="border-b border-[hsl(var(--line))] bg-[hsl(var(--card))]"
    >
      <div className="mx-auto w-full max-w-[1800px] px-4 md:px-6 py-4 md:py-5 flex flex-col gap-4">
        {/* ────────── Row 1: scenario controls ────────── */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          {/* Load slider */}
          <div className="flex flex-1 min-w-[260px] items-center gap-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[hsl(var(--ink-3))] shrink-0">
              Load
            </span>
            <input
              type="range"
              min={0}
              max={1000}
              step={1}
              value={sliderValue}
              onChange={(e) =>
                setScenario({
                  ...scenario,
                  loadMau: sliderToMau(Number(e.currentTarget.value)),
                })
              }
              aria-label="Monthly active users (log scale)"
              className="flex-1 accent-[hsl(var(--accent))]"
            />
            <div className="w-[100px] text-right">
              <motion.span
                key={scenario.loadMau}
                initial={{ opacity: 0.55, y: 2 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18, ease: EASE_OUT_EXPO }}
                className="display-tight text-[20px] tracking-[-0.02em] tabular-nums"
              >
                {formatMauShort(scenario.loadMau)}
              </motion.span>
              <span className="ml-1 font-mono text-[10px] uppercase tracking-wider text-[hsl(var(--ink-3))]">
                MAU
              </span>
            </div>
          </div>

          {/* Latency budget */}
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[hsl(var(--ink-3))]">
              p95
            </span>
            <div className="flex items-center border border-[hsl(var(--line))] bg-[hsl(var(--paper-2))]/60 p-0.5">
              {LATENCY_PRESETS.map((ms) => {
                const active = ms === scenario.latencyBudgetMs;
                return (
                  <button
                    key={ms}
                    type="button"
                    onClick={() => setScenario({ ...scenario, latencyBudgetMs: ms })}
                    aria-pressed={active}
                    className={cn(
                      "relative px-2.5 py-0.5 text-[12px] transition-colors",
                      active
                        ? "text-[hsl(var(--paper))]"
                        : "text-[hsl(var(--ink-2))] hover:text-[hsl(var(--ink))]",
                    )}
                  >
                    {active && (
                      <motion.span
                        layoutId="cockpit-latency-active"
                        className="absolute inset-0 bg-[hsl(var(--ink))]"
                        transition={{ duration: 0.28, ease: EASE_OUT_EXPO }}
                      />
                    )}
                    <span className="relative z-10 tabular-nums">
                      {ms < 1000 ? `${ms}ms` : `${ms / 1000}s`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Region failure */}
          <label
            title="Simulate a single-region outage. Variants that depend on one region degrade; multi-region designs survive."
            className={cn(
              "flex items-center gap-2 select-none cursor-pointer text-[12px]",
              scenario.regionFailureSim && "text-[hsl(var(--bad))]",
            )}
          >
            <input
              type="checkbox"
              className="sr-only peer"
              checked={scenario.regionFailureSim}
              onChange={(e) =>
                setScenario({ ...scenario, regionFailureSim: e.currentTarget.checked })
              }
            />
            <span
              aria-hidden
              className={cn(
                "relative inline-flex h-5 w-9 rounded-full border transition-colors",
                scenario.regionFailureSim
                  ? "border-[hsl(var(--bad))] bg-[hsl(var(--bad))]/30"
                  : "border-[hsl(var(--line-2))] bg-[hsl(var(--paper-2))]",
              )}
            >
              <motion.span
                layout
                transition={{ duration: 0.24, ease: EASE_OUT_EXPO }}
                className={cn(
                  "absolute top-0.5 size-4 rounded-full transition-colors",
                  scenario.regionFailureSim
                    ? "left-[18px] bg-[hsl(var(--bad))]"
                    : "left-0.5 bg-[hsl(var(--ink-3))]",
                )}
              />
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.14em]">
              Region down
            </span>
            <span
              className="ms text-[14px] text-[hsl(var(--ink-3))]/70 -ml-1"
              aria-hidden
              title="Simulate a single-region outage. Variants that depend on one region degrade; multi-region designs survive."
            >
              info
            </span>
          </label>

          {/* Cost ceiling */}
          <div
            className="flex items-center gap-2"
            title="Monthly cost ceiling in INR. Variants that exceed this at the current load show a warning in the matrix."
          >
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[hsl(var(--ink-3))] inline-flex items-center gap-1">
              Ceiling
              <span
                className="ms text-[12px] text-[hsl(var(--ink-3))]/70"
                aria-hidden
              >
                info
              </span>
            </span>
            <div className="flex items-center border border-[hsl(var(--line))] bg-[hsl(var(--paper-2))]/60 px-2 py-0.5">
              <span className="text-[11px] text-[hsl(var(--ink-3))] mr-1">₹</span>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                step={10000}
                value={scenario.costCeilingInr ?? ""}
                onChange={(e) => {
                  const raw = e.currentTarget.value;
                  const n = raw === "" ? undefined : Math.max(0, Number(raw));
                  setScenario({
                    ...scenario,
                    costCeilingInr: Number.isFinite(n!) ? n : undefined,
                  });
                }}
                placeholder="—"
                aria-label="Monthly cost ceiling in INR"
                className="w-[80px] bg-transparent text-[12px] tabular-nums focus:outline-none placeholder:text-[hsl(var(--ink-3))]/60"
              />
              <span className="text-[10px] text-[hsl(var(--ink-3))] ml-1">/mo</span>
            </div>
          </div>
        </div>

        {/* ────────── Row 2: living verdict sentence ────────── */}
        <LivingVerdict
          cheapestLabel={verdict.cheapest?.label ?? null}
          lowestOpsLabel={verdict.lowestOps?.label ?? null}
          fastestLabel={verdict.fastestToShip?.label ?? null}
          mau={scenario.loadMau}
          latencyMs={scenario.latencyBudgetMs}
          regionDown={scenario.regionFailureSim}
        />

        {/* ────────── Row 3: KPI hero band ────────── */}
        {showDashboard && <KpiHero variants={variants} />}

        {/* ────────── Row 4: comparison matrix ────────── */}
        {showDashboard && <MetricMatrix variants={variants} />}
      </div>
    </section>
  );
}

/* ────────────────── Living verdict sentence ────────────────── */

function LivingVerdict({
  cheapestLabel,
  lowestOpsLabel,
  fastestLabel,
  mau,
  latencyMs,
  regionDown,
}: {
  cheapestLabel: string | null;
  lowestOpsLabel: string | null;
  fastestLabel: string | null;
  mau: number;
  latencyMs: number;
  regionDown: boolean;
}) {
  const [open, setOpen] = useState(false);
  const monthlyReq = estimatedMonthlyRequests(mau);
  const monthlyReqStr =
    monthlyReq >= 1_000_000_000
      ? `${(monthlyReq / 1_000_000_000).toFixed(1)}B req`
      : monthlyReq >= 1_000_000
      ? `${(monthlyReq / 1_000_000).toFixed(0)}M req`
      : `${(monthlyReq / 1_000).toFixed(0)}K req`;

  return (
    <div className="rounded-lg border border-[hsl(var(--line))] bg-[hsl(var(--paper-2))]/40 px-3.5 py-3 leading-relaxed">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full text-left"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[hsl(var(--ink-3))]">
            At your scenario
          </div>
          <span
            className={cn(
              "ms text-[16px] text-[hsl(var(--ink-3))] transition-transform",
              open && "rotate-180",
            )}
            aria-hidden
          >
            expand_more
          </span>
        </div>
        <p className="mt-1 text-[14px] md:text-[15px] text-[hsl(var(--ink))]">
          <span className="font-mono text-[hsl(var(--ink-2))]">
            {formatMauShort(mau)} MAU
          </span>
          <span className="text-[hsl(var(--ink-3))]">
            {" "}({monthlyReqStr}/mo)
          </span>
          <span className="text-[hsl(var(--ink-3))]"> · p95 ≤ </span>
          <span className="font-mono text-[hsl(var(--ink-2))]">
            {latencyMs < 1000 ? `${latencyMs}ms` : `${latencyMs / 1000}s`}
          </span>
          {regionDown && (
            <span className="text-[hsl(var(--bad))]"> · region down</span>
          )}
          <span className="text-[hsl(var(--ink-3))]"> — </span>
          <WinnerWord prefix="cheapest is" label={cheapestLabel} tone="accent" />
          {lowestOpsLabel && (
            <>
              <span className="text-[hsl(var(--ink-3))]">, </span>
              <WinnerWord prefix="lowest ops is" label={lowestOpsLabel} tone="ink" />
            </>
          )}
          {fastestLabel && fastestLabel !== cheapestLabel && (
            <>
              <span className="text-[hsl(var(--ink-3))]">, </span>
              <WinnerWord prefix="fastest to ship is" label={fastestLabel} tone="ink" />
            </>
          )}
          <span className="text-[hsl(var(--ink-3))]">.</span>
        </p>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="verdict-detail"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: EASE_OUT_EXPO }}
            className="overflow-hidden"
          >
            <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 text-[12px]">
              <DetailRow
                label="Load"
                value={`${formatMauShort(mau)} MAU · ~${monthlyReqStr}/mo`}
                hint="Drag the slider above to project to any load between 1K and 100M MAU. Cost, latency and saturation all re-compute live."
              />
              <DetailRow
                label="Latency budget"
                value={latencyMs < 1000 ? `${latencyMs}ms p95` : `${latencyMs / 1000}s p95`}
                hint="The 95th-percentile response time you commit to. Variants whose projected p95 exceeds this get flagged in the Performance lens."
              />
              <DetailRow
                label="Region down"
                value={regionDown ? "Simulating" : "Off"}
                hint="When on, single-region designs degrade and the Reliability lens highlights which architectures survive."
              />
              {cheapestLabel && (
                <DetailRow
                  label="Cheapest at this load"
                  value={cheapestLabel}
                  hint="Lowest projected monthly INR for the current load, after the cost ceiling rule."
                />
              )}
              {lowestOpsLabel && (
                <DetailRow
                  label="Lowest ops burden"
                  value={lowestOpsLabel}
                  hint="Fewest day-2 engineering headcount required — deploys, on-call, observability combined."
                />
              )}
              {fastestLabel && (
                <DetailRow
                  label="Fastest to ship"
                  value={fastestLabel}
                  hint="Smallest projected p95 at the current load. Sometimes the same as cheapest, often not."
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DetailRow({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-md border border-[hsl(var(--line))] bg-[hsl(var(--card))] px-3 py-2">
      <div className="font-mono text-[9px] uppercase tracking-wider text-[hsl(var(--ink-3))]">
        {label}
      </div>
      <div className="mt-0.5 text-[12.5px] text-[hsl(var(--ink))]">{value}</div>
      <p className="mt-1 text-[11px] text-[hsl(var(--ink-3))] leading-snug">
        {hint}
      </p>
    </div>
  );
}

function WinnerWord({
  prefix,
  label,
  tone,
}: {
  prefix: string;
  label: string | null;
  tone: "accent" | "ink";
}) {
  if (!label) {
    return (
      <>
        <span className="text-[hsl(var(--ink-3))]">{prefix} </span>
        <span className="text-[hsl(var(--ink-3))] italic">—</span>
      </>
    );
  }
  return (
    <>
      <span className="text-[hsl(var(--ink-3))]">{prefix} </span>
      <span className="inline-block">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={label}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.22, ease: EASE_OUT_EXPO }}
            className={cn(
              "font-medium",
              tone === "accent"
                ? "text-[hsl(var(--accent-ink))]"
                : "text-[hsl(var(--ink))]",
            )}
          >
            {label}
          </motion.span>
        </AnimatePresence>
      </span>
    </>
  );
}
