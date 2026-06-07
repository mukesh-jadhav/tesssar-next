import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/razorpay/client";
import { applyPaidTransaction, TransactionMissingError } from "@/lib/credits/ledger";
import { getPack } from "@/lib/razorpay/packs";
import { sendReceiptEmail } from "@/lib/email/resend";
import { requestLogger } from "@/lib/security/log";

export const runtime = "nodejs";

/**
 * Razorpay webhook handler — defensive double-credit guard in case the
 * client-side verify route never fires (user closes tab on success page).
 * Idempotency is enforced by `applyPaidTransaction` (refId-keyed ledger
 * lookup inside a Firestore transaction), so the verify route and this
 * webhook can race without ever double-crediting the user.
 */
export async function POST(req: NextRequest) {
  const log = requestLogger(req, "pay-webhook");
  const raw = await req.text();
  const signature = req.headers.get("x-razorpay-signature") ?? "";
  if (!verifyWebhookSignature(raw, signature)) {
    log.warn("invalid webhook signature");
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

  try {
    const result = await applyPaidTransaction({
      txId,
      expectedUid: null, // webhook has no session; HMAC + txId-in-notes is the trust boundary
      razorpayPaymentId: entity.id,
      reason: "credit pack purchase (webhook)",
    });

    if (result.alreadyApplied) {
      return NextResponse.json({ ok: true, idempotent: true });
    }

    const txDoc = result.tx;
    const pack = getPack(txDoc.packId);
    if (txDoc.email && pack) {
      sendReceiptEmail({
        to: txDoc.email,
        displayName: null,
        packName: pack.name,
        credits: pack.credits,
        amountPaise: txDoc.amountPaise,
        paymentId: entity.id,
      }).catch((e) => log.error("receipt email failed", { err: (e as Error).message }));
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof TransactionMissingError) {
      // Razorpay retries on non-2xx; we genuinely have no record, so ack to stop retries.
      return NextResponse.json({ ok: true, reason: "tx missing" });
    }
    log.error("settle failed", { err: (err as Error).message });
    return new NextResponse("Settle failed", { status: 500 });
  }
}
