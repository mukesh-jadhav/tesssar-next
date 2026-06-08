"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { type ReactNode, useRef } from "react";
import { useReducedMotionSafe } from "./useReducedMotionSafe";

type ParallaxProps = {
  children: ReactNode;
  /** Strength: positive moves slower than scroll, negative moves opposite. -1..1. Default 0.4. */
  speed?: number;
  className?: string;
};

/**
 * Translates a child on Y based on its position in the viewport.
 * Use sparingly — best on big editorial numerals or decorative imagery.
 */
export function Parallax({ children, speed = 0.4, className }: ParallaxProps) {
  const reduced = useReducedMotionSafe();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const range = 80 * speed;
  const y = useTransform(scrollYProgress, [0, 1], [range, -range]);

  if (reduced) {
    return (
      <div ref={ref} className={className}>
        {children}
      </div>
    );
  }

  return (
    <div ref={ref} className={className} style={{ willChange: "transform" }}>
      <motion.div style={{ y }}>{children}</motion.div>
    </div>
  );
}
