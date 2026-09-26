"use client";

import React from "react";
import { SimulationResult } from "@/lib/simulation";
import {
  ArrowRight,
  DollarSign,
  Leaf,
  ShieldCheck,
  TrendingDown,
  Zap,
} from "lucide-react";

interface ImpactMetricsProps {
  result: SimulationResult;
  isBaselinePreview: boolean;
}

export function ImpactMetrics({
  result,
  isBaselinePreview,
}: ImpactMetricsProps) {
  const hasCooling = result.temperatureDeltaF < 0;

  return (
    <div className="flex flex-col gap-2.5 pt-2 border-t border-white/[0.06]">
      {/* Before / After Temperature Telemetry Card */}
      <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08] flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#94A3AB] flex items-center gap-1.5">
            <TrendingDown className="w-3 h-3 text-[#10B981]" />
            Before / After Surface Thermal Delta
          </span>
          {hasCooling && (
            <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/35 tabular-nums">
              {result.temperatureDeltaF.toFixed(1)}°F ({result.temperatureDeltaC.toFixed(1)}°C)
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 pt-0.5">
          <div>
            <span className="font-mono text-[9px] uppercase tracking-wider text-[#526068] block">
              Unmitigated Peak
            </span>
            <span
              className={`font-display text-lg font-bold tabular-nums ${
                isBaselinePreview
                  ? "text-[#F4F6F7]"
                  : "text-[#94A3AB] line-through decoration-white/30"
              }`}
            >
              {result.baselinePeakTempF.toFixed(1)}°F
            </span>
          </div>

          <ArrowRight className="w-4 h-4 text-[#10B981] shrink-0" />

          <div className="text-right">
            <span className="font-mono text-[9px] uppercase tracking-wider text-[#10B981] block">
              Simulated Peak
            </span>
            <span className="font-display text-xl font-bold text-[#10B981] tabular-nums">
              {result.projectedPeakTempF.toFixed(1)}°F
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between text-[10px] font-mono text-[#94A3AB] pt-1.5 border-t border-white/[0.05] tabular-nums">
          <span>
            Zone Mean: {result.baselineMeanTempF}°F →{" "}
            <strong className="text-[#F4F6F7]">{result.projectedMeanTempF}°F</strong>
          </span>
          <span>{result.affectedParcelCount} OSM parcels cooled</span>
        </div>
      </div>

      {/* 4-Cell Environmental & Municipal ROI Grid */}
      <div className="grid grid-cols-2 gap-2">
        {/* 1. Capital Cost */}
        <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
          <div className="flex items-center justify-between text-[#94A3AB] mb-1">
            <span className="font-mono text-[9px] uppercase tracking-wider">
              Est. Capital Cost
            </span>
            <DollarSign className="w-3 h-3 text-[#10B981]" />
          </div>
          <span className="font-display text-sm font-bold text-[#F4F6F7] tabular-nums block">
            ${result.estimatedCostUSD.toLocaleString()}
          </span>
          <span className="font-mono text-[9px] text-[#526068] tabular-nums">
            {(result.affectedAreaSqMeters / 4046.86).toFixed(0)} acres treated
          </span>
        </div>

        {/* 2. Annual CO2 Offset */}
        <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
          <div className="flex items-center justify-between text-[#94A3AB] mb-1">
            <span className="font-mono text-[9px] uppercase tracking-wider">
              CO₂ Offset / Yr
            </span>
            <Leaf className="w-3 h-3 text-[#10B981]" />
          </div>
          <span className="font-display text-sm font-bold text-[#10B981] tabular-nums block">
            {result.annualCo2OffsetMetricTons.toFixed(1)} t/yr
          </span>
          <span className="font-mono text-[9px] text-[#526068]">
            i-Tree + Grid Avoided
          </span>
        </div>

        {/* 3. Peak HVAC Energy Saved */}
        <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
          <div className="flex items-center justify-between text-[#94A3AB] mb-1">
            <span className="font-mono text-[9px] uppercase tracking-wider">
              HVAC Saved / Yr
            </span>
            <Zap className="w-3 h-3 text-[#10B981]" />
          </div>
          <span className="font-display text-sm font-bold text-[#F4F6F7] tabular-nums block">
            {result.annualEnergySavedMwh.toFixed(1)} MWh
          </span>
          <span className="font-mono text-[9px] text-[#526068]">
            Peak AC load reduction
          </span>
        </div>

        {/* 4. Heat Mortality Risk Drop */}
        <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
          <div className="flex items-center justify-between text-[#94A3AB] mb-1">
            <span className="font-mono text-[9px] uppercase tracking-wider">
              Heat Risk Drop
            </span>
            <ShieldCheck className="w-3 h-3 text-[#10B981]" />
          </div>
          <span className="font-display text-sm font-bold text-[#10B981] tabular-nums block">
            -{result.heatRiskReductionPct.toFixed(1)}%
          </span>
          <span className="font-mono text-[9px] text-[#526068]">
            CDC mortality model
          </span>
        </div>
      </div>
    </div>
  );
}
