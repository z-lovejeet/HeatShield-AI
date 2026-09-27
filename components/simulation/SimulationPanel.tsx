"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  InterventionConfig,
  SimulationResult,
  SIMULATION_PRESETS,
} from "@/lib/simulation";
import { Hotspot } from "@/lib/hotspots";
import { ImpactMetrics } from "./ImpactMetrics";
import {
  ArrowUpRight,
  Check,
  Droplets,
  Eye,
  Loader2,
  RotateCcw,
  Share2,
  Sliders,
  Sparkles,
  Sun,
  Target,
  TreePine,
} from "lucide-react";

interface SimulationPanelProps {
  hotspots: Hotspot[];
  targetHotspot: Hotspot | null;
  onSelectTargetHotspot: (hotspot: Hotspot | null) => void;
  config: InterventionConfig;
  onChangeConfig: (newConfig: InterventionConfig) => void;
  simulationResult: SimulationResult | null;
  isBaselinePreview: boolean;
  onToggleBaselinePreview: (previewBaseline: boolean) => void;
  onResetSimulation: () => void;
  activeCityName: string;
  activeCityId?: string;
}

export function SimulationPanel({
  hotspots,
  targetHotspot,
  onSelectTargetHotspot,
  config,
  onChangeConfig,
  simulationResult,
  isBaselinePreview,
  onToggleBaselinePreview,
  onResetSimulation,
  activeCityName,
  activeCityId = "portland",
}: SimulationPanelProps) {
  const [aiAdvisorNote, setAiAdvisorNote] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [copiedShare, setCopiedShare] = useState<boolean>(false);

  const handleCopyShareLink = () => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams({
      city: activeCityId,
      tab: "simulate",
      trees: String(config.treeCount),
      roofs: String(config.coolRoofPct),
      water: String(config.waterFeatureCount),
      radius: String(config.radiusMeters),
    });
    if (targetHotspot?.id && !config.sectorWide) {
      params.set("hotspot", targetHotspot.id);
    }
    const shareUrl = `${window.location.origin}/map?${params.toString()}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2500);
    });
  };

  const hasActiveInterventions =
    config.treeCount > 0 ||
    config.coolRoofPct > 0 ||
    config.waterFeatureCount > 0;

  useEffect(() => {
    if (!hasActiveInterventions) {
      setAiAdvisorNote(null);
      return;
    }

    const timer = setTimeout(async () => {
      setAiLoading(true);
      try {
        const res = await fetch("/api/simulate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            treeCount: config.treeCount,
            coolRoofPct: config.coolRoofPct,
            waterFeatureCount: config.waterFeatureCount,
            radiusMeters: config.radiusMeters,
            targetName: targetHotspot ? targetHotspot.name : activeCityName,
            currentLocalTemp: targetHotspot
              ? targetHotspot.peakTempF
              : simulationResult?.baselinePeakTempF || 105.0,
            surfaceType: targetHotspot?.surfaceType || "impervious urban",
            includeAiBrief: true,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.aiAdvisorNote) {
            setAiAdvisorNote(data.aiAdvisorNote);
          }
        }
      } catch {
        // Non-blocking fallback
      } finally {
        setAiLoading(false);
      }
    }, 650);

    return () => clearTimeout(timer);
  }, [
    config.treeCount,
    config.coolRoofPct,
    config.waterFeatureCount,
    config.radiusMeters,
    targetHotspot,
    activeCityName,
    hasActiveInterventions,
    simulationResult?.baselinePeakTempF,
  ]);

  return (
    <div className="w-full rounded-2xl bg-[#211F1C] border border-[#33302B] p-4 flex flex-col gap-3.5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#2F2C28] pb-3">
        <div className="flex items-center gap-2.5">
          <span className="p-1.5 rounded-lg bg-[#5E9A7B]/15 text-[#78B093]">
            <Sliders className="w-4 h-4" />
          </span>
          <div>
            <h3 className="font-display text-sm font-semibold text-[#F5F3EF]">
              Cooling Intervention Simulator
            </h3>
            <p className="text-xs text-[#8C857B]">
              Add trees, cool roofs, and water features
            </p>
          </div>
        </div>
        {hasActiveInterventions && (
          <button
            type="button"
            onClick={onResetSimulation}
            title="Reset all interventions"
            className="inline-flex items-center gap-1 text-xs text-[#B8B1A7] hover:text-[#F5F3EF] px-2.5 py-1 rounded-lg bg-[#1A1816] hover:bg-[#2A2724] border border-[#33302B] transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </button>
        )}
      </div>

      {/* Target Zone Selector */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="sim-target-select"
          className="text-xs font-medium text-[#B8B1A7] flex items-center gap-1.5"
        >
          <Target className="w-3.5 h-3.5 text-[#78B093]" />
          Target Neighborhood Zone
        </label>
        <select
          id="sim-target-select"
          value={
            config.sectorWide
              ? "sector-wide"
              : targetHotspot?.id || hotspots[0]?.id || "sector-wide"
          }
          onChange={(e) => {
            const val = e.target.value;
            if (val === "sector-wide") {
              onChangeConfig({ ...config, sectorWide: true });
              onSelectTargetHotspot(null);
            } else {
              const found = hotspots.find((h) => h.id === val) || null;
              onChangeConfig({ ...config, sectorWide: false });
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

      {/* 1-Click Strategy Presets */}
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-[#B8B1A7]">
          Quick Cooling Presets
        </span>
        <div className="grid grid-cols-3 gap-2">
          {SIMULATION_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() =>
                onChangeConfig({
                  ...config,
                  ...preset.config,
                })
              }
              className="px-2.5 py-2 rounded-xl text-xs font-medium bg-[#1A1816] hover:bg-[#5E9A7B]/15 text-[#D6D0C6] hover:text-[#F5F3EF] border border-[#2F2C28] hover:border-[#5E9A7B]/45 transition-colors text-center truncate"
              title={preset.description}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3 Stackable Intervention Sliders */}
      <div className="flex flex-col gap-3.5 pt-2 border-t border-[#2F2C28]">
        {/* 1. Plant Urban Trees */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[13px]">
            <span className="font-medium text-[#F5F3EF] flex items-center gap-2">
              <TreePine className="w-4 h-4 text-[#78B093]" />
              Plant Street Trees
            </span>
            <span className="font-mono text-xs font-semibold text-[#78B093] tabular-nums">
              {config.treeCount.toLocaleString()} trees
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="2500"
            step="50"
            value={config.treeCount}
            onChange={(e) =>
              onChangeConfig({
                ...config,
                treeCount: parseInt(e.target.value, 10),
              })
            }
            aria-label="Plant Urban Trees"
            className="w-full h-1.5 bg-[#38342F] rounded-lg appearance-none cursor-pointer accent-[#5E9A7B]"
          />
          <div className="flex justify-between text-[11px] text-[#8C857B]">
            <span>0 trees</span>
            <span>Shade &amp; natural cooling</span>
            <span>2,500 max</span>
          </div>
        </div>

        {/* 2. Install High-SRI Cool Roofs */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[13px]">
            <span className="font-medium text-[#F5F3EF] flex items-center gap-2">
              <Sun className="w-4 h-4 text-[#E09F67]" />
              Reflective Cool Roofs
            </span>
            <span className="font-mono text-xs font-semibold text-[#78B093] tabular-nums">
              {config.coolRoofPct}% of roofs
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={config.coolRoofPct}
            onChange={(e) =>
              onChangeConfig({
                ...config,
                coolRoofPct: parseInt(e.target.value, 10),
              })
            }
            aria-label="High-SRI Cool Roofs"
            className="w-full h-1.5 bg-[#38342F] rounded-lg appearance-none cursor-pointer accent-[#5E9A7B]"
          />
          <div className="flex justify-between text-[11px] text-[#8C857B]">
            <span>0%</span>
            <span>Reflects sunlight</span>
            <span>100% roofs</span>
          </div>
        </div>

        {/* 3. Add Water Features & Bioswales */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[13px]">
            <span className="font-medium text-[#F5F3EF] flex items-center gap-2">
              <Droplets className="w-4 h-4 text-[#78B093]" />
              Water Basins &amp; Bioswales
            </span>
            <span className="font-mono text-xs font-semibold text-[#78B093] tabular-nums">
              {config.waterFeatureCount} installations
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="25"
            step="1"
            value={config.waterFeatureCount}
            onChange={(e) =>
              onChangeConfig({
                ...config,
                waterFeatureCount: parseInt(e.target.value, 10),
              })
            }
            aria-label="Misting & Bioswale Corridors"
            className="w-full h-1.5 bg-[#38342F] rounded-lg appearance-none cursor-pointer accent-[#5E9A7B]"
          />
          <div className="flex justify-between text-[11px] text-[#8C857B]">
            <span>0 units</span>
            <span>Evaporative misting</span>
            <span>25 max</span>
          </div>
        </div>

        {/* Intervention Radius Slider (when not sector-wide) */}
        {!config.sectorWide && (
          <div className="flex flex-col gap-1.5 pt-2 border-t border-[#2F2C28]">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#B8B1A7]">Cooling Zone Radius</span>
              <span className="font-mono text-xs text-[#F5F3EF] tabular-nums">
                {config.radiusMeters}m radius
              </span>
            </div>
            <input
              type="range"
              min="400"
              max="2500"
              step="100"
              value={config.radiusMeters}
              onChange={(e) =>
                onChangeConfig({
                  ...config,
                  radiusMeters: parseInt(e.target.value, 10),
                })
              }
              aria-label="Cooling zone radius in meters"
              className="w-full h-1.5 bg-[#38342F] rounded-lg appearance-none cursor-pointer accent-[#5E9A7B]"
            />
          </div>
        )}
      </div>

      {/* Before / After Map Comparison Toggle */}
      {hasActiveInterventions && (
        <div className="pt-2 border-t border-[#2F2C28] flex items-center justify-between gap-2">
          <span className="text-xs text-[#B8B1A7] flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-[#78B093]" />
            Map View Mode
          </span>
          <div className="flex items-center p-1 rounded-xl bg-[#141311] border border-[#2C2925]">
            <button
              type="button"
              onClick={() => onToggleBaselinePreview(true)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                isBaselinePreview
                  ? "bg-[#33302B] text-[#F5F3EF]"
                  : "text-[#8C857B] hover:text-[#F5F3EF]"
              }`}
            >
              Before
            </button>
            <button
              type="button"
              onClick={() => onToggleBaselinePreview(false)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                !isBaselinePreview
                  ? "bg-[#5E9A7B] text-[#141311] font-semibold"
                  : "text-[#8C857B] hover:text-[#F5F3EF]"
              }`}
            >
              After (Cooled)
            </button>
          </div>
        </div>
      )}

      {/* Quantified Impact Metrics & Before/After Readout */}
      {simulationResult && (
        <ImpactMetrics
          result={simulationResult}
          isBaselinePreview={isBaselinePreview}
        />
      )}

      {/* Gemini 3.5 Flash Lite Real-Time ROI Micro-Advisor */}
      {hasActiveInterventions && (
        <div className="p-3 rounded-xl bg-[#1A1816] border border-[#5E9A7B]/35">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-[#78B093] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              AI Planner Summary
            </span>
            {aiLoading && (
              <Loader2 className="w-3.5 h-3.5 text-[#78B093] animate-spin" />
            )}
          </div>
          <p className="text-xs text-[#D6D0C6] leading-relaxed">
            {aiAdvisorNote ||
              "Calculating optimal cost-benefit guidance for your selected cooling mix..."}
          </p>
        </div>
      )}

      {/* Shareable Scenario Link & Impact Dashboard Sync Actions */}
      {hasActiveInterventions && (
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={handleCopyShareLink}
            className="py-2 px-3 rounded-xl bg-[#181614] hover:bg-[#2A2724] border border-[#33302B] text-xs font-medium text-[#EAE5DD] flex items-center justify-center gap-1.5 transition-colors"
          >
            {copiedShare ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#78B093]" />
                <span className="text-[#78B093] font-semibold">Link Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-[#78B093]" />
                <span>Share Scenario</span>
              </>
            )}
          </button>

          <Link
            href="/dashboard"
            className="py-2 px-3 rounded-xl bg-[#5E9A7B]/15 hover:bg-[#5E9A7B] border border-[#5E9A7B]/35 text-xs font-semibold text-[#94C4AB] hover:text-[#141311] flex items-center justify-center gap-1.5 transition-colors"
          >
            <span>Impact Dashboard</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
}

