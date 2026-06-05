"use client";

import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

let mermaidInitialized = false;

export function MermaidDiagram({ chart, className }: { chart: string; className?: string }) {
  const id = useId().replace(/:/g, "_");
  const ref = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const mermaid = (await import("mermaid")).default;
        if (!mermaidInitialized) {
          mermaid.initialize({
            startOnLoad: false,
            theme: "base",
            securityLevel: "loose",
            fontFamily: "var(--font-sans), Roboto, system-ui, sans-serif",
            themeVariables: {
              primaryColor: "#fafafa",
              primaryTextColor: "#0a0a0a",
              primaryBorderColor: "#d4d4d8",
              lineColor: "#52525b",
              secondaryColor: "#f4f4f5",
              tertiaryColor: "#ffffff",
              background: "#ffffff",
              clusterBkg: "#fafafa",
              clusterBorder: "#e4e4e7",
              edgeLabelBackground: "#ffffff",
              fontSize: "13px",
            },
          });
          mermaidInitialized = true;
        }

        const { svg: rendered } = await mermaid.render(`m_${id}`, chart);
        if (!cancelled) {
          setSvg(rendered);
          setErr(null);
        }
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

  // Post-render: stagger nodes in, then "draw" edges, then fade labels.
  useEffect(() => {
    if (!svg || !ref.current) return;
    if (typeof window === "undefined") return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    const root = ref.current;
    const raf = requestAnimationFrame(() => {
      const svgEl = root.querySelector("svg");
      if (!svgEl) return;
      svgEl.setAttribute("data-animated", "true");

      const nodes = Array.from(
        svgEl.querySelectorAll<SVGGElement>(
          "g.node, g.cluster, g.actor, g.entityBox, g.classGroup",
        ),
      );
      nodes.forEach((n, i) => {
        n.style.opacity = "0";
        n.style.transformBox = "fill-box";
        n.style.transformOrigin = "center";
        n.style.transform = "translateY(6px) scale(0.96)";
        n.style.transition =
          "opacity 480ms cubic-bezier(0.16,1,0.3,1), transform 520ms cubic-bezier(0.16,1,0.3,1)";
        n.style.transitionDelay = `${120 + i * 55}ms`;
        requestAnimationFrame(() => {
          n.style.opacity = "1";
          n.style.transform = "translateY(0) scale(1)";
        });
      });

      const edges = Array.from(
        svgEl.querySelectorAll<SVGPathElement>(
          "path.flowchart-link, path.messageLine0, path.messageLine1, path.relation, .edgePath path, g.edgePaths path",
        ),
      );
      const nodeDelayMax = 120 + Math.max(0, nodes.length - 1) * 55;
      edges.forEach((p, i) => {
        try {
          const length = p.getTotalLength();
          if (!length || !Number.isFinite(length)) return;
          p.style.strokeDasharray = `${length}`;
          p.style.strokeDashoffset = `${length}`;
          p.style.transition = `stroke-dashoffset 640ms cubic-bezier(0.16,1,0.3,1)`;
          p.style.transitionDelay = `${nodeDelayMax + 80 + i * 65}ms`;
          requestAnimationFrame(() => {
            p.style.strokeDashoffset = "0";
          });
        } catch {
          /* getTotalLength can fail on some path shapes */
        }
      });

      const labels = Array.from(
        svgEl.querySelectorAll<SVGGElement>(
          "g.edgeLabel, g.label, g.cluster-label",
        ),
      );
      const edgeDelayMax = nodeDelayMax + 80 + Math.max(0, edges.length - 1) * 65;
      labels.forEach((l, i) => {
        l.style.opacity = "0";
        l.style.transition = "opacity 360ms cubic-bezier(0.16,1,0.3,1)";
        l.style.transitionDelay = `${edgeDelayMax + 60 + i * 35}ms`;
        requestAnimationFrame(() => {
          l.style.opacity = "1";
        });
      });

      // Arrow markers — fade with their edges
      const markers = Array.from(
        svgEl.querySelectorAll<SVGGElement>("marker, defs marker"),
      );
      markers.forEach((m) => {
        m.style.opacity = "0";
        m.style.transition = "opacity 400ms cubic-bezier(0.16,1,0.3,1)";
        m.style.transitionDelay = `${edgeDelayMax}ms`;
        requestAnimationFrame(() => {
          m.style.opacity = "1";
        });
      });
    });
    return () => cancelAnimationFrame(raf);
  }, [svg]);

  return (
    <div
      className={cn(
        "mermaid-host relative w-full overflow-auto rounded-xl border bg-white p-5 scrollbar-thin",
        className,
      )}
    >
      {loading && (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
          <span className="ml-2 text-sm">Rendering diagram…</span>
        </div>
      )}
      {err && (
        <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
          <div className="font-medium">Diagram render error</div>
          <div className="mt-1 font-mono text-xs">{err}</div>
          <details className="mt-2">
            <summary className="cursor-pointer text-xs">Show Mermaid source</summary>
            <pre className="mt-2 overflow-auto rounded bg-background p-2 text-xs">{chart}</pre>
          </details>
        </div>
      )}
      {svg && <div ref={ref} dangerouslySetInnerHTML={{ __html: svg }} />}
    </div>
  );
}
