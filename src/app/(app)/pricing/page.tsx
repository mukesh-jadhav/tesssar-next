import { getSessionUser } from "@/lib/firebase/auth";
import { CreditPacksGrid } from "@/components/billing/CreditPacksGrid";

export const metadata = { title: "Credits" };

const INFO = [
  {
    icon: "replay",
    title: "Refund on failure",
    body: "If the agent fails to produce a valid architecture, your credit is automatically refunded.",
    tone: "primary" as const,
  },
  {
    icon: "verified_user",
    title: "Secure payments",
    body: "Powered by Razorpay. Cards, UPI, netbanking, wallets — all in INR.",
    tone: "tertiary" as const,
  },
  {
    icon: "support_agent",
    title: "Human support",
    body: "Have a question about your run or invoice? Email hello@tessar.app — we reply within a business day.",
    tone: "secondary" as const,
  },
];

export default async function PricingPage() {
  const user = await getSessionUser();

  return (
    <div className="relative mx-auto w-full max-w-[1400px] px-6 py-12 md:px-10 md:py-16 lg:px-14">
      {/* Ambient backdrop */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[460px] overflow-hidden">
        <div className="absolute left-[12%] top-10 size-[380px] rounded-full bg-m3-primary-container/45 blur-[110px] m3-shape-a" />
        <div className="absolute right-[8%] top-20 size-[420px] rounded-full bg-m3-tertiary-container/45 blur-[120px] m3-shape-b" />
      </div>

      <section className="m3-page-enter text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-m3-outline-variant bg-m3-surface-container-lowest px-3.5 py-1.5 text-[11px] font-medium uppercase tracking-[0.16em] text-m3-on-surface-variant">
          <span className="ms text-[14px] text-m3-primary" aria-hidden>diamond</span>
          Credits
        </div>
        <h1 className="display mx-auto mt-5 max-w-3xl text-balance text-[clamp(2.5rem,5.5vw,4rem)] leading-[1.05]">
          Pay per run.
          <br />
          <span className="hero-gradient inline-block">No subscriptions.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-[16px] leading-relaxed text-m3-on-surface-variant">
          Buy credits, use them when you have an idea worth designing. Credits
          never expire.
        </p>
      </section>

      <div className="mt-16">
        <CreditPacksGrid signedIn={!!user} />
      </div>

      {/* Info trio */}
      <section className="m3-stagger mt-16 grid gap-4 md:grid-cols-3">
        {INFO.map((c) => {
          const surface =
            c.tone === "primary"
              ? "bg-m3-primary-container text-m3-on-primary-container"
              : c.tone === "tertiary"
                ? "bg-m3-tertiary-container text-m3-on-tertiary-container"
                : "bg-m3-secondary-container text-m3-on-secondary-container";
          return (
            <article
              key={c.title}
              className="group/i relative overflow-hidden rounded-[28px] bg-m3-surface-container-low p-6 transition-shadow duration-m3-default-effects ease-m3-default-effects hover:shadow-m3-2"
            >
              <div className={"grid size-12 place-items-center rounded-2xl " + surface}>
                <span className="ms text-[24px]" aria-hidden>{c.icon}</span>
              </div>
              <h3 className="display mt-5 text-[20px] leading-tight">{c.title}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-m3-on-surface-variant">
                {c.body}
              </p>
            </article>
          );
        })}
      </section>

      {/* FAQ-ish callout */}
      <section className="m3-page-enter mt-16 overflow-hidden rounded-[36px] bg-m3-surface-container-low p-10 md:p-14">
        <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-m3-on-surface-variant">
              Need more?
            </div>
            <h3 className="display mt-3 text-[clamp(1.5rem,3vw,2rem)] leading-tight">
              Bulk credits for teams &amp; agencies.
            </h3>
            <p className="mt-3 max-w-md text-[15px] text-m3-on-surface-variant">
              Workshop a portfolio of designs, give every founder on your team
              their own seat, or run cost comparisons across architectures.
            </p>
          </div>
          <a
            href="mailto:hello@tessar.app?subject=Bulk credits"
            className="state-layer press m3-squircle-press inline-flex h-14 items-center gap-2 rounded-2xl bg-m3-primary px-6 text-[15px] font-medium text-m3-on-primary shadow-m3-2 hover:shadow-m3-3"
          >
            <span className="ms text-[20px]" aria-hidden>mail</span>
            Get a quote
          </a>
        </div>
      </section>
    </div>
  );
}
