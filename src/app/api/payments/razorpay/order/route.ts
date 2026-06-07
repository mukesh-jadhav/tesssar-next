import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/firebase/auth";
import { getRazorpay } from "@/lib/razorpay/client";
import { getPack } from "@/lib/razorpay/packs";
import { adminDb } from "@/lib/firebase/admin";
import type { TransactionDoc } from "@/types/architecture";
import { clientIp, rateLimit, rateLimitResponse } from "@/lib/security/rateLimit";
import { requestLogger } from "@/lib/security/log";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const log = requestLogger(req, "pay-order");
  // IP-scoped first so unauthenticated floods can't hammer Razorpay's API.
  const ipGuard = rateLimit({
    key: `pay-order:ip:${clientIp(req)}`,
    limit: 30,
    windowMs: 60_000,
  });
  if (!ipGuard.ok) return rateLimitResponse(ipGuard);

  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Per-user cap deters card-testing once a session is established.
    const userGuard = rateLimit({
      key: `pay-order:uid:${user.uid}`,
      limit: 10,
      windowMs: 60_000,
    });
    if (!userGuard.ok) return rateLimitResponse(userGuard);

    const { packId } = (await req.json()) as { packId?: string };
    const pack = packId ? getPack(packId) : undefined;
    if (!pack) return NextResponse.json({ error: "Invalid pack" }, { status: 400 });

    const razorpay = getRazorpay();
    const txRef = adminDb.collection("transactions").doc();

    const order = await razorpay.orders.create({
      amount: pack.pricePaise,
      currency: "INR",
      receipt: txRef.id,
      notes: {
        uid: user.uid,
        packId: pack.id,
        credits: String(pack.credits),
        txId: txRef.id,
      },
    });

    const tx: TransactionDoc = {
      id: txRef.id,
      uid: user.uid,
      packId: pack.id,
      credits: pack.credits,
      amountPaise: pack.pricePaise,
      currency: "INR",
      razorpayOrderId: order.id,
      status: "created",
      createdAt: Date.now(),
      email: user.email,
    };
    await txRef.set(tx);

    return NextResponse.json({
      orderId: order.id,
      amount: pack.pricePaise,
      currency: "INR",
      keyId: process.env.RAZORPAY_KEY_ID,
      txId: txRef.id,
      pack,
      user: { name: user.displayName ?? "", email: user.email },
    });
  } catch (err: unknown) {
    const e = err as { error?: { description?: string; reason?: string }; message?: string; statusCode?: number };
    // Log full Razorpay error details server-side, but never echo them to
    // the client — the description/reason fields can include internal
    // account hints and PII. The client only needs a status code.
    log.error("order creation failed", {
      description: e?.error?.description,
      reason: e?.error?.reason,
      statusCode: e?.statusCode,
      errMessage: e?.message,
    });
    const status = e?.statusCode && e.statusCode >= 400 && e.statusCode < 500 ? 400 : 500;
    return NextResponse.json({ error: "Order creation failed" }, { status });
  }
}
