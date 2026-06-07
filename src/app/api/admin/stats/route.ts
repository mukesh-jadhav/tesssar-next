import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, isAdmin } from "@/lib/firebase/auth";
import { adminDb } from "@/lib/firebase/admin";
import { recordAudit } from "@/lib/security/audit";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || !(await isAdmin(user.email))) {
    // Log denied attempts too — failed admin access is itself signal.
    await recordAudit(req, {
      actorUid: user?.uid ?? null,
      actorEmail: user?.email ?? null,
      action: "admin.stats.denied",
    });
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

  // Fire-and-forget audit record so revenue/customer-data reads leave a
  // trail. We don't await the read details into the audit body — only
  // that the access happened, by whom, from where.
  recordAudit(req, {
    actorUid: user.uid,
    actorEmail: user.email,
    action: "admin.stats.view",
  }).catch(() => { /* recordAudit already logs internal failures */ });

  return NextResponse.json({
    users: usersSnap.data().count,
    architectures: archSnap.data().count,
    paidTransactions: txSnap.data().count,
    architecturesLast24h: archDay.data().count,
    revenueLast30dInr: Math.round(monthRevenuePaise / 100),
  });
}
