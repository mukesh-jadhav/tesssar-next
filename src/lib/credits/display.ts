import { RUN_COST_CREDITS } from "@/lib/razorpay/packs";

/**
 * Sentinel value meaning "unlimited credits" (admin accounts).
 *
 * We can't use `Number.POSITIVE_INFINITY` because React Server
 * Components serialise the RSC payload as JSON, and `Infinity`
 * becomes `null`. A negative-int sentinel survives the wire and
 * keeps the prop typed as `number`.
 */
export const UNLIMITED_CREDITS = -1;

export function isUnlimited(n: number | undefined | null): boolean {
  return typeof n === "number" && n < 0;
}

/**
 * Format a credit balance for display. Admins (unlimited balance)
 * show as "∞". Everyone else gets a localised integer.
 */
export function formatCredits(n: number | undefined | null): string {
  if (n == null) return "—";
  if (isUnlimited(n)) return "∞";
  return n.toLocaleString("en-IN");
}

/**
 * Translate a raw credit balance into "designs remaining".
 * Returns "∞" for admins, integer count otherwise.
 */
export function formatDesigns(n: number | undefined | null): string {
  if (n == null) return "—";
  if (isUnlimited(n)) return "∞";
  return Math.floor(n / RUN_COST_CREDITS).toLocaleString("en-IN");
}

/** True if the user can afford at least one run. */
export function canAffordRun(credits: number | undefined | null): boolean {
  if (credits == null) return false;
  if (isUnlimited(credits)) return true;
  return credits >= RUN_COST_CREDITS;
}
