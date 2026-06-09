import { z } from "zod";

/**
 * Comparison Studies — types & Firestore document shapes.
 *
 * A study runs N parallel architecture generations along ONE axis
 * (cloud, style, datastore, deployment, or cost-posture) so the
 * architect can compare them side-by-side in the cockpit. See
 * docs/STUDY_PLAN.md for the full spec.
 */

// ---------- Dimensions ----------
export const DimensionId = z.enum([
  "cloud",
  "style",
  "datastore",
  "deployment",
  "cost-posture",
]);
export type DimensionId = z.infer<typeof DimensionId>;

export const VariantStatus = z.enum(["running", "complete", "failed"]);
export type VariantStatus = z.infer<typeof VariantStatus>;

export const StudyStatus = z.enum([
  "running",
  "complete",
  "partial",
  "failed",
]);
export type StudyStatus = z.infer<typeof StudyStatus>;

// ---------- Synthesis picks ----------
// The decision tray slices the architecture along these axes. Each
// slice's value is the variantId the user picked for that slice.
export const PickSliceId = z.enum([
  "components",   // services + compute
  "datastore",    // primary db, cache, blob, search
  "messaging",    // queues, pub/sub
  "deployment",   // K8s/PaaS/serverless + CI/CD
  "security",     // identity, network, secrets
  "observability",// metrics, logs, traces
]);
export type PickSliceId = z.infer<typeof PickSliceId>;

export const Picks = z.record(PickSliceId, z.string());
export type Picks = z.infer<typeof Picks>;

// ---------- Study variant entry (denormalized in studies/{id}) ----------
export const StudyVariant = z.object({
  label: z.string(),         // column header, e.g. "GCP"
  variantId: z.string(),     // catalog id, e.g. "gcp"
  runId: z.string(),         // → architectures/{runId}
  status: VariantStatus,
  errorMessage: z.string().optional(),
});
export type StudyVariant = z.infer<typeof StudyVariant>;

// ---------- Insights (computed at fan-in) ----------
export const StudyInsights = z.object({
  cheapestAtScale: z
    .object({ variantId: z.string(), savingsInr: z.number() })
    .optional(),
  lowestOps: z
    .object({ variantId: z.string(), score: z.number() })
    .optional(),
  fastestToShip: z
    .object({ variantId: z.string(), reason: z.string() })
    .optional(),
  bestResidency: z
    .object({ variantId: z.string(), region: z.string() })
    .optional(),
  lowestLockIn: z
    .object({ variantId: z.string(), score: z.number() })
    .optional(),
  complianceGaps: z
    .array(
      z.object({
        variantId: z.string(),
        regime: z.string(),
        note: z.string(),
      }),
    )
    .default([]),
});
export type StudyInsights = z.infer<typeof StudyInsights>;

// ---------- Firestore document ----------
export interface StudyDoc {
  id: string;
  uid: string;
  /** Brief AFTER composing user preferences (same shape as ArchitectureDoc.prompt). */
  prompt: string;
  dimension: DimensionId;
  variants: StudyVariant[];
  status: StudyStatus;
  creditsCharged: number;       // bundle price actually billed
  createdAt: number;
  completedAt?: number;
  insights?: StudyInsights;
  /** Pick-and-mix picks the user committed in the decision tray. */
  picks?: Picks;
  /** architectures/{finalRunId} once the synthesis run lands. */
  finalRunId?: string;
}
