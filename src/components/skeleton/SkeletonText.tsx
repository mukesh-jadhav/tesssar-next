import { Skeleton } from "./Skeleton";
import { cn } from "@/lib/utils";

type SkeletonTextProps = {
  /** Number of lines to render. Default 3. */
  lines?: number;
  /** Width of last line as a percentage of full. Default 70 (mimics natural paragraph rag). */
  lastLineWidth?: number;
  className?: string;
};

/**
 * Multi-line text skeleton. Last line is shorter for realism.
 */
export function SkeletonText({
  lines = 3,
  lastLineWidth = 70,
  className,
}: SkeletonTextProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => {
        const isLast = i === lines - 1;
        return (
          <Skeleton
            key={i}
            className="h-3 rounded-full"
            style={isLast ? { width: `${lastLineWidth}%` } : undefined}
          />
        );
      })}
    </div>
  );
}
