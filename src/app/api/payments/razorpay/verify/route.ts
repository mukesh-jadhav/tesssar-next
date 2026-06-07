import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/firebase/auth";
import { verifyPaymentSignature } from "@/lib/razorpay/client";
import {
  applyPaidTransaction,
  TransactionForbiddenError,
  TransactionMissingError,
} from "@/lib/credits/ledger";
import { sendReceiptEmail } from "@/lib/email/resend";
import { getPack } from "@/lib/razorpay/packs";
import { clientIp, rateLimit, rateLimitResponse } from "@/lib/security/rateLimit";
import { requestLogger } from "@/lib/security/log";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const log = requestLogger(req, "pay-verify");
  const ipGuard = rateLimit({
    key: `pay-verify:ip:${clientIp(req)}`,
    limit: 20,
    windowMs: 60_000,
  });
  if (!ipGuard.ok) return rateLimitResponse(ipGuard);

  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = (await req.json()) as {
      razorpay_order_id?: string;
      razorpay_payment_id?: string;
      razorpay_signature?: string;
      txId?: string;
    };

    if (!body.razorpay_order_id || !body.razorpay_payment_id || !body.razorpay_signature || !body.txId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const ok = verifyPaymentSignature({
      orderId: body.razorpay_order_id,
      paymentId: body.razorpay_payment_id,
      signature: body.razorpay_signature,
    });
    if (!ok) return NextResponse.json({ error: "Invalid signature" }, { status: 400 });

    const result = await applyPaidTransaction({
      txId: body.txId,
      expectedUid: user.uid,
      razorpayPaymentId: body.razorpay_payment_id,
      // razorpaySignature is intentionally not persisted: it's verified
      // above via HMAC and has no audit value at rest (Firestore data
      // exposure would reveal whether the secret has rotated).
      reason: "credit pack purchase",
    });

    if (result.alreadyApplied) {
      return NextResponse.json({ ok: true, alreadyPaid: true, balance: result.balance });
    }

    // Send the receipt outside the transaction. Only the writer that
    // actually flipped the status (alreadyApplied === false) gets here, so
    // the receipt is sent exactly once per purchase.
    const txDoc = result.tx;
    const purchasedPack = getPack(txDoc.packId);
    if (txDoc.email && purchasedPack) {
      sendReceiptEmail({
        to: txDoc.email,
        displayName: user.displayName,
        packName: purchasedPack.name,
        credits: purchasedPack.credits,
        amountPaise: txDoc.amountPaise,
        paymentId: body.razorpay_payment_id,
      }).catch((e) => log.error("receipt email failed", { err: (e as Error).message }));
    }

    return NextResponse.json({ ok: true, balance: result.balance });
  } catch (err) {
    if (err instanceof TransactionMissingError) {
      return NextResponse.json({ error: "Transaction missing" }, { status: 404 });
    }
    if (err instanceof TransactionForbiddenError) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    log.error("verify failed", { err: (err as Error).message });
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
