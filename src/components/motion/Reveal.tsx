"use client";

import { motion } from "framer-motion";
import { type ReactNode } from "react";
import { useReducedMotionSafe } from "./useReducedMotionSafe";

type RevealProps = {
  children: ReactNode;
  /** Direction the mask retracts from. Default "up" (mask shrinks upward, revealing text top-to-bottom). */
  direction?: "up" | "down" | "left" | "right";
  delay?: number;
  duration?: number;
  className?: string;
};

const insetFrom: Record<NonNullable<RevealProps["direction"]>, string> = {
  up: "inset(0 0 100% 0)",
  down: "inset(100% 0 0 0)",
  left: "inset(0 100% 0 0)",
  right: "inset(0 0 0 100%)",
};

/**
 * Clip-path "wipe" reveal — best for editorial headlines and section openers.
 * Animates a mask, not opacity, so glyphs stay crisp during transition.
 */
export function Reveal({
  children,
  direction = "up",
  delay = 0,
  duration = 0.9,
  className,
}: RevealProps) {
  const reduced = useReducedMotionSafe();

  if (reduced) {
    return <span className={className}>{children}</span>;
  }

  return (
    <motion.span
      className={className}
      style={{ display: "inline-block", willChange: "clip-path" }}
      initial={{ clipPath: insetFrom[direction] }}
      whileInView={{ clipPath: "inset(0 0 0 0)" }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{
        duration,
        delay,
        ease: [0.16, 1, 0.3, 1], // ease-out-expo
      }}
    >
      {children}
    </motion.span>
  );
}
