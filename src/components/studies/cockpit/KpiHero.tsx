"use client";

/**
 * KpiHero — four big headline numbers, the answer-at-a-glance band
 * above the matrix. Each KPI shows the winner's value + the variant
 * label, and animates whenever scenario state changes.
 */

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LiveCounter } from "./LiveCounter";
import { useCockpit } from "./state";
import {
  projectCost,
  projectLatency,
  projectCeiling,
} from "@/lib/studies/scenario";
import {
  attackSurface,
  headcountAtTier,
  formatInr,
} from "@/lib/studies/insights";
import type { CockpitVariant } from "./StudyCockpit";

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

interface Kpi {
  key: string;
  icon: string;
  label: string;
  winnerLabel: string | null;
  /** Number to animate (the winning value). */
  value: number;
  /** Render value + units around the count-up. */
  render: (animated: React.ReactNode) => React.ReactNode;
  caption?: string;
}

export function KpiHero({ variants }: { variants: CockpitVariant[] }) {
  const { scenario } = useCockpit();

  const kpis = useMemo<Kpi[]>(() => {
    const live = variants
      .filter((v) => !v.failed && v.architecture)
      .map((v) => ({
        label: v.label,
        cost: projectCost(v.architecture!, scenario),
        latency: projectLatency(v.architecture!, scenario),
        ceiling: projectCeiling(v.architecture!),
        eng: headcountAtTier(
          v.architecture!,
          scenario.loadMau < 500_000
            ? "growth"
            : scenario.loadMau < 10_000_000
            ? "scale"
            : "hyperscale",
        ),
        attack: attackSurface(v.architecture!),
      }));

    if (!live.length) {
      return [
        emptyKpi("cheapest", "payments", "Cheapest /mo"),
        emptyKpi("fastest", "speed", "Fastest p95"),
        emptyKpi("eng", "build", "Smallest team"),
        emptyKpi("attack", "encrypted", "Smallest attack surface"),
      ];
    }

    const cheapest = live.reduce((a, b) => (a.cost.totalInr <= b.cost.totalInr ? a : b));
    const fastest = live.reduce((a, b) => (a.latency.p95Ms <= b.latency.p95Ms ? a : b));
    const smallestTeam = live.reduce((a, b) => (a.eng <= b.eng ? a : b));
    const smallestSurface = live.reduce((a, b) => (a.attack <= b.attack ? a : b));

    return [
      {
        key: "cheapest",
        icon: "payments",
        label: "Cheapest /mo",
        winnerLabel: cheapest.label,
        value: cheapest.cost.totalInr,
        render: () => (
          <span className="font-mono">
            ₹<LiveCounter to={cheapest.cost.totalInr} duration={0.55} className="display-tight text-[32px] tracking-[-0.02em] tabular-nums" />
          </span>
        ),
        caption: `vs next ₹${formatInr(nextBest(live.map((l) => l.cost.totalInr), cheapest.cost.totalInr, "lower"))} more`,
      },
      {
        key: "fastest",
        icon: "speed",
        label: "Fastest p95",
        winnerLabel: fastest.label,
        value: Math.round(fastest.latency.p95Ms),
        render: () => (
          <span className="font-mono">
            <LiveCounter to={Math.round(fastest.latency.p95Ms)} duration={0.5} suffix="ms" className="display-tight text-[32px] tracking-[-0.02em] tabular-nums" />
          </span>
        ),
        caption: `budget · ${scenario.latencyBudgetMs < 1000 ? scenario.latencyBudgetMs + "ms" : scenario.latencyBudgetMs / 1000 + "s"}`,
      },
      {
        key: "eng",
        icon: "groups",
        label: "Smallest team",
        winnerLabel: smallestTeam.label,
        value: smallestTeam.eng,
        render: () => (
          <span className="font-mono">
            <LiveCounter to={smallestTeam.eng} duration={0.5} className="display-tight text-[32px] tracking-[-0.02em] tabular-nums" />
            <span className="ml-1 text-[12px] text-[hsl(var(--ink-3))] font-mono uppercase tracking-wider">eng</span>
          </span>
        ),
        caption: "day-2 burden",
      },
      {
        key: "attack",
        icon: "encrypted",
        label: "Smallest surface",
        winnerLabel: smallestSurface.label,
        value: smallestSurface.attack,
        render: () => (
          <span className="font-mono">
            <LiveCounter to={smallestSurface.attack} duration={0.5} className="display-tight text-[32px] tracking-[-0.02em] tabular-nums" />
            <span className="ml-1 text-[12px] text-[hsl(var(--ink-3))] font-mono uppercase tracking-wider">public</span>
          </span>
        ),
        caption: "components facing internet",
      },
    ];
  }, [variants, scenario]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {kpis.map((k) => (
        <KpiCard key={k.key} kpi={k} />
      ))}
    </div>
  );
}

function KpiCard({ kpi }: { kpi: Kpi }) {
  return (
    <div className="rounded-lg border border-[hsl(var(--line))] bg-[hsl(var(--card))] px-4 py-3.5 flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[hsl(var(--ink-3))]">
          {kpi.label}
        </span>
        <span
          className="ms text-[16px] text-[hsl(var(--ink-3))]/70"
          aria-hidden
        >
          {kpi.icon}
        </span>
      </div>
      <div className="mt-0.5">
        {kpi.render(null)}
      </div>
      <div className="flex items-center justify-between gap-2 min-h-[18px]">
        <AnimatePresence mode="popLayout" initial={false}>
          {kpi.winnerLabel ? (
            <motion.span
              key={kpi.winnerLabel}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.22, ease: EASE_OUT_EXPO }}
              className="text-[12px] font-medium text-[hsl(var(--ink-2))]"
            >
              {kpi.winnerLabel}
            </motion.span>
          ) : (
            <span className="text-[12px] text-[hsl(var(--ink-3))] italic">—</span>
          )}
        </AnimatePresence>
        {kpi.caption && (
          <span className="text-[10.5px] text-[hsl(var(--ink-3))] font-mono tracking-tight truncate">
            {kpi.caption}
          </span>
        )}
      </div>
    </div>
  );
}

function emptyKpi(key: string, icon: string, label: string): Kpi {
  return {
    key,
    icon,
    label,
    winnerLabel: null,
    value: 0,
    render: () => (
      <span className="display-tight text-[32px] text-[hsl(var(--ink-3))]/40 tracking-[-0.02em]">—</span>
    ),
  };
}

function nextBest(values: number[], winner: number, dir: "lower" | "higher"): number {
  const others = values.filter((v) => v !== winner);
  if (!others.length) return 0;
  const next = dir === "lower" ? Math.min(...others) : Math.max(...others);
  return Math.abs(next - winner);
}
