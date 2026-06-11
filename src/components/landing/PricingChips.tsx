"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useReducedMotionSafe } from "@/components/motion/useReducedMotionSafe";
import { CREDIT_PACKS } from "@/lib/razorpay/packs";
import { useRegion, packPrice } from "@/components/billing/RegionalPrice";

/**
 * Four-chip pricing strip that lives inside the landing pricing teaser.
 * Each chip lifts on hover. The "Trio" chip carries an accent ring as the
 * popular default; clicking any chip navigates to /pricing with that pack
 * pre-selected via hash. Prices are region-aware (₹ for India, premium
 * USD for everyone else).
 */
export function PricingChips() {
  const reduced = useReducedMotionSafe();
  const region = useRegion();

  return (
    <div className="mt-8 flex flex-wrap gap-2.5" role="list">
      {CREDIT_PACKS.map((pack) => {
        const isPopular = pack.badge === "Most popular";
        const base =
          "group relative inline-flex items-center gap-2 rounded-md border px-4 py-2 transition-colors";
        const ringClass = isPopular
          ? "border-[hsl(var(--accent))] bg-[hsl(var(--accent-paper))] text-[hsl(var(--accent-ink))]"
          : "border-[hsl(var(--line))] bg-[hsl(var(--card))] text-[hsl(var(--ink))] hover:border-[hsl(var(--line-2))]";

        return (
          <motion.div
            key={pack.id}
            role="listitem"
            whileHover={reduced ? undefined : { y: -3 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className={isPopular ? "scale-[1.04]" : undefined}
          >
            <Link
              href={`/pricing#${pack.id}`}
              className={`${base} ${ringClass}`}
            >
              <span className="font-mono text-[10.5px] uppercase tracking-[0.16em]">
                {pack.name}
              </span>
              <span className="display text-[14px] tabular-nums tracking-[-0.01em]">
                {packPrice(pack, region)}
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
