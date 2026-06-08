import { Skeleton } from "./Skeleton";
import { SkeletonText } from "./SkeletonText";
import { cn } from "@/lib/utils";

type SkeletonCardProps = {
  /** Show a title block above body lines. Default true. */
  withTitle?: boolean;
  /** Number of body lines. Default 3. */
  lines?: number;
  className?: string;
};

/**
 * Paper-bordered card skeleton matching `.card-paper` shape. Use for
 * dashboard tiles, feature cards, etc.
 */
export function SkeletonCard({ withTitle = true, lines = 3, className }: SkeletonCardProps) {
  return (
    <div
      className={cn(
        "card-paper p-6 md:p-8 space-y-5",
        className,
      )}
    >
      {withTitle && <Skeleton className="h-5 w-2/3 rounded-md" />}
      <SkeletonText lines={lines} />
    </div>
  );
}
