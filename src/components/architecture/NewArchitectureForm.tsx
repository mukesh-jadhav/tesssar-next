"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ArrowRight, Loader2, AlertTriangle } from "lucide-react";
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
  "Realtime collaborative whiteboard for design teams. Low-latency cursors, infinite canvas, version history, AI-assisted suggestions. 50K users in year 1, India + SEA. Free + Pro plans.",
  "B2B logistics platform that ingests GPS pings from 100K trucks every 5 seconds, computes ETAs, dispatches alerts. India-first, integrates with TMS systems.",
  "AI-powered customer support copilot for D2C brands. Reads ticket history, drafts replies, escalates to human, integrates with Shopify + WhatsApp Business API.",
  "Privacy-preserving health records vault for Indian hospitals. ABDM compliant, end-to-end encrypted, consent-based sharing, audit log, mobile + web.",
];

export function NewArchitectureForm({ credits }: { credits: number }) {
  const router = useRouter();
  const [brief, setBrief] = useState("");
  const [generating, setGenerating] = useState(false);
  const [phase, setPhase] = useState<string | null>(null);
  const [phaseMsg, setPhaseMsg] = useState<string>("");
  const [tokens, setTokens] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const phaseIndex = phase ? PHASE_ORDER.indexOf(phase as (typeof PHASE_ORDER)[number]) : -1;
  const progress = phaseIndex < 0 ? (generating ? 3 : 0) : Math.round(((phaseIndex + 1) / PHASE_ORDER.length) * 100);

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
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-start gap-2">
              <Sparkles className="mt-0.5 size-4 text-brand" />
              <div className="flex-1">
                <div className="font-medium">Describe the system you want to build</div>
                <p className="text-sm text-muted-foreground">
                  Be as detailed or as loose as you like. The architect will fill gaps with reasoned assumptions and surface them.
                </p>
              </div>
            </div>
            <Textarea
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              placeholder="e.g. A realtime collaborative whiteboard for design teams. Infinite canvas, multiplayer cursors, version history, AI-assisted suggestions. Target 50K users year-1, India + SEA. Free + Pro plans..."
              className="min-h-[200px] resize-none text-base leading-relaxed"
              maxLength={8000}
            />
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>{brief.length} / 8000 characters</span>
              <span>One credit will be used.</span>
            </div>
            <div>
              <div className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">Or try one of these</div>
              <div className="flex flex-wrap gap-2">
                {EXAMPLES.map((ex, i) => (
                  <button
                    key={i}
                    onClick={() => setBrief(ex)}
                    className="rounded-full border px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    Example {i + 1}
                  </button>
                ))}
              </div>
            </div>
            <Button
              onClick={handleSubmit}
              size="lg"
              variant="brand"
              className="w-full gap-2"
              disabled={brief.trim().length < 30}
            >
              Design my architecture
              <ArrowRight className="size-4" />
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <CardContent className="p-6 space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Loader2 className="size-4 animate-spin text-brand" />
                <span className="text-sm font-medium">Designing your system…</span>
                <Badge variant="secondary" className="ml-auto">~{tokens.toLocaleString()} tokens</Badge>
              </div>
              <Progress value={progress} />
              <div className="text-sm text-muted-foreground">{phaseMsg || "Connecting to Gemini 2.5 Pro on Vertex AI…"}</div>
            </div>

            <ol className="space-y-2">
              {PHASE_ORDER.map((p, i) => {
                const done = phaseIndex > i;
                const active = phaseIndex === i;
                return (
                  <li key={p} className="flex items-center gap-3 text-sm">
                    <span
                      className={`grid size-5 place-items-center rounded-full border text-[10px] ${
                        done
                          ? "border-brand bg-brand text-white"
                          : active
                            ? "border-brand bg-brand/10 text-brand"
                            : "border-muted text-muted-foreground"
                      }`}
                    >
                      {done ? "✓" : i + 1}
                    </span>
                    <span className={active ? "font-medium" : done ? "" : "text-muted-foreground"}>
                      {phaseLabel(p)}
                    </span>
                    {active && <Loader2 className="size-3.5 animate-spin text-brand" />}
                  </li>
                );
              })}
            </ol>

            {errorMsg && (
              <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                <AlertTriangle className="mt-0.5 size-4" />
                <div>
                  <div className="font-medium">Generation failed</div>
                  <div className="text-xs">{errorMsg}</div>
                  <div className="mt-1 text-xs">Your credit has been refunded.</div>
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
