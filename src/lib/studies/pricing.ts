import { RUN_COST_CREDITS } from "@/lib/razorpay/packs";

/**
 * Comparison Studies — credit pricing.
 *
 * See docs/STUDY_PLAN.md §8 for the design rationale. Bundle discounts
 * exist so the feature that proves the product (multi-variant exploration)
 * isn't punitive — N × RUN_COST_CREDITS would be.
 */

export const SYNTHESIS_COST_CREDITS = 20;

export const MIN_VARIANTS = 2;

/**
 * Hard cap until we confirm we have headroom on Vertex's per-minute
 * `gemini-2.5-pro` token quota for 4 concurrent streams. 3 is comfortable
 * at our current quota; 4 is the next gate.
 */
export const MAX_VARIANTS = 3;

/** Credits charged at study creation. */
export function studyCost(variantCount: number): number {
  switch (variantCount) {
    case 2:
      return 70; // 2 × 40 = 80, ~12% off
    case 3:
      return 95; // 3 × 40 = 120, ~21% off
    case 4:
      return 120; // 4 × 40 = 160, 25% off — locked behind MAX_VARIANTS
    default:
      throw new RangeError(
        `Studies allow ${MIN_VARIANTS}\u2013${MAX_VARIANTS} variants (got ${variantCount})`,
      );
  }
}

/** Credits charged when the user clicks "Re-run just X" on a failed variant. */
export const RETRY_VARIANT_COST_CREDITS = RUN_COST_CREDITS;
