import Link from "next/link";
import { getSessionUser } from "@/lib/firebase/auth";
import { adminDb } from "@/lib/firebase/admin";
import type { ArchitectureDoc } from "@/types/architecture";
import { formatDate, truncate } from "@/lib/utils";
import { ScrollFrame } from "@/components/workspace/ScrollFrame";

export const metadata = { title: "Library" };

export default async function HistoryPage() {
  const user = (await getSessionUser())!;
  const snap = await adminDb
    .collection("architectures")
    .where("uid", "==", user.uid)
    .orderBy("createdAt", "desc")
    .limit(80)
    .get();
  const items = snap.docs.map((d) => d.data() as ArchitectureDoc);

  const now = Date.now();
  const buckets = new Map<string, ArchitectureDoc[]>();
  for (const a of items) {
    const t = typeof a.createdAt === "number" ? a.createdAt : new Date(a.createdAt as unknown as string).getTime();
    const delta = now - t;
    const bucket =
      delta < 86_400_000 ? "Today"
        : delta < 604_800_000 ? "This week"
          : delta < 2_592_000_000 ? "This month"
            : "Older";
    if (!buckets.has(bucket)) buckets.set(bucket, []);
    buckets.get(bucket)!.push(a);
  }

  return (
    <ScrollFrame>
      <div className="mx-auto w-full max-w-[1400px] px-6 py-10 md:px-12 md:py-14 lg:px-16">
      {/* Masthead */}
      <div className="rule-dots flex items-baseline justify-between pb-4">
        <span className="tag tag-accent">§ Archive</span>
        <span className="eyebrow hidden md:inline">
          <span className="text-[hsl(var(--ink))] font-medium tabular-nums">{items.length}</span>{" "}
          {items.length === 1 ? "design" : "designs"}
        </span>
      </div>

      <section className="m3-page-enter mt-12 grid gap-10 lg:grid-cols-[1.4fr_1fr]">
        <h1 className="display-tight text-[clamp(3rem,9vw,8rem)] leading-[0.88] tracking-[-0.045em]">
          The<br />
          <span className="serif font-normal italic accent">Library.</span>
        </h1>
        <div className="flex flex-col justify-end gap-6 pb-3">
          <p className="text-[17px] leading-[1.55] text-[hsl(var(--ink-2))] max-w-[40ch]">
            Every architecture you&rsquo;ve designed with Tessar —
            searchable, permanent, exportable.
          </p>
          <div>
            <Link href="/new" className="btn-pill-accent">
              New design
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
                  <p className="section-num">§ {label}</p>
                  <span className="eyebrow tabular-nums">{list.length}</span>
                </div>
                <ul className="mt-2 divide-y divide-[hsl(var(--line))]">
                  {list.map((a, i) => (
                    <li key={a.id}>
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
                              {a.architecture?.meta.title ?? (a.status === "failed" ? "Failed run" : "Untitled")}
                            </h3>
                            <StatusBadge status={a.status} />
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
                                <span className="tabular-nums">{Math.round(a.durationMs / 1000)}s</span>
                              </>
                            )}
                          </div>
                        </div>
                        <span className="ms text-[22px] text-[hsl(var(--ink-3))] group-hover:text-[hsl(var(--ink))] group-hover:translate-x-1 transition-all" aria-hidden>
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

function StatusBadge({ status }: { status: ArchitectureDoc["status"] }) {
  const styles: Record<ArchitectureDoc["status"], { label: string; cls: string }> = {
    complete: { label: "OK", cls: "bg-[hsl(var(--good))]/10 text-[hsl(var(--good))] border-[hsl(var(--good))]/20" },
    running:  { label: "RUN", cls: "bg-[hsl(var(--paper-2))] text-[hsl(var(--ink-2))] border-[hsl(var(--line))]" },
    failed:   { label: "ERR", cls: "bg-[hsl(var(--bad))]/10 text-[hsl(var(--bad))] border-[hsl(var(--bad))]/20" },
    pending:  { label: "WAIT", cls: "bg-[hsl(var(--paper-2))] text-[hsl(var(--ink-3))] border-[hsl(var(--line))]" },
  };
  const s = styles[status];
  return (
    <span className={"shrink-0 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-mono tracking-wider " + s.cls}>
      {s.label}
    </span>
  );
}

function EmptyState() {
  return (
    <div className="m3-page-enter mt-20 card-paper p-16 text-center">
      <p className="section-num">§ The library is empty</p>
      <h2 className="display-tight mt-8 text-[clamp(2.5rem,6vw,4.5rem)] leading-[0.95] tracking-[-0.04em]">
        Nothing in here<br />
        <span className="serif font-normal italic">— yet.</span>
      </h2>
      <p className="mt-6 max-w-md mx-auto text-[16px] text-[hsl(var(--ink-2))]">
        Start designing — your first architecture lands here in a few minutes.
      </p>
      <div className="mt-10">
        <Link href="/new" className="btn-pill-accent btn-pill-lg">
          Design my first system
          <span className="ms text-[20px]" aria-hidden>arrow_forward</span>
        </Link>
      </div>
    </div>
  );
}
