import "server-only";

import { cookies } from "next/headers";
import { adminAuth, SESSION_COOKIE_NAME } from "./admin";
import type { UserDoc } from "@/types/architecture";
import { adminDb } from "./admin";
import { isAdminEmail } from "./admins";
import { RUN_COST_CREDITS } from "@/lib/razorpay/packs";

export async function getSessionUser(): Promise<{
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
} | null> {
  const cookie = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  if (!cookie) return null;
  try {
    const decoded = await adminAuth.verifySessionCookie(cookie, true);
    return {
      uid: decoded.uid,
      email: decoded.email ?? "",
      displayName: (decoded.name as string) ?? null,
      photoURL: (decoded.picture as string) ?? null,
    };
  } catch {
    return null;
  }
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) throw new Response("Unauthorized", { status: 401 });
  return user;
}

export async function isAdmin(email: string | null | undefined): Promise<boolean> {
  return isAdminEmail(email);
}

export async function getOrCreateUserDoc(args: {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
}): Promise<UserDoc> {
  const ref = adminDb.collection("users").doc(args.uid);
  const snap = await ref.get();
  const now = Date.now();
  const WELCOME_DESIGNS = 1;
  const WELCOME_CREDITS = WELCOME_DESIGNS * RUN_COST_CREDITS;
  const reason = `Welcome — ${WELCOME_DESIGNS} free design to start`;

  // Pending grants are keyed by lowercased email. They're consumed once,
  // additive to whatever welcome credits the user normally receives.
  const pendingExtra = await consumePendingGrants(args.uid, args.email);

  if (!snap.exists) {
    const startingCredits = WELCOME_CREDITS + pendingExtra.delta;
    const newUser: UserDoc = {
      uid: args.uid,
      email: args.email,
      displayName: args.displayName,
      photoURL: args.photoURL,
      credits: startingCredits,
      freeCreditGranted: true,
      totalSpent: 0,
      createdAt: now,
      lastSeenAt: now,
    };
    await ref.set(newUser);

    await adminDb.collection("ledger").add({
      uid: args.uid,
      type: "grant",
      delta: WELCOME_CREDITS,
      balanceAfter: WELCOME_CREDITS,
      reason,
      createdAt: now,
    });
    if (pendingExtra.delta > 0) {
      await adminDb.collection("ledger").add({
        uid: args.uid,
        type: "grant",
        delta: pendingExtra.delta,
        balanceAfter: startingCredits,
        reason: pendingExtra.reason,
        createdAt: now,
      });
    }

    return newUser;
  }

  // Existing user — backfill the welcome grant for accounts that
  // never received one (legacy sign-ups before this flow existed).
  const existing = snap.data() as UserDoc;
  let balance = existing.credits ?? 0;
  const updates: Partial<UserDoc> = { lastSeenAt: now };

  if (!existing.freeCreditGranted) {
    balance += WELCOME_CREDITS;
    updates.credits = balance;
    updates.freeCreditGranted = true;
    await adminDb.collection("ledger").add({
      uid: args.uid,
      type: "grant",
      delta: WELCOME_CREDITS,
      balanceAfter: balance,
      reason,
      createdAt: now,
    });
  }

  if (pendingExtra.delta > 0) {
    balance += pendingExtra.delta;
    updates.credits = balance;
    await adminDb.collection("ledger").add({
      uid: args.uid,
      type: "grant",
      delta: pendingExtra.delta,
      balanceAfter: balance,
      reason: pendingExtra.reason,
      createdAt: now,
    });
  }

  await ref.update(updates);
  return { ...existing, ...updates, credits: balance };
}

/**
 * Look for `pendingGrants/{lowercased-email}` and consume it — used to
 * pre-allocate credits to a user who hasn't signed in yet. Returns the
 * total credits to grant and a human-readable reason to write into the
 * ledger.
 */
async function consumePendingGrants(
  uid: string,
  email: string,
): Promise<{ delta: number; reason: string }> {
  if (!email) return { delta: 0, reason: "" };
  const key = email.trim().toLowerCase();
  const ref = adminDb.collection("pendingGrants").doc(key);
  return adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) return { delta: 0, reason: "" };
    const data = snap.data() as {
      credits?: number;
      designs?: number;
      reason?: string;
    };
    const delta =
      (data.credits ?? 0) +
      (data.designs ?? 0) * RUN_COST_CREDITS;
    if (delta <= 0) {
      tx.delete(ref);
      return { delta: 0, reason: "" };
    }
    const reason =
      data.reason?.trim() ||
      `Pre-allocated grant for ${email}`;
    // Mark as claimed instead of deleting — keeps an audit trail.
    tx.update(ref, {
      claimedByUid: uid,
      claimedAt: Date.now(),
    });
    return { delta, reason };
  });
}
