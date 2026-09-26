"use client";

import React, { useState, useEffect } from "react";
import {
  InterventionConfig,
  SimulationResult,
  SIMULATION_PRESETS,
} from "@/lib/simulation";
import { Hotspot } from "@/lib/hotspots";
import { ImpactMetrics } from "./ImpactMetrics";
import {
  Droplets,
  Eye,
  Loader2,
  RotateCcw,
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
}: SimulationPanelProps) {
  const [aiAdvisorNote, setAiAdvisorNote] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState<boolean>(false);

  const hasActiveInterventions =
    config.treeCount > 0 ||
    config.coolRoofPct > 0 ||
    config.waterFeatureCount > 0;

  // Debounced call to /api/simulate for Gemini 3.5 Flash Lite ROI micro-advisor
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
    <div className="w-80 sm:w-[350px] bezel-shell shadow-2xl">
      <div className="bezel-core bg-[#060809]/95 backdrop-blur-xl p-4 flex flex-col gap-3 max-h-[calc(100dvh-140px)] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-[#10B981]/15 text-[#10B981]">
              <Sliders className="w-3.5 h-3.5" />
            </span>
            <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-[#F4F6F7]">
              &ldquo;What-If?&rdquo; Cooling Simulator
            </span>
          </div>
          {hasActiveInterventions && (
            <button
              type="button"
              onClick={onResetSimulation}
              title="Reset all interventions"
              className="inline-flex items-center gap-1 font-mono text-[10px] text-[#94A3AB] hover:text-[#F4F6F7] px-2 py-0.5 rounded bg-white/[0.04] hover:bg-white/[0.08] transition-colors"
            >
              <RotateCcw className="w-2.5 h-2.5" />
              Reset
            </button>
          )}
        </div>

        {/* Target Zone Selector */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="sim-target-select"
            className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#94A3AB] flex items-center gap-1.5"
          >
            <Target className="w-3 h-3 text-[#10B981]" />
            Target Intervention Zone
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

        {/* 1-Click Strategy Presets */}
        <div className="flex flex-col gap-1.5">
          <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#526068]">
            Quick Intervention Presets
          </span>
          <div className="grid grid-cols-3 gap-1.5">
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
                className="px-2 py-1.5 rounded-lg text-[10px] font-medium bg-white/[0.03] hover:bg-[#10B981]/15 text-[#94A3AB] hover:text-[#F4F6F7] border border-white/[0.07] hover:border-[#10B981]/40 transition-all text-center truncate"
                title={preset.description}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* 3 Stackable Intervention Sliders */}
        <div className="flex flex-col gap-3 pt-1 border-t border-white/[0.06]">
          {/* 1. Plant Urban Trees */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-[#F4F6F7] flex items-center gap-1.5">
                <TreePine className="w-3.5 h-3.5 text-[#10B981]" />
                Plant Urban Trees
              </span>
              <span className="font-mono text-xs font-semibold text-[#10B981] tabular-nums">
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
              className="w-full h-1.5 bg-white/[0.12] rounded-lg appearance-none cursor-pointer accent-[#10B981]"
            />
            <div className="flex justify-between font-mono text-[9px] text-[#526068]">
              <span>0 trees</span>
              <span>Evapotranspiration + Shade</span>
              <span>2,500 max</span>
            </div>
          </div>

          {/* 2. Install High-SRI Cool Roofs */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-[#F4F6F7] flex items-center gap-1.5">
                <Sun className="w-3.5 h-3.5 text-[#10B981]" />
                High-SRI Cool Roofs
              </span>
              <span className="font-mono text-xs font-semibold text-[#10B981] tabular-nums">
                {config.coolRoofPct}% roofs
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
              aria-label="Install High-SRI Cool Roofs"
              className="w-full h-1.5 bg-white/[0.12] rounded-lg appearance-none cursor-pointer accent-[#10B981]"
            />
            <div className="flex justify-between font-mono text-[9px] text-[#526068]">
              <span>0%</span>
              <span>Albedo α 0.13 → 0.78</span>
              <span>100%</span>
            </div>
          </div>

          {/* 3. Bioswales & Water Features */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-[#F4F6F7] flex items-center gap-1.5">
                <Droplets className="w-3.5 h-3.5 text-[#10B981]" />
                Bioswales & Water Features
              </span>
              <span className="font-mono text-xs font-semibold text-[#10B981] tabular-nums">
                {config.waterFeatureCount} units
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
              aria-label="Add Bioswales and Water Features"
              className="w-full h-1.5 bg-white/[0.12] rounded-lg appearance-none cursor-pointer accent-[#10B981]"
            />
            <div className="flex justify-between font-mono text-[9px] text-[#526068]">
              <span>0 units</span>
              <span>Latent Heat Dissipation</span>
              <span>25 max</span>
            </div>
          </div>

          {/* 4. Target Radius Slider (when localized) */}
          {!config.sectorWide && (
            <div className="flex flex-col gap-1 pt-1 border-t border-white/[0.05]">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[#94A3AB]">Intervention Zone Radius</span>
                <span className="font-mono text-[#F4F6F7] tabular-nums">
                  {config.radiusMeters}m ({(config.radiusMeters / 1609.34).toFixed(2)} mi)
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
                aria-label="Intervention Zone Radius"
                className="w-full h-1 bg-white/[0.12] rounded-lg appearance-none cursor-pointer accent-[#10B981]"
              />
            </div>
          )}
        </div>

        {/* Before / After Map Comparison Toggle */}
        {hasActiveInterventions && (
          <div className="flex flex-col gap-1.5 pt-1">
            <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#94A3AB] flex items-center gap-1.5">
              <Eye className="w-3 h-3 text-[#10B981]" />
              Live Heatmap State Comparison
            </span>
            <div className="grid grid-cols-2 p-1 rounded-xl bg-[#0B0F12] border border-white/[0.08]">
              <button
                type="button"
                onClick={() => onToggleBaselinePreview(false)}
                className={`py-1.5 px-2 rounded-lg font-mono text-[10px] font-semibold transition-all ${
                  !isBaselinePreview
                    ? "bg-[#10B981] text-[#060809] shadow-sm"
                    : "text-[#94A3AB] hover:text-[#F4F6F7]"
                }`}
              >
                AFTER (Simulated)
              </button>
              <button
                type="button"
                onClick={() => onToggleBaselinePreview(true)}
                className={`py-1.5 px-2 rounded-lg font-mono text-[10px] font-semibold transition-all ${
                  isBaselinePreview
                    ? "bg-white/[0.14] text-[#F4F6F7]"
                    : "text-[#94A3AB] hover:text-[#F4F6F7]"
                }`}
              >
                BEFORE (Baseline)
              </button>
            </div>
          </div>
        )}

        {/* Impact Metrics Ledger */}
        {simulationResult && (
          <ImpactMetrics
            result={simulationResult}
            isBaselinePreview={isBaselinePreview}
          />
        )}

        {/* Gemini 3.5 Flash Lite ROI Micro-Advisor */}
        {hasActiveInterventions && (
          <div className="p-3 rounded-xl bg-[#10B981]/[0.06] border border-[#10B981]/25 flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#10B981] flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" />
                Gemini 3.5 Lite • ROI Advisor
              </span>
              {aiLoading && (
                <Loader2 className="w-3 h-3 text-[#10B981] animate-spin" />
              )}
            </div>
            <p className="text-[11px] text-[#F4F6F7] leading-relaxed">
              {aiAdvisorNote ||
                "Synthesizing municipal cost-effectiveness and thermal attenuation forecast..."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
