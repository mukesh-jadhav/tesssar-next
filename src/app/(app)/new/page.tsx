import { getSessionUser } from "@/lib/firebase/auth";
import { getBalance } from "@/lib/credits/ledger";
import { NewArchitectureForm } from "@/components/architecture/NewArchitectureForm";

export const metadata = { title: "New design" };

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
    <div className="relative mx-auto flex w-full max-w-[960px] flex-col px-6 py-16 md:py-24">
      {/* Ambient shapes */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] overflow-hidden">
        <div className="absolute left-[10%] top-10 size-72 rounded-full bg-m3-primary-container/45 blur-[100px] m3-shape-a" />
        <div className="absolute right-[10%] top-32 size-80 rounded-full bg-m3-tertiary-container/45 blur-[110px] m3-shape-b" />
      </div>

      <section className="m3-page-enter text-center">
        <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-m3-on-surface-variant">
          New design
        </div>
        <h1 className="display mt-3 text-balance text-[clamp(2.25rem,5vw,3.75rem)] leading-[1.04]">
          What can I{" "}
          <span className="hero-gradient inline-block">architect</span>
          {firstName !== "friend" ? `, ${firstName}` : ""}?
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-[16px] leading-relaxed text-m3-on-surface-variant">
          Describe the system in plain English. I&apos;ll design it — diagrams,
          scale tiers, INR cost estimates, risks, and the patterns that solve
          them.
        </p>
      </section>

      <div className="mt-10">
        <NewArchitectureForm credits={credits} seed={searchParams.seed} />
      </div>
    </div>
  );
}
