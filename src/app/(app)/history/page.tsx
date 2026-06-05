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
    <div className="mx-auto w-full max-w-[1400px] px-4 py-10 md:px-8 lg:px-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Your archive
          </div>
          <h1 className="mt-2 display text-balance text-[clamp(2rem,3.6vw,2.5rem)]">
            History
          </h1>
          <p className="mt-2 text-muted-foreground">
            Every architecture you&rsquo;ve designed with Tessar.
          </p>
        </div>
        <div className="text-xs text-muted-foreground">
          <span className="font-mono tabular-nums">{items.length}</span>{" "}
          {items.length === 1 ? "run" : "runs"}
        </div>
      </div>

      <div className="mt-8 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {items.length === 0 && (
          <Card className="md:col-span-2 xl:col-span-3">
            <CardContent className="p-12 text-center text-muted-foreground">
              No runs yet. <Link href="/new" className="underline-offset-4 hover:underline">Start your first one.</Link>
            </CardContent>
          </Card>
        )}
        {items.map((a) => (
          <Link key={a.id} href={`/architecture/${a.id}`} className="group/h">
            <Card className="card-lift h-full">
              <CardContent className="flex h-full flex-col gap-3 p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium leading-snug">
                      {a.architecture?.meta.title ?? (a.status === "failed" ? "Failed run" : "Untitled")}
                    </div>
                    {a.architecture?.meta.domain && (
                      <div className="mt-1 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                        {a.architecture.meta.domain}
                      </div>
                    )}
                  </div>
                  <StatusBadge status={a.status} />
                </div>
                <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                  {truncate(a.prompt, 220)}
                </p>
                <div className="mt-auto flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>{formatDate(a.createdAt)}</span>
                  {a.durationMs && (
                    <span className="font-mono tabular-nums">
                      {Math.round(a.durationMs / 1000)}s
                    </span>
                  )}
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
