"use client";

import Link from "next/link";
import { Logo } from "@/components/shared/Logo";
import { CommandMenuTrigger } from "@/components/shared/CommandMenu";

/**
 * Mobile top app bar shown only on < lg, since on lg+ the NavigationRail
 * handles primary navigation. Just brand + search trigger.
 */
export function MobileTopBar() {
  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-m3-outline-variant/50 bg-m3-surface/95 px-4 backdrop-blur lg:hidden">
      <Link href="/dashboard" aria-label="Tessar — home">
        <Logo />
      </Link>
      <div className="ml-auto flex items-center gap-2">
        <CommandMenuTrigger className="w-56" />
      </div>
    </header>
  );
}
