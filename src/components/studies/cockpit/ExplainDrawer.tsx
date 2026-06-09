"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useCockpit } from "./state";

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

/**
 * Right-side slide-over drawer for click-to-explain. Listens to the
 * cockpit drawer state and renders the active payload. ESC closes.
 */
export function ExplainDrawer() {
  const { drawer, closeDrawer } = useCockpit();

  useEffect(() => {
    if (!drawer) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeDrawer();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawer, closeDrawer]);

  return (
    <AnimatePresence>
      {drawer && (
        <>
          <motion.div
            key="scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={closeDrawer}
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]"
            aria-hidden
          />
          <motion.aside
            key="drawer"
            role="dialog"
            aria-modal="true"
            aria-label={drawer.title}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.32, ease: EASE_OUT_EXPO }}
            className="fixed inset-y-0 right-0 z-50 w-full sm:w-[420px] max-w-full bg-[hsl(var(--card))] border-l border-[hsl(var(--line))] shadow-[-24px_0_60px_-30px_hsl(var(--ink)/0.28)] flex flex-col"
          >
            <header className="flex items-start justify-between gap-3 border-b border-[hsl(var(--line))] px-5 py-4">
              <div className="min-w-0">
                <h3 className="display-tight text-[18px] tracking-[-0.02em] truncate">
                  {drawer.title}
                </h3>
                {drawer.caption && (
                  <p className="mt-0.5 text-[12px] text-[hsl(var(--ink-3))] truncate">
                    {drawer.caption}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={closeDrawer}
                aria-label="Close"
                className="ms text-[20px] text-[hsl(var(--ink-3))] hover:text-[hsl(var(--ink))] transition-colors"
              >
                close
              </button>
            </header>
            <div className="flex-1 min-h-0 overflow-auto scrollbar-thin px-5 py-4 text-[14px] leading-relaxed text-[hsl(var(--ink-2))]">
              {drawer.body}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
