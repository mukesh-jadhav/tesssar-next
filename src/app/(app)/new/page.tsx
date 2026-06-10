import { getSessionUser } from "@/lib/firebase/auth";
import { getBalance } from "@/lib/credits/ledger";
import { NewArchitectureForm } from "@/components/architecture/NewArchitectureForm";
import { ScrollFrame } from "@/components/workspace/ScrollFrame";
import { adminDb } from "@/lib/firebase/admin";
import type { ArchitectureDoc } from "@/types/architecture";
import type { RecentBrief } from "@/components/architecture/RecentBriefsRail";
import { ZeroCreditsLadder } from "@/components/empty/ZeroCreditsLadder";
import { canAffordRun, isUnlimited } from "@/lib/credits/display";
import { redirect } from "next/navigation";

export const metadata = { title: "New design" };

export default async function NewArchitecturePage({
  searchParams,
}: {
  searchParams: Promise<{ seed?: string; prompt?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/new");
  const credits = await getBalance(user.uid);
  const firstName =
    (user.displayName ?? user.email).split(" ")[0]?.split("@")[0] ?? "friend";
  const sp = await searchParams;
  const seed = sp.seed ?? sp.prompt;

  let recentBriefs: RecentBrief[] = [];
  try {
    const snap = await adminDb
      .collection("architectures")
      .where("uid", "==", user.uid)
      .orderBy("createdAt", "desc")
      .limit(3)
      .get();
    recentBriefs = snap.docs.map((d) => {
      const data = d.data() as ArchitectureDoc;
      return {
        id: d.id,
        prompt: data.prompt ?? "",
        status: data.status ?? "pending",
        createdAt: typeof data.createdAt === "number" ? data.createdAt : Date.now(),
      };
    });
  } catch {
    recentBriefs = [];
  }

  const outOfCredits = !isUnlimited(credits) && !canAffordRun(credits);

  return (
    <ScrollFrame>
      <div className="mx-auto w-full max-w-[1200px] px-6 py-10 md:px-12 md:py-14 lg:px-16">
      {/* Masthead */}
      <div className="rule-dots flex items-baseline justify-between pb-4">
        <span className="tag tag-accent">{outOfCredits ? "Out of credits" : "New design"}</span>
        <span className="eyebrow hidden md:inline">
          Credits available · <span className="text-[hsl(var(--ink))] font-medium">{credits}</span>
        </span>
      </div>

      {outOfCredits ? (
        <ZeroCreditsLadder />
      ) : (
        <>
          <section className="m3-page-enter mt-12 grid gap-10 lg:grid-cols-[1.3fr_1fr] lg:gap-20">
            <h1 className="display-tight text-[clamp(3rem,9vw,8rem)] leading-[0.88] tracking-[-0.045em]">
              What should we<br />
              <span className="serif font-normal italic accent">architect</span>
              {firstName !== "friend" ? <>, {firstName}?</> : "?"}
            </h1>

            <div className="flex flex-col justify-end gap-5 pb-3">
              <p className="text-[17px] leading-[1.55] text-[hsl(var(--ink-2))] max-w-[42ch]">
                The blank page is the hardest part. Drop a sentence, a wishlist,
                even a competitor you&apos;d one-up — I&apos;ll handle the diagrams,
                the math, and the patterns that hold it together.
              </p>
              <p className="text-[13px] text-[hsl(var(--ink-3))]">
                A few minutes per run · refunded automatically if something breaks.
              </p>
            </div>
          </section>

          <div className="mt-14">
            <NewArchitectureForm credits={credits} seed={seed} recentBriefs={recentBriefs} />
          </div>
        </>
      )}
      </div>
    </ScrollFrame>
  );
}
