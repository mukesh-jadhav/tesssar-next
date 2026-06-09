"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useReducedMotionSafe } from "@/components/motion/useReducedMotionSafe";
import { DIMENSIONS, type Dimension, type Variant } from "@/lib/studies/dimensions";
import {
  MAX_VARIANTS,
  MIN_VARIANTS,
  studyCost,
} from "@/lib/studies/pricing";
import type { DimensionId } from "@/types/study";
import {
  composeBriefWithPreferences,
  type BriefPreferences,
} from "@/lib/architectures/preferences";
import { formatCredits, isUnlimited } from "@/lib/credits/display";
import { RefineDisclosure } from "@/components/architecture/RefineDisclosure";

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

/**
 * Refine rows that would collide with the dimension the user is varying.
 * Hiding them avoids the "I asked for AWS + GCP variants but also set
 * Cloud to Azure in Refine" trap.
 */
function refineHideFields(
  dim: DimensionId,
): Array<"cloud" | "budget" | "audience" | "residency" | "compliance" | "existingStack"> {
  switch (dim) {
    case "cloud":        return ["cloud"];
    case "cost-posture": return ["budget"];
    default:             return [];
  }
}

/**
 * StudyBuilder — pick a brief, a comparison dimension, and 2-3 variants.
 *
 * Wires through to POST /api/studies and routes to /studies/[id] for the
 * live progress lanes. Mirrors NewArchitectureForm's interaction language
 * (auto-grow textarea, refine disclosure, ⌘↵ to submit) so the surface
 * feels native.
 */
export function StudyBuilder({ credits }: { credits: number }) {
  const router = useRouter();
  const reduced = useReducedMotionSafe();

  const [brief, setBrief] = useState("");
  const [prefs, setPrefs] = useState<BriefPreferences>({});
  const [refineOpen, setRefineOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [dimensionId, setDimensionId] = useState<DimensionId>("cloud");
  // Default to GCP + AWS — the most universally useful first comparison.
  const [variantIds, setVariantIds] = useState<string[]>(["gcp", "aws"]);
  const [submitting, setSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const dimension = useMemo<Dimension>(
    () => DIMENSIONS.find((d) => d.id === dimensionId)!,
    [dimensionId],
  );

  // Reset variant selection to the dimension's first two when switching.
  useEffect(() => {
    setVariantIds((prev) => {
      const valid = prev.filter((id) =>
        dimension.variants.some((v) => v.id === id),
      );
      if (valid.length >= MIN_VARIANTS) return valid;
      return dimension.variants.slice(0, 2).map((v) => v.id);
    });
  }, [dimension]);

  // Auto-grow textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 480) + "px";
  }, [brief]);

  const meetsMin = brief.trim().length >= 30;
  const variantCount = variantIds.length;
  const canSubmit =
    meetsMin && variantCount >= MIN_VARIANTS && variantCount <= MAX_VARIANTS;
  const cost = useMemo(
    () => (canSubmit ? studyCost(variantCount) : 0),
    [canSubmit, variantCount],
  );
  // Admins carry a sentinel `-1` balance (unlimited). The naive
  // `cost > credits` check would always be true for them and block the
  // CTA, so we short-circuit on `isUnlimited`.
  const unlimited = isUnlimited(credits);
  const insufficient = cost > 0 && !unlimited && cost > credits;

  function toggleVariant(id: string) {
    setVariantIds((prev) => {
      if (prev.includes(id)) {
        if (prev.length <= MIN_VARIANTS) {
          toast.message(`A study needs at least ${MIN_VARIANTS} variants.`);
          return prev;
        }
        return prev.filter((v) => v !== id);
      }
      if (prev.length >= MAX_VARIANTS) {
        toast.message(`Up to ${MAX_VARIANTS} variants per study.`);
        return prev;
      }
      // Preserve catalog order in the selection so columns render predictably.
      const order = dimension.variants.map((v) => v.id);
      const next = [...prev, id];
      next.sort((a, b) => order.indexOf(a) - order.indexOf(b));
      return next;
    });
  }

  async function handleSubmit() {
    if (submitting) return;
    if (!meetsMin) {
      toast.error("Add at least a sentence or two so the architect can work.");
      return;
    }
    if (insufficient) {
      toast.error("You're short on credits for this study.");
      router.push("/pricing");
      return;
    }
    setSubmitting(true);
    try {
      const composed = composeBriefWithPreferences(brief, prefs);
      const res = await fetch("/api/studies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brief: composed,
          dimension: dimensionId,
          variantIds,
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to start study");
      }
      const { id } = (await res.json()) as { id: string };
      router.push(`/studies/${id}`);
    } catch (err) {
      toast.error((err as Error).message || "Failed to start study");
      setSubmitting(false);
    }
  }

  return (
    <div className="m3-page-enter mx-auto w-full max-w-3xl">
      {/* ===== Brief ===== */}
      <motion.div
        animate={{
          borderColor: focused ? "hsl(var(--ink))" : "hsl(var(--line))",
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
          <span className="font-mono text-[11px] tabular-nums text-[hsl(var(--ink-3))] uppercase tracking-wider">
            {brief.length.toLocaleString("en-IN")} / 8,000
          </span>
        </div>

        <textarea
          ref={textareaRef}
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Describe the system to compare across variants. Same brief, multiple architectures — pick the dimension to vary below."
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

        <RefineDisclosure
          open={refineOpen}
          onToggle={() => setRefineOpen((v) => !v)}
          prefs={prefs}
          setPrefs={setPrefs}
          reduced={reduced}
          hideFields={refineHideFields(dimensionId)}
          intro={`Refine sets cross-cutting preferences (compliance, residency, budget) that apply to every variant. The dimension below — ${dimension.label.toLowerCase()} — already varies per column.`}
        />
      </motion.div>

      {/* ===== Dimension picker ===== */}
      <section className="mt-14">
        <div className="flex items-baseline justify-between border-b border-[hsl(var(--line))] pb-4">
          <span className="section-num">Compare across</span>
          <span className="hidden md:inline text-[12px] text-[hsl(var(--ink-3))]">
            One dimension per study
          </span>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-5">
          {DIMENSIONS.map((d) => {
            const active = d.id === dimensionId;
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => setDimensionId(d.id)}
                className={cn(
                  "group relative text-left rounded-2xl border p-4 transition-all press",
                  active
                    ? "border-[hsl(var(--ink))] bg-[hsl(var(--paper-2))]"
                    : "border-[hsl(var(--line))] hover:border-[hsl(var(--line-2))] hover:bg-[hsl(var(--paper-2))]",
                )}
                aria-pressed={active}
              >
                {active && (
                  <motion.span
                    layoutId="dim-active"
                    className="absolute inset-0 rounded-2xl ring-1 ring-[hsl(var(--accent))]/40 pointer-events-none"
                    transition={{ duration: 0.32, ease: EASE_OUT_EXPO }}
                  />
                )}
                <div className="flex items-center justify-between">
                  <span className="text-[14px] font-medium text-[hsl(var(--ink))]">
                    {d.label}
                  </span>
                  {active && (
                    <span
                      className="ms text-[16px] text-[hsl(var(--accent))]"
                      aria-hidden
                    >
                      check_circle
                    </span>
                  )}
                </div>
                <p className="mt-2 text-[12px] leading-snug text-[hsl(var(--ink-3))]">
                  {d.variants.map((v) => v.label).join(" · ")}
                </p>
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.p
            key={dimensionId}
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: -4 }}
            transition={{ duration: 0.28, ease: EASE_OUT_EXPO }}
            className="mt-5 text-[14px] leading-relaxed text-[hsl(var(--ink-2))]"
          >
            {dimension.description}
          </motion.p>
        </AnimatePresence>
      </section>

      {/* ===== Variant picker ===== */}
      <section className="mt-12">
        <div className="flex items-baseline justify-between border-b border-[hsl(var(--line))] pb-4">
          <span className="section-num">
            Pick variants ({variantCount}/{MAX_VARIANTS})
          </span>
          <span className="hidden md:inline text-[12px] text-[hsl(var(--ink-3))]">
            Choose 2 to {MAX_VARIANTS}
          </span>
        </div>

        <ul className="mt-2 divide-y divide-[hsl(var(--line))]">
          <AnimatePresence initial={false}>
            {dimension.variants.map((v) => (
              <VariantRow
                key={`${dimensionId}-${v.id}`}
                variant={v}
                selected={variantIds.includes(v.id)}
                disabled={
                  !variantIds.includes(v.id) &&
                  variantIds.length >= MAX_VARIANTS
                }
                onToggle={() => toggleVariant(v.id)}
                reduced={reduced}
              />
            ))}
          </AnimatePresence>
        </ul>
      </section>

      {/* ===== Submit bar ===== */}
      <section className="sticky bottom-4 mt-10">
        <motion.div
          layout
          transition={{ duration: 0.28, ease: EASE_OUT_EXPO }}
          className="card-paper flex flex-wrap items-center justify-between gap-4 p-4 md:p-5 shadow-[0_18px_40px_-20px_hsl(var(--ink)/0.18)]"
        >
          <div className="flex flex-col gap-1">
            <span className="text-[12px] uppercase font-mono tracking-wider text-[hsl(var(--ink-3))]">
              Study cost
            </span>
            <span className="flex items-baseline gap-2">
              <motion.span
                key={cost}
                initial={reduced ? { opacity: 1 } : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.32, ease: EASE_OUT_EXPO }}
                className="display-tight text-[28px] tabular-nums tracking-[-0.02em]"
              >
                {cost}
              </motion.span>
              <span className="text-[13px] text-[hsl(var(--ink-3))]">
                credits · ~3 min · {variantCount} parallel runs
              </span>
            </span>
            {insufficient && (
              <span className="text-[12px] text-[hsl(var(--bad))] mt-1">
                You have {formatCredits(credits)} credits — top up to run this study.
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <kbd className="hidden md:inline-flex items-center rounded-md border border-[hsl(var(--line-2))] bg-[hsl(var(--paper-2))] px-2 py-1 text-[11px] font-mono text-[hsl(var(--ink-3))]">
              ⌘↵
            </kbd>
            <SubmitButton
              submitting={submitting}
              disabled={!canSubmit || insufficient}
              onClick={handleSubmit}
              label={`Run study · ${cost} cr`}
            />
          </div>
        </motion.div>
      </section>
    </div>
  );
}

function VariantRow({
  variant,
  selected,
  disabled,
  onToggle,
  reduced,
}: {
  variant: Variant;
  selected: boolean;
  disabled: boolean;
  onToggle: () => void;
  reduced: boolean;
}) {
  return (
    <motion.li
      layout
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduced ? { opacity: 0 } : { opacity: 0, y: -4 }}
      transition={{ duration: 0.24, ease: EASE_OUT_EXPO }}
    >
      <button
        type="button"
        onClick={onToggle}
        disabled={disabled}
        aria-pressed={selected}
        className={cn(
          "group w-full grid grid-cols-[auto_1fr_auto] items-center gap-5 py-4 px-2 -mx-2 rounded-2xl text-left transition-colors",
          selected
            ? "bg-[hsl(var(--paper-2))]"
            : "hover:bg-[hsl(var(--paper-2))]",
          disabled && "opacity-40 cursor-not-allowed",
        )}
      >
        <span
          className={cn(
            "grid size-6 place-items-center rounded-full border transition-all",
            selected
              ? "bg-[hsl(var(--accent))] border-[hsl(var(--accent))] text-[hsl(var(--paper))] scale-110"
              : "border-[hsl(var(--line-2))] text-transparent",
          )}
          aria-hidden
        >
          <span className="ms text-[14px]">check</span>
        </span>
        <span>
          <span className="block text-[15px] font-medium text-[hsl(var(--ink))]">
            {variant.label}
          </span>
          <span className="block mt-0.5 text-[13px] text-[hsl(var(--ink-3))]">
            {variant.shortBlurb}
          </span>
        </span>
        <span
          className={cn(
            "ms text-[18px] transition-all",
            selected
              ? "text-[hsl(var(--ink))]"
              : "text-[hsl(var(--ink-3))] group-hover:translate-x-0.5",
          )}
          aria-hidden
        >
          {selected ? "task_alt" : "add"}
        </span>
      </button>
    </motion.li>
  );
}

function SubmitButton({
  submitting,
  disabled,
  onClick,
  label,
}: {
  submitting: boolean;
  disabled: boolean;
  onClick: () => void;
  label: string;
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
            <span className="ms text-[18px] animate-spin" aria-hidden>
              progress_activity
            </span>
            <span>Starting study…</span>
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
            {label}
            <span className="ms text-[18px]" aria-hidden>
              arrow_forward
            </span>
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
