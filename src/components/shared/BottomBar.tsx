"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * Material 3 Expressive — Mobile Bottom Navigation Bar.
 * Floating pill above the bottom edge. Pill indicator under the active dest.
 */

const DESTS = [
  { href: "/dashboard", label: "Home", icon: "home" },
  { href: "/new", label: "Design", icon: "auto_awesome" },
  { href: "/history", label: "Library", icon: "history" },
  { href: "/pricing", label: "Credits", icon: "diamond" },
];

export function BottomBar() {
  const pathname = usePathname();
  return (
    <nav aria-label="Primary" className="m3-bottom-bar lg:hidden">
      {DESTS.map((d) => {
        const active =
          pathname === d.href || (d.href !== "/dashboard" && pathname.startsWith(d.href));
        return (
          <Link
            key={d.href}
            href={d.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "state-layer press flex flex-col items-center gap-0.5 rounded-full px-4 py-2",
              "transition-colors duration-m3-default-effects ease-m3-default-effects",
            )}
          >
            <span
              className={cn(
                "grid h-7 w-12 place-items-center rounded-full text-m3-on-surface-variant",
                "transition-colors duration-m3-default-effects ease-m3-default-effects",
                active && "bg-m3-secondary-container text-m3-on-secondary-container",
              )}
            >
              <span className={cn("ms text-[22px]", active && "ms-filled")} aria-hidden>
                {d.icon}
              </span>
            </span>
            <span
              className={cn(
                "text-[11px] font-medium",
                active ? "text-m3-on-surface" : "text-m3-on-surface-variant",
              )}
            >
              {d.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
