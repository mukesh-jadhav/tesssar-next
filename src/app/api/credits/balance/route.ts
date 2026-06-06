import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/firebase/auth";
import { getBalance } from "@/lib/credits/ledger";
import { isUnlimited } from "@/lib/credits/display";

export const runtime = "nodejs";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ credits: 0, unlimited: false }, { status: 401 });
  const credits = await getBalance(user.uid);
  return NextResponse.json({
    credits: isUnlimited(credits) ? null : credits,
    unlimited: isUnlimited(credits),
  });
}
