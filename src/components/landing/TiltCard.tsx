"use client";

import { Tilt } from "@/components/motion/Tilt";
import { type ReactNode } from "react";

/**
 * Subtle 3° tilt wrapper for feature/step/sample cards. Wraps the existing
 * card surface; the inner card is responsible for its own styling.
 */
export function TiltCard({
  children,
  className,
  max = 3,
}: {
  children: ReactNode;
  className?: string;
  max?: number;
}) {
  return (
    <Tilt max={max} perspective={1000} className={className}>
      {children}
    </Tilt>
  );
}
