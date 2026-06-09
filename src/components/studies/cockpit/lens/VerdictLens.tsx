"use client";

/**
 * Verdict lens — the synthesis screen. Shows auto-generated winner chips
 * for every axis ("cheapest at this load", "lowest ops", "fastest to
 * ship", "best residency", "lowest lock-in", "smallest attack surface")
 * plus compliance gap callouts.
 *
 * Each chip has a "why" link that opens the explain drawer with the
 * underlying numbers — no extra fetch, all derived from the same
 * `computeVerdict` bundle.
 *
 * Read-only, pure presentation — every prop comes from the cockpit
 * context and the architecture payloads the server shell already
 * validated.
 */

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { computeVerdict, formatInr, type WinnerOrNull, type ComplianceGap } from "@/lib/studies/insights";
import { useCockpit } from "../state";
import { MiniChip, StatBlock } from "./primitives";
import type { CockpitVariant } from "../StudyCockpit";

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

export function VerdictLens({ variants }: { variants: CockpitVariant[] }) {
  const { scenario, openDrawer } = useCockpit();
  const liveVariants = variants
    .filter((v) => !v.failed)
    .map((v) => ({ variantId: v.variantId, label: v.label, arch: v.architecture }));

  const verdict = computeVerdict(liveVariants, scenario, {
    // Residency hint isn't asked of the user yet — Phase 9 will surface
    // it from the brief's "Constraints" block. For now we infer from the
    // first variant's primary region.
    residencyHint: inferRegionHint(liveVariants[0]?.arch?.deployment?.primary_region),
    regimes: ["dpdp", "gdpr", "hipaa", "pci", "soc2"],
  });

  const chips: Array<{
    label: string;
    winner: WinnerOrNull;
    rationale: () => ReactNode;
  }> = [
    {
      label: "Cheapest at your load",
      winner: verdict.cheapest,
      rationale: () => (
        <p>
          Projected total cost at the current scenario uses each variant&apos;s
          {" "}<code className="font-mono text-[12px]">scale_profiles</code> + 
          {" "}<code className="font-mono text-[12px]">cost_breakdown</code>, interpolated to your MAU.
          {verdict.cheapest && verdict.cheapest.marginOverNext > 0 && (
            <> Margin over the next variant: <strong>₹{formatInr(verdict.cheapest.marginOverNext)}/mo</strong>.</>
          )}
        </p>
      ),
    },
    {
      label: "Lowest ops burden",
      winner: verdict.lowestOps,
      rationale: () => (
        <p>
          Ops score blends managed-service density, observability maturity, and
          automated rollback. Lower self-run footprint + more SLOs + canary deploys
          → higher score.
        </p>
      ),
    },
    {
      label: "Fastest to ship",
      winner: verdict.fastestToShip,
      rationale: () => (
        <p>
          Penalises Kubernetes + VMs + custom infra; rewards serverless and managed
          runtimes. Fewer components also help — every box is one more thing to
          wire up.
        </p>
      ),
    },
    {
      label: "Smallest attack surface",
      winner: verdict.attackSurface,
      rationale: () => (
        <p>
          Counts public-facing components (frontend, API gateway, CDN, edge,
          auth) plus anything whose responsibility explicitly mentions public
          ingress.
        </p>
      ),
    },
    {
      label: "Lowest lock-in",
      winner: verdict.lowestLockIn,
      rationale: () => (
        <p>
          Lock-in score weighs proprietary managed services (Spanner, DynamoDB,
          Cosmos DB, BigQuery, etc.) and discounts the use of open-source
          equivalents.
        </p>
      ),
    },
  ];

  if (verdict.bestResidency) {
    chips.push({
      label: "Best regional fit",
      winner: verdict.bestResidency,
      rationale: () => (
        <p>
          Compares each variant&apos;s primary + additional regions against your
          residency hint inferred from the architecture deployment block.
        </p>
      ),
    });
  }

  const hasAnyWinner = chips.some((c) => c.winner);

  return (
    <div className="flex flex-col gap-6">
      {!hasAnyWinner ? (
        <EmptyVerdict />
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {chips.map((c, i) => (
            <li key={c.label}>
              <WinnerChip
                title={c.label}
                winner={c.winner}
                delay={0.04 * i}
                onWhy={() =>
                  c.winner &&
                  openDrawer({
                    title: c.label,
                    caption: c.winner.reason,
                    body: <DrawerBody rationale={c.rationale()} verdict={verdict} field={c.label} />,
                  })
                }
              />
            </li>
          ))}
        </ul>
      )}

      {verdict.gaps.length > 0 && (
        <ComplianceCallout gaps={verdict.gaps} onOpen={(gap) =>
          openDrawer({
            title: `${gap.regime} gap`,
            caption: `${gap.label} · ${gap.gap}`,
            body: <p className="text-[13px] text-[hsl(var(--ink-2))] leading-relaxed">
              {gap.label} doesn&apos;t reference the controls typical of {gap.regime}.
              That doesn&apos;t mean it&apos;s impossible — only that the architect
              should explicitly add the missing requirement to the brief and re-run.
            </p>,
          })
        }/>
      )}
    </div>
  );
}

function WinnerChip({
  title,
  winner,
  onWhy,
  delay,
}: {
  title: string;
  winner: WinnerOrNull;
  onWhy: () => void;
  delay: number;
}) {
  if (!winner) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: EASE_OUT_EXPO, delay }}
        className="rounded-lg border border-[hsl(var(--line))] bg-[hsl(var(--card))] p-3 opacity-60"
      >
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[hsl(var(--ink-3))]">
            {title}
          </span>
          <MiniChip>n/a</MiniChip>
        </div>
        <p className="mt-1.5 text-[12px] text-[hsl(var(--ink-3))]">
          Not enough live variants to compare.
        </p>
      </motion.div>
    );
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: EASE_OUT_EXPO, delay }}
      className="rounded-lg border border-[hsl(var(--accent))]/30 bg-[hsl(var(--card))] p-3 shadow-[0_1px_0_0_hsl(var(--line))]"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[hsl(var(--ink-3))]">
          {title}
        </span>
        <MiniChip tone="accent">{winner.label}</MiniChip>
      </div>
      <p className="mt-1.5 text-[13px] text-[hsl(var(--ink))] leading-snug">
        {winner.reason}
      </p>
      <button
        type="button"
        onClick={onWhy}
        className="mt-2 inline-flex items-center gap-1 text-[11px] font-mono uppercase tracking-wider text-[hsl(var(--ink-3))] hover:text-[hsl(var(--ink))] transition-colors"
      >
        why
        <span className="ms text-[14px]" aria-hidden>arrow_forward</span>
      </button>
    </motion.div>
  );
}

function DrawerBody({
  rationale,
  verdict,
  field,
}: {
  rationale: ReactNode;
  verdict: ReturnType<typeof computeVerdict>;
  field: string;
}) {
  void field; // referenced for future per-field drawer expansion
  return (
    <div className="flex flex-col gap-3 text-[13px] text-[hsl(var(--ink-2))] leading-relaxed">
      <div className="rounded-md border border-[hsl(var(--line))] bg-[hsl(var(--paper-3))]/30 p-3">
        {rationale}
      </div>
      {verdict.gaps.length > 0 && (
        <p className="text-[12px] text-[hsl(var(--ink-3))]">
          {verdict.gaps.length} compliance gap{verdict.gaps.length === 1 ? "" : "s"}
          {" "}across all variants — see the security lens.
        </p>
      )}
    </div>
  );
}

function ComplianceCallout({
  gaps,
  onOpen,
}: {
  gaps: ComplianceGap[];
  onOpen: (gap: ComplianceGap) => void;
}) {
  const grouped = new Map<string, ComplianceGap[]>();
  for (const g of gaps) {
    const key = `${g.label}::${g.regime}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(g);
  }
  return (
    <section className="rounded-lg border border-[hsl(var(--warn))]/30 bg-[hsl(var(--warn))]/5 p-4">
      <div className="flex items-center gap-2">
        <StatBlock
          label="Compliance gaps"
          value={
            <span className="text-[hsl(var(--warn))]">{grouped.size}</span>
          }
          caption="Across all variants — open each to see what to add to the brief."
          tone="warn"
        />
      </div>
      <ul className="mt-3 flex flex-wrap gap-2">
        {Array.from(grouped.entries()).map(([key, group]) => {
          const g = group[0];
          return (
            <li key={key}>
              <button
                type="button"
                onClick={() => onOpen(g)}
                className="inline-flex items-center gap-1 rounded-full border border-[hsl(var(--warn))]/30 bg-[hsl(var(--card))] px-2 py-0.5 text-[11px] font-mono uppercase tracking-[0.08em] text-[hsl(var(--warn))] hover:bg-[hsl(var(--warn))]/10 transition-colors"
              >
                {g.label} · {g.regime}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function EmptyVerdict() {
  return (
    <div className="rounded-lg border border-[hsl(var(--line))] bg-[hsl(var(--card))] p-8 text-center">
      <span className="ms text-[28px] text-[hsl(var(--ink-3))]" aria-hidden>
        scoreboard
      </span>
      <p className="mt-3 text-[13px] text-[hsl(var(--ink-2))]">
        At least two completed variants are needed to compute a verdict.
      </p>
    </div>
  );
}

function inferRegionHint(primary: string | undefined): string | undefined {
  if (!primary) return undefined;
  const p = primary.toLowerCase();
  if (p.includes("asia-south") || p.includes("india")) return "asia-south";
  if (p.includes("europe") || p.startsWith("eu-"))     return "eu";
  if (p.includes("us-") || p.includes("america"))      return "us";
  return undefined;
}
