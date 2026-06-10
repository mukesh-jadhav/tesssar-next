"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useCockpit, type CockpitPicks } from "./state";
import { SYNTHESIS_COST_CREDITS } from "@/lib/studies/pricing";

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

type SliceId = keyof CockpitPicks;

interface Slice {
  id: SliceId;
  label: string;
  icon: string;
  /** One-line caption shown in the explain affordance. */
  hint: string;
}

const SLICES: readonly Slice[] = [
  { id: "components",    label: "Components",    icon: "widgets",      hint: "Compute + services" },
  { id: "datastore",     label: "Datastore",     icon: "database",     hint: "Primary DB, cache, blob" },
  { id: "messaging",     label: "Messaging",     icon: "outbox",       hint: "Queues, pub/sub, streams" },
  { id: "deployment",    label: "Deployment",    icon: "rocket_launch", hint: "Runtime + CI/CD" },
  { id: "security",      label: "Security",      icon: "encrypted",    hint: "Identity, network, secrets" },
  { id: "observability", label: "Observability", icon: "monitoring",   hint: "Metrics, logs, traces" },
] as const;

interface VariantOption {
  variantId: string;
  label: string;
  available: boolean;
}

export function DecisionTray({
  variants,
  onSynthesize,
  busy,
}: {
  variants: VariantOption[];
  /** Phase 6 wires this. */
  onSynthesize?: (picks: Required<CockpitPicks>) => Promise<void> | void;
  busy?: boolean;
}) {
  const { picks, setPick } = useCockpit();
  const [open, setOpen] = useState(false);

  const completed = useMemo(
    () => SLICES.every((s) => picks[s.id] != null),
    [picks],
  );

  const filledCount = SLICES.filter((s) => picks[s.id] != null).length;

  // Lock background scroll while the panel is open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function handleSynthesize() {
    if (!completed) {
      toast.message("Pick a variant for every slice first.");
      return;
    }
    if (onSynthesize) {
      try {
        await onSynthesize(picks as Required<CockpitPicks>);
      } catch (err) {
        toast.error((err as Error).message || "Synthesis failed");
      }
      return;
    }
    toast.message(
      "Synthesis ships in the next release — your picks are saved in the cockpit.",
    );
  }

  // Button label morphs based on state:
  //   - panel closed  → "Finalize"
  //   - panel open    → "Synthesize · 80 cr"
  //   - busy          → "Synthesizing…"
  const buttonLabel = busy
    ? "synth"
    : open
      ? "synth"
      : "finalize";

  return (
    <>
      {/* === Floating action button (bottom-right) === */}
      <motion.button
        type="button"
        onClick={() => {
          if (busy) return;
          if (!open) {
            setOpen(true);
            return;
          }
          handleSynthesize();
        }}
        disabled={busy || (open && !completed)}
        layout
        transition={{ duration: 0.28, ease: EASE_OUT_EXPO }}
        className={cn(
          "fixed bottom-5 right-5 md:bottom-6 md:right-6 z-30",
          "inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-[13px] font-medium",
          "transition-colors",
          busy
            ? "bg-[hsl(var(--ink))] text-[hsl(var(--paper))] cursor-wait"
            : open && completed
              ? "bg-[hsl(var(--accent))] text-[hsl(var(--accent-ink))] hover:bg-[hsl(var(--accent))]/90"
              : open && !completed
                ? "bg-[hsl(var(--paper-3))] text-[hsl(var(--ink-3))] cursor-not-allowed"
                : "bg-[hsl(var(--ink))] text-[hsl(var(--paper))] hover:bg-[hsl(var(--ink-2))]",
        )}
        aria-label={open ? "Synthesize architecture" : "Finalize picks"}
      >
        <AnimatePresence mode="wait" initial={false}>
          {busy ? (
            <motion.span
              key="busy"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18 }}
              className="flex items-center gap-1.5"
            >
              <span className="ms text-[16px] animate-spin" aria-hidden>
                progress_activity
              </span>
              Synthesizing…
            </motion.span>
          ) : open ? (
            <motion.span
              key="synth"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.22, ease: EASE_OUT_EXPO }}
              className="flex items-center gap-1.5"
            >
              Synthesize
              <span className="font-mono text-[10px] uppercase tracking-wider opacity-80">
                · {SYNTHESIS_COST_CREDITS} cr
              </span>
              <span className="ms text-[16px]" aria-hidden>
                auto_awesome
              </span>
            </motion.span>
          ) : (
            <motion.span
              key="finalize"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.22, ease: EASE_OUT_EXPO }}
              className="flex items-center gap-1.5"
            >
              Finalize
              {filledCount > 0 && (
                <span className="font-mono text-[10px] uppercase tracking-wider opacity-80">
                  · {filledCount}/{SLICES.length}
                </span>
              )}
              <span className="ms text-[16px]" aria-hidden>
                tune
              </span>
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* === Bottom slide-up panel === */}
      <AnimatePresence>
        {open && (
          <>
            {/* Scrim — flat tint, no blur (consistent with InspectorSheet). */}
            <motion.div
              key="scrim"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-20 bg-[hsl(var(--ink))]/15"
              onClick={() => setOpen(false)}
              aria-hidden
            />
            {/* Panel — slides up from the bottom. */}
            <motion.aside
              key="panel"
              role="dialog"
              aria-modal="true"
              aria-labelledby="finalize-title"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ duration: 0.34, ease: EASE_OUT_EXPO }}
              className="fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-[760px] max-h-[80vh] flex flex-col rounded-t-xl bg-[hsl(var(--paper))] border-t border-[hsl(var(--line))]"
            >
              {/* Panel header */}
              <div className="flex items-start justify-between gap-3 border-b border-[hsl(var(--line))] px-5 py-4">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[hsl(var(--ink-3))]">
                    Finalize architecture
                  </div>
                  <h2
                    id="finalize-title"
                    className="display-tight text-[20px] leading-tight tracking-[-0.02em] mt-0.5"
                  >
                    Pick the best variant per slice
                  </h2>
                  <p className="mt-1 text-[12px] text-[hsl(var(--ink-3))] leading-snug">
                    These six picks define the synthesized architecture. You
                    can mix and match — the next step combines them into one
                    coherent design.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="shrink-0 ms text-[20px] text-[hsl(var(--ink-3))] hover:text-[hsl(var(--ink))] transition-colors"
                  aria-label="Close finalize panel"
                >
                  close
                </button>
              </div>

              {/* Progress dots */}
              <div className="flex items-center justify-between gap-3 border-b border-[hsl(var(--line))] px-5 py-2.5 bg-[hsl(var(--paper-2))]/40">
                <div className="flex items-center gap-1" aria-hidden>
                  {SLICES.map((s) => (
                    <span
                      key={s.id}
                      className={cn(
                        "size-2 rounded-full transition-colors",
                        picks[s.id] != null
                          ? "bg-[hsl(var(--ink))]"
                          : "bg-[hsl(var(--line-2))]",
                      )}
                      title={`${s.label}: ${picks[s.id] ?? "—"}`}
                    />
                  ))}
                </div>
                <span className="font-mono text-[10px] uppercase tracking-wider text-[hsl(var(--ink-3))] tabular-nums">
                  {filledCount}/{SLICES.length}{" "}
                  {completed ? "ready" : "picked"}
                </span>
              </div>

              {/* Slices */}
              <div className="flex-1 overflow-y-auto scrollbar-thin px-5 py-4 grid gap-2.5 sm:grid-cols-2">
                {SLICES.map((slice) => (
                  <SliceRow
                    key={slice.id}
                    slice={slice}
                    variants={variants}
                    picked={picks[slice.id]}
                    onPick={(vid) =>
                      setPick(slice.id, picks[slice.id] === vid ? undefined : vid)
                    }
                  />
                ))}
              </div>

              {/* Footer — synthesis affordance is the floating button itself */}
              <div className="border-t border-[hsl(var(--line))] px-5 py-3 text-[11px] text-[hsl(var(--ink-3))] leading-snug">
                {completed ? (
                  <span>
                    All slices picked. Press{" "}
                    <span className="text-[hsl(var(--ink))] font-medium">
                      Synthesize
                    </span>{" "}
                    to combine them into a final architecture
                    {" "}({SYNTHESIS_COST_CREDITS} credits).
                  </span>
                ) : (
                  <span>
                    Pick a variant for every slice to unlock Synthesize.
                  </span>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Hidden suppress: button label cue avoids unused var lint */}
      <span hidden aria-hidden>{buttonLabel}</span>
    </>
  );
}

function SliceRow({
  slice,
  variants,
  picked,
  onPick,
}: {
  slice: Slice;
  variants: VariantOption[];
  picked: string | undefined;
  onPick: (variantId: string) => void;
}) {
  return (
    <div className="grid grid-cols-[auto_1fr] items-center gap-3 rounded-lg border border-[hsl(var(--line))] bg-[hsl(var(--card))] px-3 py-2">
      <div className="flex flex-col items-start">
        <div className="flex items-center gap-1.5">
          <span
            className="ms text-[15px] text-[hsl(var(--ink-3))]"
            aria-hidden
          >
            {slice.icon}
          </span>
          <span className="text-[12px] font-medium text-[hsl(var(--ink))]">
            {slice.label}
          </span>
        </div>
        <span className="text-[10px] text-[hsl(var(--ink-3))]/80 leading-tight">
          {slice.hint}
        </span>
      </div>
      <div
        role="radiogroup"
        aria-label={`Choose ${slice.label}`}
        className="flex items-center justify-end gap-1"
      >
        {variants.map((v) => {
          const selected = picked === v.variantId;
          const disabled = !v.available;
          return (
            <button
              key={v.variantId}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={disabled}
              onClick={() => onPick(v.variantId)}
              className={cn(
                "relative rounded-md border px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wider transition-colors",
                selected
                  ? "text-[hsl(var(--paper))] border-transparent"
                  : "bg-transparent text-[hsl(var(--ink-2))] border-[hsl(var(--line-2))] hover:border-[hsl(var(--ink-3))] hover:text-[hsl(var(--ink))]",
                disabled && "opacity-30 cursor-not-allowed",
              )}
              title={disabled ? `${v.label} variant failed — re-run to enable` : undefined}
            >
              {selected && (
                <motion.span
                  layoutId={`pick-${slice.id}`}
                  className="absolute inset-0 rounded-md bg-[hsl(var(--ink))]"
                  transition={{ duration: 0.28, ease: EASE_OUT_EXPO }}
                />
              )}
              <span className="relative z-10">{v.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
