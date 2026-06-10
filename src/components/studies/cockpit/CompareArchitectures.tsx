"use client";

/**
 * CompareArchitectures — the "Compare architectures" full-screen view.
 *
 * Unlike the Architecture LENS (which packs three raw Mermaid diagrams
 * into narrow columns), this view shows ONE full system architecture at
 * a time — the exact editorial `SystemDiagram` used on an individual
 * report's Design tab. A segmented switcher flips between variants so
 * each architecture gets the entire screen. Clicking any component node
 * opens an inspector panel on the right with that component's details.
 */

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { SystemDiagram } from "@/components/architecture/SystemDiagram";
import type { ArchComponent } from "@/types/architecture";
import type { CockpitVariant } from "./StudyCockpit";

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

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

export function CompareArchitectures({ variants }: { variants: CockpitVariant[] }) {
  const live = useMemo(
    () => variants.filter((v) => !v.failed && v.architecture),
    [variants],
  );

  const [activeId, setActiveId] = useState<string | undefined>(live[0]?.variantId);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Keep the active variant valid as the live set changes (e.g. a variant
  // finishes streaming in). Reset the component selection on switch.
  const active =
    live.find((v) => v.variantId === activeId) ?? live[0] ?? null;

  useEffect(() => {
    if (active && active.variantId !== activeId) {
      setActiveId(active.variantId);
    }
  }, [active, activeId]);

  const arch = active?.architecture ?? null;
  const selected = arch?.components.find((c) => c.id === selectedId) ?? null;

  if (!live.length || !arch || !active) {
    return (
      <div className="rounded-md border border-dashed border-[hsl(var(--line))] bg-[hsl(var(--paper-3))]/30 p-10 text-center text-[13px] text-[hsl(var(--ink-3))]">
        No completed architectures to compare yet.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Variant switcher — each architecture gets the full screen. */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[hsl(var(--ink-3))]">
          architecture
        </span>
        {live.map((v) => {
          const on = v.variantId === active.variantId;
          return (
            <button
              key={v.variantId}
              type="button"
              onClick={() => {
                setActiveId(v.variantId);
                setSelectedId(null);
              }}
              aria-pressed={on}
              className={cn(
                "rounded-full border px-3 py-1 text-[12px] transition-colors",
                on
                  ? "border-[hsl(var(--ink))] bg-[hsl(var(--ink))] text-[hsl(var(--paper))]"
                  : "border-[hsl(var(--line))] bg-[hsl(var(--card))] text-[hsl(var(--ink-2))] hover:bg-[hsl(var(--paper-3))]/40",
              )}
            >
              {v.label}
            </button>
          );
        })}
        <span className="ms-auto hidden md:inline font-mono text-[10px] uppercase tracking-wider text-[hsl(var(--ink-3))]">
          {arch.components.length} components · click a node for detail
        </span>
      </div>

      {/* Meta header — title + one-liner + summary. */}
      <div className="rounded-md border border-[hsl(var(--line))] bg-[hsl(var(--paper-2))]/40 px-4 py-3">
        <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[hsl(var(--ink-3))]">
          {active.label}
        </div>
        <h3 className="mt-0.5 display-tight text-[20px] leading-tight tracking-[-0.02em] text-[hsl(var(--ink))]">
          {arch.meta?.title || active.label}
        </h3>
        {arch.meta?.one_liner && (
          <p className="mt-1 text-[13px] text-[hsl(var(--ink-2))] leading-snug max-w-[80ch]">
            {arch.meta.one_liner}
          </p>
        )}
      </div>

      {/* Canvas + inspector. Canvas fills; inspector docks right on xl. */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-4">
        <div className="min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={active.variantId}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28, ease: EASE_OUT_EXPO }}
            >
              <SystemDiagram
                arch={arch}
                onSelect={(sel) => setSelectedId(sel.id)}
                selectedId={selectedId}
              />
            </motion.div>
          </AnimatePresence>
        </div>

        <aside className="min-w-0">
          <div className="sticky top-2">
            <AnimatePresence mode="wait">
              {selected ? (
                <motion.div
                  key={selected.id}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.22, ease: EASE_OUT_EXPO }}
                  className="rounded-md border border-[hsl(var(--line))] bg-[hsl(var(--card))] p-4"
                >
                  <ComponentDetail
                    component={selected}
                    onClose={() => setSelectedId(null)}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="rounded-md border border-dashed border-[hsl(var(--line))] bg-[hsl(var(--paper-2))]/40 p-4"
                >
                  <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[hsl(var(--ink-3))]">
                    Inspector
                  </div>
                  <p className="mt-2 text-[13px] text-[hsl(var(--ink-2))] leading-relaxed">
                    Click any component in the diagram to see its technology,
                    responsibility, and scaling notes here.
                  </p>
                  {arch.executive_summary && (
                    <p className="mt-3 border-t border-[hsl(var(--line))] pt-3 text-[12px] text-[hsl(var(--ink-3))] leading-relaxed">
                      {arch.executive_summary}
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </aside>
      </div>
    </div>
  );
}

function ComponentDetail({
  component,
  onClose,
}: {
  component: ArchComponent;
  onClose: () => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[hsl(var(--ink-3))]">
            Component
          </div>
          <h4 className="mt-0.5 display-tight text-[16px] leading-snug tracking-[-0.01em] text-[hsl(var(--ink))]">
            {component.name}
          </h4>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 ms text-[18px] text-[hsl(var(--ink-3))] hover:text-[hsl(var(--ink))] transition-colors"
          aria-label="Clear selection"
        >
          close
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded-full border border-[hsl(var(--line))] bg-[hsl(var(--paper-3))]/40 px-2 py-0.5 text-[11px] font-mono lowercase tracking-[0.04em] text-[hsl(var(--ink-2))]">
          <span
            className={cn(
              "inline-block size-2 rounded-full",
              CATEGORY_TONE[component.category] ?? "bg-[hsl(var(--ink-3))]",
            )}
            aria-hidden
          />
          {component.category}
        </span>
        <span className="text-[12px] text-[hsl(var(--ink-3))]">
          {component.technology}
        </span>
      </div>

      <p className="text-[13px] text-[hsl(var(--ink-2))] leading-relaxed">
        {component.responsibility}
      </p>

      {component.scaling && (
        <p className="border-t border-[hsl(var(--line))] pt-3 font-mono text-[11px] text-[hsl(var(--ink-3))] leading-relaxed">
          scale · {component.scaling}
        </p>
      )}
    </div>
  );
}
