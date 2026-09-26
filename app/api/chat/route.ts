import { NextRequest, NextResponse } from "next/server";
import { streamGroqChat, callGroqVision } from "@/lib/groq";
import { callGeminiWithFallback } from "@/lib/gemini";
import {
  CHAT_ADVISOR_SYSTEM_PROMPT,
  VISION_ADVISOR_SYSTEM_PROMPT,
  MapContextPayload,
  buildMapContextPrompt,
} from "@/lib/prompts";

export interface ChatRequest {
  messages: Array<{
    role: "user" | "assistant" | "system";
    content: string;
  }>;
  mapContext?: MapContextPayload;
  imageDataUrl?: string | null;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ChatRequest;
    const rawMessages = body.messages || [];

    if (rawMessages.length === 0 && !body.imageDataUrl) {
      return NextResponse.json(
        { error: "messages array is required" },
        { status: 400 }
      );
    }

    const contextBlock = buildMapContextPrompt(body.mapContext);
    const systemPrompt = `${CHAT_ADVISOR_SYSTEM_PROMPT}${contextBlock}`;

    // 1. If an image is attached, route to Groq Vision Agent (qwen/qwen3.8-27b per AGENT-ARCHITECTURE.md §2.4)
    if (body.imageDataUrl) {
      const lastUserMsg =
        [...rawMessages].reverse().find((m) => m.role === "user")?.content ||
        "Analyze this neighborhood or thermal map image for heat-trapping surfaces and recommend high-ROI cooling interventions.";

      const visionSystem = `${VISION_ADVISOR_SYSTEM_PROMPT}${contextBlock}`;
      const { response, modelUsed } = await callGroqVision(
        lastUserMsg,
        body.imageDataUrl,
        visionSystem,
        true
      );

      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of response as any) {
              const token = chunk?.choices?.[0]?.delta?.content || "";
              if (token) {
                controller.enqueue(encoder.encode(token));
              }
            }
          } catch (err) {
            console.error("[Groq Vision Stream Error]:", err);
          } finally {
            controller.close();
          }
        },
      });

      return new Response(readable, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          "X-Model-Used": modelUsed,
        },
      });
    }

    // 2. Standard Conversational Chat via Groq LPU Fallback Chain (120B -> 20B -> Qwen 27B)
    const formattedMessages: Array<{
      role: "system" | "user" | "assistant";
      content: string;
    }> = [
      { role: "system", content: systemPrompt },
      ...rawMessages
        .filter((m) => m.role !== "system")
        .slice(-10)
        .map((m) => ({
          role: m.role as "user" | "assistant",
          content: String(m.content || ""),
        })),
    ];

    try {
      const { response, modelUsed } = await streamGroqChat(formattedMessages, {
        temperature: 0.7,
        max_tokens: 1024,
      });

      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of response as any) {
              const token = chunk?.choices?.[0]?.delta?.content || "";
              if (token) {
                controller.enqueue(encoder.encode(token));
              }
            }
          } catch (err) {
            console.error("[Groq Chat Stream Error]:", err);
          } finally {
            controller.close();
          }
        },
      });

      return new Response(readable, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          "X-Model-Used": modelUsed,
        },
      });
    } catch (groqErr) {
      console.warn(
        "[/api/chat] Groq chain failed, cascading to Gemini fallback:",
        groqErr
      );

      // Cross-provider fallback to Gemini Flash if Groq is unreachable
      const lastUserPrompt =
        formattedMessages
          .filter((m) => m.role !== "system")
          .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
          .join("\n\n") || "Provide urban heat island cooling advice.";

      const { response, modelUsed } = await callGeminiWithFallback(
        lastUserPrompt,
        systemPrompt,
        { temperature: 0.7, maxOutputTokens: 1024 }
      );
      const text = response.text() || "";

      return new Response(text, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          "X-Model-Used": modelUsed,
        },
      });
    }
  } catch (error: any) {
    console.error("[POST /api/chat Error]:", error);
    return NextResponse.json(
      { error: error?.message || "Chat advisor failed" },
      { status: 500 }
    );
  }
}
