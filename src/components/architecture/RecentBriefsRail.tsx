"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { cn, formatDate } from "@/lib/utils";

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

export type RecentBrief = {
  id: string;
  prompt: string;
  status: "pending" | "running" | "complete" | "failed";
  createdAt: number;
};

function truncateAt(text: string, max = 110) {
  const t = text.trim();
  if (t.length <= max) return t;
  return t.slice(0, max - 1).trimEnd() + "…";
}

export function RecentBriefsRail({
  briefs,
  onUseAsTemplate,
}: {
  briefs: RecentBrief[];
  onUseAsTemplate: (brief: RecentBrief) => void;
}) {
  const [hoverId, setHoverId] = useState<string | null>(null);

  if (briefs.length === 0) return null;

  return (
    <aside className="space-y-3">
      <div className="flex items-baseline justify-between border-b border-[hsl(var(--line))] pb-3">
        <p className="section-num text-[10px]">Recent briefs</p>
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[hsl(var(--ink-3))]">
          Last {briefs.length}
        </span>
      </div>
      <ul className="space-y-2">
        {briefs.map((b, i) => (
          <li key={b.id}>
            <motion.button
              type="button"
              layout
              onClick={() => onUseAsTemplate(b)}
              onMouseEnter={() => setHoverId(b.id)}
              onMouseLeave={() => setHoverId((id) => (id === b.id ? null : id))}
              onFocus={() => setHoverId(b.id)}
              onBlur={() => setHoverId((id) => (id === b.id ? null : id))}
              className="group w-full text-left rounded-2xl border border-[hsl(var(--line))] bg-[hsl(var(--paper))] hover:bg-[hsl(var(--paper-2))] hover:border-[hsl(var(--line-2))] transition-colors p-4"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.06, ease: EASE_OUT_EXPO }}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[hsl(var(--ink-3))]">
                  {formatDate(b.createdAt)}
                </span>
                <StatusDot status={b.status} />
              </div>
              <p className="text-[13px] leading-[1.5] text-[hsl(var(--ink))] line-clamp-3">
                {truncateAt(b.prompt, 140)}
              </p>
              <AnimatePresence initial={false}>
                {hoverId === b.id && (
                  <motion.div
                    key="cta"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22, ease: EASE_OUT_EXPO }}
                    style={{ overflow: "hidden" }}
                  >
                    <div className="pt-3 mt-3 border-t border-[hsl(var(--line))] flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.15em] text-[hsl(var(--ink-2))] group-hover:text-[hsl(var(--accent))] transition-colors">
                      <span className="ms text-[14px]" aria-hidden>content_copy</span>
                      Use as template
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </li>
        ))}
      </ul>
    </aside>
  );
}

function StatusDot({ status }: { status: RecentBrief["status"] }) {
  const map: Record<RecentBrief["status"], { color: string; label: string }> = {
    complete: { color: "hsl(var(--accent))", label: "Complete" },
    running:  { color: "hsl(var(--warn))",   label: "Running" },
    pending:  { color: "hsl(var(--ink-3))",  label: "Queued" },
    failed:   { color: "hsl(var(--bad))",    label: "Failed" },
  };
  const m = map[status];
  return (
    <span
      className={cn(
        "flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.18em]",
      )}
      style={{ color: m.color }}
    >
      <span className="size-[6px] rounded-full" style={{ background: m.color }} />
      {m.label}
    </span>
  );
}
