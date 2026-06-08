"use client";

import { motion } from "framer-motion";
import { useReducedMotionSafe } from "@/components/motion/useReducedMotionSafe";

type DrawnUnderlineProps = {
  /** Delay before the underline starts drawing, seconds. Default 0.5. */
  delay?: number;
  /** Stroke color. Default uses --accent. */
  color?: string;
  /** Stroke thickness. Default 3. */
  thickness?: number;
  className?: string;
};

/**
 * Hand-drawn-feeling underline. Sits as an absolute SVG immediately under the
 * parent element (parent must be `position: relative`). The path has a subtle
 * wobble so it doesn't read as mechanical. Draws via stroke-dashoffset on
 * viewport entry.
 */
export function DrawnUnderline({
  delay = 0.5,
  color = "hsl(var(--accent))",
  thickness = 3,
  className,
}: DrawnUnderlineProps) {
  const reduced = useReducedMotionSafe();

  return (
    <svg
      viewBox="0 0 200 12"
      preserveAspectRatio="none"
      aria-hidden
      role="presentation"
      className={
        "pointer-events-none absolute -bottom-1 left-0 right-0 h-[0.45em] w-full " +
        (className ?? "")
      }
    >
      <motion.path
        d="M2,7 C40,3 60,9 100,5 C140,1 160,9 198,5"
        fill="none"
        stroke={color}
        strokeWidth={thickness}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={reduced ? false : { pathLength: 0 }}
        whileInView={reduced ? undefined : { pathLength: 1 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{
          duration: 0.9,
          delay,
          ease: [0.16, 1, 0.3, 1],
        }}
      />
    </svg>
  );
}
