/**
 * Analytics configuration + a thin, type-safe gtag wrapper.
 *
 * Everything is **env-gated**: if `NEXT_PUBLIC_GA_ID` is unset the GA4
 * tag never loads, and if `NEXT_PUBLIC_GADS_ID` is unset the Google Ads
 * conversion pings are silently skipped. This lets us ship the wiring
 * now and flip analytics on purely via environment variables.
 *
 * Public IDs only (GA4 measurement ID, Ads conversion ID) — these are
 * inlined into the client bundle and are safe to expose.
 */

export const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "";
export const GADS_ID = process.env.NEXT_PUBLIC_GADS_ID || "";

export const GADS_LABELS = {
  purchase: process.env.NEXT_PUBLIC_GADS_LABEL_PURCHASE || "",
  signup: process.env.NEXT_PUBLIC_GADS_LABEL_SIGNUP || "",
  design: process.env.NEXT_PUBLIC_GADS_LABEL_DESIGN || "",
} as const;

export const analyticsEnabled = Boolean(GA_ID || GADS_ID);

type GtagArgs =
  | ["js", Date]
  | ["config", string, Record<string, unknown>?]
  | ["event", string, Record<string, unknown>?]
  | ["set", Record<string, unknown>];

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: GtagArgs) => void;
  }
}

/** Low-level gtag call. No-ops on the server or before the tag loads. */
function gtag(...args: GtagArgs): void {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag(...args);
}

/** Generic GA4 event. */
export function trackEvent(
  name: string,
  params: Record<string, unknown> = {},
): void {
  if (!GA_ID) return;
  gtag("event", name, params);
}

/**
 * Fire a Google Ads conversion. Skips cleanly if the Ads ID or the
 * specific action's label isn't configured yet.
 */
export function trackAdsConversion(
  action: keyof typeof GADS_LABELS,
  params: { value?: number; currency?: string; transactionId?: string } = {},
): void {
  const label = GADS_LABELS[action];
  if (!GADS_ID || !label) return;
  gtag("event", "conversion", {
    send_to: `${GADS_ID}/${label}`,
    ...(params.value != null ? { value: params.value } : {}),
    ...(params.currency ? { currency: params.currency } : {}),
    ...(params.transactionId ? { transaction_id: params.transactionId } : {}),
  });
}

/* ------------------------------------------------------------------ */
/* Semantic conversion helpers — call these from UI, not the raw API. */
/* ------------------------------------------------------------------ */

/** New account created (first Google sign-in). Micro-conversion. */
export function trackSignUp(method = "google"): void {
  trackEvent("sign_up", { method });
  trackAdsConversion("signup");
}

/** A design run was started. Secondary signal. */
export function trackDesignStarted(kind: "architecture" | "study" = "architecture"): void {
  trackEvent("design_started", { kind });
}

/** A design run completed successfully. Macro-conversion. */
export function trackDesignCompleted(kind: "architecture" | "study" = "architecture"): void {
  trackEvent("design_completed", { kind });
  trackAdsConversion("design");
}

/**
 * A paid credit pack was purchased. Primary value conversion — pass the
 * INR amount and the Razorpay order id so Smart Bidding can optimise to
 * ROAS and dedupe conversions.
 */
export function trackPurchase(args: {
  valueInr: number;
  transactionId: string;
  packId?: string;
  designs?: number;
}): void {
  trackEvent("purchase", {
    currency: "INR",
    value: args.valueInr,
    transaction_id: args.transactionId,
    items: args.packId
      ? [{ item_id: args.packId, item_name: args.packId, quantity: args.designs ?? 1 }]
      : undefined,
  });
  trackAdsConversion("purchase", {
    value: args.valueInr,
    currency: "INR",
    transactionId: args.transactionId,
  });
}
