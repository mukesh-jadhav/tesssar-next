"use client";

/**
 * Ops burden lens — derived score (0–100) per variant + headcount estimate
 * at growth / scale / hyperscale tiers + a list of self-run components.
 * Higher score = LOWER ops burden (i.e. lower-touch architecture).
 */

import {
  opsScore,
  headcountAtTier,
  managedFraction,
  selfRunComponents,
} from "@/lib/studies/insights";
import { LensColumns } from "../LensColumns";
import { useCockpit } from "../state";
import { MiniChip, ScoreMeter, StatBlock } from "./primitives";
import type { CockpitVariant } from "../StudyCockpit";

export function OpsLens({ variants }: { variants: CockpitVariant[] }) {
  const { openDrawer } = useCockpit();

  return (
    <LensColumns
      variants={variants}
      renderCell={(v) => {
        const arch = v.architecture;
        if (!arch) return null;
        const score = opsScore(arch);
        const managedPct = Math.round(managedFraction(arch) * 100);
        const selfRun = selfRunComponents(arch);
        const growth = headcountAtTier(arch, "growth");
        const scale = headcountAtTier(arch, "scale");
        const hyper = headcountAtTier(arch, "hyperscale");
        const tone = score >= 70 ? "accent" : score >= 45 ? "warn" : "bad";

        return (
          <div className="flex flex-col gap-4">
            <StatBlock
              label="Ops score"
              value={`${score} / 100`}
              caption={
                score >= 70 ? "Low-touch — mostly managed."
                : score >= 45 ? "Mixed — a few day-2 burdens."
                : "Heavy — significant self-run footprint."
              }
              tone={tone}
            />

            <ScoreMeter value={score} max={100} tone={tone} caption={`${managedPct}% managed services`} />

            {/* Headcount per tier */}
            <div className="rounded-xl border border-[hsl(var(--line))] bg-[hsl(var(--paper-3))]/30 p-3">
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[hsl(var(--ink-3))]">
                Engineers needed
              </span>
              <ul className="mt-2 grid grid-cols-3 gap-2 text-center">
                <HeadcountTier label="Growth" value={growth} />
                <HeadcountTier label="Scale" value={scale} />
                <HeadcountTier label="Hyper" value={hyper} />
              </ul>
            </div>

            {/* Self-run list */}
            <div className="flex flex-col gap-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[hsl(var(--ink-3))]">
                Self-run components
              </span>
              {selfRun.length === 0 ? (
                <p className="text-[12px] text-[hsl(var(--ink-3))]">None — everything is managed.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {selfRun.map((name) => (
                    <MiniChip key={name} tone="warn">
                      {name}
                    </MiniChip>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end pt-1">
              <button
                type="button"
                onClick={() =>
                  openDrawer({
                    title: `${v.label} · ops burden`,
                    caption: `${score}/100 · ${managedPct}% managed`,
                    body: (
                      <div className="flex flex-col gap-3 text-[13px] text-[hsl(var(--ink-2))] leading-relaxed">
                        <p>
                          Score blends managed-service density, SLO + alert maturity,
                          and rollout/rollback automation. Self-managed Kubernetes,
                          VMs, and dedicated DBs drag it down; canary deploys + IaC
                          push it up.
                        </p>
                        <p>
                          <strong>{growth}</strong> engineers at growth,
                          {" "}<strong>{scale}</strong> at scale,
                          {" "}<strong>{hyper}</strong> at hyperscale.
                          Coarse — meant for directional comparison, not your hiring plan.
                        </p>
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

function HeadcountTier({ label, value }: { label: string; value: number }) {
  return (
    <li className="flex flex-col items-center gap-0.5 rounded-lg border border-[hsl(var(--line))] bg-[hsl(var(--card))] py-2">
      <span className="text-[18px] tabular-nums font-medium text-[hsl(var(--ink))]">{value}</span>
      <span className="text-[10px] font-mono uppercase tracking-wider text-[hsl(var(--ink-3))]">
        {label}
      </span>
    </li>
  );
}
