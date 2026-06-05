"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Material 3 Expressive — Floating Action Button.
 * Sizes: sm 40, md 56 (default), lg 96, extended (pill with label).
 * Variants: primary | surface | secondary | tertiary
 */
type FabVariant = "primary" | "surface" | "secondary" | "tertiary";
type FabSize = "sm" | "md" | "lg" | "extended";

const VARIANT: Record<FabVariant, string> = {
  primary: "bg-m3-primary-container text-m3-on-primary-container",
  surface: "bg-m3-surface-container-high text-m3-primary",
  secondary: "bg-m3-secondary-container text-m3-on-secondary-container",
  tertiary: "bg-m3-tertiary-container text-m3-on-tertiary-container",
};

const SIZE: Record<FabSize, string> = {
  sm: "size-10 rounded-xl text-[20px]",
  md: "size-14 rounded-2xl text-[24px]",
  lg: "size-24 rounded-[28px] text-[36px]",
  extended: "h-14 rounded-2xl px-5 text-[15px] gap-2.5",
};

type BaseProps = {
  icon?: string;          // Material Symbols ligature
  label?: string;         // For extended FAB only
  variant?: FabVariant;
  size?: FabSize;
  className?: string;
  children?: React.ReactNode;
};

export interface FabProps extends BaseProps, Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "type" | "children"> {
  href?: string;
}

export function Fab(props: FabProps) {
  const { icon, label, variant = "primary", size = "md", className, children, href, ...rest } = props;
  const isExtended = size === "extended";

  const classes = cn(
    "state-layer press m3-squircle-press inline-flex items-center justify-center",
    "shadow-m3-3 hover:shadow-m3-4",
    "transition-all duration-m3-default-effects ease-m3-fast-spatial",
    VARIANT[variant],
    SIZE[size],
    className,
  );

  const content = (
    <>
      {icon && <span className={cn("ms ms-bold", isExtended && "text-[20px]")} aria-hidden>{icon}</span>}
      {(label || children) && <span className="font-medium">{label ?? children}</span>}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={classes} onClick={rest.onClick as React.MouseEventHandler<HTMLAnchorElement> | undefined}>
        {content}
      </Link>
    );
  }
  return (
    <button type="button" className={classes} {...rest}>
      {content}
    </button>
  );
}
