/**
 * Synthesis brief composer.
 *
 * Pure function. Takes the original study brief, the user's picks, and
 * the underlying variant architectures, and builds a single prompt for
 * the architect agent that pins every slice's required services
 * verbatim — no substitutions allowed.
 *
 * No I/O. No randomness. Deterministic for the same inputs so the brief
 * can be persisted alongside the synthesis run for audit.
 *
 * See docs/STUDY_PLAN.md §10.
 */

import type { Architecture, ArchComponent } from "@/types/architecture";
import type { PickSliceId, Picks } from "@/types/study";

// ---------- Source variant ----------

export interface SynthesisSourceVariant {
  variantId: string;
  label: string;            // user-facing column header, e.g. "AWS"
  arch: Architecture;       // already validated upstream
}

// ---------- Slice → component categories ----------

/**
 * Component categories that count toward each pick slice. A given
 * variant's components are filtered through this map when extracting
 * the "required services" block for the slice.
 */
const SLICE_CATEGORIES: Record<PickSliceId, ArchComponent["category"][]> = {
  components:     ["frontend", "api", "service", "worker", "edge", "cdn", "ml", "integration", "other"],
  datastore:      ["database", "cache", "storage"],
  messaging:      ["queue"],
  deployment:     [], // Deployment slice is driven by `tech_stack` + `deployment` block, not components.
  security:       ["auth"],
  observability:  ["observability"],
};

const SLICE_LABEL: Record<PickSliceId, string> = {
  components:    "Components & compute",
  datastore:     "Datastore",
  messaging:     "Messaging",
  deployment:    "Deployment & CI/CD",
  security:      "Security",
  observability: "Observability",
};

const SLICE_ORDER: PickSliceId[] = [
  "components",
  "datastore",
  "messaging",
  "deployment",
  "security",
  "observability",
];

// ---------- Public composer ----------

export interface SynthesisBriefInput {
  originalPrompt: string;
  picks: Picks;
  variants: SynthesisSourceVariant[];
}

export interface SynthesisBriefResult {
  /** The composed brief string passed to runArchitect(). */
  brief: string;
  /** Per-slice extracted required-services list (for audit / persistence). */
  perSlice: Array<{
    sliceId: PickSliceId;
    sourceVariantId: string;
    sourceLabel: string;
    services: string[];
  }>;
  /** True if more than one source variant supplied at least one pick. */
  crossSource: boolean;
}

export function composeSynthesisBrief(input: SynthesisBriefInput): SynthesisBriefResult {
  const byId = new Map(input.variants.map((v) => [v.variantId, v]));
  const perSlice: SynthesisBriefResult["perSlice"] = [];
  const usedVariantIds = new Set<string>();

  for (const sliceId of SLICE_ORDER) {
    const sourceVariantId = input.picks[sliceId];
    if (!sourceVariantId) continue;
    const source = byId.get(sourceVariantId);
    if (!source) continue; // validated upstream — defensive guard
    const services = extractServicesForSlice(source.arch, sliceId);
    perSlice.push({
      sliceId,
      sourceVariantId,
      sourceLabel: source.label,
      services,
    });
    usedVariantIds.add(sourceVariantId);
  }

  const crossSource = usedVariantIds.size > 1;
  const brief = renderBrief({
    originalPrompt: input.originalPrompt,
    perSlice,
    crossSource,
    variantLabels: Array.from(usedVariantIds).map((id) => byId.get(id)?.label ?? id),
  });

  return { brief, perSlice, crossSource };
}

// ---------- Extraction ----------

function extractServicesForSlice(arch: Architecture, sliceId: PickSliceId): string[] {
  switch (sliceId) {
    case "components":
    case "datastore":
    case "messaging": {
      const cats = SLICE_CATEGORIES[sliceId];
      const cs = (arch.components ?? []).filter((c) => cats.includes(c.category));
      return uniqueServiceLines(cs.map(componentLine));
    }
    case "security": {
      const compLines = (arch.components ?? [])
        .filter((c) => c.category === "auth")
        .map(componentLine);
      const ctrlLines = (arch.security ?? []).map((s) => {
        const svc = (s.gcp_service ?? "").trim();
        const impl = (s.implementation ?? "").trim();
        const detail = svc ? svc : impl;
        return `- ${s.area}: ${s.control}${detail ? ` (${detail})` : ""}`;
      });
      return uniqueServiceLines([...compLines, ...ctrlLines]);
    }
    case "observability": {
      const compList = (arch.components ?? [])
        .filter((c) => c.category === "observability")
        .map(componentLine);
      // Observability is also captured in the `observability` block as
      // metrics/logs/traces hints — surface tool names if mentioned.
      const obsTools = uniqueStrings(
        [
          ...(arch.observability?.metrics ?? []),
          ...(arch.observability?.logs ?? []),
          ...(arch.observability?.traces ?? []),
        ]
          .flatMap(extractToolMentions)
          .map((t) => t.trim()),
      );
      return uniqueServiceLines([...compList, ...obsTools.map((t) => `- ${t}`)]);
    }
    case "deployment": {
      const lines: string[] = [];
      const dep = arch.deployment;
      if (dep) {
        if (dep.primary_region) lines.push(`- Primary region: ${dep.primary_region}`);
        if (dep.additional_regions?.length)
          lines.push(`- Additional regions: ${dep.additional_regions.join(", ")}`);
        if (dep.iac) lines.push(`- IaC: ${dep.iac}`);
        if (dep.ci_cd) lines.push(`- CI/CD: ${dep.ci_cd}`);
        if (dep.rollout_strategy)
          lines.push(`- Rollout: ${dep.rollout_strategy}`);
        if (dep.rollback_strategy)
          lines.push(`- Rollback: ${dep.rollback_strategy}`);
      }
      // Pull any tech_stack entries whose layer references deployment/runtime.
      for (const t of arch.tech_stack ?? []) {
        const layer = (t.layer ?? "").toLowerCase();
        if (
          layer.includes("deploy") ||
          layer.includes("runtime") ||
          layer.includes("ci") ||
          layer.includes("cd") ||
          layer.includes("infra")
        ) {
          lines.push(`- ${t.layer}: ${t.choice}`);
        }
      }
      return uniqueServiceLines(lines);
    }
  }
}

function componentLine(c: ArchComponent): string {
  // Use the component name + tech so the agent has both the human name
  // and the concrete service to wire in.
  const tech = (c.technology ?? "").trim();
  if (!tech) return `- ${c.name}`;
  return `- ${c.name} (${tech})`;
}

/**
 * Extract tool-like names from a free-text observability hint (e.g.
 * "p95 latency via Cloud Monitoring" → ["Cloud Monitoring"]).
 *
 * Heuristic: take any sequence of capitalised words and known
 * lower-case tool names.
 */
function extractToolMentions(s: string): string[] {
  if (!s) return [];
  const out: string[] = [];
  // Capitalised proper-noun runs.
  const propRx = /([A-Z][\w./-]+(?:\s+[A-Z][\w./-]+){0,3})/g;
  let m: RegExpExecArray | null;
  while ((m = propRx.exec(s))) {
    out.push(m[1]);
  }
  // Lower-case tools we care about.
  const KNOWN = [
    "prometheus", "grafana", "loki", "tempo", "opentelemetry", "otel",
    "jaeger", "datadog", "sentry", "splunk", "honeycomb",
  ];
  const lower = s.toLowerCase();
  for (const k of KNOWN) if (lower.includes(k)) out.push(k);
  return out;
}

function uniqueStrings(arr: string[]): string[] {
  return Array.from(new Set(arr.filter((s) => s && s.trim().length > 0)));
}

function uniqueServiceLines(lines: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const l of lines) {
    const norm = l.trim();
    if (!norm) continue;
    const key = norm.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(norm);
  }
  return out;
}

// ---------- Brief renderer ----------

function renderBrief(args: {
  originalPrompt: string;
  perSlice: SynthesisBriefResult["perSlice"];
  crossSource: boolean;
  variantLabels: string[];
}): string {
  const head = [
    "You are synthesizing a FINAL architecture from a comparison study. The",
    "user has chosen a specific variant for each architectural slice. You MUST",
    "honor every pick verbatim — do not substitute, do not propose alternatives,",
    "do not add competing options. The chosen services are HARD requirements.",
  ].join("\n");

  const original = `Original brief:\n${args.originalPrompt.trim()}`;

  const pickedBlocks = args.perSlice.map((slice) => {
    const services =
      slice.services.length > 0
        ? slice.services.join("\n  ")
        : "- (no concrete services declared in source variant — preserve its approach)";
    return [
      `- ${SLICE_LABEL[slice.sliceId]}  → from ${slice.sourceLabel} variant`,
      `  Required services:`,
      `  ${services}`,
    ].join("\n");
  }).join("\n");

  const picksBlock = `Picks (HARD requirements):\n${pickedBlocks}`;

  const crossNotes = args.crossSource
    ? [
        "",
        "Cross-source notes:",
        `- This is an explicitly composed design pulling from: ${args.variantLabels.join(", ")}.`,
        "- Call out the cost, latency, and operational implications of the",
        "  cross-source seams (identity federation, observability fan-in, cross-",
        "  cloud egress, IAM mapping).",
        "- Use the cloud patterns canon (Ambassador, BFF, Anti-Corruption Layer,",
        "  Federated Identity, Gateway Aggregation) appropriate to the composition.",
        "- Treat the seams as first-class risks in the `risks` array.",
      ].join("\n")
    : "";

  const tail = [
    "",
    "Hard constraints reminder:",
    "- Do not invent alternative services for any picked slice.",
    "- Keep the picked services' names exact in `components[].technology` so the",
    "  cockpit's lock-in / cost / equivalence engines reconcile against the source",
    "  variants.",
    "- Populate `synthesizedFrom` only via the agent caller; you focus on the",
    "  Architecture JSON.",
  ].join("\n");

  return [head, "", original, "", picksBlock, crossNotes, tail].join("\n");
}
