import Link from "next/link";
import { Logo } from "@/components/shared/Logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Footer } from "@/components/shared/Footer";
import { CreditPacksGrid } from "@/components/billing/CreditPacksGrid";
import { getSessionUser } from "@/lib/firebase/auth";
import {
  Sparkles, GitBranch, Layers, Shield, Network, ArrowRight, BadgeCheck, Zap, Coins,
  Eye, Workflow, FileText,
} from "lucide-react";

export default async function LandingPage() {
  const user = await getSessionUser();
  const signedIn = !!user;

  return (
    <div className="flex min-h-screen flex-col">
      {/* TOP NAV */}
      <header className="sticky top-0 z-40 w-full border-b border-transparent bg-background/70 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/"><Logo /></Link>
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <Link href="/sample" className="hover:text-foreground">Sample</Link>
            <Link href="#how" className="hover:text-foreground">How it works</Link>
            <Link href="/pricing" className="hover:text-foreground">Pricing</Link>
          </nav>
          <div className="flex items-center gap-2">
            {signedIn ? (
              <Button asChild><Link href="/dashboard">Open app →</Link></Button>
            ) : (
              <>
                <Button asChild variant="ghost"><Link href="/login">Sign in</Link></Button>
                <Button asChild variant="brand"><Link href="/login">Get started</Link></Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden border-b">
        <div className="absolute inset-0 -z-10 grid-bg radial-fade opacity-60" />
        <div className="container py-24 md:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="brand" className="mb-6 inline-flex gap-1.5 px-3 py-1">
              <Sparkles className="size-3" />
              Powered by Gemini 2.5 Pro on Vertex AI
            </Badge>
            <h1 className="text-5xl font-semibold tracking-tight text-balance md:text-6xl lg:text-7xl">
              Your AI principal architect.{" "}
              <span className="text-brand">In minutes.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground text-balance md:text-xl">
              Describe the system you want to build. Tessar returns a production-grade architecture
              with diagrams, scale tiers, cost estimates, risks, and the cloud patterns that solve them.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              {signedIn ? (
                <Button asChild size="xl" variant="brand" className="gap-2">
                  <Link href="/new">Design my system <ArrowRight className="size-4" /></Link>
                </Button>
              ) : (
                <Button asChild size="xl" variant="brand" className="gap-2">
                  <Link href="/login">Start with 1 free run <ArrowRight className="size-4" /></Link>
                </Button>
              )}
              <Button asChild size="xl" variant="outline" className="gap-2">
                <Link href="/sample"><Eye className="size-4" />See a sample report</Link>
              </Button>
            </div>
            <div className="mt-6 flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><BadgeCheck className="size-3.5" /> Built on Google Cloud</span>
              <span>·</span>
              <span className="flex items-center gap-1"><Coins className="size-3.5" /> INR pricing, India-first</span>
              <span>·</span>
              <span className="flex items-center gap-1"><Zap className="size-3.5" /> Refund on failure</span>
            </div>
          </div>
        </div>
      </section>

      {/* OUTPUTS */}
      <section className="border-b py-20">
        <div className="container">
          <SectionTitle eyebrow="What you get" title="Every angle of the system. Beautifully presented." />
          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={<GitBranch />}
              title="Six diagrams, always"
              desc="C4 Context, C4 Container, Deployment, Sequence, Data Flow, ER. All in interactive Mermaid."
            />
            <FeatureCard
              icon={<Network />}
              title="Four scale tiers"
              desc="Startup → Growth → Scale → Hyperscale. Drag the slider, watch the architecture (and cost) adapt."
            />
            <FeatureCard
              icon={<Coins />}
              title="Cost in INR + USD"
              desc="Line-item monthly estimates for every GCP service at every scale tier. No surprises."
            />
            <FeatureCard
              icon={<Shield />}
              title="Security & compliance"
              desc="Identity, network, data, secrets, supply chain, incident response — mapped to GCP services."
            />
            <FeatureCard
              icon={<Workflow />}
              title="Cloud design patterns"
              desc="Sharding, Saga, Circuit Breaker, Bulkhead — named explicitly, applied where they belong."
            />
            <FeatureCard
              icon={<FileText />}
              title="Investor-ready PDF"
              desc="One-click export. Beautiful, structured, and ready for your board deck or pitch."
            />
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="border-b py-20">
        <div className="container">
          <SectionTitle eyebrow="How it works" title="Three steps from idea to architecture." />
          <div className="mt-14 grid gap-8 md:grid-cols-3">
            {[
              {
                step: "01",
                title: "Describe",
                body: "Write a paragraph or write a page. The architect fills the gaps with reasoned assumptions and surfaces them.",
              },
              {
                step: "02",
                title: "Generate",
                body: "Gemini 2.5 Pro reasons through requirements, components, diagrams, scale, cost, risks, and security — live.",
              },
              {
                step: "03",
                title: "Decide",
                body: "Tour the result by tab, drag the scale slider, download the PDF, share with your team.",
              },
            ].map((s) => (
              <div key={s.step} className="rounded-xl border p-6">
                <div className="font-mono text-sm text-brand">{s.step}</div>
                <div className="mt-2 text-xl font-semibold">{s.title}</div>
                <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING TEASER */}
      <section id="pricing" className="border-b py-20">
        <div className="container">
          <SectionTitle
            eyebrow="Pricing"
            title="Pay per run. No subscriptions, no surprises."
            desc="One free run on first sign-in. Buy credits when you're ready for more."
          />
          <div className="mt-14">
            <CreditPacksGrid signedIn={signedIn} />
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="border-b py-20">
        <div className="container max-w-3xl text-center">
          <Layers className="mx-auto size-8 text-brand" />
          <h2 className="mt-4 text-4xl font-semibold tracking-tight text-balance">
            Stop guessing your architecture.
          </h2>
          <p className="mt-3 text-lg text-muted-foreground text-balance">
            Get a principal-grade design in the time it takes to make coffee.
          </p>
          <div className="mt-8">
            <Button asChild size="xl" variant="brand" className="gap-2">
              <Link href={signedIn ? "/new" : "/login"}>
                {signedIn ? "Start a new architecture" : "Start free"} <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function SectionTitle({
  eyebrow, title, desc,
}: { eyebrow: string; title: string; desc?: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <div className="text-xs font-medium uppercase tracking-wider text-brand">{eyebrow}</div>
      <h2 className="mt-2 text-3xl font-semibold tracking-tight text-balance md:text-4xl">{title}</h2>
      {desc && <p className="mt-3 text-muted-foreground text-balance">{desc}</p>}
    </div>
  );
}

function FeatureCard({
  icon, title, desc,
}: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="group rounded-xl border bg-card p-6 transition-all hover:border-brand/40 hover:shadow-md">
      <div className="grid size-10 place-items-center rounded-lg bg-brand/10 text-brand">{icon}</div>
      <div className="mt-4 font-semibold">{title}</div>
      <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}
