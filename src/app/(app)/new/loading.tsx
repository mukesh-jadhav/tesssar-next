import { Skeleton } from "@/components/skeleton/Skeleton";
import { SkeletonText } from "@/components/skeleton/SkeletonText";
import { ScrollFrame } from "@/components/workspace/ScrollFrame";

/**
 * Shape-matching skeleton for `/new`. Mirrors the masthead, the "What can I
 * architect?" hero, and the composer card (textarea + submit row). No
 * `RecentBriefsRail` placeholder \u2014 it only shows on xl: and would just be
 * three more grey ghosts in the corner.
 */
export default function NewLoading() {
  return (
    <ScrollFrame>
      <div className="mx-auto w-full max-w-[1200px] px-6 py-10 md:px-12 md:py-14 lg:px-16">
        {/* Masthead */}
        <div className="rule-dots flex items-baseline justify-between pb-4">
          <Skeleton className="h-7 w-28 rounded-full" />
          <Skeleton className="hidden h-3 w-40 rounded-full md:block" />
        </div>

        {/* Hero */}
        <section className="mt-12 grid gap-10 lg:grid-cols-[1.3fr_1fr] lg:gap-20">
          <div className="space-y-4">
            <Skeleton className="h-[clamp(3rem,9vw,8rem)] w-[10ch] max-w-full rounded-2xl" />
            <Skeleton className="h-[clamp(3rem,9vw,8rem)] w-[12ch] max-w-full rounded-2xl" />
          </div>
          <div className="flex flex-col justify-end gap-5 pb-3">
            <SkeletonText lines={3} lastLineWidth={70} />
            <Skeleton className="h-3 w-2/3 max-w-sm rounded-full" />
          </div>
        </section>

        {/* Composer card */}
        <section className="mt-16">
          <div className="card-paper p-6 md:p-8">
            {/* Header strip */}
            <div className="mb-5 flex items-center justify-between">
              <Skeleton className="h-3 w-32 rounded-full" />
              <Skeleton className="h-7 w-44 rounded-full" />
            </div>
            {/* Textarea body */}
            <div className="space-y-3">
              <Skeleton className="h-4 w-11/12 rounded-md" />
              <Skeleton className="h-4 w-10/12 rounded-md" />
              <Skeleton className="h-4 w-9/12 rounded-md" />
              <Skeleton className="h-4 w-7/12 rounded-md" />
              <div className="h-32" />
            </div>
            {/* Footer row */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-[hsl(var(--line))] pt-5">
              <Skeleton className="h-3 w-48 rounded-full" />
              <Skeleton className="h-14 w-56 rounded-full" />
            </div>
          </div>
        </section>
      </div>
    </ScrollFrame>
  );
}
