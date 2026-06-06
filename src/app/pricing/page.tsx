import { getSessionUser } from "@/lib/firebase/auth";
import { CreditPacksGrid } from "@/components/billing/CreditPacksGrid";

export const metadata = { title: "Credits" };

const INFO = [
  { n: "01", title: "Refund on failure", body: "If the agent fails to produce a valid architecture, your credit is automatically refunded." },
  { n: "02", title: "Secure payments",   body: "Powered by Razorpay. Cards, UPI, netbanking, wallets — all in INR." },
  { n: "03", title: "Human support",     body: "Email hello@tessar.app for questions about runs or invoices. We reply within a business day." },
];

export default async function PricingPage() {
  const user = await getSessionUser();

  return (
    <div className="min-h-screen bg-[hsl(var(--paper))]">
      <div className="mx-auto w-full max-w-[1400px] px-6 py-10 md:px-12 md:py-14 lg:px-16">
      {/* Masthead */}
      <div className="rule-dots flex items-baseline justify-between pb-4">
        <span className="tag tag-accent">§ Credits</span>
        <span className="eyebrow hidden md:inline">All prices in INR · GST inclusive</span>
      </div>

      <section className="m3-page-enter mt-12 grid gap-10 lg:grid-cols-[1.4fr_1fr]">
        <h1 className="display-tight text-[clamp(3rem,9vw,8rem)] leading-[0.88] tracking-[-0.045em]">
          Pay per run.<br />
          <span className="serif font-normal italic accent">No subscriptions.</span>
        </h1>
        <div className="flex flex-col justify-end gap-6 pb-3">
          <p className="text-[17px] leading-[1.55] text-[hsl(var(--ink-2))] max-w-[40ch]">
            Buy credits. Use them when you have an idea worth designing.
            Credits never expire. One credit = one architecture report. New accounts start with 3 free designs.
          </p>
        </div>
      </section>

      {/* Packs */}
      <div className="mt-20">
        <div className="flex items-baseline justify-between border-b border-[hsl(var(--line))] pb-5">
          <p className="section-num">§ Choose a pack</p>
          <p className="eyebrow hidden md:inline">Razorpay · INR</p>
        </div>
        <div className="mt-10">
          <CreditPacksGrid signedIn={!!user} />
        </div>
      </div>

      {/* Info trio */}
      <section className="mt-24">
        <div className="flex items-baseline justify-between border-b border-[hsl(var(--line))] pb-5">
          <p className="section-num">§ The fine print, plainly</p>
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

      {/* Bulk CTA */}
      <section className="m3-page-enter mt-20">
        <div className="card-ink relative overflow-hidden p-10 md:p-16">
          <div aria-hidden className="pointer-events-none absolute -right-32 -top-32 size-[420px] rounded-full bg-[hsl(var(--accent))]/30 blur-[120px]" />
          <p className="font-mono text-[12px] uppercase tracking-[0.18em] text-[hsl(var(--paper))]/55">§ For teams</p>
          <h3 className="display mt-5 text-[clamp(2rem,5vw,4rem)] leading-[0.95] tracking-[-0.04em] text-[hsl(var(--paper))]">
            Bulk credits<br />
            <span className="serif font-normal italic">for agencies.</span>
          </h3>
          <p className="mt-5 max-w-md text-[16px] leading-relaxed text-[hsl(var(--paper))]/75">
            Workshop a portfolio of designs, give every founder on your team a
            seat, or run cost comparisons across architectures.
          </p>
          <a
            href="mailto:hello@tessar.app?subject=Bulk credits"
            className="btn-pill-accent btn-pill-lg mt-10 inline-flex"
          >
            <span className="ms text-[20px]" aria-hidden>mail</span>
            Get a quote
          </a>
        </div>
      </section>
      </div>
    </div>
  );
}
