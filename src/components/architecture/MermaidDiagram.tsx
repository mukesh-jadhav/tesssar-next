"use client";

import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";

let mermaidInitialized = false;

// Editorial palette injected into mermaid SVG (paper / ink / vermillion).
// We use literal fallback fonts (not CSS vars) so mermaid measures glyph
// widths against the same font it renders with — otherwise labels clip.
const MERMAID_FONT = "Manrope, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
const THEME = {
  primaryColor: "#FAF6EC",        // paper
  primaryTextColor: "#16181D",    // ink
  primaryBorderColor: "#1A1C22",  // ink
  lineColor: "#16181D",           // ink
  secondaryColor: "#F2EBD8",      // paper-2
  tertiaryColor: "#FAF6EC",
  background: "transparent",
  clusterBkg: "#F2EBD8",
  clusterBorder: "#1A1C22",
  edgeLabelBackground: "#FAF6EC",
  fontSize: "13px",
  fontFamily: MERMAID_FONT,
  // C4 diagram kind has its own theme tokens
  personBkg: "#FAF6EC",
  person_bg: "#FAF6EC",
  c4_person_bg: "#FAF6EC",
  c4_person_border: "#1A1C22",
  c4_external_person_bg: "#F2EBD8",
  c4_external_person_border: "#1A1C22",
  c4_system_bg: "#1A1C22",
  c4_system_border: "#1A1C22",
  c4_external_system_bg: "#FAF6EC",
  c4_external_system_border: "#1A1C22",
  c4_container_bg: "#FAF6EC",
  c4_container_border: "#1A1C22",
  c4_external_container_bg: "#F2EBD8",
  c4_component_bg: "#FAF6EC",
  c4_external_component_bg: "#F2EBD8",
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
          mermaid.initialize({
            startOnLoad: false,
            theme: "base",
            securityLevel: "loose",
            fontFamily: MERMAID_FONT,
            themeVariables: THEME,
            flowchart: { curve: "basis", htmlLabels: true, padding: 20 },
          });
          mermaidInitialized = true;
        }
        const { svg: rendered } = await mermaid.render(`m_${id}`, chart);
        if (!cancelled) setSvg(rendered);
      } catch (e) {
        if (!cancelled) setErr((e as Error).message || "Failed to render");
      } finally {
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
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    const created: SVGGElement[] = [];
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
