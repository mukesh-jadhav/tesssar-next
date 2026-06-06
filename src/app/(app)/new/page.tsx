import { getSessionUser } from "@/lib/firebase/auth";
import { getBalance } from "@/lib/credits/ledger";
import { NewArchitectureForm } from "@/components/architecture/NewArchitectureForm";
import { ScrollFrame } from "@/components/workspace/ScrollFrame";
import { redirect } from "next/navigation";

export const metadata = { title: "New design" };

export default async function NewArchitecturePage({
  searchParams,
}: {
  searchParams: { seed?: string; prompt?: string };
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/new");
  const credits = await getBalance(user.uid);
  const firstName =
    (user.displayName ?? user.email).split(" ")[0]?.split("@")[0] ?? "friend";
  const seed = searchParams.seed ?? searchParams.prompt;

  return (
    <ScrollFrame>
      <div className="mx-auto w-full max-w-[1200px] px-6 py-10 md:px-12 md:py-14 lg:px-16">
      {/* Masthead */}
      <div className="rule-dots flex items-baseline justify-between pb-4">
        <span className="tag tag-accent">§ New design</span>
        <span className="eyebrow hidden md:inline">
          Credits available · <span className="text-[hsl(var(--ink))] font-medium">{credits}</span>
        </span>
      </div>

      <section className="m3-page-enter mt-12 grid gap-10 lg:grid-cols-[1.3fr_1fr] lg:gap-20">
        <h1 className="display-tight text-[clamp(3rem,9vw,8rem)] leading-[0.88] tracking-[-0.045em]">
          What can I<br />
          <span className="serif font-normal italic accent">architect</span>
          {firstName !== "friend" ? <>, {firstName}?</> : "?"}
        </h1>

        <div className="flex flex-col justify-end gap-5 pb-3">
          <p className="text-[17px] leading-[1.55] text-[hsl(var(--ink-2))] max-w-[42ch]">
            Describe the system in plain English. I&apos;ll return a full
            report — diagrams, scale tiers, INR cost estimates, risks, and the
            patterns that solve them.
          </p>
          <p className="text-[13px] text-[hsl(var(--ink-3))]">
            One credit per run · about four minutes · cancel any time.
          </p>
        </div>
      </section>

      <div className="mt-14">
        <NewArchitectureForm credits={credits} seed={seed} />
      </div>
      </div>
    </ScrollFrame>
  );
}
