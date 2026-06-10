"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { EditorialIllustration } from "@/components/empty/EditorialIllustration";
import { useReducedMotionSafe } from "@/components/motion/useReducedMotionSafe";

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

/**
 * FailedRunHero — what the user sees when a generation run fails. Replaces
 * the small bad-tinted card with a full editorial empty surface: broken-wire
 * illustration, refund affirmation, and a `Try again` CTA that pre-fills the
 * composer with the original brief.
 */
export function FailedRunHero({
  prompt,
  errorMessage,
}: {
  prompt: string;
  errorMessage?: string;
}) {
  const reduced = useReducedMotionSafe();
  const retryHref = `/new?seed=${encodeURIComponent(prompt)}`;

  return (
    <div className="flex-1 min-h-0 overflow-auto scrollbar-thin">
      <div className="mx-auto w-full max-w-[1100px] px-6 py-10 md:px-12 md:py-14 lg:px-16">
        {/* Masthead */}
        <div className="rule-dots flex items-baseline justify-between pb-4">
          <span className="tag tag-accent">Generation failed</span>
          <span className="eyebrow hidden md:inline">
            Credit <span className="text-[hsl(var(--ink))] font-medium">refunded</span> · safe to retry
          </span>
        </div>

        <motion.section
          initial={reduced ? false : { opacity: 0, y: 12 }}
          animate={reduced ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
          className="mt-12 card-paper px-8 py-14 md:px-16 md:py-20"
        >
          <div className="mx-auto grid w-full max-w-[920px] gap-12 md:grid-cols-[auto_1fr] md:items-center md:gap-16">
            <EditorialIllustration kind="broken-wire" className="w-[260px] md:w-[320px] mx-auto" />
            <div className="text-center md:text-left">
              <p className="section-num">Something snapped</p>
              <h2 className="display-tight mt-6 text-[clamp(2.2rem,5vw,4rem)] leading-[0.92] tracking-[-0.04em]">
                The wire broke<br />
                <span className="serif font-normal italic accent">— try it again.</span>
              </h2>
              <p className="mt-6 max-w-[48ch] text-[16px] leading-[1.55] text-[hsl(var(--ink-2))] mx-auto md:mx-0">
                The architect couldn&apos;t finish this one. Your credit has been
                refunded automatically — re-run the brief and we&apos;ll take another swing.
              </p>

              <div className="mt-9 flex flex-wrap items-center justify-center gap-3 md:justify-start">
                <Link href={retryHref} className="btn-pill btn-pill-accent btn-pill-lg">
                  Try again
                  <span className="ms text-[20px]" aria-hidden>autorenew</span>
                </Link>
                <Link href="/dashboard" className="btn-pill btn-pill-ghost btn-pill-lg">
                  Back to dashboard
                </Link>
              </div>
            </div>
          </div>

          {/* Brief readback — gives context for the retry */}
          {prompt && (
            <div className="mt-14 border-t border-[hsl(var(--line))] pt-8">
              <div className="flex items-baseline justify-between pb-3">
                <p className="section-num">The brief (pre-filled on retry)</p>
              </div>
              <blockquote className="mt-2 rounded-2xl border border-[hsl(var(--line))] bg-[hsl(var(--paper-2))] p-6 text-[15px] leading-[1.6] text-[hsl(var(--ink))]">
                {prompt}
              </blockquote>
            </div>
          )}

          {/* Diagnostics — collapsed by default visually, but accessible */}
          {errorMessage && (
            <details className="mt-8 group">
              <summary className="cursor-pointer list-none flex items-center gap-2 text-[12px] font-mono uppercase tracking-[0.18em] text-[hsl(var(--ink-3))] hover:text-[hsl(var(--ink-2))] transition-colors">
                <span className="ms text-[16px] transition-transform group-open:rotate-90" aria-hidden>chevron_right</span>
                Diagnostic details
              </summary>
              <pre className="mt-3 overflow-x-auto rounded-xl border border-[hsl(var(--line))] bg-[hsl(var(--paper))] p-4 text-[12px] leading-[1.5] text-[hsl(var(--ink-2))] scrollbar-thin">
                {errorMessage}
              </pre>
            </details>
          )}
        </motion.section>
      </div>
    </div>
  );
}
