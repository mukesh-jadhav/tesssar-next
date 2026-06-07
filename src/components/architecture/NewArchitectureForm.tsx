"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { GuidedBriefDialog } from "@/components/architecture/GuidedBriefDialog";
import { canAffordRun } from "@/lib/credits/display";

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
  const [submitting, setSubmitting] = useState(false);
  const [guidedOpen, setGuidedOpen] = useState(false);
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

  async function handleSubmit() {
    if (submitting) return;
    if (brief.trim().length < 30) {
      toast.error("Add at least a sentence or two so the architect can work.");
      return;
    }
    if (!canAffordRun(credits)) {
      toast.error("You're out of credits. Top up to continue.");
      router.push("/pricing");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/architect/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to start generation");
      }
      const { id } = (await res.json()) as { id: string };
      router.push(`/architecture/${id}`);
    } catch (err) {
      toast.error((err as Error).message || "Failed to start generation");
      setSubmitting(false);
    }
  }

  // ===== Composer =====
  return (
    <div className="m3-page-enter mx-auto w-full max-w-3xl">
      <div className="card-paper relative overflow-hidden p-6 md:p-8 transition-all focus-within:border-[hsl(var(--ink))]">
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
            ₹299 per design · refunded automatically on failure
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setGuidedOpen(true)}
              className="hidden md:inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--line-2))] px-3 py-1.5 text-[12px] text-[hsl(var(--ink-2))] hover:text-[hsl(var(--ink))] hover:bg-[hsl(var(--paper-2))] transition-colors"
              title="Build the brief with guided questions"
            >
              <span className="ms text-[16px]" aria-hidden>auto_awesome</span>
              Build my brief
            </button>
            <kbd className="hidden md:inline-flex items-center rounded-md border border-[hsl(var(--line-2))] bg-[hsl(var(--paper-2))] px-2 py-1 text-[11px] font-mono text-[hsl(var(--ink-3))]">
              ⌘↵
            </kbd>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || brief.trim().length < 30}
              className={cn(
                "btn-pill press",
                submitting || brief.trim().length < 30
                  ? "!bg-[hsl(var(--paper-3))] !text-[hsl(var(--ink-3))] !border-[hsl(var(--paper-3))] cursor-not-allowed"
                  : "btn-pill-accent",
              )}
            >
              {submitting ? (
                <>
                  <span className="ms text-[18px] animate-spin" aria-hidden>progress_activity</span>
                  Starting
                </>
              ) : (
                <>
                  Design it
                  <span className="ms text-[18px]" aria-hidden>arrow_forward</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Examples */}
      <div className="mt-12">
        <div className="flex items-baseline justify-between border-b border-[hsl(var(--line))] pb-4">
          <span className="section-num">Or try one of these</span>
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

      <GuidedBriefDialog
        open={guidedOpen}
        onClose={() => setGuidedOpen(false)}
        onCompose={(composed) => {
          setBrief(composed);
          setGuidedOpen(false);
          requestAnimationFrame(() => textareaRef.current?.focus());
        }}
      />
    </div>
  );
}
