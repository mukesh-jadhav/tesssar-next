"use client";

import * as React from "react";
import Link from "next/link";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type Dest = { href: string; label: string; icon: string };

const PRIMARY: Dest[] = [
  { href: "/dashboard", label: "Dashboard", icon: "home" },
  { href: "/new", label: "New design", icon: "edit_note" },
  { href: "/history", label: "History", icon: "auto_stories" },
  { href: "/pricing", label: "Pricing & credits", icon: "savings" },
];

const SECONDARY: Dest[] = [
  { href: "/sample", label: "View sample", icon: "visibility" },
];

export function MobileNavMenu({ signedIn }: { signedIn: boolean }) {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();

  React.useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger asChild>
        <button
          type="button"
          aria-label="Open menu"
          className="md:hidden grid place-items-center size-9 rounded-full hover:bg-[hsl(var(--paper-2))] transition-colors"
        >
          <span className="ms text-[22px] text-[hsl(var(--ink))]" aria-hidden>menu</span>
        </button>
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-50 bg-[hsl(var(--ink))]/30 backdrop-blur-sm",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 duration-200",
          )}
        />
        <DialogPrimitive.Content
          className={cn(
            "fixed right-0 top-0 bottom-0 z-50 w-[88vw] max-w-[340px]",
            "bg-[hsl(var(--paper))] border-l border-[hsl(var(--line))] shadow-2xl",
            "flex flex-col",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:slide-out-to-right-[100%] data-[state=open]:slide-in-from-right-[100%]",
            "duration-300 ease-out",
          )}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-[hsl(var(--line))]">
            <DialogPrimitive.Title className="display text-[18px] tracking-[-0.02em]">
              Menu
            </DialogPrimitive.Title>
            <DialogPrimitive.Close
              aria-label="Close"
              className="grid place-items-center size-8 rounded-full hover:bg-[hsl(var(--paper-2))]"
            >
              <span className="ms text-[20px] text-[hsl(var(--ink))]" aria-hidden>close</span>
            </DialogPrimitive.Close>
          </div>
          <DialogPrimitive.Description className="sr-only">
            Navigate Tessar
          </DialogPrimitive.Description>

          <nav className="flex-1 overflow-y-auto px-3 py-4">
            {signedIn && (
              <>
                <p className="px-3 mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[hsl(var(--ink-3))]">
                  Workspace
                </p>
                <ul className="mb-6">
                  {PRIMARY.map((d) => {
                    const active = pathname === d.href || (d.href !== "/" && pathname.startsWith(d.href));
                    return (
                      <li key={d.href}>
                        <Link
                          href={d.href}
                          className={cn(
                            "flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] transition-colors",
                            active
                              ? "bg-[hsl(var(--ink))] text-[hsl(var(--paper))]"
                              : "text-[hsl(var(--ink))] hover:bg-[hsl(var(--paper-2))]",
                          )}
                        >
                          <span className={cn("ms text-[20px]", active && "ms-filled")} aria-hidden>
                            {d.icon}
                          </span>
                          {d.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}

            <p className="px-3 mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[hsl(var(--ink-3))]">
              Explore
            </p>
            <ul className="mb-6">
              {SECONDARY.map((d) => (
                <li key={d.href}>
                  <Link
                    href={d.href}
                    className="flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] text-[hsl(var(--ink-2))] hover:bg-[hsl(var(--paper-2))] hover:text-[hsl(var(--ink))] transition-colors"
                  >
                    <span className="ms text-[20px]" aria-hidden>{d.icon}</span>
                    {d.label}
                  </Link>
                </li>
              ))}
              {!signedIn && (
                <li>
                  <Link
                    href="/pricing"
                    className="flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] text-[hsl(var(--ink-2))] hover:bg-[hsl(var(--paper-2))] hover:text-[hsl(var(--ink))] transition-colors"
                  >
                    <span className="ms text-[20px]" aria-hidden>savings</span>
                    Pricing
                  </Link>
                </li>
              )}
            </ul>

            {!signedIn ? (
              <Link
                href="/login"
                className="btn-pill btn-pill-accent btn-pill-lg w-full justify-center mt-2"
              >
                Sign in
                <span className="ms text-[18px]" aria-hidden>arrow_forward</span>
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => {
                  window.dispatchEvent(new CustomEvent("tessar:help"));
                  setOpen(false);
                }}
                className="flex items-center gap-3 rounded-xl px-3 py-3 text-[14px] text-[hsl(var(--ink-2))] hover:bg-[hsl(var(--paper-2))] hover:text-[hsl(var(--ink))] transition-colors w-full"
              >
                <span className="ms text-[20px]" aria-hidden>keyboard</span>
                Keyboard shortcuts
              </button>
            )}
          </nav>

          <div className="border-t border-[hsl(var(--line))] px-5 py-3 text-[11px] text-[hsl(var(--ink-3))] font-mono uppercase tracking-[0.18em]">
            tessar.dev
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
