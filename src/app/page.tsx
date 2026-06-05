import Link from "next/link";
import { getSessionUser } from "@/lib/firebase/auth";
import { LandingTopBar } from "@/components/landing/LandingTopBar";
import { Footer } from "@/components/shared/Footer";

const SUGGESTIONS = [
  "A real-time multiplayer whiteboard for 50k concurrent users",
  "A WhatsApp-style chat app for 200M users with E2E encryption",
  "An edge-deployed AI assistant under 200ms p95 latency",
  "A multi-region payments ledger with strict consistency",
  "A short-form video CDN serving 10B minutes per month",
];

const FEATURES = [
  {
    n: "01",
    title: "Diagrams that ship.",
    body: "Real Mermaid graphs of your topology, data flow, deployment, and request paths — copy-paste into your RFC.",
    tag: "Diagrams",
  },
  {
    n: "02",
    title: "Named components.",
    body: "Cloud Run, BigQuery, Pub/Sub, Memorystore — selected with reasons, not generic boxes labelled “service.”",
    tag: "Components",
  },
  {
    n: "03",
    title: "Costs in numbers.",
    body: "Per-scale-tier estimates with the actual SKUs driving the bill — so you argue with finance using receipts.",
    tag: "FinOps",
  },
  {
    n: "04",
    title: "Risks, written down.",
    body: "Likelihood × impact, with mitigations. Failure modes that get caught in design review — not on launch night.",
    tag: "Risk",
  },
  {
    n: "05",
    title: "Security by default.",
    body: "IAM boundaries, secret rotation, network egress, OWASP coverage — every report ships a threat model.",
    tag: "Security",
  },
  {
    n: "06",
    title: "Scale, three tiers deep.",
    body: "Starter, growth, and hyperscale. Each tier rewrites the architecture — different DBs, different patterns, different price.",
    tag: "Scale",
  },
];

const STEPS = [
  {
    k: "Describe",
    t: "Say it in plain English.",
    d: "“A booking platform like Cleartrip with 5M MAU.” That’s the brief. No forms, no questionnaires, no checklists.",
  },
  {
    k: "Reason",
    t: "Gemini 2.5 Pro thinks it through.",
    d: "Patterns, trade-offs, scale math, SKU selection. It cites Google Cloud reference architectures along the way.",
  },
  {
    k: "Read",
    t: "Open the report.",
    d: "Magazine-style. Skim the diagrams, dive into a component, jump to risks. Share the URL with your team.",
  },
];

export default async function LandingPage() {
  const user = await getSessionUser();
  const signedIn = !!user;

  return (
    <div className="grain min-h-screen bg-[hsl(var(--paper))] text-[hsl(var(--ink))]">
      <LandingTopBar signedIn={signedIn} />

      {/* ───────────────────────── HERO ───────────────────────── */}
      <section className="relative pt-[152px] md:pt-[176px] pb-24">
        <div className="mx-auto w-full max-w-[1480px] px-6 md:px-12 lg:px-16">
          {/* Issue header */}
          <div className="rule-dots flex items-baseline justify-between pb-4">
            <div className="flex items-center gap-3">
              <span className="tag tag-accent">Vol. 01 · Issue 05</span>
              <span className="eyebrow hidden sm:inline">The Architecture Quarterly</span>
            </div>
            <span className="eyebrow hidden md:inline">Bengaluru · IST</span>
          </div>

          {/* Headline */}
          <div className="mt-10 grid gap-10 lg:grid-cols-[1.45fr_1fr] lg:gap-16">
            <h1 className="display-tight text-balance text-[clamp(3.4rem,11.5vw,11rem)] leading-[0.86] tracking-[-0.045em]">
              Cloud<br />
              architecture,<br />
              <span className="serif font-normal">written</span>{" "}
              <span className="accent">in minutes.</span>
            </h1>

            <div className="flex flex-col justify-end gap-6 pb-2">
              <p className="text-[18px] leading-[1.55] text-[hsl(var(--ink-2))] max-w-[40ch]">
                Describe your system in plain English. Get a production-grade
                report — diagrams, components, costs, risks, security, and
                three scale tiers — ready for your design review.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Link href={signedIn ? "/new" : "/login?next=/new"} className="btn-pill-accent btn-pill-lg">
                  Start designing
                  <span className="ms text-[20px]" aria-hidden>arrow_forward</span>
                </Link>
                <Link href="/sample" className="btn-pill-ghost btn-pill-lg">
                  Read a sample
                </Link>
              </div>
              <div className="flex items-center gap-4 pt-2 text-[13px] text-[hsl(var(--ink-3))]">
                <span className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-emerald-600" />
                  Live · Gemini 2.5 Pro on Vertex AI
                </span>
                <span className="opacity-40">·</span>
                <span>No card required</span>
              </div>
            </div>
          </div>

          {/* Suggestion ticker */}
          <div className="mt-20 border-y border-[hsl(var(--line))] py-6">
            <div className="flex items-center gap-4">
              <span className="section-num shrink-0">§ Try saying</span>
              <div className="marquee overflow-hidden">
                <div className="marquee-track flex items-center gap-8 will-change-transform">
                  {[...SUGGESTIONS, ...SUGGESTIONS].map((s, i) => (
                    <Link
                      key={i}
                      href={signedIn ? `/new?prompt=${encodeURIComponent(s)}` : "/login?next=/new"}
                      className="shrink-0 text-[18px] md:text-[22px] text-[hsl(var(--ink-2))] hover:text-[hsl(var(--ink))] ulgrow"
                    >
                      “{s}.”
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────── FEATURE ASYMMETRIC ───────────────────────── */}
      <section id="why" className="relative pb-32">
        <div className="mx-auto w-full max-w-[1480px] px-6 md:px-12 lg:px-16">
          <div className="grid gap-10 lg:grid-cols-[1fr_2.4fr] lg:gap-20">
            <div className="lg:sticky lg:top-32 lg:self-start">
              <p className="section-num">§ Inside every report</p>
              <h2 className="display mt-5 text-[clamp(2.4rem,5vw,4.2rem)] leading-[0.95] tracking-[-0.035em]">
                Six chapters,<br />no fluff.
              </h2>
              <p className="mt-6 text-[16px] text-[hsl(var(--ink-2))] max-w-[36ch]">
                Each report follows the same structure — so engineers, finance,
                and security teams know exactly where to look.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-[hsl(var(--line))] border border-[hsl(var(--line))]">
              {FEATURES.map((f) => (
                <article
                  key={f.n}
                  className="group bg-[hsl(var(--paper))] p-8 md:p-10 transition-colors hover:bg-[hsl(var(--paper-2))]"
                >
                  <div className="flex items-baseline justify-between">
                    <span className="display text-[44px] tracking-[-0.04em] text-[hsl(var(--ink-3))] group-hover:text-[hsl(var(--accent))] transition-colors">
                      {f.n}
                    </span>
                    <span className="tag">{f.tag}</span>
                  </div>
                  <h3 className="display mt-6 text-[28px] leading-[1.05] tracking-[-0.02em]">{f.title}</h3>
                  <p className="mt-3 text-[15px] leading-relaxed text-[hsl(var(--ink-2))]">{f.body}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────── BIG PULL QUOTE ───────────────────────── */}
      <section className="relative border-y border-[hsl(var(--line))] bg-[hsl(var(--paper-2))] py-28">
        <div className="mx-auto max-w-[1480px] px-6 md:px-12 lg:px-16">
          <p className="section-num">§ Editor’s note</p>
          <p className="display mt-6 text-[clamp(2rem,5vw,4.5rem)] leading-[1.05] tracking-[-0.035em] max-w-[22ch]">
            <span className="serif font-normal italic">“Most architecture diagrams</span>{" "}
            are wishful thinking with arrows. Tessar writes the{" "}
            <span className="accent">receipts.”</span>
          </p>
          <p className="mt-6 eyebrow">— A staff engineer, somewhere in production</p>
        </div>
      </section>

      {/* ───────────────────────── HOW IT WORKS ───────────────────────── */}
      <section id="how" className="relative py-32">
        <div className="mx-auto w-full max-w-[1480px] px-6 md:px-12 lg:px-16">
          <div className="flex items-baseline justify-between border-b border-[hsl(var(--line))] pb-5">
            <p className="section-num">§ How it works</p>
            <p className="eyebrow hidden md:inline">Three steps · about four minutes</p>
          </div>

          <ol className="mt-12 grid gap-px bg-[hsl(var(--line))] border border-[hsl(var(--line))] md:grid-cols-3">
            {STEPS.map((s, i) => (
              <li key={s.k} className="bg-[hsl(var(--paper))] p-10">
                <div className="flex items-center gap-3">
                  <span className="display text-[64px] leading-none tracking-[-0.04em]">{i + 1}</span>
                  <span className="tag tag-solid">{s.k}</span>
                </div>
                <h3 className="display mt-8 text-[26px] leading-[1.1] tracking-[-0.02em]">{s.t}</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-[hsl(var(--ink-2))]">{s.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ───────────────────────── STATS STRIP ───────────────────────── */}
      <section className="relative border-y border-[hsl(var(--line))] py-16">
        <div className="mx-auto w-full max-w-[1480px] px-6 md:px-12 lg:px-16">
          <div className="grid grid-cols-2 gap-10 md:grid-cols-4">
            <Stat n="~4 min" k="Median report" />
            <Stat n="3×" k="Scale tiers" />
            <Stat n="14" k="Component categories" />
            <Stat n="Gemini 2.5" k="Pro · Vertex AI" />
          </div>
        </div>
      </section>

      {/* ───────────────────────── CLOSING CTA ───────────────────────── */}
      <section className="relative py-32">
        <div className="mx-auto w-full max-w-[1480px] px-6 md:px-12 lg:px-16">
          <div className="card-ink relative overflow-hidden p-12 md:p-20">
            <div aria-hidden className="pointer-events-none absolute -right-32 -top-32 size-[420px] rounded-full bg-[hsl(var(--accent))]/30 blur-[120px]" />
            <p className="font-mono text-[12px] uppercase tracking-[0.18em] text-[hsl(var(--paper))]/55">§ Next issue</p>
            <h2 className="display mt-5 text-[clamp(2.6rem,7vw,6rem)] leading-[0.95] tracking-[-0.04em] text-[hsl(var(--paper))]">
              Your system,<br />in print.
            </h2>
            <p className="mt-6 max-w-[50ch] text-[17px] leading-relaxed text-[hsl(var(--paper))]/75">
              Skip the whiteboard photo. Skip the half-finished Figma. Start
              your next design review with a publishable architecture report.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Link
                href={signedIn ? "/new" : "/login?next=/new"}
                className="btn-pill-accent btn-pill-lg"
              >
                Design something
                <span className="ms text-[20px]" aria-hidden>arrow_forward</span>
              </Link>
              <Link
                href="/pricing"
                className="btn-pill btn-pill-lg !bg-transparent !text-[hsl(var(--paper))] !border !border-[hsl(var(--paper))]/30 hover:!bg-[hsl(var(--paper))]/10"
              >
                See pricing
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function Stat({ n, k }: { n: string; k: string }) {
  return (
    <div>
      <div className="display text-[clamp(2.6rem,5vw,4.4rem)] leading-none tracking-[-0.035em]">{n}</div>
      <div className="mt-3 eyebrow">{k}</div>
    </div>
  );
}
