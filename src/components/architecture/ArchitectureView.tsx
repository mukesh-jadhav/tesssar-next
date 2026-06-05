"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { MermaidDiagram } from "./MermaidDiagram";
import { ScaleExplorer } from "./ScaleExplorer";
import type { Architecture, Risk } from "@/types/architecture";

/**
 * Editorial architecture report layout — magazine feature article style.
 * - Sticky left rail with chapter index + scroll-spy.
 * - Big serif italic chapter headings.
 * - Numbered section markers.
 * - Tables with hairline rules.
 * - No shadows, no surface tints — paper, ink, and the single warm accent.
 */

const SECTIONS = [
  { id: "overview",    label: "Overview" },
  { id: "diagrams",    label: "Diagrams" },
  { id: "components",  label: "Components" },
  { id: "data",        label: "Data & APIs" },
  { id: "scale",       label: "Scale & Cost" },
  { id: "risks",       label: "Risks" },
  { id: "security",    label: "Security" },
  { id: "ops",         label: "Operations" },
  { id: "roadmap",     label: "Roadmap" },
] as const;

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
  const [activeSection, setActiveSection] = useState<string>("overview");

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id);
      if (!el) return;
      const ob = new IntersectionObserver(
        (entries) => {
          for (const e of entries) if (e.isIntersecting) setActiveSection(s.id);
        },
        { rootMargin: "-30% 0px -60% 0px", threshold: 0 },
      );
      ob.observe(el);
      observers.push(ob);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, []);

  const currentDiagram = arch.diagrams.find((d) => d.id === activeDiagram) ?? arch.diagrams[0];

  return (
    <div className="mx-auto w-full max-w-[1480px] px-6 py-14 md:px-12 md:py-20 lg:px-16">
      {/* Masthead */}
      <div className="rule-dots flex items-baseline justify-between pb-4">
        <span className="tag tag-accent">§ Architecture report</span>
        <span className="eyebrow hidden md:inline">{arch.meta.domain}</span>
      </div>

      {/* HERO */}
      <header className="m3-page-enter mt-12 grid gap-12 lg:grid-cols-[1.6fr_1fr]">
        <div>
          <h1 className="display-tight text-[clamp(2.8rem,8vw,7rem)] leading-[0.9] tracking-[-0.045em]">
            {arch.meta.title}
          </h1>
          <p className="mt-8 max-w-[60ch] text-[clamp(1.05rem,1.5vw,1.35rem)] leading-[1.45] text-[hsl(var(--ink-2))]">
            <span className="serif italic font-normal text-[hsl(var(--ink))]">{arch.meta.one_liner}</span>
          </p>
        </div>

        <div className="flex flex-col justify-end gap-4 pb-4">
          {showDownload && architectureId && (
            <Link
              href={`/api/architect/${architectureId}/pdf`}
              className="btn-pill w-fit"
            >
              <span className="ms text-[18px]" aria-hidden>download</span>
              Download PDF
            </Link>
          )}
          <div className="grid grid-cols-2 gap-px bg-[hsl(var(--line))] border border-[hsl(var(--line))]">
            <Meta k="Components" v={String(arch.components.length)} />
            <Meta k="Diagrams"   v={String(arch.diagrams.length)} />
            <Meta k="Risks"      v={String(arch.risks.length)} />
            <Meta k="APIs"       v={String(arch.api_surface.length)} />
          </div>
        </div>
      </header>

      {/* Executive summary — full bleed pull quote */}
      <section className="mt-20 border-y border-[hsl(var(--line))] py-14">
        <p className="section-num">§ Executive summary</p>
        <p className="display mt-6 text-[clamp(1.5rem,3.5vw,3rem)] leading-[1.08] tracking-[-0.03em] max-w-[42ch]">
          <span className="serif font-normal italic">“</span>
          {arch.executive_summary}
          <span className="serif font-normal italic">”</span>
        </p>
      </section>

      <div className="mt-20 grid gap-14 lg:grid-cols-[200px_1fr] lg:gap-20">
        {/* Side rail — chapter index */}
        <aside className="hidden lg:block">
          <div className="sticky top-12">
            <p className="section-num">§ Contents</p>
            <ol className="mt-4 space-y-1">
              {SECTIONS.map((s, i) => {
                const active = activeSection === s.id;
                return (
                  <li key={s.id}>
                    <a
                      href={`#${s.id}`}
                      className={cn(
                        "group grid grid-cols-[auto_1fr] items-baseline gap-3 py-2 transition-colors",
                        active ? "text-[hsl(var(--ink))]" : "text-[hsl(var(--ink-3))] hover:text-[hsl(var(--ink))]",
                      )}
                    >
                      <span className="font-mono text-[11px] tabular-nums">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className={cn("text-[14px] transition-all", active && "font-medium")}>
                        {s.label}
                        {active && <span className="accent ml-2">·</span>}
                      </span>
                    </a>
                  </li>
                );
              })}
            </ol>
          </div>
        </aside>

        {/* Mobile chapter pills */}
        <nav className="lg:hidden -mx-6 px-6 pb-2 overflow-x-auto">
          <div className="flex gap-2 w-max min-w-full">
            {SECTIONS.map((s, i) => {
              const active = activeSection === s.id;
              return (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className={cn(
                    "shrink-0 inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[13px] font-mono uppercase tracking-wider whitespace-nowrap transition-colors",
                    active
                      ? "bg-[hsl(var(--ink))] border-[hsl(var(--ink))] text-[hsl(var(--paper))]"
                      : "border-[hsl(var(--line))] text-[hsl(var(--ink-2))]",
                  )}
                >
                  <span className="tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                  {s.label}
                </a>
              );
            })}
          </div>
        </nav>

        {/* Article column */}
        <article className="space-y-24 min-w-0">

          {/* OVERVIEW */}
          <Chapter id="overview" n="01" title="Overview">
            <div className="grid gap-px bg-[hsl(var(--line))] border border-[hsl(var(--line))] md:grid-cols-2">
              <BulletPanel title="Functional requirements"     items={arch.requirements.functional} />
              <BulletPanel title="Non-functional requirements" items={arch.requirements.non_functional} />
              <BulletPanel title="Assumptions"                 items={arch.requirements.assumptions} muted />
              <BulletPanel title="Out of scope"                items={arch.requirements.out_of_scope} muted />
            </div>

            <SubHead n="01a">Applied cloud design patterns</SubHead>
            <div className="grid gap-px bg-[hsl(var(--line))] border border-[hsl(var(--line))] md:grid-cols-2">
              {arch.applied_patterns.map((p, i) => (
                <div key={i} className="bg-[hsl(var(--paper))] p-6">
                  <div className="flex items-center justify-between gap-3">
                    <h4 className="display text-[18px] tracking-[-0.02em]">{p.name}</h4>
                    <span className="tag">{p.category}</span>
                  </div>
                  <p className="mt-3 text-[14px] leading-relaxed text-[hsl(var(--ink-2))]">{p.why}</p>
                  <p className="mt-3 text-[12px] font-mono text-[hsl(var(--accent))]">→ {p.where}</p>
                </div>
              ))}
            </div>
          </Chapter>

          {/* DIAGRAMS */}
          <Chapter id="diagrams" n="02" title="Diagrams">
            <div className="flex flex-wrap gap-2 mb-8">
              {arch.diagrams.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setActiveDiagram(d.id)}
                  className={cn(
                    "tag press",
                    activeDiagram === d.id ? "tag-solid" : "",
                  )}
                >
                  {d.kind.replace(/-/g, " ")}
                </button>
              ))}
            </div>

            {currentDiagram && (
              <div key={currentDiagram.id} className="m3-rise">
                <h3 className="display text-[clamp(1.5rem,2.5vw,2rem)] leading-tight tracking-[-0.02em]">
                  {currentDiagram.title}
                </h3>
                <p className="mt-3 text-[15px] leading-relaxed text-[hsl(var(--ink-2))] max-w-[65ch]">
                  {currentDiagram.description}
                </p>
                <div className="card-paper overflow-hidden mt-8 p-4 md:p-8">
                  <MermaidDiagram chart={currentDiagram.mermaid} className="min-h-[420px]" />
                </div>
              </div>
            )}
          </Chapter>

          {/* COMPONENTS */}
          <Chapter id="components" n="03" title={`${arch.components.length} components`}>
            <div className="grid gap-px bg-[hsl(var(--line))] border border-[hsl(var(--line))] md:grid-cols-2 xl:grid-cols-3">
              {arch.components.map((c) => (
                <div key={c.id} className="bg-[hsl(var(--paper))] p-6 flex flex-col gap-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="display text-[18px] tracking-[-0.02em]">{c.name}</h4>
                    <span className="tag">{c.category}</span>
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
          </Chapter>

          {/* DATA */}
          <Chapter id="data" n="04" title="Data & APIs">
            <SubHead n="04a">Primary data flow</SubHead>
            <ol className="divide-y divide-[hsl(var(--line))] border-t border-b border-[hsl(var(--line))]">
              {arch.data_flows.map((f) => (
                <li key={f.step} className="grid grid-cols-[auto_1fr] gap-6 py-5">
                  <span className="display text-[32px] tracking-[-0.04em] text-[hsl(var(--ink-3))] tabular-nums w-10">
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
          </Chapter>

          {/* SCALE */}
          <Chapter id="scale" n="05" title="Scale & Cost">
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
          </Chapter>

          {/* RISKS */}
          <Chapter id="risks" n="06" title={`${arch.risks.length} identified risks`}>
            <ul className="divide-y divide-[hsl(var(--line))] border-t border-b border-[hsl(var(--line))]">
              {arch.risks.map((r, i) => (
                <li key={r.id} className="py-6 grid grid-cols-[auto_1fr] gap-6">
                  <span className="display text-[32px] tracking-[-0.04em] text-[hsl(var(--ink-3))] tabular-nums w-10">
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
          </Chapter>

          {/* SECURITY */}
          <Chapter id="security" n="07" title="Security & compliance">
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
          </Chapter>

          {/* OPS */}
          <Chapter id="ops" n="08" title="Operations">
            <SubHead n="08a">SLOs</SubHead>
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
          </Chapter>

          {/* ROADMAP */}
          <Chapter id="roadmap" n="09" title="Roadmap">
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
          </Chapter>

          {/* CTA */}
          <section className="card-ink relative overflow-hidden p-10 md:p-14">
            <div aria-hidden className="pointer-events-none absolute -right-20 -top-20 size-[320px] rounded-full bg-[hsl(var(--accent))]/30 blur-[100px]" />
            <p className="font-mono text-[12px] uppercase tracking-[0.18em] text-[hsl(var(--paper))]/55">§ Next</p>
            <h3 className="display mt-4 text-[clamp(1.8rem,4vw,3rem)] leading-[0.98] tracking-[-0.035em] text-[hsl(var(--paper))]">
              Iterate on this design,<br />
              <span className="serif font-normal italic">or start another.</span>
            </h3>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/new" className="btn-pill-accent btn-pill-lg">
                New design
                <span className="ms text-[20px]" aria-hidden>arrow_forward</span>
              </Link>
              <Link
                href="/history"
                className="btn-pill btn-pill-lg !bg-transparent !text-[hsl(var(--paper))] !border-[hsl(var(--paper))]/30 hover:!bg-[hsl(var(--paper))]/10"
              >
                Library
              </Link>
            </div>
          </section>
        </article>
      </div>
    </div>
  );
}

/* ============ helpers ============ */

function Chapter({ id, n, title, children }: {
  id: string; n: string; title: string; children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="border-b border-[hsl(var(--line))] pb-6">
        <p className="section-num">§ Chapter {n}</p>
        <h2 className="display-tight mt-4 text-[clamp(2rem,5vw,4rem)] leading-[0.95] tracking-[-0.04em]">
          {title}
        </h2>
      </div>
      <div className="mt-10 space-y-10">{children}</div>
    </section>
  );
}

function SubHead({ n, children }: { n: string; children: React.ReactNode }) {
  return (
    <div className="mt-12 mb-4 flex items-baseline gap-4">
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
    <div className="overflow-x-auto border border-[hsl(var(--line))]">
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

function Meta({ k, v }: { k: string; v: string }) {
  return (
    <div className="bg-[hsl(var(--paper))] p-5">
      <p className="eyebrow">{k}</p>
      <p className="display mt-2 text-[28px] leading-none tracking-[-0.03em] tabular-nums">{v}</p>
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
