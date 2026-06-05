import Link from "next/link";
import { getSessionUser } from "@/lib/firebase/auth";
import { LandingTopBar } from "@/components/landing/LandingTopBar";
import { HeroStack } from "@/components/landing/HeroStack";
import { Footer } from "@/components/shared/Footer";
import { CreditPacksGrid } from "@/components/billing/CreditPacksGrid";
import { Fab } from "@/components/m3/Fab";
import { Chip } from "@/components/m3/Chip";
import { Rise } from "@/components/m3/Rise";

export default async function LandingPage() {
  const user = await getSessionUser();
  const signedIn = !!user;

  return (
    <div className="relative min-h-screen overflow-hidden bg-m3-surface text-m3-on-surface">
      <LandingTopBar signedIn={signedIn} />

      {/* HERO */}
      <section className="relative pb-16 pt-32 md:pt-40 lg:pt-44">
        {/* Ambient background shapes */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute left-[12%] top-32 size-[420px] rounded-full bg-m3-primary-container/55 blur-[110px] m3-shape-a" />
          <div className="absolute right-[6%] top-[28%] size-[360px] rounded-full bg-m3-tertiary-container/60 blur-[100px] m3-shape-b" />
          <div className="absolute -bottom-32 left-1/2 size-[520px] -translate-x-1/2 rounded-full bg-m3-secondary-container/45 blur-[120px]" />
        </div>

        <div className="mx-auto grid max-w-[1280px] gap-12 px-6 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:px-8">
          {/* Copy column */}
          <div className="m3-page-enter relative z-10 flex flex-col justify-center">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-m3-outline-variant bg-m3-surface-container-lowest/80 px-3.5 py-1.5 text-[12px] text-m3-on-surface-variant backdrop-blur">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500/40" />
                <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500" />
              </span>
              Live · powered by Gemini 2.5 Pro on Vertex AI
            </div>

            <h1 className="display mt-7 text-balance text-[clamp(2.75rem,7vw,5.5rem)] leading-[1.02]">
              Design your{" "}
              <span
                className="hero-gradient inline-block"
                style={{ fontVariationSettings: '"wdth" 125, "opsz" 96', fontWeight: 700 }}
              >
                cloud
              </span>
              <br />
              system in <span className="display-italic text-m3-on-surface-variant">minutes.</span>
            </h1>

            <p className="mt-7 max-w-xl text-balance text-[17px] leading-relaxed text-m3-on-surface-variant md:text-[19px]">
              Describe what you want to build. Tessar designs the full system —
              diagrams, scale tiers, costs in INR, risks, and the cloud patterns
              that solve them.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Fab
                size="extended"
                icon={signedIn ? "rocket_launch" : "arrow_forward"}
                href={signedIn ? "/new" : "/login"}
                variant="primary"
                className="!h-14 !rounded-2xl !text-[15px]"
              >
                {signedIn ? "Design my system" : "Start with 1 free run"}
              </Fab>
              <Fab
                size="extended"
                icon="auto_stories"
                href="/sample"
                variant="surface"
                className="!h-14 !rounded-2xl !text-[15px] !shadow-none border border-m3-outline-variant"
              >
                See a sample
              </Fab>
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] text-m3-on-surface-variant">
              <span className="inline-flex items-center gap-1.5">
                <span className="ms text-[16px]" aria-hidden>verified</span>
                Built on Google Cloud
              </span>
              <span className="size-0.5 rounded-full bg-m3-outline" />
              <span className="inline-flex items-center gap-1.5">
                <span className="ms text-[16px]" aria-hidden>diamond</span>
                INR pricing, India-first
              </span>
              <span className="size-0.5 rounded-full bg-m3-outline" />
              <span className="inline-flex items-center gap-1.5">
                <span className="ms text-[16px]" aria-hidden>bolt</span>
                Refund on failure
              </span>
            </div>
          </div>

          {/* Visual column */}
          <div className="relative m3-page-enter" style={{ animationDelay: "180ms" }}>
            <HeroStack />
          </div>
        </div>

        {/* Suggestion chip row */}
        <div className="mx-auto mt-16 max-w-[1280px] px-6 lg:px-8">
          <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-m3-on-surface-variant">
            Try designing
          </div>
          <div className="mt-3 flex flex-wrap gap-2.5">
            {[
              { icon: "rocket_launch", label: "B2B SaaS on Google Cloud" },
              { icon: "smart_toy", label: "Gemini-powered AI feature" },
              { icon: "storefront", label: "E-commerce backend (India)" },
              { icon: "school", label: "EdTech with live classes" },
              { icon: "local_shipping", label: "Logistics with live GPS" },
              { icon: "health_and_safety", label: "ABDM-compliant health vault" },
            ].map((s) => (
              <Chip
                key={s.label}
                type="suggestion"
                icon={s.icon}
                href={signedIn ? `/new?seed=${encodeURIComponent(s.label)}` : "/login"}
              >
                {s.label}
              </Chip>
            ))}
          </div>
        </div>
      </section>

      {/* PATTERNS MARQUEE */}
      <section className="border-y border-m3-outline-variant/40 bg-m3-surface-container-low/50 py-10">
        <div className="mx-auto max-w-[1280px] px-6 lg:px-8">
          <div className="text-center text-[11px] font-medium uppercase tracking-[0.18em] text-m3-on-surface-variant">
            Every report references industry patterns
          </div>
        </div>
        <div className="m3-marquee-mask mt-6">
          <div className="m3-marquee-track">
            {[...Array(2)].flatMap((_, k) =>
              [
                "Saga", "Sharding", "Circuit Breaker", "Bulkhead", "CQRS",
                "Event Sourcing", "Outbox", "Sidecar", "Strangler Fig",
                "Cache-Aside", "Throttling", "Retry with Backoff",
                "Materialized View", "Choreography", "Gateway Aggregation",
                "Leader Election", "Competing Consumers", "Pub-Sub",
              ].map((p, i) => (
                <span
                  key={`${k}-${i}`}
                  className="inline-flex shrink-0 items-center gap-2 rounded-full border border-m3-outline-variant bg-m3-surface-container-lowest px-4 py-2 text-[13px] font-medium text-m3-on-surface"
                >
                  <span className="ms text-[16px] text-m3-primary" aria-hidden>category</span>
                  {p}
                </span>
              )),
            )}
          </div>
        </div>
      </section>

      {/* WHAT YOU GET — bento grid */}
      <section id="features" className="py-24 md:py-32">
        <div className="mx-auto max-w-[1280px] px-6 lg:px-8">
          <SectionEyebrow>What you get</SectionEyebrow>
          <Rise>
            <h2 className="display mt-3 max-w-3xl text-balance text-[clamp(2rem,4.5vw,3.25rem)] leading-tight">
              Every angle of the system.
              <br />
              <span className="text-m3-on-surface-variant">Beautifully presented.</span>
            </h2>
          </Rise>

          <Rise delay={120} className="mt-14 grid grid-cols-1 gap-3 md:grid-cols-6 md:grid-rows-[auto_auto]">
            {/* Hero card */}
            <BentoTile
              className="md:col-span-4 md:row-span-2"
              eyebrow="Six diagrams"
              title="Mermaid diagrams that explain the system, not just decorate it."
              body="C4 Context · C4 Container · Deployment · Sequence · Data Flow · ER. All interactive, all exportable."
              icon="account_tree"
              tone="primary"
              size="lg"
            />
            <BentoTile
              className="md:col-span-2"
              eyebrow="Four scale tiers"
              title="Startup → Hyperscale."
              body="Drag the slider, watch the architecture and the cost adapt."
              icon="ssid_chart"
              tone="tertiary"
            />
            <BentoTile
              className="md:col-span-2"
              eyebrow="Cost in INR"
              title="Line-item monthly estimates."
              body="Every GCP service, every tier. No surprises at the board."
              icon="currency_rupee"
              tone="secondary"
            />
            <BentoTile
              className="md:col-span-2"
              eyebrow="Security"
              title="IAM → incident response."
              body="Identity, network, data, secrets, supply chain — mapped to GCP."
              icon="shield"
              tone="primary"
            />
            <BentoTile
              className="md:col-span-2"
              eyebrow="Patterns"
              title="Named, applied, justified."
              body="Sharding, saga, circuit breaker, bulkhead — used where they belong."
              icon="extension"
              tone="tertiary"
            />
            <BentoTile
              className="md:col-span-2"
              eyebrow="Export"
              title="One-click PDF."
              body="Beautifully structured. Investor- and engineering-ready."
              icon="picture_as_pdf"
              tone="secondary"
            />
          </Rise>
        </div>
      </section>

      {/* HOW IT WORKS — three-step scrollytelling */}
      <section id="how" className="border-t border-m3-outline-variant/40 py-24 md:py-32">
        <div className="mx-auto max-w-[1280px] px-6 lg:px-8">
          <SectionEyebrow>How it works</SectionEyebrow>
          <Rise>
            <h2 className="display mt-3 max-w-3xl text-balance text-[clamp(2rem,4.5vw,3.25rem)] leading-tight">
              Three steps from a sentence
              <br />
              <span className="text-m3-on-surface-variant">to a defensible system.</span>
            </h2>
          </Rise>

          <div className="mt-16 grid gap-5 md:grid-cols-3">
            {[
              {
                num: "01",
                icon: "edit_note",
                title: "Describe",
                body:
                  "Write a paragraph or a page. The architect fills gaps with reasoned assumptions and surfaces them.",
                tone: "primary" as const,
              },
              {
                num: "02",
                icon: "auto_awesome",
                title: "Generate",
                body:
                  "Gemini 2.5 Pro reasons through requirements, components, diagrams, scale, cost, risks, and security — live.",
                tone: "tertiary" as const,
              },
              {
                num: "03",
                icon: "task_alt",
                title: "Decide",
                body:
                  "Tour the result, drag the scale slider, download the PDF, share with your team.",
                tone: "secondary" as const,
              },
            ].map((s, i) => (
              <Rise key={s.num} delay={i * 120}>
                <article className="relative h-full overflow-hidden rounded-[32px] bg-m3-surface-container-low p-7 transition-shadow duration-m3-default-effects ease-m3-default-effects hover:shadow-m3-2">
                  <div className="flex items-center justify-between">
                    <span className="display text-[44px] leading-none text-m3-on-surface-variant/50">
                      {s.num}
                    </span>
                    <span
                      className={
                        "grid size-12 place-items-center rounded-2xl " +
                        (s.tone === "primary"
                          ? "bg-m3-primary-container text-m3-on-primary-container"
                          : s.tone === "tertiary"
                            ? "bg-m3-tertiary-container text-m3-on-tertiary-container"
                            : "bg-m3-secondary-container text-m3-on-secondary-container")
                      }
                    >
                      <span className="ms text-[26px]" aria-hidden>{s.icon}</span>
                    </span>
                  </div>
                  <h3 className="display mt-7 text-[28px] leading-tight">{s.title}</h3>
                  <p className="mt-3 text-[15px] leading-relaxed text-m3-on-surface-variant">
                    {s.body}
                  </p>
                </article>
              </Rise>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="border-t border-m3-outline-variant/40 bg-m3-surface-container-low/40 py-24 md:py-32">
        <div className="mx-auto max-w-[1280px] px-6 lg:px-8">
          <SectionEyebrow>Pricing</SectionEyebrow>
          <Rise>
            <h2 className="display mt-3 max-w-3xl text-balance text-[clamp(2rem,4.5vw,3.25rem)] leading-tight">
              Pay per run.
              <br />
              <span className="text-m3-on-surface-variant">No subscriptions.</span>
            </h2>
          </Rise>
          <Rise delay={120} className="mt-14">
            <CreditPacksGrid signedIn={signedIn} />
          </Rise>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="relative overflow-hidden border-t border-m3-outline-variant/40 py-32 md:py-40">
        <div aria-hidden className="absolute inset-0 -z-10 m3-mesh opacity-80" />
        <div aria-hidden className="absolute left-[10%] top-[30%] size-32 rounded-[42%_58%_67%_33%/41%_44%_56%_59%] bg-m3-primary opacity-40 m3-shape-a" />
        <div aria-hidden className="absolute right-[12%] bottom-[20%] size-40 rounded-full bg-m3-tertiary opacity-30 m3-shape-b" />
        <div className="mx-auto max-w-3xl px-6 text-center">
          <Rise>
            <h2 className="display text-balance text-[clamp(2.25rem,5.5vw,4rem)] leading-[1.05]">
              Stop guessing.
              <br />
              <span className="hero-gradient">Start architecting.</span>
            </h2>
          </Rise>
          <Rise delay={120}>
            <p className="mx-auto mt-5 max-w-xl text-balance text-[17px] leading-relaxed text-m3-on-surface-variant">
              A principal-grade design in the time it takes to make coffee.
            </p>
          </Rise>
          <Rise delay={220} className="mt-10 flex justify-center">
            <Fab
              size="extended"
              icon={signedIn ? "rocket_launch" : "arrow_forward"}
              href={signedIn ? "/new" : "/login"}
              variant="primary"
              className="!h-16 !rounded-3xl !px-8 !text-[16px]"
            >
              {signedIn ? "Start a new architecture" : "Start free"}
            </Fab>
          </Rise>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <Rise>
      <div className="inline-flex items-center gap-2 rounded-full border border-m3-outline-variant bg-m3-surface-container-lowest px-3.5 py-1.5 text-[11px] font-medium uppercase tracking-[0.16em] text-m3-on-surface-variant">
        <span className="ms text-[14px] text-m3-primary" aria-hidden>auto_awesome</span>
        {children}
      </div>
    </Rise>
  );
}

function BentoTile({
  className,
  eyebrow,
  title,
  body,
  icon,
  tone,
  size = "md",
}: {
  className?: string;
  eyebrow: string;
  title: string;
  body: string;
  icon: string;
  tone: "primary" | "tertiary" | "secondary";
  size?: "md" | "lg";
}) {
  const toneSurface =
    tone === "primary"
      ? "bg-m3-primary-container text-m3-on-primary-container"
      : tone === "tertiary"
        ? "bg-m3-tertiary-container text-m3-on-tertiary-container"
        : "bg-m3-secondary-container text-m3-on-secondary-container";

  return (
    <article
      className={
        "group relative overflow-hidden rounded-[32px] bg-m3-surface-container-low p-7 " +
        "transition-all duration-m3-default-effects ease-m3-default-effects " +
        "hover:-translate-y-1 hover:shadow-m3-3 " +
        (className ?? "")
      }
    >
      {/* Floating accent shape */}
      <div
        aria-hidden
        className={
          "absolute -right-10 -top-10 size-40 rounded-[42%_58%_67%_33%/41%_44%_56%_59%] opacity-50 transition-transform duration-m3-default-spatial ease-m3-default-spatial group-hover:scale-110 group-hover:rotate-12 " +
          toneSurface
        }
      />
      <div className={"relative grid size-12 place-items-center rounded-2xl " + toneSurface}>
        <span className="ms text-[26px]" aria-hidden>{icon}</span>
      </div>
      <div className="relative mt-6 text-[10px] font-medium uppercase tracking-[0.18em] text-m3-on-surface-variant">
        {eyebrow}
      </div>
      <h3
        className={
          "display relative mt-2 leading-tight " +
          (size === "lg" ? "text-[clamp(1.75rem,2.8vw,2.25rem)]" : "text-[clamp(1.25rem,2vw,1.5rem)]")
        }
      >
        {title}
      </h3>
      <p className={"relative mt-3 text-m3-on-surface-variant " + (size === "lg" ? "text-[16px] leading-relaxed" : "text-[14px] leading-relaxed")}>
        {body}
      </p>
    </article>
  );
}
