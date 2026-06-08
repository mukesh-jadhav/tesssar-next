"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useReducedMotionSafe } from "./useReducedMotionSafe";

/**
 * DrawnCheck \u2014 a small SVG checkmark whose stroke "draws in" on mount.
 *
 * Use as the affirmative micro-interaction for copy-success, save-success,
 * "Published", "Sent", etc. Pure SVG + CSS \u2014 no framer-motion, no JS
 * animation loop. The path uses `stroke-dasharray` / `-dashoffset` and
 * a one-shot keyframe defined in `globals.css` (`.drawn-check-path`).
 *
 * The component re-keys on `signal` so a parent can re-trigger the draw
 * (e.g. on every successful copy click): `<DrawnCheck signal={copies}/>`.
 * Reduced-motion users see the check in its final state immediately.
 */
export function DrawnCheck({
  size = 16,
  strokeWidth = 2,
  className,
  signal,
}: {
  size?: number;
  strokeWidth?: number;
  className?: string;
  /** Bump to re-trigger the draw animation. Defaults to a stable key. */
  signal?: number | string;
}) {
  const reduced = useReducedMotionSafe();
  return (
    <svg
      key={signal}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      role="img"
      aria-label="Done"
      className={cn("inline-block shrink-0", className)}
    >
      <path
        d="M5 12.5 L10 17.5 L19 7"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={reduced ? undefined : "drawn-check-path"}
      />
    </svg>
  );
}
