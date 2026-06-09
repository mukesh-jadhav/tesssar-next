"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useReducedMotionSafe } from "@/components/motion/useReducedMotionSafe";
import type { StudyDoc, VariantStatus } from "@/types/study";

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

const PHASE_ORDER = [
  "analyzing",
  "selecting-components",
  "designing-data-flow",
  "drafting-diagrams",
  "computing-scale",
  "assessing-risks",
  "hardening-security",
  "finalizing",
] as const;

type Phase = (typeof PHASE_ORDER)[number];

interface VariantProgressSlice {
  phase?: string;
  message?: string;
  tokens?: number;
  updatedAt?: number;
}

/**
 * The shape /api/studies/[id]/status returns — study fields plus each
 * variant's live `progress` slice and possibly an overridden `status`
 * read from its arch doc.
 */
interface StudyStatusResponse {
  id: string;
  uid: string;
  prompt: string;
  dimension: string;
  status: StudyDoc["status"];
  createdAt: number;
  completedAt?: number;
  variants: Array<{
    label: string;
    variantId: string;
    runId: string;
    status: VariantStatus;
    errorMessage?: string;
    progress: VariantProgressSlice | null;
  }>;
}

/**
 * StudyLive — racing-lane progress for N parallel architecture
 * generations. Polls the server status endpoint (no Firestore listener;
 * the study-shaped doc isn't snapshot-friendly client-side). When all
 * lanes terminal, surfaces a "Open the cockpit" CTA. Failed lanes get a
 * "Re-run just this variant" stub (wired in Phase 7).
 */
export function StudyLive({ initial }: { initial: StudyDoc }) {
  const reduced = useReducedMotionSafe();
  const [state, setState] = useState<StudyStatusResponse>(() =>
    studyDocToResponse(initial),
  );
  const lastUpdatedRef = useRef<number>(initial.completedAt ?? 0);

  const fetchOnce = useCallback(async () => {
    try {
      const res = await fetch(`/api/studies/${initial.id}/status`, {
        cache: "no-store",
      });
      if (!res.ok) return;
      const next = (await res.json()) as StudyStatusResponse;
      // Cheap monotonicity guard — drop responses that pre-date the most
      // recent one we've seen (poll races are rare but possible).
      const maxUpdated = Math.max(
        next.completedAt ?? 0,
        ...next.variants.map((v) => v.progress?.updatedAt ?? 0),
      );
      if (maxUpdated < lastUpdatedRef.current) return;
      lastUpdatedRef.current = maxUpdated;
      setState(next);
    } catch {
      // network blip; next tick will retry
    }
  }, [initial.id]);

  useEffect(() => {
    if (state.status !== "running") return;
    const handle = window.setInterval(fetchOnce, 2500);
    void fetchOnce();
    return () => window.clearInterval(handle);
  }, [fetchOnce, state.status]);

  const terminal =
    state.status === "complete" ||
    state.status === "partial" ||
    state.status === "failed";

  return (
    <div className="flex-1 min-h-0 overflow-auto scrollbar-thin">
      <div className="mx-auto w-full max-w-5xl px-6 py-14 md:px-10">
        <div className="card-paper p-8 md:p-12">
          {/* ===== Header ===== */}
          <div className="flex items-baseline justify-between border-b border-[hsl(var(--line))] pb-5">
            <span className="section-num">
              {terminal ? "Study ready" : "Generating in parallel"}
            </span>
            <span className="font-mono text-[11px] tabular-nums text-[hsl(var(--ink-3))] uppercase tracking-wider">
              {state.variants.length} variants · {dimensionLabel(state.dimension)}
            </span>
          </div>

          <h2 className="display-tight mt-8 text-[clamp(2rem,4.5vw,3.5rem)] leading-[0.95] tracking-[-0.04em]">
            {terminal ? (
              <>
                Three angles.<br />
                <span className="serif font-normal italic accent">
                  One decision.
                </span>
              </>
            ) : (
              <>
                Designing<br />
                <span className="serif font-normal italic accent">
                  every variant…
                </span>
              </>
            )}
          </h2>

          <p className="m3-rise mt-5 text-[16px] text-[hsl(var(--ink-2))]">
            {terminal
              ? state.status === "complete"
                ? "All variants are in. Open the cockpit to compare them across every lens."
                : state.status === "partial"
                  ? "Some variants are in. You can open the cockpit now and re-run the failed lanes."
                  : "Every variant failed. Your credits have been refunded — please try again."
              : "Three streams racing the same eight phases. Safe to leave this tab — it picks back up when you return."}
          </p>

          {/* ===== Racing lanes ===== */}
          <ol className="mt-10 grid gap-3">
            {state.variants.map((v) => (
              <LaneRow
                key={v.runId}
                runId={v.runId}
                label={v.label}
                status={v.status}
                phase={(v.progress?.phase as Phase) || "analyzing"}
                message={v.progress?.message || "Queued"}
                tokens={v.progress?.tokens || 0}
                errorMessage={v.errorMessage}
                reduced={reduced}
              />
            ))}
          </ol>

          {/* ===== Terminal CTAs ===== */}
          <AnimatePresence>
            {terminal && (
              <motion.div
                initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.42, ease: EASE_OUT_EXPO, delay: 0.1 }}
                className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-[hsl(var(--line))] pt-6"
              >
                <span className="text-[13px] text-[hsl(var(--ink-3))]">
                  {state.status === "failed"
                    ? "Tip: simpler briefs (≤300 words) reduce failure rate."
                    : "Compare numbers, diagrams, costs, and reliability side-by-side."}
                </span>
                <div className="flex items-center gap-3">
                  {state.status === "failed" ? (
                    <Link
                      href="/studies/new"
                      className="btn-pill btn-pill-ghost press"
                    >
                      Start a new study
                      <span className="ms text-[18px]" aria-hidden>
                        arrow_forward
                      </span>
                    </Link>
                  ) : (
                    <span className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--line-2))] px-4 py-2 text-[13px] text-[hsl(var(--ink-2))]">
                      <span
                        className="ms text-[16px] text-[hsl(var(--accent))]"
                        aria-hidden
                      >
                        bolt
                      </span>
                      Cockpit lands in the next release — your variants are
                      saved and viewable individually.
                    </span>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!terminal && (
            <p className="mt-10 text-[12px] text-[hsl(var(--ink-3))]">
              Each variant is independently tracked — a single hiccup
              won&apos;t poison the study. You can close this tab; the
              cockpit opens itself when the last lane finishes.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function LaneRow({
  runId,
  label,
  status,
  phase,
  message,
  tokens,
  errorMessage,
  reduced,
}: {
  runId: string;
  label: string;
  status: VariantStatus;
  phase: Phase;
  message: string;
  tokens: number;
  errorMessage?: string;
  reduced: boolean;
}) {
  const phaseIndex = PHASE_ORDER.indexOf(phase);
  const pct =
    status === "complete"
      ? 100
      : status === "failed"
        ? 100
        : phaseIndex < 0
          ? 5
          : Math.round(((phaseIndex + 1) / PHASE_ORDER.length) * 100);

  const accent =
    status === "complete"
      ? "hsl(var(--accent))"
      : status === "failed"
        ? "hsl(var(--bad))"
        : "hsl(var(--ink))";

  return (
    <motion.li
      layout
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, ease: EASE_OUT_EXPO }}
      className="grid grid-cols-[110px_1fr_auto] items-center gap-5 py-4 border-b border-[hsl(var(--line))] last:border-0"
    >
      {/* Lane label */}
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "grid size-6 place-items-center rounded-full transition-all",
            status === "complete" &&
              "bg-[hsl(var(--accent))] text-[hsl(var(--paper))] scale-110",
            status === "failed" &&
              "bg-[hsl(var(--bad))] text-[hsl(var(--paper))]",
            status === "running" && "border border-[hsl(var(--line-2))]",
          )}
          aria-hidden
        >
          {status === "complete" ? (
            <span className="ms text-[14px]">check</span>
          ) : status === "failed" ? (
            <span className="ms text-[14px]">close</span>
          ) : (
            <span className="ms text-[14px] animate-spin">
              progress_activity
            </span>
          )}
        </span>
        <span className="text-[14px] font-medium text-[hsl(var(--ink))] uppercase tracking-[0.12em]">
          {label}
        </span>
      </div>

      {/* Progress bar + status text */}
      <div className="min-w-0">
        <div className="relative h-[3px] w-full bg-[hsl(var(--paper-3))] overflow-hidden rounded-full">
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full"
            initial={false}
            animate={{ width: `${pct}%`, background: accent }}
            transition={{
              duration: reduced ? 0 : 0.7,
              ease: EASE_OUT_EXPO,
            }}
          />
          {status === "running" && (
            <motion.div
              className="absolute inset-y-0 w-1/4 rounded-full opacity-30"
              style={{ background: "hsl(var(--accent))" }}
              animate={{ left: ["-25%", "100%"] }}
              transition={{
                duration: 1.8,
                ease: "easeInOut",
                repeat: Infinity,
              }}
            />
          )}
        </div>
        <p
          key={message}
          className={cn(
            "m3-rise mt-2 text-[13px] truncate",
            status === "failed"
              ? "text-[hsl(var(--bad))]"
              : "text-[hsl(var(--ink-2))]",
          )}
        >
          {status === "failed"
            ? errorMessage || "This variant failed — credit refunded."
            : status === "complete"
              ? "Ready"
              : message}
        </p>
      </div>

      {/* Token meter / status tag */}
      <div className="hidden md:flex flex-col items-end gap-1 min-w-[140px]">
        {status === "complete" ? (
          <Link
            href={`/architecture/${runId}`}
            className="inline-flex items-center gap-1 text-[12px] font-medium text-[hsl(var(--ink))] hover:text-[hsl(var(--accent))] transition-colors"
          >
            Open variant
            <span className="ms text-[14px]" aria-hidden>
              arrow_forward
            </span>
          </Link>
        ) : status === "failed" ? (
          <span className="text-[11px] font-mono uppercase tracking-wider text-[hsl(var(--bad))]">
            Refunded
          </span>
        ) : (
          <span className="font-mono text-[11px] tabular-nums uppercase tracking-wider text-[hsl(var(--ink-3))]">
            {tokens.toLocaleString("en-IN")} tokens
          </span>
        )}
        <span className="font-mono text-[10px] tabular-nums text-[hsl(var(--ink-3))]/70">
          {status === "complete"
            ? "Done"
            : status === "failed"
              ? "Failed"
              : phaseLabel(phase)}
        </span>
      </div>
    </motion.li>
  );
}

function phaseLabel(p: string): string {
  return p
    .split("-")
    .map((w) => w[0]!.toUpperCase() + w.slice(1))
    .join(" ");
}

function dimensionLabel(id: string): string {
  switch (id) {
    case "cloud":
      return "Cloud";
    case "style":
      return "Style";
    case "datastore":
      return "Datastore";
    case "deployment":
      return "Deployment";
    case "cost-posture":
      return "Cost posture";
    default:
      return id;
  }
}

function studyDocToResponse(s: StudyDoc): StudyStatusResponse {
  return {
    id: s.id,
    uid: s.uid,
    prompt: s.prompt,
    dimension: s.dimension,
    status: s.status,
    createdAt: s.createdAt,
    completedAt: s.completedAt,
    variants: s.variants.map((v) => ({
      label: v.label,
      variantId: v.variantId,
      runId: v.runId,
      status: v.status,
      errorMessage: v.errorMessage,
      progress: null,
    })),
  };
}
