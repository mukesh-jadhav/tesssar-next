import "server-only";

import { adminDb } from "@/lib/firebase/admin";
import { clientIp } from "@/lib/security/rateLimit";

/**
 * Write an audit record for a privileged or otherwise sensitive action.
 * Default-deny Firestore rules block client reads/writes on this
 * collection — only the Admin SDK touches it.
 *
 * Use sparingly: this is for compliance-relevant events (admin views,
 * privilege escalations, refunds, etc.), not application logging.
 */
export interface AuditRecord {
  actorUid: string | null;
  actorEmail: string | null;
  action: string; // e.g. "admin.stats.view", "share.delete"
  resource?: string; // optional resource id ("architectures/abc123")
  metadata?: Record<string, unknown>;
}

export async function recordAudit(
  req: { headers: Headers },
  rec: AuditRecord,
): Promise<void> {
  try {
    await adminDb.collection("audit").add({
      actorUid: rec.actorUid,
      actorEmail: rec.actorEmail,
      action: rec.action,
      resource: rec.resource ?? null,
      metadata: rec.metadata ?? null,
      ip: clientIp(req),
      userAgent: req.headers.get("user-agent") ?? null,
      createdAt: Date.now(),
    });
  } catch (err) {
    // Audit failure must not break the user-facing flow, but we still
    // want loud signal in logs so SRE can investigate.
    console.error("[audit] failed to record", { action: rec.action, err: (err as Error).message });
  }
}
