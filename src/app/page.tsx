import Link from "next/link";
import { getSessionUser } from "@/lib/firebase/auth";
import { TessarLogo } from "@/components/shared/TessarLogo";

export const metadata = {
  title: "Tessar — Production cloud architecture in four minutes",
  description:
    "Describe a system in plain English. Get a defensible cloud architecture — diagrams, components, INR costs, risks, security model — in four minutes. 3 designs free.",
};

export default async function HomePage() {
  const user = await getSessionUser();
  const signedIn = !!user;
  const primaryHref = signedIn ? "/studio" : "/login?next=/studio";
  const primaryLabel = signedIn ? "Open studio" : "Start free — 3 designs on us";

  return (
    <div className="grain min-h-screen bg-[hsl(var(--paper))] text-[hsl(var(--ink))]">
      {/* HERO */}
      <section className="relative px-6 pt-20 pb-20 md:px-12 md:pt-28 md:pb-28">
        <div className="mx-auto max-w-[1320px]">
          <div className="m3-page-enter flex items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--line))] bg-[hsl(var(--paper-2))] px-3 py-1 text-[11.5px]">
              <span className="size-1.5 rounded-full bg-[hsl(var(--accent))]" />
              <span className="font-mono uppercase tracking-[0.16em] text-[hsl(var(--ink-2))]">
                3 free designs · no credit card
              </span>
            </span>
            <span className="hidden md:inline section-num">§ Volume 01 · Issue 05</span>
          </div>

          <h1 className="m3-page-enter mt-8 display-tight text-[clamp(3.2rem,9.2vw,8.5rem)] leading-[0.88] tracking-[-0.045em] max-w-[16ch]">
            Stop drawing diagrams.{" "}
            <span className="serif font-normal italic accent">Start shipping designs.</span>
          </h1>

          <p className="m3-page-enter mt-10 max-w-[58ch] text-[18px] leading-[1.55] text-[hsl(var(--ink-2))]">
            Describe a system in one paragraph. Get a production-ready cloud architecture in four
            minutes — components, diagrams, scale tiers, costs in INR, risks, security model, and
            the patterns that justify every choice.
          </p>

          <div className="m3-page-enter mt-12 flex flex-wrap items-center gap-4">
            <Link href={primaryHref} className="btn-pill btn-pill-accent btn-pill-lg">
              {primaryLabel}
              <span className="ms text-[20px]" aria-hidden>arrow_forward</span>
            </Link>
            <Link href="/sample" className="btn-pill btn-pill-ghost btn-pill-lg">
              See a real sample
              <span className="ms text-[18px]" aria-hidden>north_east</span>
            </Link>
          </div>

          <p className="mt-6 text-[12.5px] text-[hsl(var(--ink-3))]">
            One-click Google sign-in. First three designs free, no card. After that, ₹49 a design — no subscription.
          </p>

          <div className="mt-20 grid grid-cols-2 gap-x-10 gap-y-6 md:grid-cols-4 border-t border-[hsl(var(--line))] pt-10">
            <Stat n="~4m" k="median run" />
            <Stat n="14" k="report sections" />
            <Stat n="3×" k="scale tiers" />
            <Stat n="₹49" k="per design" />
          </div>
        </div>
      </section>

      {/* BEFORE / AFTER */}
      <section className="border-t border-[hsl(var(--line))] bg-[hsl(var(--paper-2))] px-6 py-28 md:px-12">
        <div className="mx-auto max-w-[1320px]">
          <div className="rule-dots flex items-baseline justify-between pb-4">
            <p className="section-num">§ The math</p>
            <p className="eyebrow hidden md:inline">Five days of work · or one paragraph</p>
          </div>

          <h2 className="mt-14 display text-[clamp(2.2rem,4.5vw,3.6rem)] leading-[1.04] tracking-[-0.03em] max-w-[26ch]">
            Most architecture docs die in a Notion tab.{" "}
            <span className="serif italic accent">Tessar ships one before the meeting ends.</span>
          </h2>

          <div className="mt-14 grid gap-px bg-[hsl(var(--line))] border border-[hsl(var(--line))] md:grid-cols-2">
            <Compare
              label="Without Tessar"
              tone="muted"
              items={[
                "Five days drawing in Lucid + Miro",
                "Cost guesses pulled from blog posts",
                "Risks discovered in production",
                "Diagrams that drift the moment you ship",
                "A doc no one reads end-to-end",
              ]}
            />
            <Compare
              label="With Tessar"
              tone="ink"
              items={[
                "A defensible draft in four minutes",
                "Three INR cost tiers — Starter / Growth / Scale",
                "Risk register scored by likelihood × impact",
                "Diagrams + components + APIs, one source of truth",
                "PDF, PowerPoint, Markdown — share with anyone",
              ]}
            />
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="border-t border-[hsl(var(--line))] px-6 py-28 md:px-12">
        <div className="mx-auto max-w-[1320px]">
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
              body="One paragraph. Plain English. Scale, geography, integrations, budget — whatever you know. Vague is fine."
            />
            <Step
              n="02"
              title="Tessar designs"
              body="The architect reads your brief and produces the full report: components, diagrams, three cost tiers, risks, security, patterns."
            />
            <Step
              n="03"
              title="You ship"
              body="Export as PDF, PowerPoint, or Markdown. Iterate. Hand the BOM to engineering. Argue with it — that's the point."
            />
          </div>
        </div>
      </section>

      {/* WHAT YOU GET */}
      <section id="why" className="border-t border-[hsl(var(--line))] bg-[hsl(var(--paper-2))] px-6 py-28 md:px-12">
        <div className="mx-auto max-w-[1320px]">
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
            <Feature
              icon="picture_as_pdf"
              title="PDF · PPTX · Markdown"
              body="Same report, three formats. Take the PDF to ops, the deck to the board, the Markdown to the repo."
            />
            <Feature
              icon="rocket_launch"
              title="Roadmap & milestones"
              body="A phased delivery plan with milestones — what to build first, second, never."
            />
            <Feature
              icon="cloud_done"
              title="GCP-native"
              body="Designed for Google Cloud out of the box — Cloud Run, Firestore, BigQuery, Spanner, Pub/Sub."
            />
          </div>
        </div>
      </section>

      {/* QUOTE */}
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
        <div className="mx-auto max-w-[1320px]">
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
                  ["Export formats", "PDF · PPTX · MD"],
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

      {/* PRICING */}
      <section className="border-t border-[hsl(var(--line))] bg-[hsl(var(--paper-2))] px-6 py-28 md:px-12">
        <div className="mx-auto max-w-[1320px]">
          <div className="rule-dots flex items-baseline justify-between pb-4">
            <p className="section-num">§ Pricing</p>
            <p className="eyebrow hidden md:inline">Honest, INR-first</p>
          </div>

          <div className="mt-14 grid gap-14 lg:grid-cols-[1.1fr_1fr] items-start">
            <h2 className="display text-[clamp(2.2rem,4.5vw,3.6rem)] leading-[1.04] tracking-[-0.03em] max-w-[18ch]">
              Three designs on us.{" "}
              <span className="serif italic accent">Then ₹49 each.</span>
            </h2>
            <div>
              <p className="text-[16px] leading-[1.6] text-[hsl(var(--ink-2))] max-w-[50ch]">
                Pay only for what you generate. No subscription, no seats, no annual lock-in.
                Top up a credit pack when you need to, otherwise pay nothing. Refunds on
                failed runs are automatic.
              </p>
              <ul className="mt-8 grid gap-3 text-[14px]">
                <Bullet>3 free designs the moment you sign in</Bullet>
                <Bullet>₹49 / design after that — billed in credit packs</Bullet>
                <Bullet>Failed runs refund automatically</Bullet>
                <Bullet>Credits never expire</Bullet>
                <Bullet>One Razorpay invoice per pack</Bullet>
              </ul>
              <div className="mt-10 flex flex-wrap items-center gap-4">
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
        <div className="mx-auto max-w-[1320px] text-center">
          <p className="section-num">§ Volume 01 · Issue 05</p>
          <h2 className="mt-10 display-tight text-[clamp(3rem,9vw,8rem)] leading-[0.88] tracking-[-0.045em]">
            Describe a system.<br />
            <span className="serif font-normal italic accent">Get a design.</span>
          </h2>
          <p className="mx-auto mt-10 max-w-[52ch] text-[16px] leading-[1.6] text-[hsl(var(--ink-2))]">
            Your first three architectures are free. No credit card. Bring a system,
            leave with a report you can ship.
          </p>
          <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
            <Link href={primaryHref} className="btn-pill btn-pill-accent btn-pill-lg">
              {primaryLabel}
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
        <div className="mx-auto max-w-[1320px] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <Link href="/" className="flex items-center gap-2.5" aria-label="Tessar home">
            <TessarLogo variant="wordmark" size={30} className="text-[hsl(var(--ink))]" />
          </Link>
          <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-[hsl(var(--ink-2))]">
            <Link href="/sample" className="hover:text-[hsl(var(--ink))]">Sample</Link>
            <Link href="/pricing" className="hover:text-[hsl(var(--ink))]">Pricing</Link>
            <Link href="/legal/privacy" className="hover:text-[hsl(var(--ink))]">Privacy</Link>
            <Link href="/legal/terms" className="hover:text-[hsl(var(--ink))]">Terms</Link>
            <a href="mailto:hello@tessar.dev" className="hover:text-[hsl(var(--ink))]">hello@tessar.dev</a>
          </nav>
          <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-[hsl(var(--ink-3))]">
            © 2026 Tessar · Bengaluru · IST
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

function Compare({
  label,
  tone,
  items,
}: {
  label: string;
  tone: "muted" | "ink";
  items: string[];
}) {
  const dark = tone === "ink";
  return (
    <div
      className={
        dark
          ? "bg-[hsl(var(--ink))] text-[hsl(var(--paper))] p-8 md:p-10"
          : "bg-[hsl(var(--paper))] p-8 md:p-10"
      }
    >
      <p
        className={
          dark
            ? "font-mono text-[11px] uppercase tracking-[0.18em] text-[hsl(var(--paper))]/65"
            : "font-mono text-[11px] uppercase tracking-[0.18em] text-[hsl(var(--ink-3))]"
        }
      >
        § {label}
      </p>
      <ul className="mt-7 space-y-3">
        {items.map((t, i) => (
          <li key={i} className="flex items-start gap-3 text-[14.5px] leading-[1.55]">
            <span
              className={
                dark
                  ? "ms text-[18px] text-[hsl(var(--accent))] mt-0.5"
                  : "ms text-[18px] text-[hsl(var(--ink-3))] mt-0.5"
              }
              aria-hidden
            >
              {dark ? "check_circle" : "remove_circle"}
            </span>
            <span className={dark ? "text-[hsl(var(--paper))]" : "text-[hsl(var(--ink-2))]"}>{t}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5">
      <span className="ms text-[18px] text-[hsl(var(--accent))] mt-0.5" aria-hidden>check_circle</span>
      <span className="text-[hsl(var(--ink-2))]">{children}</span>
    </li>
  );
}
