"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useReducedMotionSafe } from "@/components/motion/useReducedMotionSafe";

type Quote = {
  body: string;
  emphasis?: string;
  closer?: string;
  initials: string;
  name: string;
  role: string;
};

const QUOTES: Quote[] = [
  {
    body: "It used to take a week to produce a defensible architecture doc. Tessar gives you a draft you can argue with in",
    emphasis: "“It used to take a week",
    closer: "minutes.”",
    initials: "PR",
    name: "Priya R.",
    role: "Principal engineer · Bengaluru",
  },
  {
    body: "I briefed a hyperscale food-delivery system in two paragraphs. The cost model, the bounded contexts, the DPDP notes — already in the report. We argued with it for an hour and shipped the next day.",
    emphasis: "“I briefed",
    closer: "shipped.”",
    initials: "AK",
    name: "Aarav K.",
    role: "Fractional CTO · Mumbai",
  },
  {
    body: "Our team kept opening every diagram tab going, ‘ok that’s exactly what we’d have drawn’. That’s the highest compliment I can pay an architecture tool.",
    emphasis: "“Our team kept opening",
    closer: "tool.”",
    initials: "SN",
    name: "Sneha N.",
    role: "Staff engineer · Pune",
  },
];

const INTERVAL_MS = 7000;

/**
 * Auto-rotating testimonial. Crossfades between three quotes every 7s.
 * Pauses on pointer hover and keyboard focus. Quote-mark glyph + persona
 * crossfade in sync. Reduced-motion users see static first quote.
 */
export function RotatingQuotes() {
  const reduced = useReducedMotionSafe();
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (reduced || paused) return;
    const t = setInterval(() => setI((prev) => (prev + 1) % QUOTES.length), INTERVAL_MS);
    return () => clearInterval(t);
  }, [reduced, paused]);

  const q = QUOTES[i];

  return (
    <div
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className="relative"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={i}
          initial={reduced ? false : { opacity: 0, y: 12 }}
          animate={reduced ? undefined : { opacity: 1, y: 0 }}
          exit={reduced ? undefined : { opacity: 0, y: -8 }}
          transition={{ duration: 0.5, ease: [0.22, 1.4, 0.36, 1] }}
        >
          <blockquote className="mt-12 display text-[clamp(2rem,4vw,3.4rem)] leading-[1.12] tracking-[-0.025em] max-w-[28ch]">
            <span className="serif italic">{q.emphasis}</span>{" "}
            {q.body.slice(q.emphasis ? q.emphasis.length - 1 : 0).trim()}{" "}
            <span className="accent">{q.closer}</span>
          </blockquote>
          <div className="mt-12 flex items-center gap-4">
            <div className="grid size-12 place-items-center rounded-full bg-[hsl(var(--accent))] text-[hsl(var(--paper))]">
              <span className="display text-[16px]">{q.initials}</span>
            </div>
            <div>
              <div className="text-[14px] font-medium">{q.name}</div>
              <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-[hsl(var(--paper))]/55">
                {q.role}
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Progress dots */}
      <div
        className="mt-10 flex items-center gap-2"
        role="tablist"
        aria-label="Testimonial selector"
      >
        {QUOTES.map((_, idx) => (
          <button
            key={idx}
            role="tab"
            aria-selected={i === idx}
            aria-label={`Quote ${idx + 1} of ${QUOTES.length}`}
            onClick={() => setI(idx)}
            className="group relative h-[3px] w-9 overflow-hidden rounded-full bg-[hsl(var(--paper))]/15 transition-colors hover:bg-[hsl(var(--paper))]/30"
          >
            <motion.span
              className="absolute inset-y-0 left-0 block bg-[hsl(var(--accent))]"
              initial={false}
              animate={{
                width: i === idx ? "100%" : "0%",
              }}
              transition={
                i === idx && !paused && !reduced
                  ? { duration: INTERVAL_MS / 1000, ease: "linear" }
                  : { duration: 0.2 }
              }
            />
          </button>
        ))}
      </div>
    </div>
  );
}
