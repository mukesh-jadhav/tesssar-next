"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Material 3 Expressive — Chip.
 * Types: assist | filter | input | suggestion
 * Filter chips can be selected (carry a checkmark icon).
 */
type ChipType = "assist" | "filter" | "input" | "suggestion";

export interface ChipProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "type"> {
  type?: ChipType;
  icon?: string;            // Material Symbols ligature
  trailingIcon?: string;
  selected?: boolean;
  href?: string;
  children: React.ReactNode;
  className?: string;
}

export function Chip(props: ChipProps) {
  const { type = "assist", icon, trailingIcon, selected, children, className, href, ...rest } = props;

  const base = cn(
    "state-layer press inline-flex h-9 items-center gap-1.5 rounded-md",
    "border px-3.5 text-[13px] font-medium",
    "transition-all duration-m3-default-effects ease-m3-default-effects",
  );

  const variant = cn(
    type === "assist" &&
      "border-m3-outline-variant bg-transparent text-m3-on-surface hover:bg-m3-on-surface/[0.05]",
    type === "suggestion" &&
      "border-m3-outline-variant bg-m3-surface-container-low text-m3-on-surface hover:bg-m3-surface-container",
    type === "input" &&
      "border-m3-outline-variant bg-m3-surface-container-low text-m3-on-surface hover:bg-m3-surface-container",
    type === "filter" && !selected &&
      "border-m3-outline-variant bg-transparent text-m3-on-surface hover:bg-m3-on-surface/[0.05]",
    type === "filter" && selected &&
      "border-transparent bg-m3-secondary-container text-m3-on-secondary-container",
  );

  const inner = (
    <>
      {type === "filter" && selected && (
        <span className="ms text-[16px]" aria-hidden>check</span>
      )}
      {icon && !(type === "filter" && selected) && (
        <span className="ms text-[16px]" aria-hidden>{icon}</span>
      )}
      <span>{children}</span>
      {trailingIcon && (
        <span className="ms text-[16px] opacity-70" aria-hidden>{trailingIcon}</span>
      )}
    </>
  );

  if (href) {
    return (
      <Link href={href} onClick={rest.onClick as React.MouseEventHandler<HTMLAnchorElement> | undefined} className={cn(base, variant, className)}>
        {inner}
      </Link>
    );
  }
  return (
    <button type="button" {...rest} className={cn(base, variant, className)}>
      {inner}
    </button>
  );
}
