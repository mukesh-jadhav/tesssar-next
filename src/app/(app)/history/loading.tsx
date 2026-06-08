import { Skeleton } from "@/components/skeleton/Skeleton";
import { SkeletonText } from "@/components/skeleton/SkeletonText";
import { ScrollFrame } from "@/components/workspace/ScrollFrame";

/**
 * Shape-matching skeleton for `/history`. Renders the masthead, the big
 * "The Library." hero, and a single bucketed list (e.g. "Today") with
 * a few placeholder rows. Multiple buckets would just feel chatty while
 * loading; one is enough to communicate "list of past designs is on its way".
 */
export default function HistoryLoading() {
  return (
    <ScrollFrame>
      <div className="mx-auto w-full max-w-[1400px] px-6 py-10 md:px-12 md:py-14 lg:px-16">
        {/* Masthead */}
        <div className="rule-dots flex items-baseline justify-between pb-4">
          <Skeleton className="h-7 w-24 rounded-full" />
          <Skeleton className="hidden h-3 w-28 rounded-full md:block" />
        </div>

        {/* Hero */}
        <section className="mt-12 grid gap-10 lg:grid-cols-[1.4fr_1fr]">
          <div className="space-y-4">
            <Skeleton className="h-[clamp(3rem,9vw,8rem)] w-[6ch] max-w-full rounded-2xl" />
            <Skeleton className="h-[clamp(3rem,9vw,8rem)] w-[10ch] max-w-full rounded-2xl" />
          </div>
          <div className="flex flex-col justify-end gap-6 pb-3">
            <SkeletonText lines={2} lastLineWidth={65} />
            <Skeleton className="h-11 w-44 rounded-full" />
          </div>
        </section>

        {/* Bucket */}
        <section className="mt-20">
          <div className="flex items-baseline justify-between border-b border-[hsl(var(--line))] pb-5">
            <Skeleton className="h-3 w-16 rounded-full" />
            <Skeleton className="h-3 w-6 rounded-full" />
          </div>
          <ul className="mt-2 divide-y divide-[hsl(var(--line))]">
            {Array.from({ length: 5 }).map((_, i) => (
              <li
                key={i}
                className="grid grid-cols-[auto_1fr_auto] items-center gap-6 px-2 py-6"
              >
                <Skeleton className="h-7 w-12 rounded-md" />
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-6 w-1/2 max-w-md rounded-md" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                  <Skeleton className="h-3 w-3/4 max-w-xl rounded-full" />
                </div>
                <Skeleton className="hidden h-3 w-20 rounded-full sm:block" />
              </li>
            ))}
          </ul>
        </section>
      </div>
    </ScrollFrame>
  );
}
