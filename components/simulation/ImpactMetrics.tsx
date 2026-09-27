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
    <div className="flex flex-col gap-3 pt-3 border-t border-[#2F2C28]">
      {/* Before / After Temperature Telemetry Card */}
      <div className="p-3.5 rounded-xl bg-[#1A1816] border border-[#33302B] flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-[#B8B1A7] flex items-center gap-1.5">
            <TrendingDown className="w-4 h-4 text-[#78B093]" />
            Before vs. After Temperature
          </span>
          {hasCooling && (
            <span className="font-mono text-xs font-semibold px-2.5 py-0.5 rounded-lg bg-[#5E9A7B]/20 text-[#94C4AB] border border-[#5E9A7B]/35 tabular-nums">
              {result.temperatureDeltaF.toFixed(1)}°F ({result.temperatureDeltaC.toFixed(1)}°C)
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 pt-1">
          <div>
            <span className="text-xs text-[#8C857B] block">
              Current Peak
            </span>
            <span
              className={`font-display text-xl font-bold tabular-nums ${
                isBaselinePreview
                  ? "text-[#F5F3EF]"
                  : "text-[#8C857B] line-through"
              }`}
            >
              {result.baselinePeakTempF.toFixed(1)}°F
            </span>
          </div>

          <ArrowRight className="w-4 h-4 text-[#78B093] shrink-0" />

          <div className="text-right">
            <span className="text-xs text-[#78B093] block">
              Cooled Peak
            </span>
            <span className="font-display text-2xl font-bold text-[#78B093] tabular-nums">
              {result.projectedPeakTempF.toFixed(1)}°F
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-[#B8B1A7] pt-2 border-t border-[#2C2925] tabular-nums">
          <span>
            Avg: {result.baselineMeanTempF}°F →{" "}
            <strong className="text-[#F5F3EF]">{result.projectedMeanTempF}°F</strong>
          </span>
          <span>{result.affectedParcelCount} parcels cooled</span>
        </div>
      </div>

      {/* 4-Cell Environmental & Municipal ROI Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* 1. Capital Cost */}
        <div className="p-3 rounded-xl bg-[#1A1816] border border-[#2E2B27]">
          <div className="flex items-center justify-between text-[#B8B1A7] mb-1">
            <span className="text-xs">Estimated Cost</span>
            <DollarSign className="w-3.5 h-3.5 text-[#78B093]" />
          </div>
          <span className="font-display text-base font-bold text-[#F5F3EF] tabular-nums block">
            ${result.estimatedCostUSD.toLocaleString()}
          </span>
          <span className="text-[11px] text-[#8C857B] tabular-nums">
            {(result.affectedAreaSqMeters / 4046.86).toFixed(0)} acres covered
          </span>
        </div>

        {/* 2. Annual CO2 Offset */}
        <div className="p-3 rounded-xl bg-[#1A1816] border border-[#2E2B27]">
          <div className="flex items-center justify-between text-[#B8B1A7] mb-1">
            <span className="text-xs">CO₂ Offset / Yr</span>
            <Leaf className="w-3.5 h-3.5 text-[#78B093]" />
          </div>
          <span className="font-display text-base font-bold text-[#78B093] tabular-nums block">
            {result.annualCo2OffsetMetricTons.toFixed(1)} tons/yr
          </span>
          <span className="text-[11px] text-[#8C857B]">
            Trees + grid savings
          </span>
        </div>

        {/* 3. Peak HVAC Energy Saved */}
        <div className="p-3 rounded-xl bg-[#1A1816] border border-[#2E2B27]">
          <div className="flex items-center justify-between text-[#B8B1A7] mb-1">
            <span className="text-xs">Energy Saved</span>
            <Zap className="w-3.5 h-3.5 text-[#78B093]" />
          </div>
          <span className="font-display text-base font-bold text-[#F5F3EF] tabular-nums block">
            {result.annualEnergySavedMwh.toFixed(1)} MWh/yr
          </span>
          <span className="text-[11px] text-[#8C857B]">
            Less AC grid demand
          </span>
        </div>

        {/* 4. Heat Mortality Risk Drop */}
        <div className="p-3 rounded-xl bg-[#1A1816] border border-[#2E2B27]">
          <div className="flex items-center justify-between text-[#B8B1A7] mb-1">
            <span className="text-xs">Heat Risk Drop</span>
            <ShieldCheck className="w-3.5 h-3.5 text-[#78B093]" />
          </div>
          <span className="font-display text-base font-bold text-[#78B093] tabular-nums block">
            -{result.heatRiskReductionPct.toFixed(1)}%
          </span>
          <span className="text-[11px] text-[#8C857B]">
            Lower heat stress
          </span>
        </div>
      </div>
    </div>
  );
}
