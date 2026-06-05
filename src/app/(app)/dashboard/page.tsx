import Link from "next/link";
import { getSessionUser } from "@/lib/firebase/auth";
import { adminDb } from "@/lib/firebase/admin";
import type { ArchitectureDoc } from "@/types/architecture";
import { formatDate, truncate } from "@/lib/utils";
import { getBalance } from "@/lib/credits/ledger";
import { Fab } from "@/components/m3/Fab";
import { Chip } from "@/components/m3/Chip";

const SUGGESTIONS = [
  {
    icon: "rocket_launch",
    label: "Launch a B2B SaaS on Google Cloud",
    seed:
      "I'm building a B2B SaaS for Indian SMBs. Target 10k tenants, multi-region in India. Suggest a production-grade architecture on Google Cloud with cost estimates in INR.",
  },
  {
    icon: "smart_toy",
    label: "Add a Gemini-powered AI feature",
    seed:
      "I want to add a Gemini-powered AI chat feature to my existing app. 50k DAU, low latency, conversation memory. What's the right architecture on Vertex AI?",
  },
  {
    icon: "storefront",
    label: "E-commerce backend for India",
    seed:
      "Design a low-latency e-commerce backend for India: 1M MAU, 100k peak concurrent at sale times, INR pricing. Recommend a Google Cloud architecture and risks.",
  },
  {
    icon: "school",
    label: "EdTech platform with live classes",
    seed:
      "EdTech platform with live classes, recorded content, quizzes. 500k students across India, peak 50k concurrent on live sessions. Architect it on Google Cloud.",
  },
];

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

  const totalSnap = await adminDb
    .collection("architectures")
    .where("uid", "==", user.uid)
    .count()
    .get();
  const totalRuns = totalSnap.data().count;

  const firstName =
    (user.displayName ?? user.email).split(" ")[0]?.split("@")[0] ?? "friend";

  return (
    <div className="relative mx-auto w-full max-w-[1400px] px-6 py-10 md:px-10 md:py-14 lg:px-14">
      {/* Ambient background shapes */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] overflow-hidden">
        <div className="absolute -left-32 top-10 size-[360px] rounded-full bg-m3-primary-container/45 blur-[100px] m3-shape-a" />
        <div className="absolute right-[-10%] top-[-10%] size-[420px] rounded-full bg-m3-tertiary-container/45 blur-[110px] m3-shape-b" />
      </div>

      {/* HERO greeting */}
      <section className="m3-page-enter">
        <div className="text-[12px] font-medium uppercase tracking-[0.16em] text-m3-on-surface-variant">
          {greetingFor(new Date())}
        </div>
        <h1 className="display mt-2 text-balance text-[clamp(2.5rem,6vw,4.5rem)] leading-[1.04]">
          Hello, <span className="hero-gradient inline-block">{firstName}</span>
        </h1>
        <p className="mt-4 max-w-2xl text-[17px] leading-relaxed text-m3-on-surface-variant">
          What system would you like to architect today? Pick a starter prompt or
          write your own brief.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Fab
            size="extended"
            icon="auto_awesome"
            href="/new"
            variant="primary"
            className="!h-14 !rounded-2xl !text-[15px]"
          >
            New design
          </Fab>
          <Fab
            size="extended"
            icon="auto_stories"
            href="/sample"
            variant="surface"
            className="!h-14 !rounded-2xl !text-[15px] !shadow-none border border-m3-outline-variant"
          >
            See a sample
          </Fab>
          {credits === 0 && (
            <Chip type="assist" icon="diamond" href="/pricing" className="!h-10 ml-auto">
              Out of credits · top up
            </Chip>
          )}
        </div>
      </section>

      {/* Bento — Stats + Suggestions side-by-side */}
      <section className="m3-stagger mt-14 grid gap-3 md:grid-cols-6">
        <StatCard
          className="md:col-span-2"
          icon="diamond"
          label="Credits"
          value={String(credits)}
          tone="primary"
          href={credits === 0 ? "/pricing" : "/new"}
          cta={credits === 0 ? "Top up" : "Use credit"}
        />
        <StatCard
          className="md:col-span-2"
          icon="auto_awesome"
          label="Total designs"
          value={String(totalRuns)}
          tone="tertiary"
          href="/history"
          cta="Browse library"
        />
        <StatCard
          className="md:col-span-2"
          icon="schedule"
          label="Last design"
          value={recent[0] ? formatDate(recent[0].createdAt) : "—"}
          sub={recent[0]?.architecture?.meta.title ?? "Nothing yet"}
          tone="secondary"
          href={recent[0] ? `/architecture/${recent[0].id}` : "/new"}
          cta={recent[0] ? "Open" : "Start"}
        />
      </section>

      {/* Suggestion bento */}
      <section className="mt-12">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-m3-on-surface-variant">
              Quick start
            </div>
            <h2 className="display mt-2 text-[clamp(1.5rem,2.4vw,1.875rem)] leading-tight">
              Try designing
            </h2>
          </div>
        </div>
        <div className="m3-stagger grid gap-3 md:grid-cols-2">
          {SUGGESTIONS.map((s, i) => (
            <Link
              key={s.label}
              href={`/new?seed=${encodeURIComponent(s.seed)}`}
              className="state-layer press group/sug flex items-center gap-4 rounded-[28px] bg-m3-surface-container-low p-5 transition-shadow duration-m3-default-effects ease-m3-default-effects hover:shadow-m3-2"
            >
              <span
                className={
                  "grid size-12 shrink-0 place-items-center rounded-2xl " +
                  (i % 2 === 0
                    ? "bg-m3-primary-container text-m3-on-primary-container"
                    : "bg-m3-tertiary-container text-m3-on-tertiary-container")
                }
              >
                <span className="ms text-[24px]" aria-hidden>{s.icon}</span>
              </span>
              <span className="flex-1 text-[15px] text-m3-on-surface">{s.label}</span>
              <span
                aria-hidden
                className="ms text-[22px] text-m3-on-surface-variant opacity-0 transition-all duration-m3-default-effects ease-m3-default-spatial group-hover/sug:translate-x-0.5 group-hover/sug:opacity-100"
              >
                arrow_forward
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Recent designs */}
      {recent.length > 0 && (
        <section className="mt-16">
          <div className="mb-5 flex items-end justify-between">
            <div>
              <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-m3-on-surface-variant">
                Library
              </div>
              <h2 className="display mt-2 text-[clamp(1.5rem,2.4vw,1.875rem)] leading-tight">
                Recent designs
              </h2>
            </div>
            <Chip type="assist" trailingIcon="arrow_forward" href="/history">
              View all
            </Chip>
          </div>
          <div className="m3-stagger grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {recent.map((a) => (
              <Link
                key={a.id}
                href={`/architecture/${a.id}`}
                className="state-layer press group/r relative flex h-full flex-col gap-3 overflow-hidden rounded-[28px] bg-m3-surface-container-low p-5 transition-shadow duration-m3-default-effects ease-m3-default-effects hover:shadow-m3-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-[15px] font-medium leading-snug text-m3-on-surface">
                    {a.architecture?.meta.title ?? "Untitled"}
                  </h3>
                  <Status status={a.status} />
                </div>
                <p className="text-[13px] leading-relaxed text-m3-on-surface-variant line-clamp-3">
                  {truncate(a.prompt, 160)}
                </p>
                <div className="mt-auto flex items-center justify-between border-t border-m3-outline-variant/40 pt-3 text-[11px] text-m3-on-surface-variant">
                  <span>{formatDate(a.createdAt)}</span>
                  {a.architecture?.meta.domain && (
                    <span className="rounded-full bg-m3-surface-container px-2.5 py-0.5">
                      {a.architecture.meta.domain}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function greetingFor(d: Date): string {
  const h = d.getHours();
  if (h < 5) return "Working late";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Good night";
}

function StatCard({
  className,
  icon,
  label,
  value,
  sub,
  tone,
  href,
  cta,
}: {
  className?: string;
  icon: string;
  label: string;
  value: string;
  sub?: string;
  tone: "primary" | "tertiary" | "secondary";
  href: string;
  cta: string;
}) {
  const ctaTone =
    tone === "primary"
      ? "bg-m3-primary-container text-m3-on-primary-container"
      : tone === "tertiary"
        ? "bg-m3-tertiary-container text-m3-on-tertiary-container"
        : "bg-m3-secondary-container text-m3-on-secondary-container";

  return (
    <Link
      href={href}
      className={
        "group/s state-layer press relative flex flex-col overflow-hidden rounded-[28px] bg-m3-surface-container-low p-6 transition-shadow duration-m3-default-effects ease-m3-default-effects hover:shadow-m3-2 " +
        (className ?? "")
      }
    >
      <div className="flex items-center justify-between">
        <div className={"grid size-11 place-items-center rounded-2xl " + ctaTone}>
          <span className="ms text-[22px]" aria-hidden>{icon}</span>
        </div>
        <span
          aria-hidden
          className="ms text-[22px] text-m3-on-surface-variant opacity-0 transition-all duration-m3-default-effects ease-m3-default-spatial group-hover/s:translate-x-0.5 group-hover/s:opacity-100"
        >
          arrow_outward
        </span>
      </div>
      <div className="mt-5 text-[11px] font-medium uppercase tracking-[0.16em] text-m3-on-surface-variant">
        {label}
      </div>
      <div className="display mt-1 text-[clamp(1.75rem,3vw,2.5rem)] leading-tight tabular-nums">
        {value}
      </div>
      {sub && <div className="mt-1 truncate text-[13px] text-m3-on-surface-variant">{sub}</div>}
      <div className="mt-4 inline-flex items-center gap-1 text-[12px] font-medium text-m3-primary">
        {cta}
        <span className="ms text-[16px]" aria-hidden>arrow_forward</span>
      </div>
    </Link>
  );
}

function Status({ status }: { status: ArchitectureDoc["status"] }) {
  const map = {
    complete: { bg: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200", l: "Complete" },
    running: { bg: "bg-m3-secondary-container text-m3-on-secondary-container", l: "Running" },
    failed: { bg: "bg-m3-error-container text-m3-on-error-container", l: "Failed" },
    pending: { bg: "bg-m3-surface-container text-m3-on-surface-variant", l: "Pending" },
  } as const;
  const s = map[status];
  return <span className={"rounded-full px-2.5 py-0.5 text-[10px] font-medium " + s.bg}>{s.l}</span>;
}
