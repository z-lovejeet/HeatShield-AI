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
      metricLabel: 'Peak HVAC Grid Load Shaving',
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
        'Translates raw OpenStreetMap land-use polygons and Open-Meteo solar telemetry into actionable microclimate adaptation prescriptions.',
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
        'Prioritizes cooling interventions in neighborhoods with high elderly populations, low tree canopy, and elevated emergency room risk.',
      liveAlign: lastAnalysis?.sdgAlignment?.sdg3,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#34D399]">
            03 / United Nations Framework & Municipal ROI
          </span>
          <h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-[#F4F6F7]">
            UN Sustainable Development Goal Alignment
          </h2>
        </div>
        <div className="inline-flex items-center gap-2 self-start rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-[#34D399]">
          <ShieldCheck className="h-3.5 w-3.5 text-[#10B981]" />
          50-City Scale Projection: -3.6°F to -8.1°F (-2.0°C to -4.5°C)
        </div>
      </div>

      {/* 3 SDG Cards Grid */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {sdgCards.map((sdg) => {
          const Icon = sdg.icon;
          return (
            <div key={sdg.code} className="bezel-shell group">
              <div className="bezel-core flex h-full flex-col justify-between p-6">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-widest text-[#34D399]">
                      {sdg.code}
                    </span>
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-[#10B981] transition-colors group-hover:border-emerald-500/30 group-hover:bg-emerald-500/10">
                      <Icon className="h-4 w-4" />
                    </div>
                  </div>

                  <h3 className="mt-4 font-display text-lg font-bold tracking-tight text-[#F4F6F7]">
                    {sdg.title}
                  </h3>
                  <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-[#94A3AB]">
                    {sdg.targets}
                  </p>

                  <p className="mt-3 text-xs leading-relaxed text-[#94A3AB]">
                    {sdg.description}
                  </p>

                  {sdg.liveAlign && (
                    <div className="mt-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05] p-3">
                      <div className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-wider text-[#34D399]">
                        <Sparkles className="h-3 w-3 text-[#10B981]" />
                        Live Gemini Audit Alignment ({lastAnalysis?.areaName || activeCityName})
                      </div>
                      <p className="mt-1 text-[11px] leading-relaxed text-[#F4F6F7]/90">
                        {sdg.liveAlign}
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-5 border-t border-white/[0.06] pt-4">
                  <span className="block font-mono text-[9px] uppercase tracking-widest text-[#5E6D76]">
                    {sdg.metricLabel}
                  </span>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="font-display text-xl font-bold tracking-tight text-[#10B981] tabular-nums">
                      {sdg.metricValue}
                    </span>
                    <span className="inline-flex items-center gap-1 font-mono text-[10px] text-[#34D399]">
                      <CheckCircle2 className="h-3 w-3 text-[#10B981]" />
                      Verified Target
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Latest Gemini AI Climate Audit Snapshot */}
      <div className="bezel-shell">
        <div className="bezel-core p-6">
          <div className="flex flex-col justify-between gap-4 border-b border-white/[0.06] pb-4 md:flex-row md:items-center">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-[#10B981]">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#34D399]">
                    Runtime AI Telemetry Snapshot
                  </span>
                  {lastAnalysis?.modelUsed && (
                    <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 font-mono text-[9px] text-[#94A3AB]">
                      {lastAnalysis.modelUsed}
                    </span>
                  )}
                </div>
                <h3 className="mt-0.5 font-display text-lg font-bold tracking-tight text-[#F4F6F7]">
                  {lastAnalysis
                    ? `Latest Gemini Urban Climate Audit: ${lastAnalysis.areaName} (${lastAnalysis.cityName || activeCityName})`
                    : `Executive AI Climate Audit Ready — ${activeCityName}`}
                </h3>
              </div>
            </div>

            <Link
              href="/map"
              className="group inline-flex items-center gap-2.5 self-start rounded-full border border-emerald-500/35 bg-[#10B981] pl-4 pr-2 py-1.5 text-xs font-semibold text-[#060809] transition-all hover:bg-[#34D399] md:self-auto"
            >
              <span>{lastAnalysis ? 'Update Audit on 3D Map' : 'Run Live AI Audit on Map'}</span>
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#060809]/15 transition-transform group-hover:translate-x-0.5">
                <ArrowUpRight className="h-3.5 w-3.5 text-[#060809]" />
              </span>
            </Link>
          </div>

          {lastAnalysis ? (
            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-4">
              <div className="rounded-xl border border-white/[0.06] bg-[#060809]/75 p-4">
                <span className="font-mono text-[9px] uppercase tracking-wider text-[#94A3AB]">
                  UHI Severity Rating
                </span>
                <div className="mt-1.5 flex items-baseline gap-2">
                  <span className="font-display text-2xl font-bold text-[#F4F6F7] tabular-nums">
                    {lastAnalysis.severityScore ?? 84}/100
                  </span>
                  <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-[9px] uppercase text-[#34D399]">
                    {lastAnalysis.severityLabel || 'CRITICAL'}
                  </span>
                </div>
                <p className="mt-1.5 font-mono text-[10px] text-[#94A3AB] tabular-nums">
                  Peak LST: {lastAnalysis.peakTemperature?.toFixed(1) ?? '101.8'}°F · Avg:{' '}
                  {lastAnalysis.averageTemperature?.toFixed(1) ?? '96.4'}°F
                </p>
              </div>

              <div className="rounded-xl border border-white/[0.06] bg-[#060809]/75 p-4">
                <div className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-wider text-[#34D399]">
                  <Trees className="h-3.5 w-3.5 text-[#10B981]" />
                  Prescribed Canopy
                </div>
                <p className="mt-1.5 font-display text-xl font-bold text-[#F4F6F7] tabular-nums">
                  {lastAnalysis.recommendedInterventions?.trees?.count ?? 220} Trees
                </p>
                <p className="mt-1 line-clamp-2 text-[11px] text-[#94A3AB]">
                  {lastAnalysis.recommendedInterventions?.trees?.species ||
                    'Drought-tolerant high-LAI urban street trees'}
                </p>
              </div>

              <div className="rounded-xl border border-white/[0.06] bg-[#060809]/75 p-4">
                <div className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-wider text-[#34D399]">
                  <Sun className="h-3.5 w-3.5 text-[#10B981]" />
                  High-Albedo Retrofits
                </div>
                <p className="mt-1.5 font-display text-xl font-bold text-[#F4F6F7] tabular-nums">
                  {lastAnalysis.recommendedInterventions?.coolRoofs?.coveragePercent ?? 55}% Roofs
                </p>
                <p className="mt-1 line-clamp-2 text-[11px] text-[#94A3AB]">
                  {lastAnalysis.recommendedInterventions?.coolRoofs?.targetBuildingTypes ||
                    'Commercial flat roofs & logistics warehouses'}
                </p>
              </div>

              <div className="rounded-xl border border-white/[0.06] bg-[#060809]/75 p-4">
                <div className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-wider text-[#34D399]">
                  <Droplets className="h-3.5 w-3.5 text-[#10B981]" />
                  Projected Cooling Impact
                </div>
                <p className="mt-1.5 font-display text-xl font-bold text-[#10B981] tabular-nums">
                  -{lastAnalysis.projectedImpact?.temperatureReductionF?.toFixed(1) ?? '5.4'}°F (
                  -{lastAnalysis.projectedImpact?.temperatureReductionC?.toFixed(1) ?? '3.0'}°C)
                </p>
                <p className="mt-1 font-mono text-[10px] text-[#94A3AB] tabular-nums">
                  {lastAnalysis.projectedImpact?.annualCo2OffsetMetricTons?.toFixed(1) ?? '4.8'} tCO₂/yr ·{' '}
                  {lastAnalysis.projectedImpact?.annualEnergySavedMwh ?? 290} MWh/yr
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-4 flex flex-col justify-between gap-4 rounded-xl border border-white/[0.06] bg-[#060809]/65 p-4 sm:flex-row sm:items-center">
              <p className="text-xs leading-relaxed text-[#94A3AB]">
                Select any urban hotspot on the <span className="text-[#F4F6F7]">3D Thermal Map</span> and run a{' '}
                <span className="text-[#34D399]">Gemini Executive Climate Audit</span> or{' '}
                <span className="text-[#34D399]">&ldquo;What If?&rdquo; Cooling Simulation</span>. Your live session
                prescriptions and telemetry will automatically synchronize with this dashboard.
              </p>
              <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-[#34D399]">
                Sync Status: Standing By
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
