import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getSessionUser } from "@/lib/firebase/auth";
import { adminDb } from "@/lib/firebase/admin";
import {
  consumeCredit,
  InsufficientCreditsError,
} from "@/lib/credits/ledger";
import { newShareSlug, SHARE_COST_CREDITS } from "@/lib/architectures/share";
import type { ArchitectureDoc } from "@/types/architecture";
import { rateLimit, rateLimitResponse } from "@/lib/security/rateLimit";

export const runtime = "nodejs";

/**
 * POST /api/architect/[id]/share
 *
 * Mints a public read-only slug for the report. Charges
 * SHARE_COST_CREDITS once; subsequent calls return the existing slug
 * without deducting again (idempotent).
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const guard = rateLimit({
    key: `share:uid:${user.uid}`,
    limit: 20,
    windowMs: 60_000,
  });
  if (!guard.ok) return rateLimitResponse(guard);

  const ref = adminDb.collection("architectures").doc(id);
  const snap = await ref.get();
  if (!snap.exists) return new Response("Not found", { status: 404 });
  const d = snap.data() as ArchitectureDoc;
  if (d.uid !== user.uid) return new Response("Forbidden", { status: 403 });
  if (d.status !== "complete") {
    return new Response("Report is not ready to share yet", { status: 409 });
  }

  // Already shared — return the existing slug without charging again.
  if (d.publicShare?.slug) {
    return NextResponse.json({
      slug: d.publicShare.slug,
      url: shareUrl(d.publicShare.slug),
      charged: 0,
    });
  }

  try {
    await consumeCredit(
      user.uid,
      `Public share ${id}`,
      id,
      SHARE_COST_CREDITS,
    );
  } catch (err) {
    if (err instanceof InsufficientCreditsError) {
      return NextResponse.json(
        { error: `Need ${SHARE_COST_CREDITS} credits to publish.` },
        { status: 402 },
      );
    }
    throw err;
  }

  const slug = newShareSlug();
  await ref.update({
    publicShare: { slug, createdAt: Date.now() },
  });

  return NextResponse.json({ slug, url: shareUrl(slug), charged: SHARE_COST_CREDITS });
}

/**
 * DELETE /api/architect/[id]/share — revoke the public link. We do
 * NOT refund credits; the user already got what they paid for.
 */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const guard = rateLimit({
    key: `share-delete:uid:${user.uid}`,
    limit: 20,
    windowMs: 60_000,
  });
  if (!guard.ok) return rateLimitResponse(guard);

  const ref = adminDb.collection("architectures").doc(id);
  const snap = await ref.get();
  if (!snap.exists) return new Response("Not found", { status: 404 });
  const d = snap.data() as ArchitectureDoc;
  if (d.uid !== user.uid) return new Response("Forbidden", { status: 403 });

  await ref.update({
    publicShare: FieldValue.delete(),
  });

  return NextResponse.json({ ok: true });
}

function shareUrl(slug: string): string {
  const base =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "https://tessar.dev";
  return `${base}/r/${slug}`;
}
