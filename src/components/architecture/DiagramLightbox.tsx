"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

/**
 * Click-to-zoom wrapper for diagrams. Tap the trigger → opens a
 * centered lightbox with the same content at a much larger size. A
 * faint backdrop blur dims everything behind but keeps it legible.
 *
 * Esc and backdrop click both dismiss. The trigger is a button so
 * keyboard users get focus and screen readers announce it as an
 * interactive element.
 */
export function DiagramLightbox({
  trigger,
  content,
  caption,
}: {
  /** The thumbnail / inline-sized rendering. */
  trigger: ReactNode;
  /** The large rendering shown in the lightbox. */
  content: ReactNode;
  /** Optional label shown in the lightbox header. */
  caption?: string;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    // Prevent body scroll while the lightbox is up.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group block w-full text-left rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--accent))]/40"
        aria-label="Open diagram at full size"
      >
        <div className="relative">
          {trigger}
          <span
            className="pointer-events-none absolute top-2 right-2 inline-flex items-center gap-1 rounded-md border border-[hsl(var(--line))] bg-[hsl(var(--paper))]/85 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-[hsl(var(--ink-3))] opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100 backdrop-blur-sm"
            aria-hidden
          >
            <span className="ms text-[12px]">fullscreen</span>
            zoom
          </span>
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            key="lb-scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[80] bg-[hsl(var(--ink))]/35 backdrop-blur-[3px] grid place-items-center p-4"
            aria-modal="true"
            role="dialog"
            aria-label={caption ?? "Diagram"}
          >
            <motion.div
              key="lb-shell"
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 4 }}
              transition={{ duration: 0.28, ease: EASE_OUT_EXPO }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-[1400px] max-h-[90vh] flex flex-col rounded-xl border border-[hsl(var(--line))] bg-[hsl(var(--card))] shadow-[0_24px_60px_-20px_hsl(var(--ink)/0.35)] overflow-hidden"
            >
              <header className="flex items-center justify-between gap-3 border-b border-[hsl(var(--line))] px-5 py-3">
                <div className="min-w-0">
                  <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[hsl(var(--ink-3))]">
                    Diagram
                  </div>
                  {caption && (
                    <h3 className="display-tight text-[16px] tracking-[-0.02em] truncate">
                      {caption}
                    </h3>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                  className="ms text-[22px] text-[hsl(var(--ink-3))] hover:text-[hsl(var(--ink))] transition-colors"
                >
                  close
                </button>
              </header>
              <div className="flex-1 min-h-0 overflow-auto scrollbar-thin p-6 md:p-10 bg-[hsl(var(--paper))]">
                {content}
              </div>
              <footer className="border-t border-[hsl(var(--line))] px-5 py-2 text-[11px] font-mono uppercase tracking-wider text-[hsl(var(--ink-3))]">
                Esc to close
              </footer>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
