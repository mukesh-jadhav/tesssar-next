"use client";

import { motion, useScroll, useSpring } from "framer-motion";
import { useReducedMotionSafe } from "./useReducedMotionSafe";

type ScrollProgressProps = {
  /** CSS color (default uses --accent). */
  color?: string;
  /** Bar thickness in pixels. Default 2. */
  thickness?: number;
  /** Z-index. Default 60 (above sticky nav). */
  zIndex?: number;
};

/**
 * Fixed top-of-viewport bar that fills as the user scrolls the page.
 * Sprung for buttery feel. Set thickness 1 for ultra-subtle.
 */
export function ScrollProgress({
  color = "hsl(var(--accent))",
  thickness = 2,
  zIndex = 60,
}: ScrollProgressProps) {
  const reduced = useReducedMotionSafe();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 140,
    damping: 22,
    mass: 0.3,
    restDelta: 0.001,
  });

  if (reduced) return null;

  return (
    <motion.div
      aria-hidden
      style={{
        scaleX,
        transformOrigin: "0% 50%",
        backgroundColor: color,
        height: thickness,
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex,
        pointerEvents: "none",
      }}
    />
  );
}
