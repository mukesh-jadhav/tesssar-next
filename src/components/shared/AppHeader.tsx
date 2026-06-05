"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Logo } from "@/components/shared/Logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Coins, LogOut } from "lucide-react";
import { signOut } from "@/lib/firebase/client";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

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
  const lastY = useRef(0);
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

  const navLinks = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/new", label: "New" },
    { href: "/history", label: "History" },
    { href: "/pricing", label: "Pricing" },
  ];

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
      <div className="container flex h-16 items-center justify-between">
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
                  active
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
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
        <div className="flex items-center gap-3">
          <Link href="/pricing">
            <Badge
              variant="brand"
              className="cursor-pointer gap-1.5 px-2.5 py-1 transition-all hover:bg-foreground/[0.06]"
            >
              <Coins className="size-3.5" />
              <span className="tabular-nums">{credits}</span>
              <span className="text-muted-foreground">
                {credits === 1 ? "credit" : "credits"}
              </span>
            </Badge>
          </Link>
          <div className="flex items-center gap-2">
            {user.photoURL ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.photoURL}
                alt={user.displayName ?? "User"}
                className="size-8 rounded-full border ring-1 ring-foreground/5 transition-transform duration-300 ease-out-quart hover:scale-105"
              />
            ) : (
              <div className="grid size-8 place-items-center rounded-full bg-muted text-xs font-medium">
                {(user.displayName ?? user.email).slice(0, 1).toUpperCase()}
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                signOut().then(() => (window.location.href = "/"));
              }}
              aria-label="Sign out"
            >
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
