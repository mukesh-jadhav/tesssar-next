"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Material 3 Expressive — Segmented Buttons.
 * Single- or multi-select group of buttons sharing a container shape.
 */
type Segment = {
  value: string;
  label: string;
  icon?: string;
};

export function SegmentedButtons({
  segments,
  value,
  onChange,
  className,
  size = "md",
}: {
  segments: Segment[];
  value: string;
  onChange: (v: string) => void;
  className?: string;
  size?: "sm" | "md";
}) {
  const h = size === "sm" ? "h-9" : "h-11";
  return (
    <div
      role="tablist"
      className={cn(
        "inline-flex rounded-full border border-m3-outline-variant bg-m3-surface-container-low p-1",
        h,
        className,
      )}
    >
      {segments.map((s) => {
        const active = value === s.value;
        return (
          <button
            key={s.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(s.value)}
            className={cn(
              "state-layer press relative inline-flex items-center gap-1.5 rounded-full px-3.5 text-[13px] font-medium",
              "transition-colors duration-m3-default-effects ease-m3-default-effects",
              active
                ? "bg-m3-secondary-container text-m3-on-secondary-container"
                : "text-m3-on-surface-variant hover:text-m3-on-surface",
            )}
          >
            {active && <span className="ms text-[16px]" aria-hidden>check</span>}
            {s.icon && !active && <span className="ms text-[16px]" aria-hidden>{s.icon}</span>}
            <span>{s.label}</span>
          </button>
        );
      })}
    </div>
  );
}
