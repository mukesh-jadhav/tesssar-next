import Link from "next/link";
import { getSessionUser } from "@/lib/firebase/auth";
import { getBalance } from "@/lib/credits/ledger";
import { ProfileChip, type ProfileChipUser } from "@/components/auth/ProfileChip";

/**
 * AppHeader — app-wide top bar.
 *
 *  - Tessar logo on the left, slim nav center, sign-in / profile right.
 *  - Server component; fetches session + credit balance once per request.
 *  - Rendered from the root layout so every page gets the same chrome.
 */
export async function AppHeader() {
  const user = await getSessionUser();
  const credits = user ? await getBalance(user.uid) : undefined;
  const signedIn = !!user;

  const profileUser: ProfileChipUser | null = user
    ? {
        displayName: user.displayName ?? null,
        email: user.email,
        photoURL: user.photoURL ?? null,
      }
    : null;

  return (
    <header className="sticky top-0 z-40 border-b border-[hsl(var(--line))] bg-[hsl(var(--paper))]/85 backdrop-blur supports-[backdrop-filter]:bg-[hsl(var(--paper))]/70">
      <div className="mx-auto flex h-14 max-w-[1480px] items-center justify-between gap-6 px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-xl bg-[hsl(var(--ink))] text-[hsl(var(--paper))]">
            <span className="display text-[13px] leading-none">T</span>
          </span>
          <span className="display text-[18px] tracking-[-0.02em]">Tessar</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          <HeaderLink href="/studio" label="Studio" />
          <HeaderLink href="/sample" label="Sample" />
          <HeaderLink href="/pricing" label="Pricing" />
        </nav>

        <div className="flex items-center gap-2">
          {signedIn && profileUser ? (
            <ProfileChip user={profileUser} credits={credits} />
          ) : (
            <Link href="/login" className="btn-pill btn-pill-sm">
              Sign in
              <span className="ms text-[16px]" aria-hidden>arrow_outward</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

function HeaderLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="state-layer rounded-full px-3.5 py-1.5 text-[13.5px] text-[hsl(var(--ink-2))] hover:text-[hsl(var(--ink))]"
    >
      {label}
    </Link>
  );
}
