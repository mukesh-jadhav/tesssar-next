import { Footer } from "@/components/shared/Footer";

export const metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[hsl(var(--paper))]">
      <div className="mx-auto w-full max-w-[920px] px-6 py-10 md:px-12 md:py-14 lg:px-16">
        <div className="rule-dots flex items-baseline justify-between pb-4">
          <span className="tag tag-accent">Legal</span>
          <span className="eyebrow hidden md:inline">Updated June 2026</span>
        </div>

        <section className="m3-page-enter mt-12">
          <h1 className="display-tight text-[clamp(2.6rem,7vw,6rem)] leading-[0.9] tracking-[-0.045em]">
            Privacy,<br />
            <span className="serif font-normal italic accent">plainly.</span>
          </h1>
          <p className="mt-8 max-w-[60ch] text-[17px] leading-[1.55] text-[hsl(var(--ink-2))]">
            We collect what we need to deliver the product — nothing more —
            and we don&apos;t sell it. Your briefs and the architectures we
            generate stay yours.
          </p>
        </section>

        <div className="mt-16 space-y-12">
          <Clause num="01" heading="What we store">
            Your Google account profile (name, email, photo), the briefs you
            submit, the architectures we generate from them, and your purchase
            history. Logs are retained for 30 days for debugging and abuse
            prevention.
          </Clause>
          <Clause num="02" heading="Data residency">
            User and architecture data is stored in Google Cloud Firestore in
            the <code className="font-mono text-[13px] bg-[hsl(var(--paper-2))] px-1.5 py-0.5 rounded">asia-south1</code> region.
            Backups stay within India.
          </Clause>
          <Clause num="03" heading="Third parties">
            We use Google Cloud&apos;s managed AI services for generation,
            Razorpay for payments, and Resend for receipts. None of these
            parties receive your brief contents beyond what&apos;s strictly
            required to perform their task. We do not sell your data.
          </Clause>
          <Clause num="04" heading="Your rights under DPDP 2023">
            You may request export or deletion of your data at any time.
            Send a one-liner to
            <a href="mailto:hello@tessar.dev" className="ulgrow accent mx-1">hello@tessar.dev</a>
            and we&apos;ll action it within 7 working days.
          </Clause>
          <Clause num="05" heading="Cookies & analytics">
            We use a single first-party session cookie for authentication. No
            third-party analytics, no ad pixels, no fingerprinting.
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
