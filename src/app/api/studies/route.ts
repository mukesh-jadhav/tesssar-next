import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/firebase/auth";
import { adminDb } from "@/lib/firebase/admin";
import {
  consumeCredit,
  refundCredit,
  InsufficientCreditsError,
} from "@/lib/credits/ledger";
import { DIMENSIONS, getDimension } from "@/lib/studies/dimensions";
import {
  MAX_VARIANTS,
  MIN_VARIANTS,
  studyCost,
} from "@/lib/studies/pricing";
import {
  createStudyDocs,
  startStudyWorkers,
} from "@/lib/agent/studies";
import { installShutdownDrain } from "@/lib/agent/shutdown";
import { clientIp, rateLimit, rateLimitResponse } from "@/lib/security/rateLimit";
import { requestLogger } from "@/lib/security/log";

export const runtime = "nodejs";
export const maxDuration = 900;

installShutdownDrain();

const validDimensionIds = DIMENSIONS.map((d) => d.id);

const CreateStudyBody = z.object({
  brief: z
    .string()
    .min(30, "Brief must be at least 30 characters")
    .max(10000, "Brief too long (10000 char max)"),
  dimension: z.enum(validDimensionIds as [string, ...string[]]),
  variantIds: z
    .array(z.string().min(1).max(64))
    .min(MIN_VARIANTS)
    .max(MAX_VARIANTS),
});

export async function POST(req: NextRequest) {
  const log = requestLogger(req, "studies.create");

  const ipGuard = rateLimit({
    key: `studies:ip:${clientIp(req)}`,
    limit: 10,
    windowMs: 60_000,
  });
  if (!ipGuard.ok) return rateLimitResponse(ipGuard);

  const user = await getSessionUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  // Studies are heavier than single runs (N variants each). 3/min keeps
  // worst-case bursts predictable for the Vertex side.
  const userGuard = rateLimit({
    key: `studies:uid:${user.uid}`,
    limit: 3,
    windowMs: 60_000,
  });
  if (!userGuard.ok) return rateLimitResponse(userGuard);

  let payload: z.infer<typeof CreateStudyBody>;
  try {
    payload = CreateStudyBody.parse(await req.json());
  } catch (err) {
    const msg =
      err instanceof z.ZodError
        ? err.issues[0]?.message ?? "Invalid request"
        : "Invalid JSON body";
    return new Response(msg, { status: 400 });
  }

  const dimensionId = payload.dimension as (typeof validDimensionIds)[number];
  const dim = getDimension(dimensionId);
  const seen = new Set<string>();
  for (const vid of payload.variantIds) {
    if (seen.has(vid)) {
      return new Response(`Duplicate variant: ${vid}`, { status: 400 });
    }
    seen.add(vid);
    if (!dim.variants.some((v) => v.id === vid)) {
      return new Response(
        `Unknown variant '${vid}' for dimension '${payload.dimension}'`,
        { status: 400 },
      );
    }
  }

  const cost = studyCost(payload.variantIds.length);

  // Pre-allocate the study id so it can be the refId on both the charge
  // and the (potential) refund. Firestore Admin rejects undefined field
  // values, so we can't pass `refId: undefined` to the ledger writers.
  const studyId = adminDb.collection("studies").doc().id;

  // Charge before doc creation — failed creation refunds. This avoids
  // the inverse race (docs exist, no charge happened) which would leak.
  try {
    await consumeCredit(
      user.uid,
      `Study (${payload.dimension}, ${payload.variantIds.length} variants)`,
      studyId,
      cost,
    );
  } catch (err) {
    if (err instanceof InsufficientCreditsError) {
      return new Response("Insufficient credits", { status: 402 });
    }
    log.error("study credit charge failed", { err: (err as Error).message });
    return new Response("Could not charge credits", { status: 500 });
  }

  let study;
  try {
    study = await createStudyDocs({
      studyId,
      uid: user.uid,
      brief: payload.brief,
      preferences: undefined,
      dimensionId,
      variantIds: payload.variantIds,
      creditsCharged: cost,
    });
  } catch (err) {
    log.error("study doc creation failed; refunding", {
      err: (err as Error).message,
    });
    try {
      await refundCredit(
        user.uid,
        "Refund on study creation failure",
        studyId,
        cost,
      );
    } catch (refundErr) {
      log.error("study refund-on-creation-failure also failed", {
        err: (refundErr as Error).message,
      });
    }
    return new Response("Could not create study", { status: 500 });
  }

  startStudyWorkers({
    studyId: study.id,
    uid: user.uid,
    variants: study.variants.map((v) => ({
      runId: v.runId,
      variantId: v.variantId,
      label: v.label,
      brief: composeVariantBrief(payload.brief, dimensionId, v.variantId),
    })),
    log,
  });

  log.info("study created", {
    studyId: study.id,
    uid: user.uid,
    dimension: payload.dimension,
    variants: payload.variantIds.length,
    cost,
  });

  return NextResponse.json({ id: study.id });
}

function composeVariantBrief(
  base: string,
  dimensionId: (typeof validDimensionIds)[number],
  variantId: string,
): string {
  const dim = getDimension(dimensionId);
  const variant = dim.variants.find((v) => v.id === variantId);
  if (!variant) throw new Error(`Unknown variant '${variantId}'`);
  const trimmed = base.trimEnd();
  if (trimmed.includes("Constraints (treat as hard requirements):")) {
    return `${trimmed}\n- ${variant.constraint}`;
  }
  return `${trimmed}\n\nConstraints (treat as hard requirements):\n- ${variant.constraint}`;
}
