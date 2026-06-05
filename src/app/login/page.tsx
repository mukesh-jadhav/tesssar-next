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
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col p-8">
        <Link href="/"><Logo /></Link>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm space-y-8">
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight">Welcome to Tessar</h1>
              <p className="text-sm text-muted-foreground">
                Sign in with Google. Your first architecture is on us.
              </p>
            </div>
            <GoogleSignInButton next={searchParams.next || "/dashboard"} />
            <p className="text-xs text-muted-foreground">
              By continuing, you agree to our{" "}
              <Link href="/legal/terms" className="underline">Terms</Link> and{" "}
              <Link href="/legal/privacy" className="underline">Privacy Policy</Link>.
            </p>
          </div>
        </div>
        <div className="text-xs text-muted-foreground">© {new Date().getFullYear()} Tessar</div>
      </div>
      <div className="relative hidden bg-secondary lg:block">
        <div className="absolute inset-0 grid-bg radial-fade opacity-60" />
        <div className="relative flex h-full flex-col justify-end p-10">
          <blockquote className="max-w-md">
            <p className="text-2xl font-medium leading-snug tracking-tight text-balance">
              "Tessar gave me a defensible architecture, cost model, and risk register
              in 4 minutes. It would have taken my team a week."
            </p>
            <footer className="mt-4 text-sm text-muted-foreground">
              — Founder, B2B SaaS · Bengaluru
            </footer>
          </blockquote>
        </div>
      </div>
    </div>
  );
}
