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
            fontFamily: "Inter, system-ui, sans-serif",
            themeVariables: {
              primaryColor: "#f4f4f5",
              primaryTextColor: "#0a0a0a",
              primaryBorderColor: "#d4d4d8",
              lineColor: "#71717a",
              secondaryColor: "#fafafa",
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

  return (
    <div className={cn("mermaid-host relative w-full overflow-auto rounded-lg border bg-white p-4 scrollbar-thin", className)}>
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
