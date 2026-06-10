/**
 * Central SEO / brand configuration. Single source of truth for the
 * canonical site URL, names, descriptions, and the keyword set the
 * marketing surfaces and structured data draw from.
 *
 * Anything user-facing in <head> (titles, descriptions, OG, JSON-LD,
 * sitemap, robots) should resolve back to these constants so the
 * messaging stays consistent across organic search and paid landing.
 */

export const SITE_URL = (
  process.env.NEXT_PUBLIC_APP_URL || "https://tessar.dev"
).replace(/\/$/, "");

export const SITE = {
  url: SITE_URL,
  name: "Tessar",
  /** Used in <title> templates and OG titles. */
  title: "Tessar — AI Cloud Architect",
  /** Default meta description. ~155 chars, benefit-led, keyword-rich. */
  description:
    "Tessar is an AI cloud architect. Describe your system; get a 14-section, schema-validated architecture — components, diagrams, monthly cost in INR, scored risks, applied patterns, and a roadmap. Cloud-agnostic across GCP, AWS, and Azure.",
  tagline: "Senior cloud architect, on tap.",
  email: "hello@tessar.dev",
  /** Primary geo focus for the campaign (pricing is in INR). */
  locale: "en_IN",
} as const;

/**
 * Keyword themes the campaign targets. Ordered roughly by search intent
 * priority. Mirrored in page `keywords` metadata and the Google Ads plan.
 */
export const SITE_KEYWORDS = [
  "AI cloud architect",
  "AI cloud architecture generator",
  "cloud architecture design tool",
  "cloud architecture diagram generator",
  "system design generator",
  "AWS architecture generator",
  "GCP architecture design",
  "Azure architecture design",
  "cloud cost estimator",
  "solution architect tool",
  "software architecture diagram AI",
  "infrastructure design tool",
] as const;
