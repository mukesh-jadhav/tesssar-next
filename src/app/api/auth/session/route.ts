import { NextRequest, NextResponse } from "next/server";
import { adminAuth, SESSION_COOKIE_NAME, SESSION_MAX_AGE_MS } from "@/lib/firebase/admin";
import { getOrCreateUserDoc } from "@/lib/firebase/auth";
import { clientIp, rateLimit, rateLimitResponse } from "@/lib/security/rateLimit";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  // Sign-in is expensive (token verify + Firestore write); cap per-IP to
  // absorb brute-force attempts against stolen ID tokens.
  const guard = rateLimit({
    key: `auth-session:ip:${clientIp(req)}`,
    limit: 10,
    windowMs: 60_000,
  });
  if (!guard.ok) return rateLimitResponse(guard);

  try {
    const { idToken } = (await req.json()) as { idToken?: string };
    if (!idToken) {
      return NextResponse.json({ error: "idToken required" }, { status: 400 });
    }

    const decoded = await adminAuth.verifyIdToken(idToken, true);
    if (decoded.firebase.sign_in_provider !== "google.com") {
      return NextResponse.json(
        { error: "Only Google sign-in allowed" },
        { status: 403 },
      );
    }

    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: SESSION_MAX_AGE_MS,
    });

    await getOrCreateUserDoc({
      uid: decoded.uid,
      email: decoded.email ?? "",
      displayName: (decoded.name as string) ?? null,
      photoURL: (decoded.picture as string) ?? null,
    });

    const res = NextResponse.json({ ok: true, uid: decoded.uid });
    res.cookies.set(SESSION_COOKIE_NAME, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE_MS / 1000,
    });
    return res;
  } catch (err) {
    const e = err as { code?: string; message?: string };
    console.error("[/api/auth/session] failed:", e?.code, e?.message);
    return NextResponse.json({ error: "Sign-in failed" }, { status: 500 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return res;
}
