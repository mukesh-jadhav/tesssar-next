import "server-only";

import { adminDb } from "@/lib/firebase/admin";
import { isAdminEmail } from "@/lib/firebase/admins";
import type { LedgerEntry, UserDoc } from "@/types/architecture";
import { RUN_COST_CREDITS } from "@/lib/razorpay/packs";
import { UNLIMITED_CREDITS } from "@/lib/credits/display";
import { FieldValue } from "firebase-admin/firestore";

/**
 * Atomically deduct credits for one architecture run. Returns the
 * new balance. Throws `InsufficientCreditsError` if the user can't
 * cover the cost.
 *
 * Admins are billed nothing and don't write to the ledger; their
 * balance is reported as `Number.POSITIVE_INFINITY` to the UI.
 */
export async function consumeCredit(
  uid: string,
  reason: string,
  refId?: string,
  amount: number = RUN_COST_CREDITS,
): Promise<number> {
  const userRef = adminDb.collection("users").doc(uid);
  const balanceAfter = await adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(userRef);
    if (!snap.exists) throw new Error("User not found");
    const user = snap.data() as UserDoc;
    if (isAdminEmail(user.email)) return UNLIMITED_CREDITS;
    if (user.credits < amount) throw new InsufficientCreditsError();
    const newBalance = user.credits - amount;
    tx.update(userRef, { credits: newBalance });
    const ledgerRef = adminDb.collection("ledger").doc();
    tx.set(ledgerRef, {
      uid,
      type: "consume",
      delta: -amount,
      balanceAfter: newBalance,
      reason,
      refId,
      createdAt: Date.now(),
    } satisfies Omit<LedgerEntry, "id">);
    return newBalance;
  });
  return balanceAfter;
}

/** Refund a previously consumed run (e.g. on agent failure). */
export async function refundCredit(
  uid: string,
  reason: string,
  refId?: string,
  amount: number = RUN_COST_CREDITS,
): Promise<number> {
  const userRef = adminDb.collection("users").doc(uid);
  return adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(userRef);
    if (!snap.exists) throw new Error("User not found");
    const user = snap.data() as UserDoc;
    if (isAdminEmail(user.email)) return UNLIMITED_CREDITS;
    const newBalance = user.credits + amount;
    tx.update(userRef, { credits: newBalance });
    const ledgerRef = adminDb.collection("ledger").doc();
    tx.set(ledgerRef, {
      uid,
      type: "refund",
      delta: amount,
      balanceAfter: newBalance,
      reason,
      refId,
      createdAt: Date.now(),
    } satisfies Omit<LedgerEntry, "id">);
    return newBalance;
  });
}

/** Grant credits after a successful Razorpay payment. */
export async function grantCredits(args: {
  uid: string;
  credits: number;
  reason: string;
  transactionId: string;
  amountPaise: number;
}): Promise<number> {
  const userRef = adminDb.collection("users").doc(args.uid);
  return adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(userRef);
    if (!snap.exists) throw new Error("User not found");
    const user = snap.data() as UserDoc;
    const newBalance = user.credits + args.credits;
    tx.update(userRef, {
      credits: newBalance,
      totalSpent: (user.totalSpent ?? 0) + args.amountPaise,
    });
    const ledgerRef = adminDb.collection("ledger").doc();
    tx.set(ledgerRef, {
      uid: args.uid,
      type: "purchase",
      delta: args.credits,
      balanceAfter: newBalance,
      reason: args.reason,
      refId: args.transactionId,
      createdAt: Date.now(),
    } satisfies Omit<LedgerEntry, "id">);
    return newBalance;
  });
}

export class InsufficientCreditsError extends Error {
  constructor() {
    super("Insufficient credits");
    this.name = "InsufficientCreditsError";
  }
}

export async function getBalance(uid: string): Promise<number> {
  const snap = await adminDb.collection("users").doc(uid).get();
  if (!snap.exists) return 0;
  const user = snap.data() as UserDoc;
  if (isAdminEmail(user.email)) return UNLIMITED_CREDITS;
  return user.credits ?? 0;
}

// Silence unused import warning for FieldValue (kept for future atomic ops)
void FieldValue;
