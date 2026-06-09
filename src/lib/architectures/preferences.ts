/**
 * Optional brief preferences — surfaced as chips in the form, composed
 * into the brief string before it's sent to /api/architect/generate.
 *
 * Kept here (and not in the API contract) on purpose: this is the
 * lightweight first cut. The orchestrator simply receives a richer
 * brief. If a preference proves load-bearing, promote it to a typed
 * field on the generate route.
 */

export const CLOUD_OPTIONS = ["GCP", "AWS", "Azure", "Multi-cloud", "No preference"] as const;
export type CloudChoice = (typeof CLOUD_OPTIONS)[number];

export const BUDGET_OPTIONS = ["Lean", "Moderate", "Generous", "No limit"] as const;
export type BudgetChoice = (typeof BUDGET_OPTIONS)[number];

export const RESIDENCY_OPTIONS = ["India", "EU", "US", "Global", "No constraint"] as const;
export type ResidencyChoice = (typeof RESIDENCY_OPTIONS)[number];

export const AUDIENCE_OPTIONS = ["Consumer", "Enterprise B2B", "Internal", "Government"] as const;
export type AudienceChoice = (typeof AUDIENCE_OPTIONS)[number];

export const COMPLIANCE_OPTIONS = [
  "HIPAA",
  "PCI-DSS",
  "GDPR",
  "SOC2",
  "DPDP / ABDM",
  "RBI / IRDAI",
  "FedRAMP",
  "ISO 27001",
] as const;
export type ComplianceChoice = (typeof COMPLIANCE_OPTIONS)[number];

export type BriefPreferences = {
  cloud?: CloudChoice;
  budget?: BudgetChoice;
  residency?: ResidencyChoice;
  audience?: AudienceChoice;
  compliance?: ComplianceChoice[];
  existingStack?: string;
};

export const EMPTY_PREFS: BriefPreferences = {};

const BUDGET_HINT: Record<BudgetChoice, string> = {
  Lean: "minimize spend; prefer free tiers, autoscaling-to-zero, and managed services only when they replace meaningful ops work",
  Moderate: "balance cost and operational simplicity; default to managed services",
  Generous: "operational simplicity and reliability over cost; use premium tiers where they buy real safety",
  "No limit": "no budget ceiling; optimize purely for reliability, performance and developer velocity",
};

const RESIDENCY_HINT: Record<ResidencyChoice, string> = {
  India: "all primary data must reside in India",
  EU: "all primary data must reside in the EU",
  US: "all primary data must reside in the US",
  Global: "data may be replicated globally with regional read paths",
  "No constraint": "no residency constraint",
};

const AUDIENCE_HINT: Record<AudienceChoice, string> = {
  Consumer: "consumer-facing product; optimize for mobile, low latency and high-volume signups",
  "Enterprise B2B": "enterprise B2B; default to SSO/SAML, audit trails, multi-tenant isolation and admin tooling",
  Internal: "internal tool; favor simplicity, fewer moving parts, and identity via the company SSO",
  Government: "government / public-sector; emphasize sovereignty, audit, accessibility and procurement-friendly stacks",
};

const CLOUD_HINT: Record<CloudChoice, string> = {
  GCP: "design on Google Cloud (Cloud Run, Firestore, BigQuery, Pub/Sub, etc.)",
  AWS: "design on AWS (Lambda / ECS Fargate, DynamoDB, S3, SNS/SQS, etc.)",
  Azure: "design on Azure (Container Apps, Cosmos DB, Service Bus, Event Hubs, etc.)",
  "Multi-cloud": "design for multi-cloud portability; prefer open-standard, swappable components",
  "No preference": "no cloud preference — pick the best fit and justify the choice",
};

/**
 * Append a "Constraints" block to the user's brief based on selected
 * preferences. Returns the brief unchanged if nothing is set.
 */
export function composeBriefWithPreferences(brief: string, prefs: BriefPreferences): string {
  const lines: string[] = [];

  if (prefs.cloud && prefs.cloud !== "No preference") {
    lines.push(`- Cloud: ${prefs.cloud} — ${CLOUD_HINT[prefs.cloud]}.`);
  }
  if (prefs.compliance && prefs.compliance.length > 0) {
    lines.push(
      `- Compliance: ${prefs.compliance.join(", ")} — controls must map to these regimes and surface in the security section.`,
    );
  }
  if (prefs.residency && prefs.residency !== "No constraint") {
    lines.push(`- Data residency: ${RESIDENCY_HINT[prefs.residency]}.`);
  }
  if (prefs.audience) {
    lines.push(`- Audience: ${AUDIENCE_HINT[prefs.audience]}.`);
  }
  if (prefs.budget) {
    lines.push(`- Budget posture: ${prefs.budget} — ${BUDGET_HINT[prefs.budget]}.`);
  }
  if (prefs.existingStack && prefs.existingStack.trim()) {
    const stack = prefs.existingStack.trim().slice(0, 300);
    lines.push(
      `- Existing stack: ${stack}. Reuse what's named; do not propose a greenfield replacement unless there is a compelling reason.`,
    );
  }

  if (lines.length === 0) return brief;

  return `${brief.trim()}\n\nConstraints (treat as hard requirements):\n${lines.join("\n")}`;
}

/** True if at least one preference is set to a non-default value. */
export function hasAnyPreferences(prefs: BriefPreferences): boolean {
  if (prefs.cloud && prefs.cloud !== "No preference") return true;
  if (prefs.compliance && prefs.compliance.length > 0) return true;
  if (prefs.residency && prefs.residency !== "No constraint") return true;
  if (prefs.audience) return true;
  if (prefs.budget) return true;
  if (prefs.existingStack && prefs.existingStack.trim().length > 0) return true;
  return false;
}

/** Count of set preferences — used for the disclosure badge. */
export function preferenceCount(prefs: BriefPreferences): number {
  let n = 0;
  if (prefs.cloud && prefs.cloud !== "No preference") n++;
  if (prefs.compliance && prefs.compliance.length > 0) n++;
  if (prefs.residency && prefs.residency !== "No constraint") n++;
  if (prefs.audience) n++;
  if (prefs.budget) n++;
  if (prefs.existingStack && prefs.existingStack.trim().length > 0) n++;
  return n;
}
