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
    n: "01",
    label: "Realtime collaborative whiteboard",
    seed:
      "Realtime collaborative whiteboard for design teams. Low-latency cursors, infinite canvas, version history, AI-assisted suggestions. 50K users in year 1, India + SEA. Free + Pro plans.",
  },
  {
    n: "02",
    label: "B2B logistics with live GPS",
    seed:
      "B2B logistics platform that ingests GPS pings from 100K trucks every 5 seconds, computes ETAs, dispatches alerts. India-first, integrates with TMS systems.",
  },
  {
    n: "03",
    label: "AI customer support copilot",
    seed:
      "AI-powered customer support copilot for D2C brands. Reads ticket history, drafts replies, escalates to human, integrates with Shopify + WhatsApp Business API.",
  },
  {
    n: "04",
    label: "ABDM-compliant health vault",
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

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 420) + "px";
  }, [brief]);

  useEffect(() => {
    if (seed && textareaRef.current) textareaRef.current.focus();
  }, [seed]);

  const phaseIndex = phase
    ? PHASE_ORDER.indexOf(phase as (typeof PHASE_ORDER)[number])
    : -1;
  const progressPct =
    phaseIndex < 0 ? (generating ? 5 : 0) : Math.round(((phaseIndex + 1) / PHASE_ORDER.length) * 100);

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
          try { ev = JSON.parse(line) as ProgressEvent; } catch { continue; }

          if (ev.type === "init") architectureId = ev.architectureId;
          else if (ev.type === "phase") { setPhase(ev.phase); setPhaseMsg(ev.message); }
          else if (ev.type === "tokens") setTokens(ev.tokens);
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

  // ===== Generating panel =====
  if (generating) {
    return (
      <div className="m3-page-enter mx-auto max-w-3xl">
        <div className="card-paper p-8 md:p-12">
          <div className="flex items-baseline justify-between border-b border-[hsl(var(--line))] pb-5">
            <span className="section-num">§ Generating</span>
            <span className="font-mono text-[11px] tabular-nums text-[hsl(var(--ink-3))] uppercase tracking-wider">
              {tokens.toLocaleString("en-IN")} tokens
            </span>
          </div>

          <h2 className="display-tight mt-8 text-[clamp(2rem,4.5vw,3.5rem)] leading-[0.95] tracking-[-0.04em]">
            Designing your<br />
            <span className="serif font-normal italic accent">system…</span>
          </h2>

          <p key={phaseMsg} className="m3-rise mt-5 text-[16px] text-[hsl(var(--ink-2))]">
            {phaseMsg || "Connecting to Gemini 2.5 Pro on Vertex AI…"}
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
                      active && "bg-[hsl(var(--accent))] text-[hsl(var(--paper))] scale-110",
                      !done && !active && "border border-[hsl(var(--line-2))]",
                    )}
                  >
                    {done ? (
                      <span className="ms text-[14px]" aria-hidden>check</span>
                    ) : active ? (
                      <span className="ms text-[14px] animate-spin" aria-hidden>progress_activity</span>
                    ) : null}
                  </span>
                  <span className={cn("text-[15px]", active ? "font-medium text-[hsl(var(--ink))]" : "text-[hsl(var(--ink-2))]")}>
                    {phaseLabel(p)}
                  </span>
                </li>
              );
            })}
          </ol>

          {errorMsg && (
            <div className="mt-8 border border-[hsl(var(--bad))]/30 bg-[hsl(var(--bad))]/5 p-5 rounded-2xl text-[14px] text-[hsl(var(--bad))]">
              <div className="font-medium">Generation failed</div>
              <div className="mt-1 text-[hsl(var(--ink-2))]">{errorMsg}</div>
              <div className="mt-2 text-[12px] text-[hsl(var(--ink-3))]">Your credit has been refunded.</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ===== Composer =====
  return (
    <div className="m3-page-enter mx-auto w-full max-w-3xl">
      <div className="card-paper relative overflow-hidden p-6 md:p-8 transition-all focus-within:border-[hsl(var(--ink))]">
        <div className="flex items-baseline justify-between pb-4 border-b border-[hsl(var(--line))]">
          <span className="section-num">§ Brief</span>
          <span className="font-mono text-[11px] tabular-nums text-[hsl(var(--ink-3))] uppercase tracking-wider">
            {brief.length.toLocaleString("en-IN")} / 8,000
          </span>
        </div>

        <textarea
          ref={textareaRef}
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          placeholder="Describe the system you'd like to build in plain English. Audience, scale, geography, constraints — the more context, the sharper the design."
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

        <div className="flex items-center justify-between gap-3 pt-4 border-t border-[hsl(var(--line))]">
          <span className="text-[12px] text-[hsl(var(--ink-3))]">
            1 credit · refunded on failure
          </span>
          <div className="flex items-center gap-3">
            <kbd className="hidden md:inline-flex items-center rounded-md border border-[hsl(var(--line-2))] bg-[hsl(var(--paper-2))] px-2 py-1 text-[11px] font-mono text-[hsl(var(--ink-3))]">
              ⌘↵
            </kbd>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={brief.trim().length < 30}
              className={cn(
                "btn-pill press",
                brief.trim().length < 30
                  ? "!bg-[hsl(var(--paper-3))] !text-[hsl(var(--ink-3))] !border-[hsl(var(--paper-3))] cursor-not-allowed"
                  : "btn-pill-accent",
              )}
            >
              Design it
              <span className="ms text-[18px]" aria-hidden>arrow_forward</span>
            </button>
          </div>
        </div>
      </div>

      {/* Examples */}
      <div className="mt-12">
        <div className="flex items-baseline justify-between border-b border-[hsl(var(--line))] pb-4">
          <span className="section-num">§ Or try one of these</span>
        </div>
        <ul className="mt-2 divide-y divide-[hsl(var(--line))]">
          {EXAMPLES.map((ex) => (
            <li key={ex.label}>
              <button
                type="button"
                onClick={() => { setBrief(ex.seed); textareaRef.current?.focus(); }}
                className="group w-full grid grid-cols-[auto_1fr_auto] items-center gap-6 py-5 text-left transition-colors hover:bg-[hsl(var(--paper-2))] px-2 -mx-2 rounded-2xl"
              >
                <span className="display text-[28px] tracking-[-0.04em] text-[hsl(var(--ink-3))] group-hover:text-[hsl(var(--accent))] transition-colors w-12">
                  {ex.n}
                </span>
                <span className="display text-[clamp(1rem,1.8vw,1.4rem)] leading-tight tracking-[-0.02em]">
                  {ex.label}
                </span>
                <span className="ms text-[20px] text-[hsl(var(--ink-3))] group-hover:text-[hsl(var(--ink))] group-hover:translate-x-1 transition-all" aria-hidden>
                  north_east
                </span>
              </button>
            </li>
          ))}
        </ul>
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
