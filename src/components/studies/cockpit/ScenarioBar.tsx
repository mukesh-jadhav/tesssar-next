"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useCockpit, type Scenario } from "./state";

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

const LATENCY_PRESETS: readonly Scenario["latencyBudgetMs"][] = [
  50, 200, 500, 1000,
];

/** Log-scale [0, 1000] → MAU. 0 → 1K, 1000 → 100M. */
function sliderToMau(v: number): number {
  const min = Math.log10(1_000);
  const max = Math.log10(100_000_000);
  const lg = min + (v / 1000) * (max - min);
  return Math.round(Math.pow(10, lg));
}

function mauToSlider(mau: number): number {
  const min = Math.log10(1_000);
  const max = Math.log10(100_000_000);
  const lg = Math.log10(Math.max(1_000, Math.min(100_000_000, mau)));
  return Math.round(((lg - min) / (max - min)) * 1000);
}

function formatMau(mau: number): string {
  if (mau >= 1_000_000) {
    const m = mau / 1_000_000;
    return `${m >= 10 ? m.toFixed(0) : m.toFixed(1)}M`;
  }
  if (mau >= 1_000) return `${(mau / 1_000).toFixed(0)}K`;
  return mau.toLocaleString("en-IN");
}

/**
 * ScenarioBar — the persistent top plane of the cockpit. Drives the
 * scenario state in `CockpitContext`. Pure inputs; the lens panes consume
 * `scenario` from context and re-project on every change.
 */
export function ScenarioBar() {
  const { scenario, setScenario } = useCockpit();

  const sliderValue = useMemo(
    () => mauToSlider(scenario.loadMau),
    [scenario.loadMau],
  );

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3 px-4 md:px-6 py-3 border-b border-[hsl(var(--line))] bg-[hsl(var(--card))]/60 backdrop-blur">
      {/* === Load slider === */}
      <div className="flex flex-1 min-w-[260px] items-center gap-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[hsl(var(--ink-3))]">
          Load
        </span>
        <div className="flex flex-1 items-center gap-3">
          <input
            type="range"
            min={0}
            max={1000}
            step={1}
            value={sliderValue}
            onChange={(e) =>
              setScenario({
                ...scenario,
                loadMau: sliderToMau(Number(e.currentTarget.value)),
              })
            }
            aria-label="Monthly active users (log scale)"
            className="flex-1 accent-[hsl(var(--accent))]"
          />
          <motion.span
            key={scenario.loadMau}
            initial={{ opacity: 0.6, y: 2 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, ease: EASE_OUT_EXPO }}
            className="display-tight w-[88px] text-[20px] tracking-[-0.02em] tabular-nums text-right"
          >
            {formatMau(scenario.loadMau)}
            <span className="ml-1 text-[11px] font-mono uppercase tracking-wider text-[hsl(var(--ink-3))]">
              MAU
            </span>
          </motion.span>
        </div>
      </div>

      {/* === Latency budget === */}
      <div className="flex items-center gap-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[hsl(var(--ink-3))]">
          p95
        </span>
        <div className="flex items-center rounded-full border border-[hsl(var(--line))] bg-[hsl(var(--paper-2))]/60 p-0.5">
          {LATENCY_PRESETS.map((ms) => {
            const active = ms === scenario.latencyBudgetMs;
            return (
              <button
                key={ms}
                type="button"
                onClick={() => setScenario({ ...scenario, latencyBudgetMs: ms })}
                aria-pressed={active}
                className={cn(
                  "relative rounded-full px-3 py-1 text-[12px] transition-colors",
                  active
                    ? "text-[hsl(var(--paper))]"
                    : "text-[hsl(var(--ink-2))] hover:text-[hsl(var(--ink))]",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="latency-active"
                    className="absolute inset-0 rounded-full bg-[hsl(var(--ink))]"
                    transition={{ duration: 0.28, ease: EASE_OUT_EXPO }}
                  />
                )}
                <span className="relative z-10 tabular-nums">
                  {ms < 1000 ? `${ms}ms` : `${ms / 1000}s`}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* === Region failure toggle === */}
      <label
        className={cn(
          "group flex items-center gap-2 select-none cursor-pointer",
          scenario.regionFailureSim && "text-[hsl(var(--bad))]",
        )}
      >
        <input
          type="checkbox"
          className="sr-only peer"
          checked={scenario.regionFailureSim}
          onChange={(e) =>
            setScenario({ ...scenario, regionFailureSim: e.currentTarget.checked })
          }
        />
        <span
          aria-hidden
          className={cn(
            "relative inline-flex h-5 w-9 rounded-full border transition-colors",
            scenario.regionFailureSim
              ? "border-[hsl(var(--bad))] bg-[hsl(var(--bad))]/30"
              : "border-[hsl(var(--line-2))] bg-[hsl(var(--paper-2))]",
          )}
        >
          <motion.span
            layout
            transition={{ duration: 0.24, ease: EASE_OUT_EXPO }}
            className={cn(
              "absolute top-0.5 size-4 rounded-full transition-colors",
              scenario.regionFailureSim
                ? "left-[18px] bg-[hsl(var(--bad))]"
                : "left-0.5 bg-[hsl(var(--ink-3))]",
            )}
          />
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.14em]">
          Region down
        </span>
      </label>

      {/* === Cost ceiling === */}
      <div className="flex items-center gap-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[hsl(var(--ink-3))]">
          Ceiling
        </span>
        <div className="flex items-center rounded-full border border-[hsl(var(--line))] bg-[hsl(var(--paper-2))]/60 px-2 py-1">
          <span className="text-[11px] text-[hsl(var(--ink-3))] mr-1">₹</span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            step={10000}
            value={scenario.costCeilingInr ?? ""}
            onChange={(e) => {
              const raw = e.currentTarget.value;
              const n = raw === "" ? undefined : Math.max(0, Number(raw));
              setScenario({
                ...scenario,
                costCeilingInr: Number.isFinite(n!) ? n : undefined,
              });
            }}
            placeholder="—"
            aria-label="Monthly cost ceiling in INR"
            className="w-[90px] bg-transparent text-[12px] tabular-nums focus:outline-none placeholder:text-[hsl(var(--ink-3))]/60"
          />
          <span className="text-[10px] text-[hsl(var(--ink-3))] ml-1">/mo</span>
        </div>
      </div>
    </div>
  );
}
