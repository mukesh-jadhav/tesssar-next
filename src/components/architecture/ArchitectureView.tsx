"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { MermaidDiagram } from "./MermaidDiagram";
import { ScaleExplorer } from "./ScaleExplorer";
import type { Architecture, ArchComponent, Risk } from "@/types/architecture";
import { SegmentedButtons } from "@/components/m3/SegmentedButtons";
import { Fab } from "@/components/m3/Fab";
import { Chip } from "@/components/m3/Chip";

/**
 * Material 3 Expressive architecture report.
 * - Sticky side anchor nav (lg+) with scroll-spy active state.
 * - Horizontal pill nav (mobile).
 * - Section cards on M3 surface tones; rounded-[28px].
 * - Diagrams switched via M3 segmented chips.
 */

const SECTIONS = [
  { id: "overview", label: "Overview", icon: "summarize" },
  { id: "diagrams", label: "Diagrams", icon: "account_tree" },
  { id: "components", label: "Components", icon: "category" },
  { id: "data", label: "Data & APIs", icon: "database" },
  { id: "scale", label: "Scale & Cost", icon: "ssid_chart" },
  { id: "risks", label: "Risks", icon: "warning" },
  { id: "security", label: "Security", icon: "shield" },
  { id: "ops", label: "Operations", icon: "monitor_heart" },
  { id: "roadmap", label: "Roadmap", icon: "rocket_launch" },
] as const;

const CATEGORY_TONE: Record<ArchComponent["category"], string> = {
  frontend: "bg-m3-surface-container text-m3-on-surface",
  api: "bg-m3-surface-container text-m3-on-surface",
  service: "bg-m3-surface-container text-m3-on-surface",
  worker: "bg-m3-surface-container text-m3-on-surface",
  database: "bg-m3-surface-container text-m3-on-surface",
  cache: "bg-m3-surface-container text-m3-on-surface",
  queue: "bg-m3-surface-container text-m3-on-surface",
  storage: "bg-m3-surface-container text-m3-on-surface",
  cdn: "bg-m3-surface-container text-m3-on-surface",
  auth: "bg-m3-surface-container text-m3-on-surface",
  observability: "bg-m3-surface-container text-m3-on-surface",
  ml: "bg-m3-surface-container text-m3-on-surface",
  edge: "bg-m3-surface-container text-m3-on-surface",
  integration: "bg-m3-surface-container text-m3-on-surface",
  other: "bg-m3-surface-container text-m3-on-surface",
};

const RISK_TONE: Record<Risk["impact"], string> = {
  low: "bg-m3-surface-container text-m3-on-surface-variant",
  medium: "bg-m3-surface-container text-m3-on-surface",
  high: "bg-m3-on-surface text-m3-surface",
  critical: "bg-m3-error text-m3-on-error",
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

  // Scroll-spy for section nav
  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id);
      if (!el) return;
      const ob = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (e.isIntersecting) setActiveSection(s.id);
          }
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
    <div className="relative mx-auto w-full max-w-[1440px] px-6 py-10 md:px-10 md:py-14 lg:px-14">
      {/* Ambient backdrop */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] overflow-hidden">
        <div className="absolute left-[10%] top-10 size-[360px] rounded-full bg-m3-primary-container/45 blur-[110px] m3-shape-a" />
        <div className="absolute right-[6%] top-20 size-[400px] rounded-full bg-m3-tertiary-container/45 blur-[120px] m3-shape-b" />
      </div>

      {/* HERO */}
      <header className="m3-page-enter">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-3xl">
            <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-m3-on-surface-variant">
              {arch.meta.domain}
            </div>
            <h1 className="display mt-3 text-balance text-[clamp(2.5rem,5.5vw,3.75rem)] leading-[1.05]">
              {arch.meta.title}
            </h1>
            <p className="mt-5 max-w-2xl text-balance text-[16px] leading-relaxed text-m3-on-surface-variant md:text-[17px]">
              {arch.meta.one_liner}
            </p>
          </div>
          {showDownload && architectureId && (
            <Fab
              size="extended"
              icon="download"
              href={`/api/architect/${architectureId}/pdf`}
              variant="surface"
              className="!h-12 !rounded-2xl !text-[14px] !shadow-none border border-m3-outline-variant"
            >
              Download PDF
            </Fab>
          )}
        </div>

        {/* Executive summary */}
        <article className="m3-rise mt-8 overflow-hidden rounded-[32px] bg-m3-primary-container p-7 text-m3-on-primary-container">
          <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em] opacity-80">
            <span className="ms text-[16px]" aria-hidden>auto_awesome</span>
            Executive summary
          </div>
          <p className="mt-4 text-[16px] leading-relaxed md:text-[17px]">
            {arch.executive_summary}
          </p>
        </article>
      </header>

      <div className="mt-10 grid gap-10 lg:grid-cols-[220px_1fr]">
        {/* Side anchor nav (lg+) */}
        <nav className="hidden lg:block">
          <div className="sticky top-6 flex flex-col gap-1 pr-2">
            <div className="px-3 py-2 text-[11px] font-medium uppercase tracking-[0.16em] text-m3-on-surface-variant">
              Report
            </div>
            {SECTIONS.map((s) => {
              const active = activeSection === s.id;
              return (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className={cn(
                    "state-layer flex items-center gap-3 rounded-full px-3 py-2 text-[13px] transition-colors duration-m3-default-effects ease-m3-default-effects",
                    active
                      ? "bg-m3-secondary-container text-m3-on-secondary-container font-medium"
                      : "text-m3-on-surface-variant hover:text-m3-on-surface",
                  )}
                >
                  <span className={cn("ms text-[18px]", active && "ms-filled")} aria-hidden>{s.icon}</span>
                  {s.label}
                </a>
              );
            })}
          </div>
        </nav>

        {/* Mobile pill nav */}
        <nav className="lg:hidden -mx-6 px-6 pb-2 overflow-x-auto">
          <div className="flex gap-2 w-max min-w-full">
            {SECTIONS.map((s) => {
              const active = activeSection === s.id;
              return (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className={cn(
                    "state-layer flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[13px] whitespace-nowrap",
                    active
                      ? "bg-m3-secondary-container border-transparent text-m3-on-secondary-container font-medium"
                      : "border-m3-outline-variant text-m3-on-surface-variant",
                  )}
                >
                  <span className={cn("ms text-[16px]", active && "ms-filled")} aria-hidden>{s.icon}</span>
                  {s.label}
                </a>
              );
            })}
          </div>
        </nav>

        {/* Content column */}
        <div className="space-y-14 min-w-0">
          {/* OVERVIEW */}
          <Section id="overview" eyebrow="01" title="Overview" icon="summarize">
            <div className="grid gap-3 md:grid-cols-2">
              <SubCard title="Functional requirements" icon="checklist">
                <Bullets items={arch.requirements.functional} tone="primary" />
              </SubCard>
              <SubCard title="Non-functional requirements" icon="speed">
                <Bullets items={arch.requirements.non_functional} tone="tertiary" />
              </SubCard>
              <SubCard title="Assumptions" icon="psychology">
                <Bullets items={arch.requirements.assumptions} tone="secondary" muted />
              </SubCard>
              <SubCard title="Out of scope" icon="block">
                <Bullets items={arch.requirements.out_of_scope} tone="secondary" muted />
              </SubCard>
            </div>

            <SubCard title="Applied cloud design patterns" icon="extension" className="mt-3">
              <div className="grid gap-3 md:grid-cols-2">
                {arch.applied_patterns.map((p, i) => (
                  <div key={i} className="rounded-2xl bg-m3-surface p-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-medium text-m3-on-surface">{p.name}</div>
                      <span className="rounded-full bg-m3-secondary-container px-2.5 py-0.5 text-[10px] font-medium text-m3-on-secondary-container">
                        {p.category}
                      </span>
                    </div>
                    <p className="mt-2 text-[13px] leading-relaxed text-m3-on-surface-variant">{p.why}</p>
                    <div className="mt-2 inline-flex items-center gap-1 text-[12px] font-medium text-m3-primary">
                      <span className="ms text-[14px]" aria-hidden>arrow_forward</span>
                      {p.where}
                    </div>
                  </div>
                ))}
              </div>
            </SubCard>
          </Section>

          {/* DIAGRAMS */}
          <Section id="diagrams" eyebrow="02" title="Diagrams" icon="account_tree">
            <SegmentedButtons
              segments={arch.diagrams.map((d) => ({
                value: d.id,
                label: d.kind.replace(/-/g, " "),
              }))}
              value={activeDiagram}
              onChange={setActiveDiagram}
              className="mb-5"
            />
            {currentDiagram && (
              <div key={currentDiagram.id} className="m3-rise space-y-4">
                <div>
                  <h3 className="display text-[clamp(1.5rem,2.4vw,1.875rem)] leading-tight">
                    {currentDiagram.title}
                  </h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-m3-on-surface-variant">
                    {currentDiagram.description}
                  </p>
                </div>
                <div className="overflow-hidden rounded-[28px] bg-m3-surface p-4 md:p-6">
                  <MermaidDiagram chart={currentDiagram.mermaid} className="min-h-[420px]" />
                </div>
              </div>
            )}
          </Section>

          {/* COMPONENTS */}
          <Section id="components" eyebrow="03" title={`${arch.components.length} components`} icon="category">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {arch.components.map((c) => (
                <div key={c.id} className="m3-list-item flex-col items-stretch !gap-2 !p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-medium text-m3-on-surface">{c.name}</div>
                    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider", CATEGORY_TONE[c.category])}>
                      {c.category}
                    </span>
                  </div>
                  <div className="font-mono text-[11px] text-m3-on-surface-variant">{c.technology}</div>
                  <p className="mt-1 text-[13px] leading-relaxed text-m3-on-surface">{c.responsibility}</p>
                  <div className="mt-3 rounded-xl bg-m3-surface p-3">
                    <div className="text-[10px] font-medium uppercase tracking-[0.16em] text-m3-on-surface-variant">
                      Scaling
                    </div>
                    <div className="mt-1 text-[13px]">{c.scaling}</div>
                  </div>
                  {c.alternatives.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {c.alternatives.map((a) => (
                        <span key={a} className="rounded-full bg-m3-surface px-2 py-0.5 text-[10px] text-m3-on-surface-variant">
                          {a}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <SubCard title="Tech stack rationale" icon="layers" className="mt-3">
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-m3-outline-variant/40 text-left text-[10px] uppercase tracking-[0.16em] text-m3-on-surface-variant">
                      <th className="py-2 pr-4">Layer</th>
                      <th className="py-2 pr-4">Choice</th>
                      <th className="py-2 pr-4">Why</th>
                      <th className="py-2">Alternatives</th>
                    </tr>
                  </thead>
                  <tbody>
                    {arch.tech_stack.map((t, i) => (
                      <tr key={i} className="border-b border-m3-outline-variant/30 align-top">
                        <td className="py-3 pr-4 font-medium">{t.layer}</td>
                        <td className="py-3 pr-4 font-mono text-[12px]">{t.choice}</td>
                        <td className="py-3 pr-4 text-m3-on-surface-variant">{t.rationale}</td>
                        <td className="py-3">
                          <div className="flex flex-wrap gap-1">
                            {t.alternatives.map((a) => (
                              <span key={a} className="rounded-full bg-m3-surface px-2 py-0.5 text-[10px]">{a}</span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SubCard>
          </Section>

          {/* DATA */}
          <Section id="data" eyebrow="04" title="Data & APIs" icon="database">
            <SubCard title="Primary data flow" icon="account_tree">
              <ol className="space-y-2">
                {arch.data_flows.map((f) => (
                  <li key={f.step} className="flex gap-4 rounded-2xl bg-m3-surface p-4">
                    <div className="grid size-8 shrink-0 place-items-center rounded-full bg-m3-primary-container text-[12px] font-semibold text-m3-on-primary-container">
                      {f.step}
                    </div>
                    <div className="flex-1 text-[13px]">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{f.from}</span>
                        <span className="ms text-[16px] text-m3-on-surface-variant" aria-hidden>arrow_forward</span>
                        <span className="font-medium">{f.to}</span>
                        <span className="rounded-full bg-m3-secondary-container px-2 py-0.5 text-[10px] text-m3-on-secondary-container">{f.protocol}</span>
                        {f.latency_budget_ms !== undefined && (
                          <span className="rounded-full bg-m3-tertiary-container px-2 py-0.5 text-[10px] text-m3-on-tertiary-container">
                            budget {f.latency_budget_ms}ms
                          </span>
                        )}
                      </div>
                      <div className="mt-1 text-m3-on-surface-variant">{f.action}</div>
                      <div className="mt-1 font-mono text-[11px] text-m3-on-surface-variant">{f.payload}</div>
                    </div>
                  </li>
                ))}
              </ol>
            </SubCard>

            <SubCard title="Data model" icon="schema" className="mt-3">
              <p className="mb-4 text-[13px] text-m3-on-surface-variant">{arch.data_model.storage_strategy}</p>
              <div className="grid gap-3 md:grid-cols-2">
                {arch.data_model.entities.map((e) => (
                  <div key={e.name} className="rounded-2xl bg-m3-surface p-4">
                    <div className="font-semibold text-m3-on-surface">{e.name}</div>
                    <table className="mt-2 w-full text-[12px]">
                      <tbody>
                        {e.fields.map((f) => (
                          <tr key={f.name} className="border-b border-m3-outline-variant/30 last:border-0">
                            <td className="py-1.5 pr-2 font-mono">{f.name}</td>
                            <td className="py-1.5 pr-2 text-m3-on-surface-variant">{f.type}</td>
                            <td className="py-1.5 text-m3-on-surface-variant">{f.notes}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {e.relationships.length > 0 && (
                      <div className="mt-2 text-[11px] font-medium text-m3-primary">
                        {e.relationships.join(" · ")}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </SubCard>

            <SubCard title="API surface" icon="api" className="mt-3">
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-m3-outline-variant/40 text-left text-[10px] uppercase tracking-[0.16em] text-m3-on-surface-variant">
                      <th className="py-2 pr-4">Method</th>
                      <th className="py-2 pr-4">Path</th>
                      <th className="py-2 pr-4">Purpose</th>
                      <th className="py-2 pr-4">Auth</th>
                      <th className="py-2">Rate limit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {arch.api_surface.map((a, i) => (
                      <tr key={i} className="border-b border-m3-outline-variant/30">
                        <td className="py-2 pr-4">
                          <span className="rounded-full bg-m3-primary-container px-2 py-0.5 font-mono text-[11px] text-m3-on-primary-container">
                            {a.method}
                          </span>
                        </td>
                        <td className="py-2 pr-4 font-mono text-[12px]">{a.path}</td>
                        <td className="py-2 pr-4 text-m3-on-surface-variant">{a.purpose}</td>
                        <td className="py-2 pr-4 text-[12px]">{a.auth}</td>
                        <td className="py-2 text-[12px] text-m3-on-surface-variant">{a.rate_limit ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SubCard>
          </Section>

          {/* SCALE */}
          <Section id="scale" eyebrow="05" title="Scale & Cost" icon="ssid_chart">
            <SubCard title="Scale explorer" icon="tune">
              <ScaleExplorer profiles={arch.scale_profiles} />
            </SubCard>

            <SubCard title="Monthly cost — growth tier baseline" icon="currency_rupee" className="mt-3">
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-m3-outline-variant/40 text-left text-[10px] uppercase tracking-[0.16em] text-m3-on-surface-variant">
                      <th className="py-2 pr-4">Service</th>
                      <th className="py-2 pr-4">Estimated qty</th>
                      <th className="py-2 pr-4 text-right">Monthly INR</th>
                      <th className="py-2">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {arch.cost_breakdown.map((c, i) => (
                      <tr key={i} className="border-b border-m3-outline-variant/30 align-top">
                        <td className="py-3 pr-4 font-medium">{c.service}</td>
                        <td className="py-3 pr-4 text-[12px] text-m3-on-surface-variant">{c.estimated_qty}</td>
                        <td className="py-3 pr-4 text-right font-mono text-[12px]">
                          ₹{c.monthly_inr_low.toLocaleString("en-IN")} – ₹{c.monthly_inr_high.toLocaleString("en-IN")}
                        </td>
                        <td className="py-3 text-[12px] text-m3-on-surface-variant">{c.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SubCard>
          </Section>

          {/* RISKS */}
          <Section id="risks" eyebrow="06" title={`${arch.risks.length} identified risks`} icon="warning">
            <div className="space-y-2.5">
              {arch.risks.map((r) => (
                <div key={r.id} className="m3-list-item flex-col items-stretch !gap-2 !p-5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="font-medium text-m3-on-surface">{r.title}</div>
                    <div className="flex items-center gap-1.5">
                      <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase", RISK_TONE[r.impact])}>
                        {r.impact} impact
                      </span>
                      <span className="rounded-full bg-m3-surface px-2 py-0.5 text-[10px] text-m3-on-surface-variant">
                        {r.likelihood} likelihood
                      </span>
                      <span className="rounded-full bg-m3-secondary-container px-2 py-0.5 text-[10px] text-m3-on-secondary-container">
                        {r.category}
                      </span>
                    </div>
                  </div>
                  <p className="text-[13px] leading-relaxed text-m3-on-surface-variant">{r.mitigation}</p>
                  {r.cloud_pattern && (
                    <div className="inline-flex w-fit items-center gap-1 text-[11px] font-medium text-m3-primary">
                      <span className="ms text-[14px]" aria-hidden>extension</span>
                      Pattern: {r.cloud_pattern}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Section>

          {/* SECURITY */}
          <Section id="security" eyebrow="07" title="Security & compliance" icon="shield">
            <div className="grid gap-3 md:grid-cols-2">
              {arch.security.map((s, i) => (
                <div key={i} className="m3-list-item flex-col items-stretch !gap-2 !p-5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-full bg-m3-tertiary-container px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-m3-on-tertiary-container">
                      {s.area}
                    </span>
                    {s.gcp_service && (
                      <span className="font-mono text-[11px] text-m3-on-surface-variant">{s.gcp_service}</span>
                    )}
                  </div>
                  <div className="font-medium text-m3-on-surface">{s.control}</div>
                  <p className="text-[13px] leading-relaxed text-m3-on-surface-variant">{s.implementation}</p>
                </div>
              ))}
            </div>
          </Section>

          {/* OPS */}
          <Section id="ops" eyebrow="08" title="Operations" icon="monitor_heart">
            <SubCard title="SLOs" icon="speed">
              <div className="grid gap-3 md:grid-cols-3">
                {arch.observability.slos.map((s, i) => (
                  <div key={i} className="rounded-2xl bg-m3-surface p-4">
                    <div className="text-[10px] uppercase tracking-[0.16em] text-m3-on-surface-variant">{s.window}</div>
                    <div className="mt-1 font-medium">{s.name}</div>
                    <div className="display mt-2 text-[22px] text-m3-primary">{s.target}</div>
                  </div>
                ))}
              </div>
            </SubCard>

            <SubCard title="Alerts" icon="notifications_active" className="mt-3">
              <div className="space-y-2">
                {arch.observability.alerts.map((a, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-2xl bg-m3-surface p-3.5">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-medium uppercase",
                        a.severity === "critical"
                          ? "bg-m3-error-container text-m3-on-error-container"
                          : a.severity === "warning"
                            ? "bg-m3-tertiary-container text-m3-on-tertiary-container"
                            : "bg-m3-secondary-container text-m3-on-secondary-container",
                      )}
                    >
                      {a.severity}
                    </span>
                    <div className="flex-1 text-[13px]">
                      <div className="font-medium text-m3-on-surface">{a.name}</div>
                      <div className="font-mono text-[11px] text-m3-on-surface-variant">{a.condition}</div>
                    </div>
                  </div>
                ))}
              </div>
            </SubCard>

            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <SubCard title="Metrics" icon="bar_chart"><Bullets items={arch.observability.metrics} tone="primary" /></SubCard>
              <SubCard title="Logs" icon="article"><Bullets items={arch.observability.logs} tone="secondary" /></SubCard>
              <SubCard title="Traces" icon="route"><Bullets items={arch.observability.traces} tone="tertiary" /></SubCard>
            </div>

            <SubCard title="Deployment" icon="cloud_upload" className="mt-3">
              <dl className="grid gap-3 md:grid-cols-2">
                <DDef k="Primary region" v={arch.deployment.primary_region} />
                <DDef k="Additional regions" v={arch.deployment.additional_regions.join(", ") || "—"} />
                <DDef k="IaC" v={arch.deployment.iac} />
                <DDef k="CI/CD" v={arch.deployment.ci_cd} />
                <DDef k="Rollout" v={arch.deployment.rollout_strategy} />
                <DDef k="Rollback" v={arch.deployment.rollback_strategy} />
              </dl>
            </SubCard>
          </Section>

          {/* ROADMAP */}
          <Section id="roadmap" eyebrow="09" title="Roadmap" icon="rocket_launch">
            <ol className="space-y-3">
              {arch.roadmap.map((r, i) => (
                <li key={i} className="m3-list-item flex-col items-stretch !gap-3 !p-5">
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-m3-on-surface">{r.phase}</div>
                    <span className="rounded-full bg-m3-primary-container px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-m3-on-primary-container">
                      {r.timeline}
                    </span>
                  </div>
                  <ul className="space-y-1.5">
                    {r.milestones.map((m, j) => (
                      <li key={j} className="flex gap-2 text-[13px]">
                        <span className="ms mt-0.5 text-[14px] text-m3-primary" aria-hidden>check_circle</span>
                        <span>{m}</span>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
            {arch.open_questions.length > 0 && (
              <SubCard title="Open questions" icon="quiz" className="mt-3">
                <Bullets items={arch.open_questions} tone="tertiary" muted />
              </SubCard>
            )}
          </Section>

          {/* CTA */}
          <section className="rounded-[32px] bg-m3-surface-container-high p-7">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="font-medium text-m3-on-surface">Iterate on this design</div>
                <div className="mt-1 text-[13px] text-m3-on-surface-variant">
                  Refine the brief or design an entirely new system. Each run uses one credit.
                </div>
              </div>
              <div className="flex gap-2">
                <Chip type="assist" icon="history" href="/history">Library</Chip>
                <Fab size="extended" icon="auto_awesome" href="/new" className="!h-12 !rounded-2xl !text-[14px]">
                  New design
                </Fab>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

// ============ helpers ============

function Section({
  id, eyebrow, title, icon, children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="mb-5 flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-2xl bg-m3-secondary-container text-m3-on-secondary-container">
          <span className="ms text-[20px]" aria-hidden>{icon}</span>
        </span>
        <div>
          <div className="text-[10px] font-medium uppercase tracking-[0.16em] text-m3-on-surface-variant">
            {eyebrow}
          </div>
          <h2 className="display text-[clamp(1.5rem,2.6vw,2rem)] leading-tight">{title}</h2>
        </div>
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function SubCard({
  title, icon, children, className,
}: {
  title: string;
  icon?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <article className={cn("rounded-[28px] bg-m3-surface-container-low p-5 md:p-6", className)}>
      <div className="mb-4 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em] text-m3-on-surface-variant">
        {icon && <span className="ms text-[16px]" aria-hidden>{icon}</span>}
        {title}
      </div>
      {children}
    </article>
  );
}

function Bullets({ items, tone, muted = false }: { items: string[]; tone?: "primary" | "tertiary" | "secondary"; muted?: boolean }) {
  const dot =
    muted
      ? "bg-m3-on-surface-variant/50"
      : tone === "tertiary"
        ? "bg-m3-tertiary"
        : tone === "secondary"
          ? "bg-m3-secondary"
          : "bg-m3-primary";
  return (
    <ul className="space-y-2">
      {items.map((it, i) => (
        <li key={i} className="flex gap-2.5 text-[13px]">
          <span className={cn("mt-1.5 size-1.5 shrink-0 rounded-full", dot)} />
          <span className={muted ? "text-m3-on-surface-variant" : "text-m3-on-surface"}>{it}</span>
        </li>
      ))}
    </ul>
  );
}

function DDef({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-2xl bg-m3-surface p-4">
      <dt className="text-[10px] uppercase tracking-[0.16em] text-m3-on-surface-variant">{k}</dt>
      <dd className="mt-1 text-[14px] font-medium text-m3-on-surface">{v}</dd>
    </div>
  );
}
