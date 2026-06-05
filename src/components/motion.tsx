"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* useInView — IntersectionObserver hook. SSR-safe: defaults to true   */
/* until client JS decides otherwise.                                   */
/* ------------------------------------------------------------------ */
export function useInView<T extends HTMLElement>(
  options: { threshold?: number; rootMargin?: string; once?: boolean } = {},
): [React.RefObject<T>, boolean] {
  const { threshold = 0.12, rootMargin = "0px 0px -6% 0px", once = true } = options;
  const ref = React.useRef<T>(null);
  // Start TRUE so SSR + no-JS users see content. Client decides if it should animate.
  const [inView, setInView] = React.useState(true);

  React.useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Check current viewport — if element is already in view, leave it visible.
    const rect = node.getBoundingClientRect();
    const vh = window.innerHeight;
    const alreadyInView = rect.top < vh * 0.92 && rect.bottom > 0;

    if (alreadyInView) return;

    // Otherwise, hide and then reveal on scroll-into-view.
    setInView(false);
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        if (entry.isIntersecting) {
          setInView(true);
          if (once) io.disconnect();
        } else if (!once) {
          setInView(false);
        }
      },
      { threshold, rootMargin },
    );
    io.observe(node);
    return () => io.disconnect();
  }, [threshold, rootMargin, once]);

  return [ref, inView];
}

/* ------------------------------------------------------------------ */
/* <Reveal /> — fade + rise on enter view                              */
/* ------------------------------------------------------------------ */
export function Reveal({
  children,
  delay = 0,
  as: As = "div",
  className,
  ...rest
}: {
  children: React.ReactNode;
  delay?: number;
  as?: React.ElementType;
  className?: string;
} & React.HTMLAttributes<HTMLElement>) {
  const [ref, inView] = useInView<HTMLDivElement>();
  return (
    <As
      ref={ref}
      data-reveal={inView ? "true" : "false"}
      style={{ transitionDelay: `${delay}ms` }}
      className={className}
      {...rest}
    >
      {children}
    </As>
  );
}

/* ------------------------------------------------------------------ */
/* <Stagger /> — staggered children reveal                             */
/* ------------------------------------------------------------------ */
export function Stagger({
  children,
  step = 80,
  initialDelay = 0,
  className,
}: {
  children: React.ReactNode;
  step?: number;
  initialDelay?: number;
  className?: string;
}) {
  const [ref, inView] = useInView<HTMLDivElement>();
  const items = React.Children.toArray(children);
  return (
    <div ref={ref} className={className}>
      {items.map((child, i) => (
        <div
          key={i}
          data-reveal={inView ? "true" : "false"}
          style={{ transitionDelay: `${initialDelay + i * step}ms` }}
        >
          {child}
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* <AnimatedCounter /> — eased number tween via RAF                    */
/* ------------------------------------------------------------------ */
export function AnimatedCounter({
  value,
  duration = 900,
  formatter = (n: number) => n.toLocaleString("en-IN"),
  prefix = "",
  suffix = "",
  className,
}: {
  value: number;
  duration?: number;
  formatter?: (n: number) => string;
  prefix?: string;
  suffix?: string;
  className?: string;
}) {
  const [ref, inView] = useInView<HTMLSpanElement>();
  const [display, setDisplay] = React.useState(value);
  const prevValueRef = React.useRef(value);
  const hasRunRef = React.useRef(false);

  React.useEffect(() => {
    if (!inView) return;
    const from = hasRunRef.current ? prevValueRef.current : 0;
    const to = value;
    if (from === to) {
      setDisplay(to);
      return;
    }
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      // easeOutExpo
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
      setDisplay(from + (to - from) * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
      else {
        prevValueRef.current = to;
        hasRunRef.current = true;
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value, duration]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {formatter(Math.round(display))}
      {suffix}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* <MagneticButton /> — subtle cursor-follow on pointer hover          */
/* ------------------------------------------------------------------ */
export function MagneticWrapper({
  children,
  strength = 0.25,
  className,
}: {
  children: React.ReactNode;
  strength?: number;
  className?: string;
}) {
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(hover: none), (pointer: coarse)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left - rect.width / 2) * strength;
      const y = (e.clientY - rect.top - rect.height / 2) * strength;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      });
    };
    const onLeave = () => {
      cancelAnimationFrame(raf);
      el.style.transform = "translate3d(0,0,0)";
    };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(raf);
    };
  }, [strength]);

  return (
    <div
      ref={ref}
      className={cn(
        "inline-block will-change-transform transition-transform duration-300 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* <Marquee /> — infinite horizontal scroller                          */
/* ------------------------------------------------------------------ */
export function Marquee({
  children,
  speed = 32,
  className,
  pauseOnHover = true,
}: {
  children: React.ReactNode;
  speed?: number; // seconds for one loop
  pauseOnHover?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "group relative flex w-full overflow-hidden",
        "[mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]",
        className,
      )}
    >
      <div
        className={cn(
          "flex shrink-0 items-center gap-12 pr-12 animate-marquee",
          pauseOnHover && "group-hover:[animation-play-state:paused]",
        )}
        style={{ animationDuration: `${speed}s` }}
      >
        {children}
      </div>
      <div
        aria-hidden
        className={cn(
          "flex shrink-0 items-center gap-12 pr-12 animate-marquee",
          pauseOnHover && "group-hover:[animation-play-state:paused]",
        )}
        style={{ animationDuration: `${speed}s` }}
      >
        {children}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* <TextReveal /> — char-by-char headline reveal                       */
/* ------------------------------------------------------------------ */
export function TextReveal({
  text,
  className,
  delay = 0,
  step = 18,
  as: As = "span",
}: {
  text: string;
  className?: string;
  delay?: number;
  step?: number;
  as?: React.ElementType;
}) {
  const words = text.split(" ");
  return (
    <As className={cn("inline-block", className)}>
      {words.map((word, i) => (
        <span
          key={i}
          className="inline-block overflow-hidden align-bottom pr-[0.22em] last:pr-0"
        >
          <span
            className="inline-block animate-reveal-up"
            style={{
              animationDelay: `${delay + i * step}ms`,
              animationFillMode: "both",
            }}
          >
            {word}
          </span>
        </span>
      ))}
    </As>
  );
}
