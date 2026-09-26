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
              <div key={i} className="flex items-start gap-1.5 pl-1">
                <span className="text-[#10B981] font-bold mt-0.5">•</span>
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
      {/* Bottom-Right Floating Trigger Pill (when drawer is closed) */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 bezel-shell shadow-[0_20px_50px_rgba(0,0,0,0.85)] group"
          aria-label="Open HeatShield AI Advisor"
        >
          <div className="bezel-core bg-[#060809]/95 hover:bg-[#0B0F12] backdrop-blur-xl px-4 py-2.5 border border-[#10B981]/40 flex items-center gap-3 transition-all">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#10B981]" />
            </span>
            <MessageSquare className="w-4 h-4 text-[#10B981]" />
            <div className="text-left">
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#F4F6F7] block">
                HeatShield AI Advisor
              </span>
              <span className="font-mono text-[9px] text-[#10B981] block">
                Groq LPU • Ask Climatologist
              </span>
            </div>
          </div>
        </button>
      )}

      {/* Slide-Out Right Chat Drawer (400px–420px wide per UI-SPEC.md Screen 3) */}
      {isOpen && (
        <div className="fixed top-20 right-4 bottom-4 w-[92vw] sm:w-[410px] z-50 bezel-shell shadow-[0_30px_90px_rgba(0,0,0,0.95)] flex flex-col animate-in slide-in-from-right-6 duration-200">
          <div className="bezel-core bg-[#060809]/95 backdrop-blur-2xl border border-[#10B981]/30 w-full h-full flex flex-col overflow-hidden">
            {/* Drawer Header */}
            <div className="p-3.5 border-b border-white/[0.08] flex items-center justify-between bg-[#0B0F12]/90">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#10B981]/15 border border-[#10B981]/35 flex items-center justify-center text-[#10B981]">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-sm font-bold text-[#F4F6F7]">
                      HeatShield AI Advisor
                    </h3>
                    <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                  </div>
                  <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#10B981] block truncate max-w-[230px]">
                    Context: {targetLabel}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleResetChat}
                  title="Reset Conversation"
                  className="p-1.5 rounded-lg text-[#94A3AB] hover:text-[#F4F6F7] hover:bg-white/[0.06] transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  title="Close AI Advisor"
                  className="p-1.5 rounded-lg text-[#94A3AB] hover:text-[#F4F6F7] hover:bg-white/[0.06] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Message History Scroll Area */}
            <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
              {messages.map((msg) => {
                const isUser = msg.role === "user";
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      isUser ? "items-end" : "items-start"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 px-1">
                      {isUser ? (
                        <>
                          <span className="font-mono text-[9px] text-[#526068]">
                            {msg.timestamp}
                          </span>
                          <span className="font-mono text-[9px] uppercase tracking-wider text-[#94A3AB] flex items-center gap-1">
                            Planner <User className="w-2.5 h-2.5" />
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="font-mono text-[9px] uppercase tracking-wider text-[#10B981] flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5" />
                            {msg.modelUsed || "Groq LPU"}
                          </span>
                          <span className="font-mono text-[9px] text-[#526068]">
                            • {msg.timestamp}
                          </span>
                        </>
                      )}
                    </div>

                    <div
                      className={`max-w-[90%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                        isUser
                          ? "bg-[#10B981] text-[#060809] font-medium rounded-br-sm"
                          : "bg-[#0B0F12] text-[#D5DDE2] border border-white/[0.08] rounded-bl-sm"
                      }`}
                    >
                      {msg.imagePreview && (
                        <div className="mb-2 rounded-lg overflow-hidden border border-black/20">
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
            <div className="px-3.5 py-2 border-t border-white/[0.06] bg-[#0B0F12]/60">
              <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#526068] block mb-1.5">
                Suggested Climatology Queries
              </span>
              <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {suggestionChips.map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    disabled={isStreaming}
                    onClick={() => sendMessage(chip)}
                    className="shrink-0 px-2.5 py-1 rounded-full bg-white/[0.04] hover:bg-[#10B981]/15 border border-white/[0.08] hover:border-[#10B981]/40 text-[10px] text-[#94A3AB] hover:text-[#F4F6F7] transition-all whitespace-nowrap"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>

            {/* Optional Image Attachment Preview (for Qwen 3.8 Vision) */}
            {imageAttachment && (
              <div className="px-3.5 py-2 bg-[#10B981]/10 border-t border-[#10B981]/30 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Camera className="w-3.5 h-3.5 text-[#10B981]" />
                  <span className="font-mono text-[10px] text-[#F4F6F7]">
                    Image attached for{" "}
                    <strong className="text-[#10B981]">qwen/qwen3.8-27b</strong>{" "}
                    Vision Audit
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setImageAttachment(null)}
                  className="text-[#94A3AB] hover:text-[#F4F6F7]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage();
              }}
              className="p-3 border-t border-white/[0.08] bg-[#0B0F12] flex flex-col gap-2"
            >
              <div className="flex items-center gap-1.5">
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
                  title="Attach neighborhood photo or map screenshot for Qwen 3.8 Vision analysis"
                  className="p-2 rounded-xl bg-white/[0.04] hover:bg-[#10B981]/15 border border-white/[0.08] hover:border-[#10B981]/40 text-[#94A3AB] hover:text-[#10B981] transition-colors shrink-0"
                >
                  <ImagePlus className="w-4 h-4" />
                </button>

                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about cooling ROI, trees, albedo..."
                  disabled={isStreaming}
                  className="flex-1 bg-[#060809] border border-white/[0.1] rounded-xl px-3 py-2 text-xs text-[#F4F6F7] placeholder:text-[#526068] focus:outline-none focus:border-[#10B981]"
                />

                <button
                  type="submit"
                  disabled={isStreaming || (!input.trim() && !imageAttachment)}
                  aria-label="Send message"
                  className="p-2 rounded-xl bg-[#10B981] hover:bg-[#34D399] disabled:opacity-40 text-[#060809] transition-colors shrink-0"
                >
                  {isStreaming ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Powered by Groq Badge per UI-SPEC.md Screen 3 */}
              <div className="flex items-center justify-between px-1 font-mono text-[9px] text-[#526068]">
                <span className="flex items-center gap-1">
                  <Cpu className="w-2.5 h-2.5 text-[#10B981]" />
                  Powered by Groq LPU ({activeModel})
                </span>
                <span>Qwen 3.8 Vision Enabled</span>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
