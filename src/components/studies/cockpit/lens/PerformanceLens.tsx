"use client";

/**
 * Performance lens — projected p95 latency at the current scenario load,
 * with a visual budget bar that turns red when it overruns. Below the
 * bar: the slowest hop / bottleneck the user should focus on.
 */

import { motion } from "framer-motion";
import { projectLatency } from "@/lib/studies/scenario";
import { LensColumns } from "../LensColumns";
import { useCockpit } from "../state";
import { FlashRemount, MiniChip, StatBlock } from "./primitives";
import type { CockpitVariant } from "../StudyCockpit";

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

export function PerformanceLens({ variants }: { variants: CockpitVariant[] }) {
  const { scenario, openDrawer } = useCockpit();

  return (
    <LensColumns
      variants={variants}
      renderCell={(v) => {
        const arch = v.architecture;
        if (!arch) return null;
        const latency = projectLatency(arch, scenario);
        const budget = scenario.latencyBudgetMs;
        const fillPct = Math.min(
          150,
          latency.p95Ms > 0 ? (latency.p95Ms / budget) * 100 : 0,
        );
        const cappedPct = Math.min(100, fillPct);
        const overflowPct = Math.max(0, fillPct - 100);

        const tone = latency.overBudget ? "bad" : latency.p95Ms / budget > 0.7 ? "warn" : "accent";

        return (
          <div className="flex flex-col gap-4">
            <StatBlock
              label="p95 at this load"
              value={
                latency.p95Ms > 0 ? (
                  <FlashRemount keyValue={latency.p95Ms}>
                    {latency.p95Ms} <span className="text-[14px] text-[hsl(var(--ink-3))]">ms</span>
                  </FlashRemount>
                ) : (
                  "—"
                )
              }
              caption={`Budget ${budget}ms`}
              tone={tone}
            />

            {/* Latency bar with overflow tail */}
            <div className="flex flex-col gap-1.5">
              <div className="relative h-2.5 w-full rounded-full bg-[hsl(var(--paper-3))] overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${cappedPct}%` }}
                  transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
                  className={
                    "absolute inset-y-0 left-0 rounded-full " +
                    (latency.overBudget
                      ? "bg-[hsl(var(--bad))]"
                      : tone === "warn"
                      ? "bg-[hsl(var(--warn))]"
                      : "bg-[hsl(var(--accent))]")
                  }
                />
                {/* Overflow tail bleeds past the budget marker */}
                {overflowPct > 0 && (
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${overflowPct}%` }}
                    transition={{ duration: 0.5, ease: EASE_OUT_EXPO, delay: 0.05 }}
                    className="absolute inset-y-0 right-0 rounded-full bg-[repeating-linear-gradient(135deg,hsl(var(--bad))_0_4px,transparent_4px_8px)] opacity-80"
                  />
                )}
                {/* Budget tick */}
                <div className="absolute top-[-2px] bottom-[-2px] w-px bg-[hsl(var(--ink-2))] left-[66.6%]" aria-hidden />
              </div>
              <div className="flex justify-between text-[10px] font-mono text-[hsl(var(--ink-3))]">
                <span>0</span>
                <span>{budget}ms · budget</span>
              </div>
            </div>

            {latency.bottleneckLabel && (
              <MiniChip tone={latency.overBudget ? "bad" : "warn"}>
                slowest hop · {latency.bottleneckLabel}
              </MiniChip>
            )}
            {!latency.bottleneckLabel && (
              <MiniChip>no per-hop budgets supplied</MiniChip>
            )}

            <div className="flex items-center justify-end pt-1">
              <button
                type="button"
                onClick={() =>
                  openDrawer({
                    title: `${v.label} · latency walk`,
                    caption: `p95 ${latency.p95Ms || "—"}ms vs ${budget}ms budget`,
                    body: <LatencyDrawer arch={arch} />,
                  })
                }
                className="inline-flex items-center gap-1 text-[11px] font-mono uppercase tracking-wider text-[hsl(var(--ink-3))] hover:text-[hsl(var(--ink))] transition-colors"
              >
                trace
                <span className="ms text-[14px]" aria-hidden>arrow_forward</span>
              </button>
            </div>
          </div>
        );
      }}
    />
  );
}

function LatencyDrawer({ arch }: { arch: CockpitVariant["architecture"] }) {
  if (!arch) return null;
  const flows = [...(arch.data_flows ?? [])].sort((a, b) => a.step - b.step);
  if (flows.length === 0) {
    return <p className="text-[13px] text-[hsl(var(--ink-3))]">No data flows in this variant.</p>;
  }
  const total = flows.reduce((s, f) => s + (f.latency_budget_ms ?? 0), 0);
  return (
    <div className="flex flex-col gap-3 text-[13px] text-[hsl(var(--ink-2))]">
      <p className="text-[12px] text-[hsl(var(--ink-3))]">
        Each step adds to the projected p95. Hops without an explicit budget contribute a
        conservative 25ms in the projection.
      </p>
      <ol className="flex flex-col gap-1.5">
        {flows.map((f) => {
          const ms = f.latency_budget_ms ?? 0;
          const pct = total > 0 ? (ms / total) * 100 : 0;
          return (
            <li key={f.step} className="rounded-lg border border-[hsl(var(--line))] bg-[hsl(var(--paper-3))]/30 p-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[12px]">
                  <strong className="text-[hsl(var(--ink))]">{f.step}.</strong>{" "}
                  {f.from} → {f.to}
                </span>
                <span className="font-mono text-[11px] tabular-nums text-[hsl(var(--ink-2))]">
                  {ms > 0 ? `${ms}ms` : "—"}
                </span>
              </div>
              <div className="mt-1 h-1 rounded-full bg-[hsl(var(--paper-3))] overflow-hidden">
                <div className="h-full bg-[hsl(var(--accent))]" style={{ width: `${pct}%` }} />
              </div>
              <p className="mt-1 text-[11px] text-[hsl(var(--ink-3))]">{f.action}</p>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
