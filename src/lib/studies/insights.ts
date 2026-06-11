/**
 * Pure insight computations across the variants of a study.
 *
 * Every function takes plain arch payloads and returns serialisable
 * primitives — safe to run during cockpit slider drag AND persistable
 * at fan-in by the worker.
 *
 * No I/O. No randomness. No exceptions on missing fields.
 *
 * See docs/STUDY_PLAN.md §11.
 */

import type { Architecture } from "@/types/architecture";
import { projectCost, type Scenario } from "./scenario";
import { formatCostFromInr } from "@/lib/geo/cost";
import type { Region } from "@/lib/geo/region";

// ---------- Inputs ----------

/**
 * A complete variant with its arch payload. `arch` may be null when a
 * variant failed; insight functions skip those entries silently.
 */
export interface InsightVariant {
  variantId: string;
  label: string;
  arch: Architecture | null;
}

// ---------- Output shapes ----------

export interface Winner<T = number> {
  variantId: string;
  label: string;
  /** Numeric value (score, ₹, count). 0 when the field is N/A. */
  value: T;
  /** Margin over the next-best variant (same units as `value`). */
  marginOverNext: number;
  /** Human-readable summary the cockpit can render directly. */
  reason: string;
}

export type WinnerOrNull = Winner | null;

// ---------- Helpers ----------

function liveVariants(variants: readonly InsightVariant[]): InsightVariant[] {
  return variants.filter((v) => v.arch != null);
}

/**
 * Pick the variant with the lowest score (lower-is-better). Returns null
 * when there are 0 or 1 live variants.
 */
function pickMin(
  variants: readonly InsightVariant[],
  scoreFn: (v: InsightVariant) => number,
  reasonFn: (v: InsightVariant, score: number, margin: number) => string,
): WinnerOrNull {
  const live = liveVariants(variants);
  if (live.length < 1) return null;
  const scored = live.map((v) => ({ v, s: scoreFn(v) }));
  scored.sort((a, b) => a.s - b.s);
  const best = scored[0];
  const next = scored[1];
  const margin = next ? Math.abs(next.s - best.s) : 0;
  return {
    variantId: best.v.variantId,
    label: best.v.label,
    value: best.s,
    marginOverNext: margin,
    reason: reasonFn(best.v, best.s, margin),
  };
}

/**
 * Pick the variant with the highest score (higher-is-better).
 */
function pickMax(
  variants: readonly InsightVariant[],
  scoreFn: (v: InsightVariant) => number,
  reasonFn: (v: InsightVariant, score: number, margin: number) => string,
): WinnerOrNull {
  const live = liveVariants(variants);
  if (live.length < 1) return null;
  const scored = live.map((v) => ({ v, s: scoreFn(v) }));
  scored.sort((a, b) => b.s - a.s);
  const best = scored[0];
  const next = scored[1];
  const margin = next ? Math.abs(best.s - next.s) : 0;
  return {
    variantId: best.v.variantId,
    label: best.v.label,
    value: best.s,
    marginOverNext: margin,
    reason: reasonFn(best.v, best.s, margin),
  };
}

// ---------- Per-arch scores ----------

/**
 * Lock-in score 0–10 (higher = MORE locked-in). Crude heuristic:
 *  - +1 per managed-service component identified by vendor keyword
 *  - +1 per proprietary-pattern reference in applied_patterns
 *  - capped at 10
 */
export function lockInScore(arch: Architecture | null): number {
  if (!arch) return 0;
  const VENDOR_PATTERNS: Array<{ rx: RegExp; weight: number }> = [
    { rx: /spanner|bigtable|firestore|datastore/i,            weight: 1.2 },
    { rx: /dynamodb|aurora dsql|aws sqs|kinesis/i,            weight: 1.2 },
    { rx: /cosmos ?db|event ?grid|service ?bus/i,             weight: 1.2 },
    { rx: /cloud run|lambda|cloud function|app runner|azure functions|container apps/i, weight: 0.8 },
    { rx: /pub\/?sub|sns|event ?hub/i,                        weight: 0.6 },
    { rx: /bigquery|redshift|snowflake|synapse/i,             weight: 1.0 },
    { rx: /vertex|sagemaker|bedrock|gemini/i,                 weight: 0.8 },
    { rx: /cloud cdn|cloudfront|front door|akamai/i,          weight: 0.3 },
    { rx: /identity platform|cognito|firebase auth|entra/i,   weight: 0.8 },
  ];
  let score = 0;
  for (const c of arch.components ?? []) {
    const tech = `${c.technology ?? ""} ${c.name ?? ""}`;
    for (const v of VENDOR_PATTERNS) {
      if (v.rx.test(tech)) {
        score += v.weight;
        break;
      }
    }
  }
  // Open-source alternatives in `c.alternatives` reduce lock-in.
  const oss = (arch.components ?? []).filter((c) =>
    (c.alternatives ?? []).some((a) => /postgres|kafka|redis|opensearch|temporal|nats|click ?house/i.test(a)),
  ).length;
  score -= oss * 0.2;
  // Polyglot tech_stack with explicit OSS preferences also reduces lock-in.
  const ossLayers = (arch.tech_stack ?? []).filter((t) =>
    /postgres|kafka|redis|temporal|nats|kubernetes|terraform|helm/i.test(t.choice ?? ""),
  ).length;
  score -= ossLayers * 0.15;
  return Math.max(0, Math.min(10, Number(score.toFixed(2))));
}

/**
 * Ops score 0–100 (higher = LOWER ops burden, easier to run).
 * Rewards managed services + observability maturity + automated rollback.
 */
export function opsScore(arch: Architecture | null): number {
  if (!arch) return 0;
  let score = 50;

  // Managed-service density: every component that reads "managed" /
  // "serverless" / "autopilot" → +2.
  const components = arch.components ?? [];
  if (components.length > 0) {
    const managed = components.filter((c) =>
      /managed|serverless|autopilot|fully ?managed|saas/i.test(
        `${c.technology ?? ""} ${c.scaling ?? ""}`,
      ),
    ).length;
    score += (managed / components.length) * 25; // 0 → +25
  }

  // Self-managed Kubernetes / VMs / dedicated DBs subtract.
  const selfMgr = components.filter((c) =>
    /\bkubernetes\b|\bgke\b(?! autopilot)|\beks\b(?! fargate)|\baks\b|\bec2\b|\bvm\b|self-?hosted/i.test(
      `${c.technology ?? ""}`,
    ) && !/autopilot|fargate/i.test(`${c.technology ?? ""}`),
  ).length;
  if (components.length > 0) {
    score -= (selfMgr / components.length) * 20; // 0 → −20
  }

  // Observability maturity: SLOs + alerts + traces all present.
  const obs = arch.observability;
  if (obs) {
    if ((obs.slos?.length ?? 0) >= 2) score += 4;
    if ((obs.alerts?.length ?? 0) >= 3) score += 4;
    if ((obs.traces?.length ?? 0) >= 1) score += 2;
  }

  // Automated rollback in deployment story.
  const dep = arch.deployment;
  if (dep) {
    if (/automatic|automated|canary|blue ?\/? ?green/i.test(dep.rollback_strategy ?? "")) score += 5;
    if (/canary|blue ?\/? ?green|rolling/i.test(dep.rollout_strategy ?? "")) score += 3;
    if ((dep.iac ?? "").length > 0) score += 2;
    if ((dep.ci_cd ?? "").length > 0) score += 2;
  }

  // Open risks weigh down: 1 point per high/critical operability risk.
  const opsRisks = (arch.risks ?? []).filter(
    (r) => r.category === "operability" && (r.impact === "high" || r.impact === "critical"),
  ).length;
  score -= opsRisks * 2;

  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Number of components facing the public internet. Heuristic: any
 * frontend / api / cdn / edge / auth + any component whose
 * responsibility mentions "ingress" or "public".
 */
export function attackSurface(arch: Architecture | null): number {
  if (!arch) return 0;
  return (arch.components ?? []).filter((c) => {
    if (["frontend", "api", "cdn", "edge", "auth"].includes(c.category)) return true;
    const r = (c.responsibility ?? "").toLowerCase();
    return /\bpublic\b|\bingress\b|\binternet-facing\b/.test(r);
  }).length;
}

/**
 * "Fastest to ship" score: rewards fewer net-new components, more
 * managed/serverless ratio, less custom infra.
 * Returns a 0–100 score (higher = ships faster).
 */
export function shipSpeedScore(arch: Architecture | null): number {
  if (!arch) return 0;
  const components = arch.components ?? [];
  if (components.length === 0) return 0;
  let score = 100;
  // Each component beyond ~6 adds friction.
  score -= Math.max(0, components.length - 6) * 2;
  // K8s / custom infra subtract.
  const customInfra = components.filter((c) =>
    /\bkubernetes\b|\bgke\b(?! autopilot)|\beks\b(?! fargate)|\baks\b|\bvm\b|\bec2\b|self-?hosted|operator/i.test(
      `${c.technology ?? ""}`,
    ),
  ).length;
  score -= customInfra * 6;
  // Serverless / managed add back.
  const serverless = components.filter((c) =>
    /serverless|managed|autopilot|fargate|cloud run|lambda|cloud function|app runner|container apps|azure functions/i.test(
      `${c.technology ?? ""}`,
    ),
  ).length;
  score += serverless * 3;
  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Residency score 0–100 for a target region keyword (e.g. "asia-south",
 * "india", "eu", "us"). Higher = better fit. Looks at deployment regions.
 */
export function residencyScore(arch: Architecture | null, regionHint: string): number {
  if (!arch?.deployment) return 0;
  const hint = regionHint.toLowerCase();
  const primary = (arch.deployment.primary_region ?? "").toLowerCase();
  const extras = (arch.deployment.additional_regions ?? []).map((r) => r.toLowerCase());
  let score = 0;
  if (primary.includes(hint)) score += 70;
  for (const r of extras) {
    if (r.includes(hint)) score += 10;
  }
  return Math.min(100, score);
}

// ---------- Cross-variant winners ----------

export function cheapestAtScale(
  variants: readonly InsightVariant[],
  scenario: Scenario,
  region: Region = "IN",
): WinnerOrNull {
  return pickMin(
    variants,
    (v) => projectCost(v.arch!, scenario).totalInr,
    (v, score, margin) => {
      if (margin === 0) return `${v.label} is cheapest at this load.`;
      return `${v.label} is cheapest by ${formatCostFromInr(margin, region)}/mo vs the next option.`;
    },
  );
}

export function lowestOps(variants: readonly InsightVariant[]): WinnerOrNull {
  return pickMax(
    variants,
    (v) => opsScore(v.arch),
    (v, score, margin) => {
      const m = margin >= 1 ? ` (+${Math.round(margin)} pts vs next)` : "";
      return `${v.label} has the smallest ops surface — score ${Math.round(score)}/100${m}.`;
    },
  );
}

export function fastestToShip(variants: readonly InsightVariant[]): WinnerOrNull {
  return pickMax(
    variants,
    (v) => shipSpeedScore(v.arch),
    (v, score, margin) => {
      const m = margin >= 1 ? ` (+${Math.round(margin)} pts vs next)` : "";
      return `${v.label} ships fastest — score ${Math.round(score)}/100${m}.`;
    },
  );
}

export function bestResidency(
  variants: readonly InsightVariant[],
  regionHint: string,
): WinnerOrNull {
  if (!regionHint) return null;
  return pickMax(
    variants,
    (v) => residencyScore(v.arch, regionHint),
    (v, score) => {
      const region = (v.arch?.deployment?.primary_region ?? "").trim();
      if (score === 0) return `${v.label} has no clear footprint in "${regionHint}".`;
      return `${v.label} runs primary in ${region || regionHint}.`;
    },
  );
}

export function lowestLockIn(variants: readonly InsightVariant[]): WinnerOrNull {
  return pickMin(
    variants,
    (v) => lockInScore(v.arch),
    (v, score, margin) => {
      const m = margin >= 0.5 ? ` (−${margin.toFixed(1)} vs next)` : "";
      return `${v.label} is most portable — lock-in ${score.toFixed(1)}/10${m}.`;
    },
  );
}

// ---------- Compliance gaps ----------

export interface ComplianceGap {
  variantId: string;
  label: string;
  regime: string;
  gap: string;
}

const REGIME_REQUIREMENTS: Record<string, RegExp[]> = {
  // Each requirement is a "must mention" pattern. Missing == gap.
  dpdp:  [/india|asia-south|in-region|residency/i, /encryption|kms/i, /audit|access log/i],
  gdpr:  [/eu-|europe|germany|france|netherlands/i, /encryption|kms/i, /dpia|consent|erasure|right to be forgotten/i],
  hipaa: [/baa|business associate/i, /encryption|kms/i, /audit|access log/i, /phi/i],
  pci:   [/pci|tokeni[sz]ation|vault/i, /encryption|kms/i, /segment|network isolation/i],
  soc2:  [/audit|access log/i, /encryption|kms/i, /incident response|runbook/i],
};

/**
 * Find regimes where this study's variants are missing required controls.
 * Returns one entry per (variant, regime, missing requirement).
 */
export function complianceGaps(
  variants: readonly InsightVariant[],
  regimes: readonly string[],
): ComplianceGap[] {
  if (!regimes.length) return [];
  const out: ComplianceGap[] = [];
  for (const v of variants) {
    if (!v.arch) continue;
    const haystack = [
      v.arch.deployment?.primary_region,
      ...(v.arch.deployment?.additional_regions ?? []),
      ...(v.arch.security ?? []).map((s) => `${s.control} ${s.implementation}`),
      ...(v.arch.requirements?.non_functional ?? []),
      ...(v.arch.requirements?.assumptions ?? []),
    ].join(" ");
    for (const regime of regimes) {
      const key = regime.toLowerCase();
      const reqs = REGIME_REQUIREMENTS[key];
      if (!reqs) continue;
      for (const rx of reqs) {
        if (!rx.test(haystack)) {
          out.push({
            variantId: v.variantId,
            label: v.label,
            regime: key.toUpperCase(),
            gap: rxLabel(rx),
          });
        }
      }
    }
  }
  return out;
}

function rxLabel(rx: RegExp): string {
  const s = rx.source.replace(/[|()\\]/g, " ").replace(/\s+/g, " ").trim();
  const first = s.split(" ")[0];
  return `Missing reference to ${first}`;
}

// ---------- Verdict bundle ----------

/**
 * The "verdict" lens shows all six winners at once. Single call here
 * keeps the lens dumb and consistent across renders.
 */
export interface VerdictBundle {
  cheapest:        WinnerOrNull;
  lowestOps:       WinnerOrNull;
  fastestToShip:   WinnerOrNull;
  bestResidency:   WinnerOrNull;
  lowestLockIn:    WinnerOrNull;
  attackSurface:   WinnerOrNull;  // lowest = most secure
  gaps:            ComplianceGap[];
}

export function computeVerdict(
  variants: readonly InsightVariant[],
  scenario: Scenario,
  options: { residencyHint?: string; regimes?: readonly string[] } = {},
  region: Region = "IN",
): VerdictBundle {
  return {
    cheapest:      cheapestAtScale(variants, scenario, region),
    lowestOps:     lowestOps(variants),
    fastestToShip: fastestToShip(variants),
    bestResidency: options.residencyHint ? bestResidency(variants, options.residencyHint) : null,
    lowestLockIn:  lowestLockIn(variants),
    attackSurface: pickMin(
      variants,
      (v) => attackSurface(v.arch),
      (v, score, margin) => {
        const m = margin >= 1 ? ` (−${Math.round(margin)} vs next)` : "";
        return `${v.label} exposes the fewest public surfaces — ${Math.round(score)} component(s)${m}.`;
      },
    ),
    gaps:          complianceGaps(variants, options.regimes ?? []),
  };
}

// ---------- Formatting ----------

export function formatInr(amount: number): string {
  if (!Number.isFinite(amount) || amount <= 0) return "0";
  if (amount >= 1_00_00_000) return `${(amount / 1_00_00_000).toFixed(2)} Cr`;
  if (amount >= 1_00_000)    return `${(amount / 1_00_000).toFixed(2)} L`;
  if (amount >= 1_000)       return `${(amount / 1_000).toFixed(1)}K`;
  return Math.round(amount).toLocaleString("en-IN");
}

// ---------- Ops headcount + managed coverage ----------

/**
 * Fraction of an arch's components that are fully managed (serverless,
 * autopilot, fully-managed SaaS). Returns 0 when there are no components.
 */
export function managedFraction(arch: Architecture | null): number {
  if (!arch) return 0;
  const cs = arch.components ?? [];
  if (cs.length === 0) return 0;
  const managed = cs.filter((c) =>
    /managed|serverless|autopilot|fully ?managed|saas|fargate|lambda|cloud run|cloud function|app runner|container apps|azure functions/i.test(
      `${c.technology ?? ""} ${c.scaling ?? ""}`,
    ),
  ).length;
  return managed / cs.length;
}

/**
 * Components that the team will have to run themselves (Kubernetes, VMs,
 * self-hosted DBs, etc.). Limited to first 5 for the cockpit summary.
 */
export function selfRunComponents(arch: Architecture | null): string[] {
  if (!arch) return [];
  return (arch.components ?? [])
    .filter((c) => {
      const tech = c.technology ?? "";
      const isSelf =
        /\bkubernetes\b|\bgke\b(?! autopilot)|\beks\b(?! fargate)|\baks\b|\bopenshift\b|\bec2\b|\bvm\b|\bcompute engine\b|self-?hosted|operator/i.test(
          tech,
        );
      const autoflag = /autopilot|fargate/i.test(tech);
      return isSelf && !autoflag;
    })
    .slice(0, 5)
    .map((c) => c.name);
}

/**
 * Engineer headcount estimate per tier. Heuristic — meant as a directional
 * comparison between variants, not a hiring plan. Rooted in:
 *   - component count (more surface area → more people)
 *   - self-run-component count (each requires day-2 expertise)
 *   - managed fraction (offsets some headcount)
 *   - tier multiplier (scale is harder than growth)
 */
export function headcountAtTier(
  arch: Architecture | null,
  tier: "growth" | "scale" | "hyperscale",
): number {
  if (!arch) return 0;
  const componentCount = (arch.components ?? []).length;
  const selfRun = selfRunComponents(arch).length;
  const managed = managedFraction(arch);

  const multiplier =
    tier === "growth" ? 1
    : tier === "scale" ? 1.6
    : 2.4;

  const baseFromComponents = componentCount / 5;
  const baseFromSelfRun = selfRun * 1.2;
  const managedDiscount = managed * 1.5;

  const headcount = Math.round(
    Math.max(
      tier === "growth" ? 1 : tier === "scale" ? 2 : 3,
      (baseFromComponents + baseFromSelfRun - managedDiscount) * multiplier,
    ),
  );
  return headcount;
}

// ---------- Sticky service inventory ----------

const STICKY_VENDOR_RULES: Array<{ rx: RegExp; weight: number }> = [
  { rx: /\bspanner\b/i,                                 weight: 9 },
  { rx: /\bbigtable\b/i,                                weight: 8 },
  { rx: /\bdynamodb\b/i,                                weight: 9 },
  { rx: /\bcosmos ?db\b/i,                              weight: 9 },
  { rx: /\bbigquery\b/i,                                weight: 8 },
  { rx: /\bredshift\b/i,                                weight: 7 },
  { rx: /\bsynapse\b/i,                                 weight: 7 },
  { rx: /\bsnowflake\b/i,                               weight: 6 },
  { rx: /\bfirestore\b|\bdatastore\b/i,                 weight: 7 },
  { rx: /\baurora dsql\b/i,                             weight: 8 },
  { rx: /\baurora\b/i,                                  weight: 5 },
  { rx: /\blambda\b/i,                                  weight: 5 },
  { rx: /\bcloud function/i,                            weight: 5 },
  { rx: /\bazure functions\b/i,                         weight: 5 },
  { rx: /\bcloud run\b/i,                               weight: 4 },
  { rx: /\bservice ?bus\b|\bevent ?grid\b/i,            weight: 6 },
  { rx: /\bpub\/?sub\b/i,                               weight: 5 },
  { rx: /\bkinesis\b|\bevent ?hub\b/i,                  weight: 5 },
  { rx: /\bsqs\b|\bsns\b/i,                             weight: 4 },
  { rx: /\bidentity platform\b|\bfirebase auth\b|\bcognito\b|\bentra\b/i, weight: 5 },
  { rx: /\bvertex\b|\bsagemaker\b|\bbedrock\b/i,        weight: 6 },
];

export interface StickyService {
  componentId: string;
  name: string;
  technology: string;
  weight: number;
}

/**
 * Top N stickiest managed services in this arch — what makes leaving
 * expensive. Ranked by hardcoded vendor weight.
 */
export function topStickyServices(
  arch: Architecture | null,
  limit = 3,
): StickyService[] {
  if (!arch) return [];
  const out: StickyService[] = [];
  for (const c of arch.components ?? []) {
    const tech = `${c.technology ?? ""} ${c.name ?? ""}`;
    let best = 0;
    for (const r of STICKY_VENDOR_RULES) {
      if (r.rx.test(tech) && r.weight > best) best = r.weight;
    }
    if (best > 0) {
      out.push({
        componentId: c.id,
        name: c.name,
        technology: c.technology,
        weight: best,
      });
    }
  }
  out.sort((a, b) => b.weight - a.weight);
  return out.slice(0, limit);
}

/**
 * Estimated migration time in months if you had to leave this stack —
 * sum of the sticky services' weights mapped to a month value. Coarse.
 */
export function replacementMonths(arch: Architecture | null): number {
  const sticky = topStickyServices(arch, 999);
  if (!sticky.length) return 1;
  const weightSum = sticky.reduce((s, x) => s + x.weight, 0);
  // 6 weight ≈ 1 month, capped at 18.
  return Math.max(1, Math.min(18, Math.round(weightSum / 6)));
}
