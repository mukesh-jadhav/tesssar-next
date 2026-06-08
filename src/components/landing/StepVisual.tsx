"use client";

import { motion } from "framer-motion";
import { useReducedMotionSafe } from "@/components/motion/useReducedMotionSafe";

type StepVisualProps = {
  kind: "describe" | "design" | "ship";
};

/**
 * Tiny editorial visuals for the three "How it works" steps.
 *  - describe: a textarea silhouette with a blinking caret
 *  - design:   three nodes wired by dashed lines that draw in
 *  - ship:     three fanning document chips (PDF · PPTX · MD)
 *
 * All static when prefers-reduced-motion is on.
 */
export function StepVisual({ kind }: StepVisualProps) {
  const reduced = useReducedMotionSafe();

  if (kind === "describe") {
    return (
      <svg
        viewBox="0 0 220 110"
        aria-hidden
        role="presentation"
        className="h-auto w-full"
      >
        <rect
          x="6"
          y="8"
          width="208"
          height="94"
          rx="10"
          fill="hsl(var(--paper-2))"
          stroke="hsl(var(--ink) / 0.16)"
          strokeWidth="1"
        />
        {[26, 42, 58, 74].map((y, i) => (
          <rect
            key={y}
            x="18"
            y={y}
            width={i === 3 ? 110 : 184}
            height="3"
            rx="1.5"
            fill="hsl(var(--ink) / 0.16)"
          />
        ))}
        {/* Blinking caret */}
        <motion.rect
          x="134"
          y="71"
          width="2"
          height="9"
          fill="hsl(var(--accent))"
          animate={reduced ? undefined : { opacity: [1, 0, 1] }}
          transition={
            reduced
              ? undefined
              : { duration: 1.05, repeat: Infinity, ease: "easeInOut", times: [0, 0.5, 1] }
          }
        />
      </svg>
    );
  }

  if (kind === "design") {
    const nodes = [
      { id: "a", x: 22, y: 30, w: 56, h: 26, label: "API" },
      { id: "b", x: 130, y: 14, w: 56, h: 26, label: "Service" },
      { id: "c", x: 130, y: 64, w: 56, h: 26, label: "Data" },
    ] as const;
    return (
      <svg
        viewBox="0 0 220 110"
        aria-hidden
        role="presentation"
        className="h-auto w-full"
      >
        <defs>
          <marker
            id="step-arrow"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto-start-reverse"
          >
            <path d="M0,0 L10,5 L0,10 z" fill="hsl(var(--accent))" />
          </marker>
        </defs>

        {/* Wires drawing in */}
        <g
          fill="none"
          stroke="hsl(var(--ink) / 0.3)"
          strokeWidth="1.2"
          strokeDasharray="3 3"
        >
          {[
            "M78,43 C100,43 110,27 130,27",
            "M78,43 C100,43 110,77 130,77",
          ].map((d, i) => (
            <motion.path
              key={i}
              d={d}
              markerEnd="url(#step-arrow)"
              initial={reduced ? false : { pathLength: 0 }}
              whileInView={reduced ? undefined : { pathLength: 1 }}
              viewport={{ once: true, margin: "-20px" }}
              transition={{
                duration: 0.9,
                delay: 0.3 + i * 0.15,
                ease: [0.16, 1, 0.3, 1],
              }}
            />
          ))}
        </g>

        {/* Nodes */}
        {nodes.map((n, i) => (
          <motion.g
            key={n.id}
            initial={reduced ? false : { opacity: 0, y: 6 }}
            whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-20px" }}
            transition={{ duration: 0.5, delay: 0.1 + i * 0.1 }}
          >
            <rect
              x={n.x}
              y={n.y}
              width={n.w}
              height={n.h}
              rx="5"
              fill="hsl(var(--paper))"
              stroke="hsl(var(--ink) / 0.32)"
              strokeWidth="1"
            />
            <text
              x={n.x + n.w / 2}
              y={n.y + n.h / 2 + 3.5}
              textAnchor="middle"
              fontSize="9"
              fontFamily="var(--font-mono), ui-monospace, monospace"
              fill="hsl(var(--ink) / 0.7)"
              style={{ letterSpacing: "0.06em", textTransform: "uppercase" as const }}
            >
              {n.label}
            </text>
          </motion.g>
        ))}
      </svg>
    );
  }

  // kind === "ship": three layered document chips that fan out on hover.
  return (
    <svg
      viewBox="0 0 220 110"
      aria-hidden
      role="presentation"
      className="h-auto w-full group"
    >
      {[
        { label: "MD", rot: -8,  tx: -20, color: "hsl(var(--paper-3))" },
        { label: "PPTX", rot: 0,  tx: 0,   color: "hsl(var(--paper-2))" },
        { label: "PDF", rot: 8,  tx: 20,  color: "hsl(var(--paper))" },
      ].map((doc, i) => (
        <motion.g
          key={doc.label}
          initial={reduced ? false : { opacity: 0, y: 8 }}
          whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-20px" }}
          transition={{ duration: 0.5, delay: 0.1 + i * 0.08 }}
          style={{ transformOrigin: "110px 55px" }}
        >
          <g transform={`translate(${doc.tx}, 0) rotate(${doc.rot}, 110, 55)`}>
            <rect
              x="82"
              y="22"
              width="56"
              height="66"
              rx="3"
              fill={doc.color}
              stroke="hsl(var(--ink) / 0.3)"
              strokeWidth="1"
            />
            <text
              x="110"
              y="60"
              textAnchor="middle"
              fontSize="9"
              fontFamily="var(--font-mono), ui-monospace, monospace"
              fill="hsl(var(--ink))"
              style={{ letterSpacing: "0.08em" }}
            >
              {doc.label}
            </text>
          </g>
        </motion.g>
      ))}
    </svg>
  );
}
