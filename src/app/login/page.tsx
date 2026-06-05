import { Logo } from "@/components/shared/Logo";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/firebase/auth";

export const metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { next?: string };
}) {
  const user = await getSessionUser();
  if (user) redirect(searchParams.next || "/dashboard");

  return (
    <div className="grid min-h-screen md:grid-cols-[1fr_1.1fr]">
      {/* LEFT — form */}
      <div className="flex flex-col p-8 md:p-12">
        <Link href="/" className="transition-opacity hover:opacity-80">
          <Logo />
        </Link>
        <div className="flex flex-1 items-center justify-center">
          <div
            className="w-full max-w-sm space-y-8 animate-reveal-up"
            style={{ animationDelay: "100ms", animationFillMode: "both" }}
          >
            <div className="space-y-3">
              <h1 className="display text-balance text-[clamp(2.25rem,4vw,2.75rem)]">
                Welcome to Tessar
              </h1>
              <p className="text-[15px] leading-relaxed text-muted-foreground">
                Sign in with Google. Your first architecture run is on us.
              </p>
            </div>
            <GoogleSignInButton next={searchParams.next || "/dashboard"} />
            <p className="text-xs leading-relaxed text-muted-foreground">
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
        </div>
        <div className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} Tessar
        </div>
      </div>

      {/* RIGHT — atmospheric panel */}
      <div className="relative hidden overflow-hidden border-l bg-card/40 md:block">
        <div className="absolute inset-0 grid-bg radial-fade opacity-[0.55]" />
        <div
          aria-hidden
          className="absolute -right-20 top-1/3 size-[420px] rounded-full bg-foreground/[0.025] blur-3xl animate-drift"
        />
        <div className="relative flex h-full flex-col justify-end p-10 lg:p-14">
          <blockquote
            className="max-w-md animate-reveal-up"
            style={{ animationDelay: "260ms", animationFillMode: "both" }}
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-card/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500/40" />
                <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500" />
              </span>
              Trusted by Indian founders
            </div>
            <p className="display text-balance text-[clamp(1.625rem,2.8vw,2.125rem)] leading-tight">
              “Tessar gave me a defensible architecture, cost model, and risk
              register in 4 minutes. It would have taken my team a week.”
            </p>
            <footer className="mt-5 text-sm text-muted-foreground">
              — Founder, B2B SaaS · Bengaluru
            </footer>
          </blockquote>
        </div>
      </div>
    </div>
  );
}
