import { z } from "zod";

// ---------- Scale tiers ----------
export const ScaleTier = z.enum(["startup", "growth", "scale", "hyperscale"]);
export type ScaleTier = z.infer<typeof ScaleTier>;

export const SCALE_TIER_META: Record<
  ScaleTier,
  { label: string; users: string; rps: string; description: string }
> = {
  startup: {
    label: "Startup",
    users: "< 10K MAU",
    rps: "< 50 RPS",
    description: "MVP, lean infra, fast iteration, cost-optimized.",
  },
  growth: {
    label: "Growth",
    users: "10K – 500K MAU",
    rps: "50 – 1K RPS",
    description: "Multi-region read replicas, caching, basic autoscaling.",
  },
  scale: {
    label: "Scale",
    users: "500K – 10M MAU",
    rps: "1K – 20K RPS",
    description: "Sharding, CDN, async pipelines, observability mature.",
  },
  hyperscale: {
    label: "Hyperscale",
    users: "10M+ MAU",
    rps: "20K+ RPS",
    description: "Global active-active, cell-based, chaos-tested, FinOps-driven.",
  },
};

// ---------- Diagram ----------
export const Diagram = z.object({
  id: z.string(),
  title: z.string(),
  kind: z.enum([
    "c4-context",
    "c4-container",
    "c4-component",
    "deployment",
    "sequence",
    "data-flow",
    "er",
    "state",
    "flowchart",
  ]),
  description: z.string(),
  mermaid: z.string(),
});
export type Diagram = z.infer<typeof Diagram>;

// ---------- Component ----------
export const ArchComponent = z.object({
  id: z.string(),
  name: z.string(),
  category: z.enum([
    "frontend",
    "api",
    "service",
    "worker",
    "database",
    "cache",
    "queue",
    "storage",
    "cdn",
    "auth",
    "observability",
    "ml",
    "edge",
    "integration",
    "other",
  ]),
  technology: z.string(),
  responsibility: z.string(),
  scaling: z.string(),
  alternatives: z.array(z.string()).default([]),
});
export type ArchComponent = z.infer<typeof ArchComponent>;

// ---------- Data Flow ----------
export const DataFlow = z.object({
  step: z.number(),
  from: z.string(),
  to: z.string(),
  action: z.string(),
  protocol: z.string(),
  payload: z.string(),
  latency_budget_ms: z.number().optional(),
});
export type DataFlow = z.infer<typeof DataFlow>;

// ---------- Tech Stack ----------
export const TechChoice = z.object({
  layer: z.string(),
  choice: z.string(),
  rationale: z.string(),
  alternatives: z.array(z.string()).default([]),
});
export type TechChoice = z.infer<typeof TechChoice>;

// ---------- Scale Profile ----------
export const ScaleProfile = z.object({
  tier: ScaleTier,
  expected_users: z.string(),
  expected_rps: z.string(),
  storage_estimate: z.string(),
  read_write_ratio: z.string(),
  changes_from_baseline: z.array(z.string()),
  monthly_cost_inr_low: z.number(),
  monthly_cost_inr_high: z.number(),
  monthly_cost_usd_low: z.number(),
  monthly_cost_usd_high: z.number(),
});
export type ScaleProfile = z.infer<typeof ScaleProfile>;

// ---------- Cost ----------
export const CostLineItem = z.object({
  service: z.string(),
  tier: ScaleTier,
  unit: z.string(),
  estimated_qty: z.string(),
  monthly_inr_low: z.number(),
  monthly_inr_high: z.number(),
  notes: z.string(),
});
export type CostLineItem = z.infer<typeof CostLineItem>;

// ---------- Risks ----------
export const Risk = z.object({
  id: z.string(),
  title: z.string(),
  category: z.enum([
    "reliability",
    "security",
    "performance",
    "cost",
    "compliance",
    "operability",
    "scalability",
    "data-integrity",
  ]),
  likelihood: z.enum(["low", "medium", "high"]),
  impact: z.enum(["low", "medium", "high", "critical"]),
  mitigation: z.string(),
  cloud_pattern: z.string().optional(),
});
export type Risk = z.infer<typeof Risk>;

// ---------- Security / Compliance ----------
export const SecurityControl = z.object({
  area: z.enum([
    "identity",
    "network",
    "data",
    "secrets",
    "supply-chain",
    "observability",
    "incident-response",
    "compliance",
  ]),
  control: z.string(),
  implementation: z.string(),
  gcp_service: z.string().optional(),
});
export type SecurityControl = z.infer<typeof SecurityControl>;

// ---------- Observability ----------
export const ObservabilityPlan = z.object({
  metrics: z.array(z.string()),
  logs: z.array(z.string()),
  traces: z.array(z.string()),
  slos: z.array(
    z.object({
      name: z.string(),
      target: z.string(),
      window: z.string(),
    }),
  ),
  alerts: z.array(
    z.object({
      name: z.string(),
      condition: z.string(),
      severity: z.enum(["info", "warning", "critical"]),
    }),
  ),
});
export type ObservabilityPlan = z.infer<typeof ObservabilityPlan>;

// ---------- Cloud Patterns ----------
export const AppliedPattern = z.object({
  name: z.string(),
  category: z.string(),
  why: z.string(),
  where: z.string(),
});
export type AppliedPattern = z.infer<typeof AppliedPattern>;

// ---------- Top-level Architecture ----------
export const Architecture = z.object({
  meta: z.object({
    title: z.string(),
    one_liner: z.string(),
    domain: z.string(),
    generated_at: z.string(),
    version: z.literal(1),
  }),
  requirements: z.object({
    functional: z.array(z.string()),
    non_functional: z.array(z.string()),
    assumptions: z.array(z.string()),
    out_of_scope: z.array(z.string()),
  }),
  executive_summary: z.string(),
  components: z.array(ArchComponent),
  tech_stack: z.array(TechChoice),
  data_flows: z.array(DataFlow),
  data_model: z.object({
    entities: z.array(
      z.object({
        name: z.string(),
        fields: z.array(z.object({ name: z.string(), type: z.string(), notes: z.string().optional() })),
        relationships: z.array(z.string()).default([]),
      }),
    ),
    storage_strategy: z.string(),
  }),
  api_surface: z.array(
    z.object({
      method: z.string(),
      path: z.string(),
      purpose: z.string(),
      auth: z.string(),
      rate_limit: z.string().optional(),
    }),
  ),
  diagrams: z.array(Diagram),
  scale_profiles: z.array(ScaleProfile),
  cost_breakdown: z.array(CostLineItem),
  risks: z.array(Risk),
  security: z.array(SecurityControl),
  observability: ObservabilityPlan,
  applied_patterns: z.array(AppliedPattern),
  deployment: z.object({
    primary_region: z.string(),
    additional_regions: z.array(z.string()),
    iac: z.string(),
    ci_cd: z.string(),
    rollout_strategy: z.string(),
    rollback_strategy: z.string(),
  }),
  roadmap: z.array(
    z.object({
      phase: z.string(),
      timeline: z.string(),
      milestones: z.array(z.string()),
    }),
  ),
  open_questions: z.array(z.string()),
});
export type Architecture = z.infer<typeof Architecture>;

// ---------- Firestore documents ----------
export interface UserDoc {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  credits: number;
  freeCreditGranted: boolean;
  totalSpent: number; // in paise
  createdAt: number;
  lastSeenAt: number;
}

export interface ArchitectureDoc {
  id: string;
  uid: string;
  prompt: string;
  status: "pending" | "running" | "complete" | "failed";
  errorMessage?: string;
  architecture?: Architecture;
  createdAt: number;
  completedAt?: number;
  durationMs?: number;
  modelVersion: string;
  /** Latest progress snapshot, written incrementally by the background worker. */
  progress?: {
    phase: string;
    message: string;
    tokens: number;
    updatedAt: number;
  };
  /** Set when the owner pays to publish a read-only public link. */
  publicShare?: {
    slug: string;
    createdAt: number;
  };
  /** When this run is one variant of a comparison study. Cleared on promotion. */
  studyId?: string;
  variantLabel?: string;
  variantId?: string;
  /** Set on the final synthesis run produced from a study's pick-and-mix. */
  synthesizedFrom?: {
    studyId: string;
    picks: Record<string, string>;
  };
}

export interface TransactionDoc {
  id: string;
  uid: string;
  packId: string;
  credits: number;
  amountPaise: number;
  currency: "INR";
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  status: "created" | "paid" | "failed" | "refunded";
  createdAt: number;
  paidAt?: number;
  email?: string;
}

export interface LedgerEntry {
  id: string;
  uid: string;
  type: "grant" | "purchase" | "consume" | "refund" | "adjust";
  delta: number; // credits +/-
  balanceAfter: number;
  reason: string;
  refId?: string; // architectureId or transactionId
  createdAt: number;
}
