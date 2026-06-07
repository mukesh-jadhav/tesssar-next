import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/firebase/auth";
import { getBalance } from "@/lib/credits/ledger";
import { isUnlimited } from "@/lib/credits/display";
import { clientIp, rateLimit, rateLimitResponse } from "@/lib/security/rateLimit";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ credits: 0, unlimited: false }, { status: 401 });

  // Polled by the drawer; cap to absorb runaway client loops without
  // affecting normal use (1 req every ~2s would still fit comfortably).
  const guard = rateLimit({
    key: `balance:uid:${user.uid}`,
    limit: 120,
    windowMs: 60_000,
  });
  if (!guard.ok) return rateLimitResponse(guard);
  void clientIp; // imported via barrel; not used here but kept for future per-IP layer

  const credits = await getBalance(user.uid);
  return NextResponse.json({
    credits: isUnlimited(credits) ? null : credits,
    unlimited: isUnlimited(credits),
  });
}
