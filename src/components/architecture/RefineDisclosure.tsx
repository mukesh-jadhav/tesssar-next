"use client";

/**
 * Reusable Refine ▾ disclosure — six optional preference chips that
 * compose into the user's brief before send.
 *
 * Used by both NewArchitectureForm (/new) and HomeCockpit (/studio) so
 * that whichever entrypoint the user picks, they get the same controls.
 */

import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  AUDIENCE_OPTIONS,
  BUDGET_OPTIONS,
  CLOUD_OPTIONS,
  COMPLIANCE_OPTIONS,
  RESIDENCY_OPTIONS,
  preferenceCount,
  type AudienceChoice,
  type BriefPreferences,
  type BudgetChoice,
  type CloudChoice,
  type ComplianceChoice,
  type ResidencyChoice,
} from "@/lib/architectures/preferences";

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

export function RefineDisclosure({
  open,
  onToggle,
  prefs,
  setPrefs,
  reduced,
  compact = false,
  hideFields,
  intro,
}: {
  open: boolean;
  onToggle: () => void;
  prefs: BriefPreferences;
  setPrefs: (next: BriefPreferences) => void;
  reduced: boolean;
  /** Tighter spacing for the inline cockpit layout. */
  compact?: boolean;
  /**
   * Suppress refine rows that would conflict with another picker on the
   * same page (e.g. hide "Cloud" inside the study builder when the
   * dimension *is* cloud).
   */
  hideFields?: Array<"cloud" | "budget" | "audience" | "residency" | "compliance" | "existingStack">;
  /** Optional one-liner shown above the rows when the panel is open. */
  intro?: string;
}) {
  const count = preferenceCount(prefs);
  const hidden = new Set(hideFields ?? []);

  return (
    <div className={compact ? "mt-1" : "mt-2"}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="group flex items-center gap-1.5 text-[12px] text-[hsl(var(--ink-3))] hover:text-[hsl(var(--ink))] transition-colors"
      >
        <span className="ms text-[15px]" aria-hidden>
          tune
        </span>
        Refine
        {count > 0 && (
          <span className="bg-[hsl(var(--accent))]/15 px-1.5 py-0.5 font-mono text-[10px] tabular-nums text-[hsl(var(--accent))]">
            {count}
          </span>
        )}
        <span
          className={cn(
            "ms text-[15px] transition-transform",
            open && "rotate-180",
          )}
          aria-hidden
        >
          expand_more
        </span>
        <span className="ml-1 text-[hsl(var(--ink-3))] opacity-70">
          {open ? "Cloud, compliance, budget…" : "Cloud, compliance, budget — optional"}
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="refine"
            initial={reduced ? { opacity: 0 } : { opacity: 0, height: 0 }}
            animate={reduced ? { opacity: 1 } : { opacity: 1, height: "auto" }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, height: 0 }}
            transition={{ duration: 0.28, ease: EASE_OUT_EXPO }}
            className="overflow-hidden"
          >
            <div
              className={cn(
                "mt-3 grid gap-4 rounded-2xl border border-dashed border-[hsl(var(--line))] bg-[hsl(var(--paper-2))]/40",
                compact ? "p-3.5" : "p-4 md:p-5",
              )}
            >
              {intro && (
                <p className="text-[12px] leading-snug text-[hsl(var(--ink-3))]">
                  {intro}
                </p>
              )}
              {!hidden.has("cloud") && (
                <RefineRow label="Cloud" compact={compact}>
                  <SingleChips
                    options={CLOUD_OPTIONS}
                    value={prefs.cloud}
                    onChange={(v) => setPrefs({ ...prefs, cloud: v as CloudChoice })}
                  />
                </RefineRow>
              )}

              {!hidden.has("budget") && (
                <RefineRow label="Budget" compact={compact}>
                  <SingleChips
                    options={BUDGET_OPTIONS}
                    value={prefs.budget}
                    onChange={(v) => setPrefs({ ...prefs, budget: v as BudgetChoice })}
                  />
                </RefineRow>
              )}

              {!hidden.has("audience") && (
                <RefineRow label="Audience" compact={compact}>
                  <SingleChips
                    options={AUDIENCE_OPTIONS}
                    value={prefs.audience}
                    onChange={(v) => setPrefs({ ...prefs, audience: v as AudienceChoice })}
                  />
                </RefineRow>
              )}

              {!hidden.has("residency") && (
                <RefineRow label="Residency" compact={compact}>
                  <SingleChips
                    options={RESIDENCY_OPTIONS}
                    value={prefs.residency}
                    onChange={(v) => setPrefs({ ...prefs, residency: v as ResidencyChoice })}
                  />
                </RefineRow>
              )}

              {!hidden.has("compliance") && (
                <RefineRow label="Compliance" hint="Pick all that apply" compact={compact}>
                  <MultiChips
                    options={COMPLIANCE_OPTIONS}
                    value={prefs.compliance ?? []}
                    onToggle={(v) => {
                      const current = prefs.compliance ?? [];
                      const next = current.includes(v as ComplianceChoice)
                        ? current.filter((x) => x !== v)
                        : [...current, v as ComplianceChoice];
                      setPrefs({ ...prefs, compliance: next });
                    }}
                  />
                </RefineRow>
              )}

              {!hidden.has("existingStack") && (
                <RefineRow label="Existing stack" hint="Optional · one line" compact={compact}>
                  <input
                    type="text"
                    value={prefs.existingStack ?? ""}
                    onChange={(e) => setPrefs({ ...prefs, existingStack: e.target.value })}
                    placeholder="e.g. Postgres + Kafka + Node, already on AWS"
                    maxLength={300}
                    className="w-full rounded-lg border border-[hsl(var(--line))] bg-[hsl(var(--paper))] px-3 py-2 text-[13px] text-[hsl(var(--ink))] placeholder:text-[hsl(var(--ink-3))] focus:outline-none focus:border-[hsl(var(--ink))]"
                  />
                </RefineRow>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function RefineRow({
  label,
  hint,
  children,
  compact,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  compact: boolean;
}) {
  return (
    <div
      className={cn(
        "grid items-start gap-2",
        compact
          ? "md:grid-cols-[100px_1fr] md:gap-3"
          : "md:grid-cols-[120px_1fr] md:gap-4",
      )}
    >
      <div className="md:pt-1.5">
        <div className="text-[12px] font-medium text-[hsl(var(--ink-2))]">{label}</div>
        {hint && <div className="text-[10.5px] text-[hsl(var(--ink-3))]">{hint}</div>}
      </div>
      <div>{children}</div>
    </div>
  );
}

function SingleChips({
  options,
  value,
  onChange,
}: {
  options: readonly string[];
  value: string | undefined;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => {
        const active = value === opt;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={cn(
              "border px-3 py-1 text-[12px] transition-colors press",
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

function MultiChips({
  options,
  value,
  onToggle,
}: {
  options: readonly string[];
  value: readonly string[];
  onToggle: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => {
        const active = value.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onToggle(opt)}
            className={cn(
              "border px-3 py-1 text-[12px] transition-colors press",
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
