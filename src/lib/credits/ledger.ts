import "server-only";

import { adminDb } from "@/lib/firebase/admin";
import { isAdminEmail } from "@/lib/firebase/admins";
import type { LedgerEntry, TransactionDoc, UserDoc } from "@/types/architecture";
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
  const ledgerCol = adminDb.collection("ledger");
  return adminDb.runTransaction(async (tx) => {
    // Idempotency guard: if a `purchase` ledger entry already exists for
    // this transaction, the grant has been applied — return the recorded
    // balance instead of double-crediting. Without this, /verify and the
    // Razorpay webhook can both apply the same purchase if they race.
    const existing = await tx.get(
      ledgerCol
        .where("refId", "==", args.transactionId)
        .where("type", "==", "purchase")
        .limit(1),
    );
    if (!existing.empty) {
      const prior = existing.docs[0].data() as LedgerEntry;
      return prior.balanceAfter;
    }
    const snap = await tx.get(userRef);
    if (!snap.exists) throw new Error("User not found");
    const user = snap.data() as UserDoc;
    const newBalance = user.credits + args.credits;
    tx.update(userRef, {
      credits: newBalance,
      totalSpent: (user.totalSpent ?? 0) + args.amountPaise,
    });
    const ledgerRef = ledgerCol.doc();
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

/**
 * Atomic settle for a paid Razorpay transaction. Flips `transactions/{txId}`
 * to `paid` and grants credits in a single Firestore transaction, deduping
 * by `refId` so concurrent calls from /verify and the webhook can never
 * double-credit. Returns `{ alreadyApplied: true }` if the grant has
 * already been recorded.
 *
 * Pass `expectedUid` from the authenticated session (for /verify) to enforce
 * ownership. The webhook should pass `null` to skip the check — it trusts
 * the Razorpay HMAC and the embedded `txId` note instead.
 */
export async function applyPaidTransaction(args: {
  txId: string;
  expectedUid: string | null;
  razorpayPaymentId: string;
  razorpaySignature?: string;
  reason: string;
}): Promise<
  | { alreadyApplied: true; balance: number; tx: TransactionDoc }
  | { alreadyApplied: false; balance: number; tx: TransactionDoc }
> {
  const txRef = adminDb.collection("transactions").doc(args.txId);
  const ledgerCol = adminDb.collection("ledger");
  return adminDb.runTransaction(async (t) => {
    const txSnap = await t.get(txRef);
    if (!txSnap.exists) throw new TransactionMissingError();
    const txDoc = txSnap.data() as TransactionDoc;
    if (args.expectedUid !== null && txDoc.uid !== args.expectedUid) {
      throw new TransactionForbiddenError();
    }

    // Idempotency: a prior purchase entry means we've already credited.
    const existing = await t.get(
      ledgerCol
        .where("refId", "==", args.txId)
        .where("type", "==", "purchase")
        .limit(1),
    );
    if (!existing.empty) {
      const prior = existing.docs[0].data() as LedgerEntry;
      return { alreadyApplied: true as const, balance: prior.balanceAfter, tx: txDoc };
    }

    const userRef = adminDb.collection("users").doc(txDoc.uid);
    const userSnap = await t.get(userRef);
    if (!userSnap.exists) throw new Error("User not found");
    const user = userSnap.data() as UserDoc;
    const newBalance = user.credits + txDoc.credits;

    const update: Partial<TransactionDoc> = {
      status: "paid",
      paidAt: Date.now(),
      razorpayPaymentId: args.razorpayPaymentId,
    };
    if (args.razorpaySignature) update.razorpaySignature = args.razorpaySignature;
    t.update(txRef, update);

    t.update(userRef, {
      credits: newBalance,
      totalSpent: (user.totalSpent ?? 0) + txDoc.amountPaise,
    });

    const ledgerRef = ledgerCol.doc();
    t.set(ledgerRef, {
      uid: txDoc.uid,
      type: "purchase",
      delta: txDoc.credits,
      balanceAfter: newBalance,
      reason: args.reason,
      refId: args.txId,
      createdAt: Date.now(),
    } satisfies Omit<LedgerEntry, "id">);

    return {
      alreadyApplied: false as const,
      balance: newBalance,
      tx: { ...txDoc, ...update },
    };
  });
}

export class TransactionMissingError extends Error {
  constructor() {
    super("Transaction missing");
    this.name = "TransactionMissingError";
  }
}

export class TransactionForbiddenError extends Error {
  constructor() {
    super("Transaction does not belong to caller");
    this.name = "TransactionForbiddenError";
  }
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
