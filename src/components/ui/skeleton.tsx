import { cn } from "@/lib/utils";

/**
 * Material 3 Expressive loading placeholder.
 * Uses a breathing opacity + a soft shimmer sweep on top.
 */
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-m3-surface-container-high m3-breathe",
        "before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.8s_infinite] before:bg-gradient-to-r before:from-transparent before:via-m3-surface-container-highest/80 before:to-transparent",
        className,
      )}
      {...props}
    />
  );
}
