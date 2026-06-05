import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/firebase/auth";
import { getRazorpay } from "@/lib/razorpay/client";
import { getPack } from "@/lib/razorpay/packs";
import { adminDb } from "@/lib/firebase/admin";
import type { TransactionDoc } from "@/types/architecture";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
    keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    txId: txRef.id,
    pack,
    user: { name: user.displayName ?? "", email: user.email },
  });
}
