"use client";

import { animate, motion, useInView, useMotionValue, useTransform } from "framer-motion";
import { useEffect, useRef } from "react";
import { useReducedMotionSafe } from "./useReducedMotionSafe";

type CountUpProps = {
  /** Final value to count to. */
  to: number;
  /** Starting value. Default 0. */
  from?: number;
  /** Duration in seconds. Default 1.6. */
  duration?: number;
  /** Decimal places. Default 0. */
  decimals?: number;
  /** Locale for number formatting. Default "en-IN" (Indian numbering: 10,00,000). */
  locale?: string;
  /** Prepended to the rendered number. Example: "₹". */
  prefix?: string;
  /** Appended to the rendered number. Example: "+", "k", "%". */
  suffix?: string;
  /** Re-run every time element re-enters viewport. Default false. */
  repeat?: boolean;
  className?: string;
};

/**
 * Animated number ticker. Triggers on viewport entry. Locale-aware
 * (defaults to Indian numbering — 10,00,000 instead of 1,000,000).
 * Reduced-motion users see the final value immediately.
 */
export function CountUp({
  to,
  from = 0,
  duration = 1.6,
  decimals = 0,
  locale = "en-IN",
  prefix = "",
  suffix = "",
  repeat = false,
  className,
}: CountUpProps) {
  const reduced = useReducedMotionSafe();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: !repeat, margin: "-40px" });
  const value = useMotionValue(reduced ? to : from);

  const formatter = new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  const display = useTransform(value, (latest) => `${prefix}${formatter.format(latest)}${suffix}`);

  useEffect(() => {
    if (reduced) {
      value.set(to);
      return;
    }
    if (!inView) return;
    const controls = animate(value, to, {
      duration,
      ease: [0.16, 1, 0.3, 1],
    });
    return () => controls.stop();
  }, [inView, to, duration, value, reduced]);

  return (
    <span ref={ref} className={className} aria-label={`${prefix}${formatter.format(to)}${suffix}`}>
      {reduced ? `${prefix}${formatter.format(to)}${suffix}` : <motion.span aria-hidden>{display}</motion.span>}
    </span>
  );
}
