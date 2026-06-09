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

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useCockpit, type Scenario } from "./state";
import { LiveCounter } from "./LiveCounter";
import {
  projectCost,
  projectLatency,
  projectCeiling,
  estimatedMonthlyRequests,
} from "@/lib/studies/scenario";
import {
  computeVerdict,
  headcountAtTier,
  formatInr,
} from "@/lib/studies/insights";
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

export function CockpitTopPlane({ variants }: { variants: CockpitVariant[] }) {
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
      <div className="mx-auto w-full max-w-[1400px] px-4 md:px-6 py-4 md:py-5 flex flex-col gap-4">
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
            <div className="flex items-center rounded-full border border-[hsl(var(--line))] bg-[hsl(var(--paper-2))]/60 p-0.5">
              {LATENCY_PRESETS.map((ms) => {
                const active = ms === scenario.latencyBudgetMs;
                return (
                  <button
                    key={ms}
                    type="button"
                    onClick={() => setScenario({ ...scenario, latencyBudgetMs: ms })}
                    aria-pressed={active}
                    className={cn(
                      "relative rounded-full px-2.5 py-0.5 text-[12px] transition-colors",
                      active
                        ? "text-[hsl(var(--paper))]"
                        : "text-[hsl(var(--ink-2))] hover:text-[hsl(var(--ink))]",
                    )}
                  >
                    {active && (
                      <motion.span
                        layoutId="cockpit-latency-active"
                        className="absolute inset-0 rounded-full bg-[hsl(var(--ink))]"
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
          </label>

          {/* Cost ceiling */}
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[hsl(var(--ink-3))]">
              Ceiling
            </span>
            <div className="flex items-center rounded-full border border-[hsl(var(--line))] bg-[hsl(var(--paper-2))]/60 px-2 py-0.5">
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

        {/* ────────── Row 3: variant scorecards ────────── */}
        <div
          className={cn(
            "grid gap-3",
            variants.length === 2 ? "md:grid-cols-2" :
            variants.length === 3 ? "md:grid-cols-3" :
            "md:grid-cols-2 lg:grid-cols-4",
          )}
        >
          {variants.map((v) => (
            <VariantScorecard
              key={v.variantId}
              variant={v}
              scenario={scenario}
              isCheapest={verdict.cheapest?.label === v.label}
              isLowestOps={verdict.lowestOps?.label === v.label}
              isFastest={verdict.fastestToShip?.label === v.label}
            />
          ))}
        </div>
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
  const monthlyReq = estimatedMonthlyRequests(mau);
  const monthlyReqStr =
    monthlyReq >= 1_000_000_000
      ? `${(monthlyReq / 1_000_000_000).toFixed(1)}B req`
      : monthlyReq >= 1_000_000
      ? `${(monthlyReq / 1_000_000).toFixed(0)}M req`
      : `${(monthlyReq / 1_000).toFixed(0)}K req`;

  return (
    <div className="rounded-lg border border-[hsl(var(--line))] bg-[hsl(var(--paper-2))]/40 px-3.5 py-3 leading-relaxed">
      <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[hsl(var(--ink-3))]">
        At your scenario
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

/* ────────────────── Variant scorecard ────────────────── */

function VariantScorecard({
  variant,
  scenario,
  isCheapest,
  isLowestOps,
  isFastest,
}: {
  variant: CockpitVariant;
  scenario: Scenario;
  isCheapest: boolean;
  isLowestOps: boolean;
  isFastest: boolean;
}) {
  if (variant.failed || !variant.architecture) {
    return (
      <div className="rounded-lg border border-dashed border-[hsl(var(--line))] bg-[hsl(var(--paper-2))]/30 p-3.5">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[hsl(var(--ink-3))]">
            {variant.label}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-wider text-[hsl(var(--bad))]">
            failed
          </span>
        </div>
        <p className="mt-2 text-[12px] text-[hsl(var(--ink-3))] line-clamp-2">
          {variant.errorMessage ?? "Variant did not complete. Retry from the lens panel below."}
        </p>
      </div>
    );
  }

  const arch = variant.architecture;
  const cost = projectCost(arch, scenario);
  const latency = projectLatency(arch, scenario);
  const ceiling = projectCeiling(arch);
  const tier = headcountTierForMau(scenario.loadMau);
  const eng = headcountAtTier(arch, tier);

  const overBudget = latency.p95Ms > scenario.latencyBudgetMs;
  const overCeiling =
    scenario.costCeilingInr != null && cost.totalInr > scenario.costCeilingInr;

  // Saturation: 0 = plenty of room, 100 = at ceiling
  const saturation = ceiling.maxSustainableMau > 0
    ? Math.min(100, Math.round((scenario.loadMau / ceiling.maxSustainableMau) * 100))
    : 0;

  return (
    <motion.div
      layout
      className={cn(
        "relative rounded-lg border bg-[hsl(var(--card))] p-3.5 transition-colors",
        isCheapest
          ? "border-[hsl(var(--accent))]/40 shadow-[0_0_0_1px_hsl(var(--accent)/0.15)]"
          : "border-[hsl(var(--line))]",
      )}
    >
      {/* Header: label + winner badges */}
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-medium text-[13px] tracking-tight truncate">
          {variant.label}
        </h3>
        <div className="flex items-center gap-1 shrink-0">
          {isCheapest && (
            <span
              className="ms text-[14px] text-[hsl(var(--accent-ink))]"
              title="Cheapest at this scenario"
              aria-label="Cheapest"
            >
              payments
            </span>
          )}
          {isLowestOps && (
            <span
              className="ms text-[14px] text-[hsl(var(--ink-2))]"
              title="Lowest ops burden"
              aria-label="Lowest ops"
            >
              build
            </span>
          )}
          {isFastest && (
            <span
              className="ms text-[14px] text-[hsl(var(--ink-2))]"
              title="Fastest to ship"
              aria-label="Fastest"
            >
              rocket_launch
            </span>
          )}
        </div>
      </div>

      {/* Cost — primary number */}
      <div className="mt-2.5 flex items-baseline gap-1.5">
        <span className="text-[11px] text-[hsl(var(--ink-3))]">₹</span>
        <LiveCounter
          to={cost.totalInr}
          duration={0.6}
          decimals={0}
          className={cn(
            "display-tight text-[26px] leading-none tracking-[-0.02em]",
            overCeiling ? "text-[hsl(var(--bad))]" : "text-[hsl(var(--ink))]",
          )}
        />
        <span className="text-[11px] text-[hsl(var(--ink-3))] ml-0.5">/mo</span>
      </div>

      {/* Secondary stats: latency · saturation · headcount */}
      <dl className="mt-3 grid grid-cols-3 gap-2 text-[11px]">
        <ScoreCell
          label="p95"
          value={
            <LiveCounter
              to={latency.p95Ms}
              duration={0.55}
              decimals={0}
              suffix="ms"
              className={cn(
                "tabular-nums",
                overBudget ? "text-[hsl(var(--bad))]" : "text-[hsl(var(--ink))]",
              )}
            />
          }
        />
        <ScoreCell
          label="Used"
          value={
            <span className="tabular-nums text-[hsl(var(--ink))]">
              <LiveCounter to={saturation} duration={0.5} suffix="%" />
            </span>
          }
        />
        <ScoreCell
          label="Eng"
          value={
            <span className="tabular-nums text-[hsl(var(--ink))]">
              <LiveCounter to={eng} duration={0.5} />
            </span>
          }
        />
      </dl>

      {/* Saturation meter */}
      <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-[hsl(var(--paper-2))]">
        <motion.div
          className={cn(
            "h-full rounded-full",
            saturation >= 90
              ? "bg-[hsl(var(--bad))]"
              : saturation >= 70
              ? "bg-[hsl(var(--warn))]"
              : "bg-[hsl(var(--accent))]",
          )}
          initial={false}
          animate={{ width: `${Math.max(2, saturation)}%` }}
          transition={{ duration: 0.6, ease: EASE_OUT_EXPO }}
        />
      </div>

      {/* Caption */}
      <div className="mt-2 flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-[hsl(var(--ink-3))]">
        <span>tier · {tierForMau(scenario.loadMau)}</span>
        {ceiling.saturatingComponentName && (
          <span
            className="truncate max-w-[55%]"
            title={`First to saturate: ${ceiling.saturatingComponentName}`}
          >
            bn · {ceiling.saturatingComponentName}
          </span>
        )}
      </div>

      {overCeiling && (
        <p className="mt-2 text-[11px] text-[hsl(var(--bad))]">
          over ceiling by ₹{formatInr(cost.totalInr - scenario.costCeilingInr!)}/mo
        </p>
      )}
    </motion.div>
  );
}

function ScoreCell({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="font-mono text-[9px] uppercase tracking-[0.14em] text-[hsl(var(--ink-3))]">
        {label}
      </dt>
      <dd className="mt-0.5 text-[12px]">{value}</dd>
    </div>
  );
}
