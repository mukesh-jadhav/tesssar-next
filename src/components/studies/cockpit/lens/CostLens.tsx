"use client";

/**
 * Cost lens — three stacked bars (one per variant) showing the
 * projected monthly spend split across compute / data / network /
 * observability / ML / other categories.
 *
 * Re-projects on every scenario change via `projectCost`. Numbers also
 * surface the cost per 1M requests, the DR overhead when region-failure
 * sim is on, and a colour flip when the variant breaches the user's
 * optional ₹/mo ceiling.
 *
 * All computation is pure — no fetch, no I/O.
 */

import { motion } from "framer-motion";
import { categoryLabel, projectCost, costPer1MRequests, type CostCategory } from "@/lib/studies/scenario";
import { formatCostFromInr } from "@/lib/geo/cost";
import { useRegion } from "@/components/billing/RegionalPrice";
import type { Region } from "@/lib/geo/region";
import { useCockpit } from "../state";
import { LensColumns } from "../LensColumns";
import { FlashRemount, MiniChip, StackedBar, StatBlock } from "./primitives";
import type { CockpitVariant } from "../StudyCockpit";

const CATEGORY_CLASS: Record<CostCategory, string> = {
  compute: "bg-[hsl(var(--accent))]",
  data:    "bg-emerald-500",
  network: "bg-sky-500",
  obs:     "bg-violet-500",
  ml:      "bg-fuchsia-500",
  other:   "bg-[hsl(var(--ink-3))]",
};

const CATEGORY_ORDER: CostCategory[] = [
  "compute", "data", "network", "obs", "ml", "other",
];

export function CostLens({ variants }: { variants: CockpitVariant[] }) {
  const { scenario, openDrawer } = useCockpit();
  const region = useRegion();

  return (
    <LensColumns
      variants={variants}
      renderCell={(v) => {
        if (!v.architecture) return null;
        const cost = projectCost(v.architecture, scenario);
        const per1M = costPer1MRequests(cost.totalInr, scenario.loadMau);
        const segments = CATEGORY_ORDER.map((k) => ({
          key: k,
          label: categoryLabel(k),
          value: cost.byCategory[k] ?? 0,
          className: CATEGORY_CLASS[k],
        }));

        return (
          <div className="flex flex-col gap-4">
            <StatBlock
              label="Total / month"
              value={
                <FlashRemount keyValue={Math.round(cost.totalInr)}>
                  {formatCostFromInr(cost.totalInr, region)}
                </FlashRemount>
              }
              caption={
                <>
                  <span>{cost.totalInr > 0 ? `${formatCostFromInr(per1M, region)} / 1M req` : "no data"}</span>
                  {cost.overCeiling && (
                    <span className="ml-2 inline-flex items-center gap-1 text-[hsl(var(--bad))]">
                      <span className="ms text-[12px]" aria-hidden>warning</span>
                      over ceiling
                    </span>
                  )}
                </>
              }
              tone={cost.overCeiling ? "bad" : "ink"}
            />

            <StackedBar segments={segments} height={16} />

            <ul className="grid grid-cols-2 gap-x-3 gap-y-1.5">
              {segments.map((s) => {
                const pct = cost.totalInr > 0 ? Math.round((s.value / cost.totalInr) * 100) : 0;
                return (
                  <li key={s.key} className="flex items-center justify-between gap-2 text-[12px]">
                    <span className="flex items-center gap-2 min-w-0">
                      <span className={`size-2 rounded-full ${s.className} shrink-0`} aria-hidden />
                      <span className="truncate text-[hsl(var(--ink-2))]">{s.label}</span>
                    </span>
                    <span className="font-mono tabular-nums text-[11px] text-[hsl(var(--ink-3))]">
                      {pct}%
                    </span>
                  </li>
                );
              })}
            </ul>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              {scenario.regionFailureSim && cost.drOverheadInr > 0 && (
                <MiniChip tone="warn">+{formatCostFromInr(cost.drOverheadInr, region)}/mo DR</MiniChip>
              )}
              {cost.totalInr === 0 ? (
                <MiniChip>no scale_profiles</MiniChip>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    openDrawer({
                      title: `${v.label} cost breakdown`,
                      caption: `at ${formatMauLabel(scenario.loadMau)} MAU · budget ${scenario.latencyBudgetMs}ms`,
                      body: <CostDrawerBody variant={v} segments={segments} per1M={per1M} drOverhead={cost.drOverheadInr} region={region} />,
                    })
                  }
                  className="inline-flex items-center gap-1 text-[11px] font-mono uppercase tracking-wider text-[hsl(var(--ink-3))] hover:text-[hsl(var(--ink))] transition-colors"
                >
                  explain
                  <span className="ms text-[14px]" aria-hidden>arrow_forward</span>
                </button>
              )}
            </div>
          </div>
        );
      }}
    />
  );
}

function CostDrawerBody({
  variant,
  segments,
  per1M,
  drOverhead,
  region,
}: {
  variant: CockpitVariant;
  segments: { key: string; label: string; value: number; className: string }[];
  per1M: number;
  drOverhead: number;
  region: Region;
}) {
  return (
    <div className="flex flex-col gap-4 text-[13px] text-[hsl(var(--ink-2))]">
      <p>
        Numbers come from <code className="font-mono text-[12px]">scale_profiles</code> and
        {" "}<code className="font-mono text-[12px]">cost_breakdown</code> in the
        {" "}<strong>{variant.label}</strong> variant — picked by closest tier and
        interpolated in log-space across tiers.
      </p>
      <ul className="flex flex-col gap-2">
        {segments
          .filter((s) => s.value > 0)
          .sort((a, b) => b.value - a.value)
          .map((s) => (
            <li key={s.key} className="flex items-center justify-between gap-3 rounded-lg border border-[hsl(var(--line))] bg-[hsl(var(--paper-3))]/30 px-3 py-2">
              <span className="flex items-center gap-2">
                <motion.span
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className={`size-2.5 rounded-full ${s.className}`}
                  aria-hidden
                />
                <span>{s.label}</span>
              </span>
              <span className="font-mono tabular-nums text-[13px] text-[hsl(var(--ink))]">
                {formatCostFromInr(s.value, region)}
              </span>
            </li>
          ))}
      </ul>
      <p className="text-[12px] text-[hsl(var(--ink-3))]">
        Per-million requests: <strong>{formatCostFromInr(per1M, region)}</strong>
        {drOverhead > 0 && (
          <> · DR overhead included: <strong>{formatCostFromInr(drOverhead, region)}/mo</strong></>
        )}
      </p>
    </div>
  );
}

function formatMauLabel(mau: number): string {
  if (mau >= 1_000_000) return `${(mau / 1_000_000).toFixed(1)}M`;
  if (mau >= 1_000)     return `${(mau / 1_000).toFixed(0)}K`;
  return `${mau}`;
}
