import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { getSessionUser } from "@/lib/firebase/auth";
import { adminDb } from "@/lib/firebase/admin";
import type { ArchitectureDoc } from "@/types/architecture";
import type { StudyDoc } from "@/types/study";
import { clientIp, rateLimit, rateLimitResponse } from "@/lib/security/rateLimit";
import { requestLogger } from "@/lib/security/log";

export const runtime = "nodejs";

/**
 * POST /api/studies/[id]/promote
 *
 * Strips the variant tags off the chosen architecture so it lives as a
 * standalone arch in `/history`. Free — the user already paid for the
 * variant when the study ran. Idempotent: re-promoting the same runId
 * is a no-op.
 *
 * Per docs/STUDY_PLAN.md §2.5 + §7.
 */

const PromoteBody = z.object({
  runId: z.string().min(1).max(64),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const log = requestLogger(req, "studies.promote");

  const ipGuard = rateLimit({
    key: `studies:promote:ip:${clientIp(req)}`,
    limit: 30,
    windowMs: 60_000,
  });
  if (!ipGuard.ok) return rateLimitResponse(ipGuard);

  const user = await getSessionUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const userGuard = rateLimit({
    key: `studies:promote:uid:${user.uid}`,
    limit: 10,
    windowMs: 60_000,
  });
  if (!userGuard.ok) return rateLimitResponse(userGuard);

  let body: z.infer<typeof PromoteBody>;
  try {
    body = PromoteBody.parse(await req.json());
  } catch (err) {
    const msg =
      err instanceof z.ZodError
        ? err.issues[0]?.message ?? "Invalid request"
        : "Invalid JSON body";
    return new Response(msg, { status: 400 });
  }

  // Ownership + study membership.
  const studyRef = adminDb.collection("studies").doc(params.id);
  const studySnap = await studyRef.get();
  if (!studySnap.exists) return new Response("Not found", { status: 404 });
  const study = studySnap.data() as StudyDoc;
  if (study.uid !== user.uid) return new Response("Not found", { status: 404 });

  const variant = study.variants.find((v) => v.runId === body.runId);
  if (!variant) {
    return new Response("runId is not part of this study", { status: 400 });
  }

  // Load arch + defense-in-depth ownership re-check.
  const archRef = adminDb.collection("architectures").doc(body.runId);
  const archSnap = await archRef.get();
  if (!archSnap.exists) return new Response("Architecture missing", { status: 404 });
  const arch = archSnap.data() as ArchitectureDoc;
  if (arch.uid !== user.uid) {
    log.error("promote arch ownership mismatch", {
      studyId: study.id,
      runId: body.runId,
    });
    return new Response("Forbidden", { status: 403 });
  }
  if (arch.status !== "complete") {
    return new Response("Only completed variants can be promoted", { status: 409 });
  }

  // Idempotent: already promoted → success no-op.
  if (!arch.studyId && !arch.variantId && !arch.variantLabel) {
    return NextResponse.json({});
  }

  await archRef.update({
    studyId: FieldValue.delete(),
    variantLabel: FieldValue.delete(),
    variantId: FieldValue.delete(),
  });

  log.info("variant promoted", {
    studyId: study.id,
    runId: body.runId,
    variantId: variant.variantId,
  });

  return NextResponse.json({});
}
