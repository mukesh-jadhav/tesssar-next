"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { IconButton } from "@/components/m3/IconButton";
import { Fab } from "@/components/m3/Fab";

/**
 * M3 Expressive top app bar for marketing pages.
 * - Pill chip nav in the centre on desktop
 * - Bottom sheet / drawer on mobile
 */
export function LandingTopBar({ signedIn }: { signedIn: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const lastY = useRef(0);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 8);
      if (y > 200 && y - lastY.current > 6) setHidden(true);
      else if (lastY.current - y > 6 || y < 200) setHidden(false);
      lastY.current = y;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header
        data-scrolled={scrolled || undefined}
        className={cn(
          "fixed left-0 right-0 top-0 z-50 px-4 pt-4 transition-transform duration-m3-default-effects ease-m3-default-spatial",
          hidden && "-translate-y-[120%]",
        )}
      >
        <div
          className={cn(
            "mx-auto flex h-16 max-w-[1100px] items-center gap-3 rounded-full px-3 transition-all duration-m3-default-effects ease-m3-default-effects",
            scrolled
              ? "bg-m3-surface-container/85 shadow-m3-2 backdrop-blur-xl"
              : "bg-m3-surface-container-lowest/80 backdrop-blur-md",
          )}
        >
          <Link href="/" className="state-layer flex items-center gap-2.5 rounded-full px-3 py-2">
            <Image src="/logo.svg" alt="" width={28} height={28} />
            <span className="display text-[18px] leading-none">Tessar</span>
          </Link>

          <nav className="ml-2 hidden flex-1 items-center gap-1 md:flex">
            {[
              { href: "/sample", label: "Sample" },
              { href: "/#features", label: "Features" },
              { href: "/#how", label: "How it works" },
              { href: "/pricing", label: "Pricing" },
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="state-layer rounded-full px-4 py-2 text-[14px] text-m3-on-surface-variant transition-colors duration-m3-default-effects ease-m3-default-effects hover:text-m3-on-surface"
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2 pr-1">
            {signedIn ? (
              <Fab size="extended" icon="rocket_launch" href="/dashboard" variant="primary" className="!h-11 !rounded-full !px-4 !text-[14px]">
                Open app
              </Fab>
            ) : (
              <>
                <Link
                  href="/login"
                  className="state-layer hidden h-11 items-center rounded-full px-4 text-[14px] font-medium text-m3-on-surface md:inline-flex"
                >
                  Sign in
                </Link>
                <Fab size="extended" icon="arrow_forward" href="/login" variant="primary" className="!h-11 !rounded-full !px-4 !text-[14px]">
                  Get started
                </Fab>
              </>
            )}
            <IconButton
              icon={open ? "close" : "menu"}
              ariaLabel="Menu"
              onClick={() => setOpen((v) => !v)}
              className="md:hidden"
            />
          </div>
        </div>
      </header>

      {/* Mobile menu sheet */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            aria-label="Close"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-m3-scrim/40"
          />
          <div className="m3-rise absolute inset-x-3 top-24 rounded-3xl bg-m3-surface-container-high p-3 shadow-m3-4">
            {[
              { href: "/sample", label: "Sample", icon: "auto_stories" },
              { href: "/#features", label: "Features", icon: "category" },
              { href: "/#how", label: "How it works", icon: "rocket_launch" },
              { href: "/pricing", label: "Pricing", icon: "diamond" },
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="state-layer flex items-center gap-3 rounded-2xl px-4 py-3.5 text-[15px] text-m3-on-surface"
              >
                <span className="ms text-[22px] text-m3-on-surface-variant" aria-hidden>{l.icon}</span>
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
