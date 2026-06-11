"use client";

/**
 * MetricMatrix — the dashboard's central comparison table.
 *
 * Rows = metrics (cost, p95, saturation, headcount, managed%, lock-in,
 * attack surface, components, monthly requests). Columns = variants.
 * Each cell shows the value + a small horizontal bar that visualises
 * the variant's position vs the others. Winning value per row gets a
 * subtle accent ring.
 *
 * Every numeric cell renders through `LiveCounter` so the entire grid
 * repaints whenever scenario state changes — the core fix for "scenario
 * changes feel invisible".
 *
 * Works for every "Compare across" dimension because the metric
 * definitions are arch-agnostic; the column header just reads
 * `variant.label`.
 */

import { useMemo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { LiveCounter } from "./LiveCounter";
import {
  projectCost,
  projectLatency,
  projectCeiling,
  estimatedMonthlyRequests,
  costPer1MRequests,
} from "@/lib/studies/scenario";
import type { Scenario } from "@/lib/studies/scenario";
import {
  lockInScore,
  opsScore,
  attackSurface,
  managedFraction,
  headcountAtTier,
  formatInr,
} from "@/lib/studies/insights";
import type { Architecture } from "@/types/architecture";
import { useCockpit } from "./state";
import type { LensId } from "./state";
import type { CockpitVariant } from "./StudyCockpit";
import { formatCostFromInr, costFromInrValue, costSymbol } from "@/lib/geo/cost";
import { useRegion } from "@/components/billing/RegionalPrice";
import type { Region } from "@/lib/geo/region";

interface ComputedMetrics {
  totalCostInr: number;
  per1MInr: number;
  p95Ms: number;
  overBudget: boolean;
  saturationPct: number;     // 0..100
  ceilingMau: number;
  bottleneck: string | null;
  eng: number;
  managedPct: number;        // 0..100
  lockInPct: number;         // 0..100, lower = less locked
  attackCount: number;
  componentCount: number;
}

function compute(arch: Architecture, scenario: Scenario): ComputedMetrics {
  const cost = projectCost(arch, scenario);
  const latency = projectLatency(arch, scenario);
  const ceiling = projectCeiling(arch);
  const tier = scenario.loadMau < 500_000
    ? "growth" as const
    : scenario.loadMau < 10_000_000
    ? "scale" as const
    : "hyperscale" as const;

  return {
    totalCostInr:  cost.totalInr,
    per1MInr:      costPer1MRequests(cost.totalInr, scenario.loadMau),
    p95Ms:         latency.p95Ms,
    overBudget:    latency.p95Ms > scenario.latencyBudgetMs,
    saturationPct: ceiling.maxSustainableMau > 0
                     ? Math.min(100, Math.round((scenario.loadMau / ceiling.maxSustainableMau) * 100))
                     : 0,
    ceilingMau:    ceiling.maxSustainableMau,
    bottleneck:    ceiling.saturatingComponentName,
    eng:           headcountAtTier(arch, tier),
    managedPct:    Math.round(managedFraction(arch) * 100),
    lockInPct:     Math.round(lockInScore(arch) * 10), // raw 0..10 -> 0..100
    attackCount:   attackSurface(arch),
    componentCount: (arch.components ?? []).length,
  };
}

type Direction = "lower" | "higher";

interface MetricRow {
  id: string;
  label: string;
  /** Optional lens to deep-link into when the row label is clicked. */
  lens?: LensId;
  /** Compact caption shown under the label. */
  caption?: string;
  /** lower=smaller-is-better, higher=bigger-is-better. */
  direction: Direction;
  /** Pull the raw number from computed metrics. */
  read: (m: ComputedMetrics) => number;
  /** Render the cell value. */
  render: (m: ComputedMetrics) => React.ReactNode;
  /** Optional flag — when truthy the cell is rendered in `--bad` tone. */
  warn?: (m: ComputedMetrics) => boolean;
}

function buildRows(region: Region): MetricRow[] {
  return [
  {
    id: "cost",
    label: "Monthly cost",
    lens: "cost",
    caption: region === "INTL" ? "Total $/mo at your load" : "Total ₹/mo at your load",
    direction: "lower",
    read:  (m) => m.totalCostInr,
    render: (m) => (
      <span className="font-mono">
        {costSymbol(region)}<LiveCounter to={costFromInrValue(m.totalCostInr, region)} duration={0.55} className="display-tight text-[15px] tabular-nums" />
      </span>
    ),
  },
  {
    id: "per1m",
    label: "Cost per 1M req",
    lens: "cost",
    caption: "Unit economics",
    direction: "lower",
    read: (m) => m.per1MInr,
    render: (m) => (
      <span className="font-mono">
        {formatCostFromInr(m.per1MInr, region)}
      </span>
    ),
  },
  {
    id: "p95",
    label: "p95 latency",
    lens: "performance",
    caption: "Projected end-to-end",
    direction: "lower",
    read: (m) => m.p95Ms,
    warn: (m) => m.overBudget,
    render: (m) => (
      <span className="font-mono">
        <LiveCounter to={Math.round(m.p95Ms)} duration={0.5} suffix="ms" className="tabular-nums" />
      </span>
    ),
  },
  {
    id: "sat",
    label: "Capacity used",
    lens: "scale",
    caption: "% of ceiling at load",
    direction: "lower",
    read: (m) => m.saturationPct,
    warn: (m) => m.saturationPct >= 90,
    render: (m) => (
      <LiveCounter to={m.saturationPct} duration={0.5} suffix="%" className="font-mono tabular-nums" />
    ),
  },
  {
    id: "eng",
    label: "Engineers",
    lens: "ops",
    caption: "Day-2 headcount",
    direction: "lower",
    read: (m) => m.eng,
    render: (m) => (
      <LiveCounter to={m.eng} duration={0.4} className="font-mono tabular-nums" />
    ),
  },
  {
    id: "managed",
    label: "Managed %",
    lens: "ops",
    caption: "Serverless / SaaS share",
    direction: "higher",
    read: (m) => m.managedPct,
    render: (m) => (
      <LiveCounter to={m.managedPct} duration={0.4} suffix="%" className="font-mono tabular-nums" />
    ),
  },
  {
    id: "lockin",
    label: "Lock-in",
    lens: "lockin",
    caption: "0 = portable, 100 = sticky",
    direction: "lower",
    read: (m) => m.lockInPct,
    render: (m) => (
      <LiveCounter to={m.lockInPct} duration={0.4} suffix="" className="font-mono tabular-nums" />
    ),
  },
  {
    id: "attack",
    label: "Attack surface",
    lens: "security",
    caption: "Public-facing components",
    direction: "lower",
    read: (m) => m.attackCount,
    render: (m) => (
      <LiveCounter to={m.attackCount} duration={0.4} className="font-mono tabular-nums" />
    ),
  },
  {
    id: "components",
    label: "Components",
    lens: "scale",
    caption: "Total moving parts",
    direction: "lower",
    read: (m) => m.componentCount,
    render: (m) => (
      <LiveCounter to={m.componentCount} duration={0.4} className="font-mono tabular-nums" />
    ),
  },
  ];
}

interface VariantColumn {
  variantId: string;
  label: string;
  failed: boolean;
  errorMessage?: string;
  metrics: ComputedMetrics | null;
}

export function MetricMatrix({ variants }: { variants: CockpitVariant[] }) {
  const { scenario, setCurrentLens } = useCockpit();
  const region = useRegion();
  const rows = buildRows(region);

  const columns: VariantColumn[] = useMemo(
    () =>
      variants.map((v) => ({
        variantId: v.variantId,
        label: v.label,
        failed: v.failed,
        errorMessage: v.errorMessage,
        metrics: v.failed || !v.architecture ? null : compute(v.architecture, scenario),
      })),
    [variants, scenario],
  );

  const liveCols = columns.filter((c) => c.metrics);

  return (
    <div className="rounded-lg border border-[hsl(var(--line))] bg-[hsl(var(--card))] overflow-hidden">
      {/* Header strip */}
      <div
        className="grid gap-px bg-[hsl(var(--line))]"
        style={{ gridTemplateColumns: `220px repeat(${columns.length}, 1fr)` }}
      >
        <div className="bg-[hsl(var(--paper-2))]/70 px-3 py-2.5">
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[hsl(var(--ink-3))]">
            Metric
          </span>
        </div>
        {columns.map((c) => (
          <div
            key={c.variantId}
            className="bg-[hsl(var(--paper-2))]/70 px-3 py-2.5 flex items-center justify-between gap-2"
          >
            <span className="font-medium text-[13px] truncate">{c.label}</span>
            {c.failed && (
              <span className="font-mono text-[10px] uppercase tracking-wider text-[hsl(var(--bad))] shrink-0">
                failed
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Body rows */}
      <div className="divide-y divide-[hsl(var(--line))]">
        {rows.map((row) => {
          const values = liveCols.map((c) => row.read(c.metrics!));
          const winner = winningValue(values, row.direction);
          const range = rangeOf(values);

          return (
            <div
              key={row.id}
              className="grid gap-px bg-[hsl(var(--line))] hover:bg-[hsl(var(--paper-2))]/30 transition-colors"
              style={{ gridTemplateColumns: `220px repeat(${columns.length}, 1fr)` }}
            >
              {/* Row label */}
              <div className="bg-[hsl(var(--card))] px-3 py-2.5">
                <button
                  type="button"
                  onClick={() => row.lens && setCurrentLens(row.lens)}
                  className={cn(
                    "text-left group/label w-full",
                    row.lens && "cursor-pointer",
                  )}
                  title={row.lens ? `Drill into ${row.label}` : undefined}
                >
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-[12.5px] font-medium text-[hsl(var(--ink))]">
                      {row.label}
                    </span>
                    {row.lens && (
                      <span
                        className="ms text-[11px] text-[hsl(var(--ink-3))]/0 group-hover/label:text-[hsl(var(--ink-3))] transition-colors"
                        aria-hidden
                      >
                        chevron_right
                      </span>
                    )}
                  </div>
                  {row.caption && (
                    <p className="text-[10.5px] text-[hsl(var(--ink-3))]/90 mt-0.5 leading-snug">
                      {row.caption}
                    </p>
                  )}
                </button>
              </div>

              {/* Variant cells */}
              {columns.map((col) => {
                if (!col.metrics) {
                  return (
                    <div
                      key={col.variantId}
                      className="bg-[hsl(var(--card))] px-3 py-2.5 flex items-center"
                    >
                      <span className="text-[12px] text-[hsl(var(--ink-3))]/60">—</span>
                    </div>
                  );
                }
                const value = row.read(col.metrics);
                const isWinner = value === winner && liveCols.length > 1;
                const isWarn = row.warn?.(col.metrics) ?? false;
                const barPct = barPercent(value, range, row.direction);

                return (
                  <div
                    key={col.variantId}
                    className="bg-[hsl(var(--card))] px-3 py-2.5 flex flex-col gap-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={cn(
                          "text-[13px]",
                          isWarn ? "text-[hsl(var(--bad))]" : "text-[hsl(var(--ink))]",
                        )}
                      >
                        {row.render(col.metrics)}
                      </span>
                      {isWinner && (
                        <span
                          className="font-mono text-[9px] uppercase tracking-wider text-[hsl(var(--ink-2))] shrink-0"
                          title="Best on this row"
                        >
                          best
                        </span>
                      )}
                    </div>
                    {/* Relative bar */}
                    <div className="h-[3px] w-full rounded-full bg-[hsl(var(--paper-2))] overflow-hidden">
                      <motion.div
                        className={cn(
                          "h-full rounded-full",
                          isWarn
                            ? "bg-[hsl(var(--bad))]"
                            : isWinner
                            ? "bg-[hsl(var(--ink))]"
                            : "bg-[hsl(var(--ink-3))]/40",
                        )}
                        initial={false}
                        animate={{ width: `${barPct}%` }}
                        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Bottleneck strip */}
      <div
        className="grid gap-px bg-[hsl(var(--line))] border-t border-[hsl(var(--line))]"
        style={{ gridTemplateColumns: `220px repeat(${columns.length}, 1fr)` }}
      >
        <div className="bg-[hsl(var(--paper-2))]/40 px-3 py-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[hsl(var(--ink-3))]">
            First to saturate
          </span>
        </div>
        {columns.map((c) => (
          <div key={c.variantId} className="bg-[hsl(var(--paper-2))]/40 px-3 py-2 truncate">
            <span className="text-[11px] text-[hsl(var(--ink-2))]">
              {c.metrics?.bottleneck ?? (c.failed ? c.errorMessage?.slice(0, 40) ?? "failed" : "—")}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ────────────────── helpers ────────────────── */

function winningValue(values: number[], dir: Direction): number | undefined {
  if (!values.length) return undefined;
  return dir === "lower" ? Math.min(...values) : Math.max(...values);
}

function rangeOf(values: number[]): { min: number; max: number } {
  if (!values.length) return { min: 0, max: 0 };
  return { min: Math.min(...values), max: Math.max(...values) };
}

/**
 * Map a value to a 0..100 bar percent. For "lower is better" we invert
 * so the best (smallest) value gets the longest bar — readers scan for
 * length and length should mean "good".
 */
function barPercent(
  value: number,
  range: { min: number; max: number },
  dir: Direction,
): number {
  const span = range.max - range.min;
  if (span <= 0) return 100;
  const t = (value - range.min) / span; // 0..1, 0 = smallest
  const score = dir === "lower" ? 1 - t : t;
  return Math.max(6, Math.round(score * 100));
}

// Re-export to silence unused import lint if helpers change later.
export const __helpers = { formatInr, estimatedMonthlyRequests };
