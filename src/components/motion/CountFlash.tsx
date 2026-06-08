"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useReducedMotionSafe } from "./useReducedMotionSafe";

/**
 * CountFlash \u2014 numeric span that flashes briefly when its value changes.
 *
 * Use for credit balances and any other number the user *did something to*
 * (deducted on run, refunded on failure, topped up after a purchase). The
 * flash signals "this changed because of you" without a toast.
 *
 * \u2022 First render: no animation \u2014 we don't fake an event the user didn't cause.
 * \u2022 Decrease: brief vermillion (bad/accent) flash + a tiny -1px lift, ~640ms.
 * \u2022 Increase: brief good (green) flash + a tiny +1px lift, ~640ms.
 * \u2022 Reduced-motion: no flash; the number simply updates.
 *
 * Formatting is locale-aware via the `format` prop; defaults to `en-IN`
 * Indian numbering. Tabular-nums by default so the layout never shifts.
 */
export function CountFlash({
  value,
  format,
  className,
}: {
  value: number;
  format?: (v: number) => string;
  className?: string;
}) {
  const reduced = useReducedMotionSafe();
  const prev = React.useRef<number>(value);
  const mounted = React.useRef(false);
  const [flash, setFlash] = React.useState<"none" | "up" | "down">("none");

  React.useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    if (value === prev.current) return;
    const dir = value > prev.current ? "up" : "down";
    prev.current = value;
    if (reduced) return;
    setFlash(dir);
    const t = window.setTimeout(() => setFlash("none"), 720);
    return () => window.clearTimeout(t);
  }, [value, reduced]);

  const formatted = format
    ? format(value)
    : new Intl.NumberFormat("en-IN").format(value);

  return (
    <span
      className={cn(
        "inline-block tabular-nums",
        flash === "down" && "count-flash-down",
        flash === "up" && "count-flash-up",
        className,
      )}
    >
      {formatted}
    </span>
  );
}
