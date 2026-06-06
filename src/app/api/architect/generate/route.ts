import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/firebase/auth";
import { adminDb } from "@/lib/firebase/admin";
import { consumeCredit, refundCredit, InsufficientCreditsError } from "@/lib/credits/ledger";
import { runArchitect } from "@/lib/agent/orchestrator";
import type { ArchitectureDoc } from "@/types/architecture";

export const runtime = "nodejs";
export const maxDuration = 900;

/**
 * POST /api/architect/generate
 *
 * Returns within ~200ms with `{ id }`. The heavy Gemini work runs in
 * a detached promise that writes incremental progress onto
 * `architectures/{id}.progress` and the final architecture onto the
 * same doc. The client subscribes to that doc via Firestore
 * onSnapshot, so a run survives tab close, refresh, slow network,
 * and proxy timeouts.
 *
 * The worker promise is parked in a module-scope Set so Cloud Run
 * doesn't GC it after the response is sent. Combined with
 * min-instances=1, this is enough for the current load. A stricter
 * setup would push to Cloud Tasks instead.
 */

const inflight = new Set<Promise<unknown>>();

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { brief } = (await req.json()) as { brief?: string };
  if (!brief || brief.trim().length < 30) {
    return new Response("Brief must be at least 30 characters", { status: 400 });
  }
  if (brief.length > 8000) {
    return new Response("Brief too long (8000 char max)", { status: 400 });
  }

  const docRef = adminDb.collection("architectures").doc();
  const now = Date.now();
  const initial: ArchitectureDoc = {
    id: docRef.id,
    uid: user.uid,
    prompt: brief,
    status: "running",
    createdAt: now,
    modelVersion: process.env.VERTEX_MODEL || "gemini-2.5-pro",
    progress: {
      phase: "analyzing",
      message: "Queued — connecting to Gemini on Vertex AI",
      tokens: 0,
      updatedAt: now,
    },
  };
  await docRef.set(initial);

  try {
    await consumeCredit(user.uid, `Architecture generation ${docRef.id}`, docRef.id);
  } catch (err) {
    if (err instanceof InsufficientCreditsError) {
      await docRef.update({
        status: "failed",
        errorMessage: "Insufficient credits",
      });
      return new Response("Insufficient credits", { status: 402 });
    }
    throw err;
  }

  const work = runWorker({ docRef, brief, uid: user.uid, startedAt: now })
    .catch((err) => {
      console.error(`[architect ${docRef.id}] worker crashed`, err);
    })
    .finally(() => {
      inflight.delete(work);
    });
  inflight.add(work);

  return NextResponse.json({ id: docRef.id });
}

async function runWorker({
  docRef,
  brief,
  uid,
  startedAt,
}: {
  docRef: FirebaseFirestore.DocumentReference;
  brief: string;
  uid: string;
  startedAt: number;
}) {
  let lastWriteAt = 0;
  const PROGRESS_THROTTLE_MS = 600;

  async function writeProgress(phase: string, message: string, tokens: number, force = false) {
    const now = Date.now();
    if (!force && now - lastWriteAt < PROGRESS_THROTTLE_MS) return;
    lastWriteAt = now;
    await docRef.update({
      progress: { phase, message, tokens, updatedAt: now },
    });
  }

  let phase = "analyzing";
  let message = "Connecting to Gemini 2.5 Pro on Vertex AI";
  let tokens = 0;

  try {
    for await (const ev of runArchitect(brief)) {
      if (ev.type === "phase") {
        phase = ev.phase;
        message = ev.message;
        await writeProgress(phase, message, tokens, true);
      } else if (ev.type === "tokens") {
        tokens = ev.tokens;
        await writeProgress(phase, message, tokens);
      } else if (ev.type === "complete") {
        const completedAt = Date.now();
        await docRef.update({
          status: "complete",
          architecture: ev.architecture,
          completedAt,
          durationMs: completedAt - startedAt,
          progress: {
            phase: "finalizing",
            message: "Done",
            tokens,
            updatedAt: completedAt,
          },
        });
      } else if (ev.type === "error") {
        await docRef.update({
          status: "failed",
          errorMessage: ev.message,
        });
        await refundCredit(uid, "Refund on generation failure", docRef.id);
      }
    }
  } catch (err) {
    const msg = (err as Error).message || "Generation failed";
    await docRef.update({ status: "failed", errorMessage: msg });
    await refundCredit(uid, "Refund on generation failure", docRef.id);
  }
}
