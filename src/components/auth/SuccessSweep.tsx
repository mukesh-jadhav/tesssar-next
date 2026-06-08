"use client";

import { motion } from "framer-motion";

/**
 * Sign-in success transition.
 *
 *  - A vermillion paint sweep enters from the left, fills the viewport,
 *    then fades. Used to bridge the brief async gap between Firebase
 *    redirect-returning and the post-auth route render.
 *  - 720ms total: 0.0-0.5 sweep right, 0.5-0.7 hold, 0.7-1.0 fade.
 *  - Sits at z-[200] above all chrome.
 *  - No reduced-motion branch — the component is only mounted by the
 *    caller after the user clicks; a pure flash works for everyone.
 */
export function SuccessSweep() {
  return (
    <motion.div
      aria-hidden
      className="fixed inset-0 z-[200] pointer-events-none origin-left bg-[hsl(var(--accent))]"
      initial={{ scaleX: 0, opacity: 1 }}
      animate={{
        scaleX: [0, 1, 1, 1],
        opacity: [1, 1, 1, 0],
      }}
      transition={{
        duration: 0.72,
        times: [0, 0.5, 0.7, 1],
        ease: [0.16, 1, 0.3, 1],
      }}
    />
  );
}
