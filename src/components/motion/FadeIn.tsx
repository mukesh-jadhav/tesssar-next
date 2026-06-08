"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { type ElementType, type ReactNode } from "react";
import { useReducedMotionSafe } from "./useReducedMotionSafe";

type FadeInProps = {
  children: ReactNode;
  /** Delay before the animation starts, in seconds. */
  delay?: number;
  /** Distance to translate from, in pixels. Default 12. */
  y?: number;
  /** Duration in seconds. Default 0.6. */
  duration?: number;
  /** Re-run every time the element re-enters the viewport. Default false. */
  repeat?: boolean;
  /** Pixel offset for viewport detection. Default "-80px" (triggers slightly before fully in view). */
  rootMargin?: string;
  className?: string;
  as?: "div" | "section" | "article" | "header" | "footer" | "main" | "aside" | "li" | "p" | "h1" | "h2" | "h3" | "h4" | "span";
} & Omit<HTMLMotionProps<"div">, "ref" | "children" | "as">;

/**
 * Fades + lifts a child into view on scroll. Replaces the legacy `.m3-rise` CSS
 * class with proper viewport detection + reduced-motion fallback.
 */
export function FadeIn({
  children,
  delay = 0,
  y = 12,
  duration = 0.6,
  repeat = false,
  rootMargin = "-80px",
  className,
  as = "div",
  ...rest
}: FadeInProps) {
  const reduced = useReducedMotionSafe();
  const Component = (motion as unknown as Record<string, ElementType>)[as] ?? motion.div;

  if (reduced) {
    return (
      <Component className={className} {...rest}>
        {children}
      </Component>
    );
  }

  return (
    <Component
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: !repeat, margin: rootMargin }}
      transition={{
        duration,
        delay,
        ease: [0.22, 1.4, 0.36, 1], // mirrors --ease-soft-spring
      }}
      {...rest}
    >
      {children}
    </Component>
  );
}
