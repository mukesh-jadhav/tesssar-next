"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { cn } from "@/lib/utils";

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

/**
 * Shared column header used by every lens. Renders the variant's label
 * plus an unobtrusive "open" link to its full architecture page. The
 * `onHover` callback wires into the linked-highlight system (Phase 9).
 */
export function VariantHeader({
  label,
  runId,
  failed,
  highlighted,
  onHoverStart,
  onHoverEnd,
}: {
  label: string;
  runId: string;
  failed?: boolean;
  highlighted?: boolean;
  onHoverStart?: () => void;
  onHoverEnd?: () => void;
}) {
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
        failed && "opacity-50",
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
    </motion.header>
  );
}
