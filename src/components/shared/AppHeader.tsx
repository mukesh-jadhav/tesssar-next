"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Logo } from "@/components/shared/Logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Coins, LogOut } from "lucide-react";
import { signOut } from "@/lib/firebase/client";

export function AppHeader({
  user,
  credits: initialCredits,
}: {
  user: { displayName: string | null; email: string; photoURL: string | null };
  credits: number;
}) {
  const [credits, setCredits] = useState(initialCredits);

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

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/dashboard" className="flex items-center">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          <Link
            href="/dashboard"
            className="rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            Dashboard
          </Link>
          <Link
            href="/new"
            className="rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            New
          </Link>
          <Link
            href="/history"
            className="rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            History
          </Link>
          <Link
            href="/pricing"
            className="rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            Pricing
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/pricing">
            <Badge variant="brand" className="cursor-pointer gap-1.5 px-2.5 py-1">
              <Coins className="size-3.5" />
              {credits} {credits === 1 ? "credit" : "credits"}
            </Badge>
          </Link>
          <div className="flex items-center gap-2">
            {user.photoURL ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.photoURL}
                alt={user.displayName ?? "User"}
                className="size-8 rounded-full border"
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
