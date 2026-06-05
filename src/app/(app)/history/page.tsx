import Link from "next/link";
import { getSessionUser } from "@/lib/firebase/auth";
import { adminDb } from "@/lib/firebase/admin";
import type { ArchitectureDoc } from "@/types/architecture";
import { formatDate, truncate } from "@/lib/utils";
import { Fab } from "@/components/m3/Fab";

export const metadata = { title: "Library" };

export default async function HistoryPage() {
  const user = (await getSessionUser())!;
  const snap = await adminDb
    .collection("architectures")
    .where("uid", "==", user.uid)
    .orderBy("createdAt", "desc")
    .limit(60)
    .get();
  const items = snap.docs.map((d) => d.data() as ArchitectureDoc);

  // Group by time bucket
  const now = Date.now();
  const buckets = new Map<string, ArchitectureDoc[]>();
  for (const a of items) {
    const t = typeof a.createdAt === "number" ? a.createdAt : new Date(a.createdAt as unknown as string).getTime();
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
    buckets.get(bucket)!.push(a);
  }

  return (
    <div className="relative mx-auto w-full max-w-[1400px] px-6 py-10 md:px-10 md:py-14 lg:px-14">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[380px] overflow-hidden">
        <div className="absolute -left-32 top-10 size-[320px] rounded-full bg-m3-secondary-container/40 blur-[100px] m3-shape-a" />
      </div>

      <section className="m3-page-enter flex flex-wrap items-end justify-between gap-6">
        <div>
          <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-m3-on-surface-variant">
            Your archive
          </div>
          <h1 className="display mt-3 text-balance text-[clamp(2.25rem,4vw,3rem)] leading-[1.05]">
            Library
          </h1>
          <p className="mt-3 max-w-md text-[15px] text-m3-on-surface-variant">
            Every architecture you&rsquo;ve designed with Tessar — searchable,
            permanent, exportable.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-m3-surface-container px-3.5 py-1.5 text-[13px] text-m3-on-surface-variant">
            <span className="font-mono tabular-nums">{items.length}</span>{" "}
            {items.length === 1 ? "design" : "designs"}
          </div>
          <Fab
            size="extended"
            icon="auto_awesome"
            href="/new"
            variant="primary"
            className="!h-12 !rounded-2xl !text-[14px]"
          >
            New design
          </Fab>
        </div>
      </section>

      {items.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="mt-12 space-y-12">
          {(["Today", "This week", "This month", "Older"] as const).map((label) => {
            const list = buckets.get(label);
            if (!list || list.length === 0) return null;
            return (
              <section key={label} className="m3-page-enter">
                <div className="mb-4 flex items-center gap-3">
                  <h2 className="display text-[20px] leading-tight">{label}</h2>
                  <div className="h-px flex-1 bg-m3-outline-variant/40" />
                  <span className="text-[12px] text-m3-on-surface-variant">{list.length}</span>
                </div>
                <div className="m3-stagger grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {list.map((a) => (
                    <Link key={a.id} href={`/architecture/${a.id}`}>
                      <article
                        className="state-layer press group/h relative flex h-full flex-col gap-3 overflow-hidden rounded-[28px] bg-m3-surface-container-low p-5 transition-shadow duration-m3-default-effects ease-m3-default-effects hover:shadow-m3-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <h3 className="truncate text-[15px] font-medium leading-snug text-m3-on-surface">
                              {a.architecture?.meta.title ?? (a.status === "failed" ? "Failed run" : "Untitled")}
                            </h3>
                            {a.architecture?.meta.domain && (
                              <div className="mt-1 text-[10px] uppercase tracking-[0.16em] text-m3-on-surface-variant">
                                {a.architecture.meta.domain}
                              </div>
                            )}
                          </div>
                          <StatusBadge status={a.status} />
                        </div>
                        <p className="text-[13px] leading-relaxed text-m3-on-surface-variant line-clamp-3">
                          {truncate(a.prompt, 220)}
                        </p>
                        <div className="mt-auto flex items-center justify-between border-t border-m3-outline-variant/40 pt-3 text-[11px] text-m3-on-surface-variant">
                          <span>{formatDate(a.createdAt)}</span>
                          {a.durationMs && (
                            <span className="font-mono tabular-nums">
                              {Math.round(a.durationMs / 1000)}s
                            </span>
                          )}
                        </div>
                      </article>
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: ArchitectureDoc["status"] }) {
  const map = {
    complete: { c: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200", l: "Complete" },
    running: { c: "bg-m3-secondary-container text-m3-on-secondary-container", l: "Running" },
    failed: { c: "bg-m3-error-container text-m3-on-error-container", l: "Failed" },
    pending: { c: "bg-m3-surface-container text-m3-on-surface-variant", l: "Pending" },
  } as const;
  const s = map[status];
  return <span className={"shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-medium " + s.c}>{s.l}</span>;
}

function EmptyState() {
  return (
    <div className="m3-page-enter mt-16 flex flex-col items-center justify-center rounded-[36px] bg-m3-surface-container-low p-16 text-center">
      <div className="relative grid size-24 place-items-center">
        <div aria-hidden className="absolute inset-0 rounded-full bg-m3-primary-container m3-blob" />
        <span className="ms text-[40px] text-m3-on-primary-container" aria-hidden>
          auto_awesome
        </span>
      </div>
      <h2 className="display mt-6 text-[28px] leading-tight">Nothing here yet</h2>
      <p className="mt-3 max-w-sm text-[15px] text-m3-on-surface-variant">
        Start designing — your first architecture lands here in a few minutes.
      </p>
      <div className="mt-6">
        <Fab size="extended" icon="auto_awesome" href="/new" variant="primary" className="!h-14 !rounded-2xl !text-[15px]">
          Design my first system
        </Fab>
      </div>
    </div>
  );
}
