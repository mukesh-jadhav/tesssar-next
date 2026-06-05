"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Material 3 Expressive — Icon Button.
 * 40dp circular icon, tonal hover state via `.m3-icon-btn`.
 */
type IconButtonProps = {
  icon: string;
  ariaLabel: string;
  filled?: boolean;
  size?: number;
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton({ icon, ariaLabel, filled, size = 24, className, ...rest }, ref) {
    return (
      <button
        ref={ref}
        type="button"
        aria-label={ariaLabel}
        className={cn("m3-icon-btn", className)}
        {...rest}
      >
        <span
          className={cn("ms", filled && "ms-filled")}
          style={{ fontSize: size }}
          aria-hidden
        >
          {icon}
        </span>
      </button>
    );
  },
);
