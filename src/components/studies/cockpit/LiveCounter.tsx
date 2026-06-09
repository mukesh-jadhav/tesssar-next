"use client";

import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { useEffect, useRef } from "react";
import { useReducedMotionSafe } from "@/components/motion/useReducedMotionSafe";
import { cn } from "@/lib/utils";

/**
 * Animated number ticker for the cockpit top plane. Unlike `CountUp`
 * (which fires once on viewport entry), this component animates every
 * time `to` changes — so cost / latency / headcount visibly retick
 * whenever the user moves a scenario control.
 *
 * Reduced-motion users get the final value with no transition.
 */
export function LiveCounter({
  to,
  duration = 0.7,
  decimals = 0,
  locale = "en-IN",
  prefix = "",
  suffix = "",
  className,
  emphasized,
}: {
  to: number;
  duration?: number;
  decimals?: number;
  locale?: string;
  prefix?: string;
  suffix?: string;
  className?: string;
  /** When true, briefly highlights the value as it updates. */
  emphasized?: boolean;
}) {
  const reduced = useReducedMotionSafe();
  const value = useMotionValue(to);
  const formatter = new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  const display = useTransform(value, (v) => `${prefix}${formatter.format(v)}${suffix}`);
  const lastTo = useRef<number>(to);

  useEffect(() => {
    if (reduced) {
      value.set(to);
      lastTo.current = to;
      return;
    }
    const controls = animate(value, to, {
      duration,
      ease: [0.16, 1, 0.3, 1],
    });
    lastTo.current = to;
    return () => controls.stop();
  }, [to, duration, value, reduced]);

  if (reduced) {
    return (
      <span className={cn("tabular-nums", className)}>
        {prefix}{formatter.format(to)}{suffix}
      </span>
    );
  }
  return (
    <motion.span
      className={cn("tabular-nums", className)}
      animate={emphasized ? { color: ["hsl(var(--accent-ink))", "hsl(var(--ink))"] } : undefined}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      aria-label={`${prefix}${formatter.format(to)}${suffix}`}
    >
      <motion.span aria-hidden>{display}</motion.span>
    </motion.span>
  );
}
