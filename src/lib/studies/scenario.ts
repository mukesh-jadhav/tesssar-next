/**
 * Pure projections for the cockpit's Scenario engine.
 *
 * Given an `Architecture` and a `Scenario`, returns re-computed numbers
 * (cost, latency, ceiling, bottleneck) — no model inference, no I/O,
 * deterministic.
 *
 * Runs on every slider tick in the cockpit AND optionally server-side
 * when persisting insights at fan-in. The functions must therefore:
 *  - never throw on malformed payloads (return neutral values instead),
 *  - never read `Date.now()` / `Math.random()` / globals,
 *  - never mutate inputs.
 *
 * See docs/STUDY_PLAN.md §4 and §11.
 */

import type {
  Architecture,
  ArchComponent,
  CostLineItem,
  DataFlow,
  ScaleProfile,
  ScaleTier,
} from "@/types/architecture";

// ---------- Scenario ----------

export interface Scenario {
  /** Continuous MAU, 1K → 100M, log-scale slider in the bar. */
  loadMau: number;
  latencyBudgetMs: 50 | 200 | 500 | 1000;
  regionFailureSim: boolean;
  /** ₹ / month ceiling, undefined = no ceiling. */
  costCeilingInr?: number;
}

export const DEFAULT_SCENARIO: Scenario = {
  loadMau: 100_000,
  latencyBudgetMs: 200,
  regionFailureSim: false,
  costCeilingInr: undefined,
};

// ---------- Scale tier mapping ----------

/**
 * Approximate MAU ranges per tier. Used to find the bracketing pair of
 * `scale_profiles` for cost interpolation.
 *
 * We treat the centres as the tier reference points. Linear
 * interpolation on log10(MAU) between centres preserves intuition (a
 * 2× load jump ~ a 2× cost jump within the same tier).
 */
const TIER_CENTRE_MAU: Record<ScaleTier, number> = {
  startup:    3_000,        // < 10K
  growth:     100_000,      // 10K – 500K
  scale:      2_000_000,    // 500K – 10M
  hyperscale: 50_000_000,   // 10M+
};

const TIER_ORDER: readonly ScaleTier[] = [
  "startup",
  "growth",
  "scale",
  "hyperscale",
] as const;

function tierForMau(mau: number): ScaleTier {
  if (mau < 10_000)     return "startup";
  if (mau < 500_000)    return "growth";
  if (mau < 10_000_000) return "scale";
  return "hyperscale";
}

// ---------- Cost categories ----------

export type CostCategory =
  | "compute"
  | "data"
  | "network"
  | "obs"
  | "ml"
  | "other";

const CATEGORY_LABEL: Record<CostCategory, string> = {
  compute: "Compute",
  data:    "Data",
  network: "Network",
  obs:     "Observability",
  ml:      "ML",
  other:   "Other",
};

export function categoryLabel(c: CostCategory): string {
  return CATEGORY_LABEL[c];
}

/**
 * Map a free-text `CostLineItem.service` (e.g. "Cloud Run", "Cloud
 * Storage", "Cloud Monitoring") to a category bucket. Falls back to
 * "other" so the total never loses money to misclassification.
 */
function categorize(service: string): CostCategory {
  const s = service.toLowerCase();
  // Network must come before generic compute checks because "load balancer"
  // can contain "balanc" but feels like edge.
  if (/(cdn|cloudfront|akamai|fastly|cloud armor|waf|load balanc|alb|nlb|front door|api gateway|app gateway|cloud nat|egress|vpc|interconnect|transit|peering)/.test(s)) {
    return "network";
  }
  if (/(monitor|logging|trace|grafana|datadog|new relic|honeycomb|x-ray|sentry|error reporting|opentelemetry|otel|prometheus|cloudwatch logs|cloudwatch metric|stackdriver)/.test(s)) {
    return "obs";
  }
  if (/(vertex|sagemaker|bedrock|openai|anthropic|hugging|gpu|tpu|vector|embedding|gemini|llm|llama|whisper|stable ?diffusion)/.test(s)) {
    return "ml";
  }
  if (/(cloud run|gke|kubernetes|ecs|eks|fargate|lambda|cloud function|app runner|container apps|aks|azure functions|compute engine|ec2|vm|app engine|kafka connect)/.test(s)) {
    return "compute";
  }
  if (/(spanner|firestore|bigtable|sql|postgres|aurora|rds|dynamodb|cosmos|cockroach|memorystore|redis|elasticache|memcache|bigquery|snowflake|redshift|synapse|opensearch|elasticsearch|kafka|pub\/?sub|sns|sqs|kinesis|event ?hub|service ?bus|event ?grid|storage|s3|blob|gcs|cdn cache|cosmos db)/.test(s)) {
    return "data";
  }
  return "other";
}

// ---------- Cost projection ----------

export interface CostProjection {
  /** ₹/mo by category. */
  byCategory: Record<CostCategory, number>;
  /** ₹/mo total — sum of all categories. */
  totalInr: number;
  /** Whether the projection exceeds the user's optional ceiling. */
  overCeiling: boolean;
  /** Multiplicative DR overhead applied when region-failure sim is on. */
  drOverheadInr: number;
}

const EMPTY_COST: CostProjection = {
  byCategory: { compute: 0, data: 0, network: 0, obs: 0, ml: 0, other: 0 },
  totalInr: 0,
  overCeiling: false,
  drOverheadInr: 0,
};

/**
 * Interpolate cost ₹/mo for the requested tier between adjacent
 * scale_profiles. Returns the per-tier midpoint (low/high average).
 */
function profileTotal(p: ScaleProfile): number {
  const low = Number.isFinite(p.monthly_cost_inr_low) ? p.monthly_cost_inr_low : 0;
  const high = Number.isFinite(p.monthly_cost_inr_high) ? p.monthly_cost_inr_high : low;
  return (low + high) / 2;
}

/**
 * Find a sensible scale-factor for the load relative to the arch's
 * tier-of-record. Uses log-space distance between tier centres so going
 * from 100K→1M roughly doubles cost — matches every cloud's pricing
 * intuition closely enough for a slider that re-renders at 60fps.
 */
function tierScaleFactor(
  fromTier: ScaleTier,
  toTier: ScaleTier,
): number {
  const fromMau = TIER_CENTRE_MAU[fromTier];
  const toMau = TIER_CENTRE_MAU[toTier];
  if (!(fromMau > 0) || !(toMau > 0)) return 1;
  // log10 ratio: each decade ≈ 4× cost (typical cloud bend). Clamp so a
  // 4-tier jump doesn't go to absurd numbers on toy briefs.
  const decades = Math.log10(toMau / fromMau);
  const factor = Math.pow(4, decades);
  return Math.max(0.1, Math.min(factor, 256));
}

/**
 * Pick the scale profile closest to the scenario's MAU, return the
 * total ₹/mo midpoint, then scale by the per-tier factor.
 */
function projectedMonthlyInrFromProfiles(
  profiles: readonly ScaleProfile[],
  scenarioTier: ScaleTier,
): number {
  if (!profiles.length) return 0;
  // Prefer an exact tier match if the agent supplied one.
  const exact = profiles.find((p) => p.tier === scenarioTier);
  if (exact) return profileTotal(exact);
  // Otherwise project from the nearest tier we have.
  // Nearest in TIER_ORDER index distance.
  const targetIdx = TIER_ORDER.indexOf(scenarioTier);
  let best = profiles[0];
  let bestDistance = Math.abs(TIER_ORDER.indexOf(best.tier) - targetIdx);
  for (const p of profiles) {
    const d = Math.abs(TIER_ORDER.indexOf(p.tier) - targetIdx);
    if (d < bestDistance) {
      best = p;
      bestDistance = d;
    }
  }
  return profileTotal(best) * tierScaleFactor(best.tier, scenarioTier);
}

/**
 * Split a projected total across cost categories using the arch's
 * `cost_breakdown` line items as the weighting prior. If the breakdown
 * is empty/missing, falls back to a generic split.
 */
function splitByCategory(
  projectedTotalInr: number,
  breakdown: readonly CostLineItem[],
  scenarioTier: ScaleTier,
): Record<CostCategory, number> {
  const buckets: Record<CostCategory, number> = {
    compute: 0, data: 0, network: 0, obs: 0, ml: 0, other: 0,
  };
  // Prefer line items at the scenario tier — they're the most representative.
  const scoped = breakdown.filter((l) => l.tier === scenarioTier);
  const lines = scoped.length ? scoped : breakdown;
  if (!lines.length) {
    // Generic fallback split. Compute-heavy.
    return {
      compute: projectedTotalInr * 0.42,
      data:    projectedTotalInr * 0.28,
      network: projectedTotalInr * 0.12,
      obs:     projectedTotalInr * 0.08,
      ml:      projectedTotalInr * 0.0,
      other:   projectedTotalInr * 0.10,
    };
  }
  // Sum line-item midpoints by category, then normalise.
  let sum = 0;
  for (const l of lines) {
    const lo = Number.isFinite(l.monthly_inr_low) ? l.monthly_inr_low : 0;
    const hi = Number.isFinite(l.monthly_inr_high) ? l.monthly_inr_high : lo;
    const mid = (lo + hi) / 2;
    const cat = categorize(l.service);
    buckets[cat] += mid;
    sum += mid;
  }
  if (sum <= 0) {
    return splitByCategory(projectedTotalInr, [], scenarioTier);
  }
  const factor = projectedTotalInr / sum;
  for (const k of Object.keys(buckets) as CostCategory[]) {
    buckets[k] = buckets[k] * factor;
  }
  return buckets;
}

export function projectCost(arch: Architecture, scenario: Scenario): CostProjection {
  if (!arch?.scale_profiles?.length) return EMPTY_COST;

  const targetTier = tierForMau(scenario.loadMau);
  const baseTotal = projectedMonthlyInrFromProfiles(arch.scale_profiles, targetTier);
  if (!(baseTotal > 0)) return EMPTY_COST;

  const byCategory = splitByCategory(
    baseTotal,
    arch.cost_breakdown ?? [],
    targetTier,
  );

  // DR overhead model: when region-failure sim is on, assume the user is
  // running active-passive at minimum → +35% on compute+data+network. The
  // hard-cost penalty captures the standby capacity; observability stays
  // shared across regions.
  let drOverheadInr = 0;
  if (scenario.regionFailureSim) {
    const drBase = byCategory.compute + byCategory.data + byCategory.network;
    drOverheadInr = drBase * 0.35;
    byCategory.compute += byCategory.compute * 0.35;
    byCategory.data    += byCategory.data    * 0.35;
    byCategory.network += byCategory.network * 0.35;
  }

  const totalInr = Object.values(byCategory).reduce((a, b) => a + b, 0);
  const overCeiling =
    scenario.costCeilingInr != null && totalInr > scenario.costCeilingInr;

  return { byCategory, totalInr, overCeiling, drOverheadInr };
}

// ---------- Latency projection ----------

export interface LatencyProjection {
  /** Projected p95, ms. 0 when the arch has no usable latency data. */
  p95Ms: number;
  /** Whether the projection breaches the budget. */
  overBudget: boolean;
  /** Component id (or null) the longest flow hangs on. */
  bottleneckComponentId: string | null;
  /** Human label of the bottleneck (component name or "data store"). */
  bottleneckLabel: string | null;
}

const EMPTY_LATENCY: LatencyProjection = {
  p95Ms: 0,
  overBudget: false,
  bottleneckComponentId: null,
  bottleneckLabel: null,
};

/**
 * Build a directed adjacency map from data flows and walk depth-first
 * for the longest cumulative `latency_budget_ms`. Cycles bounded by a
 * visited set per walk so a malformed flow can't blow the stack.
 */
function longestLatencyChain(flows: readonly DataFlow[]): {
  ms: number;
  bottleneckId: string | null;
} {
  if (!flows.length) return { ms: 0, bottleneckId: null };

  // Step-ordered traversal of the canonical flow. The agent emits steps
  // in numeric order; treat them as a single pipeline first.
  const sorted = [...flows].sort((a, b) => a.step - b.step);
  let sum = 0;
  let max = { hop: 0, to: null as string | null };
  for (const f of sorted) {
    const ms = Number.isFinite(f.latency_budget_ms) ? f.latency_budget_ms ?? 0 : 0;
    sum += ms;
    if (ms > max.hop) {
      max = { hop: ms, to: f.to ?? null };
    }
  }
  // If the sum is 0 (no budgets supplied by the agent), fall back to a
  // pessimistic constant per hop so the chart at least shows growth.
  if (sum === 0) {
    const hops = sorted.length;
    return { ms: hops * 25, bottleneckId: null };
  }
  return { ms: sum, bottleneckId: max.to };
}

export function projectLatency(arch: Architecture, scenario: Scenario): LatencyProjection {
  if (!arch?.data_flows?.length) return EMPTY_LATENCY;

  const { ms: baseMs, bottleneckId } = longestLatencyChain(arch.data_flows);
  if (baseMs <= 0) return EMPTY_LATENCY;

  // Tier penalty: as the workload grows, each component takes longer
  // under contention. We model it as log-growth so the curve bends but
  // doesn't explode.
  // Spec: p95 = sumLatency * (1 + log(load/tierLoad) * 0.15).
  const archTierRef =
    arch.scale_profiles?.[0]?.tier ?? "growth";
  const ratio = scenario.loadMau / Math.max(1, TIER_CENTRE_MAU[archTierRef]);
  const penalty = ratio > 1 ? 1 + Math.log10(ratio) * 0.15 : 1;

  const p95Ms = Math.round(baseMs * penalty);

  let bottleneckLabel: string | null = null;
  if (bottleneckId) {
    const c = (arch.components ?? []).find((x) => x.id === bottleneckId);
    bottleneckLabel = c?.name ?? bottleneckId;
  }

  return {
    p95Ms,
    overBudget: p95Ms > scenario.latencyBudgetMs,
    bottleneckComponentId: bottleneckId,
    bottleneckLabel,
  };
}

// ---------- Sustainable load ceiling ----------

export interface CeilingProjection {
  /**
   * Max MAU the architecture can sustain at its declared hyperscale
   * profile. Defaults to the hyperscale MAU centre when the agent has
   * given us a "hyperscale" profile; otherwise extrapolated.
   */
  maxSustainableMau: number;
  /** First component to saturate at projected load (or null). */
  saturatingComponentId: string | null;
  saturatingComponentName: string | null;
}

const EMPTY_CEILING: CeilingProjection = {
  maxSustainableMau: 0,
  saturatingComponentId: null,
  saturatingComponentName: null,
};

/**
 * A cheap heuristic for "what saturates first". Looks for the component
 * whose `scaling` field reads like a hard bottleneck (single-writer,
 * sharded under load, single region, etc.). The agent uses consistent
 * vocab here, so substring matches catch the common cases.
 */
function findLikelyBottleneck(components: readonly ArchComponent[]): {
  id: string | null;
  name: string | null;
} {
  if (!components.length) return { id: null, name: null };
  const BOTTLENECK_HINTS = [
    "single primary",
    "single writer",
    "single region",
    "single-region",
    "leader-only",
    "primary node",
    "vertical scale",
    "vertically scale",
    "shard manually",
    "manual sharding",
    "no autoscale",
    "fixed capacity",
  ];
  for (const c of components) {
    const s = (c.scaling ?? "").toLowerCase();
    if (BOTTLENECK_HINTS.some((h) => s.includes(h))) {
      return { id: c.id, name: c.name };
    }
  }
  // Otherwise pick the first database-class component as a reasonable
  // default — DBs are the most common ceiling.
  const db = components.find((c) =>
    ["database", "queue", "cache"].includes(c.category),
  );
  return db ? { id: db.id, name: db.name } : { id: null, name: null };
}

export function projectCeiling(arch: Architecture): CeilingProjection {
  if (!arch) return EMPTY_CEILING;
  const profiles = arch.scale_profiles ?? [];
  const top = profiles.find((p) => p.tier === "hyperscale")
    ?? profiles.find((p) => p.tier === "scale")
    ?? profiles[profiles.length - 1]
    ?? null;
  const maxMau = top
    ? TIER_CENTRE_MAU[top.tier]
    : 0;
  const bn = findLikelyBottleneck(arch.components ?? []);
  return {
    maxSustainableMau: maxMau,
    saturatingComponentId: bn.id,
    saturatingComponentName: bn.name,
  };
}

// ---------- Bundled projection ----------

export interface ScenarioProjection {
  cost:    CostProjection;
  latency: LatencyProjection;
  ceiling: CeilingProjection;
}

/**
 * Convenience: one call returns every projection. Lens components can
 * subscribe to the slice they care about without re-deriving.
 */
export function projectScenario(
  arch: Architecture,
  scenario: Scenario,
): ScenarioProjection {
  return {
    cost:    projectCost(arch, scenario),
    latency: projectLatency(arch, scenario),
    ceiling: projectCeiling(arch),
  };
}

// ---------- Derived: requests-per-month + per-1M cost ----------

/**
 * Translate MAU → monthly requests using an interactive-app heuristic
 * (~50 requests / MAU / month). Coarse but consistent across variants.
 */
export function estimatedMonthlyRequests(mau: number): number {
  if (!Number.isFinite(mau) || mau <= 0) return 0;
  return mau * 50;
}

/**
 * ₹ per 1M requests at the current scenario load. Returns 0 when the
 * arch has no usable cost data.
 */
export function costPer1MRequests(
  totalInr: number,
  mau: number,
): number {
  const monthlyReq = estimatedMonthlyRequests(mau);
  if (monthlyReq <= 0) return 0;
  return (totalInr * 1_000_000) / monthlyReq;
}
