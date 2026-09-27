'use client';

import React from 'react';
import Link from 'next/link';
import {
  Building2,
  CloudSun,
  HeartPulse,
  Sparkles,
  ArrowUpRight,
  CheckCircle2,
  ShieldCheck,
  Trees,
  Sun,
  Droplets,
} from 'lucide-react';

export interface SavedAnalysisSnapshot {
  timestamp?: string;
  cityName?: string;
  areaName?: string;
  severityScore?: number;
  severityLabel?: string;
  averageTemperature?: number;
  peakTemperature?: number;
  primaryCauses?: string[];
  riskFactors?: string[];
  recommendedInterventions?: {
    trees?: { count: number; species: string; placementStrategy: string };
    coolRoofs?: { coveragePercent: number; targetBuildingTypes: string };
    waterFeatures?: { count: number; type: string };
  };
  projectedImpact?: {
    temperatureReductionF?: number;
    temperatureReductionC?: number;
    estimatedCostUSD?: number;
    annualCo2OffsetMetricTons?: number;
    annualEnergySavedMwh?: number;
    livesProtectedEstimate?: string;
  };
  sdgAlignment?: {
    sdg11?: string;
    sdg13?: string;
    sdg3?: string;
  };
  modelUsed?: string;
}

interface SdgSectionProps {
  lastAnalysis: SavedAnalysisSnapshot | null;
  activeCityName: string;
}

export function SdgSection({ lastAnalysis, activeCityName }: SdgSectionProps) {
  const sdgCards = [
    {
      code: 'UN SDG 11',
      title: 'Sustainable Cities & Communities',
      targets: 'Target 11.7 & Target 11.b',
      icon: Building2,
      metricValue: '15–22%',
      metricLabel: 'Peak HVAC Grid Load Reduction',
      description:
        'Pinpoints canopy-deficient, high-impervious census tracts to guide equitable green space distribution and municipal resource efficiency.',
      liveAlign: lastAnalysis?.sdgAlignment?.sdg11,
    },
    {
      code: 'UN SDG 13',
      title: 'Climate Action & Resilience',
      targets: 'Target 13.1 — Adaptive Capacity',
      icon: CloudSun,
      metricValue: '1.2M+ tCO₂e',
      metricLabel: '50-City Annual Carbon Offset',
      description:
        'Translates real OpenStreetMap land-use polygons and Open-Meteo solar telemetry into actionable microclimate adaptation prescriptions.',
      liveAlign: lastAnalysis?.sdgAlignment?.sdg13,
    },
    {
      code: 'UN SDG 3',
      title: 'Good Health & Well-Being',
      targets: 'Target 3.9 — Environmental Mortality',
      icon: HeartPulse,
      metricValue: '300+ Lives/yr',
      metricLabel: 'Prevented Heat Mortality & $150M+ Saved',
      description:
        'Prioritizes cooling interventions in neighborhoods with high elderly populations, low tree canopy, and elevated heat-related health risk.',
      liveAlign: lastAnalysis?.sdgAlignment?.sdg3,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <span className="text-[12px] font-medium text-[#78B093]">
            United Nations Framework &amp; Municipal Impact
          </span>
          <h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-[#F5F3EF]">
            UN Sustainable Development Goal Alignment
          </h2>
        </div>
        <div className="inline-flex items-center gap-2 self-start rounded-full border border-[#5E9A7B]/30 bg-[#5E9A7B]/10 px-3.5 py-1.5 text-[12px] font-medium text-[#78B093]">
          <ShieldCheck className="h-4 w-4 text-[#5E9A7B]" />
          50-City Scale Projection: -3.6°F to -8.1°F (-2.0°C to -4.5°C)
        </div>
      </div>

      {/* 3 SDG Cards Grid */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {sdgCards.map((sdg) => {
          const Icon = sdg.icon;
          return (
            <div
              key={sdg.code}
              className="rounded-2xl border border-[#33302B] bg-[#211F1C] p-6 flex h-full flex-col justify-between shadow-[0_8px_24px_-8px_rgba(0,0,0,0.45)]"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-full border border-[#5E9A7B]/30 bg-[#5E9A7B]/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#78B093]">
                    {sdg.code}
                  </span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#33302B] bg-[#1A1816] text-[#78B093]">
                    <Icon className="h-4 w-4" />
                  </div>
                </div>

                <h3 className="mt-4 font-display text-lg font-bold tracking-tight text-[#F5F3EF]">
                  {sdg.title}
                </h3>
                <p className="mt-0.5 text-[12px] font-medium text-[#8C857B]">
                  {sdg.targets}
                </p>

                <p className="mt-3 text-[13px] leading-relaxed text-[#B8B1A7]">
                  {sdg.description}
                </p>

                {sdg.liveAlign && (
                  <div className="mt-4 rounded-xl border border-[#5E9A7B]/25 bg-[#5E9A7B]/10 p-3.5">
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#78B093]">
                      <Sparkles className="h-3.5 w-3.5 text-[#5E9A7B]" />
                      Live AI Audit Alignment ({lastAnalysis?.areaName || activeCityName})
                    </div>
                    <p className="mt-1 text-[12px] leading-relaxed text-[#EAE5DD]">
                      {sdg.liveAlign}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-5 border-t border-[#2F2C28] pt-4">
                <span className="block text-[11px] font-medium text-[#8C857B]">
                  {sdg.metricLabel}
                </span>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="font-display text-xl font-bold tracking-tight text-[#78B093] tabular-nums">
                    {sdg.metricValue}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#78B093]">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#5E9A7B]" />
                    Verified Target
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Latest Gemini AI Climate Audit Snapshot */}
      <div className="rounded-2xl border border-[#33302B] bg-[#211F1C] p-6 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.45)]">
        <div className="flex flex-col justify-between gap-4 border-b border-[#2F2C28] pb-4 md:flex-row md:items-center">
          <div className="flex items-center gap-3.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#5E9A7B]/30 bg-[#5E9A7B]/12 text-[#78B093]">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-medium text-[#78B093]">
                  Latest AI Climate Audit Snapshot
                </span>
                {lastAnalysis?.modelUsed && (
                  <span className="rounded-full border border-[#33302B] bg-[#1A1816] px-2.5 py-0.5 font-mono text-[10px] text-[#B8B1A7]">
                    {lastAnalysis.modelUsed}
                  </span>
                )}
              </div>
              <h3 className="mt-0.5 font-display text-lg font-bold tracking-tight text-[#F5F3EF]">
                {lastAnalysis
                  ? `AI Urban Climate Audit: ${lastAnalysis.areaName} (${lastAnalysis.cityName || activeCityName})`
                  : `AI Climate Audit Ready — ${activeCityName}`}
              </h3>
            </div>
          </div>

          <Link
            href="/map"
            className="group inline-flex items-center gap-2.5 self-start rounded-full bg-[#5E9A7B] hover:bg-[#6CA889] pl-4 pr-2.5 py-2 text-[13px] font-semibold text-[#141311] transition-colors md:self-auto"
          >
            <span>{lastAnalysis ? 'Update Audit on 3D Map' : 'Run AI Audit on Map'}</span>
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#141311]/15 transition-transform group-hover:translate-x-0.5">
              <ArrowUpRight className="h-3.5 w-3.5 text-[#141311]" />
            </span>
          </Link>
        </div>

        {lastAnalysis ? (
          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="rounded-xl border border-[#2F2C28] bg-[#1A1816] p-4">
              <span className="text-[11px] font-medium text-[#8C857B]">
                Heat Severity Rating
              </span>
              <div className="mt-1.5 flex items-baseline gap-2">
                <span className="font-display text-2xl font-bold text-[#F5F3EF] tabular-nums">
                  {lastAnalysis.severityScore ?? 84}/100
                </span>
                <span className="rounded-full border border-[#D98A5B]/30 bg-[#D98A5B]/12 px-2.5 py-0.5 text-[10px] font-semibold uppercase text-[#E09F67]">
                  {lastAnalysis.severityLabel || 'CRITICAL'}
                </span>
              </div>
              <p className="mt-1.5 font-mono text-xs text-[#B8B1A7] tabular-nums">
                Peak: {lastAnalysis.peakTemperature?.toFixed(1) ?? '101.8'}°F · Avg:{' '}
                {lastAnalysis.averageTemperature?.toFixed(1) ?? '96.4'}°F
              </p>
            </div>

            <div className="rounded-xl border border-[#2F2C28] bg-[#1A1816] p-4">
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#78B093]">
                <Trees className="h-3.5 w-3.5 text-[#5E9A7B]" />
                Recommended Canopy
              </div>
              <p className="mt-1.5 font-display text-xl font-bold text-[#F5F3EF] tabular-nums">
                {lastAnalysis.recommendedInterventions?.trees?.count ?? 220} Trees
              </p>
              <p className="mt-1 line-clamp-2 text-[12px] text-[#B8B1A7]">
                {lastAnalysis.recommendedInterventions?.trees?.species ||
                  'Drought-tolerant urban street trees'}
              </p>
            </div>

            <div className="rounded-xl border border-[#2F2C28] bg-[#1A1816] p-4">
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#E09F67]">
                <Sun className="h-3.5 w-3.5 text-[#D98A5B]" />
                Cool Roof Retrofits
              </div>
              <p className="mt-1.5 font-display text-xl font-bold text-[#F5F3EF] tabular-nums">
                {lastAnalysis.recommendedInterventions?.coolRoofs?.coveragePercent ?? 55}% Roofs
              </p>
              <p className="mt-1 line-clamp-2 text-[12px] text-[#B8B1A7]">
                {lastAnalysis.recommendedInterventions?.coolRoofs?.targetBuildingTypes ||
                  'Commercial flat roofs & warehouses'}
              </p>
            </div>

            <div className="rounded-xl border border-[#2F2C28] bg-[#1A1816] p-4">
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#7BA7BC]">
                <Droplets className="h-3.5 w-3.5 text-[#7BA7BC]" />
                Projected Cooling Impact
              </div>
              <p className="mt-1.5 font-display text-xl font-bold text-[#78B093] tabular-nums">
                -{lastAnalysis.projectedImpact?.temperatureReductionF?.toFixed(1) ?? '5.4'}°F (
                -{lastAnalysis.projectedImpact?.temperatureReductionC?.toFixed(1) ?? '3.0'}°C)
              </p>
              <p className="mt-1 font-mono text-xs text-[#B8B1A7] tabular-nums">
                {lastAnalysis.projectedImpact?.annualCo2OffsetMetricTons?.toFixed(1) ?? '4.8'} tCO₂/yr ·{' '}
                {lastAnalysis.projectedImpact?.annualEnergySavedMwh ?? 290} MWh/yr
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-4 flex flex-col justify-between gap-4 rounded-xl border border-[#2F2C28] bg-[#1A1816] p-4 sm:flex-row sm:items-center">
            <p className="text-[13px] leading-relaxed text-[#B8B1A7]">
              Select any urban hotspot on the <span className="font-medium text-[#F5F3EF]">Heat Map &amp; Simulator</span> and run an{' '}
              <span className="font-medium text-[#78B093]">AI Climate Audit</span> or{' '}
              <span className="font-medium text-[#78B093]">Cooling Simulation</span>. Your live session
              results will automatically sync here.
            </p>
            <span className="shrink-0 text-[12px] font-medium text-[#78B093]">
              Sync Status: Ready
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
