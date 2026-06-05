"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const DESTS = [
  { href: "/dashboard", icon: "home",        match: (p: string) => p === "/dashboard" },
  { href: "/new",       icon: "edit_note" },
  { href: "/history",   icon: "auto_stories" },
  { href: "/pricing",   icon: "savings" },
];

export function BottomBar() {
  const pathname = usePathname();
  return (
    <nav className="m3-bottom-bar lg:hidden">
      {DESTS.map((d) => {
        const active = d.match ? d.match(pathname) : pathname.startsWith(d.href);
        return (
          <Link
            key={d.href}
            href={d.href}
            className={cn(
              "grid size-11 place-items-center rounded-full transition-colors",
              active
                ? "bg-[hsl(var(--ink))] text-[hsl(var(--paper))]"
                : "text-[hsl(var(--ink-2))] hover:bg-[hsl(var(--paper-2))]",
            )}
          >
            <span className={cn("ms text-[22px]", active && "ms-filled")} aria-hidden>{d.icon}</span>
          </Link>
        );
      })}
    </nav>
  );
}
