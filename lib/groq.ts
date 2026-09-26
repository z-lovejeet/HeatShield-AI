import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || "" });

// Ordered by capability: best first, lightest last (per AGENT-ARCHITECTURE.md §0 & §3)
export const GROQ_CHAT_MODELS = [
  "openai/gpt-oss-120b", // Primary: Best reasoning, structured outputs
  "openai/gpt-oss-20b",  // Fallback 1: Same features, lower rate limit risk
  "qwen/qwen3.8-27b",    // Fallback 2: Different provider fallback, 16K max output + Vision
] as const;

export const GROQ_VISION_MODEL = "qwen/qwen3.8-27b";

export interface GroqCallOptions {
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  response_format?: { type: "json_object" | "text" };
}

export async function callGroqWithFallback(
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
  options: GroqCallOptions = {}
) {
  const errors: string[] = [];

  for (const model of GROQ_CHAT_MODELS) {
    try {
      const response = await groq.chat.completions.create({
        model,
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.max_tokens ?? 1024,
        stream: options.stream ?? false,
        ...(options.response_format && {
          response_format: options.response_format,
        }),
      });

      console.log(`[Groq] Success with model: ${model}`);
      return { response, modelUsed: model };
    } catch (error: any) {
      const status = error?.status || error?.statusCode;
      const msg = error?.message || "Unknown error";
      errors.push(`${model}: ${status || "ERR"} - ${msg}`);

      // Retry on rate limit (429), service unavailable (503), model not found (404/400), or timeout
      if (
        status === 429 ||
        status === 503 ||
        status === 404 ||
        status === 400 ||
        msg?.includes("rate") ||
        msg?.includes("model")
      ) {
        console.warn(`[Groq] ${model} failed (${status || "ERR"}), trying next...`);
        continue;
      }

      throw error;
    }
  }

  throw new Error(
    `All Groq models exhausted. Errors:\n${errors.join("\n")}`
  );
}

// Streaming variant for chat UI
export async function streamGroqChat(
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
  options: Omit<GroqCallOptions, "stream"> = {}
) {
  return callGroqWithFallback(messages, { ...options, stream: true });
}

// Vision Analysis Agent — Groq (qwen/qwen3.8-27b per AGENT-ARCHITECTURE.md §2.4)
export async function callGroqVision(
  userPrompt: string,
  imageDataUrl: string,
  systemPrompt: string,
  stream: boolean = false
) {
  const response = await groq.chat.completions.create({
    model: GROQ_VISION_MODEL,
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text:
              userPrompt ||
              "Analyze this urban surface image for heat-trapping materials, albedo deficiencies, and optimal cooling interventions.",
          },
          {
            type: "image_url",
            image_url: {
              url: imageDataUrl,
            },
          },
        ] as any,
      },
    ],
    temperature: 0.5,
    max_tokens: 1024,
    stream,
  });

  console.log(`[Groq Vision] Success with model: ${GROQ_VISION_MODEL}`);
  return { response, modelUsed: GROQ_VISION_MODEL };
}
