"use client";

/**
 * Scale lens — per-tier cost band (startup → hyperscale) for each
 * variant, with the user's current scenario tier highlighted. Below the
 * bars: max sustainable MAU + the component that hits the ceiling first.
 */

import { motion } from "framer-motion";
import type { ScaleProfile, ScaleTier } from "@/types/architecture";
import { SCALE_TIER_META } from "@/types/architecture";
import { projectCeiling } from "@/lib/studies/scenario";
import { formatInr } from "@/lib/studies/insights";
import { LensColumns } from "../LensColumns";
import { useCockpit } from "../state";
import { MiniChip, StatBlock } from "./primitives";
import type { CockpitVariant } from "../StudyCockpit";

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;
const TIER_ORDER: ScaleTier[] = ["startup", "growth", "scale", "hyperscale"];

function tierForMau(mau: number): ScaleTier {
  if (mau < 10_000)     return "startup";
  if (mau < 500_000)    return "growth";
  if (mau < 10_000_000) return "scale";
  return "hyperscale";
}

export function ScaleLens({ variants }: { variants: CockpitVariant[] }) {
  const { scenario, openDrawer } = useCockpit();
  const currentTier = tierForMau(scenario.loadMau);

  return (
    <LensColumns
      variants={variants}
      renderCell={(v) => {
        const arch = v.architecture;
        if (!arch) return null;
        const profiles = arch.scale_profiles ?? [];
        const byTier = new Map<ScaleTier, ScaleProfile>();
        for (const p of profiles) byTier.set(p.tier, p);
        const ceiling = projectCeiling(arch);

        // Normalise high-band cost for visual scale across tiers.
        const allHighs = TIER_ORDER.map((t) => {
          const p = byTier.get(t);
          if (!p) return 0;
          return (p.monthly_cost_inr_low + p.monthly_cost_inr_high) / 2;
        });
        const maxCost = Math.max(0, ...allHighs);

        return (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              {TIER_ORDER.map((t, i) => {
                const p = byTier.get(t);
                const meta = SCALE_TIER_META[t];
                const mid = p ? (p.monthly_cost_inr_low + p.monthly_cost_inr_high) / 2 : 0;
                const pct = maxCost > 0 ? (mid / maxCost) * 100 : 0;
                const isCurrent = t === currentTier;

                return (
                  <div key={t} className="flex items-center gap-2">
                    <span
                      className={
                        "w-[88px] shrink-0 text-[11px] font-mono uppercase tracking-wider " +
                        (isCurrent
                          ? "text-[hsl(var(--accent))]"
                          : "text-[hsl(var(--ink-3))]")
                      }
                    >
                      {meta.label}
                    </span>
                    <div className="flex-1 h-3 bg-[hsl(var(--paper-3))] rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.5, ease: EASE_OUT_EXPO, delay: 0.04 * i }}
                        className={
                          "h-full rounded-full " +
                          (isCurrent
                            ? "bg-[hsl(var(--accent))]"
                            : "bg-[hsl(var(--ink-3))]/60")
                        }
                      />
                    </div>
                    <span className="w-[68px] shrink-0 text-right text-[11px] font-mono tabular-nums text-[hsl(var(--ink-2))]">
                      {mid > 0 ? `₹${formatInr(mid)}` : "—"}
                    </span>
                  </div>
                );
              })}
            </div>

            <StatBlock
              label="Ceiling"
              value={
                ceiling.maxSustainableMau > 0
                  ? formatMau(ceiling.maxSustainableMau)
                  : "—"
              }
              caption={
                ceiling.saturatingComponentName
                  ? `Saturates at ${ceiling.saturatingComponentName}`
                  : "No bottleneck called out"
              }
            />

            <div className="flex items-center justify-between gap-2 pt-1">
              <MiniChip tone={currentTier === "hyperscale" ? "bad" : currentTier === "scale" ? "warn" : "accent"}>
                You are at {SCALE_TIER_META[currentTier].label}
              </MiniChip>
              <button
                type="button"
                onClick={() =>
                  openDrawer({
                    title: `${v.label} · scale profile`,
                    caption: `Current tier: ${SCALE_TIER_META[currentTier].label}`,
                    body: <ScaleDrawer profiles={profiles} currentTier={currentTier} />,
                  })
                }
                className="inline-flex items-center gap-1 text-[11px] font-mono uppercase tracking-wider text-[hsl(var(--ink-3))] hover:text-[hsl(var(--ink))] transition-colors"
              >
                tier detail
                <span className="ms text-[14px]" aria-hidden>arrow_forward</span>
              </button>
            </div>
          </div>
        );
      }}
    />
  );
}

function ScaleDrawer({
  profiles,
  currentTier,
}: {
  profiles: ScaleProfile[];
  currentTier: ScaleTier;
}) {
  return (
    <div className="flex flex-col gap-3 text-[13px] text-[hsl(var(--ink-2))]">
      {profiles.length === 0 && (
        <p className="text-[hsl(var(--ink-3))]">No scale profiles in this variant.</p>
      )}
      {profiles.map((p) => (
        <section
          key={p.tier}
          className={
            "rounded-md border p-3 " +
            (p.tier === currentTier
              ? "border-[hsl(var(--accent))]/40 bg-[hsl(var(--accent-paper))]/40"
              : "border-[hsl(var(--line))] bg-[hsl(var(--paper-3))]/30")
          }
        >
          <div className="flex items-center justify-between">
            <strong className="text-[hsl(var(--ink))]">{SCALE_TIER_META[p.tier].label}</strong>
            <span className="font-mono text-[12px] tabular-nums text-[hsl(var(--ink-2))]">
              ₹{formatInr(p.monthly_cost_inr_low)} – ₹{formatInr(p.monthly_cost_inr_high)} / mo
            </span>
          </div>
          <p className="mt-1 text-[12px] text-[hsl(var(--ink-3))]">
            {p.expected_users} · {p.expected_rps} · {p.storage_estimate}
          </p>
          {p.changes_from_baseline?.length > 0 && (
            <ul className="mt-2 list-inside list-disc text-[12px] text-[hsl(var(--ink-2))]">
              {p.changes_from_baseline.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}

function formatMau(mau: number): string {
  if (mau >= 1_000_000) return `${(mau / 1_000_000).toFixed(1)}M`;
  if (mau >= 1_000)     return `${(mau / 1_000).toFixed(0)}K`;
  return `${mau}`;
}
