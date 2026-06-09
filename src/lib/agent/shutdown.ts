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
 */

type InflightRun = { docRef: FirebaseFirestore.DocumentReference; uid: string };

const inflight = new Map<string, InflightRun>();
let installed = false;

export function trackRun(id: string, run: InflightRun) {
  inflight.set(id, run);
}

export function untrackRun(id: string) {
  inflight.delete(id);
}

async function drain(reason: string) {
  if (inflight.size === 0) return;
  const snapshot = Array.from(inflight.entries());
  inflight.clear();
  console.warn(
    `[shutdown] draining ${snapshot.length} in-flight run(s): ${reason}`,
  );
  await Promise.allSettled(
    snapshot.map(async ([id, { docRef, uid }]) => {
      const errorMessage =
        "The server was rotating during your run — please retry. Your credit has been refunded.";
      try {
        await docRef.update({ status: "failed", errorMessage });
      } catch (err) {
        console.error(`[shutdown] failed to flip ${id}:`, (err as Error).message);
        return;
      }
      try {
        await refundCredit(uid, "Refund on server shutdown", id);
      } catch (err) {
        console.error(
          `[shutdown] failed to refund ${id}:`,
          (err as Error).message,
        );
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
