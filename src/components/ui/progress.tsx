"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";

export const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & { value?: number }
>(({ className, value, ...props }, ref) => {
  const v = value || 0;
  return (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn(
        "relative h-1.5 w-full overflow-hidden rounded-full bg-secondary",
        className,
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className="relative h-full w-full flex-1 overflow-hidden bg-foreground transition-transform duration-700 ease-out-expo"
        style={{ transform: `translateX(-${100 - v}%)` }}
      >
        {v < 100 && (
          <span
            aria-hidden
            className="absolute inset-0 animate-shimmer bg-[length:200%_100%]"
            style={{
              backgroundImage:
                "linear-gradient(90deg, transparent, hsl(var(--background) / 0.55), transparent)",
            }}
          />
        )}
      </ProgressPrimitive.Indicator>
    </ProgressPrimitive.Root>
  );
});
Progress.displayName = "Progress";
