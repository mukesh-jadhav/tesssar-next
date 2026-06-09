"use client";

/**
 * Architecture lens — three Mermaid diagrams side-by-side.
 *
 * Phase 5 ships the basic diagram-per-column layout + the C4-container
 * default selector. The cross-column linked-highlight wiring lands in
 * Phase 9 — `buildEquivalenceIndex` is already imported so the wiring
 * call site is in place.
 *
 * Each column also surfaces the variant's total component count and
 * category histogram so the user can compare structural complexity at
 * a glance.
 */

import { useMemo, useState } from "react";
import { MermaidDiagram } from "@/components/architecture/MermaidDiagram";
import type { ArchComponent, Diagram } from "@/types/architecture";
import { LensColumns } from "../LensColumns";
import { useCockpit } from "../state";
import { MiniChip, StatBlock } from "./primitives";
import type { CockpitVariant } from "../StudyCockpit";

const KIND_LABEL: Record<Diagram["kind"], string> = {
  "c4-context":   "C4 · Context",
  "c4-container": "C4 · Container",
  "c4-component": "C4 · Component",
  "deployment":   "Deployment",
  "sequence":     "Sequence",
  "data-flow":    "Data flow",
  "er":           "ER",
  "state":        "State",
  "flowchart":    "Flowchart",
};

const PREFERRED_KIND: Diagram["kind"][] = [
  "c4-container",
  "c4-component",
  "deployment",
  "data-flow",
  "c4-context",
  "flowchart",
];

const CATEGORY_TONE: Partial<Record<ArchComponent["category"], string>> = {
  frontend:      "bg-sky-500",
  api:           "bg-[hsl(var(--accent))]",
  service:       "bg-violet-500",
  worker:        "bg-amber-500",
  database:      "bg-emerald-500",
  cache:         "bg-pink-500",
  queue:         "bg-orange-500",
  storage:       "bg-teal-500",
  cdn:           "bg-cyan-500",
  auth:          "bg-yellow-500",
  observability: "bg-violet-400",
  ml:            "bg-fuchsia-500",
  edge:          "bg-blue-500",
  integration:   "bg-rose-500",
  other:         "bg-[hsl(var(--ink-3))]",
};

export function ArchitectureLens({ variants }: { variants: CockpitVariant[] }) {
  // Lens-local kind selector. Default: the first preferred-kind any
  // variant offers. If no variant has any diagram, falls back to "c4-container".
  const initialKind = useMemo<Diagram["kind"]>(() => {
    for (const k of PREFERRED_KIND) {
      if (variants.some((v) => v.architecture?.diagrams?.some((d) => d.kind === k))) {
        return k;
      }
    }
    return "c4-container";
  }, [variants]);

  const [kind, setKind] = useState<Diagram["kind"]>(initialKind);
  const { openDrawer } = useCockpit();

  const availableKinds = useMemo<Diagram["kind"][]>(() => {
    const set = new Set<Diagram["kind"]>();
    for (const v of variants) {
      for (const d of v.architecture?.diagrams ?? []) {
        set.add(d.kind);
      }
    }
    return PREFERRED_KIND.filter((k) => set.has(k));
  }, [variants]);

  return (
    <div className="flex flex-col gap-4">
      {/* Kind selector */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[hsl(var(--ink-3))]">
          diagram
        </span>
        {availableKinds.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setKind(k)}
            className={
              kind === k
                ? "rounded-full border border-[hsl(var(--ink))] bg-[hsl(var(--ink))] px-2.5 py-1 text-[11px] font-mono uppercase tracking-wider text-[hsl(var(--paper))]"
                : "rounded-full border border-[hsl(var(--line))] bg-[hsl(var(--card))] px-2.5 py-1 text-[11px] font-mono uppercase tracking-wider text-[hsl(var(--ink-2))] hover:bg-[hsl(var(--paper-3))]/40 transition-colors"
            }
          >
            {KIND_LABEL[k]}
          </button>
        ))}
      </div>

      <LensColumns
        variants={variants}
        renderCell={(v) => {
          const arch = v.architecture;
          if (!arch) return null;
          const diagram = pickDiagram(arch.diagrams, kind);
          const components = arch.components ?? [];
          const histogram = countByCategory(components);
          return (
            <div className="flex flex-col gap-3">
              {diagram ? (
                <div className="rounded-xl border border-[hsl(var(--line))] bg-[hsl(var(--paper))] p-2 overflow-x-auto scrollbar-thin">
                  <MermaidDiagram chart={diagram.mermaid} />
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-[hsl(var(--line))] bg-[hsl(var(--paper-3))]/30 p-6 text-center text-[12px] text-[hsl(var(--ink-3))]">
                  No {KIND_LABEL[kind]} diagram in this variant.
                </div>
              )}

              <div className="flex items-end justify-between gap-3">
                <StatBlock
                  label="Components"
                  value={components.length}
                  caption={`${histogram.length} categories`}
                />
                <button
                  type="button"
                  onClick={() =>
                    openDrawer({
                      title: `${v.label} components`,
                      caption: diagram ? KIND_LABEL[diagram.kind] : "—",
                      body: (
                        <ComponentsDrawer components={components} />
                      ),
                    })
                  }
                  className="inline-flex items-center gap-1 text-[11px] font-mono uppercase tracking-wider text-[hsl(var(--ink-3))] hover:text-[hsl(var(--ink))] transition-colors"
                >
                  inspect
                  <span className="ms text-[14px]" aria-hidden>arrow_forward</span>
                </button>
              </div>

              {/* Category histogram */}
              <div className="flex flex-wrap gap-1.5">
                {histogram.map(([cat, count]) => (
                  <MiniChip key={cat}>
                    <span
                      className={`inline-block size-2 rounded-full ${CATEGORY_TONE[cat] ?? "bg-[hsl(var(--ink-3))]"}`}
                      aria-hidden
                    />
                    {cat} · {count}
                  </MiniChip>
                ))}
              </div>
            </div>
          );
        }}
      />
    </div>
  );
}

function pickDiagram(diagrams: Diagram[] | undefined, kind: Diagram["kind"]): Diagram | null {
  if (!diagrams?.length) return null;
  return diagrams.find((d) => d.kind === kind) ?? null;
}

function countByCategory(components: ArchComponent[]): Array<[ArchComponent["category"], number]> {
  const m = new Map<ArchComponent["category"], number>();
  for (const c of components) {
    m.set(c.category, (m.get(c.category) ?? 0) + 1);
  }
  return Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
}

function ComponentsDrawer({ components }: { components: ArchComponent[] }) {
  if (!components.length) {
    return <p className="text-[13px] text-[hsl(var(--ink-3))]">No components in this variant.</p>;
  }
  return (
    <ul className="flex flex-col gap-2">
      {components.map((c) => (
        <li
          key={c.id}
          className="rounded-xl border border-[hsl(var(--line))] bg-[hsl(var(--paper-3))]/30 p-3"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[13px] font-medium text-[hsl(var(--ink))]">{c.name}</span>
            <MiniChip>
              <span
                className={`inline-block size-2 rounded-full ${CATEGORY_TONE[c.category] ?? "bg-[hsl(var(--ink-3))]"}`}
                aria-hidden
              />
              {c.category}
            </MiniChip>
          </div>
          <p className="mt-1 text-[12px] text-[hsl(var(--ink-2))]">{c.technology}</p>
          <p className="mt-1 text-[12px] text-[hsl(var(--ink-3))]">{c.responsibility}</p>
          {c.scaling && (
            <p className="mt-1 text-[11px] font-mono text-[hsl(var(--ink-3))]">
              scale · {c.scaling}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}
