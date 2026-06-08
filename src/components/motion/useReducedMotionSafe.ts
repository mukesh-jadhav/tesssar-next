"use client";

import { useReducedMotion } from "framer-motion";

/**
 * Returns true when the user has requested reduced motion at the OS level.
 * Safe on SSR (returns null during server render, boolean after hydration).
 * Treat `null` as "motion allowed" so first paint is animated.
 */
export function useReducedMotionSafe(): boolean {
  const prefers = useReducedMotion();
  return prefers === true;
}
