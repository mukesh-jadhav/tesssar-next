import Link from "next/link";
import { ThemeToggle } from "@/components/shared/ThemeToggle";

/**
 * Editorial site footer for the marketing surfaces (`/`, `/pricing`,
 * `/legal/*`). Four-column link grid (Product / Resources / Company /
 * Connect), an oversized wordmark up top, and a utility bottom row with
 * copyright, a live "All systems operational" status pill, and a craft line.
 *
 * Pure server component. The status dot's pulse and shimmering top rule run
 * on CSS keyframes (defined in globals.css) so there's no client JS cost.
 */
export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative border-t border-[hsl(var(--line))] bg-[hsl(var(--paper))]">
      <div className="mx-auto w-full max-w-[1480px] px-6 pb-12 pt-20 md:px-12 lg:px-16">
        {/* Wordmark + tagline */}
        <div className="grid items-end gap-8 md:grid-cols-[1fr_auto]">
          <Link
            href="/"
            aria-label="Tessar — home"
            className="display block leading-[0.82] tracking-[-0.05em] text-[clamp(4rem,16vw,15rem)]"
          >
            Tessar<span className="accent">.</span>
          </Link>
          <p className="max-w-[24ch] text-right text-[14px] leading-[1.5] text-[hsl(var(--ink-2))]">
            Senior cloud architect, on tap. Built for the founder who&apos;d
            rather ship than slide-deck.
          </p>
        </div>

        {/* Link grid */}
        <div className="mt-16 grid gap-y-12 gap-x-10 border-t border-[hsl(var(--line))] pt-12 sm:grid-cols-2 md:grid-cols-4">
          <FooterCol heading="Product">
            <FooterLink href="/sample">Sample report</FooterLink>
            <FooterLink href="/pricing">Pricing</FooterLink>
            <FooterLink href="/new">Design a system</FooterLink>
            <FooterLink href="/dashboard">Dashboard</FooterLink>
          </FooterCol>

          <FooterCol heading="Resources">
            <FooterLink href="/pricing#faq">FAQ</FooterLink>
            <FooterLink href="/legal/privacy">Privacy</FooterLink>
            <FooterLink href="/legal/terms">Terms</FooterLink>
            <span className="inline-flex items-center gap-1.5 text-[14px] text-[hsl(var(--ink-2))]">
              Press
              <kbd className="font-mono text-[10px] uppercase tracking-wider text-[hsl(var(--ink-3))] border border-[hsl(var(--line-2))] bg-[hsl(var(--paper-2))] rounded px-1.5 py-[1px]">?</kbd>
              <span>anywhere</span>
            </span>
          </FooterCol>

          <FooterCol heading="Company">
            <p className="text-[14px] leading-[1.55] text-[hsl(var(--ink-2))]">
              We treat cloud architecture like editorial work. Decisions cite
              sources. Components are named products. Costs are numbers, not
              vibes.
            </p>
          </FooterCol>

          <FooterCol heading="Connect">
            <FooterLink href="mailto:hello@tessar.dev">hello@tessar.dev</FooterLink>
            <FooterLink href="mailto:hello@tessar.dev?subject=Bulk%20credits">Bulk credits</FooterLink>
            <FooterLink href="mailto:hello@tessar.dev?subject=Press">Press &amp; partnerships</FooterLink>
          </FooterCol>
        </div>

        {/* Utility row */}
        <div className="mt-14 flex flex-col items-start gap-5 border-t border-[hsl(var(--line))] pt-6 md:flex-row md:items-center md:justify-between">
          <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-[hsl(var(--ink-3))]">
            © {year} Tessar
          </div>

          <StatusPill />

          <div className="flex flex-col items-start gap-4 md:flex-row md:items-center">
            <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-[hsl(var(--ink-3))]">
              Designed in India <span className="opacity-60">·</span> Hosted on Google Cloud <span className="opacity-60">·</span>{" "}
              <span className="text-[hsl(var(--ink-2))]">asia-south1</span>
            </div>
            <ThemeToggle />
          </div>
        </div>

        {/* AI-output disclaimer — appears once at the bottom of every page. */}
        <p className="mt-6 max-w-[80ch] text-[11px] leading-[1.55] text-[hsl(var(--ink-3))]">
          Architecture reports produced by Tessar are AI-generated drafts intended for engineering
          discussion. Costs, security controls, and compliance mappings are design-level estimates and
          should be reviewed by a qualified engineer before implementation. See the{" "}
          <a href="/legal/terms" className="underline decoration-[hsl(var(--line-2))] underline-offset-2 hover:text-[hsl(var(--ink-2))]">
            terms
          </a>{" "}
          for the full notice.
        </p>
      </div>
    </footer>
  );
}

function FooterCol({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-[hsl(var(--ink-3))]">
        {heading}
      </p>
      {children}
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  const external = href.startsWith("mailto:") || href.startsWith("http");
  if (external) {
    return (
      <a href={href} className="ulgrow w-fit text-[14px] text-[hsl(var(--ink))]">
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className="ulgrow w-fit text-[14px] text-[hsl(var(--ink))]">
      {children}
    </Link>
  );
}

/**
 * Live status pill. Static green for now; the dot has a soft outward ping so
 * the eye registers "alive" without it feeling like an alert. Kill-switched
 * by the global `prefers-reduced-motion` block in `globals.css`.
 */
function StatusPill() {
  return (
    <a
      href="https://status.tessar.dev"
      target="_blank"
      rel="noopener noreferrer"
      className="group inline-flex items-center gap-2 rounded-full border border-[hsl(var(--line))] bg-[hsl(var(--paper-2))] px-3 py-1.5 transition-colors hover:border-[hsl(var(--line-2))]"
    >
      <span className="relative inline-flex size-2">
        <span className="absolute inset-0 rounded-full bg-[hsl(var(--good))] opacity-60 animate-status-ping" aria-hidden />
        <span className="relative inline-flex size-2 rounded-full bg-[hsl(var(--good))]" />
      </span>
      <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-[hsl(var(--ink-2))] group-hover:text-[hsl(var(--ink))] transition-colors">
        All systems operational
      </span>
    </a>
  );
}
