"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Scroll-triggered reveal — fades + rises in when intersection observed.
 * Wraps children and applies `.m3-rise` on view.
 */
export function Rise({
  children,
  delay = 0,
  className,
  as: As = "div",
  threshold = 0.15,
  once = true,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  as?: React.ElementType;
  threshold?: number;
  once?: boolean;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            el.classList.add("m3-rise");
            if (once) observer.unobserve(el);
          } else if (!once) {
            el.classList.remove("m3-rise");
          }
        }
      },
      { threshold, rootMargin: "0px 0px -10% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, once]);

  return (
    <As
      ref={ref as React.RefObject<HTMLDivElement>}
      style={{ animationDelay: `${delay}ms`, opacity: 0 }}
      className={cn(className)}
    >
      {children}
    </As>
  );
}
