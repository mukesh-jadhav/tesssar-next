/**
 * Admin allowlist — synchronous, no I/O. Safe to import anywhere
 * (server actions, route handlers, ledger transactions).
 *
 * Always-on admins are hard-coded here; additional admins can be
 * configured via the `ADMIN_EMAILS` env var (comma-separated).
 */

const HARDCODED_ADMINS = ["admin.tessar@gmail.com"] as const;

function envAdmins(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const normalized = email.toLowerCase();
  if (HARDCODED_ADMINS.includes(normalized as (typeof HARDCODED_ADMINS)[number])) {
    return true;
  }
  return envAdmins().includes(normalized);
}
