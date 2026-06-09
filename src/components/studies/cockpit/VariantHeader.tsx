"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useCockpit } from "./state";

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

/**
 * Shared column header used by every lens. Renders the variant's label
 * plus an unobtrusive "open" link to its full architecture page. The
 * `onHover` callback wires into the linked-highlight system (Phase 9).
 *
 * Phase 7: also surfaces the per-variant actions sourced from the
 * cockpit context — "Use as-is" promotes a completed variant into a
 * standalone arch (free); "Retry" charges 40 cr and re-runs a failed
 * variant.
 */
export function VariantHeader({
  label,
  runId,
  variantId,
  failed,
  highlighted,
  onHoverStart,
  onHoverEnd,
}: {
  label: string;
  runId: string;
  /** Catalog id of the variant; required for retry-variant. */
  variantId?: string;
  failed?: boolean;
  highlighted?: boolean;
  onHoverStart?: () => void;
  onHoverEnd?: () => void;
}) {
  const { promoteVariant, retryVariant, variantBusy } = useCockpit();
  const promoteBusy = variantBusy[runId] === "promote";
  const retryBusy = variantId ? variantBusy[variantId] === "retry" : false;

  return (
    <motion.header
      onHoverStart={onHoverStart}
      onHoverEnd={onHoverEnd}
      animate={{
        backgroundColor: highlighted
          ? "hsl(var(--accent-paper))"
          : "hsl(var(--card))",
      }}
      transition={{ duration: 0.18, ease: EASE_OUT_EXPO }}
      className={cn(
        "flex items-center justify-between gap-2 rounded-t-2xl border-x border-t border-[hsl(var(--line))] px-3 py-2",
        failed && "opacity-60",
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span
          className={cn(
            "size-1.5 rounded-full",
            failed ? "bg-[hsl(var(--bad))]" : "bg-[hsl(var(--accent))]",
          )}
          aria-hidden
        />
        <span className="text-[13px] font-medium uppercase tracking-[0.12em] text-[hsl(var(--ink))] truncate">
          {label}
        </span>
        {failed && (
          <span className="text-[10px] font-mono uppercase tracking-wider text-[hsl(var(--bad))]">
            failed
          </span>
        )}
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {failed && variantId && (
          <button
            type="button"
            onClick={() => retryVariant(variantId)}
            disabled={retryBusy}
            className={cn(
              "flex items-center gap-1 rounded-md border border-[hsl(var(--line))] px-1.5 py-0.5",
              "text-[10px] font-mono uppercase tracking-wider transition-colors",
              "text-[hsl(var(--ink-2))] hover:text-[hsl(var(--ink))] hover:bg-[hsl(var(--paper-2))]",
              "disabled:opacity-50 disabled:cursor-progress",
            )}
            title="Retry this variant (40 cr)"
          >
            <span className="ms text-[12px]">refresh</span>
            <span>{retryBusy ? "…" : "Retry · 40"}</span>
          </button>
        )}
        {!failed && (
          <button
            type="button"
            onClick={() => promoteVariant(runId)}
            disabled={promoteBusy}
            className={cn(
              "flex items-center gap-1 rounded-md border border-[hsl(var(--line))] px-1.5 py-0.5",
              "text-[10px] font-mono uppercase tracking-wider transition-colors",
              "text-[hsl(var(--ink-2))] hover:text-[hsl(var(--ink))] hover:bg-[hsl(var(--paper-2))]",
              "disabled:opacity-50 disabled:cursor-progress",
            )}
            title="Use this variant as-is (free, no synthesis)"
          >
            <span className="ms text-[12px]">bookmark_added</span>
            <span>{promoteBusy ? "…" : "Use as-is"}</span>
          </button>
        )}
        {!failed && (
          <Link
            href={`/architecture/${runId}`}
            className="ms text-[16px] text-[hsl(var(--ink-3))] hover:text-[hsl(var(--ink))] transition-colors"
            aria-label={`Open ${label} architecture full page`}
            title="Open variant in its own page"
          >
            open_in_new
          </Link>
        )}
      </div>
    </motion.header>
  );
}
