"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { GuidedBriefDialog } from "@/components/architecture/GuidedBriefDialog";
import { RecentBriefsRail, type RecentBrief } from "@/components/architecture/RecentBriefsRail";
import { RefineDisclosure } from "@/components/architecture/RefineDisclosure";
import { canAffordRun } from "@/lib/credits/display";
import { useReducedMotionSafe } from "@/components/motion/useReducedMotionSafe";
import {
  composeBriefWithPreferences,
  type BriefPreferences,
} from "@/lib/architectures/preferences";

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

const EXAMPLES = [
  {
    n: "01",
    label: "Realtime collaborative whiteboard",
    seed:
      "Realtime collaborative whiteboard for design teams. Low-latency cursors, infinite canvas, version history, AI-assisted suggestions. 50K users in year 1, India + SEA. Free + Pro plans.",
  },
  {
    n: "02",
    label: "B2B logistics with live GPS",
    seed:
      "B2B logistics platform that ingests GPS pings from 100K trucks every 5 seconds, computes ETAs, dispatches alerts. India-first, integrates with TMS systems.",
  },
  {
    n: "03",
    label: "AI customer support copilot",
    seed:
      "AI-powered customer support copilot for D2C brands. Reads ticket history, drafts replies, escalates to human, integrates with Shopify + WhatsApp Business API.",
  },
  {
    n: "04",
    label: "ABDM-compliant health vault",
    seed:
      "Privacy-preserving health records vault for Indian hospitals. ABDM compliant, end-to-end encrypted, consent-based sharing, audit log, mobile + web.",
  },
] as const;

function countWords(s: string): number {
  const trimmed = s.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

type WordRange = "empty" | "thin" | "ideal" | "long" | "verbose";

function rangeFor(words: number): WordRange {
  if (words === 0) return "empty";
  if (words < 60) return "thin";
  if (words < 200) return "ideal"; // we count anything < 200 as approaching ideal
  if (words <= 400) return "ideal";
  if (words <= 700) return "long";
  return "verbose";
}

const RANGE_COLOR: Record<WordRange, string> = {
  empty: "hsl(var(--ink-3))",
  thin: "hsl(var(--ink-3))",
  ideal: "hsl(var(--accent))",
  long: "hsl(var(--warn))",
  verbose: "hsl(var(--bad))",
};

export function NewArchitectureForm({
  credits,
  seed,
  recentBriefs = [],
}: {
  credits: number;
  seed?: string;
  recentBriefs?: RecentBrief[];
}) {
  const router = useRouter();
  const reduced = useReducedMotionSafe();
  const [brief, setBrief] = useState(seed ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [guidedOpen, setGuidedOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [showCoach, setShowCoach] = useState(false);
  const [prefs, setPrefs] = useState<BriefPreferences>({});
  const [refineOpen, setRefineOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const idleTimerRef = useRef<number | null>(null);

  // Auto-grow textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 480) + "px";
  }, [brief]);

  useEffect(() => {
    if (seed && textareaRef.current) textareaRef.current.focus();
  }, [seed]);

  // Coaching prompt — show after 3s of empty + unfocused textarea
  useEffect(() => {
    if (idleTimerRef.current !== null) {
      window.clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
    if (brief.trim().length === 0 && !focused && !guidedOpen) {
      idleTimerRef.current = window.setTimeout(() => setShowCoach(true), 3000);
    } else {
      setShowCoach(false);
    }
    return () => {
      if (idleTimerRef.current !== null) window.clearTimeout(idleTimerRef.current);
    };
  }, [brief, focused, guidedOpen]);

  async function handleSubmit() {
    if (submitting) return;
    if (brief.trim().length < 30) {
      toast.error("Add at least a sentence or two so the architect can work.");
      return;
    }
    if (!canAffordRun(credits)) {
      toast.error("You're out of credits. Top up to continue.");
      router.push("/pricing");
      return;
    }

    setSubmitting(true);
    try {
      const composed = composeBriefWithPreferences(brief, prefs);
      const res = await fetch("/api/architect/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief: composed }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to start generation");
      }
      const { id } = (await res.json()) as { id: string };
      router.push(`/architecture/${id}`);
    } catch (err) {
      toast.error((err as Error).message || "Failed to start generation");
      setSubmitting(false);
    }
  }

  const words = countWords(brief);
  const range = rangeFor(words);
  const meetsMin = brief.trim().length >= 30;

  // ===== Layout: 3-col on xl with recent briefs rail, single column otherwise =====
  return (
    <div className="m3-page-enter grid gap-10 xl:grid-cols-[1fr_280px]">
      <div className="mx-auto w-full max-w-3xl">
        <motion.div
          animate={{
            borderColor: focused
              ? "hsl(var(--ink))"
              : "hsl(var(--line))",
            boxShadow: focused
              ? "0 0 0 4px hsl(var(--accent) / 0.08), 0 0 32px -8px hsl(var(--accent) / 0.18) inset"
              : "0 0 0 0 transparent",
          }}
          transition={{ duration: 0.22, ease: EASE_OUT_EXPO }}
          className="card-paper relative overflow-hidden p-6 md:p-8"
          style={{ borderWidth: 1, borderStyle: "solid" }}
        >
          <div className="flex items-baseline justify-between pb-4 border-b border-[hsl(var(--line))]">
            <span className="section-num">Brief</span>
            <WordCounter words={words} range={range} chars={brief.length} />
          </div>

          <textarea
            ref={textareaRef}
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Describe the system you'd like to build in plain English. Audience, scale, geography, constraints — the more context, the sharper the design."
            maxLength={8000}
            rows={4}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            className="block w-full resize-none bg-transparent pt-6 pb-4 text-[17px] leading-[1.55] text-[hsl(var(--ink))] placeholder:text-[hsl(var(--ink-3))] focus:outline-none scrollbar-thin"
          />

          {/* Coaching prompt — appears after 3s of idle empty textarea */}
          <AnimatePresence initial={false}>
            {showCoach && (
              <motion.button
                key="coach"
                type="button"
                onClick={() => setGuidedOpen(true)}
                initial={reduced ? { opacity: 1 } : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduced ? { opacity: 0 } : { opacity: 0, y: -4 }}
                transition={{ duration: 0.42, ease: EASE_OUT_EXPO }}
                className="group flex items-center gap-2 text-[13px] text-[hsl(var(--ink-3))] hover:text-[hsl(var(--ink))] transition-colors mb-2 -mt-2"
              >
                <span className="ms text-[16px] text-[hsl(var(--accent))]" aria-hidden>auto_awesome</span>
                Not sure where to start? <span className="underline underline-offset-4 decoration-[hsl(var(--accent))]/40 group-hover:decoration-[hsl(var(--accent))]">Build it together</span>
                <span className="ms text-[14px] group-hover:translate-x-0.5 transition-transform" aria-hidden>arrow_forward</span>
              </motion.button>
            )}
          </AnimatePresence>

          <RefineDisclosure
            open={refineOpen}
            onToggle={() => setRefineOpen((v) => !v)}
            prefs={prefs}
            setPrefs={setPrefs}
            reduced={reduced}
          />

          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[hsl(var(--line))]">
            <span className="text-[12px] text-[hsl(var(--ink-3))]">
              ₹300 per design · refunded automatically on failure ·{" "}
              <a
                href="/studies/new"
                className="text-[hsl(var(--ink-2))] underline underline-offset-4 decoration-[hsl(var(--accent))]/40 hover:decoration-[hsl(var(--accent))] hover:text-[hsl(var(--ink))] transition-colors"
              >
                or compare side-by-side
              </a>
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setGuidedOpen(true)}
                className="hidden md:inline-flex items-center gap-1.5 border border-[hsl(var(--line-2))] px-3 py-1.5 text-[12px] text-[hsl(var(--ink-2))] hover:text-[hsl(var(--ink))] hover:bg-[hsl(var(--paper-2))] transition-colors"
                title="Build the brief with guided questions"
              >
                <span className="ms text-[16px]" aria-hidden>auto_awesome</span>
                Build my brief
              </button>
              <kbd className="hidden md:inline-flex items-center rounded-md border border-[hsl(var(--line-2))] bg-[hsl(var(--paper-2))] px-2 py-1 text-[11px] font-mono text-[hsl(var(--ink-3))]">
                ⌘↵
              </kbd>
              <SubmitButton
                submitting={submitting}
                disabled={!meetsMin}
                onClick={handleSubmit}
              />
            </div>
          </div>
        </motion.div>

        {/* Examples */}
        <div className="mt-12">
          <div className="flex items-baseline justify-between border-b border-[hsl(var(--line))] pb-4">
            <span className="section-num">Or try one of these</span>
          </div>
          <ul className="mt-2 divide-y divide-[hsl(var(--line))]">
            {EXAMPLES.map((ex) => (
              <li key={ex.label}>
                <button
                  type="button"
                  onClick={() => { setBrief(ex.seed); textareaRef.current?.focus(); }}
                  className="group w-full grid grid-cols-[auto_1fr_auto] items-center gap-6 py-5 text-left transition-colors hover:bg-[hsl(var(--paper-2))] px-2 -mx-2 rounded-2xl"
                >
                  <span className="display text-[28px] tracking-[-0.04em] text-[hsl(var(--ink-3))] group-hover:text-[hsl(var(--accent))] transition-colors w-12">
                    {ex.n}
                  </span>
                  <span className="display text-[clamp(1rem,1.8vw,1.4rem)] leading-tight tracking-[-0.02em]">
                    {ex.label}
                  </span>
                  <span className="ms text-[20px] text-[hsl(var(--ink-3))] group-hover:text-[hsl(var(--ink))] group-hover:translate-x-1 transition-all" aria-hidden>
                    north_east
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <GuidedBriefDialog
          open={guidedOpen}
          onClose={() => setGuidedOpen(false)}
          onCompose={(composed) => {
            setBrief(composed);
            setGuidedOpen(false);
            requestAnimationFrame(() => textareaRef.current?.focus());
          }}
        />
      </div>

      {recentBriefs.length > 0 && (
        <div className="hidden xl:block">
          <div className="sticky top-20">
            <RecentBriefsRail
              briefs={recentBriefs}
              onUseAsTemplate={(b) => {
                setBrief(b.prompt);
                requestAnimationFrame(() => {
                  textareaRef.current?.focus();
                  textareaRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                });
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function WordCounter({
  words,
  range,
  chars,
}: {
  words: number;
  range: WordRange;
  chars: number;
}) {
  const color = RANGE_COLOR[range];
  const label =
    range === "empty"   ? "ideal 200–400 words"
  : range === "thin"    ? "keep going · ideal 200–400"
  : range === "ideal"   ? "ideal range"
  : range === "long"    ? "getting long · trim if you can"
  : "very long · consider trimming";

  return (
    <motion.span
      className="font-mono text-[11px] tabular-nums uppercase tracking-wider flex items-center gap-2"
      animate={{ color }}
      transition={{ duration: 0.3, ease: EASE_OUT_EXPO }}
    >
      <span>{words.toLocaleString("en-IN")} {words === 1 ? "word" : "words"}</span>
      <span className="opacity-60">·</span>
      <span className="hidden sm:inline">{label}</span>
      <span className="hidden md:inline opacity-60">·</span>
      <span className="hidden md:inline opacity-70">
        {chars.toLocaleString("en-IN")} / 8,000
      </span>
    </motion.span>
  );
}

function SubmitButton({
  submitting,
  disabled,
  onClick,
}: {
  submitting: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={submitting || disabled}
      layout
      transition={{ duration: 0.28, ease: EASE_OUT_EXPO }}
      className={cn(
        "btn-pill press relative overflow-hidden",
        submitting
          ? "btn-pill-accent !cursor-wait"
          : disabled
            ? "!bg-[hsl(var(--paper-3))] !text-[hsl(var(--ink-3))] !border-[hsl(var(--paper-3))] cursor-not-allowed"
            : "btn-pill-accent",
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        {submitting ? (
          <motion.span
            key="streaming"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="relative flex items-center gap-2"
          >
            <span className="ms text-[18px] animate-spin" aria-hidden>progress_activity</span>
            <span className="flex flex-col items-start leading-tight">
              <span>Starting the architect</span>
              <span className="text-[10px] font-mono uppercase tracking-[0.18em] opacity-80">streaming…</span>
            </span>
            <span
              aria-hidden
              className="absolute inset-x-0 bottom-0 h-[2px] bg-[hsl(var(--paper))]/60 origin-left animate-[bar_2.4s_linear_infinite]"
              style={{ animationName: "bar" }}
            />
          </motion.span>
        ) : (
          <motion.span
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="flex items-center gap-2"
          >
            Generate
            <span className="ms text-[18px]" aria-hidden>arrow_forward</span>
          </motion.span>
        )}
      </AnimatePresence>

      <style jsx>{`
        @keyframes bar {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </motion.button>
  );
}
