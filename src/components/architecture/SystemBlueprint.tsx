"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { formatScaleBand } from "@/lib/geo/cost";
import { useRegion } from "@/components/billing/RegionalPrice";
import type { Architecture, ArchComponent } from "@/types/architecture";

/**
 * SystemBlueprint — a single, editorial "one sheet" view of the
 * entire architecture. Reads from the same Architecture object the
 * report panels use; renders five swimlanes of component cards on a
 * graph-paper field, with a primary-path timeline and a scaling
 * footer underneath. The 6 mermaid diagrams live in their own tab.
 */

type LaneId = "client" | "api" | "compute" | "data" | "platform";

const LANES: {
  id: LaneId;
  n: string;
  label: string;
  tagline: string;
  cats: ArchComponent["category"][];
}[] = [
  { id: "client",   n: "I",   label: "Client & Edge",  tagline: "what the user touches",     cats: ["frontend", "cdn", "edge"] },
  { id: "api",      n: "II",  label: "API & Identity", tagline: "the front door",            cats: ["api", "auth"] },
  { id: "compute",  n: "III", label: "Compute",        tagline: "where the work happens",    cats: ["service", "worker", "ml", "other"] },
  { id: "data",     n: "IV",  label: "Data & State",   tagline: "where everything lives",    cats: ["database", "cache", "queue", "storage"] },
  { id: "platform", n: "V",   label: "Platform",       tagline: "ops, telemetry, glue",      cats: ["observability", "integration"] },
];

const CAT_ICON: Record<ArchComponent["category"], string> = {
  frontend: "web",
  cdn: "cloud_queue",
  edge: "public",
  api: "api",
  auth: "fingerprint",
  service: "settings",
  worker: "conveyor_belt",
  ml: "smart_toy",
  other: "widgets",
  database: "database",
  cache: "bolt",
  queue: "swap_horiz",
  storage: "inventory_2",
  observability: "monitoring",
  integration: "extension",
};

export function SystemBlueprint({ arch }: { arch: Architecture }) {
  const region = useRegion();
  const lanes = useMemo(
    () =>
      LANES.map((lane) => ({
        ...lane,
        items: arch.components.filter((c) => lane.cats.includes(c.category)),
      })).filter((l) => l.items.length > 0),
    [arch.components],
  );

  const idxByCompId = useMemo(() => {
    const m = new Map<string, number>();
    arch.components.forEach((c, i) => m.set(c.id, i + 1));
    return m;
  }, [arch.components]);

  const cornerStamp = arch.meta.domain.split("·")[0]?.trim() || "architecture";

  return (
    <div className="flex flex-col gap-9">
      {/* ─────────── Title block ─────────── */}
      <header className="flex items-end justify-between gap-6 border-b border-[hsl(var(--line))] pb-5">
        <div className="min-w-0">
          <div className="section-num text-[10.5px] mb-2">Blueprint</div>
          <h2 className="display-tight text-[clamp(1.65rem,2.6vw,2.45rem)] leading-[1.02] tracking-[-0.03em]">
            {arch.meta.title}{" "}
            <span className="serif italic accent text-[0.66em] font-normal">— a single sheet.</span>
          </h2>
          <p className="serif italic mt-2 text-[14px] text-[hsl(var(--ink-2))] max-w-[70ch]">
            {arch.meta.one_liner}
          </p>
        </div>
        <dl className="hidden md:grid grid-cols-3 gap-x-6 text-right shrink-0">
          <Stat n={arch.components.length} k="parts" />
          <Stat n={arch.data_flows.length} k="wires" />
          <Stat n={arch.applied_patterns?.length ?? 0} k="patterns" />
        </dl>
      </header>

      {/* ─────────── Blueprint frame ─────────── */}
      <div className="relative card-paper overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0 blueprint-grid opacity-[0.18]" />

        <BlueprintCorner pos="tl" label={`B-01 · ${String(arch.components.length).padStart(2, "0")}`} />
        <BlueprintCorner pos="tr" label="Rev. A" />
        <BlueprintCorner pos="bl" label="Tessar" />
        <BlueprintCorner pos="br" label={cornerStamp} />

        <div className="relative p-5 md:p-7 lg:p-9">
          <div
            className="grid gap-px bg-[hsl(var(--line))] border border-[hsl(var(--line))]"
            style={{ gridTemplateColumns: `repeat(${lanes.length}, minmax(0, 1fr))` }}
          >
            {lanes.map((lane) => (
              <div key={lane.id} className="bg-[hsl(var(--paper))]/95 backdrop-blur-[1px] p-4 flex flex-col gap-3">
                <header className="flex items-baseline justify-between gap-2 pb-2 border-b border-[hsl(var(--line))]">
                  <div className="min-w-0">
                    <div className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-[hsl(var(--accent))]">
                      {lane.n}
                    </div>
                    <h3 className="display text-[14px] leading-tight tracking-[-0.02em] mt-0.5">
                      {lane.label}
                    </h3>
                  </div>
                  <span className="font-mono text-[10px] tabular-nums text-[hsl(var(--ink-3))]">
                    {String(lane.items.length).padStart(2, "0")}
                  </span>
                </header>
                <p className="serif italic text-[11.5px] -mt-2 text-[hsl(var(--ink-3))]">
                  {lane.tagline}
                </p>

                <ul className="flex flex-col gap-2.5 mt-1">
                  {lane.items.map((c) => (
                    <BlueprintCard key={c.id} c={c} index={idxByCompId.get(c.id) ?? 0} />
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─────────── Primary data flow ─────────── */}
      <section className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between gap-4 border-b border-[hsl(var(--line))] pb-3">
          <div>
            <div className="section-num text-[10.5px] mb-1">Wires</div>
            <h3 className="display text-[clamp(1.05rem,1.4vw,1.25rem)] tracking-[-0.02em]">
              Primary path — from a request to a durable write.
            </h3>
          </div>
          <span className="hidden md:inline font-mono text-[10px] uppercase tracking-wider text-[hsl(var(--ink-3))]">
            {arch.data_flows.length} steps
          </span>
        </div>

        <ol className="relative">
          <div aria-hidden className="absolute left-[18px] top-3 bottom-3 w-px bg-[hsl(var(--line))]" />
          <div aria-hidden className="absolute left-[17px] top-3 bottom-3 blueprint-flow-rail" />
          {arch.data_flows.map((f) => (
            <li
              key={f.step}
              className="relative pl-12 pr-1 py-3 border-b border-[hsl(var(--line))] last:border-b-0 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-x-4 gap-y-1 items-baseline"
            >
              <span
                aria-hidden
                className="absolute left-[11px] top-4 w-[14px] h-[14px] rounded-full bg-[hsl(var(--paper))] border-2 border-[hsl(var(--accent))]"
              />
              <div className="min-w-0">
                <div className="flex items-baseline gap-2 mb-0.5 flex-wrap">
                  <span className="font-mono text-[10px] tabular-nums text-[hsl(var(--ink-3))]">
                    {String(f.step).padStart(2, "0")}
                  </span>
                  <span className="display text-[13.5px] tracking-[-0.02em]">
                    {f.from} <span className="text-[hsl(var(--accent))] mx-0.5">→</span> {f.to}
                  </span>
                </div>
                <p className="text-[12px] leading-snug text-[hsl(var(--ink-2))]">{f.action}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0 md:justify-end">
                <span className="font-mono text-[9.5px] uppercase tracking-[0.12em] bg-[hsl(var(--paper-2))] border border-[hsl(var(--line))] px-1.5 h-5 inline-flex items-center text-[hsl(var(--ink-2))]">
                  {f.protocol}
                </span>
                {typeof f.latency_budget_ms === "number" && (
                  <span className="font-mono text-[10px] tabular-nums text-[hsl(var(--accent))]">
                    {f.latency_budget_ms}ms
                  </span>
                )}
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* ─────────── Scale snapshot ─────────── */}
      {arch.scale_profiles?.length > 0 && (
        <section className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between gap-4 border-b border-[hsl(var(--line))] pb-3">
            <div>
              <div className="section-num text-[10.5px] mb-1">Scaling</div>
              <h3 className="display text-[clamp(1.05rem,1.4vw,1.25rem)] tracking-[-0.02em]">
                Same blueprint, four sizes.
              </h3>
            </div>
            <span className="hidden md:inline font-mono text-[10px] uppercase tracking-wider text-[hsl(var(--ink-3))]">
              {arch.scale_profiles.length} tiers
            </span>
          </div>
          <div
            className="grid gap-px bg-[hsl(var(--line))] border border-[hsl(var(--line))]"
            style={{ gridTemplateColumns: `repeat(${Math.min(arch.scale_profiles.length, 4)}, minmax(0, 1fr))` }}
          >
            {arch.scale_profiles.slice(0, 4).map((p) => (
              <div key={p.tier} className="bg-[hsl(var(--paper))] p-4 flex flex-col gap-1.5">
                <div className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-[hsl(var(--accent))]">
                  {p.tier}
                </div>
                <div className="display text-[15px] tracking-[-0.02em]">{p.expected_users}</div>
                <div className="text-[11px] text-[hsl(var(--ink-3))]">
                  {p.expected_rps} · {p.storage_estimate}
                </div>
                <div className="mt-1 pt-2 border-t border-[hsl(var(--line))] font-mono text-[10px] tabular-nums text-[hsl(var(--ink-2))]">
                  {formatScaleBand(p, region)}/mo
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

/* ───────────────────────────── helpers ───────────────────────────── */

function BlueprintCard({ c, index }: { c: ArchComponent; index: number }) {
  return (
    <li className="group relative bg-[hsl(var(--paper-2))]/80 border border-[hsl(var(--line))] hover:border-[hsl(var(--accent))] transition-colors p-3">
      <div className="flex items-baseline justify-between gap-2">
        <div className="flex items-baseline gap-2 min-w-0">
          <span className="font-mono text-[10px] tabular-nums text-[hsl(var(--ink-3))] shrink-0">
            {String(index).padStart(2, "0")}
          </span>
          <h4 className="display text-[13px] tracking-[-0.02em] leading-tight truncate">
            {c.name}
          </h4>
        </div>
        <span
          aria-hidden
          className="ms text-[15px] text-[hsl(var(--ink-3))] group-hover:text-[hsl(var(--accent))] transition-colors shrink-0"
        >
          {CAT_ICON[c.category]}
        </span>
      </div>
      <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.08em] text-[hsl(var(--ink-3))] leading-[1.35] line-clamp-2">
        {c.technology}
      </div>
      <p className="mt-1.5 text-[11.5px] leading-[1.45] text-[hsl(var(--ink-2))] line-clamp-3">
        {c.responsibility}
      </p>
      <div className="mt-2 pt-2 border-t border-dashed border-[hsl(var(--line))] flex items-baseline gap-1.5">
        <span className="text-[9px] font-mono uppercase tracking-[0.15em] text-[hsl(var(--accent))] shrink-0">
          ↗ scale
        </span>
        <span className="text-[11px] text-[hsl(var(--ink))] truncate">{c.scaling}</span>
      </div>
    </li>
  );
}

function Stat({ n, k }: { n: number; k: string }) {
  return (
    <div>
      <dt className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-[hsl(var(--ink-3))]">{k}</dt>
      <dd className="display text-[26px] tabular-nums leading-none mt-1">
        {String(n).padStart(2, "0")}
      </dd>
    </div>
  );
}

function BlueprintCorner({
  pos,
  label,
}: {
  pos: "tl" | "tr" | "bl" | "br";
  label: string;
}) {
  const map = {
    tl: "top-2 left-2",
    tr: "top-2 right-2",
    bl: "bottom-2 left-2",
    br: "bottom-2 right-2",
  } as const;
  return (
    <div
      aria-hidden
      className={cn(
        "absolute z-[1] px-1.5 py-0.5 bg-[hsl(var(--paper))] border border-[hsl(var(--line))] font-mono text-[8.5px] uppercase tracking-[0.18em] text-[hsl(var(--ink-3))]",
        map[pos],
      )}
    >
      {label}
    </div>
  );
}
