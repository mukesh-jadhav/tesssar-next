"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MermaidDiagram } from "./MermaidDiagram";
import { ScaleExplorer } from "./ScaleExplorer";
import type { Architecture, ArchComponent, Risk } from "@/types/architecture";
import {
  Layers, GitBranch, Box, Database, Shield, AlertTriangle, Activity, Coins,
  CheckCircle2, Sparkles, Network, FileText, Map, ListChecks, Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const CATEGORY_COLOR: Record<ArchComponent["category"], string> = {
  frontend: "bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200",
  api: "bg-indigo-100 text-indigo-900 dark:bg-indigo-950 dark:text-indigo-200",
  service: "bg-violet-100 text-violet-900 dark:bg-violet-950 dark:text-violet-200",
  worker: "bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-200",
  database: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
  cache: "bg-orange-100 text-orange-900 dark:bg-orange-950 dark:text-orange-200",
  queue: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  storage: "bg-teal-100 text-teal-900 dark:bg-teal-950 dark:text-teal-200",
  cdn: "bg-cyan-100 text-cyan-900 dark:bg-cyan-950 dark:text-cyan-200",
  auth: "bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-200",
  observability: "bg-yellow-100 text-yellow-900 dark:bg-yellow-950 dark:text-yellow-200",
  ml: "bg-pink-100 text-pink-900 dark:bg-pink-950 dark:text-pink-200",
  edge: "bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-200",
  integration: "bg-stone-100 text-stone-900 dark:bg-stone-950 dark:text-stone-200",
  other: "bg-zinc-100 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-200",
};

const RISK_COLOR: Record<Risk["impact"], string> = {
  low: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  medium: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  high: "bg-orange-500/15 text-orange-700 dark:text-orange-300",
  critical: "bg-red-500/15 text-red-700 dark:text-red-300",
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
  const [activeDiagram, setActiveDiagram] = useState(arch.diagrams[0]?.id);
  const currentDiagram = arch.diagrams.find((d) => d.id === activeDiagram) ?? arch.diagrams[0];

  return (
    <div className="space-y-10">
      {/* HEADER */}
      <header className="space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4 animate-reveal-up">
          <div>
            <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              {arch.meta.domain}
            </div>
            <h1 className="display mt-2 text-balance text-[clamp(2.5rem,5.5vw,3.75rem)]">
              {arch.meta.title}
            </h1>
            <p className="mt-4 max-w-2xl text-balance text-[15px] leading-relaxed text-muted-foreground md:text-base">
              {arch.meta.one_liner}
            </p>
          </div>
          {showDownload && architectureId && (
            <Button asChild variant="outline" className="gap-2">
              <a
                href={`/api/architect/${architectureId}/pdf`}
                target="_blank"
                rel="noreferrer"
              >
                <Download className="size-4" />
                Download PDF
              </a>
            </Button>
          )}
        </div>
        <Card
          className="animate-reveal-up"
          style={{ animationDelay: "100ms", animationFillMode: "both" }}
        >
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              <Sparkles className="size-3.5" />
              Executive summary
            </div>
            <p className="mt-3 text-[15px] leading-relaxed text-foreground/90">
              {arch.executive_summary}
            </p>
          </CardContent>
        </Card>
      </header>

      {/* TABS */}
      <Tabs defaultValue="overview" className="w-full">
        <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:overflow-visible md:px-0">
          <TabsList className="w-max min-w-full justify-start md:w-full">
            <TabsTrigger value="overview" className="gap-1.5"><Layers className="size-3.5" /> Overview</TabsTrigger>
            <TabsTrigger value="diagrams" className="gap-1.5"><GitBranch className="size-3.5" /> Diagrams</TabsTrigger>
            <TabsTrigger value="components" className="gap-1.5"><Box className="size-3.5" /> Components</TabsTrigger>
            <TabsTrigger value="data" className="gap-1.5"><Database className="size-3.5" /> Data &amp; APIs</TabsTrigger>
            <TabsTrigger value="scale" className="gap-1.5"><Network className="size-3.5" /> Scale &amp; Cost</TabsTrigger>
            <TabsTrigger value="risks" className="gap-1.5"><AlertTriangle className="size-3.5" /> Risks</TabsTrigger>
            <TabsTrigger value="security" className="gap-1.5"><Shield className="size-3.5" /> Security</TabsTrigger>
            <TabsTrigger value="ops" className="gap-1.5"><Activity className="size-3.5" /> Ops</TabsTrigger>
            <TabsTrigger value="roadmap" className="gap-1.5"><Map className="size-3.5" /> Roadmap</TabsTrigger>
          </TabsList>
        </div>

        {/* OVERVIEW */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Section icon={<ListChecks className="size-4" />} title="Functional requirements">
              <Bullets items={arch.requirements.functional} />
            </Section>
            <Section icon={<ListChecks className="size-4" />} title="Non-functional requirements">
              <Bullets items={arch.requirements.non_functional} />
            </Section>
            <Section icon={<CheckCircle2 className="size-4" />} title="Assumptions">
              <Bullets items={arch.requirements.assumptions} muted />
            </Section>
            <Section icon={<FileText className="size-4" />} title="Out of scope">
              <Bullets items={arch.requirements.out_of_scope} muted />
            </Section>
          </div>
          <Section icon={<Sparkles className="size-4" />} title="Applied cloud design patterns">
            <div className="grid gap-3 md:grid-cols-2">
              {arch.applied_patterns.map((p, i) => (
                <div key={i} className="rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{p.name}</div>
                    <Badge variant="outline" className="text-[10px]">{p.category}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{p.why}</p>
                  <div className="mt-2 text-xs text-brand">→ {p.where}</div>
                </div>
              ))}
            </div>
          </Section>
        </TabsContent>

        {/* DIAGRAMS */}
        <TabsContent value="diagrams" className="space-y-4">
          <div className="grid gap-6 lg:grid-cols-[240px_1fr] xl:grid-cols-[260px_1fr]">
            <div className="space-y-1.5 lg:sticky lg:top-24 lg:self-start">
              {arch.diagrams.map((d) => {
                const active = activeDiagram === d.id;
                return (
                  <button
                    key={d.id}
                    onClick={() => setActiveDiagram(d.id)}
                    className={`group/diag relative flex w-full items-start gap-2 rounded-lg border p-3 text-left text-sm transition-all duration-200 ease-out-quart ${
                      active
                        ? "border-foreground/20 bg-card shadow-[0_1px_0_hsl(var(--border)),0_4px_10px_-4px_hsl(var(--foreground)/0.08)]"
                        : "border-transparent hover:border-border hover:bg-card/60"
                    }`}
                  >
                    <span
                      aria-hidden
                      className={`mt-1.5 h-px shrink-0 origin-left bg-foreground transition-all duration-300 ease-out-expo ${
                        active ? "w-4" : "w-2 opacity-40"
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium leading-snug">{d.title}</div>
                      <div className="mt-1 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                        {d.kind.replace(/-/g, " ")}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="space-y-4">
              {currentDiagram && (
                <div
                  key={currentDiagram.id}
                  className="space-y-4 animate-reveal-up"
                >
                  <div>
                    <h3 className="display text-[1.75rem] leading-tight">
                      {currentDiagram.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {currentDiagram.description}
                    </p>
                  </div>
                  <Card className="overflow-hidden">
                    <CardContent className="p-4 md:p-6">
                      <MermaidDiagram chart={currentDiagram.mermaid} className="min-h-[420px]" />
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* COMPONENTS */}
        <TabsContent value="components" className="space-y-6">
          <Section icon={<Box className="size-4" />} title={`${arch.components.length} components`}>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {arch.components.map((c) => (
                <div key={c.id} className="rounded-lg border p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-medium">{c.name}</div>
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider ${CATEGORY_COLOR[c.category]}`}>
                      {c.category}
                    </span>
                  </div>
                  <div className="mt-1 font-mono text-xs text-muted-foreground">{c.technology}</div>
                  <p className="mt-3 text-sm">{c.responsibility}</p>
                  <Separator className="my-3" />
                  <div className="text-xs">
                    <div className="font-medium uppercase tracking-wider text-muted-foreground">Scaling</div>
                    <div className="mt-1">{c.scaling}</div>
                  </div>
                  {c.alternatives.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {c.alternatives.map((a) => (
                        <Badge key={a} variant="secondary" className="text-[10px]">{a}</Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Section>
          <Section icon={<Layers className="size-4" />} title="Tech stack rationale">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="py-2 pr-4">Layer</th>
                  <th className="py-2 pr-4">Choice</th>
                  <th className="py-2 pr-4">Why</th>
                  <th className="py-2">Alternatives</th>
                </tr>
              </thead>
              <tbody>
                {arch.tech_stack.map((t, i) => (
                  <tr key={i} className="border-b align-top">
                    <td className="py-3 pr-4 font-medium">{t.layer}</td>
                    <td className="py-3 pr-4 font-mono text-xs">{t.choice}</td>
                    <td className="py-3 pr-4 text-muted-foreground">{t.rationale}</td>
                    <td className="py-3">
                      <div className="flex flex-wrap gap-1">
                        {t.alternatives.map((a) => (
                          <Badge key={a} variant="outline" className="text-[10px]">{a}</Badge>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        </TabsContent>

        {/* DATA */}
        <TabsContent value="data" className="space-y-6">
          <Section icon={<GitBranch className="size-4" />} title="Primary data flow">
            <ol className="space-y-2">
              {arch.data_flows.map((f) => (
                <li key={f.step} className="flex gap-4 rounded-lg border p-3">
                  <div className="grid size-7 shrink-0 place-items-center rounded-full bg-brand/10 text-xs font-semibold text-brand">
                    {f.step}
                  </div>
                  <div className="flex-1 text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{f.from}</span>
                      <span className="text-muted-foreground">→</span>
                      <span className="font-medium">{f.to}</span>
                      <Badge variant="outline" className="text-[10px]">{f.protocol}</Badge>
                      {f.latency_budget_ms !== undefined && (
                        <Badge variant="info" className="text-[10px]">budget {f.latency_budget_ms}ms</Badge>
                      )}
                    </div>
                    <div className="mt-1 text-muted-foreground">{f.action}</div>
                    <div className="mt-1 font-mono text-xs text-muted-foreground">{f.payload}</div>
                  </div>
                </li>
              ))}
            </ol>
          </Section>

          <Section icon={<Database className="size-4" />} title="Data model">
            <p className="mb-4 text-sm text-muted-foreground">{arch.data_model.storage_strategy}</p>
            <div className="grid gap-3 md:grid-cols-2">
              {arch.data_model.entities.map((e) => (
                <div key={e.name} className="rounded-lg border p-4">
                  <div className="font-semibold">{e.name}</div>
                  <table className="mt-2 w-full text-xs">
                    <tbody>
                      {e.fields.map((f) => (
                        <tr key={f.name} className="border-b last:border-0">
                          <td className="py-1.5 pr-2 font-mono">{f.name}</td>
                          <td className="py-1.5 pr-2 text-muted-foreground">{f.type}</td>
                          <td className="py-1.5 text-muted-foreground">{f.notes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {e.relationships.length > 0 && (
                    <div className="mt-2 text-xs text-brand">
                      {e.relationships.join(" · ")}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Section>

          <Section icon={<FileText className="size-4" />} title="API surface">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="py-2 pr-4">Method</th>
                  <th className="py-2 pr-4">Path</th>
                  <th className="py-2 pr-4">Purpose</th>
                  <th className="py-2 pr-4">Auth</th>
                  <th className="py-2">Rate limit</th>
                </tr>
              </thead>
              <tbody>
                {arch.api_surface.map((a, i) => (
                  <tr key={i} className="border-b">
                    <td className="py-2 pr-4"><Badge variant="outline" className="font-mono text-[10px]">{a.method}</Badge></td>
                    <td className="py-2 pr-4 font-mono text-xs">{a.path}</td>
                    <td className="py-2 pr-4 text-muted-foreground">{a.purpose}</td>
                    <td className="py-2 pr-4 text-xs">{a.auth}</td>
                    <td className="py-2 text-xs text-muted-foreground">{a.rate_limit ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        </TabsContent>

        {/* SCALE */}
        <TabsContent value="scale" className="space-y-6">
          <Section icon={<Network className="size-4" />} title="Scale explorer">
            <ScaleExplorer profiles={arch.scale_profiles} />
          </Section>
          <Section icon={<Coins className="size-4" />} title="Monthly cost breakdown (growth tier baseline)">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="py-2 pr-4">Service</th>
                  <th className="py-2 pr-4">Estimated qty</th>
                  <th className="py-2 pr-4 text-right">Monthly INR</th>
                  <th className="py-2">Notes</th>
                </tr>
              </thead>
              <tbody>
                {arch.cost_breakdown.map((c, i) => (
                  <tr key={i} className="border-b align-top">
                    <td className="py-3 pr-4 font-medium">{c.service}</td>
                    <td className="py-3 pr-4 text-xs text-muted-foreground">{c.estimated_qty}</td>
                    <td className="py-3 pr-4 text-right font-mono text-xs">
                      ₹{c.monthly_inr_low.toLocaleString("en-IN")} – ₹{c.monthly_inr_high.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 text-xs text-muted-foreground">{c.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        </TabsContent>

        {/* RISKS */}
        <TabsContent value="risks" className="space-y-3">
          <Section icon={<AlertTriangle className="size-4" />} title={`${arch.risks.length} identified risks`}>
            <div className="space-y-2">
              {arch.risks.map((r) => (
                <div key={r.id} className="rounded-lg border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="font-medium">{r.title}</div>
                    <div className="flex items-center gap-1.5">
                      <span className={`rounded px-2 py-0.5 text-[10px] font-semibold uppercase ${RISK_COLOR[r.impact]}`}>
                        {r.impact} impact
                      </span>
                      <Badge variant="outline" className="text-[10px]">{r.likelihood} likelihood</Badge>
                      <Badge variant="secondary" className="text-[10px]">{r.category}</Badge>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{r.mitigation}</p>
                  {r.cloud_pattern && (
                    <div className="mt-2 text-xs text-brand">Pattern: {r.cloud_pattern}</div>
                  )}
                </div>
              ))}
            </div>
          </Section>
        </TabsContent>

        {/* SECURITY */}
        <TabsContent value="security" className="space-y-6">
          <Section icon={<Shield className="size-4" />} title="Security & compliance controls">
            <div className="grid gap-3 md:grid-cols-2">
              {arch.security.map((s, i) => (
                <div key={i} className="rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <Badge variant="brand" className="text-[10px] uppercase">{s.area}</Badge>
                    {s.gcp_service && <span className="font-mono text-xs text-muted-foreground">{s.gcp_service}</span>}
                  </div>
                  <div className="mt-2 font-medium">{s.control}</div>
                  <p className="mt-1 text-sm text-muted-foreground">{s.implementation}</p>
                </div>
              ))}
            </div>
          </Section>
        </TabsContent>

        {/* OPS */}
        <TabsContent value="ops" className="space-y-6">
          <Section icon={<Activity className="size-4" />} title="SLOs">
            <div className="grid gap-3 md:grid-cols-3">
              {arch.observability.slos.map((s, i) => (
                <div key={i} className="rounded-lg border p-4">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">{s.window}</div>
                  <div className="mt-1 font-medium">{s.name}</div>
                  <div className="mt-1 text-xl font-semibold text-brand">{s.target}</div>
                </div>
              ))}
            </div>
          </Section>
          <Section icon={<AlertTriangle className="size-4" />} title="Alerts">
            <div className="space-y-2">
              {arch.observability.alerts.map((a, i) => (
                <div key={i} className="flex items-start gap-3 rounded-lg border p-3">
                  <Badge
                    variant={a.severity === "critical" ? "destructive" : a.severity === "warning" ? "warning" : "info"}
                    className="text-[10px] uppercase"
                  >
                    {a.severity}
                  </Badge>
                  <div className="flex-1 text-sm">
                    <div className="font-medium">{a.name}</div>
                    <div className="font-mono text-xs text-muted-foreground">{a.condition}</div>
                  </div>
                </div>
              ))}
            </div>
          </Section>
          <div className="grid gap-6 md:grid-cols-3">
            <Section title="Metrics"><Bullets items={arch.observability.metrics} /></Section>
            <Section title="Logs"><Bullets items={arch.observability.logs} /></Section>
            <Section title="Traces"><Bullets items={arch.observability.traces} /></Section>
          </div>
          <Section icon={<Map className="size-4" />} title="Deployment">
            <dl className="grid gap-3 text-sm md:grid-cols-2">
              <DDef k="Primary region" v={arch.deployment.primary_region} />
              <DDef k="Additional regions" v={arch.deployment.additional_regions.join(", ") || "—"} />
              <DDef k="IaC" v={arch.deployment.iac} />
              <DDef k="CI/CD" v={arch.deployment.ci_cd} />
              <DDef k="Rollout" v={arch.deployment.rollout_strategy} />
              <DDef k="Rollback" v={arch.deployment.rollback_strategy} />
            </dl>
          </Section>
        </TabsContent>

        {/* ROADMAP */}
        <TabsContent value="roadmap" className="space-y-6">
          <Section icon={<Map className="size-4" />} title="Build roadmap">
            <ol className="space-y-3">
              {arch.roadmap.map((r, i) => (
                <li key={i} className="rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{r.phase}</div>
                    <Badge variant="brand" className="text-[10px]">{r.timeline}</Badge>
                  </div>
                  <ul className="mt-3 space-y-1.5">
                    {r.milestones.map((m, j) => (
                      <li key={j} className="flex gap-2 text-sm">
                        <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-brand" />
                        <span>{m}</span>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
          </Section>
          <Section icon={<FileText className="size-4" />} title="Open questions to clarify with the team">
            <Bullets items={arch.open_questions} muted />
          </Section>
        </TabsContent>
      </Tabs>

      <Card className="border-dashed">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-6">
          <div>
            <div className="font-medium">Iterate on this design</div>
            <div className="text-sm text-muted-foreground">
              Refine the brief or design an entirely new system. Each run uses one credit.
            </div>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline"><Link href="/history">History</Link></Button>
            <Button asChild><Link href="/new">New architecture →</Link></Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Section({
  icon, title, children,
}: { icon?: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-muted-foreground">
          {icon}{title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function Bullets({ items, muted = false }: { items: string[]; muted?: boolean }) {
  return (
    <ul className="space-y-2">
      {items.map((it, i) => (
        <li key={i} className="flex gap-2.5 text-sm">
          <span className={`mt-1.5 size-1.5 shrink-0 rounded-full ${muted ? "bg-muted-foreground/40" : "bg-brand"}`} />
          <span className={muted ? "text-muted-foreground" : ""}>{it}</span>
        </li>
      ))}
    </ul>
  );
}

function DDef({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-lg border p-3">
      <dt className="text-xs uppercase tracking-wider text-muted-foreground">{k}</dt>
      <dd className="mt-1 font-medium">{v}</dd>
    </div>
  );
}
