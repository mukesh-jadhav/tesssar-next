import Link from "next/link";
import { getSessionUser } from "@/lib/firebase/auth";
import { getBalance } from "@/lib/credits/ledger";
import { getUserRunCount } from "@/lib/architectures/stats";
import { HeaderAuth } from "@/components/auth/HeaderAuth";
import { TessarLogo } from "@/components/shared/TessarLogo";
import type { ProfileChipUser } from "@/components/auth/ProfileChip";

/**
 * AppHeader — app-wide top bar.
 *
 *  - Logo flush to the left edge, profile flush to the right edge.
 *  - No max-width container; the bar spans the whole viewport so
 *    the brand mark anchors the page corner.
 *  - The "Sample" nav link is suppressed once the user has at least
 *    one architecture run of their own — the marketing aid stops
 *    being useful at that point.
 */
export async function AppHeader() {
  const user = await getSessionUser();
  const [credits, runCount] = user
    ? await Promise.all([getBalance(user.uid), getUserRunCount(user.uid)])
    : [undefined, 0];

  const profileUser: ProfileChipUser | null = user
    ? {
        displayName: user.displayName ?? null,
        email: user.email,
        photoURL: user.photoURL ?? null,
      }
    : null;

  const showSample = !user || runCount === 0;

  return (
    <header className="sticky top-0 z-40 border-b border-[hsl(var(--line))] bg-[hsl(var(--paper))]/85 backdrop-blur supports-[backdrop-filter]:bg-[hsl(var(--paper))]/70">
      <div className="flex h-14 w-full items-center justify-between gap-4 pl-4 pr-3 md:pl-6 md:pr-5">
        <Link href="/" className="flex items-center gap-2.5 -ml-0.5" aria-label="Tessar home">
          <TessarLogo variant="wordmark" size={30} className="text-[hsl(var(--ink))]" />
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          <HeaderLink href="/studio" label="Studio" />
          {showSample && <HeaderLink href="/sample" label="Sample" />}
          <HeaderLink href="/pricing" label="Pricing" />
        </nav>

        <div className="flex items-center gap-2 -mr-0.5">
          <HeaderAuth user={profileUser} credits={credits} />
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
