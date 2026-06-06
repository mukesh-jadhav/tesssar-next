import "server-only";

import { cookies } from "next/headers";
import { adminAuth, SESSION_COOKIE_NAME } from "./admin";
import type { UserDoc } from "@/types/architecture";
import { adminDb } from "./admin";

export async function getSessionUser(): Promise<{
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
} | null> {
  const cookie = cookies().get(SESSION_COOKIE_NAME)?.value;
  if (!cookie) return null;
  try {
    const decoded = await adminAuth.verifySessionCookie(cookie, true);
    return {
      uid: decoded.uid,
      email: decoded.email ?? "",
      displayName: (decoded.name as string) ?? null,
      photoURL: (decoded.picture as string) ?? null,
    };
  } catch {
    return null;
  }
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) throw new Response("Unauthorized", { status: 401 });
  return user;
}

export async function isAdmin(email: string | null | undefined): Promise<boolean> {
  if (!email) return false;
  const list = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.toLowerCase());
}

export async function getOrCreateUserDoc(args: {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
}): Promise<UserDoc> {
  const ref = adminDb.collection("users").doc(args.uid);
  const snap = await ref.get();
  const now = Date.now();

  if (!snap.exists) {
    const WELCOME_CREDITS = 3;
    const newUser: UserDoc = {
      uid: args.uid,
      email: args.email,
      displayName: args.displayName,
      photoURL: args.photoURL,
      credits: WELCOME_CREDITS,
      freeCreditGranted: true,
      totalSpent: 0,
      createdAt: now,
      lastSeenAt: now,
    };
    await ref.set(newUser);

    // Ledger entry for the granted credits
    await adminDb.collection("ledger").add({
      uid: args.uid,
      type: "grant",
      delta: WELCOME_CREDITS,
      balanceAfter: WELCOME_CREDITS,
      reason: `Welcome — ${WELCOME_CREDITS} free designs to start`,
      createdAt: now,
    });

    return newUser;
  }

  await ref.update({ lastSeenAt: now });
  return snap.data() as UserDoc;
}
