import { Skeleton } from "@/components/skeleton/Skeleton";
import { SkeletonText } from "@/components/skeleton/SkeletonText";
import { ScrollFrame } from "@/components/workspace/ScrollFrame";

/**
 * Shape-matching skeleton for `/dashboard`. Mirrors the real masthead +
 * "Hello, {name}." hero + stats row + suggestions ladder, so the swap
 * to the live page is invisible to the eye except for content filling in.
 */
export default function DashboardLoading() {
  return (
    <ScrollFrame>
      <div className="mx-auto w-full max-w-[1400px] px-6 py-10 md:px-12 md:py-14 lg:px-16">
        {/* Masthead row */}
        <div className="rule-dots flex items-baseline justify-between pb-4">
          <Skeleton className="h-7 w-24 rounded-full" />
          <Skeleton className="hidden h-3 w-44 rounded-full md:block" />
        </div>

        {/* Hero — display headline + body */}
        <section className="mt-12 grid gap-12 lg:grid-cols-[1.4fr_1fr]">
          <div className="space-y-4">
            <Skeleton className="h-[clamp(3rem,9vw,8rem)] w-[12ch] max-w-full rounded-2xl" />
            <Skeleton className="h-[clamp(3rem,9vw,8rem)] w-[8ch] max-w-full rounded-2xl" />
          </div>
          <div className="flex flex-col justify-end gap-7 pb-3">
            <SkeletonText lines={3} lastLineWidth={55} />
            <div className="flex flex-wrap items-center gap-3">
              <Skeleton className="h-14 w-44 rounded-full" />
              <Skeleton className="h-14 w-40 rounded-full" />
            </div>
          </div>
        </section>

        {/* Stats row */}
        <section className="mt-20 grid gap-px overflow-hidden rounded-3xl border border-[hsl(var(--line))] bg-[hsl(var(--line))] sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-3 bg-[hsl(var(--paper))] p-6 md:p-8">
              <Skeleton className="h-3 w-20 rounded-full" />
              <Skeleton className="h-9 w-24 rounded-md" />
              <Skeleton className="h-3 w-32 rounded-full" />
            </div>
          ))}
        </section>

        {/* Suggestions */}
        <section className="mt-20">
          <div className="flex items-baseline justify-between border-b border-[hsl(var(--line))] pb-5">
            <Skeleton className="h-3 w-44 rounded-full" />
            <Skeleton className="hidden h-3 w-24 rounded-full md:block" />
          </div>
          <ul className="mt-2 divide-y divide-[hsl(var(--line))]">
            {Array.from({ length: 4 }).map((_, i) => (
              <li key={i} className="grid grid-cols-[auto_1fr_auto] items-center gap-6 px-2 py-6">
                <Skeleton className="h-7 w-10 rounded-md" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-2/3 max-w-md rounded-md" />
                  <Skeleton className="h-3 w-1/2 max-w-sm rounded-full" />
                </div>
                <Skeleton className="size-7 rounded-full" />
              </li>
            ))}
          </ul>
        </section>
      </div>
    </ScrollFrame>
  );
}
