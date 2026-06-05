import Link from "next/link";
import Image from "next/image";
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
  if (user) redirect(searchParams.next || "/dashboard");

  return (
    <div className="relative grid min-h-screen overflow-hidden bg-m3-surface text-m3-on-surface md:grid-cols-[1fr_1.1fr]">
      {/* LEFT — sign in column */}
      <div className="relative z-10 flex flex-col justify-between p-8 md:p-12">
        <Link href="/" className="state-layer inline-flex w-fit items-center gap-2.5 rounded-full px-3 py-2">
          <Image src="/logo.svg" alt="" width={28} height={28} />
          <span className="display text-[18px] leading-none">Tessar</span>
        </Link>

        <div className="m3-page-enter mx-auto w-full max-w-sm space-y-8">
          <div className="space-y-4">
            <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-m3-on-surface-variant">
              Welcome
            </div>
            <h1 className="display text-balance text-[clamp(2.25rem,4.5vw,3rem)] leading-[1.05]">
              Sign in to <span className="hero-gradient">Tessar</span>
            </h1>
            <p className="text-[15px] leading-relaxed text-m3-on-surface-variant">
              Your first architecture run is on us. No credit card required.
            </p>
          </div>

          <GoogleSignInButton next={searchParams.next || "/dashboard"} />

          <p className="text-[12px] leading-relaxed text-m3-on-surface-variant">
            By continuing, you agree to our{" "}
            <Link href="/legal/terms" className="underline-offset-4 hover:underline">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/legal/privacy" className="underline-offset-4 hover:underline">
              Privacy Policy
            </Link>
            .
          </p>
        </div>

        <div className="text-[11px] text-m3-on-surface-variant">
          © {new Date().getFullYear()} Tessar
        </div>
      </div>

      {/* RIGHT — atmospheric panel */}
      <div className="relative hidden overflow-hidden md:block">
        <div aria-hidden className="absolute inset-0 m3-mesh" />
        <div aria-hidden className="absolute left-[10%] top-[20%] size-44 rounded-[42%_58%_67%_33%/41%_44%_56%_59%] bg-m3-primary opacity-90 shadow-m3-3 m3-shape-a" />
        <div aria-hidden className="absolute right-[8%] top-[35%] size-56 rounded-full bg-m3-tertiary opacity-85 shadow-m3-4 m3-shape-b" />
        <div aria-hidden className="absolute bottom-[18%] left-[20%] size-36 rotate-12 rounded-[36px] bg-m3-secondary-container shadow-m3-2 m3-blob" />

        <div className="relative flex h-full flex-col justify-end p-10 lg:p-16">
          <div className="m3-page-enter max-w-md" style={{ animationDelay: "260ms" }}>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-m3-outline-variant bg-m3-surface-container-lowest/90 px-3 py-1 text-[12px] text-m3-on-surface-variant backdrop-blur">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500/40" />
                <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500" />
              </span>
              Trusted by Indian founders
            </div>
            <p className="display text-balance text-[clamp(1.75rem,3vw,2.25rem)] leading-[1.15] text-m3-on-surface">
              &ldquo;Tessar gave me a defensible architecture, cost model, and
              risk register in 4 minutes. It would have taken my team a week.&rdquo;
            </p>
            <footer className="mt-5 text-[14px] text-m3-on-surface-variant">
              — Founder, B2B SaaS · Bengaluru
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
}
