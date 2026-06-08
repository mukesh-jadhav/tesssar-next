"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useReducedMotionSafe } from "@/components/motion/useReducedMotionSafe";

/**
 * GuidedBriefDialog — quick-pick alternative to the free-text brief.
 *
 * Five short questions (most are chip-pick) compose into a single
 * paragraph that's dropped into the parent's textarea. Far less
 * intimidating for users who don't know how to phrase a system
 * description from scratch.
 */
export function GuidedBriefDialog({
  open,
  onClose,
  onCompose,
}: {
  open: boolean;
  onClose: () => void;
  onCompose: (brief: string) => void;
}) {
  const [oneLiner, setOneLiner] = useState("");
  const [audience, setAudience] = useState<string>("Consumers");
  const [region, setRegion] = useState<string>("India");
  const [scale, setScale] = useState<string>("Up to 100K users");
  const [tier, setTier] = useState<string>("Growth-stage startup");
  const [needs, setNeeds] = useState<string[]>([]);
  const reduced = useReducedMotionSafe();

  // Close on Escape, lock body scroll while open
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  const ready = oneLiner.trim().length >= 6;

  function toggleNeed(n: string) {
    setNeeds((prev) => (prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n]));
  }

  function handleCompose() {
    if (!ready) return;
    const need = needs.length
      ? ` It must handle ${needs.map((n) => n.toLowerCase()).join(", ")}.`
      : "";
    const composed = [
      `${oneLiner.trim().replace(/\.$/, "")}.`,
      `It serves ${audience.toLowerCase()} primarily in ${region}.`,
      `Target scale: ${scale.toLowerCase()}.`,
      `Maturity: ${tier.toLowerCase()}.${need}`,
      `Recommend a production-ready cloud architecture on Google Cloud with components, scale tiers, INR cost estimates, risks, and security model.`,
    ].join(" ");
    onCompose(composed);
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="guided-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Guided brief"
          className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/40 backdrop-blur-sm p-4 md:p-10"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            className="relative my-auto w-full max-w-2xl rounded-3xl border border-[hsl(var(--line))] bg-[hsl(var(--paper))] shadow-2xl shadow-black/10"
            initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: 6 }}
            transition={
              reduced
                ? { duration: 0.18 }
                : { type: "spring", stiffness: 280, damping: 24, mass: 0.7 }
            }
          >
        {/* Header */}
        <div className="flex items-baseline justify-between border-b border-[hsl(var(--line))] px-7 pt-6 pb-4">
          <div>
            <span className="section-num text-[10.5px]">Guided brief</span>
            <h2 className="display mt-2 text-[26px] tracking-[-0.02em]">
              A few quick picks. <span className="serif italic accent">We write the brief.</span>
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid size-9 place-items-center rounded-full text-[hsl(var(--ink-3))] hover:bg-[hsl(var(--paper-2))] hover:text-[hsl(var(--ink))] -mr-1"
          >
            <span className="ms text-[20px]" aria-hidden>close</span>
          </button>
        </div>

        {/* Body */}
        <div className="space-y-6 px-7 py-6">
          <Field label="01" question="What does the system do?" hint="One line is enough. We'll fill in the rest.">
            <input
              type="text"
              autoFocus
              value={oneLiner}
              onChange={(e) => setOneLiner(e.target.value)}
              placeholder="e.g. Realtime collaborative whiteboard for design teams"
              maxLength={140}
              className="w-full rounded-xl border border-[hsl(var(--line))] bg-[hsl(var(--paper))] px-4 py-3 text-[15px] text-[hsl(var(--ink))] placeholder:text-[hsl(var(--ink-3))] focus:outline-none focus:border-[hsl(var(--ink))]"
            />
          </Field>

          <Field label="02" question="Who uses it?">
            <Chips
              value={audience}
              options={["Consumers", "Businesses", "Both"]}
              onChange={setAudience}
            />
          </Field>

          <Field label="03" question="Where do they live?">
            <Chips
              value={region}
              options={["India", "India + SEA", "India + Middle East", "Global"]}
              onChange={setRegion}
            />
          </Field>

          <Field label="04" question="How big does it need to get?">
            <Chips
              value={scale}
              options={["Up to 10K users", "Up to 100K users", "1M+ users", "10M+ users"]}
              onChange={setScale}
            />
          </Field>

          <Field label="05" question="What stage are you at?">
            <Chips
              value={tier}
              options={["Solo founder", "Growth-stage startup", "Enterprise"]}
              onChange={setTier}
            />
          </Field>

          <Field label="06" question="Anything special?" hint="Pick as many as apply.">
            <Chips
              multi
              value={needs}
              options={[
                "Realtime sync",
                "AI / LLM",
                "Offline-first",
                "Payments",
                "Live video",
                "Mobile-first",
                "Compliance (GDPR / DPDP / HIPAA)",
                "High-frequency analytics",
              ]}
              onChange={(v) => (Array.isArray(v) ? setNeeds(v) : toggleNeed(v))}
            />
          </Field>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t border-[hsl(var(--line))] px-7 py-4">
          <span className="text-[11.5px] text-[hsl(var(--ink-3))]">
            You can edit the brief after we compose it.
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full px-4 py-2 text-[13px] text-[hsl(var(--ink-2))] hover:text-[hsl(var(--ink))]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCompose}
              disabled={!ready}
              className={cn(
                "btn-pill press",
                ready
                  ? "btn-pill-accent"
                  : "!bg-[hsl(var(--paper-3))] !text-[hsl(var(--ink-3))] !border-[hsl(var(--paper-3))] cursor-not-allowed",
              )}
            >
              Compose brief
              <span className="ms text-[18px]" aria-hidden>arrow_forward</span>
            </button>
          </div>
        </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Field({
  label,
  question,
  hint,
  children,
}: {
  label: string;
  question: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-baseline gap-3">
        <span className="font-mono text-[10.5px] tabular-nums text-[hsl(var(--ink-3))]">{label}</span>
        <h3 className="text-[14px] font-medium text-[hsl(var(--ink))]">{question}</h3>
      </div>
      {hint && <p className="mt-1 text-[12px] text-[hsl(var(--ink-3))] pl-7">{hint}</p>}
      <div className="mt-2.5">{children}</div>
    </div>
  );
}

type ChipsProps =
  | { value: string; options: readonly string[]; onChange: (v: string) => void; multi?: false }
  | { value: string[]; options: readonly string[]; onChange: (v: string) => void; multi: true };

function Chips(props: ChipsProps) {
  const isActive = (opt: string) =>
    props.multi ? (props.value as string[]).includes(opt) : props.value === opt;

  return (
    <div className="flex flex-wrap gap-2">
      {props.options.map((opt) => {
        const active = isActive(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => props.onChange(opt)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-[12.5px] transition-colors press",
              active
                ? "border-[hsl(var(--ink))] bg-[hsl(var(--ink))] text-[hsl(var(--paper))]"
                : "border-[hsl(var(--line))] bg-[hsl(var(--paper))] text-[hsl(var(--ink-2))] hover:border-[hsl(var(--line-2))] hover:text-[hsl(var(--ink))]",
            )}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}
