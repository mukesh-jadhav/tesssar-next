import "server-only";

import { getArchitectModel } from "@/lib/vertex/client";
import { ARCHITECT_SYSTEM_PROMPT, buildUserPrompt } from "./prompts";
import { Architecture } from "@/types/architecture";

export type ProgressEvent =
  | { type: "phase"; phase: ArchitectPhase; message: string }
  | { type: "tokens"; tokens: number }
  | { type: "complete"; architecture: Architecture }
  | { type: "error"; message: string };

export type ArchitectPhase =
  | "analyzing"
  | "selecting-components"
  | "designing-data-flow"
  | "drafting-diagrams"
  | "computing-scale"
  | "assessing-risks"
  | "hardening-security"
  | "finalizing";

const PHASE_TRIGGERS: Array<{ phase: ArchitectPhase; needle: RegExp; message: string }> = [
  { phase: "analyzing", needle: /"requirements"\s*:/i, message: "Parsing the brief & extracting requirements" },
  { phase: "selecting-components", needle: /"components"\s*:/i, message: "Selecting components & tech stack" },
  { phase: "designing-data-flow", needle: /"data_flows"\s*:/i, message: "Designing data flow & APIs" },
  { phase: "drafting-diagrams", needle: /"diagrams"\s*:/i, message: "Drafting C4, sequence & deployment diagrams" },
  { phase: "computing-scale", needle: /"scale_profiles"\s*:/i, message: "Computing scale profiles & cost estimates" },
  { phase: "assessing-risks", needle: /"risks"\s*:/i, message: "Identifying risks & applied cloud patterns" },
  { phase: "hardening-security", needle: /"security"\s*:/i, message: "Hardening security & observability plan" },
  { phase: "finalizing", needle: /"open_questions"\s*:/i, message: "Finalizing roadmap & open questions" },
];

/**
 * Run the architect agent with streaming progress events.
 * Yields ProgressEvent values as the model streams; final event is `complete` or `error`.
 */
export async function* runArchitect(brief: string): AsyncGenerator<ProgressEvent> {
  const model = getArchitectModel();

  const result = await model.generateContentStream({
    systemInstruction: { role: "system", parts: [{ text: ARCHITECT_SYSTEM_PROMPT }] },
    contents: [{ role: "user", parts: [{ text: buildUserPrompt(brief) }] }],
  });

  let buffer = "";
  let tokens = 0;
  const seenPhases = new Set<ArchitectPhase>();

  yield { type: "phase", phase: "analyzing", message: "Connecting to Gemini 2.5 Pro on Vertex AI" };

  try {
    for await (const chunk of result.stream) {
      const text = chunk.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      if (!text) continue;
      buffer += text;
      tokens += Math.ceil(text.length / 4);

      for (const trigger of PHASE_TRIGGERS) {
        if (!seenPhases.has(trigger.phase) && trigger.needle.test(buffer)) {
          seenPhases.add(trigger.phase);
          yield { type: "phase", phase: trigger.phase, message: trigger.message };
        }
      }

      yield { type: "tokens", tokens };
    }
  } catch (err) {
    yield { type: "error", message: (err as Error).message || "Stream failed" };
    return;
  }

  // Parse and validate
  const cleaned = stripMarkdownFences(buffer.trim());
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    // Repair attempt: ask model to fix
    const repaired = await repairJson(buffer, (err as Error).message);
    if (!repaired) {
      yield { type: "error", message: "Model returned invalid JSON and repair failed" };
      return;
    }
    parsed = repaired;
  }

  const validation = Architecture.safeParse(parsed);
  if (!validation.success) {
    yield {
      type: "error",
      message: `Schema validation failed: ${validation.error.issues
        .slice(0, 3)
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ")}`,
    };
    return;
  }

  yield { type: "complete", architecture: validation.data };
}

function stripMarkdownFences(s: string): string {
  // Sometimes models wrap in ```json ... ``` despite instructions
  const fenceMatch = s.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  if (fenceMatch) return fenceMatch[1]!;
  return s;
}

async function repairJson(original: string, error: string): Promise<unknown | null> {
  try {
    const model = getArchitectModel();
    const res = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `The following JSON has a parse error: ${error}\n\nReturn the corrected JSON only — no commentary, no markdown fences.\n\n---\n${original}`,
            },
          ],
        },
      ],
    });
    const text = res.response.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    return JSON.parse(stripMarkdownFences(text.trim()));
  } catch {
    return null;
  }
}

/** Non-streaming variant used by API routes that just want the final result. */
export async function generateArchitecture(brief: string): Promise<Architecture> {
  let final: Architecture | null = null;
  for await (const ev of runArchitect(brief)) {
    if (ev.type === "complete") final = ev.architecture;
    if (ev.type === "error") throw new Error(ev.message);
  }
  if (!final) throw new Error("Generation produced no result");
  return final;
}
