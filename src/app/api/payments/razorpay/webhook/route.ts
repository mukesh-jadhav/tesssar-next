import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/razorpay/client";
import { adminDb } from "@/lib/firebase/admin";
import { grantCredits } from "@/lib/credits/ledger";
import { getPack } from "@/lib/razorpay/packs";
import { sendReceiptEmail } from "@/lib/email/resend";
import type { TransactionDoc } from "@/types/architecture";

export const runtime = "nodejs";

/**
 * Razorpay webhook handler — defensive double-credit guard in case the
 * client-side verify route never fires (user closes tab on success page).
 */
export async function POST(req: NextRequest) {
  const raw = await req.text();
  const signature = req.headers.get("x-razorpay-signature") ?? "";
  if (!verifyWebhookSignature(raw, signature)) {
    return new NextResponse("Invalid signature", { status: 400 });
  }

  const payload = JSON.parse(raw) as {
    event: string;
    payload: { payment?: { entity?: { id: string; order_id: string; notes?: Record<string, string> } } };
  };

  if (payload.event !== "payment.captured") {
    return NextResponse.json({ ok: true, ignored: payload.event });
  }

  const entity = payload.payload.payment?.entity;
  if (!entity) return NextResponse.json({ ok: true });
  const notes = entity.notes ?? {};
  const txId = notes.txId;
  if (!txId) return NextResponse.json({ ok: true, reason: "no txId in notes" });

  const txRef = adminDb.collection("transactions").doc(txId);
  const snap = await txRef.get();
  if (!snap.exists) return NextResponse.json({ ok: true, reason: "tx missing" });
  const tx = snap.data() as TransactionDoc;
  if (tx.status === "paid") return NextResponse.json({ ok: true, idempotent: true });

  const pack = getPack(tx.packId);
  if (!pack) return new NextResponse("Pack missing", { status: 500 });

  await txRef.update({
    status: "paid",
    paidAt: Date.now(),
    razorpayPaymentId: entity.id,
  });

  await grantCredits({
    uid: tx.uid,
    credits: tx.credits,
    reason: `${pack.name} pack purchase (webhook)`,
    transactionId: tx.id,
    amountPaise: tx.amountPaise,
  });

  if (tx.email) {
    sendReceiptEmail({
      to: tx.email,
      displayName: null,
      packName: pack.name,
      credits: pack.credits,
      amountPaise: tx.amountPaise,
      paymentId: entity.id,
    }).catch((e) => console.error("Receipt email (webhook) failed", e));
  }

  return NextResponse.json({ ok: true });
}
