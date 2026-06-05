import { getSessionUser } from "@/lib/firebase/auth";
import { getBalance } from "@/lib/credits/ledger";
import { NewArchitectureForm } from "@/components/architecture/NewArchitectureForm";

export const metadata = { title: "New architecture" };

export default async function NewArchitecturePage({
  searchParams,
}: {
  searchParams: { seed?: string };
}) {
  const user = (await getSessionUser())!;
  const credits = await getBalance(user.uid);
  const firstName =
    (user.displayName ?? user.email).split(" ")[0]?.split("@")[0] ?? "friend";

  return (
    <div className="mx-auto flex w-full max-w-[920px] flex-col px-6 py-12 md:px-10 md:py-16">
      <section className="m3-page-enter text-center">
        <h1 className="display text-balance text-[clamp(2rem,4.8vw,3.5rem)] leading-[1.04]">
          What can I <span className="hero-gradient">architect</span> for you{firstName !== "friend" ? `, ${firstName}` : ""}?
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-[16px] leading-relaxed text-m3-on-surface-variant">
          Describe the system in plain English. I'll design it — diagrams,
          scale tiers, INR cost estimates, risks, and the patterns that solve them.
        </p>
      </section>

      <div className="mt-10">
        <NewArchitectureForm credits={credits} seed={searchParams.seed} />
      </div>
    </div>
  );
}
