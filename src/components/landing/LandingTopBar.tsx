"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { TessarLogo } from "@/components/shared/TessarLogo";

const NAV = [
  { href: "/sample",  label: "Sample" },
  { href: "/pricing", label: "Pricing" },
  { href: "/#how",    label: "How" },
  { href: "/#why",    label: "Why" },
];

export function LandingTopBar({ signedIn }: { signedIn: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled ? "py-3" : "py-5",
      )}
    >
      <div className="mx-auto max-w-[1480px] px-4 md:px-6">
        <div
          className={cn(
            "flex items-center justify-between gap-6 rounded-full border border-transparent px-3 py-2 transition-all duration-300",
            scrolled && "border-[hsl(var(--line))] bg-[hsl(var(--card))]/90 backdrop-blur",
          )}
        >
          <Link href="/" className="flex items-center gap-2.5 pl-3" aria-label="Tessar home">
            <TessarLogo variant="wordmark" size={32} className="text-[hsl(var(--ink))]" />
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="state-layer rounded-full px-4 py-2 text-[14px] text-[hsl(var(--ink-2))] hover:text-[hsl(var(--ink))]"
              >
                {n.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href={signedIn ? "/studio" : "/login"}
              className="btn-pill btn-pill-sm hidden md:inline-flex"
            >
              {signedIn ? "Open studio" : "Sign in"}
              <span className="ms text-[16px]" aria-hidden>arrow_outward</span>
            </Link>
            <button
              onClick={() => setOpen((v) => !v)}
              className="m3-icon-btn lg:hidden"
              aria-label="Menu"
            >
              <span className="ms" aria-hidden>{open ? "close" : "menu"}</span>
            </button>
          </div>
        </div>

        {/* Mobile sheet */}
        {open && (
          <div className="m3-rise mt-3 rounded-3xl border border-[hsl(var(--line))] bg-[hsl(var(--card))] p-4 lg:hidden">
            <nav className="flex flex-col gap-1">
              {NAV.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  onClick={() => setOpen(false)}
                  className="rounded-2xl px-4 py-3 text-[16px] hover:bg-[hsl(var(--paper-2))]"
                >
                  {n.label}
                </Link>
              ))}
              <Link
                href={signedIn ? "/studio" : "/login"}
                onClick={() => setOpen(false)}
                className="btn-pill mt-3"
              >
                {signedIn ? "Open studio" : "Sign in"}
                <span className="ms text-[16px]" aria-hidden>arrow_outward</span>
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
