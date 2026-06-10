import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Material 3 Expressive Button.
 *
 * Variants follow the M3 common-buttons spec:
 *   - filled    → high emphasis, primary action (default)
 *   - tonal     → medium emphasis, secondary-container fill
 *   - elevated  → tonal w/ elevation, low-contrast surfaces
 *   - outlined  → medium emphasis, outline-only
 *   - text      → low emphasis, no container
 *   - fab       → floating action button
 *
 * Shape is pill (full) by default per M3 Expressive.
 */
const buttonVariants = cva(
  [
    "state-layer press group/btn relative inline-flex items-center justify-center gap-2",
    "whitespace-nowrap font-medium tracking-[0.00625em] select-none",
    "transition-[transform,background-color,color,box-shadow,border-color,opacity]",
    "duration-m3-fast-effects ease-m3-default-effects",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "disabled:pointer-events-none disabled:opacity-40",
    "[&_svg]:size-[18px] [&_svg]:shrink-0",
    "[&_svg]:transition-transform [&_svg]:duration-m3-default-effects [&_svg]:ease-m3-default-effects",
  ].join(" "),
  {
    variants: {
      variant: {
        filled: "bg-m3-primary text-m3-on-primary",
        default: "bg-m3-primary text-m3-on-primary",
        brand: "bg-m3-primary text-m3-on-primary",
        tonal: "bg-m3-secondary-container text-m3-on-secondary-container",
        secondary: "bg-m3-secondary-container text-m3-on-secondary-container",
        elevated:
          "bg-m3-surface-container-low text-m3-primary",
        outlined:
          "border border-m3-outline bg-transparent text-m3-primary hover:border-m3-primary",
        outline:
          "border border-m3-outline bg-transparent text-m3-primary hover:border-m3-primary",
        text: "bg-transparent text-m3-primary",
        ghost: "bg-transparent text-m3-on-surface",
        destructive:
          "bg-m3-error text-m3-on-error",
        link: "text-m3-primary underline-offset-4 hover:underline",
        fab: "bg-m3-primary-container text-m3-on-primary-container",
      },
      size: {
        xs: "h-8 px-3 text-xs",
        sm: "h-9 px-3.5 text-[13px]",
        default: "h-10 px-5 text-sm",
        lg: "h-11 px-6 text-[15px]",
        xl: "h-14 px-8 text-base",
        icon: "size-10",
        fab: "size-14",
        "fab-extended": "h-14 px-5 text-base",
      },
    },
    defaultVariants: { variant: "filled", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };
