import Link from "next/link";
import { getSessionUser } from "@/lib/firebase/auth";
import { adminDb } from "@/lib/firebase/admin";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Plus, Coins, Sparkles, Clock } from "lucide-react";
import type { ArchitectureDoc } from "@/types/architecture";
import { formatDate, truncate } from "@/lib/utils";
import { getBalance } from "@/lib/credits/ledger";
import { AnimatedCounter, Reveal, Stagger } from "@/components/motion";

export default async function DashboardPage() {
  const user = (await getSessionUser())!;
  const credits = await getBalance(user.uid);

  const recentSnap = await adminDb
    .collection("architectures")
    .where("uid", "==", user.uid)
    .orderBy("createdAt", "desc")
    .limit(6)
    .get();

  const recent = recentSnap.docs.map((d) => d.data() as ArchitectureDoc);

  return (
    <div className="container py-12 md:py-16">
      <Reveal className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Welcome back
          </div>
          <h1 className="mt-2 display text-balance text-[clamp(1.75rem,3.5vw,2.5rem)] font-semibold">
            {user.displayName ?? user.email}
          </h1>
        </div>
        <Button asChild size="lg" className="gap-2">
          <Link href="/new">
            <Plus className="size-4" /> New architecture
          </Link>
        </Button>
      </Reveal>

      <Stagger step={80} className="grid gap-4 md:grid-cols-3">
        <StatCard
          icon={<Coins className="size-4" />}
          label="Credits"
          value={credits}
          sub={credits > 0 ? "Each run = 1 credit" : "Top up to design more"}
          cta={
            credits === 0
              ? { href: "/pricing", label: "Top up" }
              : { href: "/new", label: "Start a run" }
          }
        />
        <StatCard
          icon={<Sparkles className="size-4" />}
          label="Total architectures"
          value={recentSnap.size}
          sub="across all time"
          cta={{ href: "/history", label: "View history" }}
        />
        <StatCard
          icon={<Clock className="size-4" />}
          label="Last run"
          value={recent[0] ? formatDate(recent[0].createdAt) : "—"}
          sub={recent[0]?.architecture?.meta.title ?? "No runs yet"}
          isText
          cta={recent[0] ? { href: `/architecture/${recent[0].id}`, label: "Open" } : undefined}
        />
      </Stagger>

      <Reveal className="mt-12">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Recent architectures</h2>
          <Link
            href="/history"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            View all →
          </Link>
        </div>
        {recent.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center gap-4 py-20 text-center">
              <Sparkles className="size-8 text-foreground/40" />
              <div>
                <div className="font-medium">No architectures yet</div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Use your free credit to design your first system.
                </p>
              </div>
              <Button asChild>
                <Link href="/new">Design my architecture →</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Stagger step={60} className="grid gap-3 md:grid-cols-2">
            {recent.map((a) => (
              <Link key={a.id} href={`/architecture/${a.id}`}>
                <Card interactive className="h-full">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base">
                        {a.architecture?.meta.title ?? "Untitled"}
                      </CardTitle>
                      <Status status={a.status} />
                    </div>
                    <CardDescription>{truncate(a.prompt, 140)}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{formatDate(a.createdAt)}</span>
                    {a.architecture && (
                      <Badge variant="outline" className="text-[10px]">
                        {a.architecture.meta.domain}
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </Stagger>
        )}
      </Reveal>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
  cta,
  isText = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  sub: string;
  cta?: { href: string; label: string };
  isText?: boolean;
}) {
  return (
    <Card className="card-lift">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          {icon}
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="display text-[clamp(2rem,4vw,2.75rem)] font-semibold tabular-nums leading-none">
          {isText || typeof value === "string" ? value : <AnimatedCounter value={value} />}
        </div>
        <div className="mt-2 text-sm text-muted-foreground">{sub}</div>
        {cta && (
          <Button asChild variant="link" className="mt-3 h-auto p-0 text-sm text-foreground">
            <Link href={cta.href} className="group/cta gap-1">
              {cta.label}
              <ArrowRight className="size-3 transition-transform duration-200 group-hover/cta:translate-x-0.5" />
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function Status({ status }: { status: ArchitectureDoc["status"] }) {
  if (status === "complete") return <Badge variant="success" className="text-[10px]">Complete</Badge>;
  if (status === "running") return <Badge variant="info" className="text-[10px]">Running</Badge>;
  if (status === "failed") return <Badge variant="destructive" className="text-[10px]">Failed</Badge>;
  return <Badge variant="outline" className="text-[10px]">Pending</Badge>;
}
