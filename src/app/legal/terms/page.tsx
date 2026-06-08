import { Footer } from "@/components/shared/Footer";

export const metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[hsl(var(--paper))]">
      <div className="mx-auto w-full max-w-[920px] px-6 py-10 md:px-12 md:py-14 lg:px-16">
        <div className="rule-dots flex items-baseline justify-between pb-4">
          <span className="tag tag-accent">Legal</span>
          <span className="eyebrow hidden md:inline">Updated June 2026</span>
        </div>

        <section className="m3-page-enter mt-12">
          <h1 className="display-tight text-[clamp(2.6rem,7vw,6rem)] leading-[0.9] tracking-[-0.045em]">
            Terms of<br />
            <span className="serif font-normal italic accent">service.</span>
          </h1>
          <p className="mt-8 max-w-[60ch] text-[17px] leading-[1.55] text-[hsl(var(--ink-2))]">
            By using Tessar you agree to these terms. The short version:
            we generate architecture suggestions for informational purposes;
            you remain responsible for the engineering decisions you ship.
          </p>
        </section>

        <div className="mt-16 space-y-12">
          <Clause num="01" heading="Credits">
            Credits are non-refundable except when the agent fails to produce a
            valid architecture — in which case the credits for that run are
            automatically returned to your wallet. Credits do not expire.
          </Clause>
          <Clause num="02" heading="Acceptable use">
            Don&apos;t use the service to generate content that violates
            Indian law or another party&apos;s rights. Don&apos;t attempt to
            extract model weights, training data, or system prompts.
          </Clause>
          <Clause num="03" heading="Intellectual property">
            You own the briefs you submit and the architectures we generate
            for you. Tessar owns the platform, the agent, and the editorial
            templates. You grant us a limited licence to process your brief
            in order to deliver the report you requested.
          </Clause>
          <Clause num="04" heading="Limitation of liability">
            Tessar is provided &ldquo;as is&rdquo;. Our maximum liability is
            limited to the amount you paid us in the trailing 90 days.
          </Clause>
          <Clause num="05" heading="Contact">
            Questions, disputes, or just feedback —
            <a href="mailto:hello@tessar.dev" className="ulgrow accent ml-1">hello@tessar.dev</a>.
          </Clause>
        </div>
      </div>
      <Footer />
    </div>
  );
}

function Clause({ num, heading, children }: { num: string; heading: string; children: React.ReactNode }) {
  return (
    <article className="grid grid-cols-[auto_1fr] items-baseline gap-6 border-t border-[hsl(var(--line))] pt-8 md:gap-10">
      <span className="display text-[32px] tracking-[-0.04em] text-[hsl(var(--ink-3))] tabular-nums">{num}</span>
      <div>
        <h2 className="display text-[clamp(1.4rem,2.4vw,1.9rem)] tracking-[-0.02em]">{heading}</h2>
        <p className="mt-3 max-w-[60ch] text-[15.5px] leading-[1.6] text-[hsl(var(--ink-2))]">{children}</p>
      </div>
    </article>
  );
}
