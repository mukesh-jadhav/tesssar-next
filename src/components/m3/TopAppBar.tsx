"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Material 3 Expressive — Top App Bar (medium).
 * - Collapses from large headline → small title on scroll.
 * - Sticky, with backdrop blur, scroll-responsive border.
 */
export function TopAppBar({
  title,
  subtitle,
  leading,
  trailing,
  className,
  variant = "medium",
}: {
  title: string;
  subtitle?: string;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  variant?: "small" | "medium" | "large";
  className?: string;
}) {
  const [scrolled, setScrolled] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const titleSize =
    variant === "small"
      ? "text-[18px]"
      : variant === "medium"
        ? cn("text-[26px] leading-tight transition-all duration-m3-default-effects ease-m3-default-effects",
            scrolled && "text-[18px]")
        : cn("text-[34px] leading-tight transition-all duration-m3-default-effects ease-m3-default-effects",
            scrolled && "text-[20px]");

  return (
    <header
      ref={ref}
      data-scrolled={scrolled || undefined}
      className={cn("m3-top-app-bar", className)}
    >
      <div className="mx-auto flex max-w-[1600px] items-center gap-3 px-4 py-3 md:px-6">
        {leading}
        <div className="min-w-0 flex-1">
          <h1 className={cn("display text-balance text-m3-on-surface", titleSize)}>{title}</h1>
          {subtitle && !scrolled && (
            <p className="mt-1 text-[13px] text-m3-on-surface-variant">{subtitle}</p>
          )}
        </div>
        {trailing && <div className="flex items-center gap-1">{trailing}</div>}
      </div>
    </header>
  );
}
