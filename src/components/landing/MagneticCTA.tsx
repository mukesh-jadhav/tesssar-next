"use client";

import Link from "next/link";
import { Magnetic } from "@/components/motion/Magnetic";
import { type ReactNode } from "react";

type MagneticCTAProps = {
  href: string;
  children: ReactNode;
  variant?: "accent" | "ink" | "ghost";
  size?: "md" | "lg";
  className?: string;
  /** Strength of magnetic pull. 0..1. Default 0.22. */
  strength?: number;
};

const variantClass: Record<NonNullable<MagneticCTAProps["variant"]>, string> = {
  accent: "btn-pill btn-pill-accent",
  ink: "btn-pill",
  ghost: "btn-pill btn-pill-ghost",
};

const sizeClass: Record<NonNullable<MagneticCTAProps["size"]>, string> = {
  md: "",
  lg: "btn-pill-lg",
};

/**
 * Primary-CTA wrapper. Adds gentle cursor-magnetism around the button.
 * Use sparingly — only on a handful of buttons per page or the effect dulls.
 */
export function MagneticCTA({
  href,
  children,
  variant = "accent",
  size = "lg",
  className,
  strength = 0.22,
}: MagneticCTAProps) {
  return (
    <Magnetic strength={strength} maxDistance={10}>
      <Link
        href={href}
        className={[variantClass[variant], sizeClass[size], className].filter(Boolean).join(" ")}
      >
        {children}
      </Link>
    </Magnetic>
  );
}
