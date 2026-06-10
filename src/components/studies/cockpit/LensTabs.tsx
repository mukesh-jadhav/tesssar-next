"use client";

/**
 * LensTabs / LensRail — vertical lens picker rail rendered on the left
 * side of the cockpit body. Phase 4 moved this from a horizontal strip
 * to a vertical rail so the dashboard + lens content can use the full
 * horizontal width on the right.
 *
 * Keyboard model unchanged:
 *   - 1-9 jump to a lens
 *   - ↑/↓ cycle (←/→ kept as aliases)
 *   - skips when focus is in a typeable element
 */

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
 * Display order matches the keyboard shortcuts (1-9). Dashboard is
 * first because that's the cockpit's headline view; the lenses below
 * are drill-down evidence.
 */
export const LENS_CATALOG: readonly LensEntry[] = [
  { id: "dashboard",    label: "Dashboard",    icon: "dashboard",      shortcut: "1" },
  { id: "verdict",      label: "Verdict",      icon: "stars",          shortcut: "2" },
  { id: "performance",  label: "Performance",  icon: "speed",          shortcut: "3" },
  { id: "scale",        label: "Scale",        icon: "stacked_line_chart", shortcut: "4" },
  { id: "cost",         label: "Cost",         icon: "payments",       shortcut: "5" },
  { id: "reliability",  label: "Reliability",  icon: "verified",       shortcut: "6" },
  { id: "security",     label: "Security",     icon: "encrypted",      shortcut: "7" },
  { id: "ops",          label: "Ops burden",   icon: "build",          shortcut: "8" },
  { id: "lockin",       label: "Lock-in",      icon: "lock",           shortcut: "9" },
] as const;

export function LensTabs() {
  const { currentLens, setCurrentLens } = useCockpit();

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
      if (
        e.key === "ArrowDown" ||
        e.key === "ArrowUp" ||
        e.key === "ArrowLeft" ||
        e.key === "ArrowRight"
      ) {
        const idx = LENS_CATALOG.findIndex((l) => l.id === currentLens);
        if (idx < 0) return;
        const delta = e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : -1;
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
      role="tablist"
      aria-orientation="vertical"
      className="shrink-0 w-[220px] border-r border-[hsl(var(--line))] bg-[hsl(var(--paper-2))]/40 backdrop-blur-sm overflow-y-auto scrollbar-thin"
    >
      <div className="flex flex-col gap-0.5 p-2">
        {LENS_CATALOG.map((l) => {
          const active = l.id === currentLens;
          return (
            <button
              key={l.id}
              type="button"
              role="tab"
              aria-selected={active}
              aria-label={`${l.label} (press ${l.shortcut})`}
              onClick={() => setCurrentLens(l.id)}
              className={cn(
                "group relative flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] text-left transition-colors",
                active
                  ? "text-[hsl(var(--ink))]"
                  : "text-[hsl(var(--ink-3))] hover:text-[hsl(var(--ink))] hover:bg-[hsl(var(--card))]",
              )}
            >
              {active && (
                <motion.span
                  layoutId="lens-rail-active"
                  className="absolute inset-0 rounded-md bg-[hsl(var(--card))] ring-1 ring-[hsl(var(--line))]"
                  transition={{ duration: 0.28, ease: EASE_OUT_EXPO }}
                />
              )}
              <span
                className={cn(
                  "relative z-10 ms text-[18px] shrink-0 transition-colors",
                  active && "text-[hsl(var(--ink))]",
                )}
                aria-hidden
              >
                {l.icon}
              </span>
              <span className="relative z-10 flex-1 font-medium truncate">
                {l.label}
              </span>
              <span
                className={cn(
                  "relative z-10 font-mono text-[9px] uppercase tracking-wider rounded border px-1 py-0",
                  active
                    ? "border-[hsl(var(--line))] text-[hsl(var(--ink-3))]"
                    : "border-transparent text-[hsl(var(--ink-3))]/50 group-hover:border-[hsl(var(--line))]",
                )}
                aria-hidden
              >
                {l.shortcut}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
