import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/firebase/auth";
import { adminDb } from "@/lib/firebase/admin";
import type { ArchitectureDoc } from "@/types/architecture";
import type { StudyDoc } from "@/types/study";
import { rateLimit, rateLimitResponse } from "@/lib/security/rateLimit";
import { reapStudyIfStuck } from "@/lib/agent/studies";

export const runtime = "nodejs";

/**
 * GET /api/studies/[id]/status
 *
 * Returns the study doc + per-variant progress slices read from each
 * variant's architecture doc. Mirrors the single-run status endpoint.
 *
 * Auth: caller must own the study (study.uid === user.uid).
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  // Client polls per-variant indirectly through this single endpoint, so
  // we lift the limit a bit to allow multiple study tabs open at once.
  const guard = rateLimit({
    key: `studies:status:${user.uid}`,
    limit: 120,
    windowMs: 60_000,
  });
  if (!guard.ok) return rateLimitResponse(guard);

  const snap = await adminDb.collection("studies").doc(id).get();
  if (!snap.exists) return new Response("Not found", { status: 404 });

  const study = snap.data() as StudyDoc;
  if (study.uid !== user.uid) {
    return new Response("Forbidden", { status: 403 });
  }

  // Reap any stuck variants (watchdog parity with the single-run flow).
  const fresh = await reapStudyIfStuck(study);

  // Join in each variant's live progress slice from its arch doc so
  // clients don't need a second round-trip per variant.
  const variantArchSnaps = await Promise.all(
    fresh.variants.map((v) =>
      adminDb.collection("architectures").doc(v.runId).get(),
    ),
  );
  const variants = fresh.variants.map((v, i) => {
    const arch = variantArchSnaps[i].exists
      ? (variantArchSnaps[i].data() as ArchitectureDoc)
      : null;
    return {
      ...v,
      progress: arch?.progress ?? null,
      status: arch?.status ?? v.status,
      errorMessage: arch?.errorMessage ?? v.errorMessage,
    };
  });

  return NextResponse.json(
    {
      id: fresh.id,
      uid: fresh.uid,
      prompt: fresh.prompt,
      dimension: fresh.dimension,
      status: fresh.status,
      createdAt: fresh.createdAt,
      completedAt: fresh.completedAt,
      variants,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
