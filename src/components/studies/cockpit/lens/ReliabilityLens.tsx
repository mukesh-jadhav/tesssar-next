"use client";

/**
 * Reliability lens — failure-mode matrix driven by the arch's `risks` and
 * `applied_patterns`. Rows are stable canonical failure modes; the cell
 * indicates whether THIS variant has a mitigation in place.
 *
 * When the scenario bar's "region failure" toggle is on, the region-down
 * row glows and the matrix surfaces recovery-time estimates.
 */

import { motion } from "framer-motion";
import type { Architecture, Risk } from "@/types/architecture";
import { useCockpit } from "../state";
import { VariantHeader } from "../VariantHeader";
import { MatrixCell } from "./primitives";
import type { CockpitVariant } from "../StudyCockpit";

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

// Canonical failure modes the matrix asks about. Each row maps to a set
// of regex hints that, if matched in the arch's risks/patterns/security,
// indicate the variant has it covered.
interface FailureMode {
  id: string;
  label: string;
  riskCategory?: Risk["category"];
  hints: RegExp[];
  scenarioGlow?: "regionFailure";
}

const FAILURE_MODES: FailureMode[] = [
  {
    id: "region-failure",
    label: "Region failure",
    hints: [
      /multi-?region/i, /active[-/ ]?active/i, /active[-/ ]?passive/i,
      /failover/i, /dr\b/i, /disaster recovery/i,
    ],
    scenarioGlow: "regionFailure",
  },
  {
    id: "db-corruption",
    label: "DB corruption / accidental delete",
    hints: [/pitr/i, /point[- ]in[- ]time recovery/i, /backup/i, /snapshot/i],
  },
  {
    id: "dependency-timeout",
    label: "Dependency timeout",
    hints: [/circuit ?break/i, /retry/i, /timeout/i, /backoff/i, /bulkhead/i],
  },
  {
    id: "cache-stampede",
    label: "Cache stampede",
    hints: [/single ?flight/i, /coalesc/i, /jitter/i, /probabilistic refresh/i, /lock/i],
  },
  {
    id: "hot-partition",
    label: "Hot partition / hot key",
    hints: [/shard/i, /partition/i, /consistent ?hash/i, /rebalance/i],
  },
  {
    id: "queue-backlog",
    label: "Queue backlog",
    hints: [/dlq/i, /dead ?letter/i, /lag/i, /autoscale/i, /backpressure/i],
  },
  {
    id: "noisy-neighbor",
    label: "Noisy neighbour",
    hints: [/tenant isolation/i, /rate ?limit/i, /quota/i, /priority queue/i, /bulkhead/i],
  },
  {
    id: "credential-leak",
    label: "Credential / secret leak",
    riskCategory: "security",
    hints: [/secret ?manager|vault|kms|rotation|workload identity|iam role/i],
  },
];

export function ReliabilityLens({ variants }: { variants: CockpitVariant[] }) {
  const { scenario, openDrawer } = useCockpit();
  const live = variants.filter((v) => !v.failed);

  if (live.length === 0) {
    return (
      <div className="rounded-lg border border-[hsl(var(--line))] bg-[hsl(var(--card))] p-8 text-center">
        <span className="ms text-[28px] text-[hsl(var(--ink-3))]" aria-hidden>verified</span>
        <p className="mt-3 text-[13px] text-[hsl(var(--ink-2))]">
          At least one completed variant is needed for the reliability matrix.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-x-auto scrollbar-thin rounded-lg border border-[hsl(var(--line))] bg-[hsl(var(--card))]">
        <table className="w-full min-w-[640px] border-separate border-spacing-0 text-[13px]">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-[hsl(var(--card))] px-3 py-2 text-left text-[10px] font-mono uppercase tracking-[0.14em] text-[hsl(var(--ink-3))] border-b border-[hsl(var(--line))]">
                Failure mode
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
            {FAILURE_MODES.map((mode, i) => {
              const isGlowing =
                mode.scenarioGlow === "regionFailure" && scenario.regionFailureSim;
              return (
                <tr key={mode.id}>
                  <td
                    className={
                      "sticky left-0 z-10 px-3 py-2 text-[12px] uppercase tracking-wider font-mono border-b border-[hsl(var(--line))] " +
                      (isGlowing
                        ? "bg-[hsl(var(--bad))]/10 text-[hsl(var(--bad))]"
                        : "bg-[hsl(var(--card))] text-[hsl(var(--ink-2))]")
                    }
                  >
                    {mode.label}
                  </td>
                  {live.map((v) => {
                    const { covered, evidence } = evaluateMode(v.architecture, mode);
                    const status = covered ? "ok" : "missing";
                    const note = covered ? evidence : "no mitigation referenced";
                    return (
                      <motion.td
                        key={v.variantId}
                        initial={{ opacity: 0 }}
                        animate={{
                          opacity: 1,
                          backgroundColor: isGlowing
                            ? "hsl(var(--bad) / 0.04)"
                            : "transparent",
                        }}
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
                          onClick={() =>
                            openDrawer({
                              title: `${v.label} · ${mode.label}`,
                              caption: covered ? "Mitigation present" : "Mitigation missing",
                              body: (
                                <ReliabilityDrawer
                                  arch={v.architecture}
                                  mode={mode}
                                  isRegionDown={Boolean(isGlowing)}
                                />
                              ),
                            })
                          }
                        />
                      </motion.td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {scenario.regionFailureSim && (
        <p className="text-[12px] text-[hsl(var(--bad))] flex items-center gap-2">
          <span className="ms text-[16px]" aria-hidden>bolt</span>
          Region-down simulation is on — costs in the Cost lens now include DR overhead.
        </p>
      )}
    </div>
  );
}

function evaluateMode(arch: Architecture | null, mode: FailureMode): {
  covered: boolean;
  evidence: string;
} {
  if (!arch) return { covered: false, evidence: "—" };
  const hayParts = [
    ...(arch.risks ?? []).map((r) => `${r.mitigation ?? ""} ${r.cloud_pattern ?? ""}`),
    ...(arch.applied_patterns ?? []).map((p) => `${p.name ?? ""} ${p.why ?? ""}`),
    ...(arch.security ?? []).map((s) => `${s.control ?? ""} ${s.implementation ?? ""}`),
    arch.deployment?.primary_region ?? "",
    ...(arch.deployment?.additional_regions ?? []),
    arch.deployment?.rollout_strategy ?? "",
    arch.deployment?.rollback_strategy ?? "",
  ];
  const hay = hayParts.join("\n").toLowerCase();
  for (const rx of mode.hints) {
    if (rx.test(hay)) {
      // First matching pattern name from applied_patterns wins as evidence.
      const matched = (arch.applied_patterns ?? []).find((p) => rx.test(p.name ?? ""));
      return {
        covered: true,
        evidence: matched?.name ?? "mitigation referenced",
      };
    }
  }
  return { covered: false, evidence: "—" };
}

function ReliabilityDrawer({
  arch,
  mode,
  isRegionDown,
}: {
  arch: Architecture | null;
  mode: FailureMode;
  isRegionDown: boolean;
}) {
  if (!arch) {
    return <p className="text-[13px] text-[hsl(var(--ink-3))]">Architecture unavailable.</p>;
  }
  const relatedRisks = (arch.risks ?? []).filter((r) => {
    if (mode.riskCategory && r.category === mode.riskCategory) return true;
    return mode.hints.some((rx) => rx.test(`${r.title ?? ""} ${r.mitigation ?? ""}`));
  });
  const relatedPatterns = (arch.applied_patterns ?? []).filter((p) =>
    mode.hints.some((rx) => rx.test(`${p.name ?? ""} ${p.why ?? ""}`)),
  );
  return (
    <div className="flex flex-col gap-3 text-[13px] text-[hsl(var(--ink-2))]">
      {isRegionDown && mode.scenarioGlow === "regionFailure" && (
        <div className="rounded-md border border-[hsl(var(--bad))]/30 bg-[hsl(var(--bad))]/5 p-3 text-[12px]">
          Primary region <strong>{arch.deployment?.primary_region || "—"}</strong> is
          assumed offline. Additional regions:
          {" "}
          <strong>
            {(arch.deployment?.additional_regions ?? []).join(", ") || "—"}
          </strong>
          .
        </div>
      )}
      {relatedRisks.length > 0 && (
        <section>
          <h3 className="text-[11px] font-mono uppercase tracking-[0.14em] text-[hsl(var(--ink-3))]">
            Risks referenced
          </h3>
          <ul className="mt-2 flex flex-col gap-2">
            {relatedRisks.map((r) => (
              <li key={r.id} className="rounded-md border border-[hsl(var(--line))] bg-[hsl(var(--paper-3))]/30 p-3">
                <strong className="text-[hsl(var(--ink))]">{r.title}</strong>
                <p className="mt-1">{r.mitigation}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
      {relatedPatterns.length > 0 && (
        <section>
          <h3 className="text-[11px] font-mono uppercase tracking-[0.14em] text-[hsl(var(--ink-3))]">
            Patterns applied
          </h3>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {relatedPatterns.map((p) => (
              <li
                key={`${p.name}-${p.where}`}
                className="rounded-md border border-[hsl(var(--line))] bg-[hsl(var(--card))] px-2 py-0.5 text-[11px] font-mono uppercase tracking-wider text-[hsl(var(--ink-2))]"
              >
                {p.name}
              </li>
            ))}
          </ul>
        </section>
      )}
      {relatedRisks.length === 0 && relatedPatterns.length === 0 && (
        <p className="text-[12px] text-[hsl(var(--ink-3))]">
          No mitigation patterns or risks referenced for this failure mode. Add the
          requirement to the brief and re-run.
        </p>
      )}
    </div>
  );
}
