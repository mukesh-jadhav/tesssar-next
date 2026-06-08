"use client";

import { motion, type Variants } from "framer-motion";
import { type ReactNode } from "react";
import { useReducedMotionSafe } from "./useReducedMotionSafe";

type StaggerProps = {
  children: ReactNode;
  /** Delay between each child, in seconds. Default 0.08. */
  stagger?: number;
  /** Delay before first child starts, in seconds. Default 0. */
  delay?: number;
  className?: string;
};

type StaggerItemProps = {
  children: ReactNode;
  /** Distance to translate from, in pixels. Default 12. */
  y?: number;
  className?: string;
};

const parentVariants = (stagger: number, delay: number): Variants => ({
  hidden: {},
  show: {
    transition: {
      staggerChildren: stagger,
      delayChildren: delay,
    },
  },
});

const childVariants = (y: number): Variants => ({
  hidden: { opacity: 0, y },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.22, 1.4, 0.36, 1],
    },
  },
});

/**
 * Parent orchestrator. Children inside `<Stagger>` should be `<StaggerItem>` —
 * they pick up the parent's staggered timeline automatically.
 */
export function Stagger({ children, stagger = 0.08, delay = 0, className }: StaggerProps) {
  const reduced = useReducedMotionSafe();

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      variants={parentVariants(stagger, delay)}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-60px" }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, y = 12, className }: StaggerItemProps) {
  const reduced = useReducedMotionSafe();

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div className={className} variants={childVariants(y)}>
      {children}
    </motion.div>
  );
}
