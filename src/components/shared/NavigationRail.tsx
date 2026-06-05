"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { signOut } from "@/lib/firebase/client";

/**
 * Material 3 Expressive Navigation Rail (Gemini-style).
 * - Pinned to the left edge on lg+ screens; collapses to a top app bar on mobile.
 * - Pill-shaped destinations with tonal active state (primary-container fill).
 * - Prominent FAB-style "New architecture" at the top.
 * - Account chip + credit pill at the bottom.
 */

type Dest = {
  href: string;
  label: string;
  icon: string; // Material Symbols Rounded ligature
  match?: (pathname: string) => boolean;
};

const DESTS: Dest[] = [
  { href: "/dashboard", label: "Home", icon: "home", match: (p) => p === "/dashboard" },
  { href: "/history", label: "Library", icon: "history" },
  { href: "/pricing", label: "Credits", icon: "diamond" },
];

export function NavigationRail({
  user,
  credits: initialCredits,
}: {
  user: { displayName: string | null; email: string; photoURL: string | null };
  credits: number;
}) {
  const pathname = usePathname();
  const [credits, setCredits] = useState(initialCredits);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const i = setInterval(async () => {
      try {
        const r = await fetch("/api/credits/balance");
        if (r.ok) {
          const d = (await r.json()) as { credits: number };
          setCredits(d.credits);
        }
      } catch {}
    }, 15_000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [menuOpen]);

  const isActive = (d: Dest) =>
    d.match ? d.match(pathname) : pathname === d.href || pathname.startsWith(d.href + "/");

  return (
    <aside
      aria-label="Primary"
      className={cn(
        "sticky top-0 z-30 hidden h-screen w-[88px] shrink-0 flex-col",
        "bg-m3-surface-container-low/95 backdrop-blur",
        "lg:flex",
      )}
    >
      {/* Brand */}
      <Link
        href="/dashboard"
        aria-label="Tessar — home"
        className="state-layer mx-3 mt-3 grid h-12 w-12 place-items-center rounded-2xl text-m3-on-surface"
      >
        <Image src="/logo.svg" alt="" width={24} height={24} className="opacity-90" />
      </Link>

      {/* FAB — New architecture */}
      <Link
        href="/new"
        aria-label="New architecture"
        className={cn(
          "state-layer press mx-3 mt-4 grid h-14 w-14 place-items-center",
          "rounded-2xl bg-m3-primary-container text-m3-on-primary-container shadow-m3-3 hover:shadow-m3-4",
          "transition-all duration-m3-default-effects ease-m3-fast-spatial",
        )}
        title="New architecture"
      >
        <span className="ms ms-bold" aria-hidden>
          edit_square
        </span>
      </Link>

      {/* Destinations */}
      <nav className="mt-6 flex flex-col items-center gap-1 px-2">
        {DESTS.map((d) => {
          const active = isActive(d);
          return (
            <Link
              key={d.href}
              href={d.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "state-layer press group flex w-full flex-col items-center gap-1 rounded-2xl px-2 py-2",
                "transition-colors duration-m3-default-effects ease-m3-default-effects",
              )}
            >
              <span
                className={cn(
                  "grid h-8 w-14 place-items-center rounded-full transition-colors duration-m3-default-effects ease-m3-default-effects",
                  active
                    ? "bg-m3-secondary-container text-m3-on-secondary-container"
                    : "text-m3-on-surface-variant group-hover:text-m3-on-surface",
                )}
              >
                <span className={cn("ms", active && "ms-filled")} aria-hidden>
                  {d.icon}
                </span>
              </span>
              <span
                className={cn(
                  "text-[12px] font-medium leading-none",
                  active ? "text-m3-on-surface" : "text-m3-on-surface-variant",
                )}
              >
                {d.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Credit pill */}
      <Link
        href="/pricing"
        className={cn(
          "state-layer mx-3 mb-2 flex items-center justify-center gap-1.5 rounded-full px-2.5 py-1.5",
          "bg-m3-surface-container text-[12px] text-m3-on-surface-variant",
          credits === 0 && "bg-m3-tertiary-container text-m3-on-tertiary-container",
        )}
        aria-label={`${credits} credits remaining`}
      >
        <span className="ms text-[16px]" aria-hidden>
          diamond
        </span>
        <span className="font-mono tabular-nums">{credits}</span>
      </Link>

      {/* Account */}
      <div ref={menuRef} className="relative mb-4 px-3">
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Account menu"
          aria-expanded={menuOpen}
          className="state-layer press grid w-full place-items-center rounded-2xl py-1.5"
        >
          {user.photoURL ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.photoURL}
              alt={user.displayName ?? "User"}
              className="size-10 rounded-full ring-1 ring-m3-outline-variant"
            />
          ) : (
            <div className="grid size-10 place-items-center rounded-full bg-m3-primary-container text-sm font-medium text-m3-on-primary-container">
              {(user.displayName ?? user.email).slice(0, 1).toUpperCase()}
            </div>
          )}
        </button>
        <div
          data-state={menuOpen ? "open" : "closed"}
          className={cn(
            "pointer-events-none absolute bottom-[calc(100%+10px)] left-3 w-72 origin-bottom-left",
            "overflow-hidden rounded-2xl bg-m3-surface-container-high text-m3-on-surface shadow-m3-3",
            "transition-all duration-m3-default-effects ease-m3-default-spatial",
            "data-[state=closed]:translate-y-2 data-[state=closed]:scale-95 data-[state=closed]:opacity-0",
            "data-[state=open]:pointer-events-auto data-[state=open]:translate-y-0 data-[state=open]:scale-100 data-[state=open]:opacity-100",
          )}
        >
          <div className="border-b border-m3-outline-variant/60 px-4 py-3">
            <div className="truncate text-sm font-medium">
              {user.displayName ?? user.email}
            </div>
            <div className="truncate text-xs text-m3-on-surface-variant">{user.email}</div>
          </div>
          <div className="py-1.5">
            <RailMenuItem
              href="/dashboard"
              icon="home"
              label="Home"
              onSelect={() => setMenuOpen(false)}
            />
            <RailMenuItem
              href="/history"
              icon="history"
              label="My architectures"
              onSelect={() => setMenuOpen(false)}
            />
            <RailMenuItem
              href="/pricing"
              icon="diamond"
              label="Buy credits"
              onSelect={() => setMenuOpen(false)}
            />
            <div className="my-1.5 h-px bg-m3-outline-variant/60" />
            <button
              type="button"
              onClick={() => {
                signOut().then(() => (window.location.href = "/"));
              }}
              className="state-layer flex w-full items-center gap-3 rounded-none px-4 py-2 text-left text-sm text-m3-on-surface-variant hover:text-m3-on-surface"
            >
              <span className="ms text-[20px]" aria-hidden>
                logout
              </span>
              Sign out
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}

function RailMenuItem({
  href,
  icon,
  label,
  onSelect,
}: {
  href: string;
  icon: string;
  label: string;
  onSelect?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onSelect}
      className="state-layer flex items-center gap-3 px-4 py-2 text-sm text-m3-on-surface"
    >
      <span className="ms text-[20px] text-m3-on-surface-variant" aria-hidden>
        {icon}
      </span>
      {label}
    </Link>
  );
}
