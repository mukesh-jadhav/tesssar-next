import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/firebase/auth";
import { adminDb } from "@/lib/firebase/admin";
import {
  consumeCredit,
  refundCredit,
  InsufficientCreditsError,
} from "@/lib/credits/ledger";
import { installShutdownDrain } from "@/lib/agent/shutdown";
import { startSynthesisWorker } from "@/lib/agent/studies";
import {
  composeSynthesisBrief,
  type SynthesisSourceVariant,
} from "@/lib/studies/synthesis";
import { SYNTHESIS_COST_CREDITS } from "@/lib/studies/pricing";
import { Architecture, type ArchitectureDoc } from "@/types/architecture";
import {
  PickSliceId,
  type Picks,
  type StudyDoc,
} from "@/types/study";
import { clientIp, rateLimit, rateLimitResponse } from "@/lib/security/rateLimit";
import { requestLogger } from "@/lib/security/log";

export const runtime = "nodejs";
export const maxDuration = 900;

installShutdownDrain();

/**
 * POST /api/studies/[id]/synthesize
 *
 * Composes the user's picks into a final architecture run. Charges
 * SYNTHESIS_COST_CREDITS atomically before spawning the worker; refunds
 * on agent failure or worker exception. Idempotent against concurrent
 * calls — if a synthesis already landed for this study, returns the
 * existing finalRunId.
 *
 * Per docs/STUDY_PLAN.md §7 + §10.
 */

// Strict validator: every slice present and non-empty. zod's `.record`
// allows partial keys, so we extend with a refinement.
const SynthesizeBody = z.object({
  picks: z
    .record(PickSliceId, z.string().min(1).max(64))
    .refine(
      (p) => (Object.keys(p) as Array<keyof typeof p>).length === PickSliceId.options.length,
      { message: "All slices must be picked" },
    ),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const log = requestLogger(req, "studies.synthesize");

  // Stage 1: rate limits. IP-scoped first so anonymous floods can't burn
  // Firebase auth work.
  const ipGuard = rateLimit({
    key: `studies:synth:ip:${clientIp(req)}`,
    limit: 8,
    windowMs: 60_000,
  });
  if (!ipGuard.ok) return rateLimitResponse(ipGuard);

  const user = await getSessionUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const userGuard = rateLimit({
    key: `studies:synth:uid:${user.uid}`,
    limit: 3,
    windowMs: 60_000,
  });
  if (!userGuard.ok) return rateLimitResponse(userGuard);

  // Stage 2: body validation.
  let body: z.infer<typeof SynthesizeBody>;
  try {
    body = SynthesizeBody.parse(await req.json());
  } catch (err) {
    const msg =
      err instanceof z.ZodError
        ? err.issues[0]?.message ?? "Invalid request"
        : "Invalid JSON body";
    return new Response(msg, { status: 400 });
  }

  // Stage 3: load + own the study.
  const studyRef = adminDb.collection("studies").doc(id);
  const studySnap = await studyRef.get();
  if (!studySnap.exists) return new Response("Not found", { status: 404 });
  const study = studySnap.data() as StudyDoc;
  if (study.uid !== user.uid) return new Response("Not found", { status: 404 });

  // Stage 4: study must be in a synthesizable state.
  if (study.status === "running") {
    return new Response("Study is still running — wait for variants to finish", {
      status: 409,
    });
  }
  if (study.status === "failed") {
    return new Response("All variants failed; nothing to synthesize", {
      status: 409,
    });
  }

  // Stage 5: idempotency. If a synthesis already landed (or is in flight),
  // surface the existing run id.
  if (study.finalRunId) {
    return NextResponse.json({ finalRunId: study.finalRunId });
  }

  // Stage 6: validate each picked variantId is actually part of THIS study,
  // and the picked variant is complete (we can't synthesize from a failed one).
  const variantById = new Map(study.variants.map((v) => [v.variantId, v]));
  const picksTyped = body.picks as Picks;
  for (const [sliceId, variantId] of Object.entries(picksTyped) as Array<
    [keyof Picks, string]
  >) {
    const variant = variantById.get(variantId);
    if (!variant) {
      return new Response(
        `Pick for ${sliceId} references unknown variant '${variantId}'`,
        { status: 400 },
      );
    }
    if (variant.status !== "complete") {
      return new Response(
        `Pick for ${sliceId} references variant '${variant.label}' which did not complete`,
        { status: 409 },
      );
    }
  }

  // Stage 7: load the architecture payload for each unique picked variant.
  const uniqueVariantIds = Array.from(new Set(Object.values(picksTyped)));
  const archSnaps = await Promise.all(
    uniqueVariantIds.map((vid) => {
      const v = variantById.get(vid)!;
      return adminDb.collection("architectures").doc(v.runId).get();
    }),
  );
  const sources: SynthesisSourceVariant[] = [];
  for (let i = 0; i < uniqueVariantIds.length; i++) {
    const vid = uniqueVariantIds[i];
    const v = variantById.get(vid)!;
    const snap = archSnaps[i];
    if (!snap.exists) {
      return new Response(`Variant '${v.label}' data missing`, { status: 500 });
    }
    const archDoc = snap.data() as ArchitectureDoc;
    // Defense in depth: even though the study's uid was checked, re-check
    // ownership on each arch doc.
    if (archDoc.uid !== user.uid) {
      log.error("synthesis arch ownership mismatch", {
        studyId: study.id,
        runId: archDoc.id,
      });
      return new Response("Forbidden", { status: 403 });
    }
    const parsed = Architecture.safeParse(archDoc.architecture);
    if (!parsed.success) {
      return new Response(
        `Variant '${v.label}' payload failed validation`,
        { status: 500 },
      );
    }
    sources.push({
      variantId: vid,
      label: v.label,
      arch: parsed.data,
    });
  }

  // Stage 8: compose the synthesis brief deterministically.
  const composed = composeSynthesisBrief({
    originalPrompt: study.prompt,
    picks: picksTyped,
    variants: sources,
  });

  // Stage 9: pre-allocate the result arch id so it can be the refId on
  // both the credit charge and a potential refund.
  const finalRunId = adminDb.collection("architectures").doc().id;

  // Stage 10: charge before doc creation; refund if creation throws.
  try {
    await consumeCredit(
      user.uid,
      `Study synthesis ${study.id}`,
      finalRunId,
      SYNTHESIS_COST_CREDITS,
    );
  } catch (err) {
    if (err instanceof InsufficientCreditsError) {
      return new Response("Insufficient credits", { status: 402 });
    }
    log.error("synthesis credit charge failed", {
      studyId: study.id,
      err: (err as Error).message,
    });
    return new Response("Could not charge credits", { status: 500 });
  }

  // Stage 11: transactionally claim the synthesis slot on the study doc.
  // Persists picks for audit; protects against concurrent synth requests
  // racing past the earlier idempotency check.
  let claimedByUs = false;
  try {
    claimedByUs = await adminDb.runTransaction(async (tx) => {
      const fresh = await tx.get(studyRef);
      if (!fresh.exists) return false;
      const s = fresh.data() as StudyDoc;
      if (s.finalRunId) return false; // lost the race
      tx.update(studyRef, {
        picks: picksTyped,
        // Note: we do NOT set finalRunId here yet — that's written by the
        // worker on `complete`. The presence of `picks` + the arch doc
        // existing (with synthesizedFrom.studyId) is enough to detect an
        // in-flight synthesis on re-poll.
      });
      return true;
    });
  } catch (err) {
    log.error("synthesis claim transaction failed", {
      studyId: study.id,
      err: (err as Error).message,
    });
    await safeRefund(user.uid, study.id, finalRunId, log);
    return new Response("Could not start synthesis", { status: 500 });
  }

  if (!claimedByUs) {
    // Re-fetch and return the established finalRunId.
    await safeRefund(user.uid, study.id, finalRunId, log);
    const after = (await studyRef.get()).data() as StudyDoc | undefined;
    if (after?.finalRunId) {
      return NextResponse.json({ finalRunId: after.finalRunId });
    }
    return new Response("Synthesis already in progress", { status: 409 });
  }

  // Stage 12: spawn the worker. The worker writes the result doc + flips
  // study.finalRunId on success; refunds on failure.
  try {
    await startSynthesisWorker({
      finalRunId,
      studyId: study.id,
      uid: user.uid,
      brief: composed.brief,
      picks: picksTyped,
      refundCredits: SYNTHESIS_COST_CREDITS,
      log,
    });
  } catch (err) {
    log.error("synthesis worker spawn failed", {
      studyId: study.id,
      err: (err as Error).message,
    });
    await safeRefund(user.uid, study.id, finalRunId, log);
    return new Response("Could not start synthesis", { status: 500 });
  }

  log.info("synthesis started", {
    studyId: study.id,
    finalRunId,
    crossSource: composed.crossSource,
    pickedVariants: uniqueVariantIds.length,
  });

  return NextResponse.json({ finalRunId });
}

async function safeRefund(
  uid: string,
  studyId: string,
  finalRunId: string,
  log: ReturnType<typeof requestLogger>,
) {
  try {
    await refundCredit(
      uid,
      `Refund on synthesis start failure (${studyId})`,
      finalRunId,
      SYNTHESIS_COST_CREDITS,
    );
  } catch (err) {
    log.error("synthesis refund failed", {
      studyId,
      finalRunId,
      err: (err as Error).message,
    });
  }
}
