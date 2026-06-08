import Link from "next/link";
import type { ReactNode } from "react";
import { EditorialIllustration, type IllustrationKind } from "@/components/empty/EditorialIllustration";

/**
 * EmptyHero — editorial empty-state canvas for first-run and zero-data
 * surfaces. Pairs a hand-drawn illustration with a section tag, an oversized
 * display headline, a single supporting sentence, and primary / ghost CTAs.
 *
 * Designed to land in a centered `m3-page-enter` container. Server-rendered;
 * the illustration is a client component for breathing motion.
 */
export function EmptyHero({
  tag,
  illustration,
  title,
  italic,
  lead,
  primary,
  secondary,
  children,
}: {
  tag: string;
  illustration: IllustrationKind;
  title: ReactNode;
  italic: ReactNode;
  lead: ReactNode;
  primary?: { href: string; label: string };
  secondary?: { href: string; label: string };
  children?: ReactNode;
}) {
  return (
    <section className="m3-page-enter mt-12 card-paper px-8 py-16 md:px-16 md:py-24">
      <div className="mx-auto grid w-full max-w-[920px] gap-12 md:grid-cols-[auto_1fr] md:items-center md:gap-16">
        <EditorialIllustration kind={illustration} className="w-[260px] md:w-[320px] mx-auto" />
        <div className="text-center md:text-left">
          <p className="section-num">{tag}</p>
          <h2 className="display-tight mt-6 text-[clamp(2.4rem,5.5vw,4.25rem)] leading-[0.92] tracking-[-0.04em]">
            {title}<br />
            <span className="serif font-normal italic accent">{italic}</span>
          </h2>
          <p className="mt-6 max-w-[46ch] text-[16px] leading-[1.55] text-[hsl(var(--ink-2))] mx-auto md:mx-0">
            {lead}
          </p>
          {(primary || secondary) && (
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3 md:justify-start">
              {primary && (
                <Link href={primary.href} className="btn-pill-accent btn-pill-lg">
                  {primary.label}
                  <span className="ms text-[20px]" aria-hidden>arrow_forward</span>
                </Link>
              )}
              {secondary && (
                <Link href={secondary.href} className="btn-pill-ghost btn-pill-lg">
                  {secondary.label}
                </Link>
              )}
            </div>
          )}
          {children && <div className="mt-10">{children}</div>}
        </div>
      </div>
    </section>
  );
}
