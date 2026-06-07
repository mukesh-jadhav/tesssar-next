"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { doc, onSnapshot } from "firebase/firestore";
import { getFirebaseDb, getFirebaseAuth } from "@/lib/firebase/client";
import { onAuthStateChanged } from "firebase/auth";
import { ReportCockpit } from "@/components/workspace/ReportCockpit";
import { Architecture, type ArchitectureDoc } from "@/types/architecture";
import { cn } from "@/lib/utils";

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

/**
 * ArchitectureRunLive — live, Firestore-driven result page.
 *
 * Subscribes to architectures/{id}; renders the progress cockpit
 * while status is "running", the full ReportCockpit when status is
 * "complete", and a refund card on "failed". Survives tab close and
 * proxy timeouts because Firestore is the source of truth.
 *
 * The server component handed us `initial` so first paint is
 * SSR-correct and we don't show a loading flash.
 */
export function ArchitectureRunLive({ initial }: { initial: ArchitectureDoc }) {
  const [d, setD] = useState<ArchitectureDoc>(initial);
  const latestUpdatedAt = useRef<number>(initial.progress?.updatedAt ?? 0);

  // Keep the ref in sync with whatever update wins (snapshot or poll).
  function applyUpdate(next: ArchitectureDoc) {
    const incoming = next.progress?.updatedAt ?? 0;
    if (next.status !== "running" || incoming >= latestUpdatedAt.current) {
      latestUpdatedAt.current = incoming;
      setD(next);
    }
  }

  // Path A — Firestore onSnapshot (only after the client SDK has restored auth,
  // otherwise the listener errors on the security rule and silently dies).
  useEffect(() => {
    if (initial.status !== "running") return;
    const auth = getFirebaseAuth();
    let unsubSnap: (() => void) | null = null;
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (!user) return;
      const db = getFirebaseDb();
      unsubSnap = onSnapshot(
        doc(db, "architectures", initial.id),
        (snap) => {
          if (!snap.exists()) return;
          applyUpdate(snap.data() as ArchitectureDoc);
        },
        (err) => {
          // Permission-denied / network blip — polling below will still update.
          console.warn("[run] snapshot listener stopped:", err.message);
        },
      );
    });
    return () => {
      unsubAuth();
      unsubSnap?.();
    };
  }, [initial.id, initial.status]);

  // Path B — Polling fallback. Bulletproof against blocked Firestore websockets,
  // service-worker interference, mobile background-throttling, etc.
  useEffect(() => {
    if (d.status !== "running") return;
    let cancelled = false;
    const tick = async () => {
      try {
        const res = await fetch(`/api/architect/${initial.id}/status`, {
          cache: "no-store",
        });
        if (!res.ok || cancelled) return;
        applyUpdate((await res.json()) as ArchitectureDoc);
      } catch {
        // network blip — retry next tick
      }
    };
    const handle = window.setInterval(tick, 2500);
    void tick();
    return () => {
      cancelled = true;
      window.clearInterval(handle);
    };
  }, [initial.id, d.status]);

  if (d.status === "complete" && d.architecture) {
    const arch = Architecture.parse(d.architecture);
    return (
      <ReportCockpit
        arch={arch}
        architectureId={d.id}
        publicShare={d.publicShare ?? null}
      />
    );
  }

  if (d.status === "failed") {
    return (
      <div className="flex-1 min-h-0 overflow-auto scrollbar-thin">
        <div className="mx-auto max-w-xl px-6 py-16">
          <div className="rounded-2xl border border-[hsl(var(--bad))]/30 bg-[hsl(var(--bad))]/5 p-6">
            <div className="flex items-center gap-2 text-[hsl(var(--bad))]">
              <span className="ms text-[20px]" aria-hidden>warning</span>
              <span className="font-medium">Generation failed</span>
            </div>
            <p className="mt-2 text-[14px] text-[hsl(var(--ink-2))]">
              {d.errorMessage ?? "Unknown error"}
            </p>
            <p className="mt-1 text-[12px] text-[hsl(var(--ink-3))]">
              Your credit has been refunded.
            </p>
            <Link href="/new" className="btn-pill-accent btn-pill-sm mt-4 w-fit">
              Try again
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const phase = d.progress?.phase ?? "analyzing";
  const message =
    d.progress?.message ?? "Connecting to the architect…";
  const tokens = d.progress?.tokens ?? 0;
  const phaseIndex = PHASE_ORDER.indexOf(
    phase as (typeof PHASE_ORDER)[number],
  );
  const progressPct =
    phaseIndex < 0
      ? 5
      : Math.round(((phaseIndex + 1) / PHASE_ORDER.length) * 100);

  return (
    <div className="flex-1 min-h-0 overflow-auto scrollbar-thin">
      <div className="mx-auto w-full max-w-3xl px-6 py-14 md:px-10">
        <div className="card-paper p-8 md:p-12">
          <div className="flex items-baseline justify-between border-b border-[hsl(var(--line))] pb-5">
            <span className="section-num">Generating</span>
            <span className="font-mono text-[11px] tabular-nums text-[hsl(var(--ink-3))] uppercase tracking-wider">
              {tokens.toLocaleString("en-IN")} tokens
            </span>
          </div>

          <h2 className="display-tight mt-8 text-[clamp(2rem,4.5vw,3.5rem)] leading-[0.95] tracking-[-0.04em]">
            Designing your<br />
            <span className="serif font-normal italic accent">system…</span>
          </h2>

          <p
            key={message}
            className="m3-rise mt-5 text-[16px] text-[hsl(var(--ink-2))]"
          >
            {message}
          </p>

          {/* Progress bar */}
          <div className="mt-10">
            <div className="flex items-baseline justify-between text-[11px] font-mono uppercase tracking-wider text-[hsl(var(--ink-3))]">
              <span>Progress</span>
              <span className="tabular-nums">{progressPct}%</span>
            </div>
            <div className="mt-2 h-[3px] w-full bg-[hsl(var(--paper-3))] overflow-hidden">
              <div
                className="h-full bg-[hsl(var(--ink))] transition-all duration-700"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          <ol className="mt-10 grid gap-2">
            {PHASE_ORDER.map((p, i) => {
              const done = phaseIndex > i;
              const active = phaseIndex === i;
              return (
                <li
                  key={p}
                  className={cn(
                    "grid grid-cols-[auto_auto_1fr] items-center gap-4 py-3 border-b border-[hsl(var(--line))] last:border-0 transition-all",
                    !done && !active && "opacity-40",
                  )}
                >
                  <span className="font-mono text-[11px] tabular-nums text-[hsl(var(--ink-3))]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span
                    className={cn(
                      "grid size-6 place-items-center rounded-full transition-all",
                      done && "bg-[hsl(var(--ink))] text-[hsl(var(--paper))]",
                      active &&
                        "bg-[hsl(var(--accent))] text-[hsl(var(--paper))] scale-110",
                      !done && !active && "border border-[hsl(var(--line-2))]",
                    )}
                  >
                    {done ? (
                      <span className="ms text-[14px]" aria-hidden>check</span>
                    ) : active ? (
                      <span className="ms text-[14px] animate-spin" aria-hidden>
                        progress_activity
                      </span>
                    ) : null}
                  </span>
                  <span
                    className={cn(
                      "text-[15px]",
                      active
                        ? "font-medium text-[hsl(var(--ink))]"
                        : "text-[hsl(var(--ink-2))]",
                    )}
                  >
                    {phaseLabel(p)}
                  </span>
                </li>
              );
            })}
          </ol>

          <p className="mt-10 text-[12px] text-[hsl(var(--ink-3))]">
            Safe to leave this tab open or close it — the run continues on the
            server, and we&apos;ll have the report waiting when you come back.
          </p>
        </div>
      </div>
    </div>
  );
}

function phaseLabel(p: string): string {
  return p
    .split("-")
    .map((w) => w[0]!.toUpperCase() + w.slice(1))
    .join(" ");
}
