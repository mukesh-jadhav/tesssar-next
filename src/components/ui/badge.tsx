import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-md border px-2.5 py-0.5 text-xs font-medium tracking-[0.02em] transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-m3-primary text-m3-on-primary",
        secondary: "border-transparent bg-m3-secondary-container text-m3-on-secondary-container",
        tertiary: "border-transparent bg-m3-tertiary-container text-m3-on-tertiary-container",
        outline: "border-m3-outline-variant text-m3-on-surface",
        destructive: "border-transparent bg-m3-error-container text-m3-on-error-container",
        success: "border-transparent bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
        warning: "border-transparent bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
        info: "border-transparent bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-200",
        brand: "border-m3-outline-variant bg-m3-surface-container-high text-m3-on-surface",
        accent: "border-transparent bg-m3-primary-container text-m3-on-primary-container",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
