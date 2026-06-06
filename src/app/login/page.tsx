import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/firebase/auth";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";

export const metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { next?: string };
}) {
  const user = await getSessionUser();
  if (user) redirect(searchParams.next || "/studio");

  return (
    <div className="grain relative min-h-screen bg-[hsl(var(--paper))] text-[hsl(var(--ink))]">
      {/* Top bar */}
      <header className="absolute inset-x-0 top-0 z-20 px-6 py-5 md:px-12">
        <div className="mx-auto flex max-w-[1480px] items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-[hsl(var(--ink))] text-[hsl(var(--paper))]">
              <span className="display text-[15px] leading-none">T</span>
            </span>
            <span className="display text-[20px] tracking-[-0.02em]">Tessar</span>
          </Link>
          <Link href="/" className="eyebrow ulgrow">← back to home</Link>
        </div>
      </header>

      <div className="grid min-h-screen md:grid-cols-[1.1fr_1fr]">
        {/* LEFT — sign in */}
        <div className="flex items-center justify-center px-6 py-32 md:px-16">
          <div className="m3-page-enter w-full max-w-md">
            <p className="section-num">§ Volume 01 · Welcome</p>
            <h1 className="display-tight mt-6 text-[clamp(3rem,7vw,5.5rem)] leading-[0.9] tracking-[-0.045em]">
              Sign in.<br />
              <span className="serif font-normal italic accent">Start designing.</span>
            </h1>
            <p className="mt-6 text-[16px] leading-relaxed text-[hsl(var(--ink-2))] max-w-[40ch]">
              Your first three architecture runs are on the house. No credit card.
              Bring a system, leave with a report.
            </p>

            <div className="mt-12">
              <GoogleSignInButton next={searchParams.next || "/studio"} />
            </div>

            <p className="mt-8 text-[13px] text-[hsl(var(--ink-3))]">
              By continuing you agree to our{" "}
              <Link href="/legal/terms" className="link-ink">Terms</Link> &{" "}
              <Link href="/legal/privacy" className="link-ink">Privacy</Link>.
            </p>
          </div>
        </div>

        {/* RIGHT — editorial composition */}
        <aside className="hidden md:flex relative border-l border-[hsl(var(--line))] bg-[hsl(var(--paper-2))] overflow-hidden">
          <div className="m-auto w-full max-w-[520px] px-12 py-24">
            <div className="rule-dots pb-3 flex items-baseline justify-between">
              <span className="tag tag-accent">Featured</span>
              <span className="eyebrow">Issue 05 · pg. 41</span>
            </div>

            <p className="display mt-10 text-[clamp(1.8rem,3vw,2.8rem)] leading-[1.1] tracking-[-0.025em]">
              <span className="serif font-normal italic">“It used to take a week</span> to
              produce a defensible architecture doc. Tessar gives you a draft
              you can argue with in <span className="accent">four minutes.</span>”
            </p>

            <div className="mt-10 flex items-center gap-4">
              <div className="grid size-12 place-items-center rounded-full bg-[hsl(var(--ink))] text-[hsl(var(--paper))]">
                <span className="display text-[16px]">PR</span>
              </div>
              <div>
                <div className="text-[14px] font-medium">Priya R.</div>
                <div className="eyebrow">Principal engineer · Bengaluru</div>
              </div>
            </div>

            <div className="mt-16 grid grid-cols-3 gap-6 border-t border-[hsl(var(--line))] pt-8">
              <Stat n="~4m" k="median run" />
              <Stat n="3×" k="scale tiers" />
              <Stat n="14" k="categories" />
            </div>
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
