"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { select } from "d3-selection";
import { zoom, zoomIdentity, type ZoomBehavior } from "d3-zoom";
import dagre from "@dagrejs/dagre";
import { cn } from "@/lib/utils";
import {
  parseMermaid,
  type FlowGraph,
  type SequenceGraph,
  type ErGraph,
  type FlowNode,
  type FlowEdge,
} from "@/lib/diagram/parseMermaid";

/**
 * EditorialDiagram — the Diagrams tab's renderer. Replaces Mermaid with
 * a custom SVG that uses the same vocabulary as SystemDiagram on the
 * Design tab: paper fill, ink-at-18% borders, near-square corners,
 * vermillion arrowheads + travelling dots, mono technology stamps,
 * Simple Icons brand marks where the label matches a known service.
 *
 * Internally dispatches to one of three layouts based on diagram kind:
 *  - flow      → flowchart / c4-context / c4-container / deployment / data-flow
 *  - sequence  → sequenceDiagram
 *  - er        → erDiagram
 *
 * Flow diagrams use dagre for auto-layout: ranks are assigned by edge
 * direction, edges are routed with anti-collision, and edge labels
 * reserve their own space in the layout so they never sit on top of a
 * node. Per-node sizes are computed from label length so titles never
 * overflow their card. Spacing can be overridden via the `layout` prop
 * for projects that want denser or roomier diagrams.
 */

export type FlowLayoutConfig = {
  /** Gap between sibling nodes on the same rank (px). */
  nodeSep: number;
  /** Gap between ranks — controls how much room edges + labels get (px). */
  rankSep: number;
  /** Gap between parallel edges (px). */
  edgeSep: number;
  /** Outer margin around the whole graph (px). */
  marginX: number;
  marginY: number;
  /** Min node width / height — cards never shrink below these (px). */
  minNodeW: number;
  minNodeH: number;
  /** Per-side internal padding of a node card (px). */
  paddingX: number;
  paddingY: number;
};

const FLOW_LAYOUT_DEFAULTS: FlowLayoutConfig = {
  nodeSep: 72,
  rankSep: 132,
  edgeSep: 28,
  marginX: 48,
  marginY: 48,
  minNodeW: 196,
  minNodeH: 92,
  paddingX: 28,
  paddingY: 14,
};

export function EditorialDiagram({
  chart,
  className,
  layout,
}: {
  chart: string;
  className?: string;
  /** Optional override of layout knobs — lets a project tune spacing. */
  layout?: Partial<FlowLayoutConfig>;
}) {
  const graph = useMemo(() => parseMermaid(stripClassDefs(chart)), [chart]);
  const cfg: FlowLayoutConfig = { ...FLOW_LAYOUT_DEFAULTS, ...layout };

  if (graph.kind === "unknown") {
    return (
      <div className={cn("w-full p-6 bg-[hsl(var(--paper-2))] border border-[hsl(var(--line))]", className)}>
        <p className="eyebrow text-[hsl(var(--bad))]">Diagram parse error</p>
        <p className="mt-2 font-mono text-[12px] text-[hsl(var(--ink-2))]">{graph.reason}</p>
      </div>
    );
  }
  if (graph.kind === "flow") return <FlowCanvas graph={graph} cfg={cfg} className={className} />;
  if (graph.kind === "sequence") return <SequenceCanvas graph={graph} className={className} />;
  return <ErCanvas graph={graph} className={className} />;
}

/* ════════════════════════ shared helpers ════════════════════════ */

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
  { match: /notion/i,                        slug: "notion" },
  { match: /google workspace|gmail|google docs/i, slug: "googleworkspace" },
  { match: /vertex|gemini|bigquery|pub\/?sub|cloud (run|cdn|storage|tasks|monitoring|trace|logging|armor|load balancer)|\bgcs\b|firestore|google cloud|gcp\b/i, slug: "googlecloud" },
  { match: /\baws\b|amazon web/i,            slug: "amazonwebservices" },
  { match: /azure|microsoft/i,               slug: "microsoftazure" },
  { match: /cloudflare/i,                    slug: "cloudflare" },
  { match: /vercel/i,                        slug: "vercel" },
  { match: /supabase/i,                      slug: "supabase" },
];
const LOGO_INK = "1A1C22";

function techLogo(text: string): string | null {
  for (const r of TECH_LOGO_RULES) if (r.match.test(text)) return r.slug;
  return null;
}

function stripClassDefs(chart: string): string {
  return chart
    .split("\n")
    .filter((l) => !/^\s*classDef\b/i.test(l) && !/^\s*style\b/i.test(l) && !/^\s*linkStyle\b/i.test(l))
    .join("\n");
}

function trim(s: string, max: number) {
  return s.length > max ? s.slice(0, max - 1).trimEnd() + "…" : s;
}

function hashStr(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Build an orthogonal path string with rounded inner corners. */
function orthoPath(pts: { x: number; y: number }[], r: number): string {
  if (pts.length < 2) return "";
  if (pts.length === 2) return `M ${pts[0].x} ${pts[0].y} L ${pts[1].x} ${pts[1].y}`;
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const prev = pts[i - 1];
    const cur = pts[i];
    const next = pts[i + 1];
    const dx1 = Math.sign(cur.x - prev.x), dy1 = Math.sign(cur.y - prev.y);
    const dx2 = Math.sign(next.x - cur.x), dy2 = Math.sign(next.y - cur.y);
    const inLen = Math.hypot(cur.x - prev.x, cur.y - prev.y);
    const outLen = Math.hypot(next.x - cur.x, next.y - cur.y);
    const rr = Math.max(0, Math.min(r, inLen / 2, outLen / 2));
    const sx = cur.x - dx1 * rr, sy = cur.y - dy1 * rr;
    const ex = cur.x + dx2 * rr, ey = cur.y + dy2 * rr;
    d += ` L ${sx} ${sy} Q ${cur.x} ${cur.y} ${ex} ${ey}`;
  }
  const last = pts[pts.length - 1];
  d += ` L ${last.x} ${last.y}`;
  return d;
}

function fitTo(
  svg: ReturnType<typeof select<SVGSVGElement, unknown>>,
  z: ZoomBehavior<SVGSVGElement, unknown>,
  el: SVGSVGElement,
  totalW: number,
  totalH: number,
  animate = false,
  maxK = 1.9,
) {
  const w = el.clientWidth || 1200;
  const h = el.clientHeight || 800;
  const PAD = 12;
  const k = Math.min((w - PAD * 2) / totalW, (h - PAD * 2) / totalH, maxK);
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

function ZoomControls({ onIn, onOut, onFit }: { onIn: () => void; onOut: () => void; onFit: () => void }) {
  return (
    <div className="absolute right-3 bottom-3 flex flex-col items-stretch border border-[hsl(var(--line-2))] bg-[hsl(var(--paper))] rounded-md overflow-hidden">
      <button onClick={onIn}  className="ms text-[16px] px-2 py-1 hover:bg-[hsl(var(--paper-2))]" aria-label="Zoom in">add</button>
      <button onClick={onFit} className="ms text-[16px] px-2 py-1 hover:bg-[hsl(var(--paper-2))] border-y border-[hsl(var(--line))]" aria-label="Fit">center_focus_strong</button>
      <button onClick={onOut} className="ms text-[16px] px-2 py-1 hover:bg-[hsl(var(--paper-2))]" aria-label="Zoom out">remove</button>
    </div>
  );
}

const TYPO_CSS = `
  .ed-eyebrow { font: 700 9.5px/1 var(--font-mono), monospace; letter-spacing: 0.22em; text-transform: uppercase; }
  .ed-lane    { font: 600 15px/1 var(--font-display), system-ui, sans-serif; letter-spacing: -0.02em; }
  .ed-stamp   { font: 500 10px/1 var(--font-mono), monospace; letter-spacing: 0.08em; }
  .ed-title   { font: 600 14.5px/1.15 var(--font-display), system-ui, sans-serif; letter-spacing: -0.02em; }
  .ed-tech    { font: 500 10.5px/1 var(--font-mono), monospace; letter-spacing: 0.04em; text-transform: uppercase; }
  .ed-edge    { font: 600 10px/1 var(--font-mono), monospace; letter-spacing: 0.08em; text-transform: uppercase; }
  .ed-actor   { font: 600 13px/1 var(--font-display), system-ui, sans-serif; letter-spacing: -0.02em; }
  .ed-note    { font: 400 11.5px/1.3 var(--font-ui), system-ui, sans-serif; }
  .ed-field   { font: 500 10.5px/1 var(--font-mono), monospace; letter-spacing: 0.02em; }
  .ed-key     { font: 700 8.5px/1 var(--font-mono), monospace; letter-spacing: 0.12em; }
`;

const ARROW_DEFS = (
  <defs>
    <pattern id="ed-dot-grid" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
      <circle cx="1" cy="1" r="0.8" fill="hsl(var(--line-2))" />
    </pattern>
    <marker id="ed-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 Z" fill="hsl(var(--accent))" />
    </marker>
  </defs>
);

/* ════════════════════════ FLOW ════════════════════════ */

function FlowCanvas({ graph, cfg, className }: { graph: FlowGraph; cfg: FlowLayoutConfig; className?: string }) {
  const [hovered, setHovered] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const gRef = useRef<SVGGElement | null>(null);
  const zoomBehavior = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  const layout = useMemo(() => layoutFlow(graph, cfg), [graph, cfg]);

  useEffect(() => {
    if (!svgRef.current || !gRef.current) return;
    const svg = select(svgRef.current);
    const g = select(gRef.current);
    const z = zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 2.5])
      .on("zoom", (e) => g.attr("transform", e.transform.toString()));
    zoomBehavior.current = z;
    svg.call(z);
    fitTo(svg as unknown as ReturnType<typeof select<SVGSVGElement, unknown>>, z, svgRef.current, layout.totalW, layout.totalH);
    return () => { svg.on(".zoom", null); };
  }, [layout.totalW, layout.totalH]);

  const fit = () => {
    if (!svgRef.current || !zoomBehavior.current) return;
    fitTo(select(svgRef.current), zoomBehavior.current, svgRef.current, layout.totalW, layout.totalH, true);
  };
  const zoomBy = (k: number) => {
    if (!svgRef.current || !zoomBehavior.current) return;
    select(svgRef.current).transition().duration(220).call(zoomBehavior.current.scaleBy, k);
  };

  return (
    <div className={cn("relative overflow-hidden h-[min(74vh,860px)] bg-[hsl(var(--card))] border border-[hsl(var(--line))] rounded-[2px]", className)}>
      <svg ref={svgRef} className="block w-full h-full select-none">
        {ARROW_DEFS}
        <rect width="100%" height="100%" fill="url(#ed-dot-grid)" opacity="0.5" />
        <g ref={gRef}>
          {/* Groups (clusters) */}
          {layout.groups.map((g) => (
            <g key={g.id}>
              <rect
                x={g.x} y={g.y} width={g.w} height={g.h}
                rx={2} ry={2}
                fill="hsl(var(--paper))"
                stroke="hsl(var(--ink) / 0.10)"
                strokeDasharray="2 3"
              />
              <text x={g.x + 14} y={g.y + 22} className="ed-lane" fill="hsl(var(--ink))">{g.label}</text>
            </g>
          ))}

          {/* Edges */}
          {layout.edges.map((e, i) => {
            const hot = hovered && (hovered === e.from || hovered === e.to);
            return (
              <g key={i} className={cn("transition-opacity", hovered && !hot && "opacity-20")}>
                <path d={e.d} fill="none" stroke="hsl(var(--paper))" strokeWidth={5.5} strokeLinecap="round" strokeLinejoin="round" />
                <path
                  d={e.d}
                  fill="none"
                  stroke="hsl(var(--ink))"
                  strokeOpacity={hot ? 1 : 0.78}
                  strokeWidth={hot ? 2 : 1.5}
                  strokeDasharray={e.dashed ? "5 3" : undefined}
                  strokeLinecap="round" strokeLinejoin="round"
                  markerEnd="url(#ed-arrow)"
                />
                <circle r={hot ? 4 : 3.2} fill="hsl(var(--accent))">
                  <animateMotion dur={`${2.2 + (hashStr(`${e.from}-${e.to}-${i}`) % 18) / 10}s`} repeatCount="indefinite" rotate="auto" path={e.d} />
                </circle>
                {e.label && e.labelAt && (
                  <g transform={`translate(${e.labelAt.x}, ${e.labelAt.y})`}>
                    <rect
                      x={-(e.labelW ?? 60) / 2}
                      y={-(e.labelH ?? 16) / 2}
                      width={e.labelW ?? 60}
                      height={e.labelH ?? 16}
                      fill="hsl(var(--paper))"
                      stroke="hsl(var(--ink) / 0.10)"
                      strokeWidth={0.75}
                    />
                    <text className="ed-edge" textAnchor="middle" dominantBaseline="middle" fill="hsl(var(--ink) / 0.72)">{e.label}</text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Nodes */}
          {layout.nodes.map((n, i) => {
            const isHot = hovered === n.id;
            const slug = techLogo(n.label);
            const isDecision = n.shape === "rhombus";
            const isActor = n.shape === "stadium" || n.shape === "round";
            const isStore = n.shape === "cylinder";
            return (
              <g
                key={n.id}
                transform={`translate(${n.x}, ${n.y})`}
                onMouseEnter={() => setHovered(n.id)}
                onMouseLeave={() => setHovered(null)}
                className="cursor-pointer"
              >
                {isDecision ? (
                  <polygon
                    points={`${n.w / 2},0 ${n.w},${n.h / 2} ${n.w / 2},${n.h} 0,${n.h / 2}`}
                    fill="hsl(var(--paper))"
                    stroke={isHot ? "hsl(var(--ink) / 0.55)" : "hsl(var(--ink) / 0.18)"}
                    strokeWidth={1}
                  />
                ) : (
                  <rect
                    width={n.w}
                    height={n.h}
                    rx={isActor ? n.h / 2 : 2}
                    ry={isActor ? n.h / 2 : 2}
                    fill="hsl(var(--paper))"
                    stroke={isHot ? "hsl(var(--ink) / 0.55)" : "hsl(var(--ink) / 0.18)"}
                    strokeWidth={1}
                  />
                )}
                {isStore && (
                  <ellipse cx={n.w / 2} cy={6} rx={n.w / 2 - 1} ry={4} fill="hsl(var(--paper))" stroke="hsl(var(--ink) / 0.18)" />
                )}
                <text x={14} y={20} className="ed-stamp" fill="hsl(var(--ink) / 0.45)">
                  {String(i + 1).padStart(2, "0")}
                </text>
                {slug && (
                  <image
                    href={`https://cdn.simpleicons.org/${slug}/${LOGO_INK}`}
                    x={n.w - 28}
                    y={10}
                    width={18}
                    height={18}
                    opacity={isHot ? 1 : 0.85}
                    preserveAspectRatio="xMidYMid meet"
                  />
                )}
                <text x={n.w / 2} y={n.h / 2 + 4} textAnchor="middle" className="ed-title" fill="hsl(var(--ink))">
                  {trim(splitFirst(n.label), 26)}
                </text>
                {splitRest(n.label) && (
                  <text x={n.w / 2} y={n.h / 2 + 22} textAnchor="middle" className="ed-tech" fill="hsl(var(--ink) / 0.55)">
                    {trim(splitRest(n.label), 30)}
                  </text>
                )}
              </g>
            );
          })}
        </g>

        <style>{TYPO_CSS}</style>
      </svg>

      <Corner pos="tl" label="D-02" />
      <Corner pos="tr" label="REV A" />
      <Corner pos="bl" label="§ Tessar" />
      <Corner pos="br" label={`${layout.nodes.length} parts · ${layout.edges.length} wires`} />

      <ZoomControls onIn={() => zoomBy(1.2)} onOut={() => zoomBy(1 / 1.2)} onFit={fit} />
    </div>
  );
}

function splitFirst(label: string): string {
  return label.split(" · ")[0];
}
function splitRest(label: string): string | undefined {
  const parts = label.split(" · ");
  return parts.length > 1 ? parts.slice(1).join(" · ") : undefined;
}

type LaidNode = { id: string; label: string; shape: FlowNode["shape"]; x: number; y: number; w: number; h: number };
type LaidEdge = {
  from: string;
  to: string;
  d: string;
  label?: string;
  dashed?: boolean;
  labelAt?: { x: number; y: number };
  labelW?: number;
  labelH?: number;
};
type LaidGroup = { id: string; label: string; x: number; y: number; w: number; h: number };

/**
 * layoutFlow — dagre auto-layout.
 *
 * Each node is sized to fit its actual label content (title + tech),
 * subgraphs become dagre clusters so members get grouped within a band,
 * edges are routed by dagre with anti-collision, and edge labels reserve
 * their own space so they never land on top of a node.
 *
 * Everything important (spacing, padding, min sizes) is driven by `cfg`
 * so a project can tune density without touching this file.
 */
function layoutFlow(graph: FlowGraph, cfg: FlowLayoutConfig): {
  nodes: LaidNode[];
  edges: LaidEdge[];
  groups: LaidGroup[];
  totalW: number;
  totalH: number;
} {
  const rankdir = graph.direction === "LR" || graph.direction === "RL" ? "LR" : "TB";

  const g = new dagre.graphlib.Graph({ compound: true, multigraph: false });
  g.setGraph({
    rankdir,
    nodesep: cfg.nodeSep,
    ranksep: cfg.rankSep,
    edgesep: cfg.edgeSep,
    marginx: cfg.marginX,
    marginy: cfg.marginY,
    ranker: "network-simplex",
    align: "UL",
  });
  g.setDefaultEdgeLabel(() => ({}));

  // Register subgraphs as dagre clusters so members get grouped.
  const clusterIds = new Set<string>();
  for (const grp of graph.groups) {
    clusterIds.add(grp.id);
    g.setNode(grp.id, {
      label: grp.label,
      clusterLabelPos: "top",
      paddingTop: 28,
      paddingBottom: 12,
      paddingLeft: 14,
      paddingRight: 14,
    });
    if (grp.parent) g.setParent(grp.id, grp.parent);
  }

  // Register nodes with measured sizes.
  for (const n of graph.nodes) {
    const { w, h } = measureFlowNode(n, cfg);
    g.setNode(n.id, { label: n.label, width: w, height: h });
    if (n.group && clusterIds.has(n.group)) g.setParent(n.id, n.group);
  }

  // Register edges. Reserve label box so dagre routes around it.
  const edgeMeta = new Map<string, FlowEdge>();
  for (const e of graph.edges) {
    const key = `${e.from}\u0001${e.to}`;
    edgeMeta.set(key, e);
    const label = e.label?.trim() ?? "";
    const labelW = label ? Math.max(46, label.length * 7.0 + 16) : 0;
    const labelH = label ? 18 : 0;
    g.setEdge(e.from, e.to, {
      label,
      width: labelW,
      height: labelH,
      labelpos: "c",
      labeloffset: 0,
    });
  }

  dagre.layout(g);

  // Extract groups + nodes (dagre returns center coordinates).
  const placedNodes: LaidNode[] = [];
  const placedGroups: LaidGroup[] = [];
  for (const id of g.nodes()) {
    const meta = g.node(id);
    if (!meta) continue;
    const x = meta.x - meta.width / 2;
    const y = meta.y - meta.height / 2;
    if (clusterIds.has(id)) {
      const grp = graph.groups.find((gg) => gg.id === id);
      placedGroups.push({ id, label: grp?.label ?? id, x, y, w: meta.width, h: meta.height });
    } else {
      const fn = graph.nodes.find((nn) => nn.id === id);
      if (!fn) continue;
      placedNodes.push({ id, label: fn.label, shape: fn.shape, x, y, w: meta.width, h: meta.height });
    }
  }

  // Extract edges with dagre's points + label position.
  const placedEdges: LaidEdge[] = [];
  for (const e of g.edges()) {
    const meta = g.edge(e);
    if (!meta || !meta.points || meta.points.length < 2) continue;
    const orig = edgeMeta.get(`${e.v}\u0001${e.w}`);
    const pts = meta.points;
    const d = smoothFlowPath(pts);
    const hasLabel = typeof meta.label === "string" && meta.label.length > 0
      && typeof meta.x === "number" && typeof meta.y === "number";
    placedEdges.push({
      from: e.v,
      to: e.w,
      d,
      label: orig?.label,
      dashed: orig?.dashed,
      labelAt: hasLabel ? { x: meta.x as number, y: meta.y as number } : undefined,
      labelW: hasLabel ? (meta.width as number) : undefined,
      labelH: hasLabel ? (meta.height as number) : undefined,
    });
  }

  const graphMeta = g.graph();
  const totalW = (graphMeta.width as number) || 1200;
  const totalH = (graphMeta.height as number) || 800;
  return { nodes: placedNodes, edges: placedEdges, groups: placedGroups, totalW, totalH };
}

/**
 * Size a flow node so its label fits with comfortable padding. Bricolage
 * Grotesque at 14.5px averages ~7.4px/char; mono at 10.5px averages
 * ~6.8px/char. Returns the bounding box dagre will use, including extra
 * room for shapes that crop their content (rhombus, cylinder).
 */
function measureFlowNode(n: FlowNode, cfg: FlowLayoutConfig): { w: number; h: number } {
  const title = splitFirst(n.label);
  const tech = splitRest(n.label);
  const titlePx = title.length * 7.6;
  const techPx = tech ? tech.length * 6.8 : 0;
  const logoSlot = techLogo(n.label) ? 30 : 0;
  let w = Math.max(cfg.minNodeW, cfg.paddingX * 2 + Math.max(titlePx, techPx) + logoSlot);
  let h = Math.max(cfg.minNodeH, cfg.paddingY * 2 + 18 /*stamp*/ + (tech ? 38 : 22));
  if (n.shape === "rhombus") {
    // diamond: usable interior is the inscribed rectangle (~0.7 of bbox)
    w = Math.round(w * 1.35);
    h = Math.round(h * 1.25);
  } else if (n.shape === "cylinder") {
    h += 10; // leave room for the top ellipse
  } else if (n.shape === "stadium" || n.shape === "round") {
    w += 8; // pills get a little extra hug
  }
  return { w, h };
}

/**
 * Build a smooth path through dagre's polyline points. dagre returns a
 * sequence of waypoints that includes the source/target ports plus any
 * bends — a quadratic-bezier-through-midpoints draws a soft cable that
 * still hits every waypoint visually.
 */
function smoothFlowPath(pts: { x: number; y: number }[]): string {
  if (pts.length === 2) return `M ${pts[0].x} ${pts[0].y} L ${pts[1].x} ${pts[1].y}`;
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i].x + pts[i + 1].x) / 2;
    const my = (pts[i].y + pts[i + 1].y) / 2;
    d += ` Q ${pts[i].x} ${pts[i].y} ${mx} ${my}`;
  }
  const last = pts[pts.length - 1];
  d += ` L ${last.x} ${last.y}`;
  return d;
}

/* ════════════════════════ SEQUENCE ════════════════════════ */

const SEQ_PARTICIPANT_W = 168;
const SEQ_PARTICIPANT_H = 48;
const SEQ_GAP_X = 72;
const SEQ_HEADER_Y = 36;
const SEQ_ROW_H = 56;
const SEQ_PAD = 32;

function SequenceCanvas({ graph, className }: { graph: SequenceGraph; className?: string }) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const gRef = useRef<SVGGElement | null>(null);
  const zoomBehavior = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  const layout = useMemo(() => layoutSequence(graph), [graph]);

  useEffect(() => {
    if (!svgRef.current || !gRef.current) return;
    const svg = select(svgRef.current);
    const g = select(gRef.current);
    const z = zoom<SVGSVGElement, unknown>().scaleExtent([0.4, 2.5]).on("zoom", (e) => g.attr("transform", e.transform.toString()));
    zoomBehavior.current = z;
    svg.call(z);
    fitTo(svg as unknown as ReturnType<typeof select<SVGSVGElement, unknown>>, z, svgRef.current, layout.totalW, layout.totalH);
    return () => { svg.on(".zoom", null); };
  }, [layout.totalW, layout.totalH]);

  const fit = () => svgRef.current && zoomBehavior.current && fitTo(select(svgRef.current), zoomBehavior.current, svgRef.current, layout.totalW, layout.totalH, true);
  const zoomBy = (k: number) => svgRef.current && zoomBehavior.current && select(svgRef.current).transition().duration(220).call(zoomBehavior.current.scaleBy, k);

  return (
    <div className={cn("relative overflow-hidden h-[min(74vh,860px)] bg-[hsl(var(--card))] border border-[hsl(var(--line))] rounded-[2px]", className)}>
      <svg ref={svgRef} className="block w-full h-full select-none">
        {ARROW_DEFS}
        <rect width="100%" height="100%" fill="url(#ed-dot-grid)" opacity="0.5" />
        <g ref={gRef}>
          {/* Lifelines */}
          {layout.participants.map((p) => (
            <line
              key={`life-${p.id}`}
              x1={p.cx} y1={p.lifelineTop}
              x2={p.cx} y2={layout.lifelineBottom}
              stroke="hsl(var(--ink) / 0.12)"
              strokeDasharray="3 4"
            />
          ))}
          {/* Participant cards */}
          {layout.participants.map((p, i) => {
            const slug = techLogo(p.label);
            return (
              <g key={p.id} transform={`translate(${p.x}, ${p.y})`}>
                <rect
                  width={SEQ_PARTICIPANT_W} height={SEQ_PARTICIPANT_H}
                  rx={2} ry={2}
                  fill="hsl(var(--paper))"
                  stroke="hsl(var(--ink) / 0.18)"
                />
                <text x={12} y={16} className="ed-stamp" fill="hsl(var(--ink) / 0.45)">{String(i + 1).padStart(2, "0")}</text>
                {slug && (
                  <image href={`https://cdn.simpleicons.org/${slug}/${LOGO_INK}`} x={SEQ_PARTICIPANT_W - 26} y={8} width={16} height={16} opacity="0.85" preserveAspectRatio="xMidYMid meet" />
                )}
                <text x={SEQ_PARTICIPANT_W / 2} y={32} textAnchor="middle" className="ed-actor" fill="hsl(var(--ink))">
                  {trim(p.label, 22)}
                </text>
              </g>
            );
          })}

          {/* Items */}
          {layout.items.map((it, i) => {
            if (it.kind === "msg") {
              const m = it;
              const arrowMid = { x: (m.x1 + m.x2) / 2, y: m.y };
              return (
                <g key={i}>
                  <path d={`M ${m.x1} ${m.y} L ${m.x2} ${m.y}`}
                    fill="none" stroke="hsl(var(--paper))" strokeWidth={5.5} />
                  <path d={`M ${m.x1} ${m.y} L ${m.x2} ${m.y}`}
                    fill="none" stroke="hsl(var(--ink))" strokeOpacity={0.78} strokeWidth={1.5}
                    strokeDasharray={m.dashed ? "5 3" : undefined}
                    markerEnd="url(#ed-arrow)" />
                  <circle r={3.2} fill="hsl(var(--accent))">
                    <animateMotion dur={`${1.6 + (hashStr(m.text) % 12) / 10}s`} repeatCount="indefinite" path={`M ${m.x1} ${m.y} L ${m.x2} ${m.y}`} />
                  </circle>
                  <g transform={`translate(${arrowMid.x}, ${arrowMid.y - 10})`}>
                    <rect x={-m.text.length * 3.1 - 6} y={-7} width={m.text.length * 6.2 + 12} height={14} fill="hsl(var(--paper))" stroke="hsl(var(--ink) / 0.10)" />
                    <text className="ed-edge" textAnchor="middle" dominantBaseline="middle" fill="hsl(var(--ink) / 0.7)">{trim(m.text, 48)}</text>
                  </g>
                </g>
              );
            }
            if (it.kind === "selfMsg") {
              const m = it;
              const loopX = m.x + 28;
              const path = `M ${m.x} ${m.y} L ${loopX} ${m.y} L ${loopX} ${m.y + 18} L ${m.x} ${m.y + 18}`;
              return (
                <g key={i}>
                  <path d={path} fill="none" stroke="hsl(var(--paper))" strokeWidth={5.5} />
                  <path d={path} fill="none" stroke="hsl(var(--ink))" strokeOpacity={0.78} strokeWidth={1.5}
                    strokeDasharray={m.dashed ? "5 3" : undefined} markerEnd="url(#ed-arrow)" />
                  <text x={loopX + 6} y={m.y + 12} className="ed-edge" fill="hsl(var(--ink) / 0.7)">{trim(m.text, 60)}</text>
                </g>
              );
            }
            if (it.kind === "note") {
              return (
                <g key={i}>
                  <rect x={it.x} y={it.y} width={it.w} height={it.h} fill="hsl(var(--paper-2))" stroke="hsl(var(--ink) / 0.18)" rx={2} ry={2} />
                  <text x={it.x + 12} y={it.y + 16} className="ed-stamp" fill="hsl(var(--accent))">§ note</text>
                  <text x={it.x + 12} y={it.y + 32} className="ed-note" fill="hsl(var(--ink))">{trim(it.text, 100)}</text>
                </g>
              );
            }
            return null;
          })}
        </g>
        <style>{TYPO_CSS}</style>
      </svg>

      <Corner pos="tl" label="D-02" />
      <Corner pos="tr" label="REV A" />
      <Corner pos="bl" label="§ Tessar" />
      <Corner pos="br" label={`${layout.participants.length} actors · ${layout.items.length} steps`} />
      <ZoomControls onIn={() => zoomBy(1.2)} onOut={() => zoomBy(1 / 1.2)} onFit={fit} />
    </div>
  );
}

type SeqLaidParticipant = { id: string; label: string; x: number; y: number; cx: number; lifelineTop: number };
type SeqLaidItem =
  | { kind: "msg"; x1: number; x2: number; y: number; text: string; dashed: boolean }
  | { kind: "selfMsg"; x: number; y: number; text: string; dashed: boolean }
  | { kind: "note"; x: number; y: number; w: number; h: number; text: string };

function layoutSequence(graph: SequenceGraph): {
  participants: SeqLaidParticipant[];
  items: SeqLaidItem[];
  lifelineBottom: number;
  totalW: number;
  totalH: number;
} {
  const participants: SeqLaidParticipant[] = graph.participants.map((p, i) => {
    const x = SEQ_PAD + i * (SEQ_PARTICIPANT_W + SEQ_GAP_X);
    return { id: p.id, label: p.label, x, y: SEQ_HEADER_Y, cx: x + SEQ_PARTICIPANT_W / 2, lifelineTop: SEQ_HEADER_Y + SEQ_PARTICIPANT_H };
  });
  const idxOf = new Map(participants.map((p, i) => [p.id, i]));

  let cursorY = SEQ_HEADER_Y + SEQ_PARTICIPANT_H + 32;
  const items: SeqLaidItem[] = [];
  for (const it of graph.items) {
    if (it.kind === "msg") {
      const fIdx = idxOf.get(it.msg.from);
      const tIdx = idxOf.get(it.msg.to);
      if (fIdx === undefined || tIdx === undefined) continue;
      if (it.msg.selfLoop) {
        const p = participants[fIdx];
        items.push({ kind: "selfMsg", x: p.cx, y: cursorY, text: it.msg.text, dashed: it.msg.dashed });
        cursorY += SEQ_ROW_H;
      } else {
        const a = participants[fIdx];
        const b = participants[tIdx];
        items.push({ kind: "msg", x1: a.cx, x2: b.cx, y: cursorY, text: it.msg.text, dashed: it.msg.dashed });
        cursorY += SEQ_ROW_H;
      }
    } else {
      const overIdxs = it.note.over.map((id) => idxOf.get(id)).filter((v): v is number => v !== undefined);
      if (overIdxs.length === 0) continue;
      const minIdx = Math.min(...overIdxs);
      const maxIdx = Math.max(...overIdxs);
      const a = participants[minIdx];
      const b = participants[maxIdx];
      const x = a.cx - 80;
      const w = (b.cx - a.cx) + 160;
      items.push({ kind: "note", x, y: cursorY, w, h: 44, text: it.note.text });
      cursorY += 56;
    }
  }

  const lifelineBottom = cursorY + 12;
  const totalW = SEQ_PAD * 2 + Math.max(0, participants.length - 1) * (SEQ_PARTICIPANT_W + SEQ_GAP_X) + SEQ_PARTICIPANT_W;
  const totalH = lifelineBottom + SEQ_PAD;
  return { participants, items, lifelineBottom, totalW, totalH };
}

/* ════════════════════════ ER ════════════════════════ */

const ER_W = 240;
const ER_HEAD = 32;
const ER_FIELD_H = 18;
const ER_PAD = 36;
const ER_GAP = 32;

function ErCanvas({ graph, className }: { graph: ErGraph; className?: string }) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const gRef = useRef<SVGGElement | null>(null);
  const zoomBehavior = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  const layout = useMemo(() => layoutEr(graph), [graph]);

  useEffect(() => {
    if (!svgRef.current || !gRef.current) return;
    const svg = select(svgRef.current);
    const g = select(gRef.current);
    const z = zoom<SVGSVGElement, unknown>().scaleExtent([0.4, 2.5]).on("zoom", (e) => g.attr("transform", e.transform.toString()));
    zoomBehavior.current = z;
    svg.call(z);
    fitTo(svg as unknown as ReturnType<typeof select<SVGSVGElement, unknown>>, z, svgRef.current, layout.totalW, layout.totalH);
    return () => { svg.on(".zoom", null); };
  }, [layout.totalW, layout.totalH]);

  const fit = () => svgRef.current && zoomBehavior.current && fitTo(select(svgRef.current), zoomBehavior.current, svgRef.current, layout.totalW, layout.totalH, true);
  const zoomBy = (k: number) => svgRef.current && zoomBehavior.current && select(svgRef.current).transition().duration(220).call(zoomBehavior.current.scaleBy, k);

  return (
    <div className={cn("relative overflow-hidden h-[min(74vh,860px)] bg-[hsl(var(--card))] border border-[hsl(var(--line))] rounded-[2px]", className)}>
      <svg ref={svgRef} className="block w-full h-full select-none">
        {ARROW_DEFS}
        <rect width="100%" height="100%" fill="url(#ed-dot-grid)" opacity="0.5" />
        <g ref={gRef}>
          {/* Edges first */}
          {layout.edges.map((e, i) => (
            <g key={i}>
              <path d={e.d} fill="none" stroke="hsl(var(--paper))" strokeWidth={5.5} />
              <path d={e.d} fill="none" stroke="hsl(var(--ink))" strokeOpacity={0.78} strokeWidth={1.5} markerEnd="url(#ed-arrow)" />
              {e.label && e.labelAt && (
                <g transform={`translate(${e.labelAt.x}, ${e.labelAt.y})`}>
                  <rect x={-e.label.length * 3.1 - 6} y={-7} width={e.label.length * 6.2 + 12} height={14} fill="hsl(var(--paper))" stroke="hsl(var(--ink) / 0.10)" />
                  <text className="ed-edge" textAnchor="middle" dominantBaseline="middle" fill="hsl(var(--ink) / 0.7)">{trim(e.label, 30)}</text>
                </g>
              )}
            </g>
          ))}

          {/* Entities */}
          {layout.entities.map((ent, idx) => (
            <g key={ent.id} transform={`translate(${ent.x}, ${ent.y})`}>
              <rect width={ent.w} height={ent.h} rx={2} ry={2} fill="hsl(var(--paper))" stroke="hsl(var(--ink) / 0.18)" />
              <rect width={ent.w} height={ER_HEAD} rx={2} ry={2} fill="hsl(var(--paper-2))" stroke="hsl(var(--ink) / 0.18)" />
              <text x={12} y={20} className="ed-stamp" fill="hsl(var(--ink) / 0.45)">{String(idx + 1).padStart(2, "0")}</text>
              <text x={ent.w / 2} y={20} textAnchor="middle" className="ed-title" fill="hsl(var(--ink))">{ent.id}</text>
              {ent.fields.map((f, fi) => (
                <g key={fi} transform={`translate(0, ${ER_HEAD + fi * ER_FIELD_H})`}>
                  {fi % 2 === 1 && <rect width={ent.w} height={ER_FIELD_H} fill="hsl(var(--ink) / 0.025)" />}
                  <text x={12} y={13} className="ed-field" fill="hsl(var(--ink))">{trim(f.name, 16)}</text>
                  <text x={ent.w - 12} y={13} textAnchor="end" className="ed-tech" fill="hsl(var(--ink) / 0.55)">{trim(f.type, 14)}</text>
                  {f.key && (
                    <g transform={`translate(${ent.w / 2 - 9}, 3)`}>
                      <rect width={18} height={11} rx={1} fill={f.key === "PK" ? "hsl(var(--accent) / 0.15)" : "hsl(var(--ink) / 0.08)"} />
                      <text x={9} y={8} textAnchor="middle" className="ed-key" fill={f.key === "PK" ? "hsl(var(--accent))" : "hsl(var(--ink) / 0.55)"}>{f.key}</text>
                    </g>
                  )}
                </g>
              ))}
            </g>
          ))}
        </g>
        <style>{TYPO_CSS}</style>
      </svg>

      <Corner pos="tl" label="D-02" />
      <Corner pos="tr" label="REV A" />
      <Corner pos="bl" label="§ Tessar" />
      <Corner pos="br" label={`${layout.entities.length} entities · ${layout.edges.length} relations`} />
      <ZoomControls onIn={() => zoomBy(1.2)} onOut={() => zoomBy(1 / 1.2)} onFit={fit} />
    </div>
  );
}

type LaidEntity = { id: string; fields: { name: string; type: string; key?: "PK" | "FK" }[]; x: number; y: number; w: number; h: number };
type LaidErEdge = { from: string; to: string; d: string; label?: string; labelAt?: { x: number; y: number } };

function layoutEr(graph: ErGraph): { entities: LaidEntity[]; edges: LaidErEdge[]; totalW: number; totalH: number } {
  // Simple grid layout: ceil(sqrt(N)) columns.
  const cols = Math.ceil(Math.sqrt(graph.entities.length || 1));
  const placed: LaidEntity[] = graph.entities.map((e, i) => {
    const r = Math.floor(i / cols);
    const c = i % cols;
    const h = ER_HEAD + Math.max(1, e.fields.length) * ER_FIELD_H + 6;
    return {
      id: e.id,
      fields: e.fields.map((f) => ({ name: f.name, type: f.type, key: f.key })),
      x: ER_PAD + c * (ER_W + ER_GAP),
      y: ER_PAD + r * 200, // we re-flow row heights below
      w: ER_W,
      h,
    };
  });
  // Re-flow: align rows by max height in each row.
  const rowMaxH: number[] = [];
  for (const e of placed) {
    const r = Math.floor((e.y - ER_PAD) / 200);
    rowMaxH[r] = Math.max(rowMaxH[r] ?? 0, e.h);
  }
  let cursorY = ER_PAD;
  const rowY: number[] = [];
  for (let i = 0; i < rowMaxH.length; i++) {
    rowY[i] = cursorY;
    cursorY += rowMaxH[i] + ER_GAP;
  }
  for (const e of placed) {
    const r = Math.floor((e.y - ER_PAD) / 200);
    e.y = rowY[r];
  }

  const byId = new Map(placed.map((p) => [p.id, p]));
  const edges: LaidErEdge[] = [];
  for (const r of graph.relations) {
    const a = byId.get(r.from);
    const b = byId.get(r.to);
    if (!a || !b) continue;
    const horiz = Math.abs(b.x - a.x) >= Math.abs(b.y - a.y);
    let pts: { x: number; y: number }[];
    let labelAt: { x: number; y: number };
    if (horiz) {
      const aRight = a.x < b.x;
      const ax = aRight ? a.x + a.w : a.x;
      const ay = a.y + a.h / 2;
      const bx = aRight ? b.x : b.x + b.w;
      const by = b.y + b.h / 2;
      const mx = (ax + bx) / 2;
      pts = [{ x: ax, y: ay }, { x: mx, y: ay }, { x: mx, y: by }, { x: bx, y: by }];
      labelAt = { x: mx, y: (ay + by) / 2 };
    } else {
      const aBelow = a.y < b.y;
      const ax = a.x + a.w / 2;
      const ay = aBelow ? a.y + a.h : a.y;
      const bx = b.x + b.w / 2;
      const by = aBelow ? b.y : b.y + b.h;
      const my = (ay + by) / 2;
      pts = [{ x: ax, y: ay }, { x: ax, y: my }, { x: bx, y: my }, { x: bx, y: by }];
      labelAt = { x: (ax + bx) / 2, y: my };
    }
    edges.push({ from: r.from, to: r.to, d: orthoPath(pts, 8), label: r.label, labelAt });
  }
  const totalW = ER_PAD * 2 + cols * ER_W + (cols - 1) * ER_GAP;
  const totalH = cursorY + ER_PAD;
  return { entities: placed, edges, totalW, totalH };
}
