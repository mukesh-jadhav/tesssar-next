"use client";

/**
 * Security lens — compliance × variant matrix + attack-surface count per
 * variant. Each cell is computed from `complianceGaps` on the
 * architecture's security controls + deployment region; missing controls
 * become a "warning" cell with a one-line note in the explain drawer.
 */

import { motion } from "framer-motion";
import {
  attackSurface,
  complianceGaps,
  type ComplianceGap,
} from "@/lib/studies/insights";
import { VariantHeader } from "../VariantHeader";
import { useCockpit } from "../state";
import { MatrixCell, StatBlock } from "./primitives";
import type { CockpitVariant } from "../StudyCockpit";

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

const REGIMES = ["dpdp", "gdpr", "hipaa", "pci", "soc2"] as const;
type Regime = (typeof REGIMES)[number];

const REGIME_LABEL: Record<Regime, string> = {
  dpdp:  "DPDP (India)",
  gdpr:  "GDPR (EU)",
  hipaa: "HIPAA",
  pci:   "PCI-DSS",
  soc2:  "SOC 2",
};

export function SecurityLens({ variants }: { variants: CockpitVariant[] }) {
  const { openDrawer } = useCockpit();
  const live = variants.filter((v) => !v.failed);

  // Pre-compute all gaps once — `complianceGaps` is pure.
  const allGaps = complianceGaps(
    live.map((v) => ({ variantId: v.variantId, label: v.label, arch: v.architecture })),
    REGIMES,
  );

  const gapMap = new Map<string, ComplianceGap[]>();
  for (const g of allGaps) {
    const key = `${g.variantId}::${g.regime.toLowerCase()}`;
    if (!gapMap.has(key)) gapMap.set(key, []);
    gapMap.get(key)!.push(g);
  }

  function cellStatus(variantId: string, regime: Regime): "ok" | "partial" | "missing" {
    const gaps = gapMap.get(`${variantId}::${regime}`) ?? [];
    if (gaps.length === 0) return "ok";
    if (gaps.length >= 3)  return "missing";
    return "partial";
  }

  function cellNote(variantId: string, regime: Regime): string {
    const gaps = gapMap.get(`${variantId}::${regime}`) ?? [];
    if (gaps.length === 0) return "all required controls referenced";
    return `${gaps.length} gap${gaps.length === 1 ? "" : "s"}`;
  }

  if (live.length === 0) {
    return (
      <EmptyMatrix message="At least one completed variant is needed for the security matrix." />
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Compliance matrix */}
      <div className="overflow-x-auto scrollbar-thin rounded-2xl border border-[hsl(var(--line))] bg-[hsl(var(--card))]">
        <table className="w-full min-w-[640px] border-separate border-spacing-0 text-[13px]">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-[hsl(var(--card))] px-3 py-2 text-left text-[10px] font-mono uppercase tracking-[0.14em] text-[hsl(var(--ink-3))] border-b border-[hsl(var(--line))]">
                Regime
              </th>
              {live.map((v) => (
                <th
                  key={v.variantId}
                  className="px-3 py-2 text-left border-b border-[hsl(var(--line))] min-w-[200px]"
                >
                  <VariantHeader label={v.label} runId={v.runId} variantId={v.variantId} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {REGIMES.map((regime, i) => (
              <tr key={regime} className="hover:bg-[hsl(var(--paper-3))]/30 transition-colors">
                <td className="sticky left-0 z-10 bg-[hsl(var(--card))] px-3 py-2 text-[12px] uppercase tracking-wider font-mono text-[hsl(var(--ink-2))] border-b border-[hsl(var(--line))]">
                  {REGIME_LABEL[regime]}
                </td>
                {live.map((v) => {
                  const status = cellStatus(v.variantId, regime);
                  const note = cellNote(v.variantId, regime);
                  const gaps = gapMap.get(`${v.variantId}::${regime}`) ?? [];
                  return (
                    <motion.td
                      key={v.variantId}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{
                        duration: 0.25,
                        ease: EASE_OUT_EXPO,
                        delay: 0.03 * i,
                      }}
                      className="px-3 py-2 border-b border-[hsl(var(--line))]"
                    >
                      <MatrixCell
                        status={status}
                        note={note}
                        onClick={
                          gaps.length === 0
                            ? undefined
                            : () =>
                                openDrawer({
                                  title: `${v.label} · ${REGIME_LABEL[regime]}`,
                                  caption: note,
                                  body: <GapsDrawer gaps={gaps} />,
                                })
                        }
                      />
                    </motion.td>
                  );
                })}
              </tr>
            ))}
            {/* Attack-surface row */}
            <tr>
              <td className="sticky left-0 z-10 bg-[hsl(var(--card))] px-3 py-2 text-[12px] uppercase tracking-wider font-mono text-[hsl(var(--ink-2))]">
                Attack surface
              </td>
              {live.map((v) => (
                <td key={v.variantId} className="px-3 py-2">
                  <StatBlock
                    label="public eps"
                    value={attackSurface(v.architecture)}
                    caption="frontend + api + cdn + auth + ingress"
                  />
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <p className="text-[11px] text-[hsl(var(--ink-3))]">
        Heuristic. A &quot;partial&quot; or &quot;missing&quot; cell means the
        architecture doesn&apos;t reference the controls typical of that regime
        — re-run the variant with the compliance requirement in the brief to fill
        the gap.
      </p>
    </div>
  );
}

function GapsDrawer({ gaps }: { gaps: ComplianceGap[] }) {
  return (
    <ul className="flex flex-col gap-2 text-[13px] text-[hsl(var(--ink-2))]">
      {gaps.map((g, i) => (
        <li
          key={`${g.regime}-${i}`}
          className="rounded-xl border border-[hsl(var(--line))] bg-[hsl(var(--paper-3))]/30 p-3"
        >
          <span className="ms text-[16px] text-[hsl(var(--warn))]" aria-hidden>warning</span>
          <span className="ml-1">{g.gap}</span>
        </li>
      ))}
    </ul>
  );
}

function EmptyMatrix({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-[hsl(var(--line))] bg-[hsl(var(--card))] p-8 text-center">
      <span className="ms text-[28px] text-[hsl(var(--ink-3))]" aria-hidden>encrypted</span>
      <p className="mt-3 text-[13px] text-[hsl(var(--ink-2))]">{message}</p>
    </div>
  );
}
