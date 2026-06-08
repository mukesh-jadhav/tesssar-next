/**
 * Theme constants and pure helpers. No React.
 *
 * Theme model:
 *   - `light`  — force light tokens.
 *   - `dark`   — force dark tokens.
 *   - `system` — follow `prefers-color-scheme` and react to changes.
 *
 * The "effective" theme is what's actually applied: `light` or `dark`.
 * It is reflected to the DOM in two ways so both layers pick it up:
 *   1. `data-theme="dark"` on `<html>` — drives the CSS variable shelf
 *      defined in `globals.css` (`[data-theme="dark"]` block).
 *   2. `class="dark"` on `<html>` — drives Tailwind's `dark:` variant
 *      (tailwind.config.ts uses `darkMode: ["class"]`).
 *
 * Both flips are applied atomically by the pre-paint script (no FOUC).
 */

export type Theme = "light" | "dark" | "system";
export type EffectiveTheme = "light" | "dark";

export const THEME_STORAGE_KEY = "tessar-theme";
export const DEFAULT_THEME: Theme = "system";

const isTheme = (v: unknown): v is Theme =>
  v === "light" || v === "dark" || v === "system";

export function readStoredTheme(): Theme {
  if (typeof window === "undefined") return DEFAULT_THEME;
  try {
    const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isTheme(raw) ? raw : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

export function writeStoredTheme(theme: Theme): void {
  if (typeof window === "undefined") return;
  try {
    if (theme === DEFAULT_THEME) window.localStorage.removeItem(THEME_STORAGE_KEY);
    else window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    /* private mode etc. — ignore */
  }
}

export function getSystemTheme(): EffectiveTheme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function resolveEffective(theme: Theme): EffectiveTheme {
  return theme === "system" ? getSystemTheme() : theme;
}

export function applyEffective(effective: EffectiveTheme): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (effective === "dark") {
    root.setAttribute("data-theme", "dark");
    root.classList.add("dark");
  } else {
    root.removeAttribute("data-theme");
    root.classList.remove("dark");
  }
}
