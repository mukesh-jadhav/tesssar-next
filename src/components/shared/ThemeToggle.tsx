"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  type Theme,
  applyEffective,
  readStoredTheme,
  resolveEffective,
  writeStoredTheme,
} from "@/lib/theme";

/**
 * Three-state theme toggle for the footer utility row.
 *
 * States: light · system · dark. The `system` middle state follows
 * `prefers-color-scheme` and reacts to OS-level changes in real time.
 * Persists the user's explicit choice in localStorage via `tessar-theme`.
 *
 * The pre-paint `ThemeScript` runs before hydration, so this component
 * starts mounted with the correct effective theme already applied. The
 * `mounted` guard prevents a 1-frame flicker on the toggle's own UI when
 * the stored state differs from the SSR-rendered default.
 */
const OPTIONS: Array<{ value: Theme; icon: string; label: string }> = [
  { value: "light", icon: "light_mode", label: "Light theme" },
  { value: "system", icon: "desktop_windows", label: "Follow system theme" },
  { value: "dark", icon: "dark_mode", label: "Dark theme" },
];

export function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = React.useState<Theme>("system");
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setTheme(readStoredTheme());
    setMounted(true);
  }, []);

  // When in `system` mode, follow OS-level changes live.
  React.useEffect(() => {
    if (!mounted || theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyEffective(resolveEffective("system"));
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [mounted, theme]);

  const pick = React.useCallback((next: Theme) => {
    setTheme(next);
    writeStoredTheme(next);
    applyEffective(resolveEffective(next));
  }, []);

  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className={cn(
        "inline-flex items-center gap-0.5 border border-[hsl(var(--line))] bg-[hsl(var(--paper-2))] p-0.5",
        className,
      )}
    >
      {OPTIONS.map((opt) => {
        const selected = mounted && theme === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={opt.label}
            title={opt.label}
            onClick={() => pick(opt.value)}
            className={cn(
              "grid size-7 place-items-center transition-colors duration-fast ease-out-quart",
              selected
                ? "bg-[hsl(var(--ink))] text-[hsl(var(--paper))]"
                : "text-[hsl(var(--ink-3))] hover:text-[hsl(var(--ink))]",
            )}
          >
            <span aria-hidden className="ms text-[15px]">{opt.icon}</span>
          </button>
        );
      })}
    </div>
  );
}
