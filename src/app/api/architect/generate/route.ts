import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/firebase/auth";
import { adminDb } from "@/lib/firebase/admin";
import { consumeCredit, refundCredit, InsufficientCreditsError } from "@/lib/credits/ledger";
import { runArchitect } from "@/lib/agent/orchestrator";
import type { ArchitectureDoc } from "@/types/architecture";
import { clientIp, rateLimit, rateLimitResponse } from "@/lib/security/rateLimit";
import { requestLogger, type RequestLogger } from "@/lib/security/log";

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
  const log = requestLogger(req, "generate");
  // IP-scoped guard runs first so anonymous floods can't burn Firebase auth.
  const ipGuard = rateLimit({
    key: `generate:ip:${clientIp(req)}`,
    limit: 20,
    windowMs: 60_000,
  });
  if (!ipGuard.ok) return rateLimitResponse(ipGuard);

  const user = await getSessionUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  // Per-user guard: 5 generations / minute. The real cost guard is the
  // credit ledger; this just absorbs runaway loops and abusive scripts.
  const userGuard = rateLimit({
    key: `generate:uid:${user.uid}`,
    limit: 5,
    windowMs: 60_000,
  });
  if (!userGuard.ok) return rateLimitResponse(userGuard);

  const { brief } = (await req.json()) as { brief?: string };
  if (!brief || brief.trim().length < 30) {
    return new Response("Brief must be at least 30 characters", { status: 400 });
  }
  // 10000 leaves ~2KB headroom above the 8000-char user textarea for the
  // optional Constraints block composed from BriefPreferences.
  if (brief.length > 10000) {
    return new Response("Brief too long (10000 char max)", { status: 400 });
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
      message: "Queued — starting the architect",
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

  const work = runWorker({ docRef, brief, uid: user.uid, startedAt: now, log })
    .catch((err) => {
      log.error("worker crashed", { archId: docRef.id, err: (err as Error).message });
    })
    .finally(() => {
      inflight.delete(work);
    });
  inflight.add(work);

  log.info("generation started", { archId: docRef.id, uid: user.uid });
  return NextResponse.json({ id: docRef.id });
}

async function runWorker({
  docRef,
  brief,
  uid,
  startedAt,
  log,
}: {
  docRef: FirebaseFirestore.DocumentReference;
  brief: string;
  uid: string;
  startedAt: number;
  log: RequestLogger;
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
  let message = "Connecting to the architect";
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
        log.error("agent reported error", { archId: docRef.id, message: ev.message });
        await docRef.update({
          status: "failed",
          errorMessage: ev.message,
        });
        await refundCredit(uid, "Refund on generation failure", docRef.id);
      }
    }
  } catch (err) {
    const msg = (err as Error).message || "Generation failed";
    log.error("worker exception", { archId: docRef.id, err: msg });
    await docRef.update({ status: "failed", errorMessage: msg });
    await refundCredit(uid, "Refund on generation failure", docRef.id);
  }
}
