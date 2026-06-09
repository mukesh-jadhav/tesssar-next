"use client";

import { useMemo } from "react";
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

  const completed = useMemo(
    () => SLICES.every((s) => picks[s.id] != null),
    [picks],
  );

  const filledCount = SLICES.filter((s) => picks[s.id] != null).length;

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
    // Phase 3 placeholder: the synthesis API lands in Phase 6.
    toast.message(
      "Synthesis ships in the next release — your picks are saved in the cockpit.",
    );
  }

  return (
    <div className="border-t border-[hsl(var(--line))] bg-[hsl(var(--paper-2))]/50 backdrop-blur-sm">
      <div className="grid gap-3 px-4 md:px-6 py-4 lg:grid-cols-[1fr_auto] items-center">
        {/* === Slice picker rows === */}
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
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

        {/* === Synthesize CTA === */}
        <div className="flex items-center justify-end gap-3 lg:pl-4 lg:border-l lg:border-[hsl(var(--line))]">
          <div className="text-right">
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[hsl(var(--ink-3))]">
              Picks
            </div>
            <div className="display-tight text-[18px] tabular-nums">
              {filledCount}
              <span className="text-[hsl(var(--ink-3))]">/{SLICES.length}</span>
            </div>
          </div>
          <motion.button
            type="button"
            onClick={handleSynthesize}
            disabled={busy || !completed}
            layout
            transition={{ duration: 0.28, ease: EASE_OUT_EXPO }}
            className={cn(
              "btn-pill press relative overflow-hidden",
              busy
                ? "btn-pill-accent !cursor-wait"
                : completed
                  ? "btn-pill-accent"
                  : "!bg-[hsl(var(--paper-3))] !text-[hsl(var(--ink-3))] !border-[hsl(var(--paper-3))] cursor-not-allowed",
            )}
          >
            <AnimatePresence mode="wait" initial={false}>
              {busy ? (
                <motion.span
                  key="busy"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2"
                >
                  <span className="ms text-[18px] animate-spin" aria-hidden>
                    progress_activity
                  </span>
                  Synthesizing…
                </motion.span>
              ) : (
                <motion.span
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2"
                >
                  Synthesize · {SYNTHESIS_COST_CREDITS} cr
                  <span className="ms text-[18px]" aria-hidden>
                    auto_awesome
                  </span>
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </div>
    </div>
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
    <div className="grid grid-cols-[auto_1fr] items-center gap-3 rounded-xl border border-[hsl(var(--line))] bg-[hsl(var(--card))] px-3 py-2">
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
                "relative rounded-full border px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wider transition-colors",
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
                  className="absolute inset-0 rounded-full bg-[hsl(var(--ink))]"
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
