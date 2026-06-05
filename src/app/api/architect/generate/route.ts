import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/firebase/auth";
import { adminDb } from "@/lib/firebase/admin";
import { consumeCredit, refundCredit, InsufficientCreditsError } from "@/lib/credits/ledger";
import { runArchitect } from "@/lib/agent/orchestrator";
import type { ArchitectureDoc } from "@/types/architecture";

export const runtime = "nodejs";
export const maxDuration = 300; // 5 min cap

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

  // Create the architecture doc up-front so we can stream updates to it.
  const docRef = adminDb.collection("architectures").doc();
  const now = Date.now();
  const initial: ArchitectureDoc = {
    id: docRef.id,
    uid: user.uid,
    prompt: brief,
    status: "running",
    createdAt: now,
    modelVersion: process.env.VERTEX_MODEL || "gemini-2.5-pro",
  };
  await docRef.set(initial);

  // Deduct credit
  try {
    await consumeCredit(user.uid, `Architecture generation ${docRef.id}`, docRef.id);
  } catch (err) {
    if (err instanceof InsufficientCreditsError) {
      await docRef.update({ status: "failed", errorMessage: "Insufficient credits" });
      return new Response("Insufficient credits", { status: 402 });
    }
    throw err;
  }

  // SSE stream
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };
      send({ type: "init", architectureId: docRef.id });

      try {
        for await (const ev of runArchitect(brief)) {
          send(ev);
          if (ev.type === "complete") {
            const completedAt = Date.now();
            await docRef.update({
              status: "complete",
              architecture: ev.architecture,
              completedAt,
              durationMs: completedAt - now,
            });
          } else if (ev.type === "error") {
            await docRef.update({ status: "failed", errorMessage: ev.message });
            await refundCredit(user.uid, "Refund on generation failure", docRef.id);
          }
        }
      } catch (err) {
        const msg = (err as Error).message || "Generation failed";
        send({ type: "error", message: msg });
        await docRef.update({ status: "failed", errorMessage: msg });
        await refundCredit(user.uid, "Refund on generation failure", docRef.id);
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
