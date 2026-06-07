import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth, SESSION_COOKIE_NAME } from "@/lib/firebase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/auth/whoami
 *
 * Diagnostic endpoint. Returns the current server-verified session.
 * Safe to expose: only reveals public-ish fields of the caller's own
 * Firebase user. Useful for verifying the session-cookie round trip
 * from the browser without UI.
 */
export async function GET() {
  const cookie = cookies().get(SESSION_COOKIE_NAME)?.value;
  if (!cookie) {
    return NextResponse.json({ signedIn: false, reason: "no-cookie" });
  }
  try {
    const decoded = await adminAuth.verifySessionCookie(cookie, true);
    return NextResponse.json({
      signedIn: true,
      uid: decoded.uid,
      email: decoded.email ?? null,
      authTime: decoded.auth_time,
    });
  } catch (err) {
    const e = err as { code?: string; message?: string };
    console.warn("[/api/auth/whoami] verify failed:", e?.code, e?.message);
    return NextResponse.json(
      { signedIn: false, reason: "verify-failed" },
      { status: 200 },
    );
  }
}
