import Script from "next/script";
import { GA_ID, GADS_ID, analyticsEnabled } from "@/lib/analytics/track";

/**
 * Loads the Google tag (gtag.js) once and configures GA4 and/or Google
 * Ads from environment variables. Renders nothing when neither ID is
 * set, so non-production / unconfigured builds ship zero analytics JS.
 *
 * `strategy="afterInteractive"` keeps the tag off the critical path so
 * it never blocks first paint or hurts the landing page's Quality Score.
 */
export function Analytics() {
  if (!analyticsEnabled) return null;

  // gtag.js only needs one src; prefer the GA4 id, fall back to Ads.
  const tagId = GA_ID || GADS_ID;

  return (
    <>
      <Script
        id="gtag-src"
        src={`https://www.googletagmanager.com/gtag/js?id=${tagId}`}
        strategy="afterInteractive"
      />
      <Script id="gtag-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          ${GA_ID ? `gtag('config', '${GA_ID}');` : ""}
          ${GADS_ID ? `gtag('config', '${GADS_ID}');` : ""}
        `}
      </Script>
    </>
  );
}
