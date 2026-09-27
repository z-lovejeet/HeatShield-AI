"use client";

import React from "react";
import { Hotspot } from "@/lib/hotspots";
import { evaluateAreaHealthSafety } from "@/lib/health-advisor";
import {
  ArrowUpRight,
  Crosshair,
  HeartPulse,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  X,
} from "lucide-react";

interface HotspotOverlayProps {
  hotspots: Hotspot[];
  selectedHotspot: Hotspot | null;
  onSelectHotspot: (hotspot: Hotspot | null) => void;
  onSimulateHotspot?: (hotspot: Hotspot) => void;
  onAuditHotspot?: (hotspot: Hotspot) => void;
  onOpenHealthGuide?: (hotspot: Hotspot) => void;
  activeCoolingDropF?: number;
}

/**
 * Clean, Cozy Hotspot Inspector List & Selected Hotspot Detail Card
 */
export function HotspotMarkers({
  hotspots,
  selectedHotspot,
  onSelectHotspot,
  onSimulateHotspot,
  onAuditHotspot,
  onOpenHealthGuide,
  activeCoolingDropF = 0,
}: HotspotOverlayProps) {
  const quickHealth = selectedHotspot
    ? evaluateAreaHealthSafety({
        zoneName: selectedHotspot.name,
        baselineSurfaceTempF: selectedHotspot.peakTempF,
        uhiDeltaF: selectedHotspot.deltaF,
        coolingDropF: activeCoolingDropF,
        profileId: "general",
      })
    : null;

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Selected Hotspot Detail Card (shown at top when a hotspot is selected so user never misses it) */}
      {selectedHotspot && quickHealth && (
        <div className="w-full rounded-2xl bg-[#25221F] border border-[#5E9A7B]/45 p-4 flex flex-col gap-3.5 shadow-md">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-md bg-[#5E9A7B]/20 text-[#94C4AB] border border-[#5E9A7B]/35">
                  Hotspot #{selectedHotspot.rank} · {selectedHotspot.riskLevel} Risk
                </span>
              </div>
              <h3 className="font-display text-base font-semibold text-[#F5F3EF] leading-snug">
                {selectedHotspot.name}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => onSelectHotspot(null)}
              aria-label="Close hotspot details"
              className="p-1.5 text-[#B8B1A7] hover:text-[#F5F3EF] rounded-lg hover:bg-white/[0.06] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Primary Thermal Readout */}
          <div className="grid grid-cols-3 gap-2.5 p-3 rounded-xl bg-[#1A1816] border border-[#33302B]">
            <div>
              <span className="text-[11px] text-[#B8B1A7] block">
                Surface Temp
              </span>
              <span className="font-display text-lg font-bold text-[#F5F3EF] tabular-nums">
                {selectedHotspot.peakTempF.toFixed(1)}°F
              </span>
              <span className="font-mono text-[11px] text-[#8C857B] block tabular-nums">
                {selectedHotspot.peakTempC.toFixed(1)}°C
              </span>
            </div>
            <div>
              <span className="text-[11px] text-[#B8B1A7] block">
                Heat Island
              </span>
              <span className="font-display text-lg font-bold text-[#D98A5B] tabular-nums">
                +{selectedHotspot.deltaF.toFixed(1)}°F
              </span>
              <span className="font-mono text-[11px] text-[#8C857B] block tabular-nums">
                vs {selectedHotspot.baselineRuralF}°F rural
              </span>
            </div>
            <div>
              <span className="text-[11px] text-[#B8B1A7] block">
                Cooling Goal
              </span>
              <span className="font-display text-lg font-bold text-[#78B093] tabular-nums">
                -{selectedHotspot.estimatedCoolingPotentialF}°F
              </span>
              <span className="font-mono text-[11px] text-[#8C857B] block">
                Potential
              </span>
            </div>
          </div>

          {/* "Should I Leave Home?" Quick Outdoor Health Verdict Strip */}
          <div
            className={`p-3 rounded-xl border flex flex-col gap-2 ${
              quickHealth.status === "safe"
                ? "bg-[#1A2620] border-[#5E9A7B]/45"
                : quickHealth.status === "caution"
                ? "bg-[#262118] border-[#E09F67]/45"
                : "bg-[#281C19] border-[#D97757]/50"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#F5F3EF]">
                {quickHealth.status === "safe" ? (
                  <ShieldCheck className="w-4 h-4 text-[#78B093]" />
                ) : quickHealth.status === "caution" ? (
                  <AlertTriangle className="w-4 h-4 text-[#E09F67]" />
                ) : (
                  <ShieldAlert className="w-4 h-4 text-[#E58E73]" />
                )}
                <span>{quickHealth.verdictBadge}</span>
              </div>
              <span className="font-mono text-[11px] text-[#D6D0C6] tabular-nums">
                Max {quickHealth.maxSafeExposureMinutes}m outdoors · {quickHealth.hydrationCupsPerHour} c/hr water
              </span>
            </div>
            {onOpenHealthGuide && (
              <button
                type="button"
                onClick={() => onOpenHealthGuide(selectedHotspot)}
                className="w-full py-1.5 px-2.5 rounded-lg bg-[#161513]/80 hover:bg-[#161513] border border-[#38342F] text-xs font-medium text-[#EAE5DD] flex items-center justify-between transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  <HeartPulse className="w-3.5 h-3.5 text-[#78B093]" />
                  Check Personal Leave-Home &amp; Health Guide
                </span>
                <ArrowUpRight className="w-3.5 h-3.5 text-[#78B093]" />
              </button>
            )}
          </div>

          {/* Cause & Action */}
          <div className="space-y-2.5 text-xs sm:text-[13px]">
            <div>
              <span className="text-xs font-semibold text-[#B8B1A7] block mb-0.5">
                Why this area traps heat:
              </span>
              <p className="text-[#D6D0C6] leading-relaxed">
                {selectedHotspot.primaryCause}
              </p>
            </div>
            <div>
              <span className="text-xs font-semibold text-[#78B093] block mb-0.5">
                Recommended cooling plan:
              </span>
              <p className="text-[#F5F3EF] leading-relaxed">
                {selectedHotspot.recommendedAction}
              </p>
            </div>
          </div>

          {/* Geodetic Footer + AI Audit & Simulate CTAs */}
          <div className="pt-2.5 border-t border-[#33302B] flex flex-col gap-2.5">
            <span className="font-mono text-[11px] text-[#8C857B] tabular-nums flex items-center gap-1.5">
              <Crosshair className="w-3.5 h-3.5 text-[#78B093]" />
              {selectedHotspot.coordinates[1].toFixed(4)}°N,{" "}
              {Math.abs(selectedHotspot.coordinates[0]).toFixed(4)}°W · {selectedHotspot.censusTract}
            </span>

            <div className="grid grid-cols-2 gap-2">
              {onAuditHotspot && (
                <button
                  type="button"
                  onClick={() => onAuditHotspot(selectedHotspot)}
                  className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#1A1816] hover:bg-[#2E2B27] border border-[#38342F] text-[#F5F3EF] text-xs font-semibold transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#78B093]" />
                  <span>AI Climate Audit</span>
                </button>
              )}

              {onSimulateHotspot && (
                <button
                  type="button"
                  onClick={() => onSimulateHotspot(selectedHotspot)}
                  className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#5E9A7B] hover:bg-[#6CA889] text-[#141311] font-semibold text-xs transition-colors"
                >
                  <span>Simulate Cooling</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Hotspot Ranking List */}
      <div className="w-full rounded-2xl bg-[#211F1C] border border-[#33302B] p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between border-b border-[#2F2C28] pb-2.5">
          <div>
            <h3 className="font-display text-sm font-semibold text-[#F5F3EF]">
              Hottest Neighborhood Zones
            </h3>
            <p className="text-xs text-[#8C857B]">
              Click any zone to check outdoor safety &amp; fly there
            </p>
          </div>
          <span className="font-mono text-xs text-[#78B093] bg-[#5E9A7B]/15 border border-[#5E9A7B]/30 px-2.5 py-0.5 rounded-lg tabular-nums">
            Top {hotspots.length}
          </span>
        </div>

        <div className="flex flex-col gap-2">
          {hotspots.map((spot) => {
            const isSelected = selectedHotspot?.id === spot.id;
            return (
              <button
                key={spot.id}
                type="button"
                onClick={() => onSelectHotspot(spot)}
                className={`w-full text-left p-3 rounded-xl border transition-colors flex items-center justify-between gap-3 group ${
                  isSelected
                    ? "bg-[#5E9A7B]/15 border-[#5E9A7B]/50"
                    : "bg-[#1A1816] hover:bg-[#262320] border-[#2E2B27]"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`font-mono text-xs font-semibold w-6 h-6 rounded-lg flex items-center justify-center shrink-0 tabular-nums ${
                      isSelected
                        ? "bg-[#5E9A7B] text-[#141311]"
                        : "bg-[#282522] text-[#B8B1A7]"
                    }`}
                  >
                    {spot.rank}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-[#F5F3EF] truncate">
                      {spot.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-[#8C857B]">
                      <span className="capitalize">
                        {spot.surfaceType.replace("_", " ")}
                      </span>
                      <span>·</span>
                      <span
                        className={
                          spot.riskLevel === "Critical"
                            ? "text-[#E09F67] font-medium"
                            : "text-[#B8B1A7]"
                        }
                      >
                        {spot.riskLevel}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="font-display text-sm font-bold text-[#F5F3EF] tabular-nums block">
                    {spot.peakTempF.toFixed(1)}°F
                  </span>
                  <span className="font-mono text-xs text-[#D98A5B] tabular-nums">
                    +{spot.deltaF.toFixed(1)}°F
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
