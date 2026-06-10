import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/firebase/auth";
import { adminDb } from "@/lib/firebase/admin";
import type { StudyDoc, StudyStatus } from "@/types/study";
import { formatDate, truncate } from "@/lib/utils";
import { ScrollFrame } from "@/components/workspace/ScrollFrame";
import { EmptyHero } from "@/components/empty/EmptyHero";

export const metadata = { title: "Studies" };

/**
 * /studies — the historical list of comparison studies. Editorial layout
 * mirrors /history. Each row links to /studies/[id], which routes to
 * either the cockpit or the live stream depending on study status.
 */
export default async function StudiesHistoryPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/studies");

  // Server-side ownership: the where(uid == user.uid) filter combined with
  // the Firestore rule `resource.data.uid == request.auth.uid` is the
  // hardest possible enforcement. The query also exercises the existing
  // (uid, createdAt DESC) composite index from firestore.indexes.json.
  const snap = await adminDb
    .collection("studies")
    .where("uid", "==", user.uid)
    .orderBy("createdAt", "desc")
    .limit(80)
    .get();
  const items = snap.docs.map((d) => d.data() as StudyDoc);

  const buckets = bucketByAge(items);

  return (
    <ScrollFrame>
      <div className="mx-auto w-full max-w-[1400px] px-6 py-10 md:px-12 md:py-14 lg:px-16">
        <div className="rule-dots flex items-baseline justify-between pb-4">
          <span className="tag tag-accent">Comparisons</span>
          <span className="eyebrow hidden md:inline">
            <span className="text-[hsl(var(--ink))] font-medium tabular-nums">{items.length}</span>{" "}
            {items.length === 1 ? "study" : "studies"}
          </span>
        </div>

        <section className="m3-page-enter mt-12 grid gap-10 lg:grid-cols-[1.4fr_1fr]">
          <h1 className="display-tight text-[clamp(3rem,9vw,8rem)] leading-[0.88] tracking-[-0.045em]">
            Side<br />
            <span className="serif font-normal italic accent">by side.</span>
          </h1>
          <div className="flex flex-col justify-end gap-6 pb-3">
            <p className="text-[17px] leading-[1.55] text-[hsl(var(--ink-2))] max-w-[40ch]">
              Every comparison you&rsquo;ve run — three or four parallel
              architectures, judged across nine lenses, with the picks you
              committed.
            </p>
            <div>
              <Link href="/studies/new" className="btn-pill-accent">
                New study
                <span className="ms text-[18px]" aria-hidden>arrow_forward</span>
              </Link>
            </div>
          </div>
        </section>

        {items.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="mt-20 space-y-20">
            {(["Today", "This week", "This month", "Older"] as const).map((label) => {
              const list = buckets.get(label);
              if (!list || list.length === 0) return null;
              return (
                <section key={label}>
                  <div className="flex items-baseline justify-between border-b border-[hsl(var(--line))] pb-5">
                    <p className="section-num">{label}</p>
                    <span className="eyebrow tabular-nums">{list.length}</span>
                  </div>
                  <ul className="mt-2 divide-y divide-[hsl(var(--line))]">
                    {list.map((s, i) => (
                      <li key={s.id}>
                        <Link
                          href={`/studies/${s.id}`}
                          className="group grid grid-cols-[auto_1fr_auto] items-center gap-6 py-6 px-2 -mx-2 rounded-2xl transition-colors hover:bg-[hsl(var(--paper-2))]"
                        >
                          <span className="display text-[24px] tracking-[-0.04em] text-[hsl(var(--ink-3))] tabular-nums w-12">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-3">
                              <h3 className="display text-[clamp(1.1rem,1.8vw,1.5rem)] leading-tight tracking-[-0.02em] truncate">
                                {truncate(s.prompt || "Untitled study", 120)}
                              </h3>
                              <StudyStatusBadge status={s.status} />
                              {s.finalRunId && <SynthesisBadge />}
                            </div>
                            <div className="mt-2 flex items-center gap-3 text-[11px] font-mono uppercase tracking-wider text-[hsl(var(--ink-3))]">
                              <span>{formatDate(s.createdAt)}</span>
                              <span className="opacity-40">·</span>
                              <span>{dimensionLabel(s.dimension)}</span>
                              <span className="opacity-40">·</span>
                              <span className="tabular-nums">
                                {s.variants.length} variants
                              </span>
                              {typeof s.creditsCharged === "number" && (
                                <>
                                  <span className="opacity-40">·</span>
                                  <span className="tabular-nums">
                                    {s.creditsCharged} cr
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                          <span
                            className="ms text-[22px] text-[hsl(var(--ink-3))] group-hover:text-[hsl(var(--ink))] group-hover:translate-x-1 transition-all"
                            aria-hidden
                          >
                            arrow_forward
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </ScrollFrame>
  );
}

// ---------- Bucketing ----------

function bucketByAge(items: StudyDoc[]): Map<string, StudyDoc[]> {
  const now = Date.now();
  const buckets = new Map<string, StudyDoc[]>();
  for (const s of items) {
    const t =
      typeof s.createdAt === "number"
        ? s.createdAt
        : new Date(s.createdAt as unknown as string).getTime();
    const delta = now - t;
    const bucket =
      delta < 86_400_000
        ? "Today"
        : delta < 604_800_000
          ? "This week"
          : delta < 2_592_000_000
            ? "This month"
            : "Older";
    if (!buckets.has(bucket)) buckets.set(bucket, []);
    buckets.get(bucket)!.push(s);
  }
  return buckets;
}

// ---------- Badges ----------

function StudyStatusBadge({ status }: { status: StudyStatus }) {
  const styles: Record<StudyStatus, { label: string; cls: string }> = {
    complete: {
      label: "OK",
      cls: "bg-[hsl(var(--good))]/10 text-[hsl(var(--good))] border-[hsl(var(--good))]/20",
    },
    running: {
      label: "RUN",
      cls: "bg-[hsl(var(--paper-2))] text-[hsl(var(--ink-2))] border-[hsl(var(--line))]",
    },
    partial: {
      label: "MIX",
      cls: "bg-[hsl(var(--warn))]/10 text-[hsl(var(--warn))] border-[hsl(var(--warn))]/20",
    },
    failed: {
      label: "ERR",
      cls: "bg-[hsl(var(--bad))]/10 text-[hsl(var(--bad))] border-[hsl(var(--bad))]/20",
    },
  };
  const s = styles[status];
  return (
    <span
      className={
        "shrink-0 inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-mono tracking-wider " +
        s.cls
      }
    >
      {s.label}
    </span>
  );
}

function SynthesisBadge() {
  return (
    <span className="shrink-0 inline-flex items-center gap-1 rounded-md border border-[hsl(var(--accent))]/20 bg-[hsl(var(--accent))]/10 px-2 py-0.5 text-[10px] font-mono tracking-wider text-[hsl(var(--accent))]">
      <span className="ms text-[10px]" aria-hidden>auto_awesome</span>
      SYNTH
    </span>
  );
}

function dimensionLabel(id: string): string {
  switch (id) {
    case "cloud":
      return "Cloud";
    case "style":
      return "Style";
    case "datastore":
      return "Datastore";
    case "deployment":
      return "Deployment";
    case "cost-posture":
      return "Cost posture";
    default:
      return id;
  }
}

function EmptyState() {
  return (
    <EmptyHero
      tag="No comparisons yet"
      illustration="library"
      title="Nothing to compare"
      italic="— yet."
      lead="Run two, three, or four parallel architectures along one axis — cloud, style, datastore, deployment, or cost — and decide with nine lenses on the cockpit."
      primary={{ href: "/studies/new", label: "Start a study" }}
      secondary={{ href: "/new", label: "Or design a single system" }}
    />
  );
}
