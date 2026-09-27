"use client";

import React, { useState, useRef, useEffect } from "react";
import { MapContextPayload } from "@/lib/prompts";
import {
  Bot,
  Camera,
  Cpu,
  ImagePlus,
  Loader2,
  MessageSquare,
  RotateCcw,
  Send,
  Sparkles,
  User,
  X,
} from "lucide-react";

export interface ChatMessageItem {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  modelUsed?: string;
  imagePreview?: string | null;
}

interface ChatAdvisorProps {
  mapContext: MapContextPayload;
  externalOpen?: boolean;
  onExternalOpenChange?: (open: boolean) => void;
}

export function ChatAdvisor({
  mapContext,
  externalOpen,
  onExternalOpenChange,
}: ChatAdvisorProps) {
  const [internalOpen, setInternalOpen] = useState<boolean>(false);
  const isOpen = externalOpen !== undefined ? externalOpen : internalOpen;

  const setIsOpen = (val: boolean) => {
    setInternalOpen(val);
    if (onExternalOpenChange) onExternalOpenChange(val);
  };

  const targetLabel =
    mapContext.selectedHotspot?.name ||
    mapContext.cityName ||
    "Portland, OR";

  const [messages, setMessages] = useState<ChatMessageItem[]>([
    {
      id: "welcome-0",
      role: "assistant",
      content: `Connected to **HeatShield 3D Telemetry**. I am monitoring **${
        mapContext.cityName || "Portland, OR"
      }** (${
        mapContext.parcelCount || 420
      } real OpenStreetMap ways). Ask me about localized UHI drivers, tree canopy vs. cool roof cost-effectiveness, or attach a street photo for **Qwen 3.8 Vision** surface albedo analysis.`,
      timestamp: "LIVE",
      modelUsed: "openai/gpt-oss-120b",
    },
  ]);

  const [input, setInput] = useState<string>("");
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [activeModel, setActiveModel] = useState<string>("openai/gpt-oss-120b");
  const [imageAttachment, setImageAttachment] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const suggestionChips = [
    `Most cost-effective way to cool ${
      mapContext.selectedHotspot
        ? `"${mapContext.selectedHotspot.name}"`
        : mapContext.cityName || "this area"
    }?`,
    "Compare 850 street trees vs. 65% cool roofs for ROI",
    "How do high-SRI cool roofs work & what do they cost?",
    "Analyze extreme heat health risks in this hotspot",
  ];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setImageAttachment(reader.result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const sendMessage = async (promptText?: string) => {
    const textToSend = (promptText ?? input).trim();
    if ((!textToSend && !imageAttachment) || isStreaming) return;

    const currentImage = imageAttachment;
    const userMsg: ChatMessageItem = {
      id: `user-${Date.now()}`,
      role: "user",
      content:
        textToSend ||
        "Analyze this urban image for heat-trapping surfaces and optimal cooling interventions.",
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      imagePreview: currentImage,
    };

    const assistantMsgId = `assistant-${Date.now() + 1}`;
    const placeholderAssistant: ChatMessageItem = {
      id: assistantMsgId,
      role: "assistant",
      content: "",
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      modelUsed: currentImage ? "qwen/qwen3.8-27b" : activeModel,
    };

    const updatedHistory = [...messages, userMsg];
    setMessages([...updatedHistory, placeholderAssistant]);
    setInput("");
    setImageAttachment(null);
    setIsStreaming(true);

    try {
      const apiMessages = updatedHistory.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: apiMessages,
          mapContext,
          imageDataUrl: currentImage,
        }),
      });

      const modelHeader = res.headers.get("X-Model-Used");
      if (modelHeader) {
        setActiveModel(modelHeader);
      }

      if (!res.ok || !res.body) {
        throw new Error(`HTTP ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        accumulated += chunk;

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  content: accumulated,
                  modelUsed:
                    modelHeader ||
                    (currentImage ? "qwen/qwen3.8-27b" : activeModel),
                }
              : m
          )
        );
      }
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId
            ? {
                ...m,
                content:
                  "Unable to reach Groq LPU stream right now. Based on EPA Urban Heat Island guidelines for this sector, combining high-SRI cool roof coatings (α ≥ 0.78) with targeted street tree canopy corridors delivers the highest cooling-per-dollar ROI (-4.5°F to -8.2°F localized surface reduction).",
              }
            : m
        )
      );
    } finally {
      setIsStreaming(false);
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: "assistant",
        content: `Telemetry context refreshed for **${targetLabel}**. How can I help optimize your urban cooling strategy?`,
        timestamp: "LIVE",
        modelUsed: activeModel,
      },
    ]);
  };

  // Simple lightweight formatter for bold text and bullet lines inside chat bubbles
  const renderFormattedContent = (raw: string) => {
    if (!raw) {
      return (
        <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-[#10B981]">
          <Loader2 className="w-3 h-3 animate-spin" />
          Streaming from Groq LPU...
        </span>
      );
    }

    const lines = raw.split("\n");
    return (
      <div className="space-y-1.5">
        {lines.map((line, i) => {
          const trimmed = line.trim();
          if (!trimmed) return <div key={i} className="h-1" />;

          // Render bold segments (**text**)
          const parts = line.split(/(\*\*.*?\*\*)/g);
          const renderedParts = parts.map((part, idx) => {
            if (part.startsWith("**") && part.endsWith("**")) {
              return (
                <strong key={idx} className="font-semibold text-[#F4F6F7]">
                  {part.slice(2, -2)}
                </strong>
              );
            }
            return <span key={idx}>{part}</span>;
          });

          if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
            return (
              <div key={i} className="flex items-start gap-2 pl-1">
                <span className="text-[#78B093] font-bold mt-0.5">•</span>
                <span className="flex-1">{renderedParts}</span>
              </div>
            );
          }

          return <p key={i}>{renderedParts}</p>;
        })}
      </div>
    );
  };

  return (
    <>
      {/* Top-Right Floating Trigger Button inside Map Canvas (avoids Mapbox bottom-right zoom controls) */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="absolute top-4 right-4 z-30 rounded-2xl bg-[#211F1C]/95 hover:bg-[#2A2724] border border-[#5E9A7B]/50 px-4 py-2.5 shadow-lg flex items-center gap-2.5 transition-colors"
          aria-label="Open HeatShield AI Advisor"
        >
          <div className="w-7 h-7 rounded-lg bg-[#5E9A7B]/20 flex items-center justify-center text-[#78B093]">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div className="text-left">
            <span className="text-xs font-semibold text-[#F5F3EF] block leading-tight">
              Ask AI Climate Advisor
            </span>
            <span className="text-[11px] text-[#78B093] block">
              Groq Chat &amp; Street Photo Vision
            </span>
          </div>
        </button>
      )}

      {/* Slide-Out Right Chat Drawer inside Map Canvas */}
      {isOpen && (
        <div className="absolute top-3 right-3 bottom-3 w-[92vw] sm:w-[400px] z-40 rounded-2xl bg-[#211F1C] border border-[#38342F] shadow-2xl flex flex-col overflow-hidden">
          {/* Drawer Header */}
          <div className="p-3.5 border-b border-[#2F2C28] flex items-center justify-between bg-[#1B1917]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#5E9A7B]/20 border border-[#5E9A7B]/40 flex items-center justify-center text-[#78B093]">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-display text-sm font-semibold text-[#F5F3EF]">
                  HeatShield AI Advisor
                </h3>
                <span className="text-xs text-[#78B093] block truncate max-w-[230px]">
                  Area: {targetLabel}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleResetChat}
                title="Reset Conversation"
                className="p-1.5 rounded-lg text-[#B8B1A7] hover:text-[#F5F3EF] hover:bg-white/[0.06] transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Close AI Advisor"
                className="p-1.5 rounded-lg text-[#B8B1A7] hover:text-[#F5F3EF] hover:bg-white/[0.06] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Message History Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
            {messages.map((msg) => {
              const isUser = msg.role === "user";
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    isUser ? "items-end" : "items-start"
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px] text-[#8C857B]">
                    {isUser ? (
                      <>
                        <span>{msg.timestamp}</span>
                        <span className="text-[#B8B1A7] flex items-center gap-1 font-medium">
                          You <User className="w-3 h-3" />
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-[#78B093] flex items-center gap-1 font-medium">
                          <Sparkles className="w-3 h-3" />
                          {msg.modelUsed || "Groq LPU"}
                        </span>
                        <span>· {msg.timestamp}</span>
                      </>
                    )}
                  </div>

                  <div
                    className={`max-w-[90%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-[13px] leading-relaxed ${
                      isUser
                        ? "bg-[#5E9A7B] text-[#141311] font-medium rounded-br-sm"
                        : "bg-[#181614] text-[#E6E1D8] border border-[#2F2C28] rounded-bl-sm"
                    }`}
                  >
                    {msg.imagePreview && (
                      <div className="mb-2 rounded-lg overflow-hidden border border-[#2F2C28]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={msg.imagePreview}
                          alt="Uploaded urban surface"
                          className="w-full max-h-36 object-cover"
                        />
                      </div>
                    )}
                    {isUser ? (
                      <p>{msg.content}</p>
                    ) : (
                      renderFormattedContent(msg.content)
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Pre-Loaded Suggestion Chips */}
          <div className="px-3.5 py-2.5 border-t border-[#2F2C28] bg-[#1B1917]">
            <span className="text-[11px] text-[#8C857B] block mb-1.5">
              Quick Questions
            </span>
            <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {suggestionChips.map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  disabled={isStreaming}
                  onClick={() => sendMessage(chip)}
                  className="shrink-0 px-3 py-1 rounded-lg bg-[#25221F] hover:bg-[#5E9A7B]/20 border border-[#38342F] hover:border-[#5E9A7B]/45 text-xs text-[#D6D0C6] hover:text-[#F5F3EF] transition-colors whitespace-nowrap"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

          {/* Optional Image Attachment Preview (for Qwen 3.8 Vision) */}
          {imageAttachment && (
            <div className="px-3.5 py-2 bg-[#5E9A7B]/15 border-t border-[#5E9A7B]/35 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-[#78B093]" />
                <span className="text-xs text-[#F5F3EF]">
                  Photo attached for{" "}
                  <strong className="text-[#78B093]">qwen/qwen3.8-27b</strong>{" "}
                  Vision Audit
                </span>
              </div>
              <button
                type="button"
                onClick={() => setImageAttachment(null)}
                className="text-[#B8B1A7] hover:text-[#F5F3EF]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="p-3 border-t border-[#2F2C28] bg-[#1B1917] flex flex-col gap-2"
          >
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Attach street photo for surface heat analysis"
                className="p-2.5 rounded-xl bg-[#25221F] hover:bg-[#5E9A7B]/20 border border-[#38342F] text-[#B8B1A7] hover:text-[#78B093] transition-colors shrink-0"
              >
                <ImagePlus className="w-4 h-4" />
              </button>

              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about cooling plans, trees, costs..."
                disabled={isStreaming}
                className="flex-1 bg-[#141311] border border-[#33302B] rounded-xl px-3.5 py-2 text-xs sm:text-[13px] text-[#F5F3EF] placeholder:text-[#8C857B] focus:outline-none focus:border-[#5E9A7B]"
              />

              <button
                type="submit"
                disabled={isStreaming || (!input.trim() && !imageAttachment)}
                aria-label="Send message"
                className="p-2.5 rounded-xl bg-[#5E9A7B] hover:bg-[#6CA889] disabled:opacity-40 text-[#141311] transition-colors shrink-0"
              >
                {isStreaming ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>

            <div className="flex items-center justify-between px-1 text-[11px] text-[#8C857B]">
              <span className="flex items-center gap-1.5">
                <Cpu className="w-3 h-3 text-[#78B093]" />
                Powered by Groq LPU ({activeModel})
              </span>
              <span>Qwen 3.8 Vision Enabled</span>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
