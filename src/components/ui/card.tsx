import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Material 3 Expressive Card.
 *   - filled   → surface-container-highest, no border (default)
 *   - outlined → outline-variant border, surface
 *   - elevated → surface-container-low with M3 elevation
 *
 * Default radius is `lg` (16dp / shape-corner-large).
 * `interactive` adds hover lift + spring + state-layer.
 */
const cardVariants = cva(
  "text-m3-on-surface rounded-lg transition-[transform,box-shadow,background-color] duration-m3-default-effects ease-m3-default-effects",
  {
    variants: {
      variant: {
        filled: "bg-m3-surface-container-low",
        outlined: "border border-m3-outline-variant bg-m3-surface",
        elevated: "bg-m3-surface-container-low shadow-m3-1",
      },
    },
    defaultVariants: { variant: "filled" },
  },
);

export const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> &
    VariantProps<typeof cardVariants> & { interactive?: boolean }
>(({ className, variant, interactive = false, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      cardVariants({ variant }),
      interactive &&
        "state-layer cursor-pointer hover:-translate-y-0.5 hover:shadow-m3-2 ease-m3-fast-spatial",
      className,
    )}
    {...props}
  />
));
Card.displayName = "Card";

export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
  ),
);
CardHeader.displayName = "CardHeader";

export const CardTitle = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("text-lg font-medium leading-tight tracking-tight", className)}
      {...props}
    />
  ),
);
CardTitle.displayName = "CardTitle";

export const CardDescription = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("text-sm text-m3-on-surface-variant", className)} {...props} />
  ),
);
CardDescription.displayName = "CardDescription";

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
  ),
);
CardContent.displayName = "CardContent";

export const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />
  ),
);
CardFooter.displayName = "CardFooter";

export { cardVariants };
