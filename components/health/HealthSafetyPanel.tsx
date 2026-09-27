"use client";

import React, { useState, useMemo } from "react";
import { Hotspot } from "@/lib/hotspots";
import { ThermalFeatureCollection } from "@/lib/thermal-data";
import {
  HEALTH_PROFILES,
  HealthProfileId,
  CoolRefugeSpot,
  evaluateAreaHealthSafety,
  findNearestCoolRefuges,
} from "@/lib/health-advisor";
import {
  HeartPulse,
  ShieldAlert,
  ShieldCheck,
  Clock,
  Droplets,
  Sun,
  Trees,
  Footprints,
  Navigation,
  ChevronDown,
  ChevronUp,
  Sparkles,
  UserCheck,
  AlertTriangle,
  Loader2,
  Stethoscope,
  Send,
  Route,
} from "lucide-react";
import type { AIHealthPrescription } from "@/app/api/health-advice/route";

const QUICK_SCENARIO_CHIPS = [
  "30-min walk or errands",
  "Outdoor jog / workout",
  "Walking dog on leash",
  "Asthma or heart sensitivity",
  "Stroller walk with child",
];

export interface HealthSafetyPanelProps {
  hotspots: Hotspot[];
  targetHotspot: Hotspot | null;
  onSelectTargetHotspot: (hotspot: Hotspot) => void;
  thermalData: ThermalFeatureCollection | null;
  activeCityName: string;
  activeCenter: [number, number];
  activeCoolingDropF: number; // Positive cooling magnitude (e.g. 6.8) when simulation is active
  onOpenSimulator: () => void;
  onFlyToCoolRefuge?: (refuge: CoolRefugeSpot) => void;
}

export function HealthSafetyPanel({
  hotspots,
  targetHotspot,
  onSelectTargetHotspot,
  thermalData,
  activeCityName,
  activeCenter,
  activeCoolingDropF,
  onOpenSimulator,
  onFlyToCoolRefuge,
}: HealthSafetyPanelProps) {
  const [profileId, setProfileId] = useState<HealthProfileId>("general");
  const [showFirstAid, setShowFirstAid] = useState<boolean>(false);
  const [customScenario, setCustomScenario] = useState<string>("");
  const [aiPrescription, setAiPrescription] =
    useState<AIHealthPrescription | null>(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const activeZoneName = targetHotspot?.name || `${activeCityName} Core`;
  const baselineSurfaceTempF = targetHotspot?.peakTempF || 98.5;
  const uhiDeltaF = targetHotspot?.deltaF || 18.0;
  const zoneCoords: [number, number] =
    targetHotspot?.coordinates || activeCenter;

  const assessment = useMemo(
    () =>
      evaluateAreaHealthSafety({
        zoneName: activeZoneName,
        baselineSurfaceTempF,
        uhiDeltaF,
        coolingDropF: activeCoolingDropF,
        profileId,
      }),
    [
      activeZoneName,
      baselineSurfaceTempF,
      uhiDeltaF,
      activeCoolingDropF,
      profileId,
    ]
  );

  const coolRefuges = useMemo(
    () =>
      findNearestCoolRefuges(
        thermalData,
        zoneCoords,
        assessment.surfaceTempF,
        3
      ),
    [thermalData, zoneCoords, assessment.surfaceTempF]
  );

  const statusTheme =
    assessment.status === "safe"
      ? {
          cardBg: "bg-[#1A2620] border-[#5E9A7B]/50",
          badgeBg: "bg-[#5E9A7B]/20 text-[#94C4AB] border-[#5E9A7B]/40",
          accentText: "text-[#78B093]",
          Icon: ShieldCheck,
        }
      : assessment.status === "caution"
      ? {
          cardBg: "bg-[#262118] border-[#E09F67]/50",
          badgeBg: "bg-[#E09F67]/20 text-[#F3C68F] border-[#E09F67]/40",
          accentText: "text-[#E09F67]",
          Icon: AlertTriangle,
        }
      : {
          cardBg: "bg-[#281C19] border-[#D97757]/55",
          badgeBg: "bg-[#D97757]/20 text-[#F2B8A2] border-[#D97757]/45",
          accentText: "text-[#E58E73]",
          Icon: ShieldAlert,
        };

  const StatusIcon = statusTheme.Icon;

  const handleGenerateAiHealthPlan = async (scenarioOverride?: string) => {
    const scenarioToUse =
      (scenarioOverride !== undefined ? scenarioOverride : customScenario).trim() ||
      `Leaving home right now as a ${assessment.profile.label}`;
    if (scenarioOverride !== undefined) {
      setCustomScenario(scenarioOverride);
    }

    setIsGeneratingAi(true);
    setAiError(null);

    try {
      const mappedProfileId =
        profileId === "general"
          ? "adult"
          : profileId === "worker"
          ? "athlete"
          : profileId;
      const mappedVerdict =
        assessment.status === "safe"
          ? "go"
          : assessment.status === "caution"
          ? "caution"
          : "stay_home";

      const res = await fetch("/api/health-advice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cityName: activeCityName,
          zoneName: activeZoneName,
          profileId: mappedProfileId,
          profileLabel: assessment.profile.label,
          surfaceTempF: assessment.surfaceTempF,
          feelsLikeF: assessment.effectiveFeelsLikeF,
          verdict: mappedVerdict,
          maxSafeMinutes: assessment.maxSafeExposureMinutes,
          waterCupsPerHour: assessment.hydrationCupsPerHour,
          pavementTempF: Math.round(assessment.surfaceTempF + 18),
          treeCanopyPct: Math.max(4, Math.round(32 - uhiDeltaF * 1.1)),
          imperviousPct: Math.min(96, Math.round(52 + uhiDeltaF * 1.8)),
          coolingAppliedF: assessment.activeCoolingDropF,
          nearestRefuges: coolRefuges.map((r) => ({
            name: r.name,
            distanceMiles: r.distanceMiles,
            temperatureF: r.temperatureF,
            coolerByF: r.coolerByF,
          })),
          userScenario: scenarioToUse,
        }),
      });

      if (!res.ok) {
        throw new Error(`Health AI request failed (${res.status})`);
      }

      const data = (await res.json()) as AIHealthPrescription;
      setAiPrescription(data);
    } catch (err: any) {
      setAiError(err?.message || "Unable to generate AI health plan");
    } finally {
      setIsGeneratingAi(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-3.5">
      {/* 1. Header & Area Selector + Personal Profile Selector */}
      <div className="rounded-2xl bg-[#211F1C] border border-[#33302B] p-4 space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#5E9A7B]/15 border border-[#5E9A7B]/35 flex items-center justify-center text-[#78B093]">
              <HeartPulse className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-display text-sm font-semibold text-[#F5F3EF]">
                Personal Heat Safety &amp; Health Guide
              </h2>
              <p className="text-xs text-[#8C857B]">
                Should you leave home for this area right now?
              </p>
            </div>
          </div>
        </div>

        {/* Selected Area Dropdown */}
        {hotspots.length > 0 && (
          <div className="space-y-1">
            <label
              htmlFor="health-zone-select"
              className="text-xs font-medium text-[#B8B1A7] block"
            >
              Checking Neighborhood Area:
            </label>
            <select
              id="health-zone-select"
              value={targetHotspot?.id || ""}
              onChange={(e) => {
                const found = hotspots.find((h) => h.id === e.target.value);
                if (found) onSelectTargetHotspot(found);
              }}
              className="w-full bg-[#181614] border border-[#33302B] rounded-xl px-3 py-2 text-xs font-medium text-[#F5F3EF] focus:outline-none focus:border-[#5E9A7B]"
            >
              {hotspots.map((h) => (
                <option key={h.id} value={h.id} className="bg-[#181614]">
                  #{h.rank} {h.name} ({h.peakTempF.toFixed(1)}°F surface)
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Who is going outside? Profile Switcher */}
        <div className="space-y-1.5 pt-1 border-t border-[#2F2C28]">
          <span className="text-xs font-medium text-[#B8B1A7] flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-[#78B093]" />
            Who is going outside?
          </span>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
            {HEALTH_PROFILES.map((prof) => {
              const isSelected = prof.id === profileId;
              return (
                <button
                  key={prof.id}
                  type="button"
                  onClick={() => setProfileId(prof.id)}
                  className={`px-2 py-1.5 rounded-lg text-[11px] font-medium transition-colors text-center border ${
                    isSelected
                      ? "bg-[#5E9A7B] text-[#141311] border-[#5E9A7B] font-semibold"
                      : "bg-[#181614] text-[#B8B1A7] border-[#2E2B27] hover:text-[#F5F3EF]"
                  }`}
                >
                  {prof.shortLabel}
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-[#8C857B]">
            {assessment.profile.description}
          </p>
        </div>
      </div>

      {/* 2. Primary "Should I Leave Home?" Verdict Card */}
      <div
        className={`rounded-2xl border p-4 space-y-3.5 transition-colors ${statusTheme.cardBg}`}
      >
        <div className="flex items-start justify-between gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${statusTheme.badgeBg}`}
          >
            <StatusIcon className="w-3.5 h-3.5" />
            {assessment.verdictBadge}
          </span>
          {assessment.activeCoolingDropF > 0.2 && (
            <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md bg-[#5E9A7B]/20 text-[#94C4AB] border border-[#5E9A7B]/35">
              Cooled -{assessment.activeCoolingDropF}°F
            </span>
          )}
        </div>

        <div>
          <h3 className="font-display text-base font-bold text-[#F5F3EF] leading-snug">
            {assessment.verdictHeadline}
          </h3>
          <p className="text-xs text-[#D6D0C6] leading-relaxed mt-1">
            {assessment.verdictSummary}
          </p>
        </div>

        {/* 3 Core Personal Health Readouts */}
        <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-[#161513]/90 border border-[#33302B]">
          <div>
            <span className="text-[11px] text-[#B8B1A7] block">
              Feels Like
            </span>
            <span
              className={`font-display text-lg font-bold tabular-nums ${statusTheme.accentText}`}
            >
              {assessment.effectiveFeelsLikeF}°F
            </span>
            <span className="text-[10px] text-[#8C857B] block">
              Street Heat Index
            </span>
          </div>

          <div>
            <span className="text-[11px] text-[#B8B1A7] flex items-center gap-1">
              <Clock className="w-3 h-3 text-[#78B093]" />
              Safe Time
            </span>
            <span className="font-display text-lg font-bold text-[#F5F3EF] tabular-nums">
              {assessment.maxSafeExposureMinutes}m
            </span>
            <span className="text-[10px] text-[#8C857B] block">
              Max continuous
            </span>
          </div>

          <div>
            <span className="text-[11px] text-[#B8B1A7] flex items-center gap-1">
              <Droplets className="w-3 h-3 text-[#7BA7BC]" />
              Hydration
            </span>
            <span className="font-display text-lg font-bold text-[#F5F3EF] tabular-nums">
              {assessment.hydrationCupsPerHour} c/hr
            </span>
            <span className="text-[10px] text-[#8C857B] block">
              {assessment.hydrationOzPerHour} oz water/hr
            </span>
          </div>
        </div>

        {/* Dynamic Connection to Simulator: Show health improvement from cooling OR button to cool area */}
        {assessment.activeCoolingDropF > 0.2 ? (
          <div className="p-3 rounded-xl bg-[#5E9A7B]/15 border border-[#5E9A7B]/35 flex items-center justify-between gap-2">
            <div className="text-xs text-[#EAE5DD]">
              <span className="font-semibold text-[#94C4AB]">
                Cooling Health Impact:
              </span>{" "}
              Simulated trees &amp; cool roofs gained{" "}
              <span className="font-mono font-bold text-[#94C4AB]">
                +{assessment.addedSafeMinutesFromCooling} mins
              </span>{" "}
              of safer outdoor time (was {assessment.baselineMaxSafeMinutes}m).
            </div>
          </div>
        ) : (
          assessment.status !== "safe" && (
            <button
              type="button"
              onClick={onOpenSimulator}
              className="w-full py-2 px-3 rounded-xl bg-[#5E9A7B] hover:bg-[#6CA889] text-[#141311] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Simulate Cooling to Make This Area Safer</span>
            </button>
          )
        )}
      </div>

      {/* 2.5 AI Personal Health Doctor & Route Copilot (Groq LPU + Gemini Fallback) */}
      <div className="rounded-2xl bg-[#211F1C] border border-[#33302B] p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#5E9A7B]/15 border border-[#5E9A7B]/35 flex items-center justify-center text-[#78B093]">
              <Stethoscope className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="font-display text-sm font-semibold text-[#F5F3EF]">
                AI Personal Health &amp; Route Doctor
              </h3>
              <p className="text-[11px] text-[#8C857B]">
                Custom outdoor plan powered by Groq &amp; Gemini
              </p>
            </div>
          </div>
          {aiPrescription?.modelUsed && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#181614] text-[#94C4AB] border border-[#33302B]">
              {aiPrescription.modelUsed}
            </span>
          )}
        </div>

        {/* Quick Activity / Health Condition Chips */}
        <div className="flex flex-wrap gap-1.5">
          {QUICK_SCENARIO_CHIPS.map((chip) => (
            <button
              key={chip}
              type="button"
              disabled={isGeneratingAi}
              onClick={() => handleGenerateAiHealthPlan(chip)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors ${
                customScenario === chip
                  ? "bg-[#5E9A7B]/25 text-[#F5F3EF] border-[#5E9A7B]/50"
                  : "bg-[#181614] text-[#B8B1A7] border-[#2E2B27] hover:text-[#F5F3EF] hover:border-[#423E38]"
              }`}
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Custom Activity / Medical Question Input */}
        <div className="flex items-center gap-1.5">
          <input
            type="text"
            value={customScenario}
            onChange={(e) => setCustomScenario(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !isGeneratingAi) {
                handleGenerateAiHealthPlan();
              }
            }}
            placeholder="Or type activity (e.g., 40-min walk to grocery store)..."
            className="flex-1 bg-[#181614] border border-[#33302B] rounded-xl px-3 py-2 text-xs text-[#F5F3EF] placeholder:text-[#706A60] focus:outline-none focus:border-[#5E9A7B]"
          />
          <button
            type="button"
            disabled={isGeneratingAi}
            onClick={() => handleGenerateAiHealthPlan()}
            className="shrink-0 px-3 py-2 rounded-xl bg-[#5E9A7B] hover:bg-[#6CA889] disabled:opacity-50 text-[#141311] text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            {isGeneratingAi ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            <span>{isGeneratingAi ? "Analyzing..." : "Ask AI"}</span>
          </button>
        </div>

        {aiError && (
          <div className="p-2.5 rounded-xl bg-[#281C19] border border-[#D97757]/40 text-xs text-[#F2B8A2]">
            {aiError}
          </div>
        )}

        {/* Rendered AI Health Prescription */}
        {aiPrescription && (
          <div className="p-3.5 rounded-xl bg-[#181614] border border-[#33302B] space-y-2.5 text-xs">
            <div className="p-2.5 rounded-lg bg-[#5E9A7B]/12 border border-[#5E9A7B]/30 text-[#EAE5DD] font-medium leading-relaxed">
              <span className="text-[#78B093] font-semibold">AI Verdict: </span>
              {aiPrescription.doctorVerdict}
            </div>

            <p className="text-[#D6D0C6] leading-relaxed">
              {aiPrescription.personalizedPlan}
            </p>

            <div className="p-2.5 rounded-lg bg-[#211F1C] border border-[#2E2B27] space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#94C4AB]">
                <Route className="w-3.5 h-3.5" />
                <span>Coolest Route &amp; Shade Strategy</span>
              </div>
              <p className="text-[#D6D0C6] leading-relaxed">
                {aiPrescription.coolestRouteAdvice}
              </p>
            </div>

            <div className="p-2.5 rounded-lg bg-[#211F1C] border border-[#2E2B27] space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#7BA7BC]">
                <Droplets className="w-3.5 h-3.5" />
                <span>AI Hydration Protocol</span>
              </div>
              <p className="text-[#D6D0C6] leading-relaxed">
                {aiPrescription.hydrationProtocol}
              </p>
            </div>

            {aiPrescription.warningSignsForProfile?.length > 0 && (
              <div className="space-y-1 pt-0.5">
                <span className="text-[11px] font-semibold text-[#E09F67] block">
                  Early Warning Signs for {assessment.profile.shortLabel}:
                </span>
                {aiPrescription.warningSignsForProfile.map((sign, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-1.5 text-[11px] text-[#D6D0C6]"
                  >
                    <span className="text-[#E09F67] font-bold">•</span>
                    <span>{sign}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. Best Time to Leave Home Today (3-Window Schedule) */}
      <div className="rounded-2xl bg-[#211F1C] border border-[#33302B] p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Sun className="w-4 h-4 text-[#E09F67]" />
          <h3 className="font-display text-sm font-semibold text-[#F5F3EF]">
            Best Time to Leave Home Today
          </h3>
        </div>

        <div className="space-y-2">
          {assessment.dailyScheduleWindows.map((win) => {
            const winBadge =
              win.status === "safe"
                ? "bg-[#5E9A7B]/15 text-[#78B093] border-[#5E9A7B]/30"
                : win.status === "caution"
                ? "bg-[#E09F67]/15 text-[#E09F67] border-[#E09F67]/30"
                : "bg-[#D97757]/15 text-[#E58E73] border-[#D97757]/30";
            return (
              <div
                key={win.period}
                className="p-3 rounded-xl bg-[#1A1816] border border-[#2E2B27] space-y-1"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-[#F5F3EF]">
                    {win.period}
                  </span>
                  <span
                    className={`font-mono text-[11px] font-medium px-2 py-0.5 rounded-md border ${winBadge}`}
                  >
                    {win.timeRange}
                  </span>
                </div>
                <p className="text-xs text-[#B8B1A7] leading-relaxed">
                  {win.recommendation}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Sidewalk & Pet Paw Surface Burn Check + Personal Checklist */}
      <div className="rounded-2xl bg-[#211F1C] border border-[#33302B] p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Footprints className="w-4 h-4 text-[#D98A5B]" />
            <h3 className="font-display text-sm font-semibold text-[#F5F3EF]">
              Sidewalk &amp; Pet Paw Burn Check
            </h3>
          </div>
          <span
            className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md border ${
              assessment.pavementSafety.status === "safe"
                ? "bg-[#5E9A7B]/15 text-[#78B093] border-[#5E9A7B]/30"
                : assessment.pavementSafety.status === "hot"
                ? "bg-[#E09F67]/15 text-[#E09F67] border-[#E09F67]/30"
                : "bg-[#D97757]/20 text-[#E58E73] border-[#D97757]/40"
            }`}
          >
            {assessment.pavementSafety.status === "safe"
              ? "Safe Surface"
              : assessment.pavementSafety.status === "hot"
              ? "Hot Pavement"
              : "7-Sec Burn Risk"}
          </span>
        </div>

        <div className="p-3 rounded-xl bg-[#1A1816] border border-[#2E2B27] space-y-1">
          <div className="text-xs font-semibold text-[#F5F3EF]">
            {assessment.pavementSafety.label}
          </div>
          <p className="text-xs text-[#B8B1A7] leading-relaxed">
            {assessment.pavementSafety.detail}
          </p>
        </div>

        <div className="space-y-1.5 pt-1">
          <span className="text-xs font-semibold text-[#B8B1A7] block">
            Before You Step Outside Checklist:
          </span>
          {assessment.safetyChecklist.map((tip, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2 text-xs text-[#D6D0C6] leading-relaxed"
            >
              <span className="text-[#78B093] font-bold mt-0.5">✓</span>
              <span>{tip}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Nearest Cool Parks & Refuges in the City */}
      {coolRefuges.length > 0 && (
        <div className="rounded-2xl bg-[#211F1C] border border-[#33302B] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trees className="w-4 h-4 text-[#78B093]" />
              <div>
                <h3 className="font-display text-sm font-semibold text-[#F5F3EF]">
                  Nearest Cooler Parks &amp; Refuges
                </h3>
                <p className="text-[11px] text-[#8C857B]">
                  Safer outdoor spots near {activeZoneName}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            {coolRefuges.map((spot) => (
              <div
                key={spot.id}
                className="p-3 rounded-xl bg-[#1A1816] border border-[#2E2B27] flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-[#F5F3EF] truncate">
                    {spot.name}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-[#8C857B] mt-0.5 font-mono">
                    <span className="text-[#78B093] font-semibold">
                      {spot.temperatureF}°F (-{spot.coolerByF}°F cooler)
                    </span>
                    <span>·</span>
                    <span>{spot.distanceMiles} mi away</span>
                  </div>
                </div>

                {onFlyToCoolRefuge && (
                  <button
                    type="button"
                    onClick={() => onFlyToCoolRefuge(spot)}
                    className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#5E9A7B]/15 hover:bg-[#5E9A7B] text-[#94C4AB] hover:text-[#141311] border border-[#5E9A7B]/35 text-xs font-medium transition-colors"
                  >
                    <Navigation className="w-3 h-3" />
                    <span>View</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. Heat Illness Symptom Checker & First-Aid Reference */}
      <div className="rounded-2xl bg-[#211F1C] border border-[#33302B] p-4">
        <button
          type="button"
          onClick={() => setShowFirstAid(!showFirstAid)}
          className="w-full flex items-center justify-between text-left"
        >
          <div className="flex items-center gap-2">
            <HeartPulse className="w-4 h-4 text-[#E09F67]" />
            <span className="font-display text-sm font-semibold text-[#F5F3EF]">
              Heat Illness Symptoms &amp; First-Aid Guide
            </span>
          </div>
          {showFirstAid ? (
            <ChevronUp className="w-4 h-4 text-[#B8B1A7]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[#B8B1A7]" />
          )}
        </button>

        {showFirstAid && (
          <div className="mt-3 pt-3 border-t border-[#2F2C28] space-y-2.5 text-xs">
            <div className="p-3 rounded-xl bg-[#262118] border border-[#E09F67]/35 space-y-1">
              <div className="font-semibold text-[#F3C68F]">
                1. Heat Exhaustion (Act Immediately)
              </div>
              <p className="text-[#D6D0C6] leading-relaxed">
                <strong>Signs:</strong> Heavy sweating, dizziness, headache, muscle cramps, nausea, cool pale skin.
              </p>
              <p className="text-[#EAE5DD] leading-relaxed">
                <strong>Action:</strong> Move to an air-conditioned room or shaded park, loosen clothing, apply cool wet cloths, and sip water slowly.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[#281C19] border border-[#D97757]/40 space-y-1">
              <div className="font-semibold text-[#F2B8A2]">
                2. Heat Stroke (Call 911 Emergency)
              </div>
              <p className="text-[#D6D0C6] leading-relaxed">
                <strong>Signs:</strong> Confusion, slurred speech, body temp above 103°F, hot red/dry skin, rapid pulse, or fainting.
              </p>
              <p className="text-[#EAE5DD] leading-relaxed">
                <strong>Action:</strong> Call 911 immediately. Cool the person rapidly with cold water or ice packs on neck, armpits, and groin. Do NOT give fluids if confused.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
