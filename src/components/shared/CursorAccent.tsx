"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * Decorative cursor accent — a 12px vermillion ring that trails the cursor
 * with ~80ms lag using rAF lerp. Mounted only on landing surfaces (`/`,
 * `/sample`). Disabled for touch-only devices, narrow viewports, and users
 * who have `prefers-reduced-motion: reduce`.
 */
export function CursorAccent() {
  const pathname = usePathname();
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (pathname !== "/" && pathname !== "/sample") return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const narrow = window.matchMedia("(max-width: 768px)").matches;
    if (reduce || coarse || narrow) return;

    const ring = ringRef.current;
    if (!ring) return;

    let mx = window.innerWidth / 2;
    let my = window.innerHeight / 2;
    let rx = mx;
    let ry = my;
    let raf = 0;
    let visible = false;

    const onMove = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
      if (!visible) {
        visible = true;
        ring.style.opacity = "0.7";
      }
    };
    const onLeave = () => {
      visible = false;
      ring.style.opacity = "0";
    };

    const tick = () => {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      ring.style.transform = `translate3d(${rx - 6}px, ${ry - 6}px, 0)`;
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("mouseleave", onLeave);
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
      ring.style.opacity = "0";
    };
  }, [pathname]);

  if (pathname !== "/" && pathname !== "/sample") return null;

  return (
    <div
      ref={ringRef}
      aria-hidden
      className="pointer-events-none fixed top-0 left-0 z-[60] size-3 rounded-full mix-blend-multiply ring-2 ring-[hsl(var(--accent))]"
      style={{ opacity: 0, transition: "opacity 240ms ease-out" }}
    />
  );
}
