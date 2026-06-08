"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { type ReactNode, type PointerEvent, useRef } from "react";
import { useReducedMotionSafe } from "./useReducedMotionSafe";

type TiltProps = {
  children: ReactNode;
  /** Maximum rotation in degrees on each axis. Default 4. */
  max?: number;
  /** Perspective in pixels. Lower = stronger 3D effect. Default 800. */
  perspective?: number;
  /** Adds a subtle scale on hover. Default 1 (no scale). */
  scale?: number;
  className?: string;
};

/**
 * Subtle 3D tilt on cursor hover. Best for cards on hero/landing surfaces.
 * Keep `max` ≤ 6° — anything more reads gimmicky.
 */
export function Tilt({
  children,
  max = 4,
  perspective = 800,
  scale = 1,
  className,
}: TiltProps) {
  const reduced = useReducedMotionSafe();
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);

  const springConfig = { stiffness: 180, damping: 16, mass: 0.5 };
  const sx = useSpring(mx, springConfig);
  const sy = useSpring(my, springConfig);

  const rotateY = useTransform(sx, [-0.5, 0.5], [-max, max]);
  const rotateX = useTransform(sy, [-0.5, 0.5], [max, -max]);

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  const handleMove = (e: PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    mx.set((e.clientX - rect.left) / rect.width - 0.5);
    my.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const reset = () => {
    mx.set(0);
    my.set(0);
  };

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{
        perspective,
        transformStyle: "preserve-3d",
      }}
      onPointerMove={handleMove}
      onPointerLeave={reset}
    >
      <motion.div
        style={{
          rotateX,
          rotateY,
          scale,
          transformStyle: "preserve-3d",
        }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
