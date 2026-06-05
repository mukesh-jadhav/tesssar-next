"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Layers, Database, Globe, Cpu, Sparkles } from "lucide-react";

/**
 * Animated mini-preview of a Tessar report — purely decorative, no real data.
 * The phase indicator cycles through generation steps so the hero feels alive.
 */
const PHASES = [
  "Analyzing brief…",
  "Selecting components…",
  "Drafting diagrams…",
  "Computing scale tiers…",
  "Estimating cost…",
  "Hardening security…",
] as const;

export function HeroPreview() {
  const [phaseIdx, setPhaseIdx] = useState(0);

  useEffect(() => {
    const i = setInterval(() => {
      setPhaseIdx((p) => (p + 1) % PHASES.length);
    }, 2200);
    return () => clearInterval(i);
  }, []);

  const progressPct = ((phaseIdx + 1) / PHASES.length) * 100;

  return (
    <div className="group/preview relative">
      {/* Soft halo */}
      <div
        aria-hidden
        className="absolute -inset-x-10 -inset-y-6 -z-10 rounded-[2.5rem] bg-foreground/[0.025] blur-2xl"
      />
      {/* Chrome */}
      <div className="overflow-hidden rounded-2xl border bg-card shadow-[0_1px_0_hsl(var(--border)),0_30px_80px_-30px_hsl(var(--foreground)/0.18),0_10px_30px_-15px_hsl(var(--foreground)/0.12)]">
        {/* Window bar */}
        <div className="flex items-center gap-3 border-b bg-background/50 px-4 py-3">
          <div className="flex gap-1.5">
            <span className="size-2.5 rounded-full bg-foreground/15" />
            <span className="size-2.5 rounded-full bg-foreground/15" />
            <span className="size-2.5 rounded-full bg-foreground/15" />
          </div>
          <div className="ml-2 flex-1 truncate font-mono text-[11px] text-muted-foreground">
            tessar.app · /architecture/realtime-canvas
          </div>
          <div className="hidden items-center gap-1.5 rounded-full border bg-card px-2 py-0.5 text-[10px] text-muted-foreground sm:inline-flex">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500/50" />
              <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500" />
            </span>
            Generating
          </div>
        </div>

        <div className="grid gap-0 md:grid-cols-[1fr_auto]">
          {/* Main panel */}
          <div className="border-b p-6 md:border-b-0 md:border-r">
            <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              B2B SaaS · Productivity · Realtime
            </div>
            <div className="mt-3 text-2xl font-semibold tracking-tight md:text-3xl">
              Realtime canvas for design teams
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              CRDT-backed, India-resident, sub-50ms cursor sync at p99.
            </p>

            {/* Diagram skeleton */}
            <div className="mt-6 rounded-xl border bg-background/60 p-4">
              <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
                <span>C4 Container</span>
                <span className="font-mono">02 / 06</span>
              </div>
              <DiagramSchematic />
            </div>

            {/* Phase ticker */}
            <div className="mt-5 space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Sparkles className="size-3" />
                  <span key={phaseIdx} className="animate-reveal-up">
                    {PHASES[phaseIdx]}
                  </span>
                </span>
                <span className="font-mono tabular-nums">{Math.round(progressPct)}%</span>
              </div>
              <div className="h-1 overflow-hidden rounded-full bg-secondary">
                <div
                  className="relative h-full bg-foreground transition-[width] duration-700 ease-out-expo"
                  style={{ width: `${progressPct}%` }}
                >
                  <span
                    aria-hidden
                    className="absolute inset-0 animate-shimmer bg-[length:200%_100%]"
                    style={{
                      backgroundImage:
                        "linear-gradient(90deg, transparent, hsl(var(--background) / 0.65), transparent)",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Side panel — tabs */}
          <div className="hidden flex-col gap-1 bg-background/40 p-3 md:flex md:w-[160px]">
            <SideTab icon={<Layers className="size-3.5" />} label="Overview" active />
            <SideTab icon={<Cpu className="size-3.5" />} label="Components" />
            <SideTab icon={<Database className="size-3.5" />} label="Data & APIs" />
            <SideTab icon={<Globe className="size-3.5" />} label="Scale & Cost" />
          </div>
        </div>

        {/* Stat strip */}
        <div className="grid grid-cols-3 border-t bg-background/40 text-center">
          <Stat label="Components" value="14" />
          <Stat label="Patterns" value="9" separator />
          <Stat label="Cost @ growth" value="₹68k–₹104k/mo" separator />
        </div>
      </div>
    </div>
  );
}

function SideTab({
  icon,
  label,
  active = false,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs transition-colors",
        active
          ? "bg-card text-foreground shadow-[0_1px_0_hsl(var(--border))]"
          : "text-muted-foreground",
      )}
    >
      {icon}
      {label}
    </div>
  );
}

function Stat({
  label,
  value,
  separator = false,
}: {
  label: string;
  value: string;
  separator?: boolean;
}) {
  return (
    <div className={cn("px-4 py-4", separator && "border-l")}>
      <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold tabular-nums">{value}</div>
    </div>
  );
}

/** Tiny abstract C4-container schematic — animated edges. */
function DiagramSchematic() {
  return (
    <svg
      viewBox="0 0 400 160"
      className="mt-3 h-32 w-full text-foreground/70"
      aria-hidden
      fill="none"
    >
      {/* Edges */}
      <g stroke="currentColor" strokeOpacity="0.35" strokeDasharray="4 4">
        <line x1="60" y1="40" x2="200" y2="80">
          <animate
            attributeName="stroke-dashoffset"
            values="0;-32"
            dur="2.4s"
            repeatCount="indefinite"
          />
        </line>
        <line x1="200" y1="80" x2="340" y2="40">
          <animate
            attributeName="stroke-dashoffset"
            values="0;-32"
            dur="2.4s"
            repeatCount="indefinite"
          />
        </line>
        <line x1="200" y1="80" x2="120" y2="130">
          <animate
            attributeName="stroke-dashoffset"
            values="0;-32"
            dur="2.6s"
            repeatCount="indefinite"
          />
        </line>
        <line x1="200" y1="80" x2="280" y2="130">
          <animate
            attributeName="stroke-dashoffset"
            values="0;-32"
            dur="2.8s"
            repeatCount="indefinite"
          />
        </line>
      </g>
      {/* Nodes */}
      <Node x={60} y={40} label="Web" />
      <Node x={340} y={40} label="API" />
      <Node x={200} y={80} label="Gateway" primary />
      <Node x={120} y={130} label="Cache" />
      <Node x={280} y={130} label="DB" />
    </svg>
  );
}

function Node({
  x,
  y,
  label,
  primary = false,
}: {
  x: number;
  y: number;
  label: string;
  primary?: boolean;
}) {
  return (
    <g transform={`translate(${x - 32}, ${y - 12})`}>
      <rect
        width="64"
        height="24"
        rx="6"
        fill={primary ? "currentColor" : "hsl(var(--background))"}
        stroke="currentColor"
        strokeOpacity={primary ? "0" : "0.4"}
        strokeWidth="1"
      />
      <text
        x="32"
        y="16"
        textAnchor="middle"
        fontSize="9"
        fill={primary ? "hsl(var(--background))" : "currentColor"}
        fontFamily="var(--font-mono), monospace"
      >
        {label}
      </text>
    </g>
  );
}
