import Link from "next/link";
import { getSessionUser } from "@/lib/firebase/auth";
import { Footer } from "@/components/shared/Footer";
import { ScrollProgress } from "@/components/motion/ScrollProgress";
import { FadeIn } from "@/components/motion/FadeIn";
import {
  AmbientDiagram,
  DrawnUnderline,
  HeroStats,
  MagneticCTA,
  PricingChips,
  RotatingQuotes,
  StepVisual,
  TiltCard,
} from "@/components/landing";

export const metadata = {
  title: "Tessar — Senior cloud architect, on tap",
  description:
    "Brief in. A 14-section, schema-validated cloud architecture out — components, C4 diagrams, scored risks, applied patterns, monthly cost in INR, roadmap. Sized to your scale. ₹300 a design. First one on us.",
};

export default async function HomePage() {
  const user = await getSessionUser();
  const signedIn = !!user;
  const primaryHref = signedIn ? "/studio" : "/login?next=/studio";
  const primaryLabel = signedIn ? "Open studio" : "Start free — first design on us";

  return (
    <div className="grain min-h-screen bg-[hsl(var(--paper))] text-[hsl(var(--ink))]">
      <ScrollProgress thickness={2} />
      {/* HERO */}
      <section className="relative px-6 pt-20 pb-20 md:px-12 md:pt-28 md:pb-28">
        {/* Ambient diagram in negative space — lg+ only, behind text, soft opacity. */}
        <div
          aria-hidden
          className="pointer-events-none absolute right-0 top-[7%] hidden h-[60%] w-[44%] max-w-[560px] opacity-[0.55] lg:block xl:opacity-65"
        >
          <AmbientDiagram className="h-full w-full" />
        </div>

        <div className="relative mx-auto max-w-[1320px]">
          <div className="m3-page-enter flex items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--line))] bg-[hsl(var(--paper-2))] px-3 py-1 text-[11.5px]">
              <span className="size-1.5 rounded-full bg-[hsl(var(--ink-3))]" />
              <span className="font-mono uppercase tracking-[0.16em] text-[hsl(var(--ink-2))]">
                First design free, no credit card
              </span>
            </span>
          </div>

          <h1 className="m3-page-enter mt-8 display-tight text-[clamp(3.2rem,9.2vw,8.5rem)] leading-[0.88] tracking-[-0.045em] max-w-[16ch]">
            Senior architect,{" "}
            <span className="relative inline-block">
              <span className="serif font-normal italic accent">on tap.</span>
              <DrawnUnderline delay={0.6} thickness={3} />
            </span>
          </h1>

          <p className="m3-page-enter mt-10 max-w-[58ch] text-[18px] leading-[1.55] text-[hsl(var(--ink-2))]">
            Tessar reads your brief and writes a 14-section, schema-validated cloud architecture — components,
            diagrams, monthly cost in INR, scored risks, security controls, applied patterns, roadmap. Sized to
            your scale automatically: 8 services for a side-project, 50+ for hyperscale. Downloadable as PDF,
            PowerPoint, or Markdown. A complete report your engineers will actually read.
          </p>

          <div className="m3-page-enter mt-12 flex flex-wrap items-center gap-4">
            <MagneticCTA href={primaryHref} variant="accent" size="lg">
              {primaryLabel}
              <span className="ms text-[20px]" aria-hidden>arrow_forward</span>
            </MagneticCTA>
            <Link href="/sample" className="btn-pill btn-pill-ghost btn-pill-lg">
              See a real sample
              <span className="ms text-[18px]" aria-hidden>north_east</span>
            </Link>
          </div>

          <p className="mt-6 text-[12.5px] text-[hsl(var(--ink-3))]">
            Google sign-in. Your first design free, no card. Then ₹300 a design — no subscription, no seats, refunded if a run fails.
          </p>

          <HeroStats />
        </div>
      </section>

      {/* WHAT'S IN EVERY REPORT */}
      <section className="border-t border-[hsl(var(--line))] bg-[hsl(var(--paper-2))] px-6 py-28 md:px-12">
        <div className="mx-auto max-w-[1320px] scroll-reveal">
          <div className="rule-dots flex items-baseline justify-between pb-4">
            <p className="section-num">The deliverable</p>
          </div>

          <h2 className="mt-14 display text-[clamp(2.2rem,4.5vw,3.6rem)] leading-[1.04] tracking-[-0.03em] max-w-[26ch]">
            What lands in your downloads folder.{" "}
            <span className="serif italic accent">Same shape, every time.</span>
          </h2>

          <p className="mt-6 max-w-[58ch] text-[16px] leading-[1.6] text-[hsl(var(--ink-2))]">
            Every Tessar report follows the same 14-section contract — nothing missing, nothing improvised.
            What changes is the depth: a side-project gets a clean, focused report; a hyperscale brief gets a
            decomposed system with bounded contexts, multiple diagrams, and 30+ services.
          </p>

          <div className="mt-14 grid gap-px bg-[hsl(var(--line))] border border-[hsl(var(--line))] md:grid-cols-2">
            <ReportFacet
              label="What you get"
              tone="paper"
              items={[
                "14 sections, structured the same every time",
                "8–50 components, sized to the brief",
                "6+ diagrams: C4-context, C4-container, sequence, ER, deployment, data-flow",
                "Tech stack with rationale and alternatives per layer",
                "Monthly cost in INR — per service, with line items",
                "Risk register scored by likelihood × impact",
                "Security controls across identity, network, data, secrets, supply chain",
                "Observability plan: metrics, logs, traces, SLOs, alerts",
                "Phased roadmap with milestones and open questions",
              ]}
            />
            <ReportFacet
              label="How it's built"
              tone="ink"
              items={[
                "Schema-validated by Zod — failed runs auto-refund your credit",
                "Scale-adaptive: 8 services for a side-project, 50+ for hyperscale",
                "42 named cloud patterns from the canon, mapped into your risks",
                "India-native: asia-south1 SKUs, INR pricing, DPDP-aware",
                "Downloadable as PDF, PowerPoint, or Markdown — same source of truth",
                "Permanent, versioned, public-shareable URL — link it in a PR",
                "Defensive layout, structured logs, and a verified Razorpay receipt per pack",
              ]}
            />
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="border-t border-[hsl(var(--line))] px-6 py-28 md:px-12">
        <div className="mx-auto max-w-[1320px] scroll-reveal">
          <div className="rule-dots flex items-baseline justify-between pb-4">
            <p className="section-num">How it works</p>
          </div>

          <h2 className="mt-14 display text-[clamp(2.2rem,4.5vw,3.6rem)] leading-[1.04] tracking-[-0.03em] max-w-[24ch]">
            Three steps from idea{" "}
            <span className="serif italic accent">to a design you can argue with</span>.
          </h2>

          <div className="mt-16 grid gap-px bg-[hsl(var(--line))] border border-[hsl(var(--line))] md:grid-cols-3">
            <Step
              n="01"
              title="Describe"
              kind="describe"
              body="One paragraph. Plain English. Scale, geography, integrations, budget — whatever you know. Vague is fine."
            />
            <Step
              n="02"
              title="Tessar designs"
              kind="design"
              body="The architect reads your brief and produces the full report: components, diagrams, monthly cost in INR, risks, security, patterns."
            />
            <Step
              n="03"
              title="You ship"
              kind="ship"
              body="Export as PDF, PowerPoint, or Markdown. Iterate. Hand the BOM to engineering. Argue with it — that's the point."
            />
          </div>
        </div>
      </section>

      {/* WHAT YOU GET */}
      <section id="why" className="border-t border-[hsl(var(--line))] bg-[hsl(var(--paper-2))] px-6 py-28 md:px-12">
        <div className="mx-auto max-w-[1320px] scroll-reveal">
          <div className="rule-dots flex items-baseline justify-between pb-4">
            <p className="section-num">What you get</p>
          </div>

          <h2 className="mt-14 display text-[clamp(2.2rem,4.5vw,3.6rem)] leading-[1.04] tracking-[-0.03em] max-w-[26ch]">
            A complete report. <span className="serif italic">Same shape, every time.</span>
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
              body="Every component named: which cloud service, which tier, which region. Stop hand-rolling lists."
            />
            <Feature
              icon="payments"
              title="Costs in INR"
              body="Monthly cost modelling in INR — per service, asia-south1 SKUs, GST inclusive. No translating from US dollars."
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
              title="Cloud-agnostic"
              body="Pick GCP, AWS, Azure or multi-cloud — the architect maps native services for whichever you choose."
            />
          </div>
        </div>
      </section>

      {/* QUOTE */}
      <section className="border-t border-[hsl(var(--line))] bg-[hsl(var(--ink))] text-[hsl(var(--paper))] px-6 py-28 md:px-12">
        <div className="mx-auto max-w-[1100px] scroll-reveal">
          <RotatingQuotes />
        </div>
      </section>

      {/* SAMPLE CTA */}
      <section className="border-t border-[hsl(var(--line))] px-6 py-28 md:px-12">
        <div className="mx-auto max-w-[1320px] scroll-reveal">
          <div className="rule-dots flex items-baseline justify-between pb-4">
            <p className="section-num">See it built</p>
          </div>

          <div className="mt-14 grid gap-12 lg:grid-cols-[1.2fr_1fr] items-end">
            <div>
              <h2 className="display text-[clamp(2.2rem,4.5vw,3.6rem)] leading-[1.04] tracking-[-0.03em] max-w-[20ch]">
                A complete report,{" "}
                <span className="serif italic accent">for an imaginary product.</span>
              </h2>
              <p className="mt-8 text-[16px] leading-[1.6] text-[hsl(var(--ink-2))] max-w-[58ch]">
                ScribeStack — a Notion-meets-Google-Docs collaborative writing platform.
                Fully architected: 12 components, 9 risks, 14 patterns.
                Open it and scroll — that&rsquo;s exactly what you get for your own brief.
              </p>
              <div className="mt-10">
                <MagneticCTA href="/sample" variant="accent" size="lg">
                  Open the sample
                  <span className="ms text-[20px] transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-1" aria-hidden>arrow_forward</span>
                </MagneticCTA>
              </div>
            </div>

            <TiltCard max={4} className="">
              <div className="card-paper p-7 md:p-9">
                <p className="section-num text-[10.5px]">Inside the sample</p>
                <ul className="mt-5 divide-y divide-[hsl(var(--line))]">
                  {[
                    ["Components", "12"],
                    ["System diagrams", "2"],
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
            </TiltCard>
          </div>
        </div>
      </section>

      {/* COMPARISON STUDIES */}
      <section className="border-t border-[hsl(var(--line))] bg-[hsl(var(--paper))] px-6 py-28 md:px-12">
        <div className="mx-auto max-w-[1320px] scroll-reveal">
          <div className="rule-dots flex items-baseline justify-between pb-4">
            <p className="section-num">Comparison studies</p>
            <span className="hidden md:inline font-mono text-[11px] uppercase tracking-[0.16em] text-[hsl(var(--ink-3))]">
              New
            </span>
          </div>

          <div className="mt-14 grid gap-14 lg:grid-cols-[1.1fr_1fr] items-start">
            <h2 className="display text-[clamp(2.2rem,4.5vw,3.6rem)] leading-[1.04] tracking-[-0.03em] max-w-[22ch]">
              Can&apos;t decide between AWS, Azure and GCP?{" "}
              <span className="serif italic accent">Run them side by side.</span>
            </h2>
            <div>
              <p className="text-[16px] leading-[1.6] text-[hsl(var(--ink-2))] max-w-[54ch]">
                Pick a dimension — cloud, style, datastore, deployment, cost posture —
                and Tessar runs the same brief through every variant in parallel. You
                land in a nine-lens cockpit: verdict, architecture, performance, scale,
                cost, reliability, security, ops burden, lock-in. Pick your favourite
                slice from each variant and synthesize one final architecture.
              </p>
              <ul className="mt-8 grid gap-3 text-[14px]">
                <Bullet>3 parallel variants · same brief, different cloud or style</Bullet>
                <Bullet>9 lenses — every number clickable for the agent&apos;s reasoning</Bullet>
                <Bullet>Live scenario slider — see costs and latency repaint at your load</Bullet>
                <Bullet>Decision tray — keep what works from each, synthesize the rest</Bullet>
              </ul>
              <div className="mt-10 flex flex-wrap items-center gap-4">
                <Link href={signedIn ? "/studies/new" : "/login?next=/studies/new"} className="btn-pill btn-pill-accent btn-pill-lg">
                  Start a study
                  <span className="ms text-[18px]" aria-hidden>compare_arrows</span>
                </Link>
                <Link href="/studio" className="link-ink text-[14px]">
                  Or design a single system
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="border-t border-[hsl(var(--line))] bg-[hsl(var(--paper-2))] px-6 py-28 md:px-12">
        <div className="mx-auto max-w-[1320px] scroll-reveal">
          <div className="rule-dots flex items-baseline justify-between pb-4">
            <p className="section-num">Pricing</p>
          </div>

          <div className="mt-14 grid gap-14 lg:grid-cols-[1.1fr_1fr] items-start">
            <h2 className="display text-[clamp(2.2rem,4.5vw,3.6rem)] leading-[1.04] tracking-[-0.03em] max-w-[18ch]">
              First design on us.{" "}
              <span className="serif italic accent">Then ₹300 each.</span>
            </h2>
            <div>
              <p className="text-[16px] leading-[1.6] text-[hsl(var(--ink-2))] max-w-[52ch]">
                A freelance architect charges ₹50,000+ and takes two weeks for this report.
                Tessar ships it in minutes for ₹300. Pay only when you generate —
                no subscription, no seats, no annual lock-in. Failed runs auto-refund.
              </p>
              <ul className="mt-8 grid gap-3 text-[14px]">
                <Bullet>1 free design the moment you sign in</Bullet>
                <Bullet>₹300 / design — packs of 3 (₹840), 10 (₹2,500) and 50 (₹10,000 — ₹200 each)</Bullet>
                <Bullet>Failed runs refund automatically</Bullet>
                <Bullet>Credits never expire</Bullet>
                <Bullet>One Razorpay invoice per pack</Bullet>
              </ul>
              <PricingChips />
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
        <div className="mx-auto max-w-[1320px] text-center scroll-reveal">
          <h2 className="display-tight text-[clamp(3rem,9vw,8rem)] leading-[0.88] tracking-[-0.045em]">
            Your first design{" "}
            <span className="serif font-normal italic accent">is on us.</span>
          </h2>
          <p className="mx-auto mt-10 max-w-[52ch] text-[16px] leading-[1.6] text-[hsl(var(--ink-2))]">
            No credit card. Sign in with Google, bring a system, leave with a report you can ship.
          </p>
          <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
            <MagneticCTA href={primaryHref} variant="accent" size="lg">
              {primaryLabel}
              <span className="ms text-[20px]" aria-hidden>arrow_forward</span>
            </MagneticCTA>
            <Link href="/sample" className="btn-pill btn-pill-ghost btn-pill-lg">
              See the sample first
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <Footer />
    </div>
  );
}

function Step({
  n,
  title,
  body,
  kind,
}: {
  n: string;
  title: string;
  body: string;
  kind?: "describe" | "design" | "ship";
}) {
  return (
    <div className="bg-[hsl(var(--paper))] p-8 md:p-10">
      <div className="flex items-start justify-between gap-4">
        <div className="display-tight text-[clamp(3rem,5vw,4.5rem)] leading-none tracking-[-0.05em] text-[hsl(var(--ink-3))]">
          {n}
        </div>
        {kind && (
          <div className="w-[44%] max-w-[180px] shrink-0">
            <StepVisual kind={kind} />
          </div>
        )}
      </div>
      <h3 className="mt-6 display text-[22px] tracking-[-0.02em]">{title}</h3>
      <p className="mt-3 text-[14.5px] leading-[1.6] text-[hsl(var(--ink-2))]">{body}</p>
    </div>
  );
}

function Feature({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <div className="group relative bg-[hsl(var(--paper))] p-7 transition-colors duration-300 hover:bg-[hsl(var(--card))] md:p-8">
      {/* Top accent rail that draws in on hover */}
      <span
        aria-hidden
        className="pointer-events-none absolute left-0 top-0 h-px w-0 bg-[hsl(var(--accent))] transition-[width] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:w-full"
      />
      <span
        className="ms inline-block text-[28px] text-[hsl(var(--ink))] transition-[transform,color] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.12] group-hover:text-[hsl(var(--accent))]"
        aria-hidden
      >
        {icon}
      </span>
      <h3 className="mt-5 display text-[18px] tracking-[-0.02em] transition-colors duration-300 group-hover:text-[hsl(var(--accent-ink))]">
        {title}
      </h3>
      <p className="mt-2 text-[13.5px] leading-[1.6] text-[hsl(var(--ink-2))]">{body}</p>
    </div>
  );
}

function ReportFacet({
  label,
  tone,
  items,
}: {
  label: string;
  tone: "paper" | "ink";
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
        {label}
      </p>
      <ul className="mt-7 space-y-3">
        {items.map((t, i) => (
          <li key={i} className="flex items-start gap-3 text-[14.5px] leading-[1.55]">
            <span
              className={
                dark
                  ? "ms text-[18px] text-[hsl(var(--accent))] mt-0.5"
                  : "ms text-[18px] text-[hsl(var(--ink))] mt-0.5"
              }
              aria-hidden
            >
              check_circle
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
