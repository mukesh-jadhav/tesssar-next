"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ProfileChip, type ProfileChipUser } from "@/components/auth/ProfileChip";

/**
 * HomeCockpit — single-screen home for the workspace.
 *
 *  - Center: prompt composer (the act of designing).
 *  - Right inspector: examples + sample report shortcut.
 *  - Footer hint: keyboard shortcut + credit note.
 *  - No outer scrolling. Composer textarea grows up to its max and then
 *    scrolls internally.
 */

const EXAMPLES = [
  { n: "01", label: "Realtime collaborative whiteboard",
    seed: "Realtime collaborative whiteboard for design teams. Low-latency cursors, infinite canvas, version history, AI-assisted suggestions. 50K users in year 1, India + SEA. Free + Pro plans." },
  { n: "02", label: "B2B logistics with live GPS",
    seed: "B2B logistics platform that ingests GPS pings from 100K trucks every 5 seconds, computes ETAs, dispatches alerts. India-first, integrates with TMS systems." },
  { n: "03", label: "AI customer support copilot",
    seed: "AI-powered customer support copilot for D2C brands. Reads ticket history, drafts replies, escalates to human, integrates with Shopify + WhatsApp Business API." },
  { n: "04", label: "ABDM-compliant health vault",
    seed: "Privacy-preserving health records vault for Indian hospitals. ABDM compliant, end-to-end encrypted, consent-based sharing, audit log, mobile + web." },
] as const;

export function HomeCockpit({
  signedIn,
  credits,
  user,
}: {
  signedIn: boolean;
  credits?: number;
  user?: ProfileChipUser | null;
}) {
  const router = useRouter();
  const [brief, setBrief] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const tooShort = brief.trim().length < 30;

  function handleSubmit() {
    if (tooShort) {
      toast.error("Add at least a sentence or two so the architect can work.");
      return;
    }
    if (!signedIn) {
      // Seed the brief into login → /new flow.
      const seed = encodeURIComponent(brief);
      router.push(`/login?seed=${seed}`);
      return;
    }
    const seed = encodeURIComponent(brief);
    router.push(`/new?seed=${seed}`);
  }

  return (
    <div className="relative flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-[1fr_360px]">
      {/* Profile chip — fixed top-right of viewport */}
      {signedIn && user && (
        <div className="absolute right-5 top-5 z-30">
          <ProfileChip user={user} credits={credits} />
        </div>
      )}
      {!signedIn && (
        <div className="absolute right-5 top-5 z-30">
          <Link
            href="/login"
            className="btn-pill btn-pill-sm"
          >
            Sign in
            <span className="ms text-[16px]" aria-hidden>arrow_outward</span>
          </Link>
        </div>
      )}

      {/* Canvas */}
      <section className="min-h-0 overflow-auto scrollbar-thin">
        <div className="h-full flex flex-col p-8 md:p-12 lg:p-14 xl:p-16">
          {/* eyebrow */}
          <div className="flex items-baseline gap-3 mb-6">
            <span className="section-num">§ Design</span>
            <span className="text-[12px] text-[hsl(var(--ink-3))]">Cloud architecture, in minutes.</span>
          </div>

          <h1 className="display-tight text-[clamp(2.4rem,5vw,4.6rem)] leading-[0.94] tracking-[-0.045em] max-w-[16ch]">
            Describe a system.{" "}
            <span className="serif font-normal italic accent">Get a design.</span>
          </h1>

          <p className="mt-5 text-[15px] leading-[1.55] text-[hsl(var(--ink-2))] max-w-[58ch]">
            Plain English in. Production cloud architecture out — diagrams, components,
            cost tiers, risks, security model. Powered by Gemini on Vertex AI.
          </p>

          {/* Composer */}
          <div className="mt-8 card-paper relative flex flex-col p-5 md:p-6 focus-within:border-[hsl(var(--ink))] transition-colors">
            <div className="flex items-baseline justify-between pb-3 border-b border-[hsl(var(--line))]">
              <span className="section-num text-[10.5px]">§ Brief</span>
              <span className="font-mono text-[10px] tabular-nums uppercase tracking-wider text-[hsl(var(--ink-3))]">
                {brief.length.toLocaleString("en-IN")} / 8,000
              </span>
            </div>
            <textarea
              ref={textareaRef}
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              placeholder="A B2B logistics platform that ingests GPS pings from 100K trucks every 5 seconds, computes ETAs, and dispatches alerts. India-first, integrates with TMS systems."
              maxLength={8000}
              rows={4}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              className="block w-full resize-none bg-transparent pt-4 pb-3 text-[16px] leading-[1.55] text-[hsl(var(--ink))] placeholder:text-[hsl(var(--ink-3))] focus:outline-none scrollbar-thin max-h-[28vh]"
            />
            <div className="flex items-center justify-between gap-3 pt-3 border-t border-[hsl(var(--line))]">
              <span className="text-[11.5px] text-[hsl(var(--ink-3))]">
                {signedIn
                  ? "1 credit · refunded on failure"
                  : "Sign in to design — sample is free to explore"}
              </span>
              <div className="flex items-center gap-3">
                <kbd className="hidden md:inline-flex items-center rounded-md border border-[hsl(var(--line-2))] bg-[hsl(var(--paper-2))] px-2 py-1 text-[10.5px] font-mono text-[hsl(var(--ink-3))]">
                  ⌘↵
                </kbd>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={tooShort}
                  className={cn(
                    "btn-pill press",
                    tooShort
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

          {/* Spacer pushes nothing — page never scrolls */}
          <div className="mt-auto pt-8 flex items-baseline gap-5 text-[11px] font-mono uppercase tracking-wider text-[hsl(var(--ink-3))]">
            <span>Vol 01 · Issue 05</span>
            <span className="opacity-50">·</span>
            <span>Bengaluru · IST</span>
            <span className="opacity-50">·</span>
            <span>Powered by Gemini on Vertex AI</span>
          </div>
        </div>
      </section>

      {/* Inspector */}
      <aside className="hidden xl:flex flex-col min-h-0 border-l border-[hsl(var(--line))] bg-[hsl(var(--paper))]">
        <div className="flex-1 min-h-0 overflow-auto scrollbar-thin">
          <div className="p-6 lg:p-7 flex flex-col gap-7">
            {/* Examples */}
            <div>
              <div className="flex items-baseline justify-between">
                <span className="section-num text-[10.5px]">§ Examples</span>
                <span className="font-mono text-[10px] text-[hsl(var(--ink-3))]">{EXAMPLES.length}</span>
              </div>
              <ul className="mt-4 divide-y divide-[hsl(var(--line))] border-y border-[hsl(var(--line))]">
                {EXAMPLES.map((ex) => (
                  <li key={ex.n}>
                    <button
                      type="button"
                      onClick={() => {
                        setBrief(ex.seed);
                        textareaRef.current?.focus();
                      }}
                      className="group w-full flex items-start gap-3 py-3 text-left hover:bg-[hsl(var(--paper-2))]/60 -mx-2 px-2 rounded-lg transition-colors"
                    >
                      <span className="font-mono text-[10.5px] tabular-nums text-[hsl(var(--ink-3))] mt-0.5 w-5 shrink-0">
                        {ex.n}
                      </span>
                      <span className="flex-1 text-[13px] leading-[1.4] text-[hsl(var(--ink))]">
                        {ex.label}
                      </span>
                      <span className="ms text-[16px] text-[hsl(var(--ink-3))] group-hover:text-[hsl(var(--ink))] mt-0.5 shrink-0" aria-hidden>
                        north_east
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Sample shortcut */}
            <div className="border-t border-[hsl(var(--line))] pt-5">
              <span className="section-num text-[10.5px]">§ See it built</span>
              <h3 className="mt-4 display text-[18px] tracking-[-0.02em]">
                A complete report for an imaginary product.
              </h3>
              <p className="mt-2 text-[12.5px] leading-relaxed text-[hsl(var(--ink-2))]">
                ScribeStack — a notion-meets-google-docs collaborative writing
                platform. Fully designed, exactly what you&rsquo;d get.
              </p>
              <Link
                href="/sample"
                className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-[hsl(var(--accent))] hover:underline"
              >
                Open the sample
                <span className="ms text-[16px]" aria-hidden>arrow_forward</span>
              </Link>
            </div>

            {/* Credits / account hint */}
            {signedIn && typeof credits === "number" && (
              <div className="border-t border-[hsl(var(--line))] pt-5">
                <span className="section-num text-[10.5px]">§ Balance</span>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="display-tight text-[40px] leading-none tabular-nums">{credits}</span>
                  <span className="eyebrow">credits</span>
                </div>
                <Link
                  href="/pricing"
                  className="mt-3 inline-flex items-center gap-1 text-[12px] text-[hsl(var(--ink-2))] hover:text-[hsl(var(--ink))]"
                >
                  Top up
                  <span className="ms text-[14px]" aria-hidden>arrow_forward</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
