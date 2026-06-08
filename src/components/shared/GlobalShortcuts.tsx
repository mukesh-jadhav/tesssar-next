"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/**
 * Global keyboard shortcuts.
 *
 *  - `g d` → /dashboard
 *  - `g n` → /new
 *  - `g h` → /history
 *  - `g p` → /pricing
 *  - `g s` → /sample
 *  - `?`   → opens help overlay (via `tessar:help` window event)
 *
 * Sequence buffer for `g X` resets after 900ms or on any non-letter key.
 * Shortcuts are suppressed while focus is in an editable field
 * (input, textarea, contenteditable) so users can type freely.
 * `cmd/ctrl + k` is handled by `<CommandMenu />` and intentionally left here.
 */
export function GlobalShortcuts() {
  const router = useRouter();
  const pendingG = useRef(false);
  const resetTimer = useRef<number | null>(null);

  useEffect(() => {
    const isEditable = (el: EventTarget | null) => {
      if (!(el instanceof HTMLElement)) return false;
      const tag = el.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
      if (el.isContentEditable) return true;
      return false;
    };

    const clearPending = () => {
      pendingG.current = false;
      if (resetTimer.current !== null) {
        window.clearTimeout(resetTimer.current);
        resetTimer.current = null;
      }
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (isEditable(e.target)) return;

      // `?` (Shift+/) → help overlay
      if (e.key === "?" || (e.key === "/" && e.shiftKey)) {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("tessar:help"));
        clearPending();
        return;
      }

      const k = e.key.toLowerCase();

      if (pendingG.current) {
        const dest =
          k === "d" ? "/dashboard" :
          k === "n" ? "/new" :
          k === "h" ? "/history" :
          k === "p" ? "/pricing" :
          k === "s" ? "/sample" :
          null;
        clearPending();
        if (dest) {
          e.preventDefault();
          router.push(dest);
        }
        return;
      }

      if (k === "g") {
        pendingG.current = true;
        resetTimer.current = window.setTimeout(clearPending, 900);
      }
    };

    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      if (resetTimer.current !== null) window.clearTimeout(resetTimer.current);
    };
  }, [router]);

  return null;
}
