"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { useReducedMotionSafe } from "@/components/motion/useReducedMotionSafe";

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

export type FAQItem = {
  q: string;
  a: React.ReactNode;
};

export function FAQ({ items }: { items: FAQItem[] }) {
  const reduced = useReducedMotionSafe();
  const [openId, setOpenId] = useState<number | null>(0);

  return (
    <ul className="border-y border-[hsl(var(--line))]">
      {items.map((item, i) => {
        const isOpen = openId === i;
        return (
          <li
            key={i}
            className="border-b border-[hsl(var(--line))] last:border-b-0"
          >
            <motion.div layout={!reduced} transition={{ duration: 0.34, ease: EASE_OUT_EXPO }}>
              <button
                type="button"
                onClick={() => setOpenId(isOpen ? null : i)}
                aria-expanded={isOpen}
                aria-controls={`faq-panel-${i}`}
                className="group flex w-full items-center gap-6 py-7 text-left transition-colors hover:bg-[hsl(var(--paper-2))]"
              >
                <span className="font-mono text-[12px] tabular-nums text-[hsl(var(--ink-3))] tracking-[0.18em] uppercase pl-2 md:pl-4 min-w-[3.5ch]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="display flex-1 text-[20px] md:text-[24px] leading-snug tracking-[-0.02em] text-[hsl(var(--ink))]">
                  {item.q}
                </span>
                <motion.span
                  aria-hidden
                  animate={{ rotate: isOpen ? 45 : 0 }}
                  transition={{ duration: 0.34, ease: EASE_OUT_EXPO }}
                  className="ms text-[24px] pr-2 md:pr-4 text-[hsl(var(--accent))]"
                >
                  add
                </motion.span>
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    key="content"
                    id={`faq-panel-${i}`}
                    role="region"
                    initial={reduced ? { height: "auto", opacity: 1 } : { height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={reduced ? { height: 0, opacity: 0 } : { height: 0, opacity: 0 }}
                    transition={{ duration: 0.42, ease: EASE_OUT_EXPO }}
                    style={{ overflow: "hidden" }}
                  >
                    <div className="pl-[calc(3.5ch+1.5rem+0.5rem)] md:pl-[calc(3.5ch+1.5rem+1rem)] pr-6 md:pr-12 pb-8 max-w-[68ch]">
                      <div className="text-[15px] leading-[1.7] text-[hsl(var(--ink-2))] [&>p+p]:mt-3">
                        {item.a}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </li>
        );
      })}
    </ul>
  );
}
