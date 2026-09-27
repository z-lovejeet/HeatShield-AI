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
  Download,
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

  const handleExportMarkdownReport = () => {
    if (!report || typeof window === "undefined") return;
    const md = [
      `# HeatShield AI — Climate & Cooling Audit Report`,
      `**Area Analyzed:** ${report.areaName} (${activeCityName})`,
      `**Severity Score:** ${report.severityScore}/10 (${report.severityLabel})`,
      `**Peak Surface Temp:** ${report.peakTemperature}°F | **Avg Surface Temp:** ${report.averageTemperature}°F`,
      `**AI Engine:** ${report.modelUsed || "Google Gemini Flash"}`,
      ``,
      `## 1. Primary Heat Drivers`,
      ...report.primaryCauses.map((c) => `- ${c}`),
      ``,
      `## 2. Community & Health Risk Factors`,
      ...report.riskFactors.map((r) => `- ${r}`),
      ``,
      `## 3. Recommended Cooling Interventions`,
      ...report.recommendedInterventions.map(
        (item, idx) =>
          `### ${idx + 1}. ${item.type} (${item.priority} Priority)\n- **Cooling Potential:** ${item.coolingPotential}\n- **Estimated Budget:** ${item.estimatedCost}\n- **Timeline:** ${item.implementationTime}\n- **Rationale:** ${item.description}`
      ),
      ``,
      `## 4. Projected Combined Impact`,
      report.projectedImpact,
      ``,
      `## 5. UN Sustainable Development Goals`,
      ...report.sdgAlignment.map((s) => `- ${s}`),
    ].join("\n");

    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `heatshield-audit-${report.areaName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full rounded-2xl bg-[#211F1C] border border-[#33302B] p-4 flex flex-col gap-3.5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#2F2C28] pb-3">
        <div className="flex items-center gap-2.5">
          <span className="p-1.5 rounded-lg bg-[#5E9A7B]/15 text-[#78B093]">
            <FileSpreadsheet className="w-4 h-4" />
          </span>
          <div>
            <h3 className="font-display text-sm font-semibold text-[#F5F3EF]">
              AI Climate Audit Report
            </h3>
            <p className="text-xs text-[#8C857B]">
              Powered by Google Gemini Flash
            </p>
          </div>
        </div>
        {report?.modelUsed && (
          <span className="font-mono text-[11px] text-[#78B093] bg-[#5E9A7B]/15 border border-[#5E9A7B]/30 px-2.5 py-0.5 rounded-lg truncate max-w-[130px]">
            {report.modelUsed}
          </span>
        )}
      </div>

      {/* Target Zone Selector */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="audit-target-select"
          className="text-xs font-medium text-[#B8B1A7] flex items-center gap-1.5"
        >
          <Target className="w-3.5 h-3.5 text-[#78B093]" />
          Select Area to Audit
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
          className="w-full bg-[#1A1816] border border-[#33302B] rounded-xl px-3 py-2 text-xs sm:text-[13px] text-[#F5F3EF] font-sans focus:outline-none focus:border-[#5E9A7B]"
        >
          {hotspots.map((h) => (
            <option key={h.id} value={h.id}>
              #{h.rank} {h.name} ({h.peakTempF.toFixed(1)}°F)
            </option>
          ))}
          <option value="sector-wide">
            Entire City Area ({activeCityName})
          </option>
        </select>
      </div>

      {/* Primary CTA Button: Generate AI Report */}
      <button
        type="button"
        onClick={generateReport}
        disabled={isLoading}
        className="w-full py-2.5 px-4 rounded-xl bg-[#5E9A7B] hover:bg-[#6CA889] disabled:opacity-60 text-[#141311] font-sans text-xs sm:text-[13px] font-semibold flex items-center justify-center gap-2 transition-colors"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Generating Climate Audit...</span>
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            <span>
              {report ? "Regenerate AI Climate Audit" : "Generate AI Climate Audit"}
            </span>
          </>
        )}
      </button>

      {error && (
        <div className="p-3 rounded-xl bg-[#1A1816] border border-[#38342F] text-xs text-[#D6D0C6]">
          {error}
        </div>
      )}

      {/* Empty State before first generation */}
      {!report && !isLoading && (
        <div className="p-3.5 rounded-xl bg-[#1A1816] border border-[#2F2C28] flex flex-col gap-2.5 text-xs sm:text-[13px] text-[#B8B1A7]">
          <p className="leading-relaxed">
            Generate a complete climate assessment for{" "}
            <strong className="text-[#F5F3EF]">
              {effectiveHotspot ? effectiveHotspot.name : activeCityName}
            </strong>
            , including heat causes, community risks, and a step-by-step cooling plan.
          </p>
          <div className="grid grid-cols-2 gap-2 pt-1 text-xs text-[#8C857B]">
            <span>• Heat Severity Score</span>
            <span>• Primary Heat Drivers</span>
            <span>• 3 Cooling Action Plans</span>
            <span>• 1-Click Simulator Sync</span>
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="p-4 rounded-xl bg-[#1A1816] border border-[#5E9A7B]/35 flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-[#78B093]">
              Analyzing {parcelCount} OpenStreetMap parcels...
            </span>
            <span className="font-mono text-[#8C857B]">Working</span>
          </div>
          <div className="h-1.5 w-full bg-[#2F2C28] rounded-full overflow-hidden">
            <div className="h-full w-2/3 bg-[#5E9A7B] animate-pulse rounded-full" />
          </div>
          <p className="text-xs text-[#B8B1A7]">
            Evaluating surface heat retention, tree canopy gaps, and cooling costs...
          </p>
        </div>
      )}

      {/* Structured Report Output */}
      {report && !isLoading && (
        <div className="flex flex-col gap-3.5 pt-1">
          {/* 1. Severity Score & Thermal Telemetry Header */}
          <div className="p-3.5 rounded-xl bg-[#1A1816] border border-[#33302B] flex flex-col gap-2.5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-xs text-[#8C857B] block">
                  Audited Area
                </span>
                <h4 className="font-display text-sm font-semibold text-[#F5F3EF] leading-snug">
                  {report.areaName}
                </h4>
              </div>
              <div className="text-right shrink-0">
                <span className="text-xs text-[#8C857B] block">
                  Heat Severity
                </span>
                <span className="font-display text-base font-bold text-[#E09F67] tabular-nums">
                  {report.severityScore}/10 · {report.severityLabel}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2.5 border-t border-[#2C2925] text-xs">
              <div>
                <span className="text-[#8C857B] block">
                  Peak Surface Temp
                </span>
                <span className="font-mono font-semibold text-sm text-[#F5F3EF] tabular-nums">
                  {report.peakTemperature.toFixed(1)}°F
                </span>
              </div>
              <div className="text-right">
                <span className="text-[#8C857B] block">
                  Area Average Temp
                </span>
                <span className="font-mono font-semibold text-sm text-[#B8B1A7] tabular-nums">
                  {report.averageTemperature.toFixed(1)}°F
                </span>
              </div>
            </div>
          </div>

          {/* 2. Primary Thermal Causes */}
          <div className="p-3.5 rounded-xl bg-[#1A1816] border border-[#2F2C28] flex flex-col gap-2">
            <span className="text-xs font-semibold text-[#E09F67] flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5" />
              Why This Area Overheats
            </span>
            <ul className="space-y-2 text-xs sm:text-[13px] text-[#D6D0C6] leading-relaxed">
              {report.primaryCauses.map((cause, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="font-mono text-[#78B093] text-xs font-semibold mt-0.5">
                    {idx + 1}.
                  </span>
                  <span>{cause}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 3. Vulnerable Population & Infrastructure Risks */}
          <div className="p-3.5 rounded-xl bg-[#1A1816] border border-[#2F2C28] flex flex-col gap-2">
            <span className="text-xs font-semibold text-[#B8B1A7] flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-[#E09F67]" />
              Community &amp; Infrastructure Risks
            </span>
            <ul className="space-y-2 text-xs sm:text-[13px] text-[#D6D0C6] leading-relaxed">
              {report.riskFactors.map((risk, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-[#78B093] font-bold">•</span>
                  <span>{risk}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 4. Ranked Cooling Interventions (with 1-Click Apply to Simulator) */}
          <div className="flex flex-col gap-2.5">
            <span className="text-xs font-semibold text-[#78B093] flex items-center gap-1.5">
              <ThermometerSnowflake className="w-3.5 h-3.5" />
              Recommended Cooling Actions (Ranked)
            </span>

            {report.recommendedInterventions.map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-[#1A1816] border border-[#33302B] hover:border-[#5E9A7B]/45 transition-colors flex flex-col gap-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-sans text-[13px] font-semibold text-[#F5F3EF] leading-snug">
                    {idx + 1}. {item.type}
                  </span>
                  <span className="shrink-0 text-[11px] font-medium px-2.5 py-0.5 rounded-md bg-[#5E9A7B]/20 text-[#94C4AB] border border-[#5E9A7B]/35">
                    {item.priority}
                  </span>
                </div>

                <p className="text-xs sm:text-[13px] text-[#D6D0C6] leading-relaxed">
                  {item.description}
                </p>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#2C2925] text-xs">
                  <div className="flex flex-col">
                    <span className="text-[11px] text-[#8C857B] flex items-center gap-1">
                      <ThermometerSnowflake className="w-3 h-3 text-[#78B093]" />
                      Cooling
                    </span>
                    <span className="font-mono text-[#78B093] font-semibold truncate">
                      {item.coolingPotential}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] text-[#8C857B] flex items-center gap-1">
                      <DollarSign className="w-3 h-3 text-[#78B093]" />
                      Cost
                    </span>
                    <span className="font-mono text-[#F5F3EF] truncate">
                      {item.estimatedCost}
                    </span>
                  </div>
                  <div className="flex flex-col text-right">
                    <span className="text-[11px] text-[#8C857B] flex items-center justify-end gap-1">
                      <Clock className="w-3 h-3 text-[#78B093]" />
                      Timeline
                    </span>
                    <span className="font-mono text-[#B8B1A7] truncate">
                      {item.implementationTime}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleApplyIntervention(item)}
                  className="mt-1 w-full py-2 px-3 rounded-xl bg-[#5E9A7B]/20 hover:bg-[#5E9A7B] text-[#94C4AB] hover:text-[#141311] border border-[#5E9A7B]/35 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span>Apply Prescription to 3D Simulator</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* 5. Cumulative Projected Impact */}
          <div className="p-3.5 rounded-xl bg-[#5E9A7B]/10 border border-[#5E9A7B]/30 flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-[#78B093] flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Expected Combined Result
            </span>
            <p className="text-xs sm:text-[13px] text-[#F5F3EF] leading-relaxed">
              {report.projectedImpact}
            </p>
          </div>

          {/* 6. UN SDG Alignment */}
          <div className="p-3.5 rounded-xl bg-[#1A1816] border border-[#2F2C28] flex flex-col gap-2">
            <span className="text-xs font-semibold text-[#B8B1A7] flex items-center gap-1.5">
              <Globe2 className="w-3.5 h-3.5 text-[#78B093]" />
              UN Sustainability Goals Supported
            </span>
            <div className="flex flex-col gap-1.5">
              {report.sdgAlignment.map((sdg, idx) => (
                <span
                  key={idx}
                  className="text-xs text-[#D6D0C6] bg-[#211F1C] border border-[#2F2C28] rounded-lg px-3 py-1.5"
                >
                  {sdg}
                </span>
              ))}
            </div>
          </div>

          {/* 7. Export Audit Report (.md) */}
          <button
            type="button"
            onClick={handleExportMarkdownReport}
            className="w-full py-2 px-3 rounded-xl bg-[#181614] hover:bg-[#2A2724] border border-[#33302B] text-xs font-medium text-[#EAE5DD] flex items-center justify-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-[#78B093]" />
            <span>Download Climate Audit Report (.md)</span>
          </button>
        </div>
      )}
    </div>
  );
}

