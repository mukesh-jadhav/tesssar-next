import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Material 3 Expressive outlined text field.
 * Container uses `shape-corner-extra-small` (4dp) per M3; we use lg (16dp)
 * for a friendlier, more expressive look in this app.
 */
export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      ref={ref}
      className={cn(
        "flex h-12 w-full rounded-lg border bg-m3-surface px-4 py-2 text-[15px] text-m3-on-surface",
        "border-m3-outline transition-[border-color,box-shadow,background-color] duration-m3-default-effects ease-m3-default-effects",
        "file:border-0 file:bg-transparent file:text-sm file:font-medium",
        "placeholder:text-m3-on-surface-variant/80",
        "hover:border-m3-on-surface focus-visible:border-m3-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-m3-primary",
        "disabled:cursor-not-allowed disabled:opacity-40",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "flex min-h-[120px] w-full rounded-lg border bg-m3-surface px-4 py-3 text-[15px] text-m3-on-surface",
        "border-m3-outline transition-[border-color,box-shadow,background-color] duration-m3-default-effects ease-m3-default-effects",
        "placeholder:text-m3-on-surface-variant/80",
        "hover:border-m3-on-surface focus-visible:border-m3-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-m3-primary",
        "disabled:cursor-not-allowed disabled:opacity-40 scrollbar-thin",
        className,
      )}
      {...props}
    />
  ),
);
Textarea.displayName = "Textarea";
