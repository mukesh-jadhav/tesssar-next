"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { signOut } from "@/lib/firebase/client";
import { toast } from "sonner";

/**
 * WorkspaceShell — single-screen cockpit chrome.
 *
 *  - Viewport is locked (html/body never scroll).
 *  - One left rail holds the brand mark, primary nav, credits, and
 *    account chip. There is no top header bar.
 *  - Main slot fills the remaining viewport. Internal scrolling lives
 *    inside the children — never the shell.
 */

type RailUser = {
  displayName: string | null;
  email: string;
  photoURL: string | null;
} | null;

type RailItem = {
  href: string;
  label: string;
  icon: string;
  match: (pathname: string) => boolean;
};

const SIGNED_OUT_ITEMS: RailItem[] = [
  { href: "/sample", label: "Sample", icon: "auto_stories", match: (p) => p === "/" || p.startsWith("/sample") },
];

const SIGNED_IN_ITEMS: RailItem[] = [
  { href: "/dashboard", label: "Home",    icon: "home",          match: (p) => p === "/dashboard" || p === "/" },
  { href: "/new",       label: "Design",  icon: "edit_note",     match: (p) => p.startsWith("/new") },
  { href: "/history",   label: "Library", icon: "auto_stories",  match: (p) => p.startsWith("/history") || p.startsWith("/architecture") },
  { href: "/pricing",   label: "Credits", icon: "savings",       match: (p) => p.startsWith("/pricing") },
  { href: "/sample",    label: "Sample",  icon: "menu_book",     match: (p) => p.startsWith("/sample") },
];

export function WorkspaceShell({
  user,
  credits,
  children,
}: {
  user: RailUser;
  credits?: number;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const items = user ? SIGNED_IN_ITEMS : SIGNED_OUT_ITEMS;

  useEffect(() => setMenuOpen(false), [pathname]);
  useEffect(() => {
    if (!menuOpen) return;
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [menuOpen]);

  async function handleSignOut() {
    try {
      await signOut();
      toast.success("Signed out");
      router.push("/");
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  const firstName = user?.displayName?.split(" ")[0] ?? user?.email.split("@")[0] ?? null;

  return (
    <div className="grain h-full w-full flex bg-[hsl(var(--paper))] text-[hsl(var(--ink))]">
      {/* ─────────────────── LEFT RAIL ─────────────────── */}
      <aside className="w-[88px] shrink-0 border-r border-[hsl(var(--line))] bg-[hsl(var(--paper))] flex flex-col items-stretch">
        {/* Brand */}
        <Link
          href={user ? "/dashboard" : "/"}
          className="h-14 shrink-0 flex items-center justify-center border-b border-[hsl(var(--line))] hover:bg-[hsl(var(--paper-2))] transition-colors"
          aria-label="Tessar — home"
        >
          <span className="grid size-8 place-items-center rounded-lg bg-[hsl(var(--ink))] text-[hsl(var(--paper))]">
            <span className="display text-[15px] leading-none">T</span>
          </span>
        </Link>

        {/* Pinned New CTA */}
        {user && (
          <Link
            href="/new"
            className="mt-4 mx-auto grid size-11 place-items-center rounded-2xl border border-[hsl(var(--line-2))] bg-[hsl(var(--card))] hover:bg-[hsl(var(--paper-2))] press transition-colors"
            aria-label="New design"
            title="New design"
          >
            <span className="ms text-[20px]" aria-hidden>add</span>
          </Link>
        )}

        {/* Primary nav */}
        <nav className={cn("flex flex-col items-center gap-1", user ? "mt-5" : "mt-4")}>
          {items.map((d) => {
            const active = d.match(pathname);
            return (
              <Link
                key={d.href}
                href={d.href}
                className="group/d flex flex-col items-center gap-1 py-2 w-full"
                title={d.label}
              >
                <span
                  className={cn(
                    "grid size-10 place-items-center rounded-2xl transition-colors",
                    active
                      ? "bg-[hsl(var(--ink))] text-[hsl(var(--paper))]"
                      : "text-[hsl(var(--ink-2))] hover:bg-[hsl(var(--paper-2))]",
                  )}
                >
                  <span className={cn("ms text-[20px]", active && "ms-filled")} aria-hidden>{d.icon}</span>
                </span>
                <span className={cn("text-[9.5px] tracking-wide font-mono uppercase", active ? "text-[hsl(var(--ink))]" : "text-[hsl(var(--ink-3))]")}>
                  {d.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom: credits + account */}
        <div className="mt-auto flex flex-col items-center gap-3 pt-3 pb-4 border-t border-[hsl(var(--line))]">
          {typeof credits === "number" && user && (
            <Link
              href="/pricing"
              className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg hover:bg-[hsl(var(--paper-2))] transition-colors"
              title="Credits — top up"
            >
              <span className="font-mono tabular-nums text-[13px] leading-none text-[hsl(var(--ink))]">{credits}</span>
              <span className="font-mono text-[8.5px] uppercase tracking-[0.12em] text-[hsl(var(--ink-3))]">credits</span>
            </Link>
          )}

          {user ? (
            <div ref={menuRef} className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                className="grid size-9 place-items-center rounded-full overflow-hidden border border-[hsl(var(--line-2))] hover:border-[hsl(var(--ink))] transition-colors"
                aria-label="Account"
                title={user.displayName ?? user.email}
              >
                {user.photoURL ? (
                  <Image
                    src={user.photoURL}
                    alt=""
                    width={36}
                    height={36}
                    className="size-9 rounded-full object-cover"
                    unoptimized
                  />
                ) : (
                  <span className="text-[11px] font-mono uppercase">
                    {(firstName ?? "T").slice(0, 2)}
                  </span>
                )}
              </button>
              {menuOpen && (
                <div className="absolute left-[110%] bottom-0 z-50 w-64 rounded-2xl border border-[hsl(var(--line-2))] bg-[hsl(var(--paper))] shadow-[0_24px_60px_-20px_rgba(0,0,0,0.18)] p-3">
                  <div className="px-2 py-1.5">
                    <p className="text-[13px] font-medium truncate">{user.displayName ?? firstName}</p>
                    <p className="text-[11px] text-[hsl(var(--ink-3))] truncate">{user.email}</p>
                  </div>
                  <div className="my-2 h-px bg-[hsl(var(--line))]" />
                  <Link href="/dashboard" className="block px-2 py-1.5 text-[13px] hover:bg-[hsl(var(--paper-2))] rounded-lg">Home</Link>
                  <Link href="/history"   className="block px-2 py-1.5 text-[13px] hover:bg-[hsl(var(--paper-2))] rounded-lg">Library</Link>
                  <Link href="/pricing"   className="block px-2 py-1.5 text-[13px] hover:bg-[hsl(var(--paper-2))] rounded-lg">Credits</Link>
                  <div className="my-2 h-px bg-[hsl(var(--line))]" />
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="block w-full text-left px-2 py-1.5 text-[13px] text-[hsl(var(--bad))] hover:bg-[hsl(var(--paper-2))] rounded-lg"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="grid size-9 place-items-center rounded-full bg-[hsl(var(--ink))] text-[hsl(var(--paper))] hover:bg-[hsl(var(--accent))] transition-colors"
              title="Sign in"
              aria-label="Sign in"
            >
              <span className="ms text-[18px]" aria-hidden>login</span>
            </Link>
          )}

          <Link
            href="/legal/privacy"
            className="text-[9.5px] font-mono uppercase tracking-wide text-[hsl(var(--ink-3))] hover:text-[hsl(var(--ink))]"
            title="Legal"
          >
            §
          </Link>
        </div>
      </aside>

      {/* ─────────────────── MAIN ─────────────────── */}
      <main className="flex-1 min-w-0 min-h-0 flex flex-col bg-[hsl(var(--paper-2))]">
        {children}
      </main>
    </div>
  );
}
