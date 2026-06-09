"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { VariantHeader } from "./VariantHeader";

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

/**
 * Minimum shape every lens's variant must satisfy. Lenses are free to
 * pass richer types (e.g. `CockpitVariant` with `architecture`) — the
 * generic `T` flows through to the `renderCell` callback.
 */
interface ColumnVariant {
  runId: string;
  variantId: string;
  label: string;
  failed: boolean;
}

/**
 * Generic N-column stage layout reused by every lens. Each lens passes
 * a `renderCell(variant)` to fill the body. Without `renderCell` we
 * render an animated placeholder.
 */
export function LensColumns<T extends ColumnVariant>({
  variants,
  renderCell,
  emptyMessage,
}: {
  variants: T[];
  renderCell?: (v: T) => ReactNode;
  emptyMessage?: string;
}) {
  return (
    <div
      className={cn(
        "grid gap-4",
        variants.length === 2 && "md:grid-cols-2",
        variants.length === 3 && "lg:grid-cols-3",
      )}
    >
      {variants.map((v, i) => (
        <motion.section
          key={v.runId}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.42,
            ease: EASE_OUT_EXPO,
            delay: 0.04 * i,
          }}
          className="flex flex-col min-h-[320px]"
        >
          <VariantHeader label={v.label} runId={v.runId} variantId={v.variantId} failed={v.failed} />
          <div
            className={cn(
              "flex-1 rounded-b-lg border-x border-b border-[hsl(var(--line))] bg-[hsl(var(--card))] p-5",
              v.failed && "bg-[repeating-linear-gradient(135deg,transparent_0_8px,hsl(var(--bad)/0.04)_8px_16px)]",
            )}
          >
            {v.failed ? (
              <div className="grid h-full place-items-center text-center">
                <div className="max-w-[220px]">
                  <span
                    className="ms text-[28px] text-[hsl(var(--bad))]"
                    aria-hidden
                  >
                    error
                  </span>
                  <p className="mt-2 text-[13px] text-[hsl(var(--ink-2))]">
                    This variant failed. Credit refunded — re-run from the
                    header to fill the column.
                  </p>
                </div>
              </div>
            ) : renderCell ? (
              renderCell(v)
            ) : (
              <PlaceholderBody message={emptyMessage} />
            )}
          </div>
        </motion.section>
      ))}
    </div>
  );
}

function PlaceholderBody({ message }: { message?: string }) {
  return (
    <div className="flex flex-col gap-3">
      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[hsl(var(--ink-3))]">
        Coming soon
      </span>
      <p className="text-[14px] text-[hsl(var(--ink-2))] leading-relaxed">
        {message ??
          "This lens lands in the next release. The shell, scenario state, and decision tray are all live — pick variants for each slice to preview the synthesis flow."}
      </p>
      <div className="mt-2 flex flex-col gap-2">
        <PulseBar widthClass="w-3/4" />
        <PulseBar widthClass="w-2/3" delay={0.08} />
        <PulseBar widthClass="w-1/2" delay={0.16} />
      </div>
    </div>
  );
}

function PulseBar({
  widthClass,
  delay = 0,
}: {
  widthClass: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0.25 }}
      animate={{ opacity: [0.25, 0.55, 0.25] }}
      transition={{ duration: 2.2, repeat: Infinity, delay, ease: "easeInOut" }}
      className={cn(
        "h-2 rounded-full bg-[hsl(var(--paper-3))]",
        widthClass,
      )}
    />
  );
}
