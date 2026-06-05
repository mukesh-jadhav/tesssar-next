import "server-only";

import { adminDb } from "@/lib/firebase/admin";
import type { LedgerEntry, UserDoc } from "@/types/architecture";
import { FieldValue } from "firebase-admin/firestore";

/**
 * Atomically deduct one credit. Returns the new balance.
 * Throws if user has no credits.
 */
export async function consumeCredit(
  uid: string,
  reason: string,
  refId?: string,
): Promise<number> {
  const userRef = adminDb.collection("users").doc(uid);
  const balanceAfter = await adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(userRef);
    if (!snap.exists) throw new Error("User not found");
    const user = snap.data() as UserDoc;
    if (user.credits < 1) throw new InsufficientCreditsError();
    const newBalance = user.credits - 1;
    tx.update(userRef, { credits: newBalance });
    const ledgerRef = adminDb.collection("ledger").doc();
    tx.set(ledgerRef, {
      uid,
      type: "consume",
      delta: -1,
      balanceAfter: newBalance,
      reason,
      refId,
      createdAt: Date.now(),
    } satisfies Omit<LedgerEntry, "id">);
    return newBalance;
  });
  return balanceAfter;
}

/** Refund a previously consumed credit (e.g. on agent failure). */
export async function refundCredit(uid: string, reason: string, refId?: string): Promise<number> {
  const userRef = adminDb.collection("users").doc(uid);
  return adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(userRef);
    if (!snap.exists) throw new Error("User not found");
    const user = snap.data() as UserDoc;
    const newBalance = user.credits + 1;
    tx.update(userRef, { credits: newBalance });
    const ledgerRef = adminDb.collection("ledger").doc();
    tx.set(ledgerRef, {
      uid,
      type: "refund",
      delta: 1,
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
  return (snap.data() as UserDoc).credits ?? 0;
}

// Silence unused import warning for FieldValue (kept for future atomic ops)
void FieldValue;
