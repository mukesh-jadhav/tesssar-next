import { THEME_STORAGE_KEY } from "@/lib/theme";

/**
 * Pre-paint theme script. Renders an inline `<script>` in `<head>` that
 * applies the effective theme to `<html>` *before* the browser paints,
 * so users never see a flash of light content in dark mode (and vice
 * versa). Mirrors the logic in `src/lib/theme.ts`.
 *
 * Kept tiny and dependency-free on purpose. The script reads
 * localStorage, falls back to `prefers-color-scheme`, and sets both
 * `data-theme="dark"` (CSS variable shelf) and the `dark` class
 * (Tailwind `dark:` variant) atomically.
 */
export function ThemeScript() {
  const code = `(function(){try{var k=${JSON.stringify(THEME_STORAGE_KEY)};var s=localStorage.getItem(k);var t=(s==="light"||s==="dark")?s:"system";var e=t==="system"?(window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"):t;var r=document.documentElement;if(e==="dark"){r.setAttribute("data-theme","dark");r.classList.add("dark");}else{r.removeAttribute("data-theme");r.classList.remove("dark");}}catch(_){}})();`;
  // eslint-disable-next-line react/no-danger
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
