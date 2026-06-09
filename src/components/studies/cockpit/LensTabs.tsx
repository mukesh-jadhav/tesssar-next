"use client";

/**
 * LensTabs — horizontal lens picker. Replaces the old `LensRail`
 * (vertical 200px column) so the lens stage gets more horizontal room
 * and the new `CockpitTopPlane` becomes the headline surface.
 *
 * Keeps the same keyboard model:
 *   - 1-9 jump to a lens
 *   - ←/→ cycle
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
      role="tablist"
      className="border-b border-[hsl(var(--line))] bg-[hsl(var(--paper-2))]/40 backdrop-blur-sm"
    >
      <div className="mx-auto w-full max-w-[1400px] px-2 md:px-4 flex items-stretch gap-0.5 overflow-x-auto scrollbar-thin">
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
                "group relative shrink-0 flex items-center gap-2 px-3 md:px-4 py-2.5 text-[13px] transition-colors",
                active
                  ? "text-[hsl(var(--ink))]"
                  : "text-[hsl(var(--ink-3))] hover:text-[hsl(var(--ink))]",
              )}
            >
              <span
                className={cn(
                  "ms text-[16px] transition-colors",
                  active && "text-[hsl(var(--accent-ink))]",
                )}
                aria-hidden
              >
                {l.icon}
              </span>
              <span className="font-medium whitespace-nowrap">{l.label}</span>
              <span
                className={cn(
                  "hidden md:inline-flex font-mono text-[9px] uppercase tracking-wider rounded border px-1 py-0",
                  active
                    ? "border-[hsl(var(--line))] text-[hsl(var(--ink-3))]"
                    : "border-transparent text-[hsl(var(--ink-3))]/50 group-hover:border-[hsl(var(--line))]",
                )}
                aria-hidden
              >
                {l.shortcut}
              </span>
              {active && (
                <motion.span
                  layoutId="lens-tab-active"
                  className="absolute inset-x-1 -bottom-px h-[2px] rounded-full bg-[hsl(var(--accent))]"
                  transition={{ duration: 0.28, ease: EASE_OUT_EXPO }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
