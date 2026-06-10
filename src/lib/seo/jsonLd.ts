/**
 * JSON-LD structured-data builders. Each returns a plain object that is
 * serialised into a <script type="application/ld+json"> tag via the
 * <JsonLd> component. Rich results these enable:
 *
 *   - Organization  → brand knowledge panel / logo in search.
 *   - WebSite       → sitelinks eligibility.
 *   - SoftwareApplication + Offer → price + product rich snippet.
 *   - FAQPage       → expandable FAQ rich result on /pricing.
 *
 * Google requires structured data to reflect content visible on the
 * page, so the FAQ entries here mirror the on-page /pricing copy.
 */
import { SITE, SITE_URL } from "./site";
import { CREDIT_PACKS } from "@/lib/razorpay/packs";

type Json = Record<string, unknown>;

export function organizationLd(): Json {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: SITE.name,
    url: SITE_URL,
    logo: `${SITE_URL}/icon`,
    image: `${SITE_URL}/opengraph-image`,
    description: SITE.description,
    email: SITE.email,
    contactPoint: {
      "@type": "ContactPoint",
      email: SITE.email,
      contactType: "customer support",
      availableLanguage: ["en"],
    },
  };
}

export function websiteLd(): Json {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: SITE.name,
    url: SITE_URL,
    description: SITE.description,
    publisher: { "@id": `${SITE_URL}/#organization` },
    inLanguage: "en",
  };
}

/**
 * SoftwareApplication with one Offer per credit pack. Powers the
 * price + "DeveloperApplication" rich snippet. Prices are derived from
 * the same CREDIT_PACKS the checkout uses, so they never drift.
 */
export function softwareApplicationLd(): Json {
  const offers = CREDIT_PACKS.map((p) => ({
    "@type": "Offer",
    name: `${p.name} — ${p.designs} ${p.designs === 1 ? "design" : "designs"}`,
    price: (p.pricePaise / 100).toFixed(2),
    priceCurrency: "INR",
    category: "SaaS credits",
    url: `${SITE_URL}/pricing#${p.id}`,
  }));

  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "@id": `${SITE_URL}/#software`,
    name: SITE.name,
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Web",
    url: SITE_URL,
    description: SITE.description,
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "INR",
      lowPrice: (
        Math.min(...CREDIT_PACKS.map((p) => p.perDesignPaise)) / 100
      ).toFixed(2),
      highPrice: (
        Math.max(...CREDIT_PACKS.map((p) => p.pricePaise)) / 100
      ).toFixed(2),
      offerCount: CREDIT_PACKS.length,
      offers,
    },
    publisher: { "@id": `${SITE_URL}/#organization` },
  };
}

/** A single FAQ Q/A pair in plain text (no JSX) for the FAQPage schema. */
export interface FaqLd {
  q: string;
  a: string;
}

export function faqPageLd(items: FaqLd[]): Json {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((it) => ({
      "@type": "Question",
      name: it.q,
      acceptedAnswer: { "@type": "Answer", text: it.a },
    })),
  };
}

/**
 * Plain-text mirror of the visible /pricing FAQ. Kept faithful to the
 * on-page answers (Google flags FAQ schema that doesn't match content).
 */
export const PRICING_FAQ_LD: FaqLd[] = [
  {
    q: "What exactly do I get for one design?",
    a: "One design is a complete architecture report — a system story, requirements brief, design decisions, every component on the critical path, a traffic envelope, three labelled diagrams, monthly cost ranges in INR, risks, guardrails, observability notes, and a phased roadmap. You also get a downloadable PDF and a permanent versioned record you can re-open, share, or compare later.",
  },
  {
    q: "What happens if the agent fails halfway?",
    a: "The credits are automatically refunded to your wallet. We only charge for runs that complete with a valid report, and you can retry immediately at no extra cost.",
  },
  {
    q: "Do credits expire?",
    a: "No. Credits sit in your wallet forever — use them next week, next quarter, or next year. There are no subscriptions, no renewal emails, and no quiet expirations.",
  },
  {
    q: "Is there a free trial?",
    a: "Every new account starts with one full architecture on us. No card is needed for the trial design; you only see the Razorpay checkout when you want a second one.",
  },
  {
    q: "Can I get a GST-compliant invoice?",
    a: "Yes. Every successful payment generates a GST-inclusive invoice in INR, available immediately in your dashboard under Billing → Receipts. Add your GSTIN once and it appears on every future invoice.",
  },
  {
    q: "What payment methods do you accept?",
    a: "Razorpay handles checkout, so you can pay with credit and debit cards, UPI (GPay, PhonePe, Paytm), netbanking from every major Indian bank, and wallets. All transactions settle in INR.",
  },
  {
    q: "Can I get a refund if I change my mind?",
    a: "Unused credits are refundable for 14 days from purchase — just email us. Credits already spent on completed reports are non-refundable, since the cost is in the compute and model time that produced the report.",
  },
];
