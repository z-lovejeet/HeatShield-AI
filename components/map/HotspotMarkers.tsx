"use client";

import React from "react";
import { Hotspot } from "@/lib/hotspots";
import {
  AlertTriangle,
  ArrowUpRight,
  Crosshair,
  Flame,
  Sparkles,
  Thermometer,
  X,
} from "lucide-react";

interface HotspotOverlayProps {
  hotspots: Hotspot[];
  selectedHotspot: Hotspot | null;
  onSelectHotspot: (hotspot: Hotspot | null) => void;
  onSimulateHotspot?: (hotspot: Hotspot) => void;
  onAuditHotspot?: (hotspot: Hotspot) => void;
}

/**
 * Floating Hotspot Inspector List & Selected Hotspot Tactical Detail Card
 */
export function HotspotMarkers({
  hotspots,
  selectedHotspot,
  onSelectHotspot,
  onSimulateHotspot,
  onAuditHotspot,
}: HotspotOverlayProps) {
  return (
    <>
      {/* Right-hand Tactical Hotspot Ranking List */}
      <div className="w-80 sm:w-[340px] bezel-shell shadow-2xl">
        <div className="bezel-core bg-[#060809]/95 backdrop-blur-xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
              <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-[#F4F6F7]">
                Detected Thermal Hotspots
              </span>
            </div>
            <span className="font-mono text-[10px] text-[#10B981] bg-[#10B981]/10 border border-[#10B981]/25 px-2 py-0.5 rounded-full tabular-nums">
              TOP {hotspots.length} PEAKS
            </span>
          </div>

          <div className="flex flex-col gap-2 max-h-[310px] overflow-y-auto pr-0.5">
            {hotspots.map((spot) => {
              const isSelected = selectedHotspot?.id === spot.id;
              return (
                <button
                  key={spot.id}
                  type="button"
                  onClick={() => onSelectHotspot(spot)}
                  className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-start justify-between gap-2.5 group ${
                    isSelected
                      ? "bg-[#10B981]/12 border-[#10B981]/45 shadow-md"
                      : "bg-white/[0.02] hover:bg-white/[0.05] border-white/[0.06]"
                  }`}
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <span
                      className={`font-mono text-[10px] font-bold w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 tabular-nums ${
                        isSelected
                          ? "bg-[#10B981] text-[#060809]"
                          : "bg-white/[0.07] text-[#94A3AB] group-hover:text-[#F4F6F7]"
                      }`}
                    >
                      0{spot.rank}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-[#F4F6F7] truncate group-hover:text-white">
                        {spot.name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-[10px] text-[#94A3AB] tabular-nums">
                          {spot.censusTract}
                        </span>
                        <span className="text-[#526068]">•</span>
                        <span
                          className={`font-mono text-[9px] uppercase tracking-wider px-1.5 py-0.2 rounded ${
                            spot.riskLevel === "Critical"
                              ? "text-[#F4F6F7] bg-white/[0.1] border border-white/[0.18]"
                              : "text-[#94A3AB] bg-white/[0.05]"
                          }`}
                        >
                          {spot.riskLevel}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-display text-sm font-bold text-[#F4F6F7] tabular-nums block leading-tight">
                      {spot.peakTempF.toFixed(1)}°F
                    </span>
                    <span className="font-mono text-[10px] text-[#10B981] tabular-nums">
                      +{spot.deltaF.toFixed(1)}°F
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected Hotspot Detail Modal / Card */}
      {selectedHotspot && (
        <div className="w-80 sm:w-[340px] bezel-shell shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="bezel-core bg-[#060809]/95 backdrop-blur-xl p-4 flex flex-col gap-3 border border-[#10B981]/30">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="font-mono text-[9px] uppercase tracking-[0.14em] px-2 py-0.5 rounded bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
                    HOTSPOT #{selectedHotspot.rank} • {selectedHotspot.riskLevel}
                  </span>
                  <span className="font-mono text-[10px] text-[#94A3AB] tabular-nums">
                    {selectedHotspot.censusTract}
                  </span>
                </div>
                <h3 className="font-display text-sm font-bold text-[#F4F6F7] leading-snug">
                  {selectedHotspot.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onSelectHotspot(null)}
                aria-label="Close hotspot details"
                className="p-1 text-[#94A3AB] hover:text-[#F4F6F7] rounded hover:bg-white/[0.06] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Primary Thermal Readout */}
            <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <div>
                <span className="font-mono text-[9px] uppercase tracking-wider text-[#94A3AB] block">
                  Peak Surface
                </span>
                <span className="font-display text-lg font-bold text-[#F4F6F7] tabular-nums">
                  {selectedHotspot.peakTempF.toFixed(1)}°F
                </span>
                <span className="font-mono text-[10px] text-[#526068] block tabular-nums">
                  ({selectedHotspot.peakTempC.toFixed(1)}°C)
                </span>
              </div>
              <div>
                <span className="font-mono text-[9px] uppercase tracking-wider text-[#94A3AB] block">
                  UHI Anomaly
                </span>
                <span className="font-display text-lg font-bold text-[#10B981] tabular-nums">
                  +{selectedHotspot.deltaF.toFixed(1)}°F
                </span>
                <span className="font-mono text-[10px] text-[#526068] block tabular-nums">
                  vs {selectedHotspot.baselineRuralF}°F rural
                </span>
              </div>
              <div>
                <span className="font-mono text-[9px] uppercase tracking-wider text-[#94A3AB] block">
                  Mitigation
                </span>
                <span className="font-display text-lg font-bold text-[#10B981] tabular-nums">
                  -{selectedHotspot.estimatedCoolingPotentialF}°F
                </span>
                <span className="font-mono text-[10px] text-[#526068] block">
                  Max potential
                </span>
              </div>
            </div>

            {/* Cause & Action */}
            <div className="space-y-2 text-xs">
              <div>
                <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#526068] block mb-0.5">
                  Primary Thermal Driver
                </span>
                <p className="text-[#94A3AB] leading-relaxed text-[11px]">
                  {selectedHotspot.primaryCause}
                </p>
              </div>
              <div>
                <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#10B981] block mb-0.5">
                  Recommended Intervention
                </span>
                <p className="text-[#F4F6F7] leading-relaxed text-[11px]">
                  {selectedHotspot.recommendedAction}
                </p>
              </div>
            </div>

            {/* Geodetic Footer + AI Audit & Simulate CTAs */}
            <div className="pt-2 border-t border-white/[0.06] flex flex-col gap-2">
              <span className="font-mono text-[10px] text-[#526068] tabular-nums flex items-center gap-1">
                <Crosshair className="w-3 h-3 text-[#10B981]" />
                {selectedHotspot.coordinates[1].toFixed(4)}°N,{" "}
                {Math.abs(selectedHotspot.coordinates[0]).toFixed(4)}°W
              </span>

              <div className="flex items-center gap-2">
                {onAuditHotspot && (
                  <button
                    type="button"
                    onClick={() => onAuditHotspot(selectedHotspot)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-full bg-white/[0.05] hover:bg-[#10B981]/15 border border-white/[0.1] hover:border-[#10B981]/40 text-[#F4F6F7] font-mono text-[10px] font-semibold uppercase tracking-wider transition-all"
                  >
                    <Sparkles className="w-3 h-3 text-[#10B981]" />
                    <span>AI Audit</span>
                  </button>
                )}

                {onSimulateHotspot && (
                  <button
                    type="button"
                    onClick={() => onSimulateHotspot(selectedHotspot)}
                    className="flex-1 inline-flex items-center justify-between pl-3 pr-1.5 py-1 rounded-full bg-[#10B981] hover:bg-[#34D399] text-[#060809] font-semibold text-[11px] transition-all shadow-sm"
                  >
                    <span>Simulate Cooling</span>
                    <span className="w-5 h-5 rounded-full bg-[#060809]/15 flex items-center justify-center">
                      <ArrowUpRight className="w-3 h-3" />
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
