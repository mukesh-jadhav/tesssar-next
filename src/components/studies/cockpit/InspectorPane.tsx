"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useCockpit } from "./state";

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

/**
 * Inline right-side inspector. Lives in the cockpit's flex row alongside
 * the lens rail + stage, so opening it pushes the stage instead of
 * floating over it with a backdrop blur. Closes on Esc or the X button.
 *
 * This replaces the floating ExplainDrawer that used a fixed-overlay
 * + scrim, which felt heavy compared to the rest of the editorial
 * surface.
 */
export function InspectorPane() {
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
    <AnimatePresence initial={false}>
      {drawer && (
        <motion.aside
          key="inspector"
          role="complementary"
          aria-label={drawer.title}
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 380, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.32, ease: EASE_OUT_EXPO }}
          className="hidden lg:flex shrink-0 flex-col overflow-hidden border-l border-[hsl(var(--line))] bg-[hsl(var(--card))]"
        >
          <PaneBody />
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

/**
 * Mobile/tablet fallback. The inline pane is hidden below `lg`; below
 * that breakpoint we surface the same payload as a bottom sheet so the
 * stage isn't squeezed. Still no scrim/blur — it docks to the bottom.
 */
export function InspectorSheet() {
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
    <AnimatePresence initial={false}>
      {drawer && (
        <motion.aside
          key="inspector-sheet"
          role="complementary"
          aria-label={drawer.title}
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ duration: 0.28, ease: EASE_OUT_EXPO }}
          className="lg:hidden fixed inset-x-0 bottom-0 z-30 max-h-[70vh] flex flex-col rounded-t-xl border-t border-[hsl(var(--line))] bg-[hsl(var(--card))] shadow-[0_-12px_40px_-20px_hsl(var(--ink)/0.22)]"
        >
          <PaneBody />
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

function PaneBody() {
  const { drawer, closeDrawer } = useCockpit();
  if (!drawer) return null;
  return (
    <>
      <header className="flex items-start justify-between gap-3 border-b border-[hsl(var(--line))] px-5 py-3.5">
        <div className="min-w-0">
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[hsl(var(--ink-3))]">
            Inspector
          </div>
          <h3 className="display-tight text-[16px] tracking-[-0.02em] truncate">
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
          aria-label="Close inspector"
          className="ms text-[20px] text-[hsl(var(--ink-3))] hover:text-[hsl(var(--ink))] transition-colors"
        >
          close
        </button>
      </header>
      <div className="flex-1 min-h-0 overflow-auto scrollbar-thin px-5 py-4 text-[14px] leading-relaxed text-[hsl(var(--ink-2))]">
        {drawer.body}
      </div>
    </>
  );
}
