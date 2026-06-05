import "server-only";

import { VertexAI, type GenerativeModel, HarmCategory, HarmBlockThreshold } from "@google-cloud/vertexai";

let cached: GenerativeModel | null = null;

export function getArchitectModel(): GenerativeModel {
  if (cached) return cached;

  const project = process.env.GCP_PROJECT_ID;
  const location = process.env.GCP_LOCATION || "us-central1";
  const modelName = process.env.VERTEX_MODEL || "gemini-2.5-pro";

  if (!project) {
    throw new Error("GCP_PROJECT_ID env var is required for Vertex AI");
  }

  const vertex = new VertexAI({ project, location });

  cached = vertex.getGenerativeModel({
    model: modelName,
    generationConfig: {
      temperature: 0.45,
      topP: 0.95,
      maxOutputTokens: 32_768,
      responseMimeType: "application/json",
    },
    safetySettings: [
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
    ],
  });

  return cached;
}
