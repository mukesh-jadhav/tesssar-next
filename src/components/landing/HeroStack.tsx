"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * M3 Expressive — Hero shape stack.
 * Multiple tiles with distinct M3 shapes, varying surface tones, ambient
 * animation, and mouse parallax. Demonstrates the "variety of shapes" tactic
 * from M3 Expressive guidelines.
 */
export function HeroStack() {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const ref = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width - 0.5) * 2;
      const y = ((e.clientY - r.top) / r.height - 0.5) * 2;
      setTilt({ x, y });
    };
    const onLeave = () => setTilt({ x: 0, y: 0 });
    const el = ref.current;
    el?.addEventListener("mousemove", onMove);
    el?.addEventListener("mouseleave", onLeave);
    return () => {
      el?.removeEventListener("mousemove", onMove);
      el?.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  useEffect(() => {
    const i = setInterval(() => setPhase((p) => (p + 1) % 6), 2400);
    return () => clearInterval(i);
  }, []);

  const phases = [
    "Analyzing brief",
    "Selecting components",
    "Drafting diagrams",
    "Computing scale",
    "Estimating cost",
    "Hardening security",
  ];

  return (
    <div
      ref={ref}
      className="relative aspect-[5/4] w-full"
      style={{
        perspective: "1200px",
      }}
    >
      {/* Mesh backdrop */}
      <div
        aria-hidden
        className="absolute inset-0 m3-mesh rounded-[48px] opacity-90"
        style={{
          transform: `translate3d(${tilt.x * -10}px, ${tilt.y * -10}px, 0)`,
        }}
      />

      {/* Floating shapes */}
      <div
        aria-hidden
        className="absolute -left-8 top-6 size-24 rounded-[42%_58%_67%_33%/41%_44%_56%_59%] bg-m3-tertiary opacity-90 shadow-m3-3 m3-shape-a"
        style={{ transform: `translate3d(${tilt.x * 24}px, ${tilt.y * 24}px, 0)` }}
      />
      <div
        aria-hidden
        className="absolute -right-6 top-1/3 size-28 rounded-full bg-m3-primary opacity-95 shadow-m3-4 m3-shape-b"
        style={{ transform: `translate3d(${tilt.x * -32}px, ${tilt.y * -32}px, 0)` }}
      />
      <div
        aria-hidden
        className="absolute bottom-8 left-1/3 size-20 rounded-[28px] rotate-12 bg-m3-secondary-container shadow-m3-2"
        style={{ transform: `rotate(${12 + tilt.x * 6}deg) translate3d(${tilt.x * 16}px, ${tilt.y * 12}px, 0)` }}
      />

      {/* Hero "report" card — the centerpiece */}
      <div
        className="m3-hero-tile absolute inset-x-6 top-6 bottom-10 overflow-hidden rounded-[36px] bg-m3-surface-container-lowest shadow-m3-4"
        style={{
          transform: `translate3d(${tilt.x * 14}px, ${tilt.y * 8}px, 0) rotateX(${tilt.y * -3}deg) rotateY(${tilt.x * 3}deg)`,
        }}
      >
        {/* Window chrome */}
        <div className="flex items-center gap-2 border-b border-m3-outline-variant/40 px-5 py-3.5">
          <div className="flex gap-1.5">
            <span className="size-2.5 rounded-full bg-m3-error/70" />
            <span className="size-2.5 rounded-full bg-m3-tertiary/70" />
            <span className="size-2.5 rounded-full bg-emerald-400/80" />
          </div>
          <div className="ml-3 flex-1 truncate rounded-full bg-m3-surface-container px-3 py-1 text-[11px] font-mono text-m3-on-surface-variant">
            tessar.app · /architecture/realtime-canvas
          </div>
        </div>

        <div className="p-6">
          {/* Title */}
          <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-m3-on-surface-variant">
            B2B SaaS · Realtime · India
          </div>
          <h3 className="display mt-2 text-[26px] leading-tight">
            Realtime canvas <span className="hero-gradient">for design teams</span>
          </h3>

          {/* Mini node diagram */}
          <div className="mt-5 rounded-2xl bg-m3-surface-container-low p-4">
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { l: "CDN", t: "primary" },
                { l: "Edge", t: "tertiary" },
                { l: "Gateway", t: "secondary" },
                { l: "Auth", t: "tertiary" },
                { l: "Realtime", t: "primary" },
                { l: "Vector DB", t: "secondary" },
                { l: "Postgres", t: "tertiary" },
                { l: "Pub/Sub", t: "secondary" },
                { l: "Storage", t: "primary" },
              ].map((n, i) => (
                <div
                  key={i}
                  className={cn(
                    "rounded-xl px-2.5 py-2 text-center text-[11px] font-medium",
                    n.t === "primary" && "bg-m3-primary-container text-m3-on-primary-container",
                    n.t === "tertiary" && "bg-m3-tertiary-container text-m3-on-tertiary-container",
                    n.t === "secondary" && "bg-m3-secondary-container text-m3-on-secondary-container",
                  )}
                  style={{
                    animation: `m3-page-enter 700ms ${i * 60 + 200}ms var(--md-sys-motion-easing-expressive-default-spatial) both`,
                  }}
                >
                  {n.l}
                </div>
              ))}
            </div>
          </div>

          {/* Phase ticker */}
          <div className="mt-5">
            <div className="flex items-center gap-2 text-[12px]">
              <span className="grid size-5 place-items-center rounded-full bg-m3-primary-container text-m3-on-primary-container">
                <span className="ms text-[14px] animate-spin" aria-hidden>progress_activity</span>
              </span>
              <span key={phase} className="m3-rise text-m3-on-surface">{phases[phase]}…</span>
              <span className="ml-auto rounded-full bg-m3-surface-container px-2 py-0.5 font-mono text-[11px] text-m3-on-surface-variant">
                {Math.round(((phase + 1) / 6) * 100)}%
              </span>
            </div>
            {/* Wavy progress */}
            <div
              className="m3-wavy mt-2.5"
              style={{ ["--m3-wavy-pct" as string]: `${((phase + 1) / 6) * 100}%` }}
            />
          </div>
        </div>

        {/* Stats strip */}
        <div className="absolute inset-x-0 bottom-0 grid grid-cols-3 border-t border-m3-outline-variant/40 bg-m3-surface-container-low/60 text-center">
          <Stat label="Components" value="14" />
          <Stat label="Patterns" value="9" />
          <Stat label="Cost / mo" value="₹68k" />
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="py-3">
      <div className="display text-[18px] leading-none">{value}</div>
      <div className="mt-1 text-[10px] uppercase tracking-[0.16em] text-m3-on-surface-variant">
        {label}
      </div>
    </div>
  );
}
