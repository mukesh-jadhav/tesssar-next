"use client";

import { motion } from "framer-motion";

/**
 * Root route template — runs on every route change.
 *
 *  - 280ms cross-fade with a 8px upward translate.
 *  - Sits above per-page entrance animations (`m3-page-enter` sections)
 *    so they compose: outer page rises softly, then inner sections do
 *    their staggered editorial reveals.
 *  - Framer's `motion.div` short-circuits when reduced-motion is set
 *    at the browser level.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      className="flex-1 min-h-0 w-full flex flex-col"
    >
      {children}
    </motion.div>
  );
}
