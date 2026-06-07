import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/firebase/auth";
import { adminDb } from "@/lib/firebase/admin";
import type { ArchitectureDoc } from "@/types/architecture";
import { rateLimit, rateLimitResponse } from "@/lib/security/rateLimit";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const user = await getSessionUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  // Client polls every 2.5s (~24 req/min). 90/min headroom covers tab
  // switches, multiple polls, and short Firestore reconnects.
  const guard = rateLimit({
    key: `status:uid:${user.uid}`,
    limit: 90,
    windowMs: 60_000,
  });
  if (!guard.ok) return rateLimitResponse(guard);

  const snap = await adminDb.collection("architectures").doc(params.id).get();
  if (!snap.exists) return new Response("Not found", { status: 404 });

  const d = snap.data() as ArchitectureDoc;
  if (d.uid !== user.uid) return new Response("Forbidden", { status: 403 });

  return NextResponse.json(d, {
    headers: { "Cache-Control": "no-store" },
  });
}
