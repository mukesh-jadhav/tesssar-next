"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { signOut } from "@/lib/firebase/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { formatDesigns } from "@/lib/credits/display";

/**
 * SideRail — slim editorial sidebar (left side, 72px collapsed → 264px expanded).
 * Uses icons + Material Symbols. Account avatar pinned to bottom.
 */

type Dest = { href: string; label: string; icon: string; match?: (p: string) => boolean };

const DESTS: Dest[] = [
  { href: "/dashboard", label: "Home",   icon: "home",          match: (p) => p === "/dashboard" },
  { href: "/new",       label: "Design", icon: "edit_note" },
  { href: "/history",   label: "Library", icon: "auto_stories" },
  { href: "/pricing",   label: "Credits", icon: "savings" },
];

export function AppDrawer({
  user,
  credits: initialCredits,
}: {
  user: { displayName: string | null; email: string; photoURL: string | null };
  credits: number;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [credits, setCredits] = useState(initialCredits);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const i = setInterval(async () => {
      try {
        const r = await fetch("/api/credits/balance");
        if (r.ok) {
          const d = (await r.json()) as { credits: number | null; unlimited?: boolean };
          setCredits(d.unlimited ? -1 : d.credits ?? 0);
        }
      } catch {}
    }, 15_000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => setMenuOpen(false), [pathname]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    if (menuOpen) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [menuOpen]);

  const firstName = user.displayName?.split(" ")[0] ?? user.email.split("@")[0];

  async function handleSignOut() {
    try {
      await signOut();
      toast.success("Signed out");
      router.push("/");
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <aside className="hidden lg:flex sticky top-0 h-screen w-[88px] shrink-0 flex-col items-stretch border-r border-[hsl(var(--line))] bg-[hsl(var(--paper))] py-5">
      {/* Logo */}
      <Link href="/dashboard" className="mx-auto grid size-12 place-items-center rounded-2xl bg-[hsl(var(--ink))] text-[hsl(var(--paper))]">
        <span className="display text-[20px] leading-none">T</span>
      </Link>

      {/* Compose CTA */}
      <Link
        href="/new"
        className="mx-auto mt-6 grid size-12 place-items-center rounded-2xl border border-[hsl(var(--line-2))] bg-[hsl(var(--card))] text-[hsl(var(--ink))] press squircle-press hover:bg-[hsl(var(--paper-2))]"
        aria-label="New design"
      >
        <span className="ms ms-bold" aria-hidden>add</span>
      </Link>

      {/* Destinations */}
      <nav className="mt-8 flex flex-col items-center gap-2">
        {DESTS.map((d) => {
          const active = d.match ? d.match(pathname) : pathname.startsWith(d.href);
          return (
            <Link
              key={d.href}
              href={d.href}
              className="group/d flex flex-col items-center gap-1 py-2 w-full"
            >
              <span
                className={cn(
                  "grid size-11 place-items-center rounded-2xl transition-all",
                  active
                    ? "bg-[hsl(var(--ink))] text-[hsl(var(--paper))]"
                    : "text-[hsl(var(--ink-2))] hover:bg-[hsl(var(--paper-2))]",
                )}
              >
                <span className={cn("ms text-[22px]", active && "ms-filled")} aria-hidden>{d.icon}</span>
              </span>
              <span className={cn("text-[10px] tracking-wide font-mono uppercase", active ? "text-[hsl(var(--ink))]" : "text-[hsl(var(--ink-3))]")}>
                {d.label}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col items-center gap-3">
        {/* Credit pill */}
        <Link
          href="/pricing"
          className="flex flex-col items-center gap-0.5 rounded-2xl px-3 py-2 hover:bg-[hsl(var(--paper-2))]"
          title={`${formatDesigns(credits)} designs remaining`}
        >
          <span className="display text-[20px] tabular-nums">{formatDesigns(credits)}</span>
          <span className="text-[9px] font-mono uppercase tracking-wider text-[hsl(var(--ink-3))]">designs</span>
        </Link>

        {/* Account */}
        <div ref={menuRef} className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="grid size-11 place-items-center overflow-hidden rounded-full border border-[hsl(var(--line))] press"
            aria-label="Account menu"
          >
            {user.photoURL ? (
              <Image src={user.photoURL} alt={firstName} width={44} height={44} className="size-11 object-cover" />
            ) : (
              <span className="display text-[15px]">{firstName.slice(0, 1).toUpperCase()}</span>
            )}
          </button>

          {menuOpen && (
            <div className="absolute bottom-full left-full ml-3 mb-2 w-64 rounded-2xl border border-[hsl(var(--line))] bg-[hsl(var(--card))] p-2 z-50 m3-rise">
              <div className="border-b border-[hsl(var(--line))] px-3 py-3">
                <div className="font-medium text-[14px] truncate">{user.displayName ?? firstName}</div>
                <div className="text-[12px] text-[hsl(var(--ink-3))] truncate">{user.email}</div>
              </div>
              <button
                onClick={handleSignOut}
                className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-[14px] hover:bg-[hsl(var(--paper-2))]"
              >
                <span className="ms text-[18px]" aria-hidden>logout</span>
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
