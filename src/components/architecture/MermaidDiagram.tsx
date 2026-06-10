"use client";

import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { sanitizeMermaid } from "@/lib/diagram/sanitizeMermaid";

let mermaidInitialized = false;

// Tech-logo resolver (Simple Icons slug from free-form node text).
// Order matters — more specific keywords first.
const MERMAID_LOGO_RULES: { match: RegExp; slug: string }[] = [
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

function mermaidTechLogo(text: string): string | null {
  for (const r of MERMAID_LOGO_RULES) if (r.match.test(text)) return r.slug;
  return null;
}

// Strip any `classDef ...` lines from a Mermaid chart so charts authored
// elsewhere (sample data, AI output) can't force their own colors and
// override the editorial theme. `class X foo` lines are kept; they just
// become no-ops without their classDef.
function stripClassDefs(chart: string): string {
  return chart
    .split("\n")
    .filter((line) => !/^\s*classDef\b/i.test(line))
    .join("\n");
}

// Editorial palette injected into mermaid SVG (paper / ink / vermillion).
// We use literal fallback fonts (not CSS vars) so mermaid measures glyph
// widths against the same font it renders with — otherwise labels clip.
const MERMAID_FONT = "Manrope, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
// Border colour: ink @ 18% over paper, flattened so mermaid kinds that
// render inline strokes (sequence / C4) match SystemDiagram's lighter feel.
const INK_18 = "#D1CEC7";
const INK_10 = "#E2E0D9";
const THEME = {
  primaryColor: "#FAF6EC",        // paper
  primaryTextColor: "#16181D",    // ink
  primaryBorderColor: INK_18,
  lineColor: "#16181D",           // ink
  secondaryColor: "#FAF6EC",
  tertiaryColor: "#FAF6EC",
  background: "transparent",
  clusterBkg: "#FAF6EC",
  clusterBorder: INK_10,
  edgeLabelBackground: "#FAF6EC",
  fontSize: "13px",
  fontFamily: MERMAID_FONT,
  // C4 diagram kind has its own theme tokens
  personBkg: "#FAF6EC",
  person_bg: "#FAF6EC",
  c4_person_bg: "#FAF6EC",
  c4_person_border: INK_18,
  c4_external_person_bg: "#FAF6EC",
  c4_external_person_border: INK_18,
  c4_system_bg: "#FAF6EC",
  c4_system_border: INK_18,
  c4_external_system_bg: "#FAF6EC",
  c4_external_system_border: INK_18,
  c4_container_bg: "#FAF6EC",
  c4_container_border: INK_18,
  c4_external_container_bg: "#FAF6EC",
  c4_component_bg: "#FAF6EC",
  c4_external_component_bg: "#FAF6EC",
};

export function MermaidDiagram({ chart, className }: { chart: string; className?: string }) {
  const id = useId().replace(/:/g, "_");
  const hostRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setSvg(null);
    setErr(null);
    (async () => {
      try {
        const mermaid = (await import("mermaid")).default;
        if (!mermaidInitialized) {
          // securityLevel: "strict" runs labels through mermaid's bundled
          // DOMPurify sanitizer; htmlLabels: false means labels render as
          // SVG <text>, not foreignObject HTML — together they neutralize
          // prompt-injection → stored-XSS via AI-generated diagram labels.
          mermaid.initialize({
            startOnLoad: false,
            theme: "base",
            securityLevel: "strict",
            fontFamily: MERMAID_FONT,
            themeVariables: THEME,
            flowchart: { curve: "basis", htmlLabels: false, padding: 20 },
          });
          mermaidInitialized = true;
        }
        const input = sanitizeMermaid(stripClassDefs(chart));
        // Validate BEFORE rendering. mermaid.render() on a bad chart injects
        // its own "Syntax error in text" bomb SVG straight into document.body
        // that escapes this component — pre-parsing with suppressErrors avoids
        // ever triggering that path.
        const valid = await mermaid.parse(input, { suppressErrors: true });
        if (valid === false) {
          if (!cancelled) setErr("Diagram syntax could not be parsed");
          return;
        }
        const { svg: rendered } = await mermaid.render(`m_${id}`, input);
        if (!cancelled) setSvg(rendered);
      } catch (e) {
        if (!cancelled) setErr((e as Error).message || "Failed to render");
      } finally {
        // Belt-and-suspenders: remove any orphan render/error nodes mermaid
        // may have appended to the body so no stray bomb graphic is left.
        if (typeof document !== "undefined") {
          document.getElementById(`m_${id}`)?.remove();
          document.getElementById(`dm_${id}`)?.remove();
        }
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [chart, id]);

  // After the SVG mounts, attach traveling-dot animations along every edge
  // path. This is the only DOM mutation we do — no opacity/transform on
  // existing nodes (those clashed with React's reconciler during route
  // transitions). The dots are pure additive SVG that we own and clean up.
  useEffect(() => {
    if (!svg || !hostRef.current) return;
    if (typeof window === "undefined") return;
    const root = hostRef.current;
    const svgEl = root.querySelector("svg");
    if (!svgEl) return;

    // Reduced motion: don't add dots.
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    const created: SVGElement[] = [];

    // ── Tech logos: tag each node with a Simple Icons brand mark at top-right ──
    const nodes = Array.from(svgEl.querySelectorAll<SVGGElement>("g.node, g.actor, g.classGroup"));
    nodes.forEach((node) => {
      const label = (node.textContent || "").trim();
      if (!label) return;
      const slug = mermaidTechLogo(label);
      if (!slug) return;
      let bbox: DOMRect;
      try { bbox = node.getBBox(); } catch { return; }
      if (!bbox.width || !bbox.height) return;
      const img = document.createElementNS("http://www.w3.org/2000/svg", "image");
      const size = 18;
      img.setAttributeNS("http://www.w3.org/1999/xlink", "href", `https://cdn.simpleicons.org/${slug}/1A1C22`);
      img.setAttribute("href", `https://cdn.simpleicons.org/${slug}/1A1C22`);
      img.setAttribute("x", String(bbox.x + bbox.width - size - 8));
      img.setAttribute("y", String(bbox.y + 6));
      img.setAttribute("width", String(size));
      img.setAttribute("height", String(size));
      img.setAttribute("opacity", "0.85");
      img.setAttribute("data-tech-logo", "true");
      img.setAttribute("preserveAspectRatio", "xMidYMid meet");
      node.appendChild(img);
      created.push(img);
    });

    if (reduced) {
      return () => {
        created.forEach((g) => { try { g.parentNode?.removeChild(g); } catch { /* ignore */ } });
      };
    }

    const edges = Array.from(
      svgEl.querySelectorAll<SVGPathElement>(
        "path.flowchart-link, .edgePath path.path, g.edgePaths path, path.relation, path.messageLine0, path.messageLine1",
      ),
    );

    edges.forEach((path, i) => {
      if (!path.id) path.id = `m_edge_${id}_${i}`;
      let length = 0;
      try { length = path.getTotalLength(); } catch { /* ignore */ }
      if (!length || !Number.isFinite(length) || length < 8) return;

      // Speed scales with edge length — long edges = same visual velocity.
      const dur = Math.max(1.6, Math.min(5.5, length / 90));
      const delay = (i % 4) * 0.4; // stagger so they don't all start together

      const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
      g.setAttribute("data-flow-dot", "true");
      g.setAttribute("pointer-events", "none");

      // Subtle glow behind the dot
      const halo = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      halo.setAttribute("r", "5");
      halo.setAttribute("fill", "#E04F1E");
      halo.setAttribute("opacity", "0.18");

      // The dot itself — vermillion accent
      const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      dot.setAttribute("r", "2.6");
      dot.setAttribute("fill", "#E04F1E");

      const motion1 = document.createElementNS("http://www.w3.org/2000/svg", "animateMotion");
      motion1.setAttribute("dur", `${dur}s`);
      motion1.setAttribute("repeatCount", "indefinite");
      motion1.setAttribute("rotate", "auto");
      motion1.setAttribute("begin", `${delay}s`);
      const mp1 = document.createElementNS("http://www.w3.org/2000/svg", "mpath");
      mp1.setAttributeNS("http://www.w3.org/1999/xlink", "href", `#${path.id}`);
      motion1.appendChild(mp1);

      const motion2 = document.createElementNS("http://www.w3.org/2000/svg", "animateMotion");
      motion2.setAttribute("dur", `${dur}s`);
      motion2.setAttribute("repeatCount", "indefinite");
      motion2.setAttribute("rotate", "auto");
      motion2.setAttribute("begin", `${delay}s`);
      const mp2 = document.createElementNS("http://www.w3.org/2000/svg", "mpath");
      mp2.setAttributeNS("http://www.w3.org/1999/xlink", "href", `#${path.id}`);
      motion2.appendChild(mp2);

      halo.appendChild(motion1);
      dot.appendChild(motion2);
      g.appendChild(halo);
      g.appendChild(dot);
      svgEl.appendChild(g);
      created.push(g);
    });

    return () => {
      created.forEach((g) => {
        try { g.parentNode?.removeChild(g); } catch { /* ignore */ }
      });
    };
  }, [svg, id]);

  if (loading) {
    return (
      <div className={cn("w-full grid place-items-center py-20", className)}>
        <div className="flex items-center gap-3 eyebrow text-[hsl(var(--ink-3))]">
          <span className="size-1.5 rounded-full bg-[hsl(var(--accent))] animate-pulse" />
          Rendering diagram
        </div>
      </div>
    );
  }

  if (err) {
    return (
      <div className={cn("w-full p-6 bg-[hsl(var(--paper-2))] border border-[hsl(var(--line))]", className)}>
        <p className="eyebrow text-[hsl(var(--bad))]">Diagram render error</p>
        <p className="mt-2 font-mono text-[12px] text-[hsl(var(--ink-2))]">{err}</p>
        <details className="mt-3">
          <summary className="cursor-pointer eyebrow">Show Mermaid source</summary>
          <pre className="mt-2 overflow-auto bg-[hsl(var(--paper))] p-3 text-[11px] font-mono">{chart}</pre>
        </details>
      </div>
    );
  }

  return (
    <div
      ref={hostRef}
      className={cn("mermaid-host w-full overflow-auto", className)}
      dangerouslySetInnerHTML={{ __html: svg ?? "" }}
    />
  );
}
