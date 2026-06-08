import { cn } from "@/lib/utils";

type SkeletonProps = React.HTMLAttributes<HTMLDivElement>;

/**
 * Base skeleton block. Paper-toned with shimmer sweep. Compose via className.
 * Inherits the global `.shimmer` keyframe from globals.css.
 */
export function Skeleton({ className, ...rest }: SkeletonProps) {
  return (
    <div
      aria-hidden
      className={cn(
        "relative overflow-hidden rounded-lg bg-[hsl(var(--paper-2))]",
        "bg-[linear-gradient(90deg,hsl(var(--paper-2))_0%,hsl(var(--paper-3))_50%,hsl(var(--paper-2))_100%)]",
        "bg-[length:200%_100%] animate-shimmer",
        className,
      )}
      {...rest}
    />
  );
}
