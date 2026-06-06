"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { select } from "d3-selection";
import { zoom, zoomIdentity, type ZoomBehavior } from "d3-zoom";
import { cn } from "@/lib/utils";
import type { Architecture, ArchComponent, DataFlow } from "@/types/architecture";

/**
 * SystemDiagram — the Design tab's hero diagram.
 *
 * Editorial SVG rendered in our paper / ink / vermillion tokens with
 * Bricolage Grotesque labels. Lanes are fixed columns (Client → API →
 * Compute → Data → Platform). Each component is a numbered card.
 * Edges are orthogonal with a vermillion data-flow dot that runs
 * continuously between source and target — the same motif we have on
 * the Mermaid diagrams. D3-zoom handles pan / zoom.
 */

type Cat = ArchComponent["category"];

// --- Lanes ------------------------------------------------------------------
const LANES: { id: string; label: string; sub: string; cats: Cat[] }[] = [
  { id: "client",   label: "Client & Edge",  sub: "What the user touches",        cats: ["frontend", "cdn", "edge"] },
  { id: "api",      label: "API & Identity", sub: "Front door to the system",     cats: ["api", "auth"] },
  { id: "compute",  label: "Compute",        sub: "Where work happens",           cats: ["service", "worker", "ml", "other"] },
  { id: "data",     label: "Data & State",   sub: "Where state lives",            cats: ["database", "cache", "queue", "storage"] },
  { id: "platform", label: "Platform",       sub: "How we run & watch it",        cats: ["observability", "integration"] },
];

const CAT_ICON: Record<Cat, string> = {
  frontend: "web",
  cdn: "cloud_queue",
  edge: "public",
  api: "api",
  auth: "fingerprint",
  service: "settings",
  worker: "conveyor_belt",
  ml: "smart_toy",
  other: "widgets",
  database: "database",
  cache: "bolt",
  queue: "swap_horiz",
  storage: "inventory_2",
  observability: "monitoring",
  integration: "extension",
};

// Tech-logo resolver. Returns a Simple Icons slug if we recognise the
// technology string; the caller renders it as <image href="https://cdn.simpleicons.org/{slug}/{color}">.
// Order matters — more specific keywords first.
const TECH_LOGO_RULES: { match: RegExp; slug: string }[] = [
  { match: /next\.?js|next 1\d/i,            slug: "nextdotjs" },
  { match: /\breact\b/i,                     slug: "react" },
  { match: /tiptap/i,                        slug: "tiptap" },
  { match: /\byjs\b/i,                       slug: "yjs" },
  { match: /fastify/i,                       slug: "fastify" },
  { match: /express\b/i,                     slug: "express" },
  { match: /\bnode(\.| )?js|node 1\d|node 2\d/i, slug: "nodedotjs" },
  { match: /firebase|identity platform/i,    slug: "firebase" },
  { match: /\bgke\b|kubernetes/i,            slug: "kubernetes" },
  { match: /redis|memorystore/i,             slug: "redis" },
  { match: /razorpay/i,                      slug: "razorpay" },
  { match: /postgres/i,                      slug: "postgresql" },
  { match: /mysql/i,                         slug: "mysql" },
  { match: /mongo/i,                         slug: "mongodb" },
  { match: /elastic(search)?/i,              slug: "elasticsearch" },
  { match: /kafka/i,                         slug: "apachekafka" },
  { match: /rabbit/i,                        slug: "rabbitmq" },
  { match: /docker/i,                        slug: "docker" },
  { match: /terraform/i,                     slug: "terraform" },
  { match: /grafana/i,                       slug: "grafana" },
  { match: /prometheus/i,                    slug: "prometheus" },
  { match: /datadog/i,                       slug: "datadog" },
  { match: /sentry/i,                        slug: "sentry" },
  { match: /stripe/i,                        slug: "stripe" },
  { match: /openai/i,                        slug: "openai" },
  { match: /anthropic|claude/i,              slug: "anthropic" },
  { match: /vertex|gemini|bigquery|pub\/?sub|cloud (run|cdn|storage|tasks|monitoring|trace|logging|armor|load balancer)|\bgcs\b|firestore|google cloud/i, slug: "googlecloud" },
  { match: /\baws\b|amazon web/i,            slug: "amazonwebservices" },
  { match: /azure|microsoft/i,               slug: "microsoftazure" },
  { match: /cloudflare/i,                    slug: "cloudflare" },
  { match: /vercel/i,                        slug: "vercel" },
  { match: /supabase/i,                      slug: "supabase" },
];

function techLogo(tech: string): string | null {
  for (const r of TECH_LOGO_RULES) if (r.match.test(tech)) return r.slug;
  return null;
}
// Ink color (no hash) — Simple Icons CDN accepts hex/CSS-color name in path.
const LOGO_INK = "1A1C22";

// --- Layout constants -------------------------------------------------------
const NODE_W = 220;
const NODE_H = 116;
const LANE_PAD_X = 22;            // horizontal padding inside each lane band
const NODE_GAP_Y = 28;            // vertical gap between cards within a lane
const LANE_HEADER_H = 64;         // height reserved at top of each lane for label + subtitle
const LANE_GAP = 88;              // wide gutter so edge labels live without overlapping cards
const DIAGRAM_PAD = 32;
const NODE_RX = 2;

function laneOf(cat: Cat): string {
  for (const l of LANES) if (l.cats.includes(cat)) return l.id;
  return "platform";
}

/** Fuzzy resolve a data_flow `from`/`to` (free-form prose) back to a component. */
function buildResolver(arch: Architecture) {
  const exact = new Map<string, ArchComponent>();
  arch.components.forEach((c) => exact.set(c.name.toLowerCase(), c));
  return (ref: string): ArchComponent | undefined => {
    const r = ref.toLowerCase().trim();
    if (!r) return;
    if (exact.has(r)) return exact.get(r);
    for (const c of arch.components) if (r.includes(c.name.toLowerCase())) return c;
    for (const c of arch.components) if (c.technology.toLowerCase().includes(r)) return c;
    const tokens = r.split(/[^a-z0-9]+/).filter((t) => t.length > 3);
    if (tokens.length === 0) return;
    for (const c of arch.components) {
      const hay = `${c.name} ${c.technology}`.toLowerCase();
      if (tokens.every((t) => hay.includes(t))) return c;
    }
    for (const c of arch.components) {
      const hay = `${c.name} ${c.technology}`.toLowerCase();
      if (tokens.some((t) => hay.includes(t))) return c;
    }
    return;
  };
}

type Placed = { id: string; comp: ArchComponent; x: number; y: number; w: number; h: number; lane: string };
type Lane = { id: string; label: string; x: number; y: number; w: number; h: number; n: number };

export function SystemDiagram({ arch }: { arch: Architecture }) {
  const [hovered, setHovered] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const gRef = useRef<SVGGElement | null>(null);
  const zoomBehavior = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  const { placed, lanes, edges, totalW, totalH } = useMemo(() => {
    // 1) Group components per used lane (preserve LANES order).
    const used = LANES
      .map((L, i) => ({ ...L, items: arch.components.filter((c) => L.cats.includes(c.category)), order: i }))
      .filter((L) => L.items.length > 0);

    // 2) Measure each node so long names / tech strings don't get truncated.
    const sizes = new Map<string, { w: number; h: number }>();
    arch.components.forEach((c) => sizes.set(c.id, measureSystemNode(c)));

    // 3) Manual lane layout (left → right). Each lane's width = widest node
    //    inside it; each card stacks with NODE_GAP_Y between.
    const placed: Placed[] = [];
    const lanes: Lane[] = [];
    let cursorX = DIAGRAM_PAD;
    used.forEach((L) => {
      const itemSizes = L.items.map((c) => sizes.get(c.id)!);
      const laneInnerW = Math.max(...itemSizes.map((s) => s.w));
      const laneW = laneInnerW + LANE_PAD_X * 2;
      const cardsH = itemSizes.reduce((sum, s) => sum + s.h, 0)
        + (L.items.length - 1) * NODE_GAP_Y;
      const laneH = LANE_HEADER_H + cardsH + LANE_PAD_X;
      lanes.push({ id: L.id, label: L.label, x: cursorX, y: DIAGRAM_PAD, w: laneW, h: laneH, n: L.order });

      let cardY = DIAGRAM_PAD + LANE_HEADER_H;
      L.items.forEach((c) => {
        const s = sizes.get(c.id)!;
        placed.push({
          id: c.id,
          comp: c,
          x: cursorX + LANE_PAD_X + (laneInnerW - s.w) / 2, // centred within lane band
          y: cardY,
          w: s.w,
          h: s.h,
          lane: L.id,
        });
        cardY += s.h + NODE_GAP_Y;
      });
      cursorX += laneW + LANE_GAP;
    });
    const totalW = cursorX - LANE_GAP + DIAGRAM_PAD;
    const totalH = Math.max(...lanes.map((l) => l.y + l.h)) + DIAGRAM_PAD;

    // 4) Resolve + lay out edges. Each edge enters/exits via fan-out points
    //    on the card's left/right side (or top/bottom for vertical hops),
    //    and its label is placed inside the GUTTER between the two lanes,
    //    never on top of any card.
    const byId = new Map(placed.map((p) => [p.id, p]));
    const resolve = buildResolver(arch);
    type Edge = {
      id: string;
      d: string;
      from: string;
      to: string;
      flow?: DataFlow;
      label?: { x: number; y: number; w: number; h: number; step?: number; verb: string; proto?: string };
    };
    const edges: Edge[] = [];
    const seen = new Set<string>();

    // 4a) Pre-count attachments per side so we can fan them out.
    const sideCount = new Map<string, number>();   // node:'L'|'R'|'T'|'B' -> count
    const sideTaken = new Map<string, number>();
    const pairs: { f: DataFlow; a: Placed; b: Placed; horiz: boolean; aRight: boolean }[] = [];
    arch.data_flows.forEach((f) => {
      const a = resolve(f.from);
      const b = resolve(f.to);
      if (!a || !b || a.id === b.id) return;
      const key = `${a.id}\u0001${b.id}`;
      if (seen.has(key)) return;
      seen.add(key);
      const pa = byId.get(a.id);
      const pb = byId.get(b.id);
      if (!pa || !pb) return;
      const horiz = Math.abs(pb.x - pa.x) >= Math.abs(pb.y - pa.y);
      const aRight = pa.x < pb.x;
      if (horiz) {
        const sA = aRight ? "R" : "L";
        const sB = aRight ? "L" : "R";
        sideCount.set(`${pa.id}:${sA}`, (sideCount.get(`${pa.id}:${sA}`) ?? 0) + 1);
        sideCount.set(`${pb.id}:${sB}`, (sideCount.get(`${pb.id}:${sB}`) ?? 0) + 1);
      } else {
        const aBelow = pa.y < pb.y;
        const sA = aBelow ? "B" : "T";
        const sB = aBelow ? "T" : "B";
        sideCount.set(`${pa.id}:${sA}`, (sideCount.get(`${pa.id}:${sA}`) ?? 0) + 1);
        sideCount.set(`${pb.id}:${sB}`, (sideCount.get(`${pb.id}:${sB}`) ?? 0) + 1);
      }
      pairs.push({ f, a: pa, b: pb, horiz, aRight });
    });

    // 4b) Route each edge.
    pairs.forEach((P, i) => {
      const { f, a: pa, b: pb, horiz, aRight } = P;
      const verb = edgeVerb(f.action);
      const proto = edgeProto(f.protocol);
      const labelW = verb ? verb.length * 6.4 + 16 : 0;
      const labelH = verb ? 18 : 0;

      let pts: { x: number; y: number }[];
      let labelXY: { x: number; y: number } | null = null;

      if (horiz) {
        const sA = aRight ? "R" : "L";
        const sB = aRight ? "L" : "R";
        const tA = sideCount.get(`${pa.id}:${sA}`) ?? 1;
        const tB = sideCount.get(`${pb.id}:${sB}`) ?? 1;
        const iA = sideTaken.get(`${pa.id}:${sA}`) ?? 0;
        const iB = sideTaken.get(`${pb.id}:${sB}`) ?? 0;
        sideTaken.set(`${pa.id}:${sA}`, iA + 1);
        sideTaken.set(`${pb.id}:${sB}`, iB + 1);
        const offA = pa.h * (iA + 1) / (tA + 1);
        const offB = pb.h * (iB + 1) / (tB + 1);
        const ax = aRight ? pa.x + pa.w : pa.x;
        const ay = pa.y + offA;
        const bx = aRight ? pb.x : pb.x + pb.w;
        const by = pb.y + offB;
        const mx = (ax + bx) / 2;
        pts = [{ x: ax, y: ay }, { x: mx, y: ay }, { x: mx, y: by }, { x: bx, y: by }];

        // Place the label CENTRED IN THE GUTTER. If it doesn't fit, we
        // shrink it (drop) but the chip is small enough that with our
        // LANE_GAP it should always fit.
        if (verb) {
          const gutterStart = aRight ? ax : bx;
          const gutterEnd = aRight ? bx : ax;
          const gutterW = Math.max(0, gutterEnd - gutterStart);
          const fit = gutterW >= labelW + 12;
          if (fit) {
            const cx = (gutterStart + gutterEnd) / 2;
            // stagger label vertically by edge index so multiple labels in
            // the same gutter don't overlap each other.
            const stagger = ((i % 3) - 1) * (labelH + 4);
            labelXY = { x: cx, y: (ay + by) / 2 + stagger };
          }
        }
      } else {
        const aBelow = pa.y < pb.y;
        const sA = aBelow ? "B" : "T";
        const sB = aBelow ? "T" : "B";
        const tA = sideCount.get(`${pa.id}:${sA}`) ?? 1;
        const tB = sideCount.get(`${pb.id}:${sB}`) ?? 1;
        const iA = sideTaken.get(`${pa.id}:${sA}`) ?? 0;
        const iB = sideTaken.get(`${pb.id}:${sB}`) ?? 0;
        sideTaken.set(`${pa.id}:${sA}`, iA + 1);
        sideTaken.set(`${pb.id}:${sB}`, iB + 1);
        const offA = pa.w * (iA + 1) / (tA + 1);
        const offB = pb.w * (iB + 1) / (tB + 1);
        const ax = pa.x + offA;
        const ay = aBelow ? pa.y + pa.h : pa.y;
        const bx = pb.x + offB;
        const by = aBelow ? pb.y : pb.y + pb.h;
        const my = (ay + by) / 2;
        pts = [{ x: ax, y: ay }, { x: ax, y: my }, { x: bx, y: my }, { x: bx, y: by }];
        // Vertical gutter between rows — label sits on the mid horizontal segment.
        if (verb) labelXY = { x: (ax + bx) / 2, y: my };
      }

      edges.push({
        id: `e${i}-${pa.id}-${pb.id}`,
        d: orthoPath(pts, 10),
        from: pa.id,
        to: pb.id,
        flow: f,
        label: labelXY ? { x: labelXY.x, y: labelXY.y, w: labelW, h: labelH, step: f.step, verb, proto } : undefined,
      });
    });

    return { placed, lanes, edges, totalW, totalH };
  }, [arch]);

  // Attach D3-zoom with initial fit-to-view
  useEffect(() => {
    if (!svgRef.current || !gRef.current) return;
    const svg = select(svgRef.current);
    const g = select(gRef.current);
    const z = zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.4, 2.5])
      .on("zoom", (e) => g.attr("transform", e.transform.toString()));
    zoomBehavior.current = z;
    svg.call(z);
    fitTo(svg as unknown as ReturnType<typeof select<SVGSVGElement, unknown>>, z, svgRef.current, totalW, totalH);
    return () => { svg.on(".zoom", null); };
  }, [totalW, totalH]);

  function fit() {
    if (!svgRef.current || !zoomBehavior.current) return;
    fitTo(select(svgRef.current), zoomBehavior.current, svgRef.current, totalW, totalH, true);
  }
  function zoomBy(factor: number) {
    if (!svgRef.current || !zoomBehavior.current) return;
    select(svgRef.current).transition().duration(220).call(zoomBehavior.current.scaleBy, factor);
  }

  const compById = new Map(placed.map((p) => [p.id, p.comp]));

  return (
    <div className="relative overflow-hidden h-[min(78vh,920px)] bg-[hsl(var(--card))] border border-[hsl(var(--line))] rounded-[2px]">
      <svg ref={svgRef} className="block w-full h-full select-none">
        <defs>
          <pattern id="dot-grid" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="0.8" fill="hsl(var(--line-2))" />
          </pattern>
          <marker
            id="arrow-accent"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 Z" fill="hsl(var(--accent))" />
          </marker>
        </defs>

        <rect width="100%" height="100%" fill="url(#dot-grid)" opacity="0.55" />

        <g ref={gRef}>
          {/* Lane bands */}
          {lanes.map((l) => {
            const meta = LANES.find((L) => L.id === l.id);
            return (
              <g key={l.id}>
                <rect
                  x={l.x}
                  y={l.y}
                  width={l.w}
                  height={l.h}
                  rx={2}
                  ry={2}
                  fill="hsl(var(--paper))"
                  stroke="hsl(var(--ink) / 0.08)"
                  strokeDasharray="2 3"
                />
                <text x={l.x + 18} y={l.y + 22} className="ed-eyebrow" fill="hsl(var(--ink) / 0.55)">
                  § {romanize(l.n + 1)}
                </text>
                <text x={l.x + 18} y={l.y + 42} className="ed-lane" fill="hsl(var(--ink))">
                  {l.label}
                </text>
                {meta?.sub && (
                  <text x={l.x + 18} y={l.y + 58} className="ed-sub" fill="hsl(var(--ink) / 0.5)">
                    {meta.sub}
                  </text>
                )}
                {/* lane footer count */}
                <text
                  x={l.x + l.w - 14}
                  y={l.y + 24}
                  textAnchor="end"
                  className="ed-stamp"
                  fill="hsl(var(--ink) / 0.4)"
                >
                  {String(placed.filter((p) => p.lane === l.id).length).padStart(2, "0")}
                </text>
              </g>
            );
          })}

          {/* Edges (under nodes) */}
          {edges.map((e) => {
            const hot = hovered && (hovered === e.from || hovered === e.to);
            return (
              <g key={e.id} className={cn("transition-opacity", hovered && !hot && "opacity-20")}>
                {/* paper-coloured halo so edges read over lane bands */}
                <path
                  d={e.d}
                  fill="none"
                  stroke="hsl(var(--paper))"
                  strokeWidth={5.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d={e.d}
                  fill="none"
                  stroke="hsl(var(--ink))"
                  strokeOpacity={hot ? 1 : 0.78}
                  strokeWidth={hot ? 2 : 1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  markerEnd="url(#arrow-accent)"
                />
                <circle r={hot ? 4 : 3.2} fill="hsl(var(--accent))">
                  <animateMotion
                    dur={`${2.2 + (hashStr(e.id) % 18) / 10}s`}
                    repeatCount="indefinite"
                    rotate="auto"
                    path={e.d}
                  />
                </circle>
              </g>
            );
          })}

          {/* Edge labels (above edges, below nodes) — single uppercase mono
              chip on paper halo, matching the Diagrams-tab style. */}
          {edges.map((e) => {
            if (!e.label) return null;
            const hot = hovered && (hovered === e.from || hovered === e.to);
            const verb = trim(e.label.verb, 18);
            // Approximate width (mono ~6.4px @ 9.5px + 0.06em tracking).
            const w = verb.length * 6.4 + 14;
            const h = 16;
            const x = e.label.x - w / 2;
            const y = e.label.y - h / 2;
            return (
              <g key={`lbl-${e.id}`} className={cn("transition-opacity", hovered && !hot && "opacity-15")}>
                <rect
                  x={x}
                  y={y}
                  width={w}
                  height={h}
                  fill="hsl(var(--paper))"
                  stroke="hsl(var(--ink) / 0.10)"
                  strokeWidth={0.75}
                />
                <text
                  x={e.label.x}
                  y={e.label.y + 3.4}
                  textAnchor="middle"
                  className="ed-edge"
                  fill="hsl(var(--ink) / 0.7)"
                >
                  {verb}
                </text>
              </g>
            );
          })}

          {/* Nodes */}
          {placed.map((n, i) => {
            const isHot = hovered === n.id;
            const slug = techLogo(`${n.comp.name} ${n.comp.technology}`);
            return (
              <g
                key={n.id}
                transform={`translate(${n.x}, ${n.y})`}
                onMouseEnter={() => setHovered(n.id)}
                onMouseLeave={() => setHovered(null)}
                className="cursor-pointer"
              >
                <rect
                  width={n.w}
                  height={n.h}
                  rx={NODE_RX}
                  ry={NODE_RX}
                  fill="hsl(var(--paper))"
                  stroke={isHot ? "hsl(var(--ink) / 0.55)" : "hsl(var(--ink) / 0.18)"}
                  strokeWidth={1}
                />
                <text x={14} y={20} className="ed-stamp" fill="hsl(var(--ink) / 0.45)">
                  {String(i + 1).padStart(2, "0")}
                </text>
                {slug ? (
                  <image
                    href={`https://cdn.simpleicons.org/${slug}/${LOGO_INK}`}
                    x={n.w - 32}
                    y={10}
                    width={20}
                    height={20}
                    opacity={isHot ? 1 : 0.85}
                    preserveAspectRatio="xMidYMid meet"
                  />
                ) : (
                  <text
                    x={n.w - 14}
                    y={24}
                    className="ed-icon"
                    textAnchor="end"
                    fill={isHot ? "hsl(var(--ink))" : "hsl(var(--ink) / 0.5)"}
                  >
                    {CAT_ICON[n.comp.category]}
                  </text>
                )}
                <text x={14} y={44} className="ed-title" fill="hsl(var(--ink))">
                  {trim(n.comp.name, charsForWidth(n.w, 7.6, 56))}
                </text>
                <text x={14} y={62} className="ed-tech" fill="hsl(var(--ink) / 0.55)">
                  {trim(n.comp.technology.split(",")[0], charsForWidth(n.w, 6.8, 28))}
                </text>
                {wrapResponsibility(n.comp.responsibility, charsForWidth(n.w, 6.5, 28), 2).map((line, li) => (
                  <text
                    key={li}
                    x={14}
                    y={82 + li * 13}
                    className="ed-resp"
                    fill="hsl(var(--ink-2))"
                  >
                    {line}
                  </text>
                ))}
              </g>
            );
          })}
        </g>

        <style>{`
          .ed-eyebrow { font: 700 9.5px/1 var(--font-mono), monospace; letter-spacing: 0.22em; text-transform: uppercase; }
          .ed-lane    { font: 600 15px/1 var(--font-display), system-ui, sans-serif; letter-spacing: -0.02em; }
          .ed-sub     { font: 500 10.5px/1 var(--font-mono), monospace; letter-spacing: 0.04em; text-transform: uppercase; }
          .ed-stamp   { font: 500 10px/1 var(--font-mono), monospace; letter-spacing: 0.08em; }
          .ed-icon    { font: 18px/1 'Material Symbols Outlined'; font-feature-settings: 'liga'; }
          .ed-title   { font: 600 14.5px/1 var(--font-display), system-ui, sans-serif; letter-spacing: -0.02em; }
          .ed-tech    { font: 500 10.5px/1 var(--font-mono), monospace; letter-spacing: 0.04em; text-transform: uppercase; }
          .ed-resp    { font: 400 11.5px/1.3 var(--font-sans), system-ui, sans-serif; letter-spacing: -0.005em; }
          .ed-edge    { font: 600 10px/1 var(--font-mono), monospace; letter-spacing: 0.08em; text-transform: uppercase; }
        `}</style>
      </svg>

      <Corner pos="tl" label="D-01" />
      <Corner pos="tr" label="REV A" />
      <Corner pos="bl" label="§ Tessar" />
      <Corner pos="br" label={`${arch.components.length} parts · ${edges.length} wires`} />

      <div className="absolute right-3 bottom-3 flex flex-col items-stretch border border-[hsl(var(--line-2))] bg-[hsl(var(--paper))] rounded-md overflow-hidden">
        <button onClick={() => zoomBy(1.2)} className="ms text-[16px] px-2 py-1 hover:bg-[hsl(var(--paper-2))]" aria-label="Zoom in">add</button>
        <button onClick={fit}                className="ms text-[16px] px-2 py-1 hover:bg-[hsl(var(--paper-2))] border-y border-[hsl(var(--line))]" aria-label="Fit">center_focus_strong</button>
        <button onClick={() => zoomBy(1 / 1.2)} className="ms text-[16px] px-2 py-1 hover:bg-[hsl(var(--paper-2))]" aria-label="Zoom out">remove</button>
      </div>

      {hovered && (() => {
        const c = compById.get(hovered);
        if (!c) return null;
        return (
          <div className="absolute left-3 bottom-3 max-w-[380px] border border-[hsl(var(--line-2))] bg-[hsl(var(--paper))] rounded-md p-3 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.18)] pointer-events-none">
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-[hsl(var(--accent))]">{c.category}</span>
              <h4 className="display text-[14px] tracking-[-0.02em]">{c.name}</h4>
            </div>
            <p className="mt-1 font-mono text-[10.5px] uppercase tracking-wider text-[hsl(var(--ink-3))]">{c.technology}</p>
            <p className="mt-1.5 text-[12.5px] leading-snug text-[hsl(var(--ink-2))]">{c.responsibility}</p>
            <p className="mt-1.5 pt-1.5 border-t border-dashed border-[hsl(var(--line))] text-[11.5px] text-[hsl(var(--ink))]">
              <span className="font-mono text-[9.5px] uppercase tracking-[0.15em] text-[hsl(var(--accent))] mr-1.5">↗ scale</span>
              {c.scaling}
            </p>
          </div>
        );
      })()}
    </div>
  );
}

/* ─────────────────────────── helpers ─────────────────────────── */

function fitTo(
  svg: ReturnType<typeof select<SVGSVGElement, unknown>>,
  z: ZoomBehavior<SVGSVGElement, unknown>,
  el: SVGSVGElement,
  totalW: number,
  totalH: number,
  animate = false,
) {
  const w = el.clientWidth || 1200;
  const h = el.clientHeight || 800;
  const PAD = 12;
  const k = Math.min((w - PAD * 2) / totalW, (h - PAD * 2) / totalH, 1.8);
  const tx = (w - totalW * k) / 2;
  const ty = (h - totalH * k) / 2;
  const tr = zoomIdentity.translate(tx, ty).scale(k);
  if (animate) svg.transition().duration(360).call(z.transform, tr);
  else svg.call(z.transform, tr);
}

function Corner({ pos, label }: { pos: "tl" | "tr" | "bl" | "br"; label: string }) {
  const map = {
    tl: "top-2 left-2",
    tr: "top-2 right-2",
    bl: "bottom-2 left-2",
    br: "bottom-2 right-2",
  } as const;
  return (
    <div className={cn("absolute z-[1] px-1.5 py-0.5 bg-[hsl(var(--paper))] border border-[hsl(var(--line))] font-mono text-[8.5px] uppercase tracking-[0.18em] text-[hsl(var(--ink-3))] pointer-events-none", map[pos])}>
      {label}
    </div>
  );
}

function romanize(n: number): string {
  const map: [number, string][] = [
    [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"],
  ];
  let out = "";
  for (const [v, s] of map) while (n >= v) { out += s; n -= v; }
  return out;
}

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) { h = (h * 31 + s.charCodeAt(i)) | 0; }
  return Math.abs(h);
}

function trim(s: string, max: number): string {
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

/** Boil an action sentence down to a 1–2 word imperative verb phrase that
 *  fits inside the inter-lane gutter (≈14 chars / ~80px). */
function edgeVerb(action: string | undefined): string {
  if (!action) return "";
  const cleaned = action
    .replace(/^(the|a|an)\s+/i, "")
    .replace(/[.!?]+\s*$/, "")
    .trim();
  // First clause only.
  const head = cleaned
    .split(/[,;:]| (?:to|in order to|when|so that|because|via|over|on|into|from|using|with|of) /i)[0]
    .trim();
  // Real word tokens only (drop "+", "&", "/", etc.).
  const words = head.split(/\s+/).filter((w) => /[a-z0-9]/i.test(w));
  if (!words.length) return "";
  let phrase = words.slice(0, 2).join(" ");
  if (phrase.length > 14 && words.length > 1) phrase = words[0];
  if (phrase.length > 14) phrase = phrase.slice(0, 13) + "…";
  return phrase;
}

/** Compact a protocol name into a 4-12 char chip. */
function edgeProto(proto: string | undefined): string {
  if (!proto) return "";
  const p = proto.trim().replace(/\s+/g, " ");
  if (!p) return "";
  // Strip noise words; keep the protocol-like token.
  return p.replace(/\s*\(.+?\)\s*$/, "").slice(0, 12);
}

/** Greedy word-wrap into at most `maxLines` lines of ~`maxChars` each. */
function wrapResponsibility(text: string | undefined, maxChars: number, maxLines = 2): string[] {
  if (!text) return [];
  const words = text.replace(/\s+/g, " ").trim().split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const candidate = cur ? cur + " " + w : w;
    if (candidate.length <= maxChars) {
      cur = candidate;
    } else {
      if (cur) lines.push(cur);
      cur = w;
      if (lines.length === maxLines - 1) break;
    }
  }
  if (cur && lines.length < maxLines) lines.push(cur);
  if (lines.length === maxLines) {
    const last = lines[maxLines - 1];
    // If there are leftover words, append ellipsis.
    const used = lines.join(" ").length;
    if (used < text.length - 1) {
      lines[maxLines - 1] = last.length > maxChars - 1
        ? last.slice(0, maxChars - 1) + "…"
        : last + "…";
    }
  }
  return lines;
}

/**
 * Size a system card so its labels (name + tech + 2 lines of responsibility)
 * fit without truncation. Bricolage @ 14.5px is ~7.6px/char; mono @ 10.5px
 * is ~6.8px/char; body @ 11.5px is ~6.3px/char. Width is capped so very
 * long strings still wrap rather than create a 600px-wide card.
 */
function measureSystemNode(c: ArchComponent): { w: number; h: number } {
  const namePx = c.name.length * 7.6;
  const techPx = c.technology.split(",")[0].trim().length * 6.8;
  const titleBlock = Math.max(namePx, techPx) + 14 /*left pad*/ + 36 /*right stamp/logo*/;
  const w = Math.max(NODE_W, Math.min(Math.ceil(titleBlock), 320));
  const respChars = charsForWidth(w, 6.5, 28);
  const respLines = wrapResponsibility(c.responsibility, respChars, 2).length;
  const h = Math.max(NODE_H, 76 + respLines * 13 + 14);
  return { w, h };
}

/** Build an orthogonal path string with rounded inner corners. */
function orthoPath(pts: { x: number; y: number }[], r: number): string {
  if (pts.length < 2) return "";
  if (pts.length === 2) return `M ${pts[0].x} ${pts[0].y} L ${pts[1].x} ${pts[1].y}`;
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const prev = pts[i - 1];
    const curr = pts[i];
    const next = pts[i + 1];
    const inDx = Math.sign(curr.x - prev.x);
    const inDy = Math.sign(curr.y - prev.y);
    const outDx = Math.sign(next.x - curr.x);
    const outDy = Math.sign(next.y - curr.y);
    const inLen = Math.hypot(curr.x - prev.x, curr.y - prev.y);
    const outLen = Math.hypot(next.x - curr.x, next.y - curr.y);
    const rr = Math.min(r, inLen / 2, outLen / 2);
    const x1 = curr.x - inDx * rr;
    const y1 = curr.y - inDy * rr;
    const x2 = curr.x + outDx * rr;
    const y2 = curr.y + outDy * rr;
    d += ` L ${x1} ${y1} Q ${curr.x} ${curr.y} ${x2} ${y2}`;
  }
  const last = pts[pts.length - 1];
  d += ` L ${last.x} ${last.y}`;
  return d;
}

/** How many chars of given pixel-per-char width fit in a card of width `w`,
 *  after subtracting `inset` for paddings/icons. */
function charsForWidth(w: number, pxPerChar: number, inset: number): number {
  return Math.max(14, Math.floor((w - inset) / pxPerChar));
}
