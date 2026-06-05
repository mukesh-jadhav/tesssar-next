"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { signOut } from "@/lib/firebase/client";
import { Fab } from "@/components/m3/Fab";

/**
 * Material 3 Expressive — Modal Navigation Drawer (desktop).
 * Pattern: collapsed Navigation Rail (88dp) that EXPANDS on hover/focus to a
 * 280dp drawer, animating destination labels in. The expanded state floats
 * over content with a soft shadow.
 *
 * The mobile companion is `BottomBar` rendered separately.
 */

type Dest = {
  href: string;
  label: string;
  icon: string;
  match?: (p: string) => boolean;
};

const DESTS: Dest[] = [
  { href: "/dashboard", label: "Home", icon: "home", match: (p) => p === "/dashboard" },
  { href: "/new", label: "Design", icon: "auto_awesome" },
  { href: "/history", label: "Library", icon: "history" },
  { href: "/pricing", label: "Credits", icon: "diamond" },
];

export function AppDrawer({
  user,
  credits: initialCredits,
}: {
  user: { displayName: string | null; email: string; photoURL: string | null };
  credits: number;
}) {
  const pathname = usePathname();
  const [credits, setCredits] = useState(initialCredits);
  const [expanded, setExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const railRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Live credit polling
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

  // Close account menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [menuOpen]);

  // Close drawer when pathname changes
  useEffect(() => {
    setExpanded(false);
    setMenuOpen(false);
  }, [pathname]);

  const onEnter = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setExpanded(true);
  };
  const onLeave = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setExpanded(false), 180);
  };

  const isActive = (d: Dest) =>
    d.match ? d.match(pathname) : pathname === d.href || pathname.startsWith(d.href + "/");

  return (
    <>
      {/* Spacer column — keeps the rail's 88dp footprint */}
      <div aria-hidden className="hidden w-[88px] shrink-0 lg:block" />

      <aside
        ref={railRef}
        aria-label="Primary"
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
        data-expanded={expanded || undefined}
        className={cn(
          "fixed left-0 top-0 z-40 hidden h-screen flex-col py-3 lg:flex",
          "bg-m3-surface-container-low/95 backdrop-blur",
          "transition-[width,box-shadow] duration-m3-default-spatial ease-m3-default-spatial",
          "w-[88px] data-[expanded]:w-[280px] data-[expanded]:shadow-m3-4",
          "border-r border-m3-outline-variant/40",
        )}
      >
        {/* Brand */}
        <Link
          href="/dashboard"
          aria-label="Tessar — home"
          className="state-layer mx-3 grid h-12 items-center rounded-2xl px-3 text-m3-on-surface"
        >
          <div className="flex items-center gap-3">
            <Image src="/logo.svg" alt="" width={28} height={28} className="opacity-95" />
            <span
              className={cn(
                "display whitespace-nowrap text-[22px] leading-none",
                "transition-opacity duration-m3-default-effects ease-m3-default-effects",
                expanded ? "opacity-100" : "opacity-0",
              )}
            >
              Tessar
            </span>
          </div>
        </Link>

        {/* FAB */}
        <div className="mx-3 mt-5">
          {expanded ? (
            <Fab size="extended" icon="auto_awesome" href="/new" className="w-full">
              New design
            </Fab>
          ) : (
            <Fab size="md" icon="auto_awesome" href="/new" className="mx-auto" />
          )}
        </div>

        {/* Destinations */}
        <nav className="mt-6 flex flex-col gap-1 px-3">
          {DESTS.map((d) => {
            const active = isActive(d);
            return (
              <Link
                key={d.href}
                href={d.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "state-layer press group relative flex items-center rounded-full",
                  "transition-all duration-m3-default-effects ease-m3-default-effects",
                  expanded ? "h-14 px-4 gap-4" : "h-14 px-3 justify-center",
                  active
                    ? "bg-m3-secondary-container text-m3-on-secondary-container"
                    : "text-m3-on-surface-variant hover:text-m3-on-surface",
                )}
              >
                <span
                  className={cn("ms text-[24px] shrink-0", active && "ms-filled")}
                  aria-hidden
                >
                  {d.icon}
                </span>
                <span
                  className={cn(
                    "whitespace-nowrap text-[15px] font-medium",
                    "transition-opacity duration-m3-default-effects ease-m3-default-effects",
                    expanded ? "opacity-100" : "pointer-events-none w-0 overflow-hidden opacity-0",
                  )}
                >
                  {d.label}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="flex-1" />

        {/* Credit pill */}
        <Link
          href="/pricing"
          className={cn(
            "state-layer mx-3 mb-2 flex items-center gap-2.5 rounded-full px-3 py-2",
            "transition-all duration-m3-default-effects ease-m3-default-effects",
            credits === 0
              ? "bg-m3-tertiary-container text-m3-on-tertiary-container"
              : "bg-m3-surface-container text-m3-on-surface-variant",
            expanded ? "justify-start" : "justify-center",
          )}
          aria-label={`${credits} credits remaining`}
        >
          <span className="ms text-[20px]" aria-hidden>diamond</span>
          {expanded && (
            <span className="text-[13px] font-medium">
              <span className="font-mono tabular-nums">{credits}</span>{" "}
              {credits === 1 ? "credit" : "credits"}
            </span>
          )}
        </Link>

        {/* Account */}
        <div ref={menuRef} className="relative px-3">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Account"
            aria-expanded={menuOpen}
            className={cn(
              "state-layer press flex w-full items-center gap-3 rounded-full py-1.5 pr-3",
              expanded ? "pl-1" : "justify-center px-1",
            )}
          >
            {user.photoURL ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.photoURL}
                alt={user.displayName ?? "User"}
                className="size-10 rounded-full ring-1 ring-m3-outline-variant"
              />
            ) : (
              <div className="grid size-10 place-items-center rounded-full bg-m3-primary-container text-sm font-semibold text-m3-on-primary-container">
                {(user.displayName ?? user.email).slice(0, 1).toUpperCase()}
              </div>
            )}
            {expanded && (
              <div className="min-w-0 flex-1 text-left">
                <div className="truncate text-[13px] font-medium text-m3-on-surface">
                  {user.displayName ?? user.email}
                </div>
                <div className="truncate text-[11px] text-m3-on-surface-variant">{user.email}</div>
              </div>
            )}
            {expanded && (
              <span className="ms text-[20px] text-m3-on-surface-variant" aria-hidden>
                {menuOpen ? "expand_more" : "more_vert"}
              </span>
            )}
          </button>

          <div
            data-state={menuOpen ? "open" : "closed"}
            className={cn(
              "pointer-events-none absolute bottom-[calc(100%+10px)] left-3 w-72 origin-bottom-left",
              "overflow-hidden rounded-3xl bg-m3-surface-container-high text-m3-on-surface shadow-m3-3",
              "transition-all duration-m3-default-effects ease-m3-default-spatial",
              "data-[state=closed]:translate-y-2 data-[state=closed]:scale-95 data-[state=closed]:opacity-0",
              "data-[state=open]:pointer-events-auto data-[state=open]:translate-y-0 data-[state=open]:scale-100 data-[state=open]:opacity-100",
            )}
          >
            <div className="border-b border-m3-outline-variant/60 px-5 py-4">
              <div className="truncate text-sm font-medium">{user.displayName ?? user.email}</div>
              <div className="truncate text-xs text-m3-on-surface-variant">{user.email}</div>
            </div>
            <div className="py-1.5">
              <MenuItem href="/dashboard" icon="home" label="Home" onClick={() => setMenuOpen(false)} />
              <MenuItem href="/history" icon="history" label="My architectures" onClick={() => setMenuOpen(false)} />
              <MenuItem href="/pricing" icon="diamond" label="Buy credits" onClick={() => setMenuOpen(false)} />
              <div className="my-1.5 h-px bg-m3-outline-variant/60" />
              <button
                type="button"
                onClick={() => signOut().then(() => (window.location.href = "/"))}
                className="state-layer flex w-full items-center gap-3 px-5 py-2.5 text-left text-sm text-m3-on-surface-variant hover:text-m3-on-surface"
              >
                <span className="ms text-[20px]" aria-hidden>logout</span>
                Sign out
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

function MenuItem({
  href,
  icon,
  label,
  onClick,
}: {
  href: string;
  icon: string;
  label: string;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="state-layer flex items-center gap-3 px-5 py-2.5 text-sm text-m3-on-surface"
    >
      <span className="ms text-[20px] text-m3-on-surface-variant" aria-hidden>
        {icon}
      </span>
      {label}
    </Link>
  );
}
