import Link from "next/link";
import { getSessionUser } from "@/lib/firebase/auth";
import { adminDb } from "@/lib/firebase/admin";
import type { ArchitectureDoc } from "@/types/architecture";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate, truncate } from "@/lib/utils";

export const metadata = { title: "History" };

export default async function HistoryPage() {
  const user = (await getSessionUser())!;
  const snap = await adminDb
    .collection("architectures")
    .where("uid", "==", user.uid)
    .orderBy("createdAt", "desc")
    .limit(60)
    .get();
  const items = snap.docs.map((d) => d.data() as ArchitectureDoc);

  return (
    <div className="container max-w-5xl py-10">
      <h1 className="text-3xl font-semibold tracking-tight">History</h1>
      <p className="mt-1 text-muted-foreground">Every architecture you've designed with Tessar.</p>

      <div className="mt-8 space-y-3">
        {items.length === 0 && (
          <Card><CardContent className="p-8 text-center text-muted-foreground">No runs yet.</CardContent></Card>
        )}
        {items.map((a) => (
          <Link key={a.id} href={`/architecture/${a.id}`}>
            <Card className="transition-shadow hover:shadow-md">
              <CardContent className="flex flex-wrap items-start justify-between gap-3 p-5">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {a.architecture?.meta.title ?? (a.status === "failed" ? "Failed run" : "Untitled")}
                    </span>
                    <StatusBadge status={a.status} />
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{truncate(a.prompt, 200)}</p>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <div>{formatDate(a.createdAt)}</div>
                  {a.durationMs && <div className="mt-1">⏱ {Math.round(a.durationMs / 1000)}s</div>}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: ArchitectureDoc["status"] }) {
  const map = {
    complete: { v: "success" as const, l: "Complete" },
    running: { v: "info" as const, l: "Running" },
    failed: { v: "destructive" as const, l: "Failed" },
    pending: { v: "outline" as const, l: "Pending" },
  };
  const s = map[status];
  return <Badge variant={s.v} className="text-[10px]">{s.l}</Badge>;
}
