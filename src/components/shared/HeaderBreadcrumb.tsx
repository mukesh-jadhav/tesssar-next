"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Crumb = { label: string; href?: string };

/**
 * Resolves a pathname into editorial breadcrumb segments.
 * Shown only on app surfaces — never on marketing or auth pages.
 */
function resolveCrumbs(pathname: string): Crumb[] | null {
  if (pathname === "/dashboard") return [{ label: "Dashboard" }];
  if (pathname === "/new") return [{ label: "Dashboard", href: "/dashboard" }, { label: "New design" }];
  if (pathname === "/history") return [{ label: "Dashboard", href: "/dashboard" }, { label: "History" }];
  if (pathname.startsWith("/architecture/")) {
    return [{ label: "Dashboard", href: "/dashboard" }, { label: "History", href: "/history" }, { label: "Report" }];
  }
  if (pathname.startsWith("/r/")) {
    return [{ label: "Shared report" }];
  }
  if (pathname === "/pricing") return [{ label: "Credits" }];
  if (pathname === "/sample") return [{ label: "Sample report" }];
  if (pathname.startsWith("/admin")) return [{ label: "Admin" }];
  if (pathname.startsWith("/studio")) return [{ label: "Studio" }];
  return null;
}

export function HeaderBreadcrumb() {
  const pathname = usePathname();
  const crumbs = resolveCrumbs(pathname);
  if (!crumbs || crumbs.length === 0) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className="hidden lg:flex items-center gap-2 text-[12px] font-mono uppercase tracking-[0.18em] text-[hsl(var(--ink-3))] min-w-0"
    >
      <span aria-hidden className="text-[hsl(var(--ink-3))]/60 shrink-0">
        /
      </span>
      {crumbs.map((c, i) => {
        const isLast = i === crumbs.length - 1;
        return (
          <span key={i} className="flex items-center gap-2 min-w-0">
            {c.href && !isLast ? (
              <Link
                href={c.href}
                className="truncate transition-colors hover:text-[hsl(var(--ink))]"
              >
                {c.label}
              </Link>
            ) : (
              <span className={"truncate " + (isLast ? "text-[hsl(var(--ink))]" : "")}>
                {c.label}
              </span>
            )}
            {!isLast && (
              <span aria-hidden className="text-[hsl(var(--ink-3))]/60 shrink-0">
                /
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
