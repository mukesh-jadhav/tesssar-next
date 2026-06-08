import { getSessionUser } from "@/lib/firebase/auth";
import { CreditPacksGrid } from "@/components/billing/CreditPacksGrid";
import { ComparisonMatrix } from "@/components/billing/ComparisonMatrix";
import { FAQ, type FAQItem } from "@/components/billing/FAQ";
import { Magnetic } from "@/components/motion/Magnetic";

export const metadata = { title: "Credits" };

const INFO = [
  { n: "01", title: "Refund on failure", body: "If the agent fails to produce a valid architecture, the credits for that run are automatically returned to your balance." },
  { n: "02", title: "Secure payments",   body: "Powered by Razorpay. Cards, UPI, netbanking, wallets — all in INR." },
  { n: "03", title: "Human support",     body: "Email hello@tessar.dev for questions about runs or invoices. We reply within a business day." },
];

const FAQ_ITEMS: FAQItem[] = [
  {
    q: "What exactly do I get for one design?",
    a: (
      <>
        <p>
          One design is a complete architecture report — a system story,
          requirements brief, design decisions, every component on the
          critical path, a traffic envelope, three labelled diagrams,
          monthly cost ranges in INR, risks, guardrails, observability
          notes, and a phased roadmap.
        </p>
        <p>
          You also get a downloadable PDF and a permanent versioned record
          you can re-open, share, or compare against later iterations.
        </p>
      </>
    ),
  },
  {
    q: "What happens if the agent fails halfway?",
    a: (
      <p>
        The credits are automatically refunded to your wallet. We only
        charge for runs that complete with a valid report. You can retry
        immediately at no extra cost.
      </p>
    ),
  },
  {
    q: "Do credits expire?",
    a: (
      <p>
        No. Credits sit in your wallet forever — use them next week, next
        quarter, or next year. There are no subscriptions, no renewal
        emails, no quiet expirations.
      </p>
    ),
  },
  {
    q: "Is there a free trial?",
    a: (
      <p>
        Every new account starts with 40 credits — one full architecture
        on us. No card needed for the trial design; you only see the
        Razorpay screen when you want a second one.
      </p>
    ),
  },
  {
    q: "Can I get a GST-compliant invoice?",
    a: (
      <p>
        Yes. Every successful payment generates a GST-inclusive invoice
        in INR, available immediately in your dashboard under{" "}
        <span className="font-mono">Billing → Receipts</span>. Add your
        GSTIN once and it appears on every future invoice.
      </p>
    ),
  },
  {
    q: "What payment methods do you accept?",
    a: (
      <p>
        Razorpay handles checkout, so you can pay with credit and debit
        cards, UPI (GPay, PhonePe, Paytm), netbanking from every major
        Indian bank, and wallets. All transactions settle in INR.
      </p>
    ),
  },
  {
    q: "Can I share credits with my team?",
    a: (
      <p>
        Right now each account has its own wallet. If you need a shared
        pool, multiple seats, or a master billing account, write to{" "}
        <a href="mailto:hello@tessar.dev" className="underline underline-offset-4 decoration-[hsl(var(--accent))]">
          hello@tessar.dev
        </a>{" "}
        and we&apos;ll set up bulk credits for your team.
      </p>
    ),
  },
  {
    q: "Can I get a refund if I change my mind?",
    a: (
      <p>
        Unused credits are refundable for 14 days from purchase — just
        email us. Credits that have already been spent on completed
        reports are non-refundable, since the cost is in the compute and
        model time that produced the report.
      </p>
    ),
  },
];

export default async function PricingPage() {
  const user = await getSessionUser();

  return (
    <div className="min-h-screen bg-[hsl(var(--paper))]">
      <div className="mx-auto w-full max-w-[1400px] px-6 py-10 md:px-12 md:py-14 lg:px-16">
      {/* Masthead */}
      <div className="rule-dots flex items-baseline justify-between pb-4">
        <span className="tag tag-accent">Credits</span>
        <span className="eyebrow hidden md:inline">All prices in INR, GST inclusive</span>
      </div>

      <section className="m3-page-enter mt-12 grid gap-10 lg:grid-cols-[1.4fr_1fr]">
        <h1 className="display-tight text-[clamp(3rem,9vw,8rem)] leading-[0.88] tracking-[-0.045em]">
          ₹300 a design.<br />
          <span className="serif font-normal italic accent">No subscriptions.</span>
        </h1>
        <div className="flex flex-col justify-end gap-6 pb-3">
          <p className="text-[17px] leading-[1.55] text-[hsl(var(--ink-2))] max-w-[40ch]">
            One design — a complete architecture report — costs <strong>40 credits</strong>.
            Buy credits in packs. They never expire. Failed runs auto-refund.
            New accounts start with <strong>1 free design</strong>.
          </p>
        </div>
      </section>

      {/* Packs */}
      <div className="mt-20">
        <div className="flex items-baseline justify-between border-b border-[hsl(var(--line))] pb-5">
          <p className="section-num">Choose a pack</p>
          <p className="eyebrow hidden md:inline">Razorpay · INR</p>
        </div>
        <div className="mt-10">
          <CreditPacksGrid signedIn={!!user} />
        </div>
      </div>

      {/* Comparison matrix */}
      <section className="mt-24">
        <div className="flex items-baseline justify-between border-b border-[hsl(var(--line))] pb-5">
          <p className="section-num">Compare packs, side by side</p>
          <p className="eyebrow hidden md:inline">Same report. Different volumes.</p>
        </div>
        <div className="mt-8">
          <ComparisonMatrix />
        </div>
      </section>

      {/* Info trio */}
      <section className="mt-24">
        <div className="flex items-baseline justify-between border-b border-[hsl(var(--line))] pb-5">
          <p className="section-num">The fine print, plainly</p>
        </div>
        <div className="grid gap-px bg-[hsl(var(--line))] border border-[hsl(var(--line))] mt-2 md:grid-cols-3">
          {INFO.map((c) => (
            <article key={c.n} className="bg-[hsl(var(--paper))] p-8">
              <div className="flex items-baseline justify-between">
                <span className="display text-[44px] tracking-[-0.04em] text-[hsl(var(--ink-3))]">{c.n}</span>
              </div>
              <h3 className="display mt-6 text-[22px] leading-tight tracking-[-0.02em]">{c.title}</h3>
              <p className="mt-3 text-[14px] leading-relaxed text-[hsl(var(--ink-2))]">{c.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="mt-24">
        <div className="flex items-baseline justify-between border-b border-[hsl(var(--line))] pb-5">
          <p className="section-num">Questions, answered</p>
          <p className="eyebrow hidden md:inline">Tap to expand</p>
        </div>
        <div className="mt-2">
          <FAQ items={FAQ_ITEMS} />
        </div>
      </section>

      {/* Bulk CTA */}
      <section className="m3-page-enter mt-20">
        <div className="card-ink relative overflow-hidden p-10 md:p-16">
          <div aria-hidden className="pointer-events-none absolute -right-32 -top-32 size-[420px] rounded-full bg-[hsl(var(--accent))]/30 blur-[120px]" />
          <div aria-hidden className="pointer-events-none absolute -left-40 -bottom-40 size-[380px] rounded-full bg-[hsl(var(--accent))]/15 blur-[140px]" />
          <p className="font-mono text-[12px] uppercase tracking-[0.18em] text-[hsl(var(--paper))]/55">For teams</p>
          <h3 className="display mt-5 text-[clamp(2rem,5vw,4rem)] leading-[0.95] tracking-[-0.04em] text-[hsl(var(--paper))]">
            Bulk credits<br />
            <span className="serif font-normal italic">for agencies.</span>
          </h3>
          <p className="mt-5 max-w-md text-[16px] leading-relaxed text-[hsl(var(--paper))]/75">
            Workshop a portfolio of designs, give every founder on your team a
            seat, or run cost comparisons across architectures. We&apos;ll set
            up a shared wallet, custom invoicing, and a dedicated point of
            contact.
          </p>
          <Magnetic strength={0.22} maxDistance={10} className="mt-10">
            <a
              href="mailto:hello@tessar.dev?subject=Bulk credits"
              className="btn-pill-accent btn-pill-lg group inline-flex"
            >
              Get a quote
              <span className="ms text-[20px] transition-transform duration-300 group-hover:translate-x-1" aria-hidden>arrow_forward</span>
            </a>
          </Magnetic>
        </div>
      </section>
      </div>
    </div>
  );
}
