"use client";

import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { MermaidDiagram } from "@/components/architecture/MermaidDiagram";
import { ScaleExplorer } from "@/components/architecture/ScaleExplorer";
import { SystemBlueprint } from "@/components/architecture/SystemBlueprint";
import { SystemDiagram } from "@/components/architecture/SystemDiagram";
import type { Architecture, Risk } from "@/types/architecture";

/**
 * ReportCockpit — the architecture report rendered as a bounded,
 * single-screen cockpit. The shell wraps this; nothing here grows
 * the page. Only the active chapter panel scrolls internally; the
 * Brief inspector on the right is always fully visible.
 */

type ChapterId =
  | "design" | "map" | "diagrams" | "brief" | "pieces" | "traffic" | "numbers"
  | "breaks" | "guards" | "watch" | "next";

const CHAPTERS: { id: ChapterId; n: string; label: string }[] = [
  { id: "design",   n: "01", label: "Design"   },
  { id: "map",      n: "02", label: "Map"      },
  { id: "diagrams", n: "03", label: "Diagrams" },
  { id: "brief",    n: "04", label: "Brief"    },
  { id: "pieces",   n: "05", label: "Pieces"   },
  { id: "traffic",  n: "06", label: "Traffic"  },
  { id: "numbers",  n: "07", label: "Numbers"  },
  { id: "breaks",   n: "08", label: "Risks"    },
  { id: "guards",   n: "09", label: "Guards"   },
  { id: "watch",    n: "10", label: "Watch"    },
  { id: "next",     n: "11", label: "Next"     },
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
            <Link
              href={`/api/architect/${architectureId}/pdf`}
              className="h-7 inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--line-2))] bg-[hsl(var(--paper-2))] px-2.5 text-[11.5px] hover:border-[hsl(var(--ink))] transition-colors"
            >
              <span className="ms text-[13px]" aria-hidden>download</span>
              PDF
            </Link>
          </div>
        )}
      </div>

      {/* ─────────────── Body: canvas + inspector ─────────────── */}
      <div className="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-[1fr_360px]">
        {/* Canvas */}
        <section className="min-h-0 min-w-0 overflow-auto scrollbar-thin">
          <div className="p-6 md:p-8 lg:p-10">
            {chapter === "design"   && <SystemDiagram arch={arch} />}
            {chapter === "map"      && <SystemBlueprint arch={arch} />}
            {chapter === "diagrams" && (
              <DiagramsPanel
                diagrams={arch.diagrams}
                active={activeDiagram}
                onActive={setActiveDiagram}
                current={currentDiagram}
              />
            )}
            {chapter === "brief"   && <BriefPanel arch={arch} />}
            {chapter === "pieces"  && <PiecesPanel arch={arch} />}
            {chapter === "traffic" && <TrafficPanel arch={arch} />}
            {chapter === "numbers" && <NumbersPanel arch={arch} />}
            {chapter === "breaks"  && <RisksPanel arch={arch} />}
            {chapter === "guards"  && <GuardsPanel arch={arch} />}
            {chapter === "watch"   && <WatchPanel arch={arch} />}
            {chapter === "next"    && <NextPanel arch={arch} />}
          </div>
        </section>

        {/* Inspector — Brief, always visible */}
        <aside className="hidden xl:flex flex-col min-h-0 border-l border-[hsl(var(--line))] bg-[hsl(var(--paper))]">
          <div className="flex-1 min-h-0 overflow-auto scrollbar-thin">
            <div className="p-6 lg:p-7 flex flex-col gap-6">
              <div className="flex items-baseline justify-between gap-3">
                <span className="section-num text-[10.5px]">§ Brief</span>
                <span className="font-mono text-[10px] uppercase tracking-wider text-[hsl(var(--ink-3))]">
                  {arch.meta.domain}
                </span>
              </div>

              <div className="relative">
                <span
                  aria-hidden
                  className="absolute -left-1 -top-6 serif italic accent text-[64px] leading-none select-none"
                >
                  “
                </span>
                <h2 className="display-tight text-[clamp(1.4rem,1.9vw,1.85rem)] leading-[1.02] tracking-[-0.03em]">
                  {lead}
                </h2>
              </div>

              {body && (
                <p className="text-[13.5px] leading-[1.55] text-[hsl(var(--ink-2))]">
                  {body}
                </p>
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
            </div>
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
}: {
  diagrams: Architecture["diagrams"];
  active: string;
  onActive: (id: string) => void;
  current?: Architecture["diagrams"][number];
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
          <div className="card-paper overflow-hidden p-4 md:p-6">
            <MermaidDiagram chart={current.mermaid} />
          </div>
        </>
      )}
    </div>
  );
}

function BriefPanel({ arch }: { arch: Architecture }) {
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
          <div key={i} className="bg-[hsl(var(--paper))] p-5">
            <div className="flex items-baseline justify-between gap-3">
              <h4 className="display text-[16px] tracking-[-0.02em]">{p.name}</h4>
              <span className="tag !h-5 !text-[10px]">{p.category}</span>
            </div>
            <p className="mt-2 text-[13px] leading-relaxed text-[hsl(var(--ink-2))]">{p.why}</p>
            <p className="mt-2 text-[11px] font-mono text-[hsl(var(--accent))]">→ {p.where}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function PiecesPanel({ arch }: { arch: Architecture }) {
  return (
    <div className="flex flex-col gap-8">
      <PanelHead n="03a" title={`${arch.components.length} services, working together`} />
      <div className="grid gap-px bg-[hsl(var(--line))] border border-[hsl(var(--line))] md:grid-cols-2 2xl:grid-cols-3">
        {arch.components.map((c, i) => (
          <div key={c.id} className="bg-[hsl(var(--paper))] p-5 flex flex-col gap-2">
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
          </div>
        ))}
      </div>

      <PanelHead n="03b" title="Tech stack rationale" />
      <DataTable
        headers={["Layer", "Choice", "Why", "Alternatives"]}
        rows={arch.tech_stack.map((t) => [
          <span key="l" className="font-medium">{t.layer}</span>,
          <span key="c" className="font-mono text-[12px]">{t.choice}</span>,
          <span key="w" className="text-[hsl(var(--ink-2))]">{t.rationale}</span>,
          <div key="a" className="flex flex-wrap gap-1">
            {t.alternatives.map((a) => (
              <span key={a} className="tag !h-5 !px-2 !text-[10px]">{a}</span>
            ))}
          </div>,
        ])}
      />
    </div>
  );
}

function TrafficPanel({ arch }: { arch: Architecture }) {
  return (
    <div className="flex flex-col gap-8">
      <PanelHead n="04a" title="Primary data flow" />
      <ol className="divide-y divide-[hsl(var(--line))] border-y border-[hsl(var(--line))]">
        {arch.data_flows.map((f) => (
          <li key={f.step} className="grid grid-cols-[auto_1fr] gap-5 py-4">
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

function RisksPanel({ arch }: { arch: Architecture }) {
  return (
    <div className="flex flex-col gap-6">
      <PanelHead n="06" title={`${arch.risks.length} ways this can go wrong — and the mitigation`} />
      <ul className="divide-y divide-[hsl(var(--line))] border-y border-[hsl(var(--line))]">
        {arch.risks.map((r, i) => (
          <li key={r.id} className="py-5 grid grid-cols-[auto_1fr] gap-5">
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
          </li>
        ))}
      </ul>
    </div>
  );
}

function GuardsPanel({ arch }: { arch: Architecture }) {
  return (
    <div className="flex flex-col gap-6">
      <PanelHead n="07" title="Identity, isolation, secrets, audit" />
      <div className="grid gap-px bg-[hsl(var(--line))] border border-[hsl(var(--line))] md:grid-cols-2">
        {arch.security.map((s, i) => (
          <div key={i} className="bg-[hsl(var(--paper))] p-5">
            <div className="flex items-center justify-between gap-2">
              <span className="tag !h-5 !text-[10px]">{s.area}</span>
              {s.gcp_service && (
                <span className="font-mono text-[10.5px] text-[hsl(var(--ink-3))]">{s.gcp_service}</span>
              )}
            </div>
            <h4 className="display mt-3 text-[15px] tracking-[-0.02em]">{s.control}</h4>
            <p className="mt-1.5 text-[13px] leading-relaxed text-[hsl(var(--ink-2))]">{s.implementation}</p>
          </div>
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

function DataTable({ headers, rows }: { headers: string[]; rows: React.ReactNode[][] }) {
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
            <tr key={i} className="border-t border-[hsl(var(--line))] align-top">
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
