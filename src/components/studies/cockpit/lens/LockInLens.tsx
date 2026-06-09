"use client";

/**
 * Lock-in lens — per-variant score (0–10), the top 3 stickiest services,
 * and an estimated replacement time in months. Higher score = harder to
 * leave.
 */

import { lockInScore, topStickyServices, replacementMonths } from "@/lib/studies/insights";
import { LensColumns } from "../LensColumns";
import { useCockpit } from "../state";
import { MiniChip, ScoreMeter, StatBlock } from "./primitives";
import type { CockpitVariant } from "../StudyCockpit";

export function LockInLens({ variants }: { variants: CockpitVariant[] }) {
  const { openDrawer } = useCockpit();

  return (
    <LensColumns
      variants={variants}
      renderCell={(v) => {
        const arch = v.architecture;
        if (!arch) return null;
        const score = lockInScore(arch);
        const sticky = topStickyServices(arch, 3);
        const months = replacementMonths(arch);
        const tone = score >= 7 ? "bad" : score >= 4 ? "warn" : "accent";

        return (
          <div className="flex flex-col gap-4">
            <StatBlock
              label="Lock-in score"
              value={`${score.toFixed(1)} / 10`}
              caption={
                score >= 7 ? "Heavy proprietary footprint."
                : score >= 4 ? "Moderate vendor reliance."
                : "Mostly portable building blocks."
              }
              tone={tone === "accent" ? "accent" : tone === "warn" ? "warn" : "bad"}
            />

            <ScoreMeter value={score} max={10} tone={tone} />

            <div className="flex flex-col gap-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[hsl(var(--ink-3))]">
                Top sticky services
              </span>
              {sticky.length === 0 ? (
                <p className="text-[12px] text-[hsl(var(--ink-3))]">
                  No vendor-specific managed services dominate this stack.
                </p>
              ) : (
                <ul className="flex flex-col gap-1.5">
                  {sticky.map((s) => (
                    <li key={s.componentId} className="flex items-center justify-between gap-2 text-[12px]">
                      <span className="truncate text-[hsl(var(--ink))]">{s.name}</span>
                      <MiniChip tone={s.weight >= 8 ? "bad" : s.weight >= 5 ? "warn" : "ink"}>
                        weight {s.weight}
                      </MiniChip>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex items-center justify-between gap-2 pt-1">
              <span className="text-[11px] text-[hsl(var(--ink-3))]">
                Replace in ~<strong className="text-[hsl(var(--ink))]">{months} mo</strong>
              </span>
              <button
                type="button"
                onClick={() =>
                  openDrawer({
                    title: `${v.label} · lock-in`,
                    caption: `Score ${score.toFixed(1)}/10 · est. ${months} months to replace`,
                    body: (
                      <div className="flex flex-col gap-3 text-[13px] text-[hsl(var(--ink-2))] leading-relaxed">
                        <p>
                          The score is weighted by proprietary vendor services in
                          {" "}<strong>{v.label}</strong>: Spanner, BigQuery, DynamoDB,
                          Cosmos DB, Lambda, Cloud Run, etc. Use of open-source
                          alternatives (Postgres, Kafka, Kubernetes) reduces it.
                        </p>
                        {sticky.length > 0 ? (
                          <ul className="flex flex-col gap-2">
                            {sticky.map((s) => (
                              <li
                                key={s.componentId}
                                className="rounded-xl border border-[hsl(var(--line))] bg-[hsl(var(--paper-3))]/30 p-3"
                              >
                                <div className="flex items-center justify-between">
                                  <strong className="text-[hsl(var(--ink))]">{s.name}</strong>
                                  <MiniChip tone={s.weight >= 8 ? "bad" : s.weight >= 5 ? "warn" : "ink"}>
                                    weight {s.weight}
                                  </MiniChip>
                                </div>
                                <p className="mt-1 text-[12px] text-[hsl(var(--ink-3))]">{s.technology}</p>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p>No vendor lock-in detected.</p>
                        )}
                      </div>
                    ),
                  })
                }
                className="inline-flex items-center gap-1 text-[11px] font-mono uppercase tracking-wider text-[hsl(var(--ink-3))] hover:text-[hsl(var(--ink))] transition-colors"
              >
                explain
                <span className="ms text-[14px]" aria-hidden>arrow_forward</span>
              </button>
            </div>
          </div>
        );
      }}
    />
  );
}
