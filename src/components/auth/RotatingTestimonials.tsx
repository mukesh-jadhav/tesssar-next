"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useReducedMotionSafe } from "@/components/motion/useReducedMotionSafe";

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

export type Testimonial = {
  quote: React.ReactNode;
  initials: string;
  name: string;
  role: string;
};

const DEFAULTS: Testimonial[] = [
  {
    quote: (
      <>
        <span className="serif font-normal italic">“It used to take a week</span> to
        produce a defensible architecture doc. Tessar gives you a draft you can
        argue with in <span className="accent">minutes.</span>”
      </>
    ),
    initials: "PR",
    name: "Priya R.",
    role: "Principal engineer · Bengaluru",
  },
  {
    quote: (
      <>
        <span className="serif font-normal italic">“The first draft is so close</span>
        {" "}to what I&apos;d sketch on a whiteboard that my review turns into a
        conversation about <span className="accent">tradeoffs,</span> not typos.”
      </>
    ),
    initials: "AS",
    name: "Aman S.",
    role: "Staff SRE · Hyderabad",
  },
  {
    quote: (
      <>
        <span className="serif font-normal italic">“Cost ranges in INR, GCP-first
        components,</span> and risks called out with likelihood. It reads like
        someone who actually <span className="accent">ships in India.</span>”
      </>
    ),
    initials: "RM",
    name: "Riya M.",
    role: "Fractional CTO · Pune",
  },
];

const CYCLE_MS = 7000;

export function RotatingTestimonials({ items = DEFAULTS }: { items?: Testimonial[] }) {
  const reduced = useReducedMotionSafe();
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (reduced || paused || items.length <= 1) return;
    const t = window.setInterval(() => {
      setIdx((i) => (i + 1) % items.length);
    }, CYCLE_MS);
    return () => window.clearInterval(t);
  }, [reduced, paused, items.length]);

  const cur = items[idx];

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="relative min-h-[260px]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.figure
            key={idx}
            initial={reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: -8 }}
            transition={{ duration: 0.6, ease: EASE_OUT_EXPO }}
          >
            <blockquote className="display text-[clamp(1.8rem,3vw,2.8rem)] leading-[1.1] tracking-[-0.025em]">
              {cur.quote}
            </blockquote>
            <figcaption className="mt-10 flex items-center gap-4">
              <div className="grid size-12 place-items-center rounded-full bg-[hsl(var(--ink))] text-[hsl(var(--paper))]">
                <span className="display text-[16px]">{cur.initials}</span>
              </div>
              <div>
                <div className="text-[14px] font-medium">{cur.name}</div>
                <div className="eyebrow">{cur.role}</div>
              </div>
            </figcaption>
          </motion.figure>
        </AnimatePresence>
      </div>

      {items.length > 1 && (
        <div className="mt-8 flex items-center gap-2" role="tablist" aria-label="Testimonials">
          {items.map((_, i) => {
            const active = i === idx;
            return (
              <button
                key={i}
                role="tab"
                aria-selected={active}
                aria-label={`Testimonial ${i + 1}`}
                onClick={() => setIdx(i)}
                className="group relative h-[10px] flex items-center"
              >
                <span
                  className={
                    "block h-[2px] transition-all duration-500 ease-out " +
                    (active
                      ? "w-10 bg-[hsl(var(--ink))]"
                      : "w-5 bg-[hsl(var(--ink-3))]/40 group-hover:bg-[hsl(var(--ink-3))]")
                  }
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
