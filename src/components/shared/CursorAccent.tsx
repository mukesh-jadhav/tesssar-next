"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * Soft spotlight that follows the cursor 1:1 on landing surfaces (`/`,
 * `/sample`). A radial vermillion-tinted glow ~320px across, blended
 * against the paper. Tracks the pointer with no lag (was previously a
 * trailing 12px ring whose visible lerp read as "the UI feels slow").
 *
 * Disabled for touch-only devices, narrow viewports, and users with
 * `prefers-reduced-motion: reduce`.
 */
export function CursorAccent() {
  const pathname = usePathname();
  const spotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (pathname !== "/" && pathname !== "/sample") return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const narrow = window.matchMedia("(max-width: 768px)").matches;
    if (reduce || coarse || narrow) return;

    const el = spotRef.current;
    if (!el) return;

    let raf = 0;
    let mx = -9999;
    let my = -9999;
    let visible = false;

    const onMove = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
      if (!visible) {
        visible = true;
        el.style.opacity = "1";
      }
    };
    const onLeave = () => {
      visible = false;
      el.style.opacity = "0";
    };

    // Position via rAF so we coalesce mousemove into one paint per frame
    // without introducing perceptible lag.
    const tick = () => {
      el.style.transform = `translate3d(${mx - 200}px, ${my - 200}px, 0)`;
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("mouseleave", onLeave);
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
      el.style.opacity = "0";
    };
  }, [pathname]);

  if (pathname !== "/" && pathname !== "/sample") return null;

  return (
    <div
      ref={spotRef}
      aria-hidden
      className="pointer-events-none fixed top-0 left-0 z-[60] size-[400px] rounded-full mix-blend-multiply dark:mix-blend-screen"
      style={{
        opacity: 0,
        transition: "opacity 320ms ease-out",
        willChange: "transform",
        background:
          "radial-gradient(circle at center, hsl(var(--accent) / 0.11) 0%, hsl(var(--accent) / 0.05) 28%, transparent 68%)",
      }}
    />
  );
}
