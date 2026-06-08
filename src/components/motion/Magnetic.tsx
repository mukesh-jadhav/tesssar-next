"use client";

import { motion, useMotionValue, useSpring } from "framer-motion";
import { type ReactNode, type PointerEvent, useRef } from "react";
import { useReducedMotionSafe } from "./useReducedMotionSafe";

type MagneticProps = {
  children: ReactNode;
  /** How strongly the child follows the cursor. 0..1, default 0.18. */
  strength?: number;
  /** Maximum travel distance in pixels. Default 12. */
  maxDistance?: number;
  className?: string;
};

/**
 * Wraps an interactive element so it gently follows the cursor when nearby.
 * Use for primary CTAs only — overusing makes the page feel jittery.
 */
export function Magnetic({
  children,
  strength = 0.18,
  maxDistance = 12,
  className,
}: MagneticProps) {
  const reduced = useReducedMotionSafe();
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springConfig = { stiffness: 220, damping: 18, mass: 0.4 };
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  const handleMove = (e: PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) * strength;
    const dy = (e.clientY - cy) * strength;
    const clamp = (v: number) => Math.max(-maxDistance, Math.min(maxDistance, v));
    x.set(clamp(dx));
    y.set(clamp(dy));
  };

  const reset = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ x: springX, y: springY, display: "inline-block" }}
      onPointerMove={handleMove}
      onPointerLeave={reset}
    >
      {children}
    </motion.div>
  );
}
