import Link from "next/link";
import { Logo } from "@/components/shared/Logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Footer } from "@/components/shared/Footer";
import { CreditPacksGrid } from "@/components/billing/CreditPacksGrid";
import { getSessionUser } from "@/lib/firebase/auth";
import { Reveal, Stagger, MagneticWrapper, TextReveal, Marquee } from "@/components/motion";
import { HeroPreview } from "@/components/landing/HeroPreview";
import { LandingHeader } from "@/components/landing/LandingHeader";
import {
  GitBranch,
  Layers,
  Shield,
  Network,
  ArrowRight,
  BadgeCheck,
  Zap,
  Coins,
  Eye,
  Workflow,
  FileText,
  Sparkles,
} from "lucide-react";

export default async function LandingPage() {
  const user = await getSessionUser();
  const signedIn = !!user;

  return (
    <div className="relative flex min-h-screen flex-col">
      <LandingHeader signedIn={signedIn} />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 grid-bg radial-fade opacity-[0.55]" />
        <div
          aria-hidden
          className="absolute left-1/2 top-32 -z-10 size-[600px] -translate-x-1/2 rounded-full bg-foreground/[0.025] blur-3xl animate-drift"
        />
        <div className="container pt-24 pb-20 md:pt-32 md:pb-28">
          <div className="mx-auto max-w-4xl text-center">
            <div
              className="mb-8 inline-flex animate-reveal-up items-center gap-2 rounded-full border bg-card/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur"
              style={{ animationDelay: "60ms", animationFillMode: "both" }}
            >
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500/40 opacity-75" />
                <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500" />
              </span>
              <span>Live · powered by Gemini 2.5 Pro on Vertex AI</span>
            </div>

            <h1 className="display text-balance text-[clamp(2.75rem,7.5vw,6rem)]">
              <TextReveal text="Your AI principal" delay={120} />{" "}
              <span className="italic text-foreground/95">
                <TextReveal text="architect." delay={380} />
              </span>
              <br />
              <span
                className="block animate-reveal-up text-muted-foreground/75 italic"
                style={{
                  animationDelay: "720ms",
                  animationFillMode: "both",
                }}
              >
                In minutes, not weeks.
              </span>
            </h1>

            <Reveal
              delay={900}
              className="mx-auto mt-7 max-w-2xl text-balance text-lg leading-relaxed text-muted-foreground md:text-xl"
            >
              <p>
                Describe the system you want to build. Get a production-grade architecture with
                diagrams, scale tiers, INR cost estimates, risks, and the cloud patterns that solve
                them.
              </p>
            </Reveal>

            <Reveal delay={1100} className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <MagneticWrapper strength={0.18}>
                <Button asChild size="xl" className="gap-2">
                  <Link href={signedIn ? "/new" : "/login"}>
                    {signedIn ? "Design my system" : "Start with 1 free run"}
                    <ArrowRight className="size-4 transition-transform group-hover/btn:translate-x-0.5" />
                  </Link>
                </Button>
              </MagneticWrapper>
              <Button asChild size="xl" variant="outline" className="gap-2">
                <Link href="/sample">
                  <Eye className="size-4" />
                  See a sample report
                </Link>
              </Button>
            </Reveal>

            <Reveal
              delay={1280}
              className="mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground"
            >
              <span className="inline-flex items-center gap-1.5">
                <BadgeCheck className="size-3.5" /> Built on Google Cloud
              </span>
              <span className="size-0.5 rounded-full bg-muted-foreground/40" />
              <span className="inline-flex items-center gap-1.5">
                <Coins className="size-3.5" /> INR pricing, India-first
              </span>
              <span className="size-0.5 rounded-full bg-muted-foreground/40" />
              <span className="inline-flex items-center gap-1.5">
                <Zap className="size-3.5" /> Refund on failure
              </span>
            </Reveal>
          </div>

          {/* Mini preview */}
          <Reveal delay={1450} className="mx-auto mt-20 max-w-5xl">
            <HeroPreview />
          </Reveal>
        </div>
      </section>

      {/* TRUSTED PATTERNS marquee */}
      <section className="border-y bg-card/40 py-10">
        <Reveal className="container space-y-5">
          <div className="text-center text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Every report references industry patterns
          </div>
          <Marquee speed={36} className="text-sm font-medium text-muted-foreground">
            {[
              "Saga", "Sharding", "Circuit Breaker", "Bulkhead", "CQRS",
              "Event Sourcing", "Outbox", "Sidecar", "Strangler Fig", "Cache-Aside",
              "Throttling", "Retry with Backoff", "Materialized View", "Choreography",
              "Gateway Aggregation",
            ].map((p) => (
              <span key={p} className="flex shrink-0 items-center gap-3">
                <span className="size-1 rounded-full bg-muted-foreground/40" />
                {p}
              </span>
            ))}
          </Marquee>
        </Reveal>
      </section>

      {/* OUTPUTS */}
      <section className="py-24 md:py-32">
        <div className="container">
          <SectionTitle
            eyebrow="What you get"
            title="Every angle of the system, beautifully presented."
            desc="A complete, defensible report — not a chatbot transcript."
          />
          <Stagger
            step={70}
            initialDelay={140}
            className="mt-16 grid gap-4 md:grid-cols-2 lg:grid-cols-3"
          >
            <FeatureCard
              icon={<GitBranch />}
              title="Six diagrams, always"
              desc="C4 Context, C4 Container, Deployment, Sequence, Data Flow, ER. All interactive Mermaid."
            />
            <FeatureCard
              icon={<Network />}
              title="Four scale tiers"
              desc="Startup → Growth → Scale → Hyperscale. Drag the slider, watch architecture and cost adapt."
            />
            <FeatureCard
              icon={<Coins />}
              title="Cost in INR + USD"
              desc="Line-item monthly estimates for every GCP service at every tier. No surprises."
            />
            <FeatureCard
              icon={<Shield />}
              title="Security & compliance"
              desc="Identity, network, data, secrets, supply chain, incident response — mapped to GCP services."
            />
            <FeatureCard
              icon={<Workflow />}
              title="Cloud design patterns"
              desc="Named explicitly — sharding, saga, circuit breaker, bulkhead — applied where they belong."
            />
            <FeatureCard
              icon={<FileText />}
              title="Investor-ready PDF"
              desc="One click. Beautifully structured. Ready for your board deck or pitch."
            />
          </Stagger>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="border-t py-24 md:py-32">
        <div className="container">
          <SectionTitle eyebrow="How it works" title="Three steps from idea to architecture." />
          <Stagger step={120} initialDelay={120} className="mt-16 grid gap-6 md:grid-cols-3">
            {[
              {
                step: "01",
                title: "Describe",
                body:
                  "Write a paragraph or a page. The architect fills gaps with reasoned assumptions and surfaces them.",
              },
              {
                step: "02",
                title: "Generate",
                body:
                  "Gemini 2.5 Pro reasons through requirements, components, diagrams, scale, cost, risks, and security — live.",
              },
              {
                step: "03",
                title: "Decide",
                body:
                  "Tour the result by tab, drag the scale slider, download the PDF, share with your team.",
              },
            ].map((s) => (
              <div
                key={s.step}
                className="card-lift group relative rounded-2xl border bg-card p-6"
              >
                <div className="flex items-baseline justify-between">
                  <span className="font-mono text-xs tracking-wider text-muted-foreground">
                    STEP {s.step}
                  </span>
                  <span className="size-1.5 rounded-full bg-foreground/20 transition-all group-hover:bg-foreground" />
                </div>
                <div className="mt-4 text-2xl font-semibold tracking-tight">{s.title}</div>
                <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">{s.body}</p>
              </div>
            ))}
          </Stagger>
        </div>
      </section>

      {/* PRICING TEASER */}
      <section id="pricing" className="border-t py-24 md:py-32">
        <div className="container">
          <SectionTitle
            eyebrow="Pricing"
            title="Pay per run. No subscriptions."
            desc="One free run on first sign-in. Buy credits when you're ready for more."
          />
          <Reveal className="mt-16">
            <CreditPacksGrid signedIn={signedIn} />
          </Reveal>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="relative overflow-hidden border-t py-28 md:py-36">
        <div className="absolute inset-0 -z-10 grid-bg radial-fade opacity-40" />
        <div className="container max-w-3xl text-center">
          <Reveal>
            <Layers className="mx-auto size-7 text-foreground/60" />
          </Reveal>
          <Reveal delay={120}>
            <h2 className="display mt-5 text-balance text-[clamp(2.25rem,5.5vw,3.75rem)]">
              Stop guessing your architecture.
            </h2>
          </Reveal>
          <Reveal delay={220}>
            <p className="mx-auto mt-5 max-w-xl text-balance text-lg text-muted-foreground">
              Get a principal-grade design in the time it takes to make coffee.
            </p>
          </Reveal>
          <Reveal delay={320} className="mt-10">
            <MagneticWrapper strength={0.16}>
              <Button asChild size="xl" className="gap-2">
                <Link href={signedIn ? "/new" : "/login"}>
                  {signedIn ? "Start a new architecture" : "Start free"}
                  <ArrowRight className="size-4 transition-transform group-hover/btn:translate-x-0.5" />
                </Link>
              </Button>
            </MagneticWrapper>
          </Reveal>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function SectionTitle({
  eyebrow,
  title,
  desc,
}: {
  eyebrow: string;
  title: string;
  desc?: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <Reveal>
        <div className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          {eyebrow}
        </div>
      </Reveal>
      <Reveal delay={80}>
        <h2 className="mt-3 text-balance text-[clamp(1.75rem,4vw,2.75rem)] font-semibold leading-tight tracking-tight">
          {title}
        </h2>
      </Reveal>
      {desc && (
        <Reveal delay={160}>
          <p className="mt-4 text-balance text-[15px] leading-relaxed text-muted-foreground">
            {desc}
          </p>
        </Reveal>
      )}
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="card-lift group relative h-full overflow-hidden rounded-2xl border bg-card p-6">
      <div className="flex size-10 items-center justify-center rounded-lg border bg-background text-foreground/80 transition-colors duration-300 group-hover:text-foreground">
        {icon}
      </div>
      <div className="mt-5 font-semibold tracking-tight">{title}</div>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{desc}</p>
      <Sparkles
        aria-hidden
        className="absolute -right-4 -top-4 size-20 text-foreground/[0.025] transition-all duration-500 ease-out-quart group-hover:rotate-12 group-hover:text-foreground/[0.05]"
      />
    </div>
  );
}
