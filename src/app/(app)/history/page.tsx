import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/firebase/auth";
import { adminDb } from "@/lib/firebase/admin";
import type { ArchitectureDoc } from "@/types/architecture";
import type { StudyDoc, StudyStatus } from "@/types/study";
import { formatDate, truncate } from "@/lib/utils";
import { ScrollFrame } from "@/components/workspace/ScrollFrame";
import { EmptyHero } from "@/components/empty/EmptyHero";

export const metadata = { title: "Library" };

/**
 * /history — the unified archive. Mixes standalone architectures and
 * comparison studies in one chronological feed. Study variants (arch
 * docs with `studyId` set) are filtered out — they're represented by
 * the parent study row. Synthesized arch docs (no `studyId`, but
 * `synthesizedFrom` is set) and promoted variants (study tags cleared)
 * appear as regular arch rows.
 */
type FeedItem =
  | { kind: "arch"; createdAt: number; data: ArchitectureDoc }
  | { kind: "study"; createdAt: number; data: StudyDoc };

export default async function HistoryPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/history");

  // Parallel uid-scoped fetches — both hit existing composite indexes
  // on (uid, createdAt DESC). The Firestore rules layer also enforces
  // ownership; the where() filter is defense in depth.
  const [archSnap, studySnap] = await Promise.all([
    adminDb
      .collection("architectures")
      .where("uid", "==", user.uid)
      .orderBy("createdAt", "desc")
      .limit(80)
      .get(),
    adminDb
      .collection("studies")
      .where("uid", "==", user.uid)
      .orderBy("createdAt", "desc")
      .limit(40)
      .get(),
  ]);

  const allArch = archSnap.docs.map((d) => d.data() as ArchitectureDoc);
  // Hide architectures that still belong to a study — the parent study
  // row carries them. Promoted arch docs have `studyId` cleared so they
  // resurface here. Synthesized docs never had `studyId`.
  const standaloneArch = allArch.filter((a) => !a.studyId);
  const studies = studySnap.docs.map((d) => d.data() as StudyDoc);

  const feed: FeedItem[] = [
    ...standaloneArch.map<FeedItem>((a) => ({
      kind: "arch",
      createdAt: numericMs(a.createdAt),
      data: a,
    })),
    ...studies.map<FeedItem>((s) => ({
      kind: "study",
      createdAt: numericMs(s.createdAt),
      data: s,
    })),
  ].sort((a, b) => b.createdAt - a.createdAt);

  const buckets = bucketByAge(feed);
  const totalCount = feed.length;

  return (
    <ScrollFrame>
      <div className="mx-auto w-full max-w-[1400px] px-6 py-10 md:px-12 md:py-14 lg:px-16">
        <div className="rule-dots flex items-baseline justify-between pb-4">
          <span className="tag tag-accent">Archive</span>
          <span className="eyebrow hidden md:inline">
            <span className="text-[hsl(var(--ink))] font-medium tabular-nums">
              {totalCount}
            </span>{" "}
            {totalCount === 1 ? "entry" : "entries"}
          </span>
        </div>

        <section className="m3-page-enter mt-12 grid gap-10 lg:grid-cols-[1.4fr_1fr]">
          <h1 className="display-tight text-[clamp(3rem,9vw,8rem)] leading-[0.88] tracking-[-0.045em]">
            The<br />
            <span className="serif font-normal italic accent">Library.</span>
          </h1>
          <div className="flex flex-col justify-end gap-6 pb-3">
            <p className="text-[17px] leading-[1.55] text-[hsl(var(--ink-2))] max-w-[40ch]">
              Every architecture you&rsquo;ve designed and every comparison
              you&rsquo;ve run — searchable, permanent, exportable.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/new" className="btn-pill btn-pill-accent">
                New design
                <span className="ms text-[18px]" aria-hidden>
                  arrow_forward
                </span>
              </Link>
              <Link href="/studies/new" className="btn-pill btn-pill-ghost">
                New study
                <span className="ms text-[18px]" aria-hidden>
                  compare_arrows
                </span>
              </Link>
            </div>
          </div>
        </section>

        {feed.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="mt-20 space-y-20">
            {(["Today", "This week", "This month", "Older"] as const).map(
              (label) => {
                const list = buckets.get(label);
                if (!list || list.length === 0) return null;
                return (
                  <section key={label}>
                    <div className="flex items-baseline justify-between border-b border-[hsl(var(--line))] pb-5">
                      <p className="section-num">{label}</p>
                      <span className="eyebrow tabular-nums">{list.length}</span>
                    </div>
                    <ul className="mt-2 divide-y divide-[hsl(var(--line))]">
                      {list.map((item, i) =>
                        item.kind === "arch" ? (
                          <ArchRow key={`a-${item.data.id}`} arch={item.data} index={i} />
                        ) : (
                          <StudyRow key={`s-${item.data.id}`} study={item.data} index={i} />
                        ),
                      )}
                    </ul>
                  </section>
                );
              },
            )}
          </div>
        )}
      </div>
    </ScrollFrame>
  );
}

// ---------- Rows ----------

function ArchRow({ arch: a, index: i }: { arch: ArchitectureDoc; index: number }) {
  return (
    <li>
      <Link
        href={`/architecture/${a.id}`}
        className="group grid grid-cols-[auto_1fr_auto] items-center gap-6 py-6 px-2 -mx-2 rounded-2xl transition-colors hover:bg-[hsl(var(--paper-2))]"
      >
        <span className="display text-[24px] tracking-[-0.04em] text-[hsl(var(--ink-3))] tabular-nums w-12">
          {String(i + 1).padStart(2, "0")}
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <h3 className="display text-[clamp(1.1rem,1.8vw,1.5rem)] leading-tight tracking-[-0.02em] truncate">
              {a.architecture?.meta.title ??
                (a.status === "failed" ? "Failed run" : "Untitled")}
            </h3>
            <StatusBadge status={a.status} />
            {a.synthesizedFrom && <SynthesisBadge />}
          </div>
          <p className="mt-1.5 text-[14px] text-[hsl(var(--ink-2))] line-clamp-1">
            {truncate(a.prompt, 200)}
          </p>
          <div className="mt-2 flex items-center gap-3 text-[11px] font-mono uppercase tracking-wider text-[hsl(var(--ink-3))]">
            <span>{formatDate(a.createdAt)}</span>
            {a.architecture?.meta.domain && (
              <>
                <span className="opacity-40">·</span>
                <span>{a.architecture.meta.domain}</span>
              </>
            )}
            {a.durationMs && (
              <>
                <span className="opacity-40">·</span>
                <span className="tabular-nums">
                  {Math.round(a.durationMs / 1000)}s
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
  );
}

function StudyRow({ study: s, index: i }: { study: StudyDoc; index: number }) {
  return (
    <li>
      <Link
        href={`/studies/${s.id}`}
        className="group grid grid-cols-[auto_1fr_auto] items-center gap-6 py-6 px-2 -mx-2 rounded-2xl transition-colors hover:bg-[hsl(var(--paper-2))]"
      >
        <span className="display text-[24px] tracking-[-0.04em] text-[hsl(var(--ink-3))] tabular-nums w-12">
          {String(i + 1).padStart(2, "0")}
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <span className="ms text-[16px] text-[hsl(var(--accent))]" aria-hidden>
              compare_arrows
            </span>
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
            <span className="tabular-nums">{s.variants.length} variants</span>
            {typeof s.creditsCharged === "number" && (
              <>
                <span className="opacity-40">·</span>
                <span className="tabular-nums">{s.creditsCharged} cr</span>
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
  );
}

// ---------- Bucketing ----------

function bucketByAge(items: FeedItem[]): Map<string, FeedItem[]> {
  const now = Date.now();
  const buckets = new Map<string, FeedItem[]>();
  for (const item of items) {
    const delta = now - item.createdAt;
    const bucket =
      delta < 86_400_000
        ? "Today"
        : delta < 604_800_000
          ? "This week"
          : delta < 2_592_000_000
            ? "This month"
            : "Older";
    if (!buckets.has(bucket)) buckets.set(bucket, []);
    buckets.get(bucket)!.push(item);
  }
  return buckets;
}

function numericMs(t: unknown): number {
  if (typeof t === "number") return t;
  if (typeof t === "string") return new Date(t).getTime();
  return 0;
}

// ---------- Badges ----------

function StatusBadge({ status }: { status: ArchitectureDoc["status"] }) {
  const styles: Record<
    ArchitectureDoc["status"],
    { label: string; cls: string }
  > = {
    complete: {
      label: "OK",
      cls: "bg-[hsl(var(--good))]/10 text-[hsl(var(--good))] border-[hsl(var(--good))]/20",
    },
    running: {
      label: "RUN",
      cls: "bg-[hsl(var(--paper-2))] text-[hsl(var(--ink-2))] border-[hsl(var(--line))]",
    },
    failed: {
      label: "ERR",
      cls: "bg-[hsl(var(--bad))]/10 text-[hsl(var(--bad))] border-[hsl(var(--bad))]/20",
    },
    pending: {
      label: "WAIT",
      cls: "bg-[hsl(var(--paper-2))] text-[hsl(var(--ink-3))] border-[hsl(var(--line))]",
    },
  };
  const s = styles[status];
  return (
    <span
      className={
        "shrink-0 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-mono tracking-wider " +
        s.cls
      }
    >
      {s.label}
    </span>
  );
}

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
        "shrink-0 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-mono tracking-wider " +
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
      <span className="ms text-[10px]" aria-hidden>
        auto_awesome
      </span>
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
      tag="The library is empty"
      illustration="library"
      title="Nothing in here"
      italic="— yet."
      lead="Each design you ship and every comparison you run gets archived here as a back-issue. Searchable, permanent, exportable. Start your first to break the seal."
      primary={{ href: "/new", label: "Design my first system" }}
      secondary={{ href: "/sample", label: "See a sample" }}
    />
  );
}
