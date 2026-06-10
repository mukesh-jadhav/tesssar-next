import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/firebase/auth";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { safeNext } from "@/lib/security/redirect";
import { RotatingTestimonials } from "@/components/auth/RotatingTestimonials";
import { MiniDashboardPreview } from "@/components/auth/MiniDashboardPreview";
import { FadeIn } from "@/components/motion/FadeIn";
import { Reveal } from "@/components/motion/Reveal";
import { Parallax } from "@/components/motion/Parallax";

export const metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  // Validate the post-auth destination — unvalidated `next` is an
  // open-redirect (CWE-601) primitive that turns the sign-in page into
  // a phishing relay.
  const next = safeNext((await searchParams).next, "/studio");
  const user = await getSessionUser();
  if (user) redirect(next);

  return (
    <div className="grain relative min-h-[calc(100vh-3.5rem)] bg-[hsl(var(--paper))] text-[hsl(var(--ink))]">
      <div className="grid min-h-[calc(100vh-3.5rem)] md:grid-cols-[1.1fr_1fr]">
        {/* LEFT — sign in */}
        <div className="flex items-center justify-center px-6 py-16 md:px-16 md:py-20">
          <div className="w-full max-w-md">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-[hsl(var(--ink-3))] hover:text-[hsl(var(--ink))] transition-colors mb-10"
            >
              <span className="ms text-[14px]" aria-hidden>arrow_back</span>
              tessar.dev
            </Link>

            <h1 className="display-tight text-[clamp(2.6rem,6vw,5rem)] leading-[0.9] tracking-[-0.045em]">
              <Reveal>Sign in.</Reveal>
              <br />
              <Reveal delay={0.12}>
                <span className="serif font-normal italic accent">Start designing.</span>
              </Reveal>
            </h1>

            <FadeIn delay={0.3}>
              <p className="mt-6 text-[16px] leading-relaxed text-[hsl(var(--ink-2))] max-w-[40ch]">
                Your first architecture run is on the house. No credit card.
                Bring a system, leave with a report.
              </p>
            </FadeIn>

            <FadeIn delay={0.45} className="mt-10">
              <GoogleSignInButton next={next} />
            </FadeIn>

            <FadeIn delay={0.6}>
              <p className="mt-6 text-[13px] text-[hsl(var(--ink-3))]">
                By continuing you agree to our{" "}
                <Link href="/legal/terms" className="link-ink">Terms</Link> &{" "}
                <Link href="/legal/privacy" className="link-ink">Privacy</Link>.
              </p>
            </FadeIn>

            {/* What you'll see after sign-in */}
            <FadeIn delay={0.75} className="mt-12">
              <div className="flex items-baseline justify-between mb-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[hsl(var(--ink-3))]">
                  What you&apos;ll see
                </p>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[hsl(var(--ink-3))]/70">
                  Preview
                </p>
              </div>
              <MiniDashboardPreview />
            </FadeIn>
          </div>
        </div>

        {/* RIGHT — editorial composition with rotating testimonials */}
        <aside className="hidden md:flex relative border-l border-[hsl(var(--line))] bg-[hsl(var(--paper-2))] overflow-hidden">
          {/* decorative quote mark */}
          <span
            aria-hidden
            className="pointer-events-none absolute -left-6 -top-10 select-none serif text-[18rem] leading-none text-[hsl(var(--ink-3))]/10"
          >
            “
          </span>

          <div className="m-auto w-full max-w-[520px] px-12 py-24">
            <Parallax speed={0.4}>
              <div className="rule-dots pb-3 flex items-baseline justify-between">
                <span className="tag tag-accent">Voices</span>
                <span className="eyebrow">Hover to pause</span>
              </div>

              <div className="mt-10">
                <RotatingTestimonials />
              </div>

              <div className="mt-16 grid grid-cols-3 gap-6 border-t border-[hsl(var(--line))] pt-8">
                <Stat n="14"  k="sections" />
                <Stat n="6+"  k="diagrams" />
                <Stat n="42"  k="patterns" />
              </div>
            </Parallax>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Stat({ n, k }: { n: string; k: string }) {
  return (
    <div>
      <div className="display text-[28px] leading-none tracking-[-0.02em]">{n}</div>
      <div className="mt-2 eyebrow">{k}</div>
    </div>
  );
}
