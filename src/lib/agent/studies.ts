import "server-only";

import { adminDb } from "@/lib/firebase/admin";
import { runArchitect } from "@/lib/agent/orchestrator";
import { trackRun, untrackRun } from "@/lib/agent/shutdown";
import { refundCredit } from "@/lib/credits/ledger";
import { RUN_COST_CREDITS } from "@/lib/razorpay/packs";
import {
  type BriefPreferences,
} from "@/lib/architectures/preferences";
import { getDimension, getVariant } from "@/lib/studies/dimensions";
import type {
  ArchitectureDoc,
  Architecture,
} from "@/types/architecture";
import type {
  DimensionId,
  StudyDoc,
  StudyStatus,
  StudyVariant,
  VariantStatus,
} from "@/types/study";
import type { RequestLogger } from "@/lib/security/log";

/**
 * Studies orchestrator — fan-out N variant generations and fan-in their
 * terminal states. Mirrors the single-run worker in
 * `app/api/architect/generate/route.ts`, but with study-aware credit
 * accounting, shutdown registration, and aggregate-status updates.
 *
 * Per docs/STUDY_PLAN.md §9.
 */

const PROGRESS_THROTTLE_MS = 600;

/** A live worker promise registered in the SIGTERM drain. */
type LiveWorker = Promise<unknown>;
const inflightWorkers = new Set<LiveWorker>();

/**
 * Append the variant's brief-constraint snippet to the user's already-
 * composed brief. We add it to the Constraints block so the agent treats
 * the variant choice with the same hardness as user-supplied preferences.
 */
function composeVariantBrief(baseBrief: string, constraint: string): string {
  // The base brief was already run through composeBriefWithPreferences in
  // the API route, so it may or may not already end with a Constraints
  // block. We append a fresh constraints line either way; the agent reads
  // the whole block as authoritative.
  const trimmed = baseBrief.trimEnd();
  if (trimmed.includes("Constraints (treat as hard requirements):")) {
    return `${trimmed}\n- ${constraint}`;
  }
  return `${trimmed}\n\nConstraints (treat as hard requirements):\n- ${constraint}`;
}

/**
 * Create the study doc + N architecture docs in a single batched write so
 * they're all visible to the caller's status endpoint immediately. Does
 * NOT charge credits — caller is responsible for charging atomically
 * BEFORE calling this. If this throws, caller must refund.
 *
 * Returns the persisted study doc.
 */
export async function createStudyDocs(args: {
  studyId: string;               // pre-allocated by caller so it can refId the credit charge
  uid: string;
  brief: string;                 // already composed with preferences
  preferences: BriefPreferences | undefined;
  dimensionId: DimensionId;
  variantIds: string[];
  creditsCharged: number;
}): Promise<StudyDoc> {
  const dim = getDimension(args.dimensionId);
  const now = Date.now();

  const studyRef = adminDb.collection("studies").doc(args.studyId);
  const variants: StudyVariant[] = [];
  const archRefs: Array<{
    ref: FirebaseFirestore.DocumentReference;
    variantId: string;
    label: string;
    brief: string;
  }> = [];

  for (const vid of args.variantIds) {
    const variant = getVariant(args.dimensionId, vid);
    const archRef = adminDb.collection("architectures").doc();
    const variantBrief = composeVariantBrief(args.brief, variant.constraint);
    variants.push({
      label: variant.label,
      variantId: variant.id,
      runId: archRef.id,
      status: "running",
    });
    archRefs.push({ ref: archRef, variantId: variant.id, label: variant.label, brief: variantBrief });
  }

  const studyDoc: StudyDoc = {
    id: studyRef.id,
    uid: args.uid,
    prompt: args.brief,
    dimension: args.dimensionId,
    variants,
    status: "running",
    creditsCharged: args.creditsCharged,
    createdAt: now,
  };

  const batch = adminDb.batch();
  batch.set(studyRef, studyDoc);
  for (const a of archRefs) {
    const initial: ArchitectureDoc = {
      id: a.ref.id,
      uid: args.uid,
      prompt: a.brief,
      status: "running",
      createdAt: now,
      modelVersion: process.env.VERTEX_MODEL || "gemini-2.5-pro",
      progress: {
        phase: "analyzing",
        message: `Queued (${a.label}) — starting the architect`,
        tokens: 0,
        updatedAt: now,
      },
      studyId: studyRef.id,
      variantLabel: a.label,
      variantId: a.variantId,
    };
    batch.set(a.ref, initial);
  }
  await batch.commit();

  // The dimension label isn't persisted but worth logging for ops triage.
  void dim;

  return studyDoc;
}

/**
 * Spawn one detached worker per variant. Returns immediately. Workers
 * write progress to their own arch doc, refund the per-variant credit on
 * failure, and bump the study aggregate status on every terminal flip.
 */
export function startStudyWorkers(args: {
  studyId: string;
  uid: string;
  variants: Array<{ runId: string; variantId: string; label: string; brief: string }>;
  log: RequestLogger;
}): void {
  for (const v of args.variants) {
    const archRef = adminDb.collection("architectures").doc(v.runId);
    const work: LiveWorker = runVariantWorker({
      studyId: args.studyId,
      uid: args.uid,
      archRef,
      variantId: v.variantId,
      label: v.label,
      brief: v.brief,
      log: args.log,
    })
      .catch((err) => {
        args.log.error("variant worker crashed", {
          studyId: args.studyId,
          variantId: v.variantId,
          runId: v.runId,
          err: (err as Error).message,
        });
      })
      .finally(() => {
        inflightWorkers.delete(work);
        untrackRun(v.runId);
      });
    inflightWorkers.add(work);
    trackRun(v.runId, {
      docRef: archRef,
      uid: args.uid,
      refundCredits: RUN_COST_CREDITS,
      studyId: args.studyId,
      variantId: v.variantId,
    });
  }
}

/**
 * One variant's worker. Equivalent to the per-run worker in
 * /api/architect/generate but writes back to a study-tagged arch doc and
 * bumps the parent study's aggregate status on terminal transitions.
 */
async function runVariantWorker(args: {
  studyId: string;
  uid: string;
  archRef: FirebaseFirestore.DocumentReference;
  variantId: string;
  label: string;
  brief: string;
  log: RequestLogger;
}): Promise<void> {
  const startedAt = Date.now();
  let lastWriteAt = 0;
  const writeProgress = async (
    phase: string,
    message: string,
    tokens: number,
    force = false,
  ) => {
    const now = Date.now();
    if (!force && now - lastWriteAt < PROGRESS_THROTTLE_MS) return;
    lastWriteAt = now;
    try {
      await args.archRef.update({
        progress: { phase, message, tokens, updatedAt: now },
      });
    } catch (err) {
      // Non-fatal — progress is advisory; the terminal state is what matters.
      args.log.warn("variant progress write failed", {
        studyId: args.studyId,
        variantId: args.variantId,
        err: (err as Error).message,
      });
    }
  };

  let phase = "analyzing";
  let message = `Connecting to the architect (${args.label})`;
  let tokens = 0;
  let finished = false;

  try {
    for await (const ev of runArchitect(args.brief)) {
      if (ev.type === "phase") {
        phase = ev.phase;
        message = ev.message;
        await writeProgress(phase, message, tokens, true);
      } else if (ev.type === "tokens") {
        tokens = ev.tokens;
        await writeProgress(phase, message, tokens);
      } else if (ev.type === "complete") {
        finished = true;
        const completedAt = Date.now();
        await args.archRef.update({
          status: "complete",
          architecture: ev.architecture as Architecture,
          completedAt,
          durationMs: completedAt - startedAt,
          progress: {
            phase: "finalizing",
            message: "Done",
            tokens,
            updatedAt: completedAt,
          },
        });
        await bumpStudyOnVariantTerminal(
          args.studyId,
          args.variantId,
          "complete",
        );
      } else if (ev.type === "error") {
        finished = true;
        args.log.error("variant agent reported error", {
          studyId: args.studyId,
          variantId: args.variantId,
          message: ev.message,
        });
        await args.archRef.update({
          status: "failed",
          errorMessage: ev.message,
        });
        await refundCredit(
          args.uid,
          `Refund on study variant failure (${args.label})`,
          args.archRef.id,
          RUN_COST_CREDITS,
        );
        await bumpStudyOnVariantTerminal(
          args.studyId,
          args.variantId,
          "failed",
          ev.message,
        );
      }
    }
  } catch (err) {
    const msg = (err as Error).message || "Generation failed";
    args.log.error("variant worker exception", {
      studyId: args.studyId,
      variantId: args.variantId,
      err: msg,
    });
    if (!finished) {
      try {
        await args.archRef.update({ status: "failed", errorMessage: msg });
      } catch (err2) {
        args.log.error("variant failure write failed", {
          studyId: args.studyId,
          variantId: args.variantId,
          err: (err2 as Error).message,
        });
      }
      try {
        await refundCredit(
          args.uid,
          `Refund on study variant failure (${args.label})`,
          args.archRef.id,
          RUN_COST_CREDITS,
        );
      } catch (err2) {
        args.log.error("variant refund failed", {
          studyId: args.studyId,
          variantId: args.variantId,
          err: (err2 as Error).message,
        });
      }
      await bumpStudyOnVariantTerminal(
        args.studyId,
        args.variantId,
        "failed",
        msg,
      );
    }
  }
}

/**
 * Atomic study-doc fan-in. Flips the named variant's status entry to its
 * terminal value, then recomputes the aggregate `study.status`:
 *   all complete   → "complete"
 *   all failed     → "failed"
 *   mixed terminal → "partial"
 *   any still running → unchanged ("running")
 *
 * Idempotent — if the variant is already terminal, this is a no-op.
 */
export async function bumpStudyOnVariantTerminal(
  studyId: string,
  variantId: string,
  terminal: Exclude<VariantStatus, "running">,
  errorMessage?: string,
): Promise<void> {
  const ref = adminDb.collection("studies").doc(studyId);
  await adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) return;
    const study = snap.data() as StudyDoc;
    let mutated = false;
    const variants: StudyVariant[] = study.variants.map((v) => {
      if (v.variantId !== variantId) return v;
      if (v.status !== "running") return v; // already terminal
      mutated = true;
      const next: StudyVariant = { ...v, status: terminal };
      if (terminal === "failed" && errorMessage) {
        next.errorMessage = errorMessage;
      }
      return next;
    });
    if (!mutated) return;

    const anyRunning = variants.some((v) => v.status === "running");
    const anyComplete = variants.some((v) => v.status === "complete");
    const anyFailed = variants.some((v) => v.status === "failed");

    let nextStatus: StudyStatus = study.status;
    if (!anyRunning) {
      if (anyComplete && anyFailed) nextStatus = "partial";
      else if (anyFailed) nextStatus = "failed";
      else nextStatus = "complete";
    }

    const update: Partial<StudyDoc> & { completedAt?: number } = {
      variants,
      status: nextStatus,
    };
    if (!anyRunning && !study.completedAt) {
      update.completedAt = Date.now();
    }
    tx.update(ref, update as FirebaseFirestore.UpdateData<StudyDoc>);
  });
}

/**
 * Watchdog-equivalent for studies: if any of a study's running variants
 * has gone silent for too long, flip it to failed + refund. Called from
 * the status endpoint on every poll AND from the study page server
 * component on initial load, mirroring the single-run reapIfStuck.
 *
 * The actual stuck-arch detection is done by reapIfStuck on each
 * underlying arch doc; this just translates a flipped arch doc into a
 * variant-status update on the study via bumpStudyOnVariantTerminal.
 */
export async function reapStudyIfStuck(study: StudyDoc): Promise<StudyDoc> {
  if (study.status !== "running" && study.status !== "partial") return study;

  // Lazy import to avoid pulling the architect chain into the rate-limit
  // path when there's nothing to reap.
  const { reapIfStuck } = await import("./watchdog");

  let mutated = false;
  for (const v of study.variants) {
    if (v.status !== "running") continue;
    const archSnap = await adminDb
      .collection("architectures")
      .doc(v.runId)
      .get();
    if (!archSnap.exists) continue;
    const arch = archSnap.data() as ArchitectureDoc;
    const reaped = await reapIfStuck(arch);
    if (reaped.status === "failed") {
      await bumpStudyOnVariantTerminal(
        study.id,
        v.variantId,
        "failed",
        reaped.errorMessage,
      );
      mutated = true;
    }
  }

  if (!mutated) return study;
  const fresh = await adminDb.collection("studies").doc(study.id).get();
  return fresh.exists ? (fresh.data() as StudyDoc) : study;
}
