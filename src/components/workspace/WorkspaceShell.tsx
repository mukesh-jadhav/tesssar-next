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
 *  - Top bar: brand mark + active context label + global actions.
 *  - Left rail: primary nav (icon + label), pinned New CTA, account chip.
 *  - Main slot fills the remaining viewport. Any internal scrolling lives
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
  { href: "/login",  label: "Sign in", icon: "login",       match: (p) => p.startsWith("/login") },
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
  contextLabel,
  contextTitle,
  toolbar,
  children,
}: {
  user: RailUser;
  credits?: number;
  /** Small eyebrow label rendered in the top bar (e.g. "§ Report · Sample"). */
  contextLabel?: string;
  /** Larger context title (e.g. project name). */
  contextTitle?: string;
  /** Optional right-side toolbar slot in the top bar. */
  toolbar?: React.ReactNode;
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
    <div className="grain h-full w-full flex flex-col bg-[hsl(var(--paper))] text-[hsl(var(--ink))]">
      {/* ─────────────────── TOP BAR ─────────────────── */}
      <header className="h-12 shrink-0 flex items-stretch border-b border-[hsl(var(--line))] bg-[hsl(var(--paper))]">
        {/* Brand block — aligns with rail width below */}
        <Link
          href={user ? "/dashboard" : "/"}
          className="w-[88px] shrink-0 flex items-center justify-center border-r border-[hsl(var(--line))] hover:bg-[hsl(var(--paper-2))] transition-colors"
        >
          <span className="grid size-7 place-items-center rounded-lg bg-[hsl(var(--ink))] text-[hsl(var(--paper))]">
            <span className="display text-[14px] leading-none">T</span>
          </span>
        </Link>

        {/* Context strip */}
        <div className="flex-1 min-w-0 flex items-center gap-4 px-5">
          {contextLabel && (
            <span className="section-num shrink-0 text-[10.5px]">{contextLabel}</span>
          )}
          {contextTitle && (
            <span className="display text-[14px] tracking-[-0.015em] text-[hsl(var(--ink))] truncate">
              {contextTitle}
            </span>
          )}
        </div>

        {/* Toolbar slot */}
        {toolbar && (
          <div className="flex items-center gap-2 pr-3 border-l border-[hsl(var(--line))] pl-4">
            {toolbar}
          </div>
        )}

        {/* Credits / account chip */}
        <div className="flex items-center gap-2 pr-3">
          {typeof credits === "number" && (
            <Link
              href="/pricing"
              className="hidden md:inline-flex h-8 items-center gap-2 rounded-full border border-[hsl(var(--line-2))] bg-[hsl(var(--paper-2))] pl-3 pr-2 text-[12px] hover:border-[hsl(var(--ink))] transition-colors"
              title="Top up credits"
            >
              <span className="ms text-[14px] text-[hsl(var(--accent))]" aria-hidden>savings</span>
              <span className="font-mono tabular-nums">{credits}</span>
              <span className="font-mono text-[10px] text-[hsl(var(--ink-3))] uppercase tracking-wider">credits</span>
            </Link>
          )}
          {user ? (
            <div ref={menuRef} className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                className="grid size-8 place-items-center rounded-full overflow-hidden border border-[hsl(var(--line-2))] hover:border-[hsl(var(--ink))] transition-colors"
                aria-label="Account"
              >
                {user.photoURL ? (
                  <Image
                    src={user.photoURL}
                    alt=""
                    width={32}
                    height={32}
                    className="size-8 rounded-full object-cover"
                    unoptimized
                  />
                ) : (
                  <span className="text-[11px] font-mono uppercase">
                    {(firstName ?? "T").slice(0, 2)}
                  </span>
                )}
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-[110%] z-50 w-64 rounded-2xl border border-[hsl(var(--line-2))] bg-[hsl(var(--paper))] shadow-[0_24px_60px_-20px_rgba(0,0,0,0.18)] p-3">
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
            <Link href="/login" className="h-8 px-3 inline-flex items-center rounded-full bg-[hsl(var(--ink))] text-[hsl(var(--paper))] text-[12px] font-medium hover:bg-[hsl(var(--accent))] transition-colors">
              Sign in
            </Link>
          )}
        </div>
      </header>

      {/* ─────────────────── BODY (rail + main) ─────────────────── */}
      <div className="flex-1 min-h-0 flex">
        {/* Left rail */}
        <aside className="w-[88px] shrink-0 border-r border-[hsl(var(--line))] bg-[hsl(var(--paper))] flex flex-col items-stretch py-4">
          {/* Pinned New CTA */}
          {user && (
            <Link
              href="/new"
              className="mx-auto grid size-11 place-items-center rounded-2xl border border-[hsl(var(--line-2))] bg-[hsl(var(--card))] hover:bg-[hsl(var(--paper-2))] press transition-colors"
              aria-label="New design"
              title="New design"
            >
              <span className="ms text-[20px]" aria-hidden>add</span>
            </Link>
          )}

          <nav className={cn("flex flex-col items-center gap-1", user && "mt-5")}>
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

          <div className="mt-auto flex flex-col items-center gap-2 pt-2 border-t border-[hsl(var(--line))]">
            <Link
              href="/legal/privacy"
              className="text-[9.5px] font-mono uppercase tracking-wide text-[hsl(var(--ink-3))] hover:text-[hsl(var(--ink))]"
              title="Legal"
            >
              §
            </Link>
          </div>
        </aside>

        {/* Main slot */}
        <main className="flex-1 min-w-0 min-h-0 flex flex-col bg-[hsl(var(--paper-2))]">
          {children}
        </main>
      </div>
    </div>
  );
}
