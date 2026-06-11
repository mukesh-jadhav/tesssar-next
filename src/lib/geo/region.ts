/**
 * Region detection for currency / pricing.
 *
 * Tessar prices in INR for India and in (premium) USD for everyone else.
 * The actual charge always settles in INR via Razorpay; region only
 * decides which price tier the user sees and is billed at.
 *
 * Detection is client-side via the browser timezone, which is the most
 * reliable free signal on our Cloud Run + custom-domain setup (no geo
 * header is guaranteed there). India has a single timezone
 * (Asia/Kolkata), so home-market detection is essentially exact; the
 * server-side default is "IN" so SSR renders the home market with no
 * flash for Indian visitors.
 */

export type Region = "IN" | "INTL";

/** Narrow an untrusted value (e.g. from a request body) to a Region. */
export function coerceRegion(value: unknown): Region {
  return value === "INTL" ? "INTL" : "IN";
}

/**
 * Detect the visitor's region in the browser. Returns "IN" for Indian
 * timezones (or when detection is unavailable — home-market default),
 * "INTL" otherwise. Safe to call only on the client.
 */
export function detectRegion(): Region {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    if (!tz) return "IN";
    if (tz === "Asia/Kolkata" || tz === "Asia/Calcutta") return "IN";
    return "INTL";
  } catch {
    return "IN";
  }
}
