"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useCockpit, type LensId } from "./state";

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

interface LensEntry {
  id: LensId;
  label: string;
  icon: string;
  /** Single-key shortcut (1-9). */
  shortcut: string;
}

/**
 * Display order matches the keyboard shortcuts (1-9). Verdict comes
 * first because that's the answer the user is here for; the rest is
 * evidence.
 */
export const LENS_CATALOG: readonly LensEntry[] = [
  { id: "verdict",      label: "Verdict",      icon: "stars",          shortcut: "1" },
  { id: "architecture", label: "Architecture", icon: "schema",         shortcut: "2" },
  { id: "performance",  label: "Performance",  icon: "speed",          shortcut: "3" },
  { id: "scale",        label: "Scale",        icon: "stacked_line_chart", shortcut: "4" },
  { id: "cost",         label: "Cost",         icon: "payments",       shortcut: "5" },
  { id: "reliability",  label: "Reliability",  icon: "verified",       shortcut: "6" },
  { id: "security",     label: "Security",     icon: "encrypted",      shortcut: "7" },
  { id: "ops",          label: "Ops burden",   icon: "build",          shortcut: "8" },
  { id: "lockin",       label: "Lock-in",      icon: "lock",           shortcut: "9" },
] as const;

export function LensRail() {
  const { currentLens, setCurrentLens } = useCockpit();

  // Keyboard: 1-9 jump between lenses, ←/→ cycle. Skip when focus is in
  // a typeable element so the user can still type into refine fields /
  // drawers, and skip when a modifier is held so it doesn't fight with
  // browser back/forward.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName;
        if (
          tag === "INPUT" ||
          tag === "TEXTAREA" ||
          tag === "SELECT" ||
          target.isContentEditable
        ) {
          return;
        }
      }
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        const idx = LENS_CATALOG.findIndex((l) => l.id === currentLens);
        if (idx < 0) return;
        const delta = e.key === "ArrowRight" ? 1 : -1;
        const next = (idx + delta + LENS_CATALOG.length) % LENS_CATALOG.length;
        e.preventDefault();
        setCurrentLens(LENS_CATALOG[next].id);
        return;
      }
      const lens = LENS_CATALOG.find((l) => l.shortcut === e.key);
      if (!lens) return;
      e.preventDefault();
      setCurrentLens(lens.id);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [currentLens, setCurrentLens]);

  return (
    <nav
      aria-label="Comparison lenses"
      className="flex md:flex-col gap-1 md:gap-0.5 overflow-x-auto md:overflow-visible py-1 md:py-3 px-2 md:px-3 border-b md:border-b-0 md:border-r border-[hsl(var(--line))] bg-[hsl(var(--paper-2))]/40 backdrop-blur-sm scrollbar-thin"
    >
      {LENS_CATALOG.map((l) => {
        const active = l.id === currentLens;
        return (
          <button
            key={l.id}
            type="button"
            onClick={() => setCurrentLens(l.id)}
            aria-pressed={active}
            aria-label={`${l.label} (press ${l.shortcut})`}
            className={cn(
              "group relative shrink-0 flex items-center gap-2 md:gap-2.5 rounded-xl px-3 py-2 text-[13px] transition-colors",
              active
                ? "text-[hsl(var(--ink))]"
                : "text-[hsl(var(--ink-3))] hover:text-[hsl(var(--ink))] hover:bg-[hsl(var(--paper-2))]",
            )}
          >
            {active && (
              <motion.span
                layoutId="lens-active"
                className="absolute inset-0 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--line))] shadow-[0_1px_0_hsl(var(--line))]"
                transition={{ duration: 0.32, ease: EASE_OUT_EXPO }}
              />
            )}
            <span
              className={cn(
                "ms text-[18px] relative z-10 transition-colors",
                active && "text-[hsl(var(--accent))]",
              )}
              aria-hidden
            >
              {l.icon}
            </span>
            <span className="relative z-10 font-medium whitespace-nowrap">
              {l.label}
            </span>
            <span
              className={cn(
                "hidden md:inline-flex relative z-10 ml-auto font-mono text-[10px] rounded border px-1.5 py-0.5",
                active
                  ? "border-[hsl(var(--line))] text-[hsl(var(--ink-3))]"
                  : "border-transparent text-[hsl(var(--ink-3))]/60 group-hover:border-[hsl(var(--line))] group-hover:text-[hsl(var(--ink-3))]",
              )}
              aria-hidden
            >
              {l.shortcut}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
