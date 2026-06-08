"use client";

import { motion } from "framer-motion";
import { useReducedMotionSafe } from "@/components/motion/useReducedMotionSafe";

/**
 * Editorial line illustrations for empty / failed states.
 *
 * Hand-drawn pencil feel: dashed wires, rounded mono-stroke nodes, a single
 * vermillion accent. Subtle breathing animation; reduced-motion users see the
 * static frame. All three variants share the same visual language as
 * `AmbientDiagram` so the empty states feel native to the editorial system.
 */

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

const INK_LIGHT = "hsl(var(--ink) / 0.22)";
const INK_MED = "hsl(var(--ink) / 0.55)";
const ACCENT = "hsl(var(--accent))";
const PAPER = "hsl(var(--paper))";

export type IllustrationKind = "workspace" | "library" | "broken-wire";

export function EditorialIllustration({
  kind,
  className,
}: {
  kind: IllustrationKind;
  className?: string;
}) {
  switch (kind) {
    case "workspace": return <WorkspaceIllustration className={className} />;
    case "library":   return <LibraryIllustration   className={className} />;
    case "broken-wire": return <BrokenWireIllustration className={className} />;
  }
}

/* ------------------------------------------------------------------ */
/*  Workspace — a single sheet of paper with the bare bones of an     */
/*  architecture sketched: three ghosted nodes, dashed wires, room    */
/*  for the user to fill in. Pencil and the accent dot suggest start. */
/* ------------------------------------------------------------------ */

function WorkspaceIllustration({ className }: { className?: string }) {
  const reduced = useReducedMotionSafe();

  return (
    <svg
      className={className}
      viewBox="0 0 360 220"
      aria-hidden
      role="presentation"
      style={{ overflow: "visible" }}
    >
      <defs>
        <marker
          id="emp-arrow"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="5"
          markerHeight="5"
          orient="auto-start-reverse"
        >
          <path d="M0,0 L10,5 L0,10 z" fill={INK_LIGHT} />
        </marker>
      </defs>

      {/* Back sheet (rotated, suggesting a stack) */}
      <g transform="translate(60 38) rotate(-3)">
        <rect width="240" height="160" rx="6" fill={PAPER} stroke={INK_LIGHT} strokeWidth="1" />
      </g>

      {/* Front sheet */}
      <motion.g
        animate={reduced ? undefined : { y: [0, -1.5, 0] }}
        transition={{ duration: 6, ease: "easeInOut", repeat: Infinity }}
        style={{ transformOrigin: "180px 120px" }}
      >
        <rect x="50" y="30" width="240" height="160" rx="6" fill={PAPER} stroke={INK_MED} strokeWidth="1.2" />

        {/* Ruled corner pencil-shading */}
        <g stroke={INK_LIGHT} strokeWidth="0.6">
          {Array.from({ length: 5 }).map((_, i) => (
            <line key={i} x1={60} y1={45 + i * 4} x2={75 + i * 3} y2={45 + i * 4} />
          ))}
        </g>

        {/* Ghosted nodes */}
        <g fill={PAPER} stroke={INK_LIGHT} strokeWidth="1" strokeDasharray="2 3">
          <rect x="80" y="80" width="64" height="28" rx="6" />
          <rect x="200" y="65" width="64" height="28" rx="6" />
          <rect x="135" y="135" width="64" height="28" rx="6" />
        </g>
        {/* Node tick labels */}
        <g fill={INK_LIGHT} fontSize="6" fontFamily="ui-monospace, monospace" letterSpacing="0.05em">
          <text x="84" y="76">01</text>
          <text x="204" y="61">02</text>
          <text x="139" y="131">03</text>
        </g>

        {/* Dashed wires between nodes */}
        <g fill="none" stroke={INK_LIGHT} strokeWidth="1" strokeDasharray="3 3">
          <motion.path
            d="M144,94 Q172,82 200,80"
            markerEnd="url(#emp-arrow)"
            initial={reduced ? false : { pathLength: 0 }}
            animate={reduced ? undefined : { pathLength: 1 }}
            transition={{ duration: 1.4, delay: 0.2, ease: EASE_OUT_EXPO }}
          />
          <motion.path
            d="M232,93 Q224,118 199,140"
            markerEnd="url(#emp-arrow)"
            initial={reduced ? false : { pathLength: 0 }}
            animate={reduced ? undefined : { pathLength: 1 }}
            transition={{ duration: 1.4, delay: 0.45, ease: EASE_OUT_EXPO }}
          />
          <motion.path
            d="M135,150 Q112,128 112,108"
            markerEnd="url(#emp-arrow)"
            initial={reduced ? false : { pathLength: 0 }}
            animate={reduced ? undefined : { pathLength: 1 }}
            transition={{ duration: 1.4, delay: 0.7, ease: EASE_OUT_EXPO }}
          />
        </g>

        {/* Accent dot — invitation to begin */}
        <motion.circle
          cx="167" cy="149" r="3.5" fill={ACCENT}
          animate={reduced ? undefined : { scale: [1, 1.35, 1], opacity: [1, 0.85, 1] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformOrigin: "167px 149px" }}
        />
      </motion.g>

      {/* Pencil resting across the sheet */}
      <g transform="translate(220 178) rotate(-22)">
        <rect width="86" height="6" rx="1.5" fill={PAPER} stroke={INK_MED} strokeWidth="1" />
        <rect x="0" y="0" width="10" height="6" rx="1.5" fill={ACCENT} />
        <path d="M86,0 L96,3 L86,6 Z" fill={INK_MED} />
      </g>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Library — fanned stack of back-issues / past briefs. Matches the  */
/*  "Library" / "Archive" framing of /history. Top issue has a small  */
/*  rule mark and an accent ribbon-mark.                              */
/* ------------------------------------------------------------------ */

function LibraryIllustration({ className }: { className?: string }) {
  const reduced = useReducedMotionSafe();

  const issues = [
    { rot: -10, x: 50,  y: 60, label: "008" },
    { rot: -3,  x: 100, y: 44, label: "009" },
    { rot: 4,   x: 150, y: 40, label: "010" },
  ];

  return (
    <svg
      className={className}
      viewBox="0 0 360 220"
      aria-hidden
      role="presentation"
      style={{ overflow: "visible" }}
    >
      {issues.map((iss, i) => (
        <motion.g
          key={iss.label}
          transform={`translate(${iss.x} ${iss.y}) rotate(${iss.rot})`}
          initial={reduced ? false : { opacity: 0, y: iss.y + 10 }}
          animate={reduced ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 + i * 0.08, ease: EASE_OUT_EXPO }}
        >
          <rect width="140" height="170" rx="4" fill={PAPER} stroke={i === 2 ? INK_MED : INK_LIGHT} strokeWidth="1.1" />
          {/* Masthead */}
          <g fill={i === 2 ? INK_MED : INK_LIGHT}>
            <text x="12" y="22" fontSize="8" fontFamily="ui-monospace, monospace" letterSpacing="0.1em">
              ISSUE {iss.label}
            </text>
            <line x1="12" y1="28" x2="128" y2="28" stroke={i === 2 ? INK_MED : INK_LIGHT} strokeWidth="0.8" />
          </g>
          {/* Ruled lines representing body text */}
          <g stroke={INK_LIGHT} strokeWidth="0.6">
            {[42, 52, 62, 72, 82].map((y, idx) => (
              <line key={y} x1="12" y1={y} x2={idx === 4 ? 84 : 128} y2={y} />
            ))}
          </g>
          {/* Ghosted diagram region */}
          <g fill="none" stroke={INK_LIGHT} strokeWidth="0.8" strokeDasharray="2 3">
            <rect x="12" y="98" width="116" height="58" rx="3" />
            <circle cx="34" cy="124" r="6" />
            <circle cx="70" cy="116" r="6" />
            <circle cx="106" cy="132" r="6" />
            <line x1="40" y1="122" x2="64" y2="118" />
            <line x1="76" y1="119" x2="100" y2="129" />
          </g>
        </motion.g>
      ))}

      {/* Accent ribbon-mark on the front issue */}
      <motion.g
        initial={reduced ? false : { opacity: 0, scaleY: 0 }}
        animate={reduced ? undefined : { opacity: 1, scaleY: 1 }}
        transition={{ duration: 0.6, delay: 0.5, ease: EASE_OUT_EXPO }}
        style={{ transformOrigin: "278px 40px" }}
      >
        <rect x="276" y="40" width="6" height="36" fill={ACCENT} />
        <path d="M276,76 L279,72 L282,76 Z" fill={ACCENT} />
      </motion.g>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Broken-wire — two nodes with a snapped dashed connector. The      */
/*  break gap holds a small accent X. Used for failed-run state.      */
/* ------------------------------------------------------------------ */

function BrokenWireIllustration({ className }: { className?: string }) {
  const reduced = useReducedMotionSafe();

  return (
    <svg
      className={className}
      viewBox="0 0 360 180"
      aria-hidden
      role="presentation"
      style={{ overflow: "visible" }}
    >
      {/* Left node */}
      <g transform="translate(36 64)">
        <rect width="96" height="44" rx="6" fill={PAPER} stroke={INK_MED} strokeWidth="1.2" />
        <text x="10" y="16" fontSize="7" fontFamily="ui-monospace, monospace" letterSpacing="0.1em" fill={INK_LIGHT}>SOURCE</text>
        <line x1="10" y1="22" x2="86" y2="22" stroke={INK_LIGHT} strokeWidth="0.7" />
        <circle cx="14" cy="34" r="2.5" fill={INK_LIGHT} />
        <line x1="22" y1="34" x2="84" y2="34" stroke={INK_LIGHT} strokeWidth="0.7" />
      </g>

      {/* Right node */}
      <g transform="translate(228 64)">
        <rect width="96" height="44" rx="6" fill={PAPER} stroke={INK_MED} strokeWidth="1.2" />
        <text x="10" y="16" fontSize="7" fontFamily="ui-monospace, monospace" letterSpacing="0.1em" fill={INK_LIGHT}>TARGET</text>
        <line x1="10" y1="22" x2="86" y2="22" stroke={INK_LIGHT} strokeWidth="0.7" />
        <circle cx="14" cy="34" r="2.5" fill={INK_LIGHT} />
        <line x1="22" y1="34" x2="84" y2="34" stroke={INK_LIGHT} strokeWidth="0.7" />
      </g>

      {/* Wire — broken in the middle. Two short arcs flopping toward the gap. */}
      <g fill="none" stroke={INK_LIGHT} strokeWidth="1.2" strokeDasharray="3 3" strokeLinecap="round">
        <motion.path
          d="M132,86 Q156,82 168,90"
          initial={reduced ? false : { pathLength: 0 }}
          animate={reduced ? undefined : { pathLength: 1 }}
          transition={{ duration: 1.1, delay: 0.1, ease: EASE_OUT_EXPO }}
        />
        <motion.path
          d="M228,86 Q204,82 192,90"
          initial={reduced ? false : { pathLength: 0 }}
          animate={reduced ? undefined : { pathLength: 1 }}
          transition={{ duration: 1.1, delay: 0.25, ease: EASE_OUT_EXPO }}
        />
      </g>

      {/* Snap glyph at the gap — vermillion X */}
      <motion.g
        stroke={ACCENT} strokeWidth="2" strokeLinecap="round"
        initial={reduced ? false : { opacity: 0, scale: 0.5 }}
        animate={reduced ? undefined : { opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 1.1, ease: EASE_OUT_EXPO, type: "spring", stiffness: 220, damping: 16 }}
        style={{ transformOrigin: "180px 90px" }}
      >
        <line x1="172" y1="82" x2="188" y2="98" />
        <line x1="188" y1="82" x2="172" y2="98" />
      </motion.g>

      {/* Tiny "spark" tick marks suggesting the break point */}
      <g stroke={INK_LIGHT} strokeWidth="0.9" strokeLinecap="round" opacity="0.7">
        <line x1="180" y1="68" x2="180" y2="62" />
        <line x1="172" y1="72" x2="167" y2="68" />
        <line x1="188" y1="72" x2="193" y2="68" />
      </g>
    </svg>
  );
}
