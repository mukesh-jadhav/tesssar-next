import "server-only";

import { adminDb } from "@/lib/firebase/admin";
import { refundCredit } from "@/lib/credits/ledger";
import type { ArchitectureDoc } from "@/types/architecture";

// Longest legitimate gap between progress writes during a healthy run is
// ~60-90s (Gemini occasionally pauses mid-stream on long outputs, and the
// JSON-repair path makes a second non-streaming call). 4 minutes is safely
// past that while still surfacing a stuck run quickly.
export const STUCK_RUN_THRESHOLD_MS = 4 * 60_000;

/**
 * If `d` is a run whose worker has clearly died (Cloud Run revision rotation,
 * instance crash, Vertex stream hang), flip the doc to `failed` and refund
 * the user. Returns the updated doc, or the original if no action was taken.
 *
 * Safe to call from any read path — guarded by a transaction so concurrent
 * pollers can't double-refund, and idempotent because it only acts on
 * `status === "running"` docs.
 */
export async function reapIfStuck(d: ArchitectureDoc): Promise<ArchitectureDoc> {
  if (d.status !== "running") return d;
  const lastUpdate = d.progress?.updatedAt ?? d.createdAt;
  if (Date.now() - lastUpdate < STUCK_RUN_THRESHOLD_MS) return d;

  const ref = adminDb.collection("architectures").doc(d.id);
  const flipped = await adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) return null;
    const fresh = snap.data() as ArchitectureDoc;
    if (fresh.status !== "running") return fresh;
    const freshLast = fresh.progress?.updatedAt ?? fresh.createdAt;
    if (Date.now() - freshLast < STUCK_RUN_THRESHOLD_MS) return fresh;
    const errorMessage =
      "Worker stopped responding — please retry. Your credit has been refunded.";
    tx.update(ref, { status: "failed", errorMessage });
    return { ...fresh, status: "failed" as const, errorMessage };
  });

  if (!flipped) return d;
  if (flipped.status === "failed" && flipped.errorMessage?.startsWith("Worker stopped")) {
    try {
      await refundCredit(d.uid, "Refund on stuck run watchdog", d.id);
    } catch {
      // Refund is best-effort; the doc is already flipped so the user can retry.
    }
  }
  return flipped;
}
