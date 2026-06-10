"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { EditorialDiagram } from "@/components/architecture/EditorialDiagram";
import { DiagramErrorBoundary } from "@/components/architecture/DiagramErrorBoundary";
import { ExportMenu } from "@/components/architecture/ExportMenu";
import { ShareButton } from "@/components/architecture/ShareButton";
import { ScaleExplorer } from "@/components/architecture/ScaleExplorer";
import { SystemDiagram } from "@/components/architecture/SystemDiagram";
import { CountUp } from "@/components/motion/CountUp";
import { useReducedMotionSafe } from "@/components/motion/useReducedMotionSafe";
import type {
  AppliedPattern,
  ArchComponent,
  Architecture,
  CostLineItem,
  DataFlow,
  Risk,
  SecurityControl,
  TechChoice,
} from "@/types/architecture";

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

/**
 * ReportCockpit — the architecture report rendered as a bounded,
 * single-screen cockpit. The shell wraps this; nothing here grows
 * the page. Only the active chapter panel scrolls internally; the
 * inspector on the right is always visible and changes its content
 * based on whatever the user last clicked anywhere in the cockpit.
 */

type ChapterId =
  | "story" | "brief" | "design" | "pieces" | "traffic" | "diagrams"
  | "numbers" | "breaks" | "guards" | "watch" | "next";

type Act = "intro" | "why" | "what" | "how";

/**
 * Selection — what's currently being inspected in the right panel.
 * Every clickable item across all chapters narrows to one of these.
 * `null` means "show the default Brief card".
 */
export type Selection =
  | { kind: "component"; id: string }
  | { kind: "flow"; step: number }
  | { kind: "risk"; id: string }
  | { kind: "pattern"; index: number }
  | { kind: "api"; index: number }
  | { kind: "tech"; index: number }
  | { kind: "security"; index: number }
  | { kind: "diagram"; id: string }
  | { kind: "node"; label: string; subLabel?: string }
  | null;

export type SelectHandler = (s: Selection) => void;

const CHAPTERS: { id: ChapterId; n: string; label: string; act: Act; sub: string }[] = [
  { id: "story",    n: "00", label: "Overview",      act: "intro", sub: "Start here — what we built and why." },
  { id: "brief",    n: "01", label: "Brief",         act: "why",   sub: "What this system must do, and what it must not." },
  { id: "design",   n: "02", label: "Architecture",  act: "what",  sub: "The shape of the system at a glance." },
  { id: "pieces",   n: "03", label: "Components",    act: "what",  sub: "Every service named, with tech and responsibility." },
  { id: "traffic",  n: "04", label: "Data & APIs",   act: "what",  sub: "How requests, data, and events move through it." },
  { id: "diagrams", n: "05", label: "Diagrams",      act: "what",  sub: "The same system, viewed through several lenses." },
  { id: "numbers",  n: "06", label: "Scale & cost",  act: "how",   sub: "What it costs to run, at every stage of growth." },
  { id: "breaks",   n: "07", label: "Risks",         act: "how",   sub: "What can fail, and how badly." },
  { id: "guards",   n: "08", label: "Security",      act: "how",   sub: "The controls that keep it defensible." },
  { id: "watch",    n: "09", label: "Operations",    act: "how",   sub: "How you know it’s working — and how you ship changes." },
  { id: "next",     n: "10", label: "Roadmap",       act: "how",   sub: "Phased plan and open questions." },
];

const ACT_LABELS: Record<Act, string> = {
  intro: "Overview",
  why:   "I · The problem",
  what:  "II · The design",
  how:   "III · The operation",
};

const RISK_PALETTE: Record<Risk["impact"], string> = {
  low:      "bg-[hsl(var(--paper-2))] text-[hsl(var(--ink-2))] border-[hsl(var(--line))]",
  medium:   "bg-[hsl(var(--warn))]/10 text-[hsl(var(--warn))] border-[hsl(var(--warn))]/20",
  high:     "bg-[hsl(var(--bad))]/10 text-[hsl(var(--bad))] border-[hsl(var(--bad))]/20",
  critical: "bg-[hsl(var(--ink))] text-[hsl(var(--paper))] border-[hsl(var(--ink))]",
};

export function ReportCockpit({
  arch,
  architectureId,
  showDownload = true,
  publicShare,
}: {
  arch: Architecture;
  architectureId?: string;
  showDownload?: boolean;
  publicShare?: { slug: string; createdAt: number } | null;
}) {
  const [chapter, setChapter] = useState<ChapterId>("story");
  const [activeDiagram, setActiveDiagram] = useState(arch.diagrams[0]?.id ?? "");
  const [selection, setSelection] = useState<Selection>(null);
  const currentDiagram = arch.diagrams.find((d) => d.id === activeDiagram) ?? arch.diagrams[0];

  // Split exec summary into a lead sentence (headline) + body paragraph.
  const summary = arch.executive_summary.trim();
  const firstEnd = summary.search(/[.!?](\s|$)/);
  const lead = firstEnd >= 0 ? summary.slice(0, firstEnd + 1) : summary;
  const body = firstEnd >= 0 ? summary.slice(firstEnd + 1).trim() : "";

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      {/* ─────────────── Chapter tabs (3-act narrative) ─────────────── */}
      <div className="h-11 shrink-0 flex items-stretch border-b border-[hsl(var(--line))] bg-[hsl(var(--paper))]">
        <LayoutGroup id="cockpit-chapter-tabs">
          <div className="flex-1 min-w-0 flex items-stretch overflow-x-auto scrollbar-thin">
            {CHAPTERS.map((c, i) => {
              const active = chapter === c.id;
              const prevAct = i > 0 ? CHAPTERS[i - 1].act : null;
              const startsAct = c.act !== prevAct;
              return (
                <div key={c.id} className="flex items-stretch">
                  {startsAct && i > 0 && (
                    <span
                      aria-hidden
                      className="self-center mx-1.5 h-4 w-px bg-[hsl(var(--line))]"
                    />
                  )}
                  {startsAct && c.act !== "intro" && (
                    <span className="hidden lg:flex items-center pl-1 pr-2 font-mono text-[9.5px] uppercase tracking-[0.18em] text-[hsl(var(--ink-3))]/70">
                      {ACT_LABELS[c.act]}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => setChapter(c.id)}
                    title={c.sub}
                    className={cn(
                      "shrink-0 relative px-3.5 flex items-center gap-2 transition-colors text-[12px]",
                      active
                        ? "text-[hsl(var(--ink))] bg-[hsl(var(--paper-2))]/40"
                        : "text-[hsl(var(--ink-3))] hover:text-[hsl(var(--ink))] hover:bg-[hsl(var(--paper-2))]/40",
                    )}
                  >
                    <span className="font-mono text-[10px] tabular-nums opacity-70">{c.n}</span>
                    <span className="font-medium tracking-tight">{c.label}</span>
                    {active && (
                      <motion.span
                        layoutId="cockpit-chapter-indicator"
                        aria-hidden
                        className="absolute inset-x-0 bottom-0 h-[2px] bg-[hsl(var(--accent))]"
                        transition={{ type: "spring", stiffness: 420, damping: 34 }}
                      />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </LayoutGroup>
        {showDownload && architectureId && (
          <div className="shrink-0 flex items-center gap-2 pr-3 pl-3 border-l border-[hsl(var(--line))]">
            <ShareButton architectureId={architectureId} initialShare={publicShare} />
            <ExportMenu architectureId={architectureId} size="sm" />
          </div>
        )}
      </div>

      {/* ─────────────── Body: canvas + inspector ─────────────── */}
      <div className="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-[1fr_360px]">
        {/* Canvas */}
        <section className="min-h-0 min-w-0 overflow-auto scrollbar-thin">
          <div className="p-6 md:p-8 lg:p-10">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={chapter}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.34, ease: EASE_OUT_EXPO }}
              >
                <ChapterIntro chapter={chapter} />
                {chapter === "story"    && <StoryPanel arch={arch} lead={lead} body={body} onJump={setChapter} />}
                {chapter === "design"   && <SystemDiagram arch={arch} onSelect={setSelection} selectedId={selection?.kind === "component" ? selection.id : null} />}
                {chapter === "diagrams" && (
                  <DiagramsPanel
                    diagrams={arch.diagrams}
                    active={activeDiagram}
                    onActive={(id) => { setActiveDiagram(id); setSelection({ kind: "diagram", id }); }}
                    current={currentDiagram}
                    onSelect={setSelection}
                    arch={arch}
                  />
                )}
                {chapter === "brief"   && <BriefPanel arch={arch} onSelect={setSelection} selection={selection} />}
                {chapter === "pieces"  && <PiecesPanel arch={arch} onSelect={setSelection} selection={selection} />}
                {chapter === "traffic" && <TrafficPanel arch={arch} onSelect={setSelection} selection={selection} />}
                {chapter === "numbers" && <NumbersPanel arch={arch} />}
                {chapter === "breaks"  && <RisksPanel arch={arch} onSelect={setSelection} selection={selection} />}
                {chapter === "guards"  && <GuardsPanel arch={arch} onSelect={setSelection} selection={selection} />}
                {chapter === "watch"   && <WatchPanel arch={arch} />}
                {chapter === "next"    && <NextPanel arch={arch} />}
                <ChapterFooter chapter={chapter} onJump={setChapter} />
              </motion.div>
            </AnimatePresence>
          </div>
        </section>

        {/* Inspector — context-aware. Defaults to the Brief, but switches
            to whatever the user last clicked on (component, flow, risk,
            pattern, api, security control, tech choice, diagram, or raw
            diagram node). */}
        <aside className="hidden xl:flex flex-col min-h-0 border-l border-[hsl(var(--line))] bg-[hsl(var(--paper))]">
          <div className="flex-1 min-h-0 overflow-auto scrollbar-thin">
            <ContextInspector
              arch={arch}
              selection={selection}
              onClear={() => setSelection(null)}
              onSelect={setSelection}
              lead={lead}
              body={body}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   Chapter panels
   ════════════════════════════════════════════════════════════════ */

function DiagramsPanel({
  diagrams,
  active,
  onActive,
  current,
  onSelect,
  arch,
}: {
  diagrams: Architecture["diagrams"];
  active: string;
  onActive: (id: string) => void;
  current?: Architecture["diagrams"][number];
  onSelect: SelectHandler;
  arch: Architecture;
}) {
  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-end justify-between gap-6 border-b border-[hsl(var(--line))] pb-4">
        <div className="min-w-0">
          <div className="section-num text-[10.5px] mb-1">Diagrams</div>
          <h3 className="display text-[clamp(1.25rem,1.8vw,1.55rem)] tracking-[-0.02em]">
            The same system, six lenses.
          </h3>
        </div>
        <span className="hidden md:inline font-mono text-[10px] uppercase tracking-wider text-[hsl(var(--ink-3))]">
          {diagrams.length} views
        </span>
      </header>

      {diagrams.length > 1 && (
        <LayoutGroup id="cockpit-diagram-segmented">
          <div className="flex flex-wrap gap-1 p-1 bg-[hsl(var(--paper-2))] border border-[hsl(var(--line))] rounded-lg w-fit">
            {diagrams.map((d) => {
              const isActive = active === d.id;
              return (
                <button
                  key={d.id}
                  onClick={() => onActive(d.id)}
                  className={cn(
                    "press relative px-3 py-1.5 rounded-md text-[11.5px] font-medium tracking-tight transition-colors",
                    isActive
                      ? "text-[hsl(var(--paper))]"
                      : "text-[hsl(var(--ink-2))] hover:text-[hsl(var(--ink))]",
                  )}
                >
                  {isActive && (
                    <motion.span
                      layoutId="cockpit-diagram-segmented-pill"
                      aria-hidden
                      className="absolute inset-0 -z-0 rounded-md bg-[hsl(var(--ink))]"
                      transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    />
                  )}
                  <span className="relative z-10">{d.kind.replace(/-/g, " ")}</span>
                </button>
              );
            })}
          </div>
        </LayoutGroup>
      )}
      {current && (
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.32, ease: EASE_OUT_EXPO }}
            className="flex flex-col gap-5"
          >
            <div>
              <h4 className="display text-[clamp(1.15rem,1.6vw,1.45rem)] leading-tight tracking-[-0.02em]">
                {current.title}
              </h4>
              <p className="mt-2 max-w-[64ch] text-[13.5px] leading-relaxed text-[hsl(var(--ink-2))]">
                {current.description}
              </p>
            </div>
            <DiagramErrorBoundary chart={current.mermaid}>
              <EditorialDiagram
                chart={current.mermaid}
                onSelect={(node) => {
                  // Try to resolve to a real component first so the inspector
                  // can show full details; fall back to a raw "node" selection.
                  const match = resolveComponent(arch, node.label);
                  onSelect(match ? { kind: "component", id: match.id } : { kind: "node", label: node.label, subLabel: node.subLabel });
                }}
              />
            </DiagramErrorBoundary>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}

function BriefPanel({ arch, onSelect, selection }: { arch: Architecture; onSelect: SelectHandler; selection: Selection }) {
  const selPattern = selection?.kind === "pattern" ? selection.index : -1;
  return (
    <div className="flex flex-col gap-8">
      <PanelHead n="02a" title="Requirements" />
      <div className="grid gap-px bg-[hsl(var(--line))] border border-[hsl(var(--line))] md:grid-cols-2">
        <BulletPanel title="Functional"     items={arch.requirements.functional} />
        <BulletPanel title="Non-functional" items={arch.requirements.non_functional} />
        <BulletPanel title="Assumptions"    items={arch.requirements.assumptions} muted />
        <BulletPanel title="Out of scope"   items={arch.requirements.out_of_scope} muted />
      </div>

      <PanelHead n="02b" title="Cloud design patterns applied" />
      <div className="grid gap-px bg-[hsl(var(--line))] border border-[hsl(var(--line))] md:grid-cols-2">
        {arch.applied_patterns.map((p, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onSelect({ kind: "pattern", index: i })}
            className={cn(
              "text-left bg-[hsl(var(--paper))] p-5 transition-colors hover:bg-[hsl(var(--paper-2))]/60",
              selPattern === i && "ring-1 ring-[hsl(var(--accent))]/60 ring-inset bg-[hsl(var(--paper-2))]/40",
            )}
          >
            <div className="flex items-baseline justify-between gap-3">
              <h4 className="display text-[16px] tracking-[-0.02em]">{p.name}</h4>
              <span className="tag !h-5 !text-[10px]">{p.category}</span>
            </div>
            <p className="mt-2 text-[13px] leading-relaxed text-[hsl(var(--ink-2))]">{p.why}</p>
            <p className="mt-2 text-[11px] font-mono text-[hsl(var(--accent))]">→ {p.where}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

function PiecesPanel({ arch, onSelect, selection }: { arch: Architecture; onSelect: SelectHandler; selection: Selection }) {
  const selId = selection?.kind === "component" ? selection.id : null;
  const selTech = selection?.kind === "tech" ? selection.index : -1;
  const [filter, setFilter] = useState<ComponentFilter>("all");
  const filtered = useMemo(
    () => arch.components.filter((c) => COMPONENT_FILTERS[filter].test(c.category)),
    [arch.components, filter],
  );
  const counts = useMemo(() => {
    const out: Record<ComponentFilter, number> = { all: arch.components.length, frontend: 0, backend: 0, data: 0, platform: 0 };
    for (const c of arch.components) {
      for (const k of ["frontend", "backend", "data", "platform"] as const) {
        if (COMPONENT_FILTERS[k].test(c.category)) out[k] += 1;
      }
    }
    return out;
  }, [arch.components]);

  return (
    <div className="flex flex-col gap-8">
      <PanelHead n="03a" title={`${arch.components.length} services, working together`} />
      <FilterPills
        layoutId="cockpit-pieces-filter"
        value={filter}
        onChange={setFilter}
        options={[
          { id: "all",      label: "All",      count: counts.all },
          { id: "frontend", label: "Frontend", count: counts.frontend },
          { id: "backend",  label: "Backend",  count: counts.backend },
          { id: "data",     label: "Data",     count: counts.data },
          { id: "platform", label: "Platform", count: counts.platform },
        ]}
      />
      <div className="grid gap-px bg-[hsl(var(--line))] border border-[hsl(var(--line))] md:grid-cols-2 2xl:grid-cols-3">
        <AnimatePresence mode="popLayout" initial={false}>
          {filtered.map((c, i) => (
            <motion.button
              layout
              key={c.id}
              type="button"
              onClick={() => onSelect({ kind: "component", id: c.id })}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28, ease: EASE_OUT_EXPO, delay: Math.min(i * 0.025, 0.18) }}
              className={cn(
                "text-left bg-[hsl(var(--paper))] p-5 flex flex-col gap-2 transition-colors hover:bg-[hsl(var(--paper-2))]/60",
                selId === c.id && "ring-1 ring-[hsl(var(--accent))]/60 ring-inset bg-[hsl(var(--paper-2))]/40",
              )}
            >
              <div className="flex items-baseline justify-between gap-2">
                <div className="flex items-baseline gap-2 min-w-0">
                  <span className="font-mono text-[10px] tabular-nums text-[hsl(var(--ink-3))]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h4 className="display text-[15px] tracking-[-0.02em] truncate">{c.name}</h4>
                </div>
                <span className="tag !h-5 !text-[10px] shrink-0">{c.category}</span>
              </div>
              <div className="font-mono text-[10.5px] text-[hsl(var(--ink-3))] uppercase tracking-wider">
                {c.technology}
              </div>
              <p className="text-[13px] leading-relaxed text-[hsl(var(--ink-2))]">{c.responsibility}</p>
              <div className="mt-1 pt-2 border-t border-[hsl(var(--line))]">
                <p className="eyebrow">Scaling</p>
                <p className="mt-1 text-[12px] text-[hsl(var(--ink))]">{c.scaling}</p>
              </div>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>

      <PanelHead n="03b" title="Tech stack rationale" />
      <DataTable
        headers={["Layer", "Choice", "Why", "Alternatives"]}
        rows={arch.tech_stack.map((t, i) => [
          <span key="l" className="font-medium">{t.layer}</span>,
          <span key="c" className="font-mono text-[12px]">{t.choice}</span>,
          <span key="w" className="text-[hsl(var(--ink-2))]">{t.rationale}</span>,
          <div key="a" className="flex flex-wrap gap-1">
            {t.alternatives.map((a) => (
              <span key={a} className="tag !h-5 !px-2 !text-[10px]">{a}</span>
            ))}
          </div>,
        ])}
        onRowClick={(i) => onSelect({ kind: "tech", index: i })}
        selectedRow={selTech}
      />
    </div>
  );
}

function TrafficPanel({ arch, onSelect, selection }: { arch: Architecture; onSelect: SelectHandler; selection: Selection }) {
  const selStep = selection?.kind === "flow" ? selection.step : -1;
  const selApi = selection?.kind === "api" ? selection.index : -1;
  return (
    <div className="flex flex-col gap-8">
      <PanelHead n="04a" title="Primary data flow" />
      <ol className="divide-y divide-[hsl(var(--line))] border-y border-[hsl(var(--line))]">
        {arch.data_flows.map((f) => (
          <li key={f.step}>
            <button
              type="button"
              onClick={() => onSelect({ kind: "flow", step: f.step })}
              className={cn(
                "w-full text-left grid grid-cols-[auto_1fr] gap-5 py-4 transition-colors hover:bg-[hsl(var(--paper-2))]/60",
                selStep === f.step && "bg-[hsl(var(--paper-2))]/40",
              )}
            >
              <span className="display text-[28px] tracking-[-0.04em] text-[hsl(var(--ink-3))] tabular-nums w-10">
                {String(f.step).padStart(2, "0")}
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="display text-[15px] tracking-[-0.02em]">{f.from}</span>
                  <span className="ms text-[14px] text-[hsl(var(--ink-3))]" aria-hidden>arrow_forward</span>
                  <span className="display text-[15px] tracking-[-0.02em]">{f.to}</span>
                  <span className="tag !h-5 !text-[10px]">{f.protocol}</span>
                  {f.latency_budget_ms !== undefined && (
                    <span className="tag tag-accent !h-5 !text-[10px]">{f.latency_budget_ms}ms</span>
                  )}
                </div>
                <p className="mt-1 text-[13px] text-[hsl(var(--ink-2))]">{f.action}</p>
                <p className="mt-0.5 font-mono text-[10.5px] text-[hsl(var(--ink-3))]">{f.payload}</p>
              </div>
            </button>
          </li>
        ))}
      </ol>

      <PanelHead n="04b" title="Data model" />
      <p className="text-[13px] text-[hsl(var(--ink-2))] max-w-[70ch] -mt-4">{arch.data_model.storage_strategy}</p>
      <div className="grid gap-px bg-[hsl(var(--line))] border border-[hsl(var(--line))] md:grid-cols-2">
        {arch.data_model.entities.map((e) => (
          <div key={e.name} className="bg-[hsl(var(--paper))] p-5">
            <h4 className="display text-[16px] tracking-[-0.02em]">{e.name}</h4>
            <table className="mt-3 w-full text-[11.5px]">
              <tbody>
                {e.fields.map((f) => (
                  <tr key={f.name} className="border-b border-[hsl(var(--line))] last:border-0">
                    <td className="py-1.5 pr-3 font-mono">{f.name}</td>
                    <td className="py-1.5 pr-3 text-[hsl(var(--ink-3))]">{f.type}</td>
                    <td className="py-1.5 text-[hsl(var(--ink-2))]">{f.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {e.relationships.length > 0 && (
              <p className="mt-2 text-[10.5px] font-mono text-[hsl(var(--accent))]">
                → {e.relationships.join("  ·  ")}
              </p>
            )}
          </div>
        ))}
      </div>

      <PanelHead n="04c" title="API surface" />
      <DataTable
        headers={["Method", "Path", "Purpose", "Auth", "Rate"]}
        rows={arch.api_surface.map((a) => [
          <span key="m" className="tag tag-solid !h-5 !px-2 !text-[10px]">{a.method}</span>,
          <span key="p" className="font-mono text-[12px]">{a.path}</span>,
          <span key="r" className="text-[hsl(var(--ink-2))]">{a.purpose}</span>,
          <span key="a" className="text-[12px]">{a.auth}</span>,
          <span key="rl" className="text-[12px] text-[hsl(var(--ink-3))]">{a.rate_limit ?? "—"}</span>,
        ])}
        onRowClick={(i) => onSelect({ kind: "api", index: i })}
        selectedRow={selApi}
      />
    </div>
  );
}

function NumbersPanel({ arch }: { arch: Architecture }) {
  return (
    <div className="flex flex-col gap-8">
      <PanelHead n="05a" title="Scale explorer" />
      <div className="card-paper p-5 md:p-7">
        <ScaleExplorer profiles={arch.scale_profiles} />
      </div>

      <PanelHead n="05b" title="Monthly cost — growth tier baseline" />
      <CostBreakdown items={arch.cost_breakdown} />
    </div>
  );
}

function RisksPanel({ arch, onSelect, selection }: { arch: Architecture; onSelect: SelectHandler; selection: Selection }) {
  const selId = selection?.kind === "risk" ? selection.id : null;
  const handleJump = (id: string) => {
    onSelect({ kind: "risk", id });
    if (typeof document !== "undefined") {
      const el = document.getElementById(`cockpit-risk-${id}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };
  return (
    <div className="flex flex-col gap-6">
      <PanelHead n="06" title={`${arch.risks.length} ways this can go wrong — and the mitigation`} />
      <RiskMatrix risks={arch.risks} onJump={handleJump} selectedId={selId} />
      <ul className="divide-y divide-[hsl(var(--line))] border-y border-[hsl(var(--line))]">
        {arch.risks.map((r, i) => (
          <li key={r.id} id={`cockpit-risk-${r.id}`} className="scroll-mt-6">
            <button
              type="button"
              onClick={() => onSelect({ kind: "risk", id: r.id })}
              className={cn(
                "w-full text-left py-5 grid grid-cols-[auto_1fr] gap-5 transition-colors hover:bg-[hsl(var(--paper-2))]/60",
                selId === r.id && "bg-[hsl(var(--paper-2))]/40",
              )}
            >
              <span className="display text-[28px] tracking-[-0.04em] text-[hsl(var(--ink-3))] tabular-nums w-10">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h4 className="display text-[16px] tracking-[-0.02em]">{r.title}</h4>
                  <div className="flex flex-wrap gap-1.5">
                    <span className={cn("inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider", RISK_PALETTE[r.impact])}>
                      {r.impact} impact
                    </span>
                    <span className="tag !h-5 !text-[10px]">{r.likelihood} likely</span>
                    <span className="tag !h-5 !text-[10px]">{r.category}</span>
                  </div>
                </div>
                <p className="mt-2 text-[13px] leading-relaxed text-[hsl(var(--ink-2))]">{r.mitigation}</p>
                {r.cloud_pattern && (
                  <p className="mt-1.5 text-[11px] font-mono text-[hsl(var(--accent))]">→ Pattern: {r.cloud_pattern}</p>
                )}
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function GuardsPanel({ arch, onSelect, selection }: { arch: Architecture; onSelect: SelectHandler; selection: Selection }) {
  const selIndex = selection?.kind === "security" ? selection.index : -1;
  return (
    <div className="flex flex-col gap-6">
      <PanelHead n="07" title="Identity, isolation, secrets, audit" />
      <div className="grid gap-px bg-[hsl(var(--line))] border border-[hsl(var(--line))] md:grid-cols-2">
        {arch.security.map((s, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onSelect({ kind: "security", index: i })}
            className={cn(
              "text-left bg-[hsl(var(--paper))] p-5 transition-colors hover:bg-[hsl(var(--paper-2))]/60",
              selIndex === i && "ring-1 ring-[hsl(var(--accent))]/60 ring-inset bg-[hsl(var(--paper-2))]/40",
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="tag !h-5 !text-[10px]">{s.area}</span>
              {s.gcp_service && (
                <span className="font-mono text-[10.5px] text-[hsl(var(--ink-3))]">{s.gcp_service}</span>
              )}
            </div>
            <h4 className="display mt-3 text-[15px] tracking-[-0.02em]">{s.control}</h4>
            <p className="mt-1.5 text-[13px] leading-relaxed text-[hsl(var(--ink-2))]">{s.implementation}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

function WatchPanel({ arch }: { arch: Architecture }) {
  return (
    <div className="flex flex-col gap-8">
      <PanelHead n="08a" title="Service-level objectives" />
      <div className="grid gap-px bg-[hsl(var(--line))] border border-[hsl(var(--line))] md:grid-cols-3">
        {arch.observability.slos.map((s, i) => (
          <div key={i} className="bg-[hsl(var(--paper))] p-5">
            <p className="eyebrow">{s.window}</p>
            <h4 className="mt-1.5 text-[13px] font-medium">{s.name}</h4>
            <div className="display mt-3 text-[clamp(1.4rem,2.3vw,2rem)] leading-none tracking-[-0.03em] accent">
              {s.target}
            </div>
          </div>
        ))}
      </div>

      <PanelHead n="08b" title="Alerts" />
      <ul className="divide-y divide-[hsl(var(--line))] border-y border-[hsl(var(--line))]">
        {arch.observability.alerts.map((a, i) => (
          <li key={i} className="py-3 flex items-start gap-4">
            <span
              className={cn(
                "shrink-0 inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider",
                a.severity === "critical"
                  ? "bg-[hsl(var(--bad))]/10 text-[hsl(var(--bad))] border-[hsl(var(--bad))]/20"
                  : a.severity === "warning"
                    ? "bg-[hsl(var(--warn))]/10 text-[hsl(var(--warn))] border-[hsl(var(--warn))]/20"
                    : "bg-[hsl(var(--paper-2))] text-[hsl(var(--ink-2))] border-[hsl(var(--line))]",
              )}
            >
              {a.severity}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium">{a.name}</p>
              <p className="font-mono text-[10.5px] text-[hsl(var(--ink-3))]">{a.condition}</p>
            </div>
          </li>
        ))}
      </ul>

      <div className="grid gap-px bg-[hsl(var(--line))] border border-[hsl(var(--line))] md:grid-cols-3">
        <BulletPanel title="Metrics" items={arch.observability.metrics} />
        <BulletPanel title="Logs"    items={arch.observability.logs} />
        <BulletPanel title="Traces"  items={arch.observability.traces} />
      </div>

      <PanelHead n="08c" title="Deployment" />
      <div className="grid gap-px bg-[hsl(var(--line))] border border-[hsl(var(--line))] md:grid-cols-2">
        <DDef k="Primary region"     v={arch.deployment.primary_region} />
        <DDef k="Additional regions" v={arch.deployment.additional_regions.join(", ") || "—"} />
        <DDef k="IaC"                v={arch.deployment.iac} />
        <DDef k="CI/CD"              v={arch.deployment.ci_cd} />
        <DDef k="Rollout"            v={arch.deployment.rollout_strategy} />
        <DDef k="Rollback"           v={arch.deployment.rollback_strategy} />
      </div>
    </div>
  );
}

function NextPanel({ arch }: { arch: Architecture }) {
  return (
    <div className="flex flex-col gap-6">
      <PanelHead n="09a" title="Roadmap" />
      <ol className="space-y-px bg-[hsl(var(--line))] border border-[hsl(var(--line))]">
        {arch.roadmap.map((r, i) => (
          <motion.li
            key={i}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, ease: EASE_OUT_EXPO, delay: Math.min(i * 0.08, 0.4) }}
            className="relative bg-[hsl(var(--paper))] p-5 pl-7"
          >
            <motion.span
              aria-hidden
              initial={{ scaleY: 0 }}
              whileInView={{ scaleY: 1 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.7, ease: EASE_OUT_EXPO, delay: Math.min(i * 0.08, 0.4) + 0.15 }}
              style={{ transformOrigin: "top" }}
              className="absolute left-3 top-5 bottom-5 w-px bg-[hsl(var(--accent))]/40"
            />
            <div className="flex items-baseline justify-between gap-3">
              <h4 className="display text-[17px] tracking-[-0.02em]">
                <span className="text-[hsl(var(--ink-3))] mr-2 tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                {r.phase}
              </h4>
              <span className="tag tag-accent !h-5 !text-[10px]">{r.timeline}</span>
            </div>
            <ul className="mt-3 space-y-1.5">
              {r.milestones.map((m, j) => (
                <motion.li
                  key={j}
                  initial={{ opacity: 0, x: -6 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.4, ease: EASE_OUT_EXPO, delay: Math.min(i * 0.08, 0.4) + 0.25 + j * 0.05 }}
                  className="flex gap-2 text-[13px]"
                >
                  <span className="ms mt-0.5 text-[14px] accent" aria-hidden>check</span>
                  <span>{m}</span>
                </motion.li>
              ))}
            </ul>
          </motion.li>
        ))}
      </ol>

      {arch.open_questions.length > 0 && (
        <>
          <PanelHead n="09b" title="Open questions" />
          <div className="bg-[hsl(var(--paper))] border border-[hsl(var(--line))] p-5">
            <BulletList items={arch.open_questions} muted />
          </div>
        </>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   Primitives sized for bounded panels
   ════════════════════════════════════════════════════════════════ */

function PanelHead({ n, title }: { n: string; title: string }) {
  return (
    <div className="flex items-baseline gap-3">
      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[hsl(var(--ink-3))]">{n}</span>
      <h3 className="display text-[clamp(1.05rem,1.5vw,1.35rem)] leading-tight tracking-[-0.02em]">
        {title}
      </h3>
      <span className="flex-1 border-b border-[hsl(var(--line))] mb-1.5" />
    </div>
  );
}

function BulletPanel({ title, items, muted }: { title: string; items: string[]; muted?: boolean }) {
  return (
    <div className="bg-[hsl(var(--paper))] p-5">
      <p className="eyebrow mb-3">{title}</p>
      <BulletList items={items} muted={muted} />
    </div>
  );
}

function BulletList({ items, muted }: { items: string[]; muted?: boolean }) {
  return (
    <ul className="space-y-2">
      {items.map((it, i) => (
        <li key={i} className="flex gap-2.5 text-[13px] leading-relaxed">
          <span className="mt-1.5 size-1 shrink-0 rounded-full bg-[hsl(var(--ink-3))]" />
          <span className={muted ? "text-[hsl(var(--ink-2))]" : "text-[hsl(var(--ink))]"}>{it}</span>
        </li>
      ))}
    </ul>
  );
}

function DataTable({
  headers,
  rows,
  onRowClick,
  selectedRow,
}: {
  headers: string[];
  rows: React.ReactNode[][];
  onRowClick?: (i: number) => void;
  selectedRow?: number;
}) {
  return (
    <div className="overflow-x-auto border border-[hsl(var(--line))] bg-[hsl(var(--paper))]">
      <table className="w-full text-[12.5px]">
        <thead className="bg-[hsl(var(--paper-2))]">
          <tr>
            {headers.map((h) => (
              <th key={h} className="text-left py-2.5 px-4 font-mono text-[10px] uppercase tracking-[0.16em] text-[hsl(var(--ink-3))] font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              onClick={onRowClick ? () => onRowClick(i) : undefined}
              className={cn(
                "border-t border-[hsl(var(--line))] align-top",
                onRowClick && "cursor-pointer transition-colors hover:bg-[hsl(var(--paper-2))]/60",
                selectedRow === i && "bg-[hsl(var(--paper-2))]/40",
              )}
            >
              {row.map((cell, j) => (
                <td key={j} className="py-3 px-4">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Ticker({ n, k }: { n: number; k: string }) {
  return (
    <div>
      <div className="display-tight text-[clamp(1.3rem,2vw,1.9rem)] leading-none tracking-[-0.03em] tabular-nums">
        {n}
      </div>
      <div className="mt-1 eyebrow">{k}</div>
    </div>
  );
}

function DDef({ k, v }: { k: string; v: string }) {
  return (
    <div className="bg-[hsl(var(--paper))] p-4">
      <p className="eyebrow">{k}</p>
      <p className="mt-1.5 text-[13.5px] font-medium text-[hsl(var(--ink))]">{v}</p>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   Context inspector — what the right panel shows
   ════════════════════════════════════════════════════════════════ */

/** Fuzzy-resolve a free-form node label (from a Mermaid diagram or data
 *  flow row) back to a real component, so the inspector can pull up
 *  full details. Returns undefined if there's no plausible match. */
function resolveComponent(arch: Architecture, ref: string): ArchComponent | undefined {
  const r = ref.toLowerCase().trim();
  if (!r) return;
  const exact = arch.components.find((c) => c.name.toLowerCase() === r);
  if (exact) return exact;
  for (const c of arch.components) if (r.includes(c.name.toLowerCase())) return c;
  for (const c of arch.components) if (c.name.toLowerCase().includes(r)) return c;
  for (const c of arch.components) if (c.technology.toLowerCase().includes(r)) return c;
  const tokens = r.split(/[^a-z0-9]+/).filter((t) => t.length > 3);
  if (!tokens.length) return;
  for (const c of arch.components) {
    const hay = `${c.name} ${c.technology}`.toLowerCase();
    if (tokens.every((t) => hay.includes(t))) return c;
  }
  return;
}

function ContextInspector({
  arch,
  selection,
  onClear,
  onSelect,
  lead,
  body,
}: {
  arch: Architecture;
  selection: Selection;
  onClear: () => void;
  onSelect: SelectHandler;
  lead: string;
  body: string;
}) {
  if (!selection) {
    return <InspectorBrief arch={arch} lead={lead} body={body} />;
  }
  switch (selection.kind) {
    case "component": {
      const c = arch.components.find((x) => x.id === selection.id);
      if (!c) return <InspectorBrief arch={arch} lead={lead} body={body} />;
      return <InspectorComponent c={c} arch={arch} onClear={onClear} onSelect={onSelect} />;
    }
    case "flow": {
      const f = arch.data_flows.find((x) => x.step === selection.step);
      if (!f) return <InspectorBrief arch={arch} lead={lead} body={body} />;
      return <InspectorFlow f={f} arch={arch} onClear={onClear} onSelect={onSelect} />;
    }
    case "risk": {
      const r = arch.risks.find((x) => x.id === selection.id);
      if (!r) return <InspectorBrief arch={arch} lead={lead} body={body} />;
      return <InspectorRisk r={r} onClear={onClear} />;
    }
    case "pattern": {
      const p = arch.applied_patterns[selection.index];
      if (!p) return <InspectorBrief arch={arch} lead={lead} body={body} />;
      return <InspectorPattern p={p} onClear={onClear} />;
    }
    case "api": {
      const a = arch.api_surface[selection.index];
      if (!a) return <InspectorBrief arch={arch} lead={lead} body={body} />;
      return <InspectorApi a={a} onClear={onClear} />;
    }
    case "tech": {
      const t = arch.tech_stack[selection.index];
      if (!t) return <InspectorBrief arch={arch} lead={lead} body={body} />;
      return <InspectorTech t={t} onClear={onClear} />;
    }
    case "security": {
      const s = arch.security[selection.index];
      if (!s) return <InspectorBrief arch={arch} lead={lead} body={body} />;
      return <InspectorSecurity s={s} onClear={onClear} />;
    }
    case "diagram": {
      const d = arch.diagrams.find((x) => x.id === selection.id);
      if (!d) return <InspectorBrief arch={arch} lead={lead} body={body} />;
      return <InspectorDiagram d={d} onClear={onClear} />;
    }
    case "node": {
      return <InspectorNode label={selection.label} subLabel={selection.subLabel} onClear={onClear} />;
    }
  }
}

function InspectorShell({ eyebrow, title, sub, onClear, children }: {
  eyebrow: string;
  title: string;
  sub?: string;
  onClear: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="p-6 lg:p-7 flex flex-col gap-5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="section-num text-[10.5px]">{eyebrow}</span>
        <button
          type="button"
          onClick={onClear}
          className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-[hsl(var(--ink-3))] hover:text-[hsl(var(--ink))] transition-colors"
          title="Back to brief"
        >
          ← brief
        </button>
      </div>
      <div>
        <h2 className="display-tight text-[clamp(1.25rem,1.8vw,1.7rem)] leading-[1.05] tracking-[-0.02em]">
          {title}
        </h2>
        {sub && (
          <p className="mt-1.5 font-mono text-[10.5px] uppercase tracking-wider text-[hsl(var(--ink-3))]">
            {sub}
          </p>
        )}
      </div>
      {children}
    </div>
  );
}

function InspectorField({ k, v, mono }: { k: string; v: React.ReactNode; mono?: boolean }) {
  return (
    <div className="border-t border-[hsl(var(--line))] pt-3">
      <p className="eyebrow">{k}</p>
      <div className={cn("mt-1 text-[13px] leading-[1.5] text-[hsl(var(--ink))]", mono && "font-mono text-[12px]")}>
        {v}
      </div>
    </div>
  );
}

function InspectorBrief({ arch, lead, body }: { arch: Architecture; lead: string; body: string }) {
  return (
    <div className="p-6 lg:p-7 flex flex-col gap-6">
      <div className="flex items-baseline justify-between gap-3">
        <span className="section-num text-[10.5px]">Brief</span>
        <span className="font-mono text-[10px] uppercase tracking-wider text-[hsl(var(--ink-3))]">
          {arch.meta.domain}
        </span>
      </div>

      <div className="relative">
        <span aria-hidden className="absolute -left-1 -top-6 serif italic accent text-[64px] leading-none select-none">
          “
        </span>
        <h2 className="display-tight text-[clamp(1.4rem,1.9vw,1.85rem)] leading-[1.02] tracking-[-0.03em]">
          {lead}
        </h2>
      </div>

      {body && (
        <p className="text-[13.5px] leading-[1.55] text-[hsl(var(--ink-2))]">{body}</p>
      )}

      <p className="serif italic text-[14px] leading-[1.4] text-[hsl(var(--ink-2))] border-t border-[hsl(var(--line))] pt-4">
        {arch.meta.one_liner}
      </p>

      <dl className="grid grid-cols-4 gap-x-3 border-t border-[hsl(var(--line))] pt-5">
        <Ticker n={arch.components.length} k="comp." />
        <Ticker n={arch.diagrams.length}   k="diag." />
        <Ticker n={arch.risks.length}      k="risks" />
        <Ticker n={arch.api_surface.length} k="APIs" />
      </dl>

      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[hsl(var(--ink-3))] border-t border-[hsl(var(--line))] pt-4">
        Tip · click any card, diagram node, flow row or risk for details here.
      </p>
    </div>
  );
}

function InspectorComponent({
  c, arch, onClear, onSelect,
}: { c: ArchComponent; arch: Architecture; onClear: () => void; onSelect: SelectHandler }) {
  const relatedFlows = arch.data_flows.filter(
    (f) => f.from.toLowerCase().includes(c.name.toLowerCase()) || f.to.toLowerCase().includes(c.name.toLowerCase()),
  );
  return (
    <InspectorShell eyebrow="Component" title={c.name} sub={c.category} onClear={onClear}>
      <InspectorField k="Technology" v={c.technology} mono />
      <InspectorField k="Responsibility" v={c.responsibility} />
      <InspectorField k="Scaling" v={c.scaling} />
      {c.alternatives.length > 0 && (
        <InspectorField
          k="Alternatives"
          v={
            <div className="flex flex-wrap gap-1">
              {c.alternatives.map((a) => (
                <span key={a} className="tag !h-5 !px-2 !text-[10px]">{a}</span>
              ))}
            </div>
          }
        />
      )}
      {relatedFlows.length > 0 && (
        <InspectorField
          k={`In ${relatedFlows.length} flow${relatedFlows.length === 1 ? "" : "s"}`}
          v={
            <ul className="space-y-1.5">
              {relatedFlows.slice(0, 6).map((f) => (
                <li key={f.step}>
                  <button
                    type="button"
                    onClick={() => onSelect({ kind: "flow", step: f.step })}
                    className="w-full text-left text-[12px] text-[hsl(var(--ink-2))] hover:text-[hsl(var(--ink))] hover:underline underline-offset-2"
                  >
                    <span className="font-mono text-[10px] text-[hsl(var(--ink-3))] mr-2 tabular-nums">
                      {String(f.step).padStart(2, "0")}
                    </span>
                    {f.from} → {f.to}
                  </button>
                </li>
              ))}
            </ul>
          }
        />
      )}
    </InspectorShell>
  );
}

function InspectorFlow({
  f, arch, onClear, onSelect,
}: { f: DataFlow; arch: Architecture; onClear: () => void; onSelect: SelectHandler }) {
  const fromComp = resolveComponent(arch, f.from);
  const toComp = resolveComponent(arch, f.to);
  return (
    <InspectorShell
      eyebrow={`Flow · step ${String(f.step).padStart(2, "0")}`}
      title={f.action}
      sub={f.protocol}
      onClear={onClear}
    >
      <InspectorField
        k="From"
        v={
          fromComp ? (
            <button
              type="button"
              onClick={() => onSelect({ kind: "component", id: fromComp.id })}
              className="text-[hsl(var(--ink))] hover:underline underline-offset-2"
            >
              {f.from}
            </button>
          ) : f.from
        }
      />
      <InspectorField
        k="To"
        v={
          toComp ? (
            <button
              type="button"
              onClick={() => onSelect({ kind: "component", id: toComp.id })}
              className="text-[hsl(var(--ink))] hover:underline underline-offset-2"
            >
              {f.to}
            </button>
          ) : f.to
        }
      />
      <InspectorField k="Payload" v={f.payload} mono />
      {f.latency_budget_ms !== undefined && (
        <InspectorField k="Latency budget" v={`${f.latency_budget_ms} ms`} mono />
      )}
    </InspectorShell>
  );
}

function InspectorRisk({ r, onClear }: { r: Risk; onClear: () => void }) {
  return (
    <InspectorShell
      eyebrow={`Risk · ${r.category}`}
      title={r.title}
      sub={`${r.impact} impact · ${r.likelihood} likely`}
      onClear={onClear}
    >
      <InspectorField k="Mitigation" v={r.mitigation} />
      {r.cloud_pattern && <InspectorField k="Pattern" v={r.cloud_pattern} mono />}
    </InspectorShell>
  );
}

function InspectorPattern({ p, onClear }: { p: AppliedPattern; onClear: () => void }) {
  return (
    <InspectorShell eyebrow="Pattern" title={p.name} sub={p.category} onClear={onClear}>
      <InspectorField k="Why" v={p.why} />
      <InspectorField k="Where" v={p.where} mono />
    </InspectorShell>
  );
}

type ApiEntry = Architecture["api_surface"][number];
function InspectorApi({ a, onClear }: { a: ApiEntry; onClear: () => void }) {
  return (
    <InspectorShell eyebrow="API" title={`${a.method} ${a.path}`} sub={a.auth} onClear={onClear}>
      <InspectorField k="Purpose" v={a.purpose} />
      {a.rate_limit && <InspectorField k="Rate limit" v={a.rate_limit} mono />}
    </InspectorShell>
  );
}

function InspectorTech({ t, onClear }: { t: TechChoice; onClear: () => void }) {
  return (
    <InspectorShell eyebrow="Tech choice" title={t.choice} sub={t.layer} onClear={onClear}>
      <InspectorField k="Why" v={t.rationale} />
      {t.alternatives.length > 0 && (
        <InspectorField
          k="Alternatives"
          v={
            <div className="flex flex-wrap gap-1">
              {t.alternatives.map((a) => (
                <span key={a} className="tag !h-5 !px-2 !text-[10px]">{a}</span>
              ))}
            </div>
          }
        />
      )}
    </InspectorShell>
  );
}

function InspectorSecurity({ s, onClear }: { s: SecurityControl; onClear: () => void }) {
  return (
    <InspectorShell eyebrow={`Security · ${s.area}`} title={s.control} sub={s.gcp_service} onClear={onClear}>
      <InspectorField k="Implementation" v={s.implementation} />
    </InspectorShell>
  );
}

function InspectorDiagram({ d, onClear }: { d: Architecture["diagrams"][number]; onClear: () => void }) {
  return (
    <InspectorShell eyebrow="Diagram" title={d.title} sub={d.kind.replace(/-/g, " ")} onClear={onClear}>
      <InspectorField k="What it shows" v={d.description} />
    </InspectorShell>
  );
}

function InspectorNode({ label, subLabel, onClear }: { label: string; subLabel?: string; onClear: () => void }) {
  return (
    <InspectorShell eyebrow="Diagram node" title={label} sub={subLabel} onClear={onClear}>
      <p className="font-mono text-[10.5px] uppercase tracking-wider text-[hsl(var(--ink-3))] border-t border-[hsl(var(--line))] pt-3">
        No matching component in the brief.
      </p>
    </InspectorShell>
  );
}

/* ════════════════════════════════════════════════════════════════
   Narrative helpers — Story panel, chapter intro & up-next footer
   ════════════════════════════════════════════════════════════════ */

function chapterByIdOrNull(id: ChapterId) {
  return CHAPTERS.find((c) => c.id === id) ?? null;
}

function ChapterIntro({ chapter }: { chapter: ChapterId }) {
  if (chapter === "story") return null; // StoryPanel has its own hero
  const c = chapterByIdOrNull(chapter);
  if (!c) return null;
  return (
    <header className="mb-8 flex items-baseline gap-4 border-b border-[hsl(var(--line))] pb-5">
      <span className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-[hsl(var(--ink-3))] shrink-0">
        {ACT_LABELS[c.act]} · {c.n}
      </span>
      <div className="min-w-0">
        <h2 className="display text-[clamp(1.35rem,2.2vw,1.9rem)] leading-tight tracking-[-0.025em]">
          {c.label}
        </h2>
        <p className="mt-1.5 text-[13.5px] text-[hsl(var(--ink-2))] max-w-[64ch]">
          {c.sub}
        </p>
      </div>
    </header>
  );
}

function ChapterFooter({ chapter, onJump }: { chapter: ChapterId; onJump: (id: ChapterId) => void }) {
  const idx = CHAPTERS.findIndex((c) => c.id === chapter);
  const next = idx >= 0 && idx < CHAPTERS.length - 1 ? CHAPTERS[idx + 1] : null;
  const prev = idx > 0 ? CHAPTERS[idx - 1] : null;
  if (!next && !prev) return null;
  return (
    <nav className="mt-12 grid gap-px bg-[hsl(var(--line))] border border-[hsl(var(--line))] sm:grid-cols-2">
      {prev ? (
        <button
          type="button"
          onClick={() => onJump(prev.id)}
          className="text-left bg-[hsl(var(--paper))] p-5 transition-colors hover:bg-[hsl(var(--paper-2))]/60 group"
        >
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[hsl(var(--ink-3))]">
            ← Previously
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-[11px] tabular-nums text-[hsl(var(--ink-3))]">{prev.n}</span>
            <span className="display text-[16px] tracking-[-0.02em]">{prev.label}</span>
          </div>
          <p className="mt-1 text-[12.5px] text-[hsl(var(--ink-2))]">{prev.sub}</p>
        </button>
      ) : (
        <div className="hidden sm:block bg-[hsl(var(--paper))]" />
      )}
      {next ? (
        <button
          type="button"
          onClick={() => onJump(next.id)}
          className="text-left bg-[hsl(var(--paper))] p-5 transition-colors hover:bg-[hsl(var(--paper-2))]/60 group"
        >
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[hsl(var(--accent))]">
            Up next →
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-[11px] tabular-nums text-[hsl(var(--ink-3))]">{next.n}</span>
            <span className="display text-[16px] tracking-[-0.02em]">{next.label}</span>
          </div>
          <p className="mt-1 text-[12.5px] text-[hsl(var(--ink-2))]">{next.sub}</p>
        </button>
      ) : (
        <div className="hidden sm:block bg-[hsl(var(--paper))]" />
      )}
    </nav>
  );
}

function StoryPanel({
  arch,
  lead,
  body,
  onJump,
}: {
  arch: Architecture;
  lead: string;
  body: string;
  onJump: (id: ChapterId) => void;
}) {
  const componentCount = arch.components.length;
  const diagramCount = arch.diagrams.length;
  const riskCount = arch.risks.length;
  const patternCount = arch.applied_patterns.length;
  const regions = [arch.deployment.primary_region, ...(arch.deployment.additional_regions ?? [])]
    .filter(Boolean);
  const tiers = arch.scale_profiles.length;
  // Pick a representative cost band: the "growth" profile if present, otherwise the second tier.
  const growth =
    arch.scale_profiles.find((p) => /growth/i.test(p.tier)) ??
    arch.scale_profiles[Math.min(1, arch.scale_profiles.length - 1)];
  const costBand = growth
    ? `₹${formatINRCompact(growth.monthly_cost_inr_low)}–₹${formatINRCompact(growth.monthly_cost_inr_high)} / mo`
    : "—";

  const acts: { act: Act; ids: ChapterId[] }[] = [
    { act: "why",  ids: ["brief"] },
    { act: "what", ids: ["design", "pieces", "traffic", "diagrams"] },
    { act: "how",  ids: ["numbers", "breaks", "guards", "watch", "next"] },
  ];

  return (
    <div className="flex flex-col gap-10">
      {/* Hero — title, one-liner, the lead sentence */}
      <header className="border-b border-[hsl(var(--line))] pb-8">
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-[hsl(var(--ink-3))]">
            Overview · {arch.meta.domain}
          </span>
        </div>
        <h2 className="mt-3 display text-[clamp(1.7rem,3.2vw,2.6rem)] leading-[1.05] tracking-[-0.03em] max-w-[28ch]">
          {arch.meta.title}
        </h2>
        <p className="mt-3 text-[15px] text-[hsl(var(--ink-2))] max-w-[64ch]">
          {arch.meta.one_liner}
        </p>
        {lead && (
          <p className="mt-7 serif text-[clamp(1.15rem,1.7vw,1.4rem)] leading-[1.45] text-[hsl(var(--ink))] max-w-[60ch]">
            <WordFade text={lead} />
          </p>
        )}
        {body && (
          <p className="mt-4 text-[14px] leading-relaxed text-[hsl(var(--ink-2))] max-w-[68ch]">
            {body}
          </p>
        )}
      </header>

      {/* At-a-glance ticker */}
      <section>
        <p className="eyebrow mb-4">At a glance</p>
        <div className="grid gap-px bg-[hsl(var(--line))] border border-[hsl(var(--line))] grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          <StoryStat n={componentCount} k="components" />
          <StoryStat n={diagramCount}  k="diagrams" />
          <StoryStat n={patternCount}  k="patterns applied" />
          <StoryStat n={riskCount}     k="risks scored" />
          <StoryStat n={tiers}         k="scale tiers" />
          <StoryStat label={costBand}  k="growth tier cost" />
        </div>
        {regions.length > 0 && (
          <p className="mt-3 text-[12px] font-mono uppercase tracking-wider text-[hsl(var(--ink-3))]">
            Runs in: {regions.join(" · ")} · {arch.deployment.iac} · {arch.deployment.ci_cd}
          </p>
        )}
      </section>

      {/* Reading map — 3 acts */}
      <section>
        <p className="eyebrow mb-4">Read in this order</p>
        <div className="flex flex-col gap-5">
          {acts.map(({ act, ids }) => (
            <div key={act} className="grid gap-4 md:grid-cols-[160px_1fr] items-start">
              <div className="md:pt-1">
                <p className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-[hsl(var(--ink-3))]">
                  {ACT_LABELS[act]}
                </p>
                <p className="mt-1 text-[12.5px] text-[hsl(var(--ink-2))] max-w-[22ch]">
                  {act === "why"  && "Start with the problem statement and constraints."}
                  {act === "what" && "Inspect the shape, the pieces, and how they talk."}
                  {act === "how"  && "Understand cost, risk, defence, and operations."}
                </p>
              </div>
              <div className="grid gap-px bg-[hsl(var(--line))] border border-[hsl(var(--line))] sm:grid-cols-2 lg:grid-cols-3">
                {ids.map((id) => {
                  const c = chapterByIdOrNull(id);
                  if (!c) return null;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => onJump(id)}
                      className="text-left bg-[hsl(var(--paper))] p-4 transition-colors hover:bg-[hsl(var(--paper-2))]/60"
                    >
                      <div className="flex items-baseline gap-2">
                        <span className="font-mono text-[10.5px] tabular-nums text-[hsl(var(--ink-3))]">{c.n}</span>
                        <span className="display text-[15px] tracking-[-0.02em]">{c.label}</span>
                        <span className="ms text-[14px] text-[hsl(var(--ink-3))] ml-auto" aria-hidden>arrow_forward</span>
                      </div>
                      <p className="mt-1 text-[12.5px] text-[hsl(var(--ink-2))]">{c.sub}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function StoryStat({ n, label, k }: { n?: number; label?: string; k: string }) {
  return (
    <div className="bg-[hsl(var(--paper))] p-4">
      <div className="display-tight text-[clamp(1.1rem,1.8vw,1.5rem)] leading-none tracking-[-0.025em] tabular-nums">
        {label ?? n}
      </div>
      <div className="mt-2 font-mono text-[10px] uppercase tracking-wider text-[hsl(var(--ink-3))]">
        {k}
      </div>
    </div>
  );
}

function formatINRCompact(paiseOrRupees: number): string {
  // scale_profiles values are stored as rupees per docs; format with Indian grouping.
  const n = paiseOrRupees;
  if (!Number.isFinite(n)) return "—";
  if (n >= 1_00_00_000) return `${(n / 1_00_00_000).toFixed(1)}Cr`;
  if (n >= 1_00_000)    return `${(n / 1_00_000).toFixed(1)}L`;
  if (n >= 1_000)       return `${(n / 1_000).toFixed(0)}K`;
  return String(Math.round(n));
}

/* ════════════════════════════════════════════════════════════════
   Phase 5A — motion + interactivity primitives (cockpit-local)
   ════════════════════════════════════════════════════════════════ */

/**
 * Word-by-word fade-in for serif lead sentences. Splits on whitespace,
 * preserves spaces as plain spans (no animation cost), and degrades to
 * static text for reduced-motion users.
 */
function WordFade({
  text,
  delayBase = 0.05,
  stagger = 0.045,
  className,
}: {
  text: string;
  delayBase?: number;
  stagger?: number;
  className?: string;
}) {
  const reduce = useReducedMotionSafe();
  if (reduce) return <span className={className}>{text}</span>;
  const parts = text.split(/(\s+)/);
  let wordIdx = 0;
  return (
    <span className={className}>
      {parts.map((p, i) => {
        if (!/\S/.test(p)) return <span key={i}>{p}</span>;
        const idx = wordIdx++;
        return (
          <motion.span
            key={i}
            initial={{ opacity: 0, y: 6, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.46, delay: delayBase + idx * stagger, ease: EASE_OUT_EXPO }}
            style={{ display: "inline-block" }}
          >
            {p}
          </motion.span>
        );
      })}
    </span>
  );
}

/* ─────────────── Components-tab filter pills ─────────────── */

type ComponentFilter = "all" | "frontend" | "backend" | "data" | "platform";

const COMPONENT_FILTERS: Record<ComponentFilter, RegExp> = {
  all:      /.*/,
  frontend: /^(frontend|cdn|edge)$/,
  backend:  /^(api|service|worker|auth|integration)$/,
  data:     /^(database|cache|queue|storage)$/,
  platform: /^(observability|ml|other)$/,
};

function FilterPills<T extends string>({
  options,
  value,
  onChange,
  layoutId,
}: {
  options: { id: T; label: string; count?: number }[];
  value: T;
  onChange: (v: T) => void;
  layoutId: string;
}) {
  return (
    <LayoutGroup id={layoutId}>
      <div className="flex flex-wrap items-center gap-1">
        {options.map((o) => {
          const active = o.id === value;
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => onChange(o.id)}
              className={cn(
                "relative px-3 py-1.5 text-[12px] font-medium tracking-tight transition-colors",
                active ? "text-[hsl(var(--ink))]" : "text-[hsl(var(--ink-3))] hover:text-[hsl(var(--ink-2))]",
              )}
            >
              {active && (
                <motion.span
                  layoutId={`${layoutId}-pill`}
                  aria-hidden
                  className="absolute inset-0 rounded-full bg-[hsl(var(--paper-2))] ring-1 ring-[hsl(var(--line))]"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <span className="relative inline-flex items-baseline gap-1.5">
                {o.label}
                {o.count !== undefined && (
                  <span className="font-mono text-[10px] tabular-nums opacity-60">{o.count}</span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </LayoutGroup>
  );
}

/* ─────────────── Cost breakdown — bars + count-up total ─────────────── */

function CostBreakdown({ items }: { items: CostLineItem[] }) {
  const reduce = useReducedMotionSafe();
  const mids = items.map((c) => (c.monthly_inr_low + c.monthly_inr_high) / 2);
  const max = Math.max(1, ...mids);
  const total = mids.reduce((s, n) => s + n, 0);
  const totalLow = items.reduce((s, c) => s + c.monthly_inr_low, 0);
  const totalHigh = items.reduce((s, c) => s + c.monthly_inr_high, 0);
  return (
    <div className="bg-[hsl(var(--paper))] border border-[hsl(var(--line))] overflow-hidden">
      <div className="hidden md:grid grid-cols-[1.4fr_0.7fr_1.6fr_0.4fr] gap-x-4 px-4 py-2.5 bg-[hsl(var(--paper-2))] font-mono text-[10px] uppercase tracking-[0.16em] text-[hsl(var(--ink-3))] border-b border-[hsl(var(--line))]">
        <div>Service</div>
        <div className="text-right">Qty</div>
        <div>Monthly INR</div>
        <div className="text-right">Share</div>
      </div>
      {items.map((c, i) => {
        const mid = mids[i];
        const pct = (mid / max) * 100;
        const sharePct = total > 0 ? (mid / total) * 100 : 0;
        const shareLabel = sharePct >= 1 ? `${Math.round(sharePct)}%` : "<1%";
        return (
          <div
            key={i}
            className="grid md:grid-cols-[1.4fr_0.7fr_1.6fr_0.4fr] grid-cols-[1.6fr_0.6fr] gap-x-4 gap-y-2 items-center px-4 py-3 border-b border-[hsl(var(--line))] last:border-b-0 hover:bg-[hsl(var(--paper-2))]/40 transition-colors"
          >
            <div className="min-w-0">
              <div className="text-[13px] font-medium truncate">{c.service}</div>
              {c.notes && <div className="text-[11px] text-[hsl(var(--ink-3))] truncate">{c.notes}</div>}
            </div>
            <div className="text-[12px] text-[hsl(var(--ink-2))] tabular-nums whitespace-nowrap text-right md:text-left">
              {c.estimated_qty}
            </div>
            <div className="col-span-2 md:col-span-1 flex items-center gap-3 min-w-0">
              <div className="relative h-1.5 flex-1 bg-[hsl(var(--paper-2))] overflow-hidden">
                <motion.div
                  className="h-full bg-[hsl(var(--accent))]"
                  initial={reduce ? { width: `${pct}%` } : { width: 0 }}
                  whileInView={{ width: `${pct}%` }}
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{ duration: 0.85, delay: i * 0.04, ease: EASE_OUT_EXPO }}
                />
              </div>
              <div className="font-mono text-[11.5px] tabular-nums whitespace-nowrap shrink-0">
                ₹{c.monthly_inr_low.toLocaleString("en-IN")}–₹{c.monthly_inr_high.toLocaleString("en-IN")}
              </div>
            </div>
            <div className="font-mono text-[11.5px] tabular-nums text-[hsl(var(--ink-2))] text-right whitespace-nowrap col-start-2 md:col-start-auto row-start-1 md:row-start-auto">
              {shareLabel}
            </div>
          </div>
        );
      })}
      {/* Total row */}
      <div className="grid grid-cols-[1.4fr_2.6fr] md:grid-cols-[1.4fr_0.7fr_1.6fr_0.4fr] gap-x-4 items-baseline px-4 py-4 border-t-2 border-[hsl(var(--ink))] bg-[hsl(var(--paper-2))]/40">
        <div className="text-[12px] font-mono uppercase tracking-[0.16em] text-[hsl(var(--ink-3))]">
          Total · midpoint
        </div>
        <div className="hidden md:block" />
        <div className="display tabular-nums tracking-[-0.02em] text-[clamp(1.1rem,1.8vw,1.5rem)]">
          ≈ ₹<CountUp to={Math.round(total)} duration={1.6} />
          <span className="ml-3 font-mono text-[11px] tracking-wider text-[hsl(var(--ink-3))] normal-case">
            band ₹{totalLow.toLocaleString("en-IN")}–₹{totalHigh.toLocaleString("en-IN")}
          </span>
        </div>
        <div className="font-mono text-[11.5px] tabular-nums text-[hsl(var(--ink-3))] text-right hidden md:block">
          100%
        </div>
      </div>
    </div>
  );
}

/* ─────────────── Risk matrix heatmap ─────────────── */

function RiskMatrix({
  risks,
  onJump,
  selectedId,
}: {
  risks: Risk[];
  onJump: (id: string) => void;
  selectedId: string | null;
}) {
  const impacts: Risk["impact"][] = ["critical", "high", "medium", "low"];
  const likelihoods: Risk["likelihood"][] = ["low", "medium", "high"];
  const cellRisks = (im: Risk["impact"], lk: Risk["likelihood"]) =>
    risks.filter((r) => r.impact === im && r.likelihood === lk);
  // Heat 0..1 — critical+high lights up, low+low stays neutral.
  const heat = (im: Risk["impact"], lk: Risk["likelihood"]) => {
    const ix = { low: 0, medium: 1, high: 2, critical: 3 }[im];
    const lx = { low: 0, medium: 1, high: 2 }[lk];
    return (ix + lx * 1.2) / 5.4;
  };
  const dotColor = (im: Risk["impact"]) =>
    im === "critical" ? "bg-[hsl(var(--ink))]"
    : im === "high"   ? "bg-[hsl(var(--bad))]"
    : im === "medium" ? "bg-[hsl(var(--warn))]"
    :                   "bg-[hsl(var(--ink-3))]";

  return (
    <div className="card-paper p-5 md:p-6">
      <div className="flex items-baseline justify-between gap-3 mb-5">
        <div>
          <p className="eyebrow">Risk matrix</p>
          <p className="mt-1 text-[12.5px] text-[hsl(var(--ink-2))]">
            Likelihood × impact. Click a dot to jump to the risk.
          </p>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-wider text-[hsl(var(--ink-3))]">
          {risks.length} risks
        </span>
      </div>
      <div className="grid grid-cols-[auto_1fr] gap-3">
        {/* y-axis label */}
        <div className="hidden md:flex items-center justify-end pr-1">
          <span className="[writing-mode:vertical-rl] rotate-180 font-mono text-[9.5px] uppercase tracking-[0.22em] text-[hsl(var(--ink-3))]">
            ← higher impact
          </span>
        </div>
        <div className="min-w-0">
          <div className="grid grid-cols-[auto_repeat(3,minmax(0,1fr))] gap-1.5">
            {impacts.flatMap((im) => [
              <div
                key={`${im}-label`}
                className="flex items-center justify-end pr-2 font-mono text-[9.5px] uppercase tracking-[0.18em] text-[hsl(var(--ink-3))] min-w-[68px]"
              >
                {im}
              </div>,
              ...likelihoods.map((lk) => {
                const cell = cellRisks(im, lk);
                const h = heat(im, lk);
                return (
                  <div
                    key={`${im}-${lk}`}
                    className="aspect-[2/1] relative border border-[hsl(var(--line))] flex flex-wrap items-center justify-center gap-1 p-1.5 transition-colors"
                    style={{ background: `hsl(var(--accent) / ${(h * 0.16).toFixed(3)})` }}
                  >
                    {cell.map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => onJump(r.id)}
                        title={`${r.title} · ${r.impact} impact · ${r.likelihood} likelihood`}
                        className={cn(
                          "size-2.5 rounded-full transition-all duration-200 hover:scale-150",
                          dotColor(r.impact),
                          selectedId === r.id &&
                            "ring-2 ring-[hsl(var(--accent))] ring-offset-1 ring-offset-[hsl(var(--paper))] scale-150",
                        )}
                      />
                    ))}
                  </div>
                );
              }),
            ])}
            <div />
            {likelihoods.map((lk) => (
              <div
                key={lk}
                className="text-center font-mono text-[9.5px] uppercase tracking-[0.18em] text-[hsl(var(--ink-3))] pt-1"
              >
                {lk}
              </div>
            ))}
          </div>
          <p className="mt-2 text-center font-mono text-[9.5px] uppercase tracking-[0.22em] text-[hsl(var(--ink-3))]">
            higher likelihood →
          </p>
        </div>
      </div>
    </div>
  );
}
