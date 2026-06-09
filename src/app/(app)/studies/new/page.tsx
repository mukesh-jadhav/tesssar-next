import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/firebase/auth";
import { getBalance } from "@/lib/credits/ledger";
import { ScrollFrame } from "@/components/workspace/ScrollFrame";
import { StudyBuilder } from "@/components/studies/StudyBuilder";

export const metadata = { title: "New comparison study" };

export default async function NewStudyPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/studies/new");
  const credits = await getBalance(user.uid);
  const firstName =
    (user.displayName ?? user.email).split(" ")[0]?.split("@")[0] ?? "friend";

  return (
    <ScrollFrame>
      <div className="mx-auto w-full max-w-[1200px] px-6 py-10 md:px-12 md:py-14 lg:px-16">
        <div className="rule-dots flex items-baseline justify-between pb-4">
          <span className="tag tag-accent">Comparison study</span>
          <span className="eyebrow hidden md:inline">
            Credits available ·{" "}
            <span className="text-[hsl(var(--ink))] font-medium">
              {credits}
            </span>
          </span>
        </div>

        <section className="m3-page-enter mt-12 grid gap-10 lg:grid-cols-[1.3fr_1fr] lg:gap-20">
          <h1 className="display-tight text-[clamp(3rem,9vw,8rem)] leading-[0.88] tracking-[-0.045em]">
            Run them<br />
            <span className="serif font-normal italic accent">side-by-side</span>
            {firstName !== "friend" ? <>, {firstName}.</> : "."}
          </h1>

          <div className="flex flex-col justify-end gap-5 pb-3">
            <p className="text-[17px] leading-[1.55] text-[hsl(var(--ink-2))] max-w-[42ch]">
              Same brief. Multiple architectures. Pick the axis that matters
              — cloud, style, datastore, deployment, or cost — and the
              architect designs each variant in parallel.
            </p>
            <p className="text-[13px] text-[hsl(var(--ink-3))]">
              ~3 minutes wall-clock · partial failures refund the failed lane.
            </p>
          </div>
        </section>

        <div className="mt-14">
          <StudyBuilder credits={credits} />
        </div>
      </div>
    </ScrollFrame>
  );
}
