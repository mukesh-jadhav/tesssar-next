/**
 * Cross-variant component equivalence.
 *
 * When the user hovers a component in one column, the cockpit highlights
 * the *equivalent* component(s) in the other columns. Equivalence is a
 * pure derivation from the arch payload — same in/out shape per call,
 * cacheable per (study, variant-list).
 *
 * Algorithm: a component A in variant X matches a component B in
 * variant Y when:
 *   1. They share `category` exactly (frontend, api, database, queue, ...)
 *   2. Their normalised responsibility overlaps above a threshold
 *      (Jaccard on stop-word-filtered tokens)
 *   3. Their vendor family matches when the category is "database" /
 *      "queue" — e.g. SQL ≈ SQL, NoSQL ≈ NoSQL, stream ≈ stream.
 *
 * No I/O, no randomness, no exceptions on missing fields.
 *
 * See docs/STUDY_PLAN.md §12.
 */

import type { Architecture, ArchComponent } from "@/types/architecture";

// ---------- Vendor family ----------

type VendorFamily =
  | "sql"
  | "nosql-doc"
  | "nosql-kv"
  | "wide-column"
  | "search"
  | "warehouse"
  | "graph"
  | "vector"
  | "object-store"
  | "block-store"
  | "stream"
  | "queue"
  | "cache"
  | "serverless-fn"
  | "container-runtime"
  | "kubernetes"
  | "vm"
  | "static-host"
  | "cdn-edge"
  | "ml-platform"
  | "auth"
  | "observability"
  | "unknown";

const VENDOR_FAMILY_RULES: Array<{ rx: RegExp; family: VendorFamily }> = [
  // Stream / queue (more specific first)
  { rx: /\bkafka\b|\bkinesis\b|\bevent ?hub\b|\bpub\/?sub\b/i,      family: "stream" },
  { rx: /\bsqs\b|\bservice ?bus\b|\bcloud tasks?\b|\brabbit ?mq\b|\bcelery\b/i, family: "queue" },
  // Cache
  { rx: /\bredis\b|\bmemorystore\b|\belasticache\b|\bmemcache\b/i,   family: "cache" },
  // Object / block
  { rx: /\bs3\b|\bgcs\b|\bcloud storage\b|\bblob storage\b|\bobject storage\b/i, family: "object-store" },
  { rx: /\bebs\b|\bpersistent disk\b|\bmanaged disk\b/i,             family: "block-store" },
  // Databases
  { rx: /\bbigquery\b|\bredshift\b|\bsnowflake\b|\bsynapse\b/i,      family: "warehouse" },
  { rx: /\bvector\b|\bpinecone\b|\bweaviate\b|\bmilvus\b|\bpgvector\b|\bvertex ai vector\b/i, family: "vector" },
  { rx: /\bopensearch\b|\belasticsearch\b|\bmeilisearch\b|\btypesense\b/i, family: "search" },
  { rx: /\bneo4j\b|\bjanusgraph\b|\bdgraph\b/i,                      family: "graph" },
  { rx: /\bdynamodb\b|\bbigtable\b|\bcassandra\b|\bscylla\b/i,       family: "wide-column" },
  { rx: /\bfirestore\b|\bdatastore\b|\bmongo\b|\bcosmos\b/i,         family: "nosql-doc" },
  { rx: /\bredis cluster\b|\briak\b/i,                               family: "nosql-kv" },
  { rx: /\bspanner\b|\baurora\b|\bcockroach\b|\byugabyte\b|\bcloudsql\b|\bcloud sql\b|\brds\b|\bpostgres\b|\bmysql\b|\bmariadb\b|\boracle\b|\bsql server\b/i, family: "sql" },
  // Compute runtimes
  { rx: /\blambda\b|\bcloud function\b|\bazure functions\b/i,        family: "serverless-fn" },
  { rx: /\bcloud run\b|\bapp runner\b|\bcontainer apps\b|\bfargate\b/i, family: "container-runtime" },
  { rx: /\bkubernetes\b|\bgke\b|\beks\b|\baks\b|\bopenshift\b/i,     family: "kubernetes" },
  { rx: /\bcompute engine\b|\bec2\b|\bvm\b|\bvirtual machine\b/i,    family: "vm" },
  // Edge
  { rx: /\bcdn\b|\bcloudfront\b|\bfront door\b|\bakamai\b|\bfastly\b|\bcloud cdn\b/i, family: "cdn-edge" },
  { rx: /\bvercel\b|\bnetlify\b|\bs3 static\b|\bcloud storage static\b/i, family: "static-host" },
  // ML
  { rx: /\bvertex\b|\bsagemaker\b|\bbedrock\b|\bopenai\b|\banthropic\b|\bgemini\b|\bllm\b/i, family: "ml-platform" },
  // Auth
  { rx: /\bidentity platform\b|\bfirebase auth\b|\bcognito\b|\bentra\b|\bauth0\b|\bokta\b|\bkeycloak\b/i, family: "auth" },
  // Obs
  { rx: /\bcloud monitor\b|\bcloud trace\b|\bcloud log\b|\bcloudwatch\b|\bdatadog\b|\bgrafana\b|\bprometheus\b|\bnew relic\b|\bhoneycomb\b|\botel\b|\bopentelemetry\b/i, family: "observability" },
];

export function vendorFamily(c: ArchComponent | null | undefined): VendorFamily {
  if (!c) return "unknown";
  const hay = `${c.technology ?? ""} ${c.name ?? ""}`;
  for (const r of VENDOR_FAMILY_RULES) {
    if (r.rx.test(hay)) return r.family;
  }
  return "unknown";
}

// ---------- Token overlap ----------

const STOP_WORDS = new Set([
  "the", "a", "an", "and", "or", "of", "for", "to", "with", "in", "on",
  "at", "by", "is", "are", "as", "be", "from", "into", "this", "that",
  "it", "its", "their", "they", "we", "user", "users", "system", "service",
  "data", "use", "used", "uses", "via", "through", "per", "each", "any",
  "all", "based", "manages", "handles", "responsible", "store", "stores",
]);

function tokenise(s: string): Set<string> {
  if (!s) return new Set();
  const out = new Set<string>();
  for (const raw of s.toLowerCase().split(/[^a-z0-9]+/g)) {
    if (!raw) continue;
    if (raw.length < 3) continue;
    if (STOP_WORDS.has(raw)) continue;
    out.add(raw);
  }
  return out;
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0;
  let inter = 0;
  for (const v of a) if (b.has(v)) inter++;
  const union = a.size + b.size - inter;
  if (union <= 0) return 0;
  return inter / union;
}

// ---------- Public API ----------

export interface EquivalenceKey {
  variantId: string;
  componentId: string;
}

export interface EquivalenceMatch {
  /** The component being highlighted in the other variant. */
  key: EquivalenceKey;
  /** Score 0..1 — higher = more confidently equivalent. */
  score: number;
}

export interface EquivalenceIndex {
  /**
   * Find every component in `variants` that's equivalent to (anchor) —
   * the anchor itself is never returned in its own variant. Sorted by
   * score desc.
   */
  lookup: (anchor: EquivalenceKey) => EquivalenceMatch[];
}

export interface IndexedVariant {
  variantId: string;
  arch: Architecture | null;
}

/**
 * Build a one-pass equivalence index across N variants. O(N² × C²) on
 * total components, but C is bounded (<30 in practice) so this is
 * effectively constant for the cockpit.
 */
export function buildEquivalenceIndex(
  variants: readonly IndexedVariant[],
): EquivalenceIndex {
  // Per (variantId, componentId) → array of matches.
  const matches = new Map<string, EquivalenceMatch[]>();

  // Pre-tokenise.
  type Entry = {
    variantId: string;
    component: ArchComponent;
    family: VendorFamily;
    tokens: Set<string>;
  };
  const entries: Entry[] = [];
  for (const v of variants) {
    if (!v.arch) continue;
    for (const c of v.arch.components ?? []) {
      entries.push({
        variantId: v.variantId,
        component: c,
        family: vendorFamily(c),
        tokens: tokenise(`${c.responsibility ?? ""} ${c.name ?? ""}`),
      });
    }
  }

  for (const a of entries) {
    const aKey = keyOf(a.variantId, a.component.id);
    if (!matches.has(aKey)) matches.set(aKey, []);
    const bucket = matches.get(aKey)!;
    for (const b of entries) {
      if (b.variantId === a.variantId) continue;
      const score = matchScore(a, b);
      if (score > 0) {
        bucket.push({
          key: { variantId: b.variantId, componentId: b.component.id },
          score,
        });
      }
    }
    bucket.sort((x, y) => y.score - x.score);
  }

  return {
    lookup(anchor) {
      return matches.get(keyOf(anchor.variantId, anchor.componentId)) ?? [];
    },
  };
}

function keyOf(variantId: string, componentId: string): string {
  return `${variantId}::${componentId}`;
}

function matchScore(
  a: { component: ArchComponent; family: VendorFamily; tokens: Set<string> },
  b: { component: ArchComponent; family: VendorFamily; tokens: Set<string> },
): number {
  // Hard reject across categories — confuses the user otherwise.
  if (a.component.category !== b.component.category) return 0;

  let score = 0;

  // Category match alone is a weak signal.
  score += 0.25;

  // Vendor family match is strong for data/queue/cache/compute slices.
  if (a.family !== "unknown" && a.family === b.family) {
    score += 0.45;
  } else if (areAdjacentFamilies(a.family, b.family)) {
    // e.g. SQL vs warehouse — still related, weak match.
    score += 0.15;
  }

  // Responsibility token overlap fills the rest.
  const overlap = jaccard(a.tokens, b.tokens);
  score += overlap * 0.30;

  // Threshold so we don't show spurious matches.
  if (score < 0.45) return 0;

  return Math.min(1, Number(score.toFixed(3)));
}

function areAdjacentFamilies(a: VendorFamily, b: VendorFamily): boolean {
  const ADJACENT: Array<[VendorFamily, VendorFamily]> = [
    ["sql", "warehouse"],
    ["nosql-doc", "nosql-kv"],
    ["nosql-doc", "wide-column"],
    ["stream", "queue"],
    ["serverless-fn", "container-runtime"],
    ["container-runtime", "kubernetes"],
    ["kubernetes", "vm"],
    ["search", "vector"],
    ["cdn-edge", "static-host"],
  ];
  for (const [x, y] of ADJACENT) {
    if ((a === x && b === y) || (a === y && b === x)) return true;
  }
  return false;
}
