"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Hotspot } from "@/lib/hotspots";
import { AnalysisReportData, RecommendedInterventionItem } from "@/lib/prompts";
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  DollarSign,
  FileSpreadsheet,
  Flame,
  Globe2,
  Loader2,
  Sparkles,
  Target,
  ThermometerSnowflake,
} from "lucide-react";

interface AnalysisReportProps {
  hotspots: Hotspot[];
  targetHotspot: Hotspot | null;
  onSelectTargetHotspot: (hotspot: Hotspot | null) => void;
  activeCityName: string;
  parcelCount: number;
  autoTriggerCount?: number;
  onApplyRecommendationToSim: (config: {
    treeCount: number;
    coolRoofPct: number;
    waterFeatureCount: number;
  }) => void;
}

export function AnalysisReport({
  hotspots,
  targetHotspot,
  onSelectTargetHotspot,
  activeCityName,
  parcelCount,
  autoTriggerCount = 0,
  onApplyRecommendationToSim,
}: AnalysisReportProps) {
  const [report, setReport] = useState<AnalysisReportData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [sectorWide, setSectorWide] = useState<boolean>(false);

  const effectiveHotspot = sectorWide
    ? null
    : targetHotspot || (hotspots.length > 0 ? hotspots[0] : null);

  const generateReport = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cityName: activeCityName,
          parcelCount,
          targetHotspot: effectiveHotspot
            ? {
                rank: effectiveHotspot.rank,
                name: effectiveHotspot.name,
                peakTempF: effectiveHotspot.peakTempF,
                meanTempF: effectiveHotspot.meanTempF,
                deltaF: effectiveHotspot.deltaF,
                riskLevel: effectiveHotspot.riskLevel,
                surfaceType: effectiveHotspot.surfaceType,
                primaryCause: effectiveHotspot.primaryCause,
                coordinates: effectiveHotspot.coordinates,
              }
            : null,
          topHotspots: hotspots.slice(0, 5).map((h) => ({
            rank: h.rank,
            name: h.name,
            peakTempF: h.peakTempF,
            deltaF: h.deltaF,
            riskLevel: h.riskLevel,
            surfaceType: h.surfaceType,
          })),
          averageTemp: effectiveHotspot
            ? effectiveHotspot.meanTempF
            : hotspots[0]
            ? Number((hotspots[0].peakTempF - 8.5).toFixed(1))
            : 94.2,
          populationDensityEstimate: 7400,
        }),
      });

      if (!res.ok) {
        throw new Error(`Audit failed (HTTP ${res.status})`);
      }

      const data = (await res.json()) as AnalysisReportData;
      setReport(data);

      try {
        localStorage.setItem(
          "heatshield_last_analysis",
          JSON.stringify({
            timestamp: new Date().toISOString(),
            cityName: activeCityName,
            ...data,
          })
        );
      } catch {
        // Ignore quota errors
      }
    } catch (err: any) {
      setError(err?.message || "Could not synthesize AI report");
    } finally {
      setIsLoading(false);
    }
  }, [activeCityName, parcelCount, effectiveHotspot, hotspots]);

  // Automatically trigger report generation when user clicks "AI Audit" on a hotspot card
  useEffect(() => {
    if (autoTriggerCount > 0) {
      setSectorWide(false);
      generateReport();
    }
  }, [autoTriggerCount, generateReport]);

  const handleApplyIntervention = (item: RecommendedInterventionItem) => {
    const cfg = item.suggestedSimConfig || {
      treeCount: 850,
      coolRoofPct: 55,
      waterFeatureCount: 5,
    };
    onApplyRecommendationToSim(cfg);
  };

  return (
    <div className="w-80 sm:w-[350px] bezel-shell shadow-2xl">
      <div className="bezel-core bg-[#060809]/95 backdrop-blur-xl p-4 flex flex-col gap-3 max-h-[calc(100dvh-140px)] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-[#10B981]/15 text-[#10B981]">
              <FileSpreadsheet className="w-3.5 h-3.5" />
            </span>
            <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-[#F4F6F7]">
              Gemini AI Climate Audit
            </span>
          </div>
          {report?.modelUsed && (
            <span className="font-mono text-[9px] text-[#10B981] bg-[#10B981]/10 border border-[#10B981]/25 px-2 py-0.5 rounded-full truncate max-w-[115px]">
              {report.modelUsed}
            </span>
          )}
        </div>

        {/* Target Zone Selector */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="audit-target-select"
            className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#94A3AB] flex items-center gap-1.5"
          >
            <Target className="w-3 h-3 text-[#10B981]" />
            Audit Target Sector
          </label>
          <select
            id="audit-target-select"
            value={
              sectorWide
                ? "sector-wide"
                : effectiveHotspot?.id || "sector-wide"
            }
            onChange={(e) => {
              const val = e.target.value;
              if (val === "sector-wide") {
                setSectorWide(true);
                onSelectTargetHotspot(null);
              } else {
                const found = hotspots.find((h) => h.id === val) || null;
                setSectorWide(false);
                onSelectTargetHotspot(found);
              }
            }}
            className="w-full bg-[#0B0F12] border border-white/[0.1] rounded-lg px-2.5 py-1.5 text-xs text-[#F4F6F7] font-sans focus:outline-none focus:border-[#10B981]"
          >
            {hotspots.map((h) => (
              <option key={h.id} value={h.id}>
                #{h.rank} {h.name} ({h.peakTempF.toFixed(1)}°F)
              </option>
            ))}
            <option value="sector-wide">
              Entire Metro Sector ({activeCityName})
            </option>
          </select>
        </div>

        {/* Primary CTA Button: Generate AI Report */}
        <button
          type="button"
          onClick={generateReport}
          disabled={isLoading}
          className="w-full py-2.5 px-3.5 rounded-xl bg-[#10B981] hover:bg-[#34D399] disabled:opacity-60 text-[#060809] font-sans text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-[0_0_24px_rgba(16,185,129,0.28)]"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Synthesizing Gemini Climate Audit...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 stroke-[2.2]" />
              <span>
                {report ? "Regenerate AI Climate Audit" : "Generate AI Climate Audit"}
              </span>
            </>
          )}
        </button>

        {error && (
          <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.1] text-xs text-[#94A3AB]">
            {error}
          </div>
        )}

        {/* Empty State before first generation */}
        {!report && !isLoading && (
          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] flex flex-col gap-2 text-xs text-[#94A3AB]">
            <p className="leading-relaxed">
              Run a structured{" "}
              <strong className="text-[#F4F6F7]">Gemini Flash</strong> urban
              heat island audit on{" "}
              <span className="text-[#10B981] font-medium">
                {effectiveHotspot ? effectiveHotspot.name : activeCityName}
              </span>
              .
            </p>
            <div className="grid grid-cols-2 gap-1.5 pt-1 font-mono text-[10px] text-[#526068]">
              <span>• Severity Score (1–10)</span>
              <span>• Top Thermal Drivers</span>
              <span>• 3 Ranked Prescriptions</span>
              <span>• 1-Click Sim Handoff</span>
            </div>
          </div>
        )}

        {/* Loading Skeleton */}
        {isLoading && (
          <div className="p-4 rounded-xl bg-white/[0.02] border border-[#10B981]/25 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#10B981]">
                Ingesting 420 Real OSM Ways...
              </span>
              <span className="font-mono text-[10px] text-[#94A3AB] animate-pulse">
                JSON_SCHEMA
              </span>
            </div>
            <div className="h-1.5 w-full bg-white/[0.06] rounded-full overflow-hidden">
              <div className="h-full w-2/3 bg-[#10B981] animate-pulse rounded-full" />
            </div>
            <p className="font-mono text-[10px] text-[#94A3AB]">
              Evaluating surface albedo, 450m neighbor heat trapping, and municipal cooling ROI...
            </p>
          </div>
        )}

        {/* Structured Report Output */}
        {report && !isLoading && (
          <div className="flex flex-col gap-3 pt-1">
            {/* 1. Severity Score & Thermal Telemetry Header */}
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08] flex flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#10B981] block">
                    AUDITED SECTOR
                  </span>
                  <h4 className="font-display text-sm font-bold text-[#F4F6F7] leading-snug">
                    {report.areaName}
                  </h4>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-mono text-[9px] uppercase tracking-wider text-[#94A3AB] block">
                    UHI SEVERITY
                  </span>
                  <span className="font-display text-base font-bold text-[#10B981] tabular-nums">
                    {report.severityScore}/10 · {report.severityLabel}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/[0.06] font-mono text-[11px]">
                <div>
                  <span className="text-[9px] uppercase text-[#526068] block">
                    Peak Surface LST
                  </span>
                  <span className="font-bold text-[#F4F6F7] tabular-nums">
                    {report.peakTemperature.toFixed(1)}°F
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] uppercase text-[#526068] block">
                    Sector Mean LST
                  </span>
                  <span className="font-bold text-[#94A3AB] tabular-nums">
                    {report.averageTemperature.toFixed(1)}°F
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Primary Thermal Causes */}
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] flex flex-col gap-1.5">
              <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#10B981] flex items-center gap-1.5">
                <Flame className="w-3 h-3" />
                Primary Thermal Accumulation Drivers
              </span>
              <ul className="space-y-1.5 text-[11px] text-[#94A3AB] leading-snug">
                {report.primaryCauses.map((cause, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="font-mono text-[#10B981] text-[10px] mt-0.5">
                      0{idx + 1}
                    </span>
                    <span>{cause}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 3. Vulnerable Population & Infrastructure Risks */}
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] flex flex-col gap-1.5">
              <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#94A3AB] flex items-center gap-1.5">
                <AlertTriangle className="w-3 h-3 text-[#10B981]" />
                Vulnerability & Infrastructure Risk Factors
              </span>
              <ul className="space-y-1.5 text-[11px] text-[#94A3AB] leading-snug">
                {report.riskFactors.map((risk, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-[#10B981] font-bold">•</span>
                    <span>{risk}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 4. Ranked Cooling Interventions (with 1-Click Apply to Simulator) */}
            <div className="flex flex-col gap-2">
              <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#10B981] flex items-center gap-1.5">
                <ThermometerSnowflake className="w-3 h-3" />
                Prioritized Interventions (Ranked by ROI)
              </span>

              {report.recommendedInterventions.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-[#0B0F12] border border-white/[0.08] hover:border-[#10B981]/40 transition-colors flex flex-col gap-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-sans text-xs font-bold text-[#F4F6F7] leading-snug">
                      {idx + 1}. {item.type}
                    </span>
                    <span className="shrink-0 font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
                      {item.priority}
                    </span>
                  </div>

                  <p className="text-[11px] text-[#94A3AB] leading-relaxed">
                    {item.description}
                  </p>

                  <div className="grid grid-cols-3 gap-1.5 pt-1.5 border-t border-white/[0.05] font-mono text-[10px]">
                    <div className="flex flex-col">
                      <span className="text-[8px] uppercase text-[#526068] flex items-center gap-0.5">
                        <ThermometerSnowflake className="w-2.5 h-2.5 text-[#10B981]" />
                        Cooling
                      </span>
                      <span className="text-[#10B981] font-semibold truncate">
                        {item.coolingPotential}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[8px] uppercase text-[#526068] flex items-center gap-0.5">
                        <DollarSign className="w-2.5 h-2.5 text-[#10B981]" />
                        Est. Cost
                      </span>
                      <span className="text-[#F4F6F7] truncate">
                        {item.estimatedCost}
                      </span>
                    </div>
                    <div className="flex flex-col text-right">
                      <span className="text-[8px] uppercase text-[#526068] flex items-center justify-end gap-0.5">
                        <Clock className="w-2.5 h-2.5 text-[#10B981]" />
                        Timeline
                      </span>
                      <span className="text-[#94A3AB] truncate">
                        {item.implementationTime}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleApplyIntervention(item)}
                    className="mt-1 w-full py-1.5 px-2.5 rounded-lg bg-[#10B981]/12 hover:bg-[#10B981] text-[#10B981] hover:text-[#060809] border border-[#10B981]/30 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] flex items-center justify-center gap-1.5 transition-all"
                  >
                    <span>Apply Prescription to 3D Simulator</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

            {/* 5. Cumulative Projected Impact */}
            <div className="p-3 rounded-xl bg-[#10B981]/[0.06] border border-[#10B981]/25 flex flex-col gap-1.5">
              <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#10B981] flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3" />
                Projected Cumulative Mitigation Impact
              </span>
              <p className="text-[11px] text-[#F4F6F7] leading-relaxed">
                {report.projectedImpact}
              </p>
            </div>

            {/* 6. UN SDG Alignment */}
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] flex flex-col gap-1.5">
              <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#94A3AB] flex items-center gap-1.5">
                <Globe2 className="w-3 h-3 text-[#10B981]" />
                UN Sustainable Development Goals Alignment
              </span>
              <div className="flex flex-col gap-1">
                {report.sdgAlignment.map((sdg, idx) => (
                  <span
                    key={idx}
                    className="font-mono text-[10px] text-[#F4F6F7] bg-white/[0.03] border border-white/[0.06] rounded-lg px-2.5 py-1"
                  >
                    {sdg}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
