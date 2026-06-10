"use client";

/**
 * Architecture lens — three Mermaid diagrams side-by-side.
 *
 * Phase 5 shipped the diagram-per-column layout + the C4-container
 * default selector. Phase 9 adds cross-column linked highlight: hovering
 * a component chip in one variant glows its equivalents in the others,
 * computed from `buildEquivalenceIndex` (category + vendor family +
 * responsibility token overlap).
 *
 * Each column also surfaces the variant's total component count and
 * category histogram so the user can compare structural complexity at
 * a glance.
 */

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { MermaidDiagram } from "@/components/architecture/MermaidDiagram";
import { DiagramLightbox } from "@/components/architecture/DiagramLightbox";
import type { ArchComponent, Diagram } from "@/types/architecture";
import {
  buildEquivalenceIndex,
  type EquivalenceKey,
} from "@/lib/studies/equivalence";
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
  const [hover, setHover] = useState<EquivalenceKey | null>(null);
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

  const equivalenceIndex = useMemo(
    () =>
      buildEquivalenceIndex(
        variants.map((v) => ({
          variantId: v.variantId,
          arch: v.architecture,
        })),
      ),
    [variants],
  );

  // Pre-compute the highlighted (variantId, componentId) set when a chip
  // is hovered. O(matches) on hover; O(1) on every chip's lookup.
  const highlighted = useMemo<Set<string> | null>(() => {
    if (!hover) return null;
    const out = new Set<string>();
    out.add(`${hover.variantId}::${hover.componentId}`);
    for (const m of equivalenceIndex.lookup(hover)) {
      out.add(`${m.key.variantId}::${m.key.componentId}`);
    }
    return out;
  }, [hover, equivalenceIndex]);

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
                ? "border border-[hsl(var(--ink))] bg-[hsl(var(--ink))] px-2.5 py-1 text-[11px] font-mono uppercase tracking-wider text-[hsl(var(--paper))]"
                : "border border-[hsl(var(--line))] bg-[hsl(var(--card))] px-2.5 py-1 text-[11px] font-mono uppercase tracking-wider text-[hsl(var(--ink-2))] hover:bg-[hsl(var(--paper-3))]/40 transition-colors"
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
              {/* Architecture header — title + one-liner + executive summary */}
              <div className="rounded-md border border-[hsl(var(--line))] bg-[hsl(var(--paper-2))]/40 p-3">
                <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[hsl(var(--ink-3))]">
                  Architecture
                </div>
                <h4 className="mt-0.5 display-tight text-[15px] leading-snug tracking-[-0.01em] text-[hsl(var(--ink))]">
                  {arch.meta?.title || v.label}
                </h4>
                {arch.meta?.one_liner && (
                  <p className="mt-0.5 text-[12px] text-[hsl(var(--ink-2))] leading-snug">
                    {arch.meta.one_liner}
                  </p>
                )}
                {arch.executive_summary && (
                  <ArchSummary text={arch.executive_summary} />
                )}
              </div>

              {diagram ? (
                <DiagramLightbox
                  caption={`${v.label} · ${KIND_LABEL[diagram.kind]}`}
                  trigger={
                    <div className="rounded-md border border-[hsl(var(--line))] bg-[hsl(var(--paper))] p-2 overflow-x-auto scrollbar-thin">
                      <MermaidDiagram chart={diagram.mermaid} />
                    </div>
                  }
                  content={
                    <MermaidDiagram chart={diagram.mermaid} />
                  }
                />
              ) : (
                <div className="rounded-md border border-dashed border-[hsl(var(--line))] bg-[hsl(var(--paper-3))]/30 p-6 text-center text-[12px] text-[hsl(var(--ink-3))]">
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

              {/* Per-component chip strip — hover-linked across columns. */}
              {components.length > 0 && (
                <div
                  className="flex flex-col gap-1.5"
                  onMouseLeave={() => setHover(null)}
                >
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[hsl(var(--ink-3))]">
                    components · hover to link
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {components.map((c) => (
                      <ComponentChip
                        key={c.id}
                        component={c}
                        variantLabel={v.label}
                        isHighlighted={
                          !!highlighted &&
                          highlighted.has(`${v.variantId}::${c.id}`)
                        }
                        isDimmed={!!highlighted && !highlighted.has(`${v.variantId}::${c.id}`)}
                        onHover={() =>
                          setHover({ variantId: v.variantId, componentId: c.id })
                        }
                        onClick={() =>
                          openDrawer({
                            title: c.name,
                            caption: `${v.label} · ${c.category} · ${c.technology}`,
                            body: <SingleComponentDrawer component={c} />,
                          })
                        }
                      />
                    ))}
                  </div>
                </div>
              )}
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
          className="rounded-md border border-[hsl(var(--line))] bg-[hsl(var(--paper-3))]/30 p-3"
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

function SingleComponentDrawer({ component }: { component: ArchComponent }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <MiniChip>
          <span
            className={`inline-block size-2 rounded-full ${CATEGORY_TONE[component.category] ?? "bg-[hsl(var(--ink-3))]"}`}
            aria-hidden
          />
          {component.category}
        </MiniChip>
        <span className="text-[12px] text-[hsl(var(--ink-3))]">{component.technology}</span>
      </div>
      <p className="text-[13px] text-[hsl(var(--ink-2))] leading-relaxed">
        {component.responsibility}
      </p>
      {component.scaling && (
        <p className="font-mono text-[11px] text-[hsl(var(--ink-3))]">
          scale · {component.scaling}
        </p>
      )}
      <p className="mt-1 text-[11px] text-[hsl(var(--ink-3))] leading-relaxed">
        Equivalent components in the other variants are glowing in their
        chip strips — they share this category and (when relevant) the
        same vendor family.
      </p>
    </div>
  );
}

function ComponentChip({
  component,
  variantLabel,
  isHighlighted,
  isDimmed,
  onHover,
  onClick,
}: {
  component: ArchComponent;
  variantLabel: string;
  isHighlighted: boolean;
  isDimmed: boolean;
  onHover: () => void;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onMouseEnter={onHover}
      onFocus={onHover}
      onClick={onClick}
      title={`${component.name} — ${variantLabel}`}
      className={cn(
        "group inline-flex items-center gap-1 border px-2 py-0.5 text-[11px] font-mono lowercase tracking-[0.04em] transition-all duration-200",
        isHighlighted
          ? "border-[hsl(var(--accent))] bg-[hsl(var(--accent-paper))] text-[hsl(var(--accent-ink))] shadow-[0_0_0_3px_hsl(var(--accent)/0.18)]"
          : isDimmed
          ? "border-[hsl(var(--line))] bg-[hsl(var(--paper-3))]/30 text-[hsl(var(--ink-3))]/60 opacity-50"
          : "border-[hsl(var(--line))] bg-[hsl(var(--paper-3))]/40 text-[hsl(var(--ink-2))] hover:border-[hsl(var(--ink-3))]/40",
      )}
    >
      <span
        className={cn(
          "inline-block size-1.5 rounded-full",
          CATEGORY_TONE[component.category] ?? "bg-[hsl(var(--ink-3))]",
        )}
        aria-hidden
      />
      <span className="max-w-[12ch] truncate">{component.name}</span>
    </button>
  );
}

/**
 * Click-to-expand summary text. Short by default, expanded on demand
 * so the side-by-side columns stay scannable.
 */
function ArchSummary({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const collapsedLines = 2;
  return (
    <div className="mt-2">
      <p
        className={cn(
          "text-[12px] text-[hsl(var(--ink-2))] leading-snug",
          !open && "overflow-hidden",
        )}
        style={
          !open
            ? {
                display: "-webkit-box",
                WebkitLineClamp: collapsedLines,
                WebkitBoxOrient: "vertical",
              }
            : undefined
        }
      >
        {text}
      </p>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="mt-1 inline-flex items-center gap-0.5 font-mono text-[10px] uppercase tracking-wider text-[hsl(var(--ink-3))] hover:text-[hsl(var(--ink))] transition-colors"
      >
        {open ? "show less" : "read more"}
        <span className="ms text-[12px]" aria-hidden>
          {open ? "expand_less" : "expand_more"}
        </span>
      </button>
    </div>
  );
}
