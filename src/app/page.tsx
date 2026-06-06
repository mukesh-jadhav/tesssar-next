import Link from "next/link";
import { getSessionUser } from "@/lib/firebase/auth";
import { LandingTopBar } from "@/components/landing/LandingTopBar";

export const metadata = {
  title: "Tessar — Cloud architecture, in four minutes",
};

export default async function HomePage() {
  const user = await getSessionUser();
  const signedIn = !!user;

  return (
    <div className="grain min-h-screen bg-[hsl(var(--paper))] text-[hsl(var(--ink))]">
      <LandingTopBar signedIn={signedIn} />

      {/* HERO */}
      <section className="relative px-6 pt-40 pb-24 md:px-12 md:pt-48 md:pb-32">
        <div className="mx-auto max-w-[1280px]">
          <p className="section-num m3-page-enter">§ Volume 01 · Cloud architecture, in four minutes</p>

          <h1 className="m3-page-enter mt-7 display-tight text-[clamp(3.2rem,9vw,8rem)] leading-[0.88] tracking-[-0.045em] max-w-[16ch]">
            Stop drawing diagrams.{" "}
            <span className="serif font-normal italic accent">Start shipping designs.</span>
          </h1>

          <p className="m3-page-enter mt-10 max-w-[58ch] text-[18px] leading-[1.55] text-[hsl(var(--ink-2))]">
            Tessar reads a paragraph of plain English and returns a production-ready cloud
            architecture — components, diagrams, scale tiers, costs in INR, risks, and a
            security model. No more whiteboard-to-doc tax. Just ship.
          </p>

          <div className="m3-page-enter mt-12 flex flex-wrap items-center gap-4">
            <Link
              href={signedIn ? "/studio" : "/login?next=/studio"}
              className="btn-pill btn-pill-accent btn-pill-lg"
            >
              {signedIn ? "Open studio" : "Start free — 1 design on us"}
              <span className="ms text-[20px]" aria-hidden>arrow_forward</span>
            </Link>
            <Link href="/sample" className="btn-pill btn-pill-ghost btn-pill-lg">
              See a real sample
              <span className="ms text-[18px]" aria-hidden>north_east</span>
            </Link>
          </div>

          {/* Trust / stats strip */}
          <div className="mt-20 grid grid-cols-2 gap-x-10 gap-y-6 md:grid-cols-4 border-t border-[hsl(var(--line))] pt-10">
            <Stat n="~4m" k="median run" />
            <Stat n="14" k="report sections" />
            <Stat n="3×" k="scale tiers" />
            <Stat n="Gemini 2.5 Pro" k="powering it" />
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="border-t border-[hsl(var(--line))] bg-[hsl(var(--paper-2))] px-6 py-28 md:px-12">
        <div className="mx-auto max-w-[1280px]">
          <div className="rule-dots flex items-baseline justify-between pb-4">
            <p className="section-num">§ How it works</p>
            <p className="eyebrow hidden md:inline">Three steps · zero meetings</p>
          </div>

          <h2 className="mt-14 display text-[clamp(2.2rem,4.5vw,3.6rem)] leading-[1.04] tracking-[-0.03em] max-w-[24ch]">
            Type a paragraph. Get a defensible design{" "}
            <span className="serif italic accent">you can argue with</span>.
          </h2>

          <div className="mt-16 grid gap-px bg-[hsl(var(--line))] border border-[hsl(var(--line))] md:grid-cols-3">
            <Step
              n="01"
              title="Describe"
              body="One paragraph. Plain English. Be vague or be specific — Tessar handles both. Scale, geography, integrations, budget — whatever you know."
            />
            <Step
              n="02"
              title="Tessar designs"
              body="Gemini 2.5 Pro on Vertex AI reads your brief and produces the full report: components, diagrams, costs, risks, security, patterns."
            />
            <Step
              n="03"
              title="You ship"
              body="Iterate, share with your team, hand the BOM to engineering. Use it as the first draft you can disagree with — not the final answer."
            />
          </div>
        </div>
      </section>

      {/* WHAT YOU GET */}
      <section id="why" className="border-t border-[hsl(var(--line))] px-6 py-28 md:px-12">
        <div className="mx-auto max-w-[1280px]">
          <div className="rule-dots flex items-baseline justify-between pb-4">
            <p className="section-num">§ What you get</p>
            <p className="eyebrow hidden md:inline">Every report includes</p>
          </div>

          <h2 className="mt-14 display text-[clamp(2.2rem,4.5vw,3.6rem)] leading-[1.04] tracking-[-0.03em] max-w-[26ch]">
            Not a chatbot reply. <span className="serif italic">A complete report.</span>
          </h2>

          <div className="mt-16 grid gap-px bg-[hsl(var(--line))] border border-[hsl(var(--line))] md:grid-cols-2 lg:grid-cols-3">
            <Feature
              icon="schema"
              title="System diagrams"
              body="Editorial-grade architecture diagrams. Nodes, wires, regions — clean enough to paste in a deck."
            />
            <Feature
              icon="inventory_2"
              title="Bill of materials"
              body="Every component named: which GCP service, which tier, which region. Stop hand-rolling lists."
            />
            <Feature
              icon="payments"
              title="Costs in INR"
              body="Starter, Growth, Scale — three tiers with realistic monthly costs for Indian operators."
            />
            <Feature
              icon="report"
              title="Risk register"
              body="Failure modes scored by likelihood × impact. Mitigations recommended for each."
            />
            <Feature
              icon="shield"
              title="Security model"
              body="Auth, authz, secret rotation, audit trail. Includes the things your CISO will ask about."
            />
            <Feature
              icon="hub"
              title="Pattern library"
              body="Which industry patterns apply — CQRS, event sourcing, fan-out, circuit breakers — and exactly where."
            />
          </div>
        </div>
      </section>

      {/* SAMPLE QUOTE */}
      <section className="border-t border-[hsl(var(--line))] bg-[hsl(var(--ink))] text-[hsl(var(--paper))] px-6 py-28 md:px-12">
        <div className="mx-auto max-w-[1100px]">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[hsl(var(--paper))]/55">§ Field report</p>

          <blockquote className="mt-12 display text-[clamp(2rem,4vw,3.4rem)] leading-[1.12] tracking-[-0.025em] max-w-[26ch]">
            <span className="serif italic">“It used to take a week</span> to produce a defensible
            architecture doc. Tessar gives you a draft you can argue with in{" "}
            <span className="accent">four minutes.”</span>
          </blockquote>

          <div className="mt-12 flex items-center gap-4">
            <div className="grid size-12 place-items-center rounded-full bg-[hsl(var(--accent))] text-[hsl(var(--paper))]">
              <span className="display text-[16px]">PR</span>
            </div>
            <div>
              <div className="text-[14px] font-medium">Priya R.</div>
              <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-[hsl(var(--paper))]/55">
                Principal engineer · Bengaluru
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SAMPLE CTA */}
      <section className="border-t border-[hsl(var(--line))] px-6 py-28 md:px-12">
        <div className="mx-auto max-w-[1280px]">
          <div className="rule-dots flex items-baseline justify-between pb-4">
            <p className="section-num">§ See it built</p>
            <p className="eyebrow hidden md:inline">No login required</p>
          </div>

          <div className="mt-14 grid gap-12 lg:grid-cols-[1.2fr_1fr] items-end">
            <div>
              <h2 className="display text-[clamp(2.2rem,4.5vw,3.6rem)] leading-[1.04] tracking-[-0.03em] max-w-[20ch]">
                A complete report,{" "}
                <span className="serif italic accent">for an imaginary product.</span>
              </h2>
              <p className="mt-8 text-[16px] leading-[1.6] text-[hsl(var(--ink-2))] max-w-[58ch]">
                ScribeStack — a Notion-meets-Google-Docs collaborative writing platform.
                Fully architected: 12 components, 3 scale tiers, 9 risks, 14 patterns.
                Open it and scroll — that&rsquo;s exactly what you get for your own brief.
              </p>
              <div className="mt-10">
                <Link href="/sample" className="btn-pill btn-pill-accent btn-pill-lg">
                  Open the sample
                  <span className="ms text-[20px]" aria-hidden>arrow_forward</span>
                </Link>
              </div>
            </div>

            <div className="card-paper p-7 md:p-9">
              <p className="section-num text-[10.5px]">§ Inside the sample</p>
              <ul className="mt-5 divide-y divide-[hsl(var(--line))]">
                {[
                  ["Components", "12"],
                  ["System diagrams", "2"],
                  ["Scale tiers", "Starter · Growth · Scale"],
                  ["Risks scored", "9"],
                  ["Cloud patterns", "14"],
                  ["Security controls", "11"],
                ].map(([k, v]) => (
                  <li key={k as string} className="flex items-baseline justify-between py-3">
                    <span className="text-[13.5px] text-[hsl(var(--ink-2))]">{k}</span>
                    <span className="display text-[15px] tabular-nums">{v}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING TEASER */}
      <section className="border-t border-[hsl(var(--line))] bg-[hsl(var(--paper-2))] px-6 py-28 md:px-12">
        <div className="mx-auto max-w-[1280px]">
          <div className="rule-dots flex items-baseline justify-between pb-4">
            <p className="section-num">§ The math</p>
            <p className="eyebrow hidden md:inline">Honest, INR-first</p>
          </div>

          <div className="mt-14 grid gap-16 lg:grid-cols-[1.1fr_1fr] items-start">
            <h2 className="display text-[clamp(2.2rem,4.5vw,3.6rem)] leading-[1.04] tracking-[-0.03em] max-w-[18ch]">
              First run is on the house.{" "}
              <span className="serif italic accent">Then ₹49 a design.</span>
            </h2>
            <div>
              <p className="text-[16px] leading-[1.6] text-[hsl(var(--ink-2))] max-w-[50ch]">
                Pay only for what you generate. No subscription, no seats, no annual lock-in.
                Top up a credit pack when you need to, otherwise pay nothing. Refunds on
                failed runs are automatic.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link href="/pricing" className="btn-pill btn-pill-lg">
                  See pricing
                  <span className="ms text-[18px]" aria-hidden>arrow_forward</span>
                </Link>
                <Link href="/legal/terms" className="link-ink text-[14px]">
                  Read the terms
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="border-t border-[hsl(var(--line))] px-6 py-32 md:px-12">
        <div className="mx-auto max-w-[1280px] text-center">
          <p className="section-num">§ Volume 01 · Issue 05</p>
          <h2 className="mt-10 display-tight text-[clamp(3rem,9vw,8rem)] leading-[0.88] tracking-[-0.045em]">
            Describe a system.<br />
            <span className="serif font-normal italic accent">Get a design.</span>
          </h2>
          <p className="mx-auto mt-10 max-w-[52ch] text-[16px] leading-[1.6] text-[hsl(var(--ink-2))]">
            Your first architecture is free. No credit card. Bring a system,
            leave with a report you can ship.
          </p>
          <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
            <Link
              href={signedIn ? "/studio" : "/login?next=/studio"}
              className="btn-pill btn-pill-accent btn-pill-lg"
            >
              {signedIn ? "Open studio" : "Start free"}
              <span className="ms text-[20px]" aria-hidden>arrow_forward</span>
            </Link>
            <Link href="/sample" className="btn-pill btn-pill-ghost btn-pill-lg">
              See the sample first
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[hsl(var(--line))] bg-[hsl(var(--paper-2))] px-6 py-12 md:px-12">
        <div className="mx-auto max-w-[1280px] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-xl bg-[hsl(var(--ink))] text-[hsl(var(--paper))]">
              <span className="display text-[14px] leading-none">T</span>
            </span>
            <div>
              <div className="display text-[16px] tracking-[-0.02em]">Tessar</div>
              <div className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-[hsl(var(--ink-3))]">
                Bengaluru · IST
              </div>
            </div>
          </div>
          <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-[hsl(var(--ink-2))]">
            <Link href="/sample" className="hover:text-[hsl(var(--ink))]">Sample</Link>
            <Link href="/pricing" className="hover:text-[hsl(var(--ink))]">Pricing</Link>
            <Link href="/legal/privacy" className="hover:text-[hsl(var(--ink))]">Privacy</Link>
            <Link href="/legal/terms" className="hover:text-[hsl(var(--ink))]">Terms</Link>
            <a href="mailto:hello@tessar.dev" className="hover:text-[hsl(var(--ink))]">hello@tessar.dev</a>
          </nav>
          <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-[hsl(var(--ink-3))]">
            © 2026 Tessar
          </div>
        </div>
      </footer>
    </div>
  );
}

function Stat({ n, k }: { n: string; k: string }) {
  return (
    <div>
      <div className="display text-[clamp(1.5rem,2.4vw,2rem)] tracking-[-0.02em] leading-none">{n}</div>
      <div className="mt-2 font-mono text-[10.5px] uppercase tracking-[0.14em] text-[hsl(var(--ink-3))]">
        {k}
      </div>
    </div>
  );
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div className="bg-[hsl(var(--paper))] p-8 md:p-10">
      <div className="display-tight text-[clamp(3rem,5vw,4.5rem)] leading-none tracking-[-0.05em] text-[hsl(var(--ink-3))]">
        {n}
      </div>
      <h3 className="mt-6 display text-[22px] tracking-[-0.02em]">{title}</h3>
      <p className="mt-3 text-[14.5px] leading-[1.6] text-[hsl(var(--ink-2))]">{body}</p>
    </div>
  );
}

function Feature({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <div className="bg-[hsl(var(--paper))] p-7 md:p-8">
      <span className="ms text-[28px] text-[hsl(var(--ink))]" aria-hidden>{icon}</span>
      <h3 className="mt-5 display text-[18px] tracking-[-0.02em]">{title}</h3>
      <p className="mt-2 text-[13.5px] leading-[1.6] text-[hsl(var(--ink-2))]">{body}</p>
    </div>
  );
}
