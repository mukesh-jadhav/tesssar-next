import { redirect } from "next/navigation";
import { getSessionUser, isAdmin } from "@/lib/firebase/auth";
import { adminDb } from "@/lib/firebase/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ArchitectureDoc, TransactionDoc, UserDoc } from "@/types/architecture";
import { formatDate, formatINR, truncate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Admin" };

export default async function AdminPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!(await isAdmin(user.email))) redirect("/dashboard");

  const now = Date.now();
  const monthAgo = now - 30 * 24 * 60 * 60 * 1000;

  const [usersSnap, archSnap, txSnap, revSnap] = await Promise.all([
    adminDb.collection("users").orderBy("createdAt", "desc").limit(20).get(),
    adminDb.collection("architectures").orderBy("createdAt", "desc").limit(20).get(),
    adminDb.collection("transactions").orderBy("createdAt", "desc").limit(20).get(),
    adminDb
      .collection("transactions")
      .where("status", "==", "paid")
      .where("paidAt", ">=", monthAgo)
      .get(),
  ]);

  const monthRevenuePaise = revSnap.docs.reduce((s, d) => s + (d.data().amountPaise ?? 0), 0);
  const allUsersCount = (await adminDb.collection("users").count().get()).data().count;
  const allArchCount = (await adminDb.collection("architectures").count().get()).data().count;

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Admin</h1>
      <p className="mt-1 text-muted-foreground">Live platform metrics.</p>

      <div className="mt-8 grid gap-4 md:grid-cols-4">
        <Stat label="Users (all time)" value={allUsersCount.toString()} />
        <Stat label="Architectures" value={allArchCount.toString()} />
        <Stat label="Paid transactions" value={revSnap.size.toString()} sub="last 30d" />
        <Stat label="Revenue (30d)" value={formatINR(monthRevenuePaise)} sub="INR" />
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Recent users</CardTitle></CardHeader>
          <CardContent>
            <ul className="divide-y">
              {usersSnap.docs.map((d) => {
                const u = d.data() as UserDoc;
                return (
                  <li key={u.uid} className="flex items-center justify-between py-3 text-sm">
                    <div className="min-w-0">
                      <div className="truncate font-medium">{u.displayName ?? u.email}</div>
                      <div className="truncate text-xs text-muted-foreground">{u.email}</div>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      <div>{formatDate(u.createdAt)}</div>
                      <div>credits: {u.credits}</div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Recent architectures</CardTitle></CardHeader>
          <CardContent>
            <ul className="divide-y">
              {archSnap.docs.map((d) => {
                const a = d.data() as ArchitectureDoc;
                return (
                  <li key={a.id} className="py-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{a.architecture?.meta.title ?? "—"}</span>
                      <StatusBadge status={a.status} />
                    </div>
                    <div className="text-xs text-muted-foreground">{truncate(a.prompt, 120)}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{formatDate(a.createdAt)}</div>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Recent transactions</CardTitle></CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="py-2 pr-4">Time</th>
                  <th className="py-2 pr-4">Email</th>
                  <th className="py-2 pr-4">Pack</th>
                  <th className="py-2 pr-4">Amount</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {txSnap.docs.map((d) => {
                  const t = d.data() as TransactionDoc;
                  return (
                    <tr key={t.id} className="border-b">
                      <td className="py-2 pr-4 text-xs">{formatDate(t.createdAt)}</td>
                      <td className="py-2 pr-4 text-xs">{t.email ?? "—"}</td>
                      <td className="py-2 pr-4">{t.packId} ({t.credits})</td>
                      <td className="py-2 pr-4">{formatINR(t.amountPaise)}</td>
                      <td className="py-2"><StatusBadge status={t.status as ArchitectureDoc["status"]} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="mt-2 text-3xl font-semibold tracking-tight">{value}</div>
        {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { v: "success" | "info" | "destructive" | "warning" | "outline"; l: string }> = {
    complete: { v: "success", l: "Complete" },
    paid: { v: "success", l: "Paid" },
    running: { v: "info", l: "Running" },
    created: { v: "warning", l: "Pending" },
    failed: { v: "destructive", l: "Failed" },
    refunded: { v: "outline", l: "Refunded" },
    pending: { v: "outline", l: "Pending" },
  };
  const s = map[status] ?? { v: "outline" as const, l: status };
  return <Badge variant={s.v} className="text-[10px]">{s.l}</Badge>;
}
