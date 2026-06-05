import { NextResponse } from "next/server";
import { getSessionUser, isAdmin } from "@/lib/firebase/auth";
import { adminDb } from "@/lib/firebase/admin";

export const runtime = "nodejs";

export async function GET() {
  const user = await getSessionUser();
  if (!user || !(await isAdmin(user.email))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const now = Date.now();
  const dayAgo = now - 24 * 60 * 60 * 1000;
  const monthAgo = now - 30 * 24 * 60 * 60 * 1000;

  const [usersSnap, archSnap, txSnap, archDay, txMonth] = await Promise.all([
    adminDb.collection("users").count().get(),
    adminDb.collection("architectures").count().get(),
    adminDb.collection("transactions").where("status", "==", "paid").count().get(),
    adminDb.collection("architectures").where("createdAt", ">=", dayAgo).count().get(),
    adminDb.collection("transactions").where("status", "==", "paid").where("paidAt", ">=", monthAgo).get(),
  ]);

  const monthRevenuePaise = txMonth.docs.reduce((sum, d) => sum + (d.data().amountPaise ?? 0), 0);

  return NextResponse.json({
    users: usersSnap.data().count,
    architectures: archSnap.data().count,
    paidTransactions: txSnap.data().count,
    architecturesLast24h: archDay.data().count,
    revenueLast30dInr: Math.round(monthRevenuePaise / 100),
  });
}
