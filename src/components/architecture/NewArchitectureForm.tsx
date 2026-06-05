"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type ProgressEvent =
  | { type: "init"; architectureId: string }
  | { type: "phase"; phase: string; message: string }
  | { type: "tokens"; tokens: number }
  | { type: "complete"; architecture: unknown }
  | { type: "error"; message: string };

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

const EXAMPLES = [
  {
    icon: "draw",
    label: "Realtime collaborative whiteboard",
    seed:
      "Realtime collaborative whiteboard for design teams. Low-latency cursors, infinite canvas, version history, AI-assisted suggestions. 50K users in year 1, India + SEA. Free + Pro plans.",
  },
  {
    icon: "local_shipping",
    label: "B2B logistics with live GPS",
    seed:
      "B2B logistics platform that ingests GPS pings from 100K trucks every 5 seconds, computes ETAs, dispatches alerts. India-first, integrates with TMS systems.",
  },
  {
    icon: "support_agent",
    label: "AI customer support copilot",
    seed:
      "AI-powered customer support copilot for D2C brands. Reads ticket history, drafts replies, escalates to human, integrates with Shopify + WhatsApp Business API.",
  },
  {
    icon: "health_and_safety",
    label: "ABDM-compliant health records vault",
    seed:
      "Privacy-preserving health records vault for Indian hospitals. ABDM compliant, end-to-end encrypted, consent-based sharing, audit log, mobile + web.",
  },
] as const;

export function NewArchitectureForm({ credits, seed }: { credits: number; seed?: string }) {
  const router = useRouter();
  const [brief, setBrief] = useState(seed ?? "");
  const [generating, setGenerating] = useState(false);
  const [phase, setPhase] = useState<string | null>(null);
  const [phaseMsg, setPhaseMsg] = useState<string>("");
  const [tokens, setTokens] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Autosize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 320) + "px";
  }, [brief]);

  // Focus on seeded prompt
  useEffect(() => {
    if (seed && textareaRef.current) textareaRef.current.focus();
  }, [seed]);

  const phaseIndex = phase
    ? PHASE_ORDER.indexOf(phase as (typeof PHASE_ORDER)[number])
    : -1;
  const progressPct =
    phaseIndex < 0
      ? generating
        ? 5
        : 0
      : Math.round(((phaseIndex + 1) / PHASE_ORDER.length) * 100);

  async function handleSubmit() {
    if (brief.trim().length < 30) {
      toast.error("Add at least a sentence or two so the architect can work.");
      return;
    }
    if (credits < 1) {
      toast.error("You're out of credits. Top up to continue.");
      router.push("/pricing");
      return;
    }

    setGenerating(true);
    setErrorMsg(null);
    setPhase(null);
    setTokens(0);

    try {
      const res = await fetch("/api/architect/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief }),
      });
      if (!res.ok || !res.body) {
        const text = await res.text();
        throw new Error(text || "Failed to start generation");
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let architectureId: string | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const parts = buf.split("\n\n");
        buf = parts.pop() ?? "";
        for (const part of parts) {
          const line = part.replace(/^data:\s*/, "").trim();
          if (!line) continue;
          let ev: ProgressEvent;
          try {
            ev = JSON.parse(line) as ProgressEvent;
          } catch {
            continue;
          }
          if (ev.type === "init") architectureId = ev.architectureId;
          else if (ev.type === "phase") {
            setPhase(ev.phase);
            setPhaseMsg(ev.message);
          } else if (ev.type === "tokens") setTokens(ev.tokens);
          else if (ev.type === "complete" && architectureId) {
            router.push(`/architecture/${architectureId}`);
            return;
          } else if (ev.type === "error") {
            setErrorMsg(ev.message);
            setGenerating(false);
            toast.error(ev.message);
            return;
          }
        }
      }
    } catch (err) {
      setErrorMsg((err as Error).message);
      setGenerating(false);
    }
  }

  if (generating) {
    return (
      <div className="m3-page-enter mx-auto max-w-2xl">
        <div className="rounded-3xl bg-m3-surface-container-low p-7">
          <div className="flex items-center gap-3">
            <span className="ms text-m3-primary" aria-hidden>progress_activity</span>
            <h2 className="text-[18px] font-medium tracking-tight">Designing your system…</h2>
            <span className="ml-auto rounded-full bg-m3-surface-container px-3 py-1 font-mono text-[11px] tabular-nums text-m3-on-surface-variant">
              ~{tokens.toLocaleString("en-IN")} tokens
            </span>
          </div>

          {/* M3 expressive linear progress */}
          <div className="mt-5 h-1 overflow-hidden rounded-full bg-m3-secondary-container">
            <div
              className="h-full rounded-full bg-m3-primary transition-[width] duration-500 ease-m3-default-spatial"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          <div
            key={phaseMsg}
            className="m3-page-enter mt-4 text-[14px] text-m3-on-surface-variant"
          >
            {phaseMsg || "Connecting to Gemini 2.5 Pro on Vertex AI…"}
          </div>

          <ol className="mt-6 space-y-2.5">
            {PHASE_ORDER.map((p, i) => {
              const done = phaseIndex > i;
              const active = phaseIndex === i;
              return (
                <li
                  key={p}
                  className={cn(
                    "flex items-center gap-3 text-[14px] transition-all duration-m3-default-effects ease-m3-default-effects",
                    !done && !active && "opacity-45",
                  )}
                >
                  <span
                    className={cn(
                      "grid size-6 place-items-center rounded-full transition-all duration-m3-default-effects ease-m3-fast-spatial",
                      done && "bg-m3-primary text-m3-on-primary",
                      active && "bg-m3-primary-container text-m3-on-primary-container scale-110",
                      !done && !active && "bg-m3-surface-container text-m3-on-surface-variant",
                    )}
                  >
                    {done ? (
                      <span className="ms text-[14px]" aria-hidden>check</span>
                    ) : active ? (
                      <span className="ms text-[14px] animate-spin" aria-hidden>progress_activity</span>
                    ) : (
                      <span className="text-[11px] tabular-nums">{i + 1}</span>
                    )}
                  </span>
                  <span className={cn(active && "font-medium text-m3-on-surface")}>
                    {phaseLabel(p)}
                  </span>
                </li>
              );
            })}
          </ol>

          {errorMsg && (
            <div className="mt-6 flex items-start gap-2 rounded-2xl bg-m3-error-container p-4 text-[14px] text-m3-on-error-container">
              <span className="ms" aria-hidden>error</span>
              <div>
                <div className="font-medium">Generation failed</div>
                <div className="mt-0.5 text-[13px]">{errorMsg}</div>
                <div className="mt-1 text-[12px] opacity-80">Your credit has been refunded.</div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ============ Composer (idle state) ============
  return (
    <div className="m3-page-enter mx-auto w-full max-w-2xl">
      <div className="relative rounded-3xl bg-m3-surface-container-low shadow-m3-1 transition-shadow duration-m3-default-effects ease-m3-default-effects focus-within:shadow-m3-3 focus-within:ring-1 focus-within:ring-m3-primary/30">
        <textarea
          ref={textareaRef}
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          placeholder="Describe the system you'd like to build…"
          maxLength={8000}
          rows={3}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          className="block w-full resize-none bg-transparent px-6 pt-6 pb-2 text-[16px] leading-relaxed text-m3-on-surface placeholder:text-m3-on-surface-variant/80 focus:outline-none scrollbar-thin"
        />

        <div className="flex items-center gap-2 px-4 pb-4 pt-2">
          <span className="rounded-full bg-m3-surface-container px-3 py-1 text-[11px] font-medium uppercase tracking-[0.06em] text-m3-on-surface-variant">
            {brief.length.toLocaleString("en-IN")} / 8,000
          </span>
          <span className="text-[11px] text-m3-on-surface-variant">
            1 credit · refunded on failure
          </span>
          <div className="ml-auto flex items-center gap-2">
            <kbd className="hidden rounded-md bg-m3-surface-container px-1.5 py-0.5 text-[10px] text-m3-on-surface-variant md:inline-block">
              ⌘↵
            </kbd>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={brief.trim().length < 30}
              aria-label="Design my architecture"
              className={cn(
                "state-layer press grid size-12 place-items-center rounded-full transition-all duration-m3-default-effects ease-m3-fast-spatial",
                brief.trim().length < 30
                  ? "bg-m3-surface-container text-m3-on-surface-variant/60"
                  : "bg-m3-primary text-m3-on-primary shadow-m3-2 hover:shadow-m3-3",
              )}
            >
              <span className="ms" aria-hidden>arrow_upward</span>
            </button>
          </div>
        </div>
      </div>

      {/* Suggestion chips beneath composer */}
      <div className="m3-stagger mt-6 grid gap-2.5 sm:grid-cols-2">
        {EXAMPLES.map((ex) => (
          <button
            key={ex.label}
            type="button"
            onClick={() => {
              setBrief(ex.seed);
              textareaRef.current?.focus();
            }}
            className="state-layer press group/ex flex items-center gap-3 rounded-2xl bg-m3-surface-container-low px-4 py-3 text-left transition-shadow duration-m3-default-effects ease-m3-default-effects hover:shadow-m3-1"
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-2xl bg-m3-tertiary-container text-m3-on-tertiary-container">
              <span className="ms text-[20px]" aria-hidden>{ex.icon}</span>
            </span>
            <span className="text-[14px] text-m3-on-surface">{ex.label}</span>
          </button>
        ))}
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
