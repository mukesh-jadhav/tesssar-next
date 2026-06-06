"use client";

import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { EditorialDiagram } from "@/components/architecture/EditorialDiagram";
import { ExportMenu } from "@/components/architecture/ExportMenu";
import { ScaleExplorer } from "@/components/architecture/ScaleExplorer";
import { SystemDiagram } from "@/components/architecture/SystemDiagram";
import type {
  AppliedPattern,
  ArchComponent,
  Architecture,
  DataFlow,
  Risk,
  SecurityControl,
  TechChoice,
} from "@/types/architecture";

/**
 * ReportCockpit — the architecture report rendered as a bounded,
 * single-screen cockpit. The shell wraps this; nothing here grows
 * the page. Only the active chapter panel scrolls internally; the
 * inspector on the right is always visible and changes its content
 * based on whatever the user last clicked anywhere in the cockpit.
 */

type ChapterId =
  | "design" | "diagrams" | "brief" | "pieces" | "traffic" | "numbers"
  | "breaks" | "guards" | "watch" | "next";

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

const CHAPTERS: { id: ChapterId; n: string; label: string }[] = [
  { id: "design",   n: "01", label: "Design"   },
  { id: "diagrams", n: "02", label: "Diagrams" },
  { id: "brief",    n: "03", label: "Brief"    },
  { id: "pieces",   n: "04", label: "Pieces"   },
  { id: "traffic",  n: "05", label: "Traffic"  },
  { id: "numbers",  n: "06", label: "Numbers"  },
  { id: "breaks",   n: "07", label: "Risks"    },
  { id: "guards",   n: "08", label: "Guards"   },
  { id: "watch",    n: "09", label: "Watch"    },
  { id: "next",     n: "10", label: "Next"     },
];

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
}: {
  arch: Architecture;
  architectureId?: string;
  showDownload?: boolean;
}) {
  const [chapter, setChapter] = useState<ChapterId>("design");
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
      {/* ─────────────── Chapter tabs (single header) ─────────────── */}
      <div className="h-11 shrink-0 flex items-stretch border-b border-[hsl(var(--line))] bg-[hsl(var(--paper))]">
        <div className="flex-1 min-w-0 flex items-stretch overflow-x-auto scrollbar-thin">
          {CHAPTERS.map((c) => {
            const active = chapter === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setChapter(c.id)}
                className={cn(
                  "shrink-0 px-4 flex items-center gap-2 border-b-2 transition-colors text-[12px]",
                  active
                    ? "border-[hsl(var(--accent))] text-[hsl(var(--ink))] bg-[hsl(var(--paper-2))]/40"
                    : "border-transparent text-[hsl(var(--ink-3))] hover:text-[hsl(var(--ink))] hover:bg-[hsl(var(--paper-2))]/40",
                )}
              >
                <span className="font-mono text-[10px] tabular-nums opacity-70">{c.n}</span>
                <span className="font-medium tracking-tight">{c.label}</span>
              </button>
            );
          })}
        </div>
        {showDownload && architectureId && (
          <div className="shrink-0 flex items-center gap-2 pr-3 pl-3 border-l border-[hsl(var(--line))]">
            <ExportMenu architectureId={architectureId} size="sm" />
          </div>
        )}
      </div>

      {/* ─────────────── Body: canvas + inspector ─────────────── */}
      <div className="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-[1fr_360px]">
        {/* Canvas */}
        <section className="min-h-0 min-w-0 overflow-auto scrollbar-thin">
          <div className="p-6 md:p-8 lg:p-10">
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
          <div className="section-num text-[10.5px] mb-1">§ Diagrams</div>
          <h3 className="display text-[clamp(1.25rem,1.8vw,1.55rem)] tracking-[-0.02em]">
            The same system, six lenses.
          </h3>
        </div>
        <span className="hidden md:inline font-mono text-[10px] uppercase tracking-wider text-[hsl(var(--ink-3))]">
          {diagrams.length} views
        </span>
      </header>

      {diagrams.length > 1 && (
        <div className="flex flex-wrap gap-1.5">
          {diagrams.map((d) => (
            <button
              key={d.id}
              onClick={() => onActive(d.id)}
              className={cn("tag press", active === d.id ? "tag-solid" : "")}
            >
              {d.kind.replace(/-/g, " ")}
            </button>
          ))}
        </div>
      )}
      {current && (
        <>
          <div>
            <h4 className="display text-[clamp(1.15rem,1.6vw,1.45rem)] leading-tight tracking-[-0.02em]">
              {current.title}
            </h4>
            <p className="mt-2 max-w-[64ch] text-[13.5px] leading-relaxed text-[hsl(var(--ink-2))]">
              {current.description}
            </p>
          </div>
          <EditorialDiagram
            chart={current.mermaid}
            onSelect={(node) => {
              // Try to resolve to a real component first so the inspector
              // can show full details; fall back to a raw "node" selection.
              const match = resolveComponent(arch, node.label);
              onSelect(match ? { kind: "component", id: match.id } : { kind: "node", label: node.label, subLabel: node.subLabel });
            }}
          />
        </>
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
  return (
    <div className="flex flex-col gap-8">
      <PanelHead n="03a" title={`${arch.components.length} services, working together`} />
      <div className="grid gap-px bg-[hsl(var(--line))] border border-[hsl(var(--line))] md:grid-cols-2 2xl:grid-cols-3">
        {arch.components.map((c, i) => (
          <button
            key={c.id}
            type="button"
            onClick={() => onSelect({ kind: "component", id: c.id })}
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
          </button>
        ))}
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
      <DataTable
        headers={["Service", "Estimated qty", "Monthly INR", "Notes"]}
        rows={arch.cost_breakdown.map((c) => [
          <span key="s" className="font-medium">{c.service}</span>,
          <span key="q" className="text-[12px] text-[hsl(var(--ink-2))]">{c.estimated_qty}</span>,
          <span key="i" className="font-mono text-[12px] tabular-nums">
            ₹{c.monthly_inr_low.toLocaleString("en-IN")} – ₹{c.monthly_inr_high.toLocaleString("en-IN")}
          </span>,
          <span key="n" className="text-[12px] text-[hsl(var(--ink-3))]">{c.notes}</span>,
        ])}
      />
    </div>
  );
}

function RisksPanel({ arch, onSelect, selection }: { arch: Architecture; onSelect: SelectHandler; selection: Selection }) {
  const selId = selection?.kind === "risk" ? selection.id : null;
  return (
    <div className="flex flex-col gap-6">
      <PanelHead n="06" title={`${arch.risks.length} ways this can go wrong — and the mitigation`} />
      <ul className="divide-y divide-[hsl(var(--line))] border-y border-[hsl(var(--line))]">
        {arch.risks.map((r, i) => (
          <li key={r.id}>
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
                    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider", RISK_PALETTE[r.impact])}>
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
                "shrink-0 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider",
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
          <li key={i} className="bg-[hsl(var(--paper))] p-5">
            <div className="flex items-baseline justify-between gap-3">
              <h4 className="display text-[17px] tracking-[-0.02em]">
                <span className="text-[hsl(var(--ink-3))] mr-2 tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                {r.phase}
              </h4>
              <span className="tag tag-accent !h-5 !text-[10px]">{r.timeline}</span>
            </div>
            <ul className="mt-3 space-y-1.5">
              {r.milestones.map((m, j) => (
                <li key={j} className="flex gap-2 text-[13px]">
                  <span className="ms mt-0.5 text-[14px] accent" aria-hidden>check</span>
                  <span>{m}</span>
                </li>
              ))}
            </ul>
          </li>
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
      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[hsl(var(--ink-3))]">§ {n}</span>
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
          <span className="mt-1.5 size-1 shrink-0 rounded-full bg-[hsl(var(--accent))]" />
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
        <span className="section-num text-[10.5px]">§ {eyebrow}</span>
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
        <span className="section-num text-[10.5px]">§ Brief</span>
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
