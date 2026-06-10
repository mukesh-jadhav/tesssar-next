import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/firebase/auth";
import { adminDb } from "@/lib/firebase/admin";
import type { ArchitectureDoc } from "@/types/architecture";
import { formatDate, truncate } from "@/lib/utils";
import { getBalance } from "@/lib/credits/ledger";
import { formatDesigns, canAffordRun, isUnlimited } from "@/lib/credits/display";
import { ScrollFrame } from "@/components/workspace/ScrollFrame";
import { EmptyHero } from "@/components/empty/EmptyHero";

const SUGGESTIONS = [
  {
    n: "01",
    label: "Launch a B2B SaaS",
    seed:
      "I'm building a B2B SaaS for Indian SMBs. Target 10k tenants, multi-region in India. Suggest a production-grade cloud architecture with cost estimates in INR.",
  },
  {
    n: "02",
    label: "Add an AI chat copilot to my app",
    seed:
      "I want to add an AI chat copilot to my existing app. 50k DAU, low latency, conversation memory, retrieval over the user's documents. What's the right cloud architecture?",
  },
  {
    n: "03",
    label: "E-commerce backend for India",
    seed:
      "Design a low-latency e-commerce backend for India: 1M MAU, 100k peak concurrent at sale times, INR pricing. Recommend a production cloud architecture and risks.",
  },
  {
    n: "04",
    label: "EdTech with live classes",
    seed:
      "EdTech platform with live classes, recorded content, quizzes. 500k students across India, peak 50k concurrent on live sessions. Architect a production cloud system for it.",
  },
];

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/dashboard");
  const credits = await getBalance(user.uid);

  const recentSnap = await adminDb
    .collection("architectures")
    .where("uid", "==", user.uid)
    .orderBy("createdAt", "desc")
    .limit(5)
    .get();
  const recent = recentSnap.docs.map((d) => d.data() as ArchitectureDoc);

  const totalSnap = await adminDb
    .collection("architectures")
    .where("uid", "==", user.uid)
    .count()
    .get();
  const totalRuns = totalSnap.data().count;

  const firstName =
    (user.displayName ?? user.email).split(" ")[0]?.split("@")[0] ?? "friend";

  return (
    <ScrollFrame>
      <div className="mx-auto w-full max-w-[1400px] px-6 py-10 md:px-12 md:py-14 lg:px-16">
      {/* Masthead row */}
      <div className="rule-dots flex items-baseline justify-between pb-4">
        <span className="tag tag-accent">{greetingFor(new Date())}</span>
        <span className="eyebrow hidden md:inline">
          Issue {String(totalRuns + 1).padStart(3, "0")} · {formatDateShort(new Date())}
        </span>
      </div>

      {/* HERO */}
      <section className="m3-page-enter mt-12 grid gap-12 lg:grid-cols-[1.4fr_1fr]">
        <h1 className="display-tight text-[clamp(3rem,9vw,8rem)] leading-[0.88] tracking-[-0.045em]">
          Hello,<br />
          <span className="serif font-normal italic accent">{firstName}.</span>
        </h1>

        <div className="flex flex-col justify-end gap-7 pb-3">
          <p className="text-[17px] leading-[1.55] text-[hsl(var(--ink-2))] max-w-[40ch]">
            What system would you like to architect today? Pick a starter
            below, or open a blank brief.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/new" className="btn-pill-accent btn-pill-lg">
              New design
              <span className="ms text-[20px]" aria-hidden>arrow_forward</span>
            </Link>
            {totalRuns === 0 && (
              <Link href="/sample" className="btn-pill-ghost btn-pill-lg">
                See a sample
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Stats row — hidden on first run; the EmptyHero below tells that story instead */}
      {totalRuns > 0 && (
      <section className="mt-20 grid gap-px bg-[hsl(var(--line))] border border-[hsl(var(--line))] md:grid-cols-3">
        <StatCell
          k="Designs"
          v={formatDesigns(credits)}
          sub={
            isUnlimited(credits)
              ? "Admin — unlimited"
              : canAffordRun(credits)
                ? "Remaining"
                : "Out of credits"
          }
          href={canAffordRun(credits) ? "/new" : "/pricing"}
          cta={canAffordRun(credits) ? "Use one →" : "Top up →"}
          accent={!canAffordRun(credits)}
        />
        <StatCell
          k="Designs"
          v={String(totalRuns)}
          sub="Total runs"
          href="/history"
          cta="Browse library →"
        />
        <StatCell
          k="Last brief"
          v={recent[0] ? formatDate(recent[0].createdAt) : "—"}
          sub={truncate(recent[0]?.architecture?.meta.title ?? "Nothing yet", 38)}
          href={recent[0] ? `/architecture/${recent[0].id}` : "/new"}
          cta={recent[0] ? "Open report →" : "Start one →"}
        />
      </section>
      )}

      {/* First-run editorial empty state — sits between the warm hero and the
          Quick start ladder. Visual only; the hero already has the primary CTA. */}
      {totalRuns === 0 && (
        <EmptyHero
          tag="Issue 001 awaits"
          illustration="workspace"
          title="A clean"
          italic="slate."
          lead={
            <>
              Your library is empty. The moment you ship your first design it
              lands here as <span className="text-[hsl(var(--ink))] font-medium">Issue 001</span>,
              with stats and quick re-opens slotting in around it.
            </>
          }
        />
      )}

      {/* Quick start */}
      <section className="mt-24">
        <div className="flex items-baseline justify-between border-b border-[hsl(var(--line))] pb-5">
          <p className="section-num">Quick start</p>
          <p className="eyebrow hidden md:inline">Tap to compose</p>
        </div>

        <ul className="mt-2 divide-y divide-[hsl(var(--line))]">
          {SUGGESTIONS.map((s) => (
            <li key={s.n}>
              <Link
                href={`/new?seed=${encodeURIComponent(s.seed)}`}
                className="group grid grid-cols-[auto_1fr_auto] items-center gap-6 py-6 transition-colors hover:bg-[hsl(var(--paper-2))] px-2 -mx-2 rounded-2xl"
              >
                <span className="display text-[36px] tracking-[-0.04em] text-[hsl(var(--ink-3))] group-hover:text-[hsl(var(--accent))] transition-colors w-12">
                  {s.n}
                </span>
                <span className="display text-[clamp(1.25rem,2.2vw,1.75rem)] leading-tight tracking-[-0.02em]">
                  {s.label}
                </span>
                <span className="ms text-[24px] text-[hsl(var(--ink-3))] group-hover:text-[hsl(var(--ink))] group-hover:translate-x-1 transition-all" aria-hidden>
                  arrow_forward
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Recent */}
      {recent.length > 0 && (
        <section className="mt-24">
          <div className="flex items-baseline justify-between border-b border-[hsl(var(--line))] pb-5">
            <p className="section-num">From your library</p>
            <Link href="/history" className="eyebrow ulgrow">View all →</Link>
          </div>

          <div className="mt-8 grid gap-px bg-[hsl(var(--line))] border border-[hsl(var(--line))] md:grid-cols-2 xl:grid-cols-3">
            {recent.map((a) => (
              <Link
                key={a.id}
                href={`/architecture/${a.id}`}
                className="group bg-[hsl(var(--paper))] p-7 transition-colors hover:bg-[hsl(var(--paper-2))]"
              >
                <div className="flex items-center justify-between">
                  <span className="eyebrow">{formatDate(a.createdAt)}</span>
                  <Status status={a.status} />
                </div>
                <h3 className="display mt-5 text-[20px] leading-[1.15] tracking-[-0.02em] line-clamp-2">
                  {a.architecture?.meta.title ?? "Untitled"}
                </h3>
                <p className="mt-3 text-[14px] leading-relaxed text-[hsl(var(--ink-2))] line-clamp-3">
                  {truncate(a.prompt, 160)}
                </p>
                {a.architecture?.meta.domain && (
                  <span className="mt-5 inline-block tag">{a.architecture.meta.domain}</span>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}
      </div>
    </ScrollFrame>
  );
}

function StatCell({
  k,
  v,
  sub,
  href,
  cta,
  accent,
}: {
  k: string;
  v: string;
  sub: string;
  href: string;
  cta: string;
  accent?: boolean;
}) {
  return (
    <Link
      href={href}
      className="group bg-[hsl(var(--paper))] p-8 transition-colors hover:bg-[hsl(var(--paper-2))]"
    >
      <div className="eyebrow">{k}</div>
      <div
        className={
          "display mt-4 text-[clamp(3rem,6vw,5rem)] leading-none tracking-[-0.04em] tabular-nums " +
          (accent ? "accent" : "")
        }
      >
        {v}
      </div>
      <div className="mt-3 text-[14px] text-[hsl(var(--ink-2))]">{sub}</div>
      <div className="mt-6 text-[13px] font-medium text-[hsl(var(--ink))] group-hover:translate-x-0.5 transition-transform">
        {cta}
      </div>
    </Link>
  );
}

function greetingFor(d: Date): string {
  const h = d.getHours();
  if (h < 5) return "Late shift";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Good night";
}

function formatDateShort(d: Date): string {
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function Status({ status }: { status: ArchitectureDoc["status"] }) {
  const styles: Record<ArchitectureDoc["status"], { label: string; cls: string }> = {
    complete: { label: "Complete", cls: "bg-[hsl(var(--good))]/10 text-[hsl(var(--good))] border-[hsl(var(--good))]/20" },
    running:  { label: "Running",  cls: "bg-[hsl(var(--paper-2))] text-[hsl(var(--ink-2))] border-[hsl(var(--line))]" },
    failed:   { label: "Failed",   cls: "bg-[hsl(var(--bad))]/10 text-[hsl(var(--bad))] border-[hsl(var(--bad))]/20" },
    pending:  { label: "Pending",  cls: "bg-[hsl(var(--paper-2))] text-[hsl(var(--ink-3))] border-[hsl(var(--line))]" },
  };
  const s = styles[status];
  return (
    <span className={"inline-flex items-center rounded-md border px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-wider " + s.cls}>
      {s.label}
    </span>
  );
}
