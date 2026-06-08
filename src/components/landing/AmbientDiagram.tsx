"use client";

import { motion } from "framer-motion";
import { useReducedMotionSafe } from "@/components/motion/useReducedMotionSafe";

/**
 * Editorial breathing mini-architecture diagram. Pure decoration — sits in the
 * hero's negative space on `lg:` screens and gives the page life without
 * distracting from the headline. Five nodes, curved wires, travelling dots,
 * a slow 6s breathing pulse. Wires drawn left-to-right on viewport entry.
 *
 * Honors `prefers-reduced-motion`: shows a static version.
 */
export function AmbientDiagram({ className }: { className?: string }) {
  const reduced = useReducedMotionSafe();

  const nodes = [
    { id: "web",     x: 40,  y: 50,  w: 96, h: 36, label: "Web" },
    { id: "api",     x: 200, y: 30,  w: 96, h: 36, label: "API" },
    { id: "service", x: 360, y: 70,  w: 96, h: 36, label: "Service" },
    { id: "queue",   x: 60,  y: 180, w: 96, h: 36, label: "Queue" },
    { id: "db",      x: 320, y: 200, w: 96, h: 36, label: "DB" },
  ];

  // Curved edges between nodes (using node centers).
  const center = (n: (typeof nodes)[number]) => ({ x: n.x + n.w / 2, y: n.y + n.h / 2 });
  const edges = [
    ["web", "api"],
    ["api", "service"],
    ["api", "queue"],
    ["service", "db"],
    ["queue", "db"],
  ] as const;

  const byId = Object.fromEntries(nodes.map((n) => [n.id, n] as const));

  return (
    <svg
      className={className}
      viewBox="0 0 520 280"
      aria-hidden
      role="presentation"
      style={{ overflow: "visible" }}
    >
      <defs>
        <marker
          id="ambient-arrow"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M0,0 L10,5 L0,10 z" fill="hsl(var(--accent))" />
        </marker>
      </defs>

      {/* Edges — dashed, ink/22, with arrowhead. Drawn on viewport entry. */}
      <g fill="none" stroke="hsl(var(--ink) / 0.22)" strokeWidth="1.2" strokeDasharray="4 4">
        {edges.map(([from, to], i) => {
          const a = center(byId[from]);
          const b = center(byId[to]);
          const cx = (a.x + b.x) / 2;
          const cy = (a.y + b.y) / 2 - 30; // arch
          const d = `M${a.x},${a.y} Q${cx},${cy} ${b.x},${b.y}`;
          return (
            <motion.path
              key={`${from}-${to}`}
              d={d}
              markerEnd="url(#ambient-arrow)"
              initial={reduced ? false : { pathLength: 0, opacity: 0 }}
              animate={reduced ? undefined : { pathLength: 1, opacity: 1 }}
              transition={{
                duration: 1.4,
                delay: 0.4 + i * 0.12,
                ease: [0.16, 1, 0.3, 1],
              }}
            />
          );
        })}
      </g>

      {/* Travelling dots — small accent dots that sweep along key edges. */}
      {!reduced &&
        edges.map(([from, to], i) => {
          const a = center(byId[from]);
          const b = center(byId[to]);
          const cx = (a.x + b.x) / 2;
          const cy = (a.y + b.y) / 2 - 30;
          const d = `M${a.x},${a.y} Q${cx},${cy} ${b.x},${b.y}`;
          // Drives a small accent dot to follow the path.
          return (
            <g key={`dot-${i}`}>
              <circle r="2.6" fill="hsl(var(--accent))">
                <animateMotion
                  dur={`${3.4 + i * 0.6}s`}
                  begin={`${1.6 + i * 0.4}s`}
                  repeatCount="indefinite"
                  path={d}
                  rotate="auto"
                />
                <animate
                  attributeName="opacity"
                  values="0;1;1;0"
                  keyTimes="0;0.1;0.85;1"
                  dur={`${3.4 + i * 0.6}s`}
                  begin={`${1.6 + i * 0.4}s`}
                  repeatCount="indefinite"
                />
              </circle>
            </g>
          );
        })}

      {/* Nodes — staggered entry + slow breathing pulse. */}
      {nodes.map((n, i) => (
        <motion.g
          key={n.id}
          initial={reduced ? false : { opacity: 0, y: 8 }}
          animate={reduced ? undefined : { opacity: 1, y: 0 }}
          transition={{
            duration: 0.6,
            delay: 0.1 + i * 0.08,
            ease: [0.22, 1.4, 0.36, 1],
          }}
        >
          <motion.rect
            x={n.x}
            y={n.y}
            width={n.w}
            height={n.h}
            rx={6}
            ry={6}
            fill="hsl(var(--paper))"
            stroke="hsl(var(--ink) / 0.28)"
            strokeWidth="1"
            animate={
              reduced
                ? undefined
                : {
                    // Subtle breathing — only on the rect's stroke opacity, not scale,
                    // to avoid sub-pixel jitter on the labels.
                    strokeOpacity: [0.22, 0.42, 0.22],
                  }
            }
            transition={{
              duration: 4 + i * 0.4,
              repeat: Infinity,
              repeatType: "loop",
              ease: "easeInOut",
              delay: i * 0.3,
            }}
          />
          <text
            x={n.x + n.w / 2}
            y={n.y + n.h / 2 + 3.5}
            textAnchor="middle"
            fontSize="10.5"
            fontFamily="var(--font-mono), ui-monospace, monospace"
            fill="hsl(var(--ink) / 0.7)"
            style={{ letterSpacing: "0.08em", textTransform: "uppercase" as const }}
          >
            {n.label}
          </text>
        </motion.g>
      ))}
    </svg>
  );
}
