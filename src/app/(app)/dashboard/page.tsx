import Link from "next/link";
import { getSessionUser } from "@/lib/firebase/auth";
import { adminDb } from "@/lib/firebase/admin";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ArchitectureDoc } from "@/types/architecture";
import { formatDate, truncate } from "@/lib/utils";
import { getBalance } from "@/lib/credits/ledger";

/** Gemini-style suggestion chips that route to the composer with a seed prompt. */
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
    label: "Build a low-latency e-commerce backend",
    seed:
      "Design a low-latency e-commerce backend for India: 1M MAU, 100k peak concurrent at sale times, INR pricing. Recommend a Google Cloud architecture and risks.",
  },
  {
    icon: "school",
    label: "EdTech platform with live classes",
    seed:
      "EdTech platform with live classes, recorded content, quizzes. 500k students across India, peak 50k concurrent on live sessions. Architect it on Google Cloud.",
  },
] as const;

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
  const firstName =
    (user.displayName ?? user.email).split(" ")[0]?.split("@")[0] ?? "friend";

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col px-6 py-10 md:px-10 md:py-16 lg:px-12">
      {/* HERO greeting — M3 Expressive hero moment */}
      <section className="m3-page-enter">
        <p className="text-m3-on-surface-variant text-sm">
          {greetingFor(new Date())}
        </p>
        <h1 className="display mt-2 text-balance text-[clamp(2.5rem,6vw,4.5rem)] leading-[1.04]">
          <span className="hero-gradient">{firstName}</span>
        </h1>
        <p className="mt-4 max-w-2xl text-[17px] leading-relaxed text-m3-on-surface-variant">
          What system would you like to architect today? Describe it in plain English
          and Tessar will design it — diagrams, scale tiers, INR costs, and risks.
        </p>

        {/* Suggestion chips */}
        <div className="m3-stagger mt-8 grid gap-3 sm:grid-cols-2">
          {SUGGESTIONS.map((s) => (
            <Link
              key={s.label}
              href={`/new?seed=${encodeURIComponent(s.seed)}`}
              className="state-layer press group/sug flex items-center gap-4 rounded-2xl bg-m3-surface-container-low p-4 transition-shadow duration-m3-default-effects ease-m3-default-effects hover:shadow-m3-1"
            >
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-m3-primary-container text-m3-on-primary-container">
                <span className="ms text-[22px]" aria-hidden>
                  {s.icon}
                </span>
              </span>
              <span className="text-[15px] text-m3-on-surface">{s.label}</span>
              <span
                aria-hidden
                className="ms ml-auto text-[20px] text-m3-on-surface-variant opacity-0 transition-all duration-m3-default-effects ease-m3-default-spatial group-hover/sug:translate-x-0.5 group-hover/sug:opacity-100"
              >
                arrow_forward
              </span>
            </Link>
          ))}
        </div>

        {/* Primary CTA — extended FAB style */}
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            href="/new"
            className="state-layer press inline-flex h-14 items-center gap-2 rounded-2xl bg-m3-primary px-6 text-[15px] font-medium text-m3-on-primary shadow-m3-2 transition-shadow duration-m3-default-effects ease-m3-default-effects hover:shadow-m3-3"
          >
            <span className="ms text-[20px]" aria-hidden>
              edit_square
            </span>
            New architecture
          </Link>
          <Link
            href="/sample"
            className="state-layer press inline-flex h-14 items-center gap-2 rounded-2xl border border-m3-outline px-6 text-[15px] font-medium text-m3-primary"
          >
            <span className="ms text-[20px]" aria-hidden>
              auto_awesome
            </span>
            See a sample
          </Link>
          {credits === 0 && (
            <Link
              href="/pricing"
              className="ml-auto inline-flex h-10 items-center gap-2 rounded-full bg-m3-tertiary-container px-4 text-[13px] font-medium text-m3-on-tertiary-container"
            >
              <span className="ms text-[18px]" aria-hidden>
                diamond
              </span>
              Out of credits · top up
            </Link>
          )}
        </div>
      </section>

      {/* Recent runs */}
      {recent.length > 0 && (
        <section className="mt-20">
          <div className="mb-5 flex items-end justify-between">
            <div>
              <h2 className="display text-[clamp(1.5rem,2.4vw,1.875rem)] leading-tight">
                Recent
              </h2>
              <p className="mt-1 text-sm text-m3-on-surface-variant">
                Your last {recent.length} architectures
              </p>
            </div>
            <Link
              href="/history"
              className="state-layer press inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-sm text-m3-primary"
            >
              View all
              <span className="ms text-[18px]" aria-hidden>
                arrow_forward
              </span>
            </Link>
          </div>
          <div className="m3-stagger grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {recent.map((a) => (
              <Link key={a.id} href={`/architecture/${a.id}`}>
                <Card interactive className="h-full p-5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-[15px] font-medium leading-snug text-m3-on-surface">
                      {a.architecture?.meta.title ?? "Untitled"}
                    </h3>
                    <Status status={a.status} />
                  </div>
                  <p className="mt-2 text-[13px] leading-relaxed text-m3-on-surface-variant">
                    {truncate(a.prompt, 140)}
                  </p>
                  <div className="mt-4 flex items-center justify-between text-[12px] text-m3-on-surface-variant">
                    <span>{formatDate(a.createdAt)}</span>
                    {a.architecture && (
                      <Badge variant="secondary" className="text-[11px]">
                        {a.architecture.meta.domain}
                      </Badge>
                    )}
                  </div>
                </Card>
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

function Status({ status }: { status: ArchitectureDoc["status"] }) {
  if (status === "complete")
    return (
      <Badge variant="secondary" className="bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
        Complete
      </Badge>
    );
  if (status === "running") return <Badge variant="tertiary">Running</Badge>;
  if (status === "failed") return <Badge variant="destructive">Failed</Badge>;
  return <Badge variant="outline">Pending</Badge>;
}
