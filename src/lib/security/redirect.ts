/**
 * Validate a `?next=` parameter for sign-in / post-auth redirects.
 *
 * Returns the input only if it's a safe same-origin path; otherwise
 * returns the fallback. Blocks:
 *   - absolute URLs (https://evil.com/...)
 *   - protocol-relative URLs (//evil.com/...)
 *   - backslash variants that some browsers parse as schemes (/\evil.com)
 *   - data:, javascript:, file: schemes (caught by the same checks)
 *
 * Without this, any `redirect(searchParams.next)` becomes an open-redirect
 * primitive (CWE-601), turning the sign-in page into a phishing relay.
 *
 * Safe for both client (window.location.href) and server (next/navigation
 * redirect()) use.
 */
export function safeNext(value: string | undefined | null, fallback = "/"): string {
  if (!value) return fallback;
  const v = value.trim();
  if (!v.startsWith("/")) return fallback;
  // Block protocol-relative: //evil.com → browsers treat as scheme-relative
  if (v.startsWith("//") || v.startsWith("/\\")) return fallback;
  // Cap length to avoid pathological values in URLs / logs
  if (v.length > 512) return fallback;
  return v;
}
