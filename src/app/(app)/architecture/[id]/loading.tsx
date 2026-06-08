import { Skeleton } from "@/components/skeleton/Skeleton";
import { SkeletonText } from "@/components/skeleton/SkeletonText";
import { SkeletonDiagram } from "@/components/skeleton/SkeletonDiagram";

/**
 * Shape-matching skeleton for `/architecture/[id]`. The route mounts
 * `ArchitectureRunLive` which is itself a cockpit/streaming surface,
 * so this loading shell matches its initial frame: top crumb strip,
 * masthead, hero block, then a diagram + body skeleton placeholder.
 *
 * Once the page resolves, the live component takes over and either:
 *  (a) streams a running build (its own progress UI replaces this), or
 *  (b) renders the full ReportCockpit (which has its own page-enter motion).
 */
export default function ArchitectureLoading() {
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-[hsl(var(--paper))]">
      {/* Top strip */}
      <header className="shrink-0 flex items-center justify-between border-b border-[hsl(var(--line))] px-5 py-3">
        <div className="flex items-center gap-3">
          <Skeleton className="size-6 rounded-md" />
          <Skeleton className="h-3 w-40 rounded-full" />
        </div>
        <Skeleton className="hidden h-7 w-24 rounded-full md:block" />
      </header>

      <div className="flex-1 min-h-0 overflow-auto">
        <div className="mx-auto w-full max-w-[1320px] px-6 py-10 md:px-12 md:py-14 lg:px-16">
          {/* Masthead */}
          <div className="rule-dots flex items-baseline justify-between pb-4">
            <Skeleton className="h-7 w-32 rounded-full" />
            <Skeleton className="hidden h-3 w-40 rounded-full md:block" />
          </div>

          {/* Hero */}
          <section className="mt-8 grid gap-10 lg:grid-cols-[1.4fr_1fr]">
            <div className="space-y-4">
              <Skeleton className="h-[clamp(2.2rem,5.2vw,5.8rem)] w-[15ch] max-w-full rounded-2xl" />
              <Skeleton className="h-[clamp(2.2rem,5.2vw,5.8rem)] w-[10ch] max-w-full rounded-2xl" />
            </div>
            <div className="flex flex-col justify-end gap-4 pb-3">
              <SkeletonText lines={4} lastLineWidth={65} />
            </div>
          </section>

          {/* Diagram + body */}
          <section className="mt-16 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
            <SkeletonDiagram aspect="16/10" />
            <div className="card-paper space-y-5 p-6 md:p-8">
              <Skeleton className="h-5 w-2/3 rounded-md" />
              <SkeletonText lines={6} lastLineWidth={50} />
              <div className="border-t border-[hsl(var(--line))] pt-4">
                <SkeletonText lines={3} lastLineWidth={70} />
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
