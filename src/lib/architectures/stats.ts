import "server-only";

import { adminDb } from "@/lib/firebase/admin";

/**
 * Total architecture documents owned by this user. Cheap thanks to
 * Firestore's count() aggregation — no read costs scale with doc
 * count.
 *
 * Used to decide whether to keep promoting the Sample report: once
 * the user has at least one run of their own, sample CTAs are
 * suppressed so the workspace focuses on their actual work.
 */
export async function getUserRunCount(uid: string): Promise<number> {
  const snap = await adminDb
    .collection("architectures")
    .where("uid", "==", uid)
    .count()
    .get();
  return snap.data().count;
}
