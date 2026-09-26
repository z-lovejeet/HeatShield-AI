import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Primary fallback chain: newest -> oldest
export const GEMINI_ANALYSIS_MODELS = [
  "gemini-3.8-flash",
  "gemini-3.7-flash",
  "gemini-3.6-flash",
  "gemini-3.5-flash",
] as const;

// Lite model for high-frequency, low-stakes calls
export const GEMINI_LITE_MODEL = "gemini-3.5-flash-lite";

// Legacy stable fallback if all 3.x models fail
export const GEMINI_LEGACY_FALLBACK = "gemini-2.5-flash";

export interface GeminiCallOptions {
  temperature?: number;
  maxOutputTokens?: number;
  responseMimeType?: string;
  timeoutMs?: number;
}

export async function callGeminiWithFallback(
  prompt: string,
  systemInstruction: string,
  options: GeminiCallOptions = {}
) {
  const allModels = [
    ...GEMINI_ANALYSIS_MODELS,
    GEMINI_LITE_MODEL,
    GEMINI_LEGACY_FALLBACK,
  ];
  const errors: string[] = [];
  const timeoutMs = options.timeoutMs ?? 12000;

  for (const modelName of allModels) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction,
        generationConfig: {
          temperature: options.temperature ?? 0.3,
          maxOutputTokens: options.maxOutputTokens ?? 2048,
          ...(options.responseMimeType && {
            responseMimeType: options.responseMimeType,
          }),
        },
      });

      const result = await model.generateContent(prompt, {
        timeout: timeoutMs,
      });
      console.log(`[Gemini] Success with model: ${modelName}`);
      return { response: result.response, modelUsed: modelName };
    } catch (error: any) {
      const status = error?.status || error?.statusCode;
      const msg = error?.message || "Unknown error";
      errors.push(`${modelName}: ${status || "ERR"} - ${msg}`);

      if (
        status === 429 ||
        status === 503 ||
        msg?.includes("quota") ||
        msg?.includes("timeout") ||
        msg?.includes("aborted") ||
        msg?.includes("503")
      ) {
        console.warn(`[Gemini] ${modelName} failed (${status || "timeout"}), trying next...`);
        continue;
      }

      throw error;
    }
  }

  throw new Error(
    `All Gemini models exhausted. Errors:\n${errors.join("\n")}`
  );
}

// Lightweight call for tooltips, quick calcs — no fallback needed
export async function callGeminiLite(
  prompt: string,
  systemInstruction: string = "You are a helpful sustainability assistant. Be very concise."
) {
  const model = genAI.getGenerativeModel({
    model: GEMINI_LITE_MODEL,
    systemInstruction,
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 256,
    },
  });

  const result = await model.generateContent(prompt, { timeout: 8000 });
  return result.response;
}

// JSON-specific call for structured analysis reports
export async function callGeminiJSON(
  prompt: string,
  systemInstruction: string
) {
  return callGeminiWithFallback(prompt, systemInstruction, {
    temperature: 0.3,
    maxOutputTokens: 2048,
    responseMimeType: "application/json",
  });
}
