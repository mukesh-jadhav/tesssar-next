"use client";

import { cn } from "@/lib/utils";

/**
 * Material 3 Expressive — Wavy Progress.
 * Uses the css `.m3-wavy` primitive defined in globals.css.
 */
export function WavyProgress({
  value,
  indeterminate,
  className,
}: {
  value?: number;        // 0..100, ignored when indeterminate
  indeterminate?: boolean;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, value ?? 0));
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={indeterminate ? undefined : pct}
      className={cn("m3-wavy", indeterminate && "m3-wavy-indeterminate", className)}
      style={
        indeterminate
          ? undefined
          : ({ ["--m3-wavy-pct" as string]: `${pct}%` } as React.CSSProperties)
      }
    />
  );
}
