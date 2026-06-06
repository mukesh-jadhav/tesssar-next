import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/firebase/auth";
import { verifyPaymentSignature } from "@/lib/razorpay/client";
import { adminDb } from "@/lib/firebase/admin";
import { grantCredits } from "@/lib/credits/ledger";
import { sendReceiptEmail } from "@/lib/email/resend";
import { getPack } from "@/lib/razorpay/packs";
import type { TransactionDoc } from "@/types/architecture";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
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

    const txRef = adminDb.collection("transactions").doc(body.txId);
    const txSnap = await txRef.get();
    if (!txSnap.exists) return NextResponse.json({ error: "Transaction missing" }, { status: 404 });
    const tx = txSnap.data() as TransactionDoc;
    if (tx.uid !== user.uid) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // Idempotency
    if (tx.status === "paid") {
      return NextResponse.json({ ok: true, alreadyPaid: true });
    }

    const pack = getPack(tx.packId);
    if (!pack) return NextResponse.json({ error: "Pack unknown" }, { status: 500 });

    await txRef.update({
      status: "paid",
      paidAt: Date.now(),
      razorpayPaymentId: body.razorpay_payment_id,
      razorpaySignature: body.razorpay_signature,
    });

    const newBalance = await grantCredits({
      uid: user.uid,
      credits: tx.credits,
      reason: `${pack.name} pack purchase`,
      transactionId: tx.id,
      amountPaise: tx.amountPaise,
    });

    // Fire-and-forget receipt
    if (tx.email) {
      sendReceiptEmail({
        to: tx.email,
        displayName: user.displayName,
        packName: pack.name,
        credits: pack.credits,
        amountPaise: tx.amountPaise,
        paymentId: body.razorpay_payment_id,
      }).catch((e) => console.error("Receipt email failed", e));
    }

    return NextResponse.json({ ok: true, balance: newBalance });
  } catch (err) {
    console.error("[razorpay/verify]", err);
    return NextResponse.json(
      { error: (err as Error).message || "Verification failed" },
      { status: 500 },
    );
  }
}
