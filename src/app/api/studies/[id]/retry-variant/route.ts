import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { getSessionUser } from "@/lib/firebase/auth";
import { adminDb } from "@/lib/firebase/admin";
import {
  consumeCredit,
  refundCredit,
  InsufficientCreditsError,
} from "@/lib/credits/ledger";
import { installShutdownDrain } from "@/lib/agent/shutdown";
import {
  composeVariantBrief,
  startStudyWorkers,
} from "@/lib/agent/studies";
import { getVariant } from "@/lib/studies/dimensions";
import { RUN_COST_CREDITS } from "@/lib/razorpay/packs";
import type { ArchitectureDoc } from "@/types/architecture";
import type { StudyDoc, StudyVariant } from "@/types/study";
import { clientIp, rateLimit, rateLimitResponse } from "@/lib/security/rateLimit";
import { requestLogger } from "@/lib/security/log";

export const runtime = "nodejs";
export const maxDuration = 900;

installShutdownDrain();

/**
 * POST /api/studies/[id]/retry-variant
 *
 * Charges RUN_COST_CREDITS and re-runs a single failed variant. The new
 * run replaces the old runId in `study.variants[]`. The old (failed)
 * arch doc has its study tags cleared so it doesn't double-count as a
 * variant of this study, but is otherwise preserved.
 *
 * Restricted to `failed` variants — promotion handles the "use this one"
 * path for completed variants, and re-running a complete variant would
 * silently spend 40 credits.
 *
 * Per docs/STUDY_PLAN.md §7 + §8.
 */

const RetryBody = z.object({
  variantId: z.string().min(1).max(64),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const log = requestLogger(req, "studies.retry-variant");

  const ipGuard = rateLimit({
    key: `studies:retry:ip:${clientIp(req)}`,
    limit: 8,
    windowMs: 60_000,
  });
  if (!ipGuard.ok) return rateLimitResponse(ipGuard);

  const user = await getSessionUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const userGuard = rateLimit({
    key: `studies:retry:uid:${user.uid}`,
    limit: 3,
    windowMs: 60_000,
  });
  if (!userGuard.ok) return rateLimitResponse(userGuard);

  let body: z.infer<typeof RetryBody>;
  try {
    body = RetryBody.parse(await req.json());
  } catch (err) {
    const msg =
      err instanceof z.ZodError
        ? err.issues[0]?.message ?? "Invalid request"
        : "Invalid JSON body";
    return new Response(msg, { status: 400 });
  }

  // Ownership + variant existence (pre-charge read).
  const studyRef = adminDb.collection("studies").doc(params.id);
  const studySnap = await studyRef.get();
  if (!studySnap.exists) return new Response("Not found", { status: 404 });
  const study = studySnap.data() as StudyDoc;
  if (study.uid !== user.uid) return new Response("Not found", { status: 404 });

  const variantIndex = study.variants.findIndex(
    (v) => v.variantId === body.variantId,
  );
  if (variantIndex < 0) {
    return new Response("variantId is not part of this study", { status: 400 });
  }
  const oldVariant = study.variants[variantIndex];
  if (oldVariant.status !== "failed") {
    return new Response(
      "Only failed variants can be retried — use the variant as-is or synthesize",
      { status: 409 },
    );
  }

  // Catalog lookup (also validates the variantId is a known dimension).
  let dimensionVariant: ReturnType<typeof getVariant>;
  try {
    dimensionVariant = getVariant(study.dimension, body.variantId);
  } catch {
    return new Response("Unknown variant id for this study's dimension", {
      status: 400,
    });
  }

  // Pre-allocate the new arch id so it can be the refId on both the
  // credit charge and any refund.
  const newRunId = adminDb.collection("architectures").doc().id;
  const newBrief = composeVariantBrief(study.prompt, dimensionVariant.constraint);

  // Charge BEFORE any docs are touched. On creation/swap failure, we
  // refund. On worker failure, runVariantWorker refunds.
  try {
    await consumeCredit(
      user.uid,
      `Study variant retry ${study.id}/${body.variantId}`,
      newRunId,
      RUN_COST_CREDITS,
    );
  } catch (err) {
    if (err instanceof InsufficientCreditsError) {
      return new Response("Insufficient credits", { status: 402 });
    }
    log.error("retry credit charge failed", {
      studyId: study.id,
      err: (err as Error).message,
    });
    return new Response("Could not charge credits", { status: 500 });
  }

  // Atomically:
  //   1. re-validate the variant is still failed (no race with another retry)
  //   2. write the new arch doc as `running` with study tags
  //   3. swap study.variants[i] to point at the new runId, status=running
  //   4. clear study tags on the old failed arch doc so it doesn't
  //      appear as a variant of this study
  //   5. promote study.status back to "running"
  const newArchRef = adminDb.collection("architectures").doc(newRunId);
  const oldArchRef = adminDb.collection("architectures").doc(oldVariant.runId);
  const now = Date.now();

  try {
    await adminDb.runTransaction(async (tx) => {
      const fresh = await tx.get(studyRef);
      if (!fresh.exists) throw new Error("Study disappeared");
      const s = fresh.data() as StudyDoc;
      const idx = s.variants.findIndex((v) => v.variantId === body.variantId);
      if (idx < 0) throw new Error("Variant disappeared");
      const cur = s.variants[idx];
      if (cur.status !== "failed") {
        throw new Error("Variant is no longer failed");
      }

      // Build the new variant entry; spread the new array immutably so
      // Firestore receives a flat replacement (no nested FieldValue mix).
      const newVariant: StudyVariant = {
        label: dimensionVariant.label,
        variantId: dimensionVariant.id,
        runId: newRunId,
        status: "running",
      };
      const nextVariants = s.variants.slice();
      nextVariants[idx] = newVariant;

      // Initial arch doc for the new run.
      const initial: ArchitectureDoc = {
        id: newRunId,
        uid: user.uid,
        prompt: newBrief,
        status: "running",
        createdAt: now,
        modelVersion: process.env.VERTEX_MODEL || "gemini-2.5-pro",
        progress: {
          phase: "analyzing",
          message: `Queued (${dimensionVariant.label}) — retrying the architect`,
          tokens: 0,
          updatedAt: now,
        },
        studyId: study.id,
        variantLabel: dimensionVariant.label,
        variantId: dimensionVariant.id,
      };

      tx.set(newArchRef, initial);
      tx.update(oldArchRef, {
        studyId: FieldValue.delete(),
        variantLabel: FieldValue.delete(),
        variantId: FieldValue.delete(),
      });
      tx.update(studyRef, {
        variants: nextVariants,
        status: "running",
        completedAt: FieldValue.delete(),
      });
    });
  } catch (err) {
    log.error("retry transaction failed", {
      studyId: study.id,
      variantId: body.variantId,
      err: (err as Error).message,
    });
    await safeRefund(user.uid, study.id, newRunId, log);
    return new Response("Could not start retry", { status: 500 });
  }

  // Spawn the worker. Mirrors the initial fan-out path so failure
  // accounting (refund + bumpStudyOnVariantTerminal) reuses the same
  // tested code.
  try {
    startStudyWorkers({
      studyId: study.id,
      uid: user.uid,
      variants: [
        {
          runId: newRunId,
          variantId: dimensionVariant.id,
          label: dimensionVariant.label,
          brief: newBrief,
        },
      ],
      log,
    });
  } catch (err) {
    log.error("retry worker spawn failed", {
      studyId: study.id,
      variantId: body.variantId,
      err: (err as Error).message,
    });
    // The arch doc was created and study.variants[] was swapped; mark
    // the new run failed so the cockpit reflects it, and refund.
    try {
      await newArchRef.update({
        status: "failed",
        errorMessage: "Could not start retry worker",
      });
    } catch (err2) {
      log.error("retry mark-failed write failed", {
        studyId: study.id,
        err: (err2 as Error).message,
      });
    }
    await safeRefund(user.uid, study.id, newRunId, log);
    return new Response("Could not start retry", { status: 500 });
  }

  log.info("retry variant started", {
    studyId: study.id,
    oldRunId: oldVariant.runId,
    newRunId,
    variantId: dimensionVariant.id,
  });

  return NextResponse.json({ runId: newRunId });
}

async function safeRefund(
  uid: string,
  studyId: string,
  runId: string,
  log: ReturnType<typeof requestLogger>,
) {
  try {
    await refundCredit(
      uid,
      `Refund on retry start failure (${studyId})`,
      runId,
      RUN_COST_CREDITS,
    );
  } catch (err) {
    log.error("retry refund failed", {
      studyId,
      runId,
      err: (err as Error).message,
    });
  }
}
