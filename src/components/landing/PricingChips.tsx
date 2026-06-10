"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useReducedMotionSafe } from "@/components/motion/useReducedMotionSafe";

type Chip = {
  label: string;
  price: string;
  popular?: boolean;
};

const CHIPS: Chip[] = [
  { label: "Solo",    price: "₹300" },
  { label: "Trio",    price: "₹840", popular: true },
  { label: "Sprint",  price: "₹2,500" },
  { label: "Studio",  price: "₹10,000" },
];

/**
 * Four-chip pricing strip that lives inside the landing pricing teaser.
 * Each chip lifts on hover. The "Trio" chip carries an accent ring as the
 * popular default; clicking any chip navigates to /pricing with that pack
 * pre-selected via hash.
 */
export function PricingChips() {
  const reduced = useReducedMotionSafe();

  return (
    <div className="mt-8 flex flex-wrap gap-2.5" role="list">
      {CHIPS.map((chip) => {
        const isPopular = !!chip.popular;
        const base =
          "group relative inline-flex items-center gap-2 border px-4 py-2 transition-colors";
        const ringClass = isPopular
          ? "border-[hsl(var(--accent))] bg-[hsl(var(--accent-paper))] text-[hsl(var(--accent-ink))]"
          : "border-[hsl(var(--line))] bg-[hsl(var(--card))] text-[hsl(var(--ink))] hover:border-[hsl(var(--line-2))]";

        return (
          <motion.div
            key={chip.label}
            role="listitem"
            whileHover={reduced ? undefined : { y: -3 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className={isPopular ? "scale-[1.04]" : undefined}
          >
            <Link
              href={`/pricing#${chip.label.toLowerCase()}`}
              className={`${base} ${ringClass}`}
            >
              <span className="font-mono text-[10.5px] uppercase tracking-[0.16em]">
                {chip.label}
              </span>
              <span className="display text-[14px] tabular-nums tracking-[-0.01em]">
                {chip.price}
              </span>
              {isPopular && (
                <span className="ml-1 font-mono text-[9.5px] uppercase tracking-[0.16em] text-[hsl(var(--accent))]">
                  Popular
                </span>
              )}
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}
