import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/firebase/auth";
import { getBalance } from "@/lib/credits/ledger";

export const runtime = "nodejs";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ credits: 0 }, { status: 401 });
  const credits = await getBalance(user.uid);
  return NextResponse.json({ credits });
}
