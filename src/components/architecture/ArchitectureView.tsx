"use client";

import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { MermaidDiagram } from "./MermaidDiagram";
import { ScaleExplorer } from "./ScaleExplorer";
import type { Architecture, Risk } from "@/types/architecture";

const RISK_PALETTE: Record<Risk["impact"], string> = {
  low:      "bg-[hsl(var(--paper-2))] text-[hsl(var(--ink-2))] border-[hsl(var(--line))]",
  medium:   "bg-[hsl(var(--warn))]/10 text-[hsl(var(--warn))] border-[hsl(var(--warn))]/20",
  high:     "bg-[hsl(var(--bad))]/10 text-[hsl(var(--bad))] border-[hsl(var(--bad))]/20",
  critical: "bg-[hsl(var(--ink))] text-[hsl(var(--paper))] border-[hsl(var(--ink))]",
};

export function ArchitectureView({
  arch,
  architectureId,
  showDownload = true,
}: {
  arch: Architecture;
  architectureId?: string;
  showDownload?: boolean;
}) {
  const [activeDiagram, setActiveDiagram] = useState(arch.diagrams[0]?.id ?? "");
  const currentDiagram = arch.diagrams.find((d) => d.id === activeDiagram) ?? arch.diagrams[0];

  // Split the executive summary into a "lead sentence" and the rest of the body.
  // The lead becomes the headline; the rest is the supporting paragraph.
  const summary = arch.executive_summary.trim();
  const firstEnd = summary.search(/[.!?](\s|$)/);
  const lead = firstEnd >= 0 ? summary.slice(0, firstEnd + 1) : summary;
  const body = firstEnd >= 0 ? summary.slice(firstEnd + 1).trim() : "";

  return (
    <div className="w-full">
      {/* ════════════════════════════════════════════════════════════════
          ACT I — THE EXECUTIVE SUMMARY IS THE HERO
          The summary is what the user reads. So it is the page.
          The project title is a kicker; everything else lives below.
          ════════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-[88vh] flex flex-col px-6 pt-12 pb-12 md:px-12 md:pt-16 md:pb-16 lg:px-20">
        <div className="mx-auto w-full max-w-[1480px] flex flex-col flex-1">
          {/* top strip */}
          <div className="rule-dots flex items-baseline justify-between pb-4">
            <span className="tag tag-accent">§ Architecture report · {arch.meta.domain}</span>
            <div className="flex items-baseline gap-5">
              <span className="eyebrow hidden md:inline">Vol 01 · Issue 05</span>
              {showDownload && architectureId && (
                <Link
                  href={`/api/architect/${architectureId}/pdf`}
                  className="btn-pill btn-pill-sm"
                >
                  <span className="ms text-[16px]" aria-hidden>download</span>
                  PDF
                </Link>
              )}
            </div>
          </div>

          {/* The kicker = project title (small label) */}
          <div className="mt-12 md:mt-16 flex items-baseline gap-4">
            <span className="section-num">§ Brief</span>
            <span className="display text-[clamp(1.1rem,1.6vw,1.45rem)] tracking-[-0.02em] text-[hsl(var(--ink))] truncate">
              {arch.meta.title}
            </span>
          </div>

          {/* THE EXECUTIVE SUMMARY — the page is this paragraph.
              LEAD = huge display headline.  BODY = readable paragraph below. */}
          <div className="mt-10 md:mt-12 flex-1 grid gap-10 lg:grid-cols-[1.55fr_1fr] lg:gap-16 items-start">
            <div className="relative">
              <span
                aria-hidden
                className="absolute -left-[0.08em] -top-[0.35em] serif italic accent text-[clamp(5rem,11vw,11rem)] leading-none select-none"
              >
                “
              </span>
              <h1 className="display-tight relative text-[clamp(2.2rem,5.2vw,5.8rem)] leading-[0.98] tracking-[-0.04em] max-w-[18ch]">
                {lead}
              </h1>
            </div>
            {body && (
              <div className="lg:pt-6">
                <p className="text-[clamp(1rem,1.35vw,1.2rem)] leading-[1.55] text-[hsl(var(--ink-2))] max-w-[44ch] [column-count:1]">
                  {body}
                </p>
              </div>
            )}
          </div>

          {/* Foot strip — one-liner + metric ticker */}
          <div className="mt-14 grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:gap-16 border-t border-[hsl(var(--line))] pt-8">
            <p className="serif italic text-[clamp(1.05rem,1.6vw,1.4rem)] leading-[1.4] text-[hsl(var(--ink-2))] max-w-[55ch]">
              {arch.meta.one_liner}
            </p>
            <dl className="grid grid-cols-4 gap-x-6 self-end">
              <Ticker n={arch.components.length} k="comp." />
              <Ticker n={arch.diagrams.length}   k="diag." />
              <Ticker n={arch.risks.length}      k="risks" />
              <Ticker n={arch.api_surface.length} k="APIs" />
            </dl>
          </div>
        </div>

        {/* hint to scroll */}
        <div className="mt-10 flex items-center justify-center gap-2 eyebrow text-[hsl(var(--ink-3))]">
          <span className="size-1 rounded-full bg-[hsl(var(--accent))] animate-pulse" />
          scroll · the work
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          ACT II — THE WORK
          A magazine of chapters. Each chapter is a full-bleed mark
          (huge numeral + title) followed by the dense content below.
          No sticky rail; the chapter marks ARE the rhythm.
          ════════════════════════════════════════════════════════════════ */}
      <div className="border-t border-[hsl(var(--ink))]">
        {/* === 01 · THE DESIGN (primary diagram, full feature) === */}
        <ChapterMark n="01" eyebrow="The architecture, drawn" title="The design">
          <p className="mt-8 max-w-[60ch] text-[15px] md:text-[16px] leading-relaxed text-[hsl(var(--ink-2))]">
            {currentDiagram?.description}
          </p>
        </ChapterMark>
        <Spread>
          {arch.diagrams.length > 1 && (
            <div className="mb-8 flex flex-wrap gap-2">
              {arch.diagrams.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setActiveDiagram(d.id)}
                  className={cn("tag press", activeDiagram === d.id ? "tag-solid" : "")}
                >
                  {d.kind.replace(/-/g, " ")}
                </button>
              ))}
            </div>
          )}
          {currentDiagram && (
            <div key={currentDiagram.id}>
              <h3 className="display text-[clamp(1.4rem,2.4vw,1.9rem)] leading-tight tracking-[-0.02em]">
                {currentDiagram.title}
              </h3>
              <div className="card-paper mt-6 overflow-hidden p-4 md:p-8">
                <MermaidDiagram chart={currentDiagram.mermaid} />
              </div>
            </div>
          )}
        </Spread>

        {/* === 02 · THE BRIEF (requirements + patterns) === */}
        <ChapterMark n="02" eyebrow="Constraints, applied patterns" title="The brief" />
        <Spread>
          <SubHead n="02a">Requirements</SubHead>
          <div className="grid gap-px bg-[hsl(var(--line))] border border-[hsl(var(--line))] md:grid-cols-2">
            <BulletPanel title="Functional"      items={arch.requirements.functional} />
            <BulletPanel title="Non-functional"  items={arch.requirements.non_functional} />
            <BulletPanel title="Assumptions"     items={arch.requirements.assumptions} muted />
            <BulletPanel title="Out of scope"    items={arch.requirements.out_of_scope} muted />
          </div>

          <SubHead n="02b">Cloud design patterns applied</SubHead>
          <div className="grid gap-px bg-[hsl(var(--line))] border border-[hsl(var(--line))] md:grid-cols-2">
            {arch.applied_patterns.map((p, i) => (
              <div key={i} className="bg-[hsl(var(--paper))] p-6">
                <div className="flex items-baseline justify-between gap-3">
                  <h4 className="display text-[19px] tracking-[-0.02em]">{p.name}</h4>
                  <span className="tag">{p.category}</span>
                </div>
                <p className="mt-3 text-[14px] leading-relaxed text-[hsl(var(--ink-2))]">{p.why}</p>
                <p className="mt-3 text-[12px] font-mono text-[hsl(var(--accent))]">→ {p.where}</p>
              </div>
            ))}
          </div>
        </Spread>

        {/* === 03 · THE PIECES (components + stack) === */}
        <ChapterMark
          n="03"
          eyebrow={`${arch.components.length} services, working together`}
          title="The pieces"
        />
        <Spread>
          <div className="grid gap-px bg-[hsl(var(--line))] border border-[hsl(var(--line))] md:grid-cols-2 xl:grid-cols-3">
            {arch.components.map((c, i) => (
              <div key={c.id} className="bg-[hsl(var(--paper))] p-6 flex flex-col gap-2.5">
                <div className="flex items-baseline justify-between gap-2">
                  <div className="flex items-baseline gap-2.5 min-w-0">
                    <span className="font-mono text-[10px] tabular-nums text-[hsl(var(--ink-3))]">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <h4 className="display text-[18px] tracking-[-0.02em] truncate">{c.name}</h4>
                  </div>
                  <span className="tag shrink-0">{c.category}</span>
                </div>
                <div className="font-mono text-[11px] text-[hsl(var(--ink-3))] uppercase tracking-wider">
                  {c.technology}
                </div>
                <p className="mt-1 text-[14px] leading-relaxed text-[hsl(var(--ink-2))]">{c.responsibility}</p>
                <div className="mt-2 pt-3 border-t border-[hsl(var(--line))]">
                  <p className="eyebrow">Scaling</p>
                  <p className="mt-1 text-[13px] text-[hsl(var(--ink))]">{c.scaling}</p>
                </div>
                {c.alternatives.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {c.alternatives.map((a) => (
                      <span key={a} className="tag !h-6 !px-2 !text-[10px]">{a}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <SubHead n="03a">Tech stack rationale</SubHead>
          <DataTable
            headers={["Layer", "Choice", "Why", "Alternatives"]}
            rows={arch.tech_stack.map((t) => [
              <span key="l" className="font-medium">{t.layer}</span>,
              <span key="c" className="font-mono text-[12px]">{t.choice}</span>,
              <span key="w" className="text-[hsl(var(--ink-2))]">{t.rationale}</span>,
              <div key="a" className="flex flex-wrap gap-1">
                {t.alternatives.map((a) => (
                  <span key={a} className="tag !h-6 !px-2 !text-[10px]">{a}</span>
                ))}
              </div>,
            ])}
          />
        </Spread>

        {/* === 04 · THE TRAFFIC (data flow + model + APIs) === */}
        <ChapterMark
          n="04"
          eyebrow="How requests move, what gets stored, what we expose"
          title="The traffic"
        />
        <Spread>
          <SubHead n="04a">Primary data flow</SubHead>
          <ol className="divide-y divide-[hsl(var(--line))] border-t border-b border-[hsl(var(--line))]">
            {arch.data_flows.map((f) => (
              <li key={f.step} className="grid grid-cols-[auto_1fr] gap-6 py-5">
                <span className="display text-[36px] tracking-[-0.04em] text-[hsl(var(--ink-3))] tabular-nums w-12">
                  {String(f.step).padStart(2, "0")}
                </span>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="display text-[18px] tracking-[-0.02em]">{f.from}</span>
                    <span className="ms text-[18px] text-[hsl(var(--ink-3))]" aria-hidden>arrow_forward</span>
                    <span className="display text-[18px] tracking-[-0.02em]">{f.to}</span>
                    <span className="tag">{f.protocol}</span>
                    {f.latency_budget_ms !== undefined && (
                      <span className="tag tag-accent">budget {f.latency_budget_ms}ms</span>
                    )}
                  </div>
                  <p className="mt-2 text-[14px] text-[hsl(var(--ink-2))]">{f.action}</p>
                  <p className="mt-1 font-mono text-[11px] text-[hsl(var(--ink-3))]">{f.payload}</p>
                </div>
              </li>
            ))}
          </ol>

          <SubHead n="04b">Data model</SubHead>
          <p className="text-[14px] text-[hsl(var(--ink-2))] mb-6 max-w-[65ch]">{arch.data_model.storage_strategy}</p>
          <div className="grid gap-px bg-[hsl(var(--line))] border border-[hsl(var(--line))] md:grid-cols-2">
            {arch.data_model.entities.map((e) => (
              <div key={e.name} className="bg-[hsl(var(--paper))] p-6">
                <h4 className="display text-[20px] tracking-[-0.02em]">{e.name}</h4>
                <table className="mt-4 w-full text-[12px]">
                  <tbody>
                    {e.fields.map((f) => (
                      <tr key={f.name} className="border-b border-[hsl(var(--line))] last:border-0">
                        <td className="py-2 pr-3 font-mono">{f.name}</td>
                        <td className="py-2 pr-3 text-[hsl(var(--ink-3))]">{f.type}</td>
                        <td className="py-2 text-[hsl(var(--ink-2))]">{f.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {e.relationships.length > 0 && (
                  <p className="mt-3 text-[11px] font-mono text-[hsl(var(--accent))]">
                    → {e.relationships.join("  ·  ")}
                  </p>
                )}
              </div>
            ))}
          </div>

          <SubHead n="04c">API surface</SubHead>
          <DataTable
            headers={["Method", "Path", "Purpose", "Auth", "Rate"]}
            rows={arch.api_surface.map((a) => [
              <span key="m" className="tag tag-solid !h-6 !px-2 !text-[10px]">{a.method}</span>,
              <span key="p" className="font-mono text-[12px]">{a.path}</span>,
              <span key="r" className="text-[hsl(var(--ink-2))]">{a.purpose}</span>,
              <span key="a" className="text-[12px]">{a.auth}</span>,
              <span key="rl" className="text-[12px] text-[hsl(var(--ink-3))]">{a.rate_limit ?? "—"}</span>,
            ])}
          />
        </Spread>

        {/* === 05 · THE NUMBERS (scale + cost) === */}
        <ChapterMark n="05" eyebrow="What it costs to grow" title="The numbers" />
        <Spread>
          <SubHead n="05a">Scale explorer</SubHead>
          <div className="card-paper p-6 md:p-8">
            <ScaleExplorer profiles={arch.scale_profiles} />
          </div>

          <SubHead n="05b">Monthly cost — growth tier baseline</SubHead>
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
        </Spread>

        {/* === 06 · WHAT BREAKS (risks) === */}
        <ChapterMark
          n="06"
          eyebrow={`${arch.risks.length} ways this can go wrong — and the mitigation`}
          title="What breaks"
        />
        <Spread>
          <ul className="divide-y divide-[hsl(var(--line))] border-t border-b border-[hsl(var(--line))]">
            {arch.risks.map((r, i) => (
              <li key={r.id} className="py-6 grid grid-cols-[auto_1fr] gap-6">
                <span className="display text-[36px] tracking-[-0.04em] text-[hsl(var(--ink-3))] tabular-nums w-12">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <h4 className="display text-[20px] tracking-[-0.02em]">{r.title}</h4>
                    <div className="flex flex-wrap gap-1.5">
                      <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider", RISK_PALETTE[r.impact])}>
                        {r.impact} impact
                      </span>
                      <span className="tag">{r.likelihood} likelihood</span>
                      <span className="tag">{r.category}</span>
                    </div>
                  </div>
                  <p className="mt-3 text-[14px] leading-relaxed text-[hsl(var(--ink-2))]">{r.mitigation}</p>
                  {r.cloud_pattern && (
                    <p className="mt-2 text-[12px] font-mono text-[hsl(var(--accent))]">
                      → Pattern: {r.cloud_pattern}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </Spread>

        {/* === 07 · THE GUARDS (security) === */}
        <ChapterMark n="07" eyebrow="Identity, isolation, secrets, audit" title="The guards" />
        <Spread>
          <div className="grid gap-px bg-[hsl(var(--line))] border border-[hsl(var(--line))] md:grid-cols-2">
            {arch.security.map((s, i) => (
              <div key={i} className="bg-[hsl(var(--paper))] p-6">
                <div className="flex items-center justify-between gap-2">
                  <span className="tag">{s.area}</span>
                  {s.gcp_service && (
                    <span className="font-mono text-[11px] text-[hsl(var(--ink-3))]">{s.gcp_service}</span>
                  )}
                </div>
                <h4 className="display mt-4 text-[18px] tracking-[-0.02em]">{s.control}</h4>
                <p className="mt-2 text-[14px] leading-relaxed text-[hsl(var(--ink-2))]">{s.implementation}</p>
              </div>
            ))}
          </div>
        </Spread>

        {/* === 08 · THE WATCH (operations) === */}
        <ChapterMark n="08" eyebrow="SLOs, alerts, deployment, rollback" title="The watch" />
        <Spread>
          <SubHead n="08a">Service-level objectives</SubHead>
          <div className="grid gap-px bg-[hsl(var(--line))] border border-[hsl(var(--line))] md:grid-cols-3">
            {arch.observability.slos.map((s, i) => (
              <div key={i} className="bg-[hsl(var(--paper))] p-6">
                <p className="eyebrow">{s.window}</p>
                <h4 className="mt-2 text-[14px] font-medium">{s.name}</h4>
                <div className="display mt-4 text-[clamp(1.75rem,3vw,2.5rem)] leading-none tracking-[-0.03em] accent">
                  {s.target}
                </div>
              </div>
            ))}
          </div>

          <SubHead n="08b">Alerts</SubHead>
          <ul className="divide-y divide-[hsl(var(--line))] border-t border-b border-[hsl(var(--line))]">
            {arch.observability.alerts.map((a, i) => (
              <li key={i} className="py-4 flex items-start gap-4">
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
                <div className="flex-1">
                  <p className="text-[14px] font-medium">{a.name}</p>
                  <p className="font-mono text-[11px] text-[hsl(var(--ink-3))]">{a.condition}</p>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-10 grid gap-px bg-[hsl(var(--line))] border border-[hsl(var(--line))] md:grid-cols-3">
            <BulletPanel title="Metrics" items={arch.observability.metrics} />
            <BulletPanel title="Logs"    items={arch.observability.logs} />
            <BulletPanel title="Traces"  items={arch.observability.traces} />
          </div>

          <SubHead n="08c">Deployment</SubHead>
          <div className="grid gap-px bg-[hsl(var(--line))] border border-[hsl(var(--line))] md:grid-cols-2">
            <DDef k="Primary region"     v={arch.deployment.primary_region} />
            <DDef k="Additional regions" v={arch.deployment.additional_regions.join(", ") || "—"} />
            <DDef k="IaC"                v={arch.deployment.iac} />
            <DDef k="CI/CD"              v={arch.deployment.ci_cd} />
            <DDef k="Rollout"            v={arch.deployment.rollout_strategy} />
            <DDef k="Rollback"           v={arch.deployment.rollback_strategy} />
          </div>
        </Spread>

        {/* === 09 · WHAT'S NEXT (roadmap + open questions) === */}
        <ChapterMark n="09" eyebrow="The order in which to build it" title="What's next" />
        <Spread>
          <ol className="space-y-px bg-[hsl(var(--line))] border border-[hsl(var(--line))]">
            {arch.roadmap.map((r, i) => (
              <li key={i} className="bg-[hsl(var(--paper))] p-7">
                <div className="flex items-baseline justify-between gap-4">
                  <h4 className="display text-[22px] tracking-[-0.02em]">
                    <span className="text-[hsl(var(--ink-3))] mr-3 tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                    {r.phase}
                  </h4>
                  <span className="tag tag-accent">{r.timeline}</span>
                </div>
                <ul className="mt-4 space-y-2">
                  {r.milestones.map((m, j) => (
                    <li key={j} className="flex gap-3 text-[14px]">
                      <span className="ms mt-0.5 text-[16px] accent" aria-hidden>check</span>
                      <span>{m}</span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>

          {arch.open_questions.length > 0 && (
            <>
              <SubHead n="09a">Open questions</SubHead>
              <div className="bg-[hsl(var(--paper))] border border-[hsl(var(--line))] p-6">
                <BulletList items={arch.open_questions} muted />
              </div>
            </>
          )}
        </Spread>

        {/* === COLOPHON / CTA === */}
        <section className="border-t border-[hsl(var(--ink))]">
          <div className="mx-auto w-full max-w-[1480px] px-6 md:px-12 lg:px-20 py-20 md:py-28">
            <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr] lg:gap-16 items-end">
              <div>
                <p className="section-num">§ Fin · End of report</p>
                <h3 className="display-tight mt-6 text-[clamp(2.2rem,5.5vw,5rem)] leading-[0.95] tracking-[-0.04em]">
                  Iterate on this design,<br />
                  <span className="serif font-normal italic accent">or start another.</span>
                </h3>
              </div>
              <div className="flex flex-col gap-3">
                <Link href="/new" className="btn-pill-accent btn-pill-lg w-fit">
                  New design
                  <span className="ms text-[20px]" aria-hidden>arrow_forward</span>
                </Link>
                <Link href="/history" className="btn-pill btn-pill-lg w-fit">
                  Open library
                </Link>
                <p className="eyebrow mt-4 text-[hsl(var(--ink-3))]">
                  Vol 01 · Issue 05 · {arch.meta.domain}
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   Layout primitives
   ════════════════════════════════════════════════════════════════ */

/**
 * ChapterMark — a full-bleed page-break between chapters. Massive
 * left-aligned numeral, chapter title display-tight on the right.
 * This is the rhythm of the magazine.
 */
function ChapterMark({
  n,
  eyebrow,
  title,
  children,
}: {
  n: string;
  eyebrow: string;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <section
      id={`ch-${n}`}
      className="scroll-mt-12 border-t border-[hsl(var(--ink))] bg-[hsl(var(--paper))]"
    >
      <div className="mx-auto w-full max-w-[1480px] px-6 md:px-12 lg:px-20 py-14 md:py-20">
        <div className="flex flex-col md:flex-row md:items-end md:gap-12 lg:gap-20">
          {/* huge numeral — pinned to the baseline of the title */}
          <div className="display-tight shrink-0 leading-[0.78] tracking-[-0.06em] text-[clamp(5.5rem,13vw,13rem)] tabular-nums text-[hsl(var(--ink))] md:-mb-3">
            {n}
          </div>
          {/* chapter title block */}
          <div className="mt-6 md:mt-0 md:pb-2 min-w-0">
            <p className="section-num">§ Chapter {n}</p>
            <h2 className="display-tight mt-3 text-[clamp(2.2rem,5.5vw,5rem)] leading-[0.95] tracking-[-0.045em]">
              {title}
              <span className="accent">.</span>
            </h2>
            <p className="serif italic mt-4 text-[clamp(1.05rem,1.5vw,1.3rem)] text-[hsl(var(--ink-2))] max-w-[55ch]">
              {eyebrow}
            </p>
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}

/** Spread — the working content area for a chapter. */
function Spread({ children }: { children: React.ReactNode }) {
  return (
    <section className="bg-[hsl(var(--paper-2))] border-t border-[hsl(var(--line))]">
      <div className="mx-auto w-full max-w-[1480px] px-6 md:px-12 lg:px-20 py-14 md:py-20 space-y-10">
        {children}
      </div>
    </section>
  );
}

function SubHead({ n, children }: { n: string; children: React.ReactNode }) {
  return (
    <div className="mt-4 mb-4 flex items-baseline gap-4">
      <span className="font-mono text-[12px] uppercase tracking-[0.18em] text-[hsl(var(--ink-3))]">§ {n}</span>
      <h3 className="display text-[clamp(1.3rem,2vw,1.65rem)] leading-tight tracking-[-0.02em]">
        {children}
      </h3>
      <span className="flex-1 border-b border-[hsl(var(--line))] mb-2" />
    </div>
  );
}

function BulletPanel({ title, items, muted }: { title: string; items: string[]; muted?: boolean }) {
  return (
    <div className="bg-[hsl(var(--paper))] p-6">
      <p className="eyebrow mb-4">{title}</p>
      <BulletList items={items} muted={muted} />
    </div>
  );
}

function BulletList({ items, muted }: { items: string[]; muted?: boolean }) {
  return (
    <ul className="space-y-2.5">
      {items.map((it, i) => (
        <li key={i} className="flex gap-3 text-[14px] leading-relaxed">
          <span className="mt-2 size-1 shrink-0 rounded-full bg-[hsl(var(--accent))]" />
          <span className={muted ? "text-[hsl(var(--ink-2))]" : "text-[hsl(var(--ink))]"}>{it}</span>
        </li>
      ))}
    </ul>
  );
}

function DataTable({ headers, rows }: { headers: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="overflow-x-auto border border-[hsl(var(--line))] bg-[hsl(var(--paper))]">
      <table className="w-full text-[13px]">
        <thead className="bg-[hsl(var(--paper-2))]">
          <tr>
            {headers.map((h) => (
              <th key={h} className="text-left py-3 px-5 font-mono text-[10px] uppercase tracking-[0.16em] text-[hsl(var(--ink-3))] font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t border-[hsl(var(--line))] align-top">
              {row.map((cell, j) => (
                <td key={j} className="py-4 px-5">{cell}</td>
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
      <div className="display-tight text-[clamp(1.6rem,3vw,2.4rem)] leading-none tracking-[-0.03em] tabular-nums">
        {n}
      </div>
      <div className="mt-1.5 eyebrow">{k}</div>
    </div>
  );
}

function DDef({ k, v }: { k: string; v: string }) {
  return (
    <div className="bg-[hsl(var(--paper))] p-5">
      <p className="eyebrow">{k}</p>
      <p className="mt-2 text-[15px] font-medium text-[hsl(var(--ink))]">{v}</p>
    </div>
  );
}
