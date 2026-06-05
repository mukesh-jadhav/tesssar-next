"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Logo } from "@/components/shared/Logo";
import { Button } from "@/components/ui/button";
import { Coins, LogOut, Plus } from "lucide-react";
import { signOut } from "@/lib/firebase/client";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { CommandMenuTrigger } from "@/components/shared/CommandMenu";

export function AppHeader({
  user,
  credits: initialCredits,
}: {
  user: { displayName: string | null; email: string; photoURL: string | null };
  credits: number;
}) {
  const [credits, setCredits] = useState(initialCredits);
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const lastY = useRef(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 8);
      if (y > 80 && y - lastY.current > 6) setHidden(true);
      else if (lastY.current - y > 6 || y < 80) setHidden(false);
      lastY.current = y;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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

  // Close avatar menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [menuOpen]);

  const navLinks = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/history", label: "History" },
    { href: "/pricing", label: "Pricing" },
  ];

  const onNewPage = pathname === "/new";

  return (
    <header
      data-hidden={hidden}
      data-scrolled={scrolled}
      className={cn(
        "sticky top-0 z-40 w-full transition-[transform,background-color,border-color,backdrop-filter] duration-300 ease-out-quart",
        "border-b border-transparent bg-background/60 backdrop-blur-md",
        "data-[scrolled=true]:border-border data-[scrolled=true]:bg-background/85 data-[scrolled=true]:backdrop-blur-xl",
        "data-[hidden=true]:-translate-y-full",
      )}
    >
      <div className="flex h-16 items-center gap-4 px-4 md:px-6 lg:px-8">
        {/* Logo + nav */}
        <div className="flex items-center gap-6">
          <Link href="/dashboard" aria-label="Tessar — go to dashboard">
            <Logo />
          </Link>
          <nav className="hidden items-center gap-0.5 md:flex">
            {navLinks.map((l) => {
              const active = pathname === l.href || pathname.startsWith(l.href + "/");
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={cn(
                    "relative rounded-md px-3 py-1.5 text-sm transition-colors duration-200",
                    active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {l.label}
                  <span
                    aria-hidden
                    className={cn(
                      "pointer-events-none absolute inset-x-3 -bottom-[15px] h-px origin-center bg-foreground transition-transform duration-300 ease-out-expo",
                      active ? "scale-x-100" : "scale-x-0",
                    )}
                  />
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Command palette trigger (grows) */}
        <div className="hidden flex-1 justify-center md:flex">
          <CommandMenuTrigger className="w-full max-w-[360px]" />
        </div>

        {/* Right cluster */}
        <div className="ml-auto flex items-center gap-2 md:gap-3">
          {/* New architecture — quick action */}
          {!onNewPage && (
            <Button asChild size="sm" className="hidden gap-1.5 sm:inline-flex">
              <Link href="/new">
                <Plus className="size-3.5" />
                <span>New</span>
              </Link>
            </Button>
          )}

          {/* Credit pill */}
          <Link
            href="/pricing"
            className={cn(
              "group/credits inline-flex h-9 items-center gap-1.5 rounded-md border bg-card/60 px-2.5 text-xs transition-all duration-200 ease-out-quart hover:border-foreground/15 hover:bg-card",
              credits === 0 && "border-amber-500/30 bg-amber-500/[0.04] text-amber-700",
            )}
            aria-label={`${credits} credits remaining`}
          >
            <Coins className="size-3.5 transition-transform duration-300 ease-out-quart group-hover/credits:scale-110" />
            <span className="font-mono tabular-nums">{credits}</span>
            <span className="hidden text-muted-foreground sm:inline">
              {credits === 1 ? "credit" : "credits"}
            </span>
          </Link>

          {/* Avatar menu */}
          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Account menu"
              aria-expanded={menuOpen}
              className="block rounded-full ring-offset-background transition-transform duration-300 ease-out-quart hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20 focus-visible:ring-offset-2"
            >
              {user.photoURL ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.photoURL}
                  alt={user.displayName ?? "User"}
                  className="size-9 rounded-full border ring-1 ring-foreground/5"
                />
              ) : (
                <div className="grid size-9 place-items-center rounded-full border bg-muted text-xs font-medium">
                  {(user.displayName ?? user.email).slice(0, 1).toUpperCase()}
                </div>
              )}
            </button>
            <div
              data-state={menuOpen ? "open" : "closed"}
              className={cn(
                "pointer-events-none absolute right-0 top-[calc(100%+8px)] w-64 origin-top-right overflow-hidden rounded-xl border bg-popover text-popover-foreground shadow-2xl transition-all duration-200 ease-out-expo",
                "data-[state=closed]:scale-95 data-[state=closed]:opacity-0",
                "data-[state=open]:pointer-events-auto data-[state=open]:scale-100 data-[state=open]:opacity-100",
              )}
            >
              <div className="border-b p-3">
                <div className="truncate text-sm font-medium">
                  {user.displayName ?? user.email}
                </div>
                <div className="truncate text-xs text-muted-foreground">{user.email}</div>
              </div>
              <div className="p-1">
                <Link
                  href="/dashboard"
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-md px-2.5 py-1.5 text-sm transition-colors hover:bg-foreground/[0.04]"
                >
                  Dashboard
                </Link>
                <Link
                  href="/history"
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-md px-2.5 py-1.5 text-sm transition-colors hover:bg-foreground/[0.04]"
                >
                  My architectures
                </Link>
                <Link
                  href="/pricing"
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-md px-2.5 py-1.5 text-sm transition-colors hover:bg-foreground/[0.04]"
                >
                  Buy credits
                </Link>
                <div className="my-1 h-px bg-border" />
                <button
                  type="button"
                  onClick={() => {
                    signOut().then(() => (window.location.href = "/"));
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-sm text-muted-foreground transition-colors hover:bg-foreground/[0.04] hover:text-foreground"
                >
                  <LogOut className="size-3.5" />
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
