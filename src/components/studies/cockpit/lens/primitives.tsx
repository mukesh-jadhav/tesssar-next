"use client";

/**
 * Tiny visual primitives shared across the nine lenses. Each lens reaches
 * for these to keep the chrome consistent and the lens files focused on
 * data-shape work.
 */

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

// ---------- StatBlock ----------

/**
 * A label/value pair with a big number and a mono caption. Used as the
 * top-of-column "headline" in cost / ops / lock-in / scale / performance
 * lenses.
 */
export function StatBlock({
  label,
  value,
  caption,
  tone = "ink",
  delay = 0,
}: {
  label: string;
  value: ReactNode;
  caption?: ReactNode;
  tone?: "ink" | "accent" | "warn" | "bad";
  delay?: number;
}) {
  const toneClass =
    tone === "accent" ? "text-[hsl(var(--accent))]"
    : tone === "warn" ? "text-[hsl(var(--warn))]"
    : tone === "bad"  ? "text-[hsl(var(--bad))]"
    : "text-[hsl(var(--ink))]";
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: EASE_OUT_EXPO, delay }}
      className="flex flex-col gap-1"
    >
      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[hsl(var(--ink-3))]">
        {label}
      </span>
      <span className={cn("display-tight text-[28px] leading-none tracking-[-0.02em]", toneClass)}>
        {value}
      </span>
      {caption != null && (
        <span className="text-[11px] text-[hsl(var(--ink-3))]">{caption}</span>
      )}
    </motion.div>
  );
}

// ---------- ScoreMeter ----------

/**
 * A 0..max horizontal meter with a coloured fill. Used by ops / lock-in
 * / scale lenses for at-a-glance comparison across columns.
 */
export function ScoreMeter({
  value,
  max = 100,
  tone = "accent",
  caption,
}: {
  value: number;
  max?: number;
  tone?: "accent" | "warn" | "bad";
  caption?: ReactNode;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const fill =
    tone === "warn" ? "bg-[hsl(var(--warn))]"
    : tone === "bad" ? "bg-[hsl(var(--bad))]"
    : "bg-[hsl(var(--accent))]";
  return (
    <div className="flex flex-col gap-1.5">
      <div className="h-2 w-full rounded-full bg-[hsl(var(--paper-3))] overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
          className={cn("h-full rounded-full", fill)}
        />
      </div>
      {caption != null && (
        <span className="text-[11px] text-[hsl(var(--ink-3))]">{caption}</span>
      )}
    </div>
  );
}

// ---------- StackedBar ----------

export interface StackSegment {
  key: string;
  label: string;
  value: number;
  /** A tailwind background class — let lenses pick the palette. */
  className: string;
}

/**
 * Single horizontal stacked bar (e.g. cost categories, headcount roles).
 * Auto-normalises by sum; segments < 2% are still rendered as a hairline
 * so the user knows they exist.
 */
export function StackedBar({
  segments,
  height = 14,
}: {
  segments: StackSegment[];
  height?: number;
}) {
  const total = segments.reduce((s, x) => s + Math.max(0, x.value), 0);
  if (total <= 0) {
    return (
      <div
        className="w-full rounded-full bg-[hsl(var(--paper-3))]"
        style={{ height }}
      />
    );
  }
  return (
    <div
      className="flex w-full overflow-hidden rounded-full bg-[hsl(var(--paper-3))]"
      style={{ height }}
      role="img"
      aria-label={`Stacked: ${segments.map((s) => `${s.label} ${Math.round((s.value / total) * 100)}%`).join(", ")}`}
    >
      {segments.map((seg) => {
        const pct = Math.max(0, (seg.value / total) * 100);
        const displayPct = pct === 0 ? 0 : Math.max(pct, 1.5);
        return (
          <motion.div
            key={seg.key}
            initial={{ width: 0 }}
            animate={{ width: `${displayPct}%` }}
            transition={{ duration: 0.45, ease: EASE_OUT_EXPO }}
            className={cn("h-full", seg.className)}
            title={`${seg.label} — ${Math.round(pct)}%`}
          />
        );
      })}
    </div>
  );
}

// ---------- Chip ----------

/**
 * Compact tag, used inline (sticky services, applied patterns, missing
 * controls). Tone controls the colour family.
 */
export function MiniChip({
  children,
  tone = "ink",
}: {
  children: ReactNode;
  tone?: "ink" | "accent" | "warn" | "bad" | "ok";
}) {
  const toneClass =
    tone === "accent" ? "border-[hsl(var(--accent))]/30 bg-[hsl(var(--accent-paper))] text-[hsl(var(--accent-ink))]"
    : tone === "warn" ? "border-[hsl(var(--warn))]/30 bg-[hsl(var(--warn))]/10 text-[hsl(var(--warn))]"
    : tone === "bad"  ? "border-[hsl(var(--bad))]/30 bg-[hsl(var(--bad))]/10 text-[hsl(var(--bad))]"
    : tone === "ok"   ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
    : "border-[hsl(var(--line))] bg-[hsl(var(--paper-3))]/40 text-[hsl(var(--ink-2))]";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 border px-2 py-0.5 text-[10px] font-mono uppercase tracking-[0.08em]",
        toneClass,
      )}
    >
      {children}
    </span>
  );
}

// ---------- MatrixCell ----------

/**
 * One cell in a matrix lens (security/reliability). Status drives the
 * symbol + colour; the note is shown on hover via title.
 */
export function MatrixCell({
  status,
  note,
  onClick,
}: {
  status: "ok" | "partial" | "missing" | "na";
  note: string;
  onClick?: () => void;
}) {
  const cfg = {
    ok:      { symbol: "check_circle", color: "text-emerald-600 dark:text-emerald-400" },
    partial: { symbol: "warning",      color: "text-[hsl(var(--warn))]" },
    missing: { symbol: "cancel",       color: "text-[hsl(var(--bad))]" },
    na:      { symbol: "remove",       color: "text-[hsl(var(--ink-3))]" },
  }[status];
  const Inner = (
    <span className={cn("flex items-center gap-2 text-[12px]", cfg.color)}>
      <span className="ms text-[16px]" aria-hidden>{cfg.symbol}</span>
      <span className="truncate text-[hsl(var(--ink-2))] font-normal lowercase">{note}</span>
    </span>
  );
  if (!onClick) return Inner;
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left hover:bg-[hsl(var(--paper-3))]/40 transition-colors rounded px-1 py-0.5 -mx-1 -my-0.5"
    >
      {Inner}
    </button>
  );
}

// ---------- CountUp helper (re-usable for live re-projection) ----------

/**
 * Lightweight animated re-mount that re-fires whenever `keyValue`
 * changes — used by lenses that want their headline number to "flash"
 * subtly on every slider update.
 */
export function FlashRemount({
  keyValue,
  children,
}: {
  keyValue: string | number;
  children: ReactNode;
}) {
  return (
    <motion.span
      key={keyValue}
      initial={{ opacity: 0.4, y: -2 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: EASE_OUT_EXPO }}
    >
      {children}
    </motion.span>
  );
}
