"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ArrowRight, Loader2, AlertTriangle, Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
  "Realtime collaborative whiteboard for design teams. Low-latency cursors, infinite canvas, version history, AI-assisted suggestions. 50K users in year 1, India + SEA. Free + Pro plans.",
  "B2B logistics platform that ingests GPS pings from 100K trucks every 5 seconds, computes ETAs, dispatches alerts. India-first, integrates with TMS systems.",
  "AI-powered customer support copilot for D2C brands. Reads ticket history, drafts replies, escalates to human, integrates with Shopify + WhatsApp Business API.",
  "Privacy-preserving health records vault for Indian hospitals. ABDM compliant, end-to-end encrypted, consent-based sharing, audit log, mobile + web.",
];

const PLACEHOLDER_HINTS = [
  "e.g. A realtime collaborative whiteboard for design teams…",
  "e.g. An ABDM-compliant health records vault for Indian hospitals…",
  "e.g. A B2B logistics platform ingesting 100K truck GPS pings every 5 seconds…",
  "e.g. An AI support copilot that drafts replies from ticket history…",
];

export function NewArchitectureForm({ credits }: { credits: number }) {
  const router = useRouter();
  const [brief, setBrief] = useState("");
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [phase, setPhase] = useState<string | null>(null);
  const [phaseMsg, setPhaseMsg] = useState<string>("");
  const [tokens, setTokens] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Rotate placeholder hints
  useEffect(() => {
    if (brief.length > 0 || generating) return;
    const i = setInterval(() => {
      setPlaceholderIdx((p) => (p + 1) % PLACEHOLDER_HINTS.length);
    }, 3600);
    return () => clearInterval(i);
  }, [brief.length, generating]);

  const phaseIndex = phase
    ? PHASE_ORDER.indexOf(phase as (typeof PHASE_ORDER)[number])
    : -1;
  const progress =
    phaseIndex < 0
      ? generating
        ? 3
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
          } else if (ev.type === "tokens") {
            setTokens(ev.tokens);
          } else if (ev.type === "complete" && architectureId) {
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

  return (
    <div className="space-y-6">
      {!generating ? (
        <Card className="overflow-hidden">
          <CardContent className="space-y-5 p-7">
            <div className="flex items-start gap-3">
              <div className="grid size-9 shrink-0 place-items-center rounded-lg border bg-background">
                <Sparkles className="size-4 text-foreground/80" />
              </div>
              <div className="flex-1">
                <div className="font-medium tracking-tight">
                  Describe the system you want to build
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Be as detailed or as loose as you like. The architect fills gaps with reasoned
                  assumptions and surfaces them.
                </p>
              </div>
            </div>
            <div className="relative">
              <Textarea
                ref={textareaRef}
                value={brief}
                onChange={(e) => setBrief(e.target.value)}
                placeholder=" "
                className="min-h-[220px] resize-none text-[15px] leading-relaxed"
                maxLength={8000}
              />
              {brief.length === 0 && (
                <div
                  key={placeholderIdx}
                  className="pointer-events-none absolute left-3.5 top-3 animate-reveal-fade text-[15px] leading-relaxed text-muted-foreground/70"
                >
                  {PLACEHOLDER_HINTS[placeholderIdx]}
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
              <span className="tabular-nums">
                {brief.length.toLocaleString("en-IN")} / 8,000 characters
              </span>
              <span>1 credit · refunded on failure</span>
            </div>
            <div>
              <div className="mb-3 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Try one of these
              </div>
              <div className="flex flex-wrap gap-2">
                {EXAMPLES.map((ex, i) => (
                  <button
                    key={i}
                    onClick={() => setBrief(ex)}
                    className="rounded-full border px-3 py-1.5 text-xs text-muted-foreground transition-all duration-200 ease-out-quart hover:-translate-y-px hover:border-foreground/30 hover:bg-card hover:text-foreground"
                  >
                    Example {i + 1}
                  </button>
                ))}
              </div>
            </div>
            <Button
              onClick={handleSubmit}
              size="lg"
              className="w-full gap-2"
              disabled={brief.trim().length < 30}
            >
              Design my architecture
              <ArrowRight className="size-4 transition-transform group-hover/btn:translate-x-0.5" />
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <CardContent className="space-y-6 p-7">
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <Loader2 className="size-4 animate-spin" />
                <span className="text-sm font-medium tracking-tight">
                  Designing your system…
                </span>
                <Badge
                  variant="outline"
                  className="ml-auto font-mono text-[10px] tabular-nums"
                >
                  ~{tokens.toLocaleString("en-IN")} tokens
                </Badge>
              </div>
              <Progress value={progress} />
              <div
                key={phaseMsg}
                className="animate-reveal-fade text-sm text-muted-foreground"
              >
                {phaseMsg || "Connecting to Gemini 2.5 Pro on Vertex AI…"}
              </div>
            </div>

            <ol className="space-y-2.5">
              {PHASE_ORDER.map((p, i) => {
                const done = phaseIndex > i;
                const active = phaseIndex === i;
                return (
                  <li
                    key={p}
                    className={cn(
                      "flex items-center gap-3 text-sm transition-all duration-300 ease-out-quart",
                      !done && !active && "opacity-50",
                    )}
                  >
                    <span
                      className={cn(
                        "grid size-5 place-items-center rounded-full border text-[10px] transition-all duration-300 ease-out-quart",
                        done && "scale-100 border-foreground bg-foreground text-background",
                        active && "scale-110 border-foreground bg-background text-foreground",
                        !done && !active && "border-border text-muted-foreground",
                      )}
                    >
                      {done ? <Check className="size-3" /> : i + 1}
                    </span>
                    <span
                      className={cn(
                        "transition-colors duration-300",
                        active && "font-medium",
                        done && "text-muted-foreground line-through decoration-foreground/20",
                      )}
                    >
                      {phaseLabel(p)}
                    </span>
                    {active && (
                      <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
                    )}
                  </li>
                );
              })}
            </ol>

            {errorMsg && (
              <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3.5 text-sm text-destructive">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                <div>
                  <div className="font-medium">Generation failed</div>
                  <div className="mt-0.5 text-xs">{errorMsg}</div>
                  <div className="mt-1 text-xs opacity-80">Your credit has been refunded.</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function phaseLabel(p: string): string {
  return p
    .split("-")
    .map((w) => w[0]!.toUpperCase() + w.slice(1))
    .join(" ");
}
