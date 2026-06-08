"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";

type Row = { keys: string[]; label: string };
type Section = { title: string; rows: Row[] };

const SECTIONS: Section[] = [
  {
    title: "Navigate",
    rows: [
      { keys: ["G", "D"], label: "Dashboard" },
      { keys: ["G", "N"], label: "New design" },
      { keys: ["G", "H"], label: "History" },
      { keys: ["G", "P"], label: "Pricing & credits" },
      { keys: ["G", "S"], label: "Sample report" },
    ],
  },
  {
    title: "Search & help",
    rows: [
      { keys: ["⌘", "K"], label: "Open command palette" },
      { keys: ["Ctrl", "K"], label: "Open command palette (Windows / Linux)" },
      { keys: ["?"], label: "Show this cheat-sheet" },
      { keys: ["Esc"], label: "Close dialogs and overlays" },
    ],
  },
  {
    title: "Inside a report",
    rows: [
      { keys: ["←", "→"], label: "Move between chapters (when focus is on the tab strip)" },
      { keys: ["Tab"], label: "Cycle interactive elements" },
    ],
  },
];

export function HelpOverlay() {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const onHelp = () => setOpen((v) => !v);
    window.addEventListener("tessar:help", onHelp);
    return () => window.removeEventListener("tessar:help", onHelp);
  }, []);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-50 bg-[hsl(var(--ink))]/30 backdrop-blur-sm",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          )}
        />
        <DialogPrimitive.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 w-[min(640px,92vw)] -translate-x-1/2 -translate-y-1/2",
            "overflow-hidden rounded-2xl border border-[hsl(var(--line))] bg-[hsl(var(--paper))] shadow-2xl",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            "duration-200",
          )}
        >
          <div className="flex items-baseline justify-between border-b border-[hsl(var(--line))] px-6 py-4">
            <div className="flex items-baseline gap-3">
              <DialogPrimitive.Title className="display text-[20px] tracking-[-0.02em]">
                Keyboard shortcuts
              </DialogPrimitive.Title>
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[hsl(var(--ink-3))]">
                Press ? anytime
              </span>
            </div>
            <DialogPrimitive.Close
              className="ms text-[20px] text-[hsl(var(--ink-3))] hover:text-[hsl(var(--ink))] transition-colors"
              aria-label="Close"
            >
              close
            </DialogPrimitive.Close>
          </div>
          <DialogPrimitive.Description className="sr-only">
            All keyboard shortcuts available across Tessar.
          </DialogPrimitive.Description>

          <div className="max-h-[70vh] overflow-y-auto px-6 py-5">
            {SECTIONS.map((sec) => (
              <section key={sec.title} className="mb-7 last:mb-0">
                <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-[hsl(var(--ink-3))] mb-3">
                  {sec.title}
                </h3>
                <ul className="divide-y divide-[hsl(var(--line))] border-y border-[hsl(var(--line))]">
                  {sec.rows.map((row, i) => (
                    <li
                      key={i}
                      className="flex items-center justify-between gap-4 py-2.5"
                    >
                      <span className="text-[14px] text-[hsl(var(--ink))]">
                        {row.label}
                      </span>
                      <span className="flex items-center gap-1">
                        {row.keys.map((k, j) => (
                          <React.Fragment key={j}>
                            {j > 0 && (
                              <span className="text-[11px] text-[hsl(var(--ink-3))] mx-0.5">
                                then
                              </span>
                            )}
                            <kbd className="inline-grid min-w-[26px] place-items-center rounded border border-[hsl(var(--line))] bg-[hsl(var(--paper-2))] px-1.5 py-0.5 font-mono text-[11px] text-[hsl(var(--ink))] shadow-[0_1px_0_hsl(var(--line))]">
                              {k}
                            </kbd>
                          </React.Fragment>
                        ))}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>

          <div className="border-t border-[hsl(var(--line))] bg-[hsl(var(--paper-2))]/60 px-6 py-3 text-[11px] text-[hsl(var(--ink-3))]">
            Tessar · Editorial keyboard surface
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
