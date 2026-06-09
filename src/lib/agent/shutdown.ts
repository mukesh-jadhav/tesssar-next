import "server-only";

import { adminDb } from "@/lib/firebase/admin";
import { refundCredit } from "@/lib/credits/ledger";

/**
 * Cloud Run rotates revisions on every deploy (and on scale-in, OOM, or
 * crash). The old container gets SIGTERM with a ~10s grace window before
 * SIGKILL. Detached worker promises don't survive that — they're killed
 * mid-stream and the architecture doc is left in `running` forever until
 * the watchdog reaper notices ~4 minutes later.
 *
 * This module keeps a registry of in-flight runs in this process. The
 * `installShutdownDrain()` call (idempotent) installs SIGTERM/SIGINT
 * handlers that flip every still-running doc to `failed` + refund the
 * credit before the container exits, so the user sees the failure
 * immediately on next poll and can retry.
 *
 * Study-aware: when a tracked run belongs to a comparison study the drain
 * also surfaces the variant failure on the study doc so the cockpit's
 * fan-in aggregation reflects it without waiting for the watchdog.
 */

type InflightRun = {
  docRef: FirebaseFirestore.DocumentReference;
  uid: string;
  /** Refund amount in credits. Defaults to RUN_COST_CREDITS via caller. */
  refundCredits?: number;
  /** Set when the run is a variant of a comparison study. */
  studyId?: string;
  variantId?: string;
};

const inflight = new Map<string, InflightRun>();
let installed = false;

export function trackRun(id: string, run: InflightRun) {
  inflight.set(id, run);
}

export function untrackRun(id: string) {
  inflight.delete(id);
}

async function flipStudyVariant(
  studyId: string,
  variantId: string,
  errorMessage: string,
) {
  const ref = adminDb.collection("studies").doc(studyId);
  await adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) return;
    const study = snap.data() as { variants: Array<{ variantId: string; status: string; errorMessage?: string }>; status: string };
    let mutated = false;
    const variants = study.variants.map((v) => {
      if (v.variantId !== variantId) return v;
      if (v.status !== "running") return v;
      mutated = true;
      return { ...v, status: "failed" as const, errorMessage };
    });
    if (!mutated) return;
    const anyRunning = variants.some((v) => v.status === "running");
    const anyComplete = variants.some((v) => v.status === "complete");
    const anyFailed = variants.some((v) => v.status === "failed");
    let nextStatus = study.status;
    if (!anyRunning) {
      if (anyComplete && anyFailed) nextStatus = "partial";
      else if (anyFailed) nextStatus = "failed";
      else nextStatus = "complete";
    }
    tx.update(ref, { variants, status: nextStatus });
  });
}

async function drain(reason: string) {
  if (inflight.size === 0) return;
  const snapshot = Array.from(inflight.entries());
  inflight.clear();
  console.warn(
    `[shutdown] draining ${snapshot.length} in-flight run(s): ${reason}`,
  );
  await Promise.allSettled(
    snapshot.map(async ([id, { docRef, uid, refundCredits, studyId, variantId }]) => {
      const errorMessage =
        "The server was rotating during your run — please retry. Your credit has been refunded.";
      try {
        await docRef.update({ status: "failed", errorMessage });
      } catch (err) {
        console.error(`[shutdown] failed to flip ${id}:`, (err as Error).message);
        return;
      }
      try {
        await refundCredit(uid, "Refund on server shutdown", id, refundCredits);
      } catch (err) {
        console.error(
          `[shutdown] failed to refund ${id}:`,
          (err as Error).message,
        );
      }
      if (studyId && variantId) {
        try {
          await flipStudyVariant(studyId, variantId, errorMessage);
        } catch (err) {
          console.error(
            `[shutdown] failed to flip study variant ${studyId}/${variantId}:`,
            (err as Error).message,
          );
        }
      }
    }),
  );
}

export function installShutdownDrain() {
  if (installed) return;
  installed = true;
  const handler = (signal: NodeJS.Signals) => {
    // Best-effort — don't exit the process ourselves, let the runtime do it.
    // We just need the Firestore writes to flush before SIGKILL.
    void drain(signal);
  };
  process.on("SIGTERM", handler);
  process.on("SIGINT", handler);
}
