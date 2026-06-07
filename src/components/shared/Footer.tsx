import Link from "next/link";

export function Footer() {
  return (
    <footer className="relative border-t border-[hsl(var(--line))] bg-[hsl(var(--paper))]">
      <div className="mx-auto w-full max-w-[1480px] px-6 pb-12 pt-20 md:px-12 lg:px-16">
        {/* Big wordmark */}
        <div className="display text-[clamp(4rem,16vw,16rem)] leading-[0.85] tracking-[-0.05em]">
          Tessar<span className="accent">.</span>
        </div>

        <div className="mt-14 grid gap-12 border-t border-[hsl(var(--line))] pt-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="max-w-sm">
            <p className="eyebrow">Manifesto</p>
            <p className="mt-3 text-[15px] leading-relaxed text-[hsl(var(--ink-2))]">
              We treat cloud architecture like editorial work. Decisions cite
              sources. Components are named products. Costs are numbers, not
              vibes.
            </p>
          </div>

          <FooterCol heading="Product">
            <FooterLink href="/sample">Sample report</FooterLink>
            <FooterLink href="/pricing">Pricing</FooterLink>
            <FooterLink href="/new">Design a system</FooterLink>
          </FooterCol>

          <FooterCol heading="Resources">
            <FooterLink href="/legal/terms">Terms</FooterLink>
            <FooterLink href="/legal/privacy">Privacy</FooterLink>
            <FooterLink href="mailto:hello@tessar.dev">Contact</FooterLink>
          </FooterCol>

          <FooterCol heading="From">
            <span className="text-[15px] text-[hsl(var(--ink-2))]">
              Built in Bengaluru,<br />running on Google Cloud.
            </span>
          </FooterCol>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-[hsl(var(--line))] pt-6 text-[12px] text-[hsl(var(--ink-3))]">
          <div>© {new Date().getFullYear()} Tessar. All rights reserved.</div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="eyebrow">{heading}</p>
      {children}
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="ulgrow text-[15px] text-[hsl(var(--ink))] w-fit">
      {children}
    </Link>
  );
}
