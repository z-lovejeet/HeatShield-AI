"use client";

import React, { useState, useEffect, useMemo } from "react";
import { CoreMap } from "@/components/map/CoreMap";
import { CitySearch } from "@/components/map/CitySearch";
import { MapControls } from "@/components/map/MapControls";
import { HotspotMarkers } from "@/components/map/HotspotMarkers";
import { SimulationPanel } from "@/components/simulation/SimulationPanel";
import { AnalysisReport } from "@/components/chat/AnalysisReport";
import { ChatAdvisor } from "@/components/chat/ChatAdvisor";
import {
  ThermalFeatureCollection,
  loadCityThermalData,
  fetchLiveRealThermalData,
  SUPPORTED_CITIES,
} from "@/lib/thermal-data";
import { Hotspot, detectTopHotspots } from "@/lib/hotspots";
import {
  InterventionConfig,
  runCoolingSimulation,
} from "@/lib/simulation";
import { MapContextPayload } from "@/lib/prompts";
import {
  CheckCircle2,
  FileSpreadsheet,
  Layers,
  Loader2,
  Radio,
  SlidersHorizontal,
} from "lucide-react";

const DEFAULT_INTERVENTION_CONFIG: InterventionConfig = {
  treeCount: 0,
  coolRoofPct: 0,
  waterFeatureCount: 0,
  radiusMeters: 600,
  sectorWide: false,
};

export default function MapPage() {
  const [activeCityId, setActiveCityId] = useState<string>("portland");
  const [customLocation, setCustomLocation] = useState<{
    id: string;
    name: string;
    state: string;
    center: [number, number];
  } | null>(null);

  const [thermalData, setThermalData] =
    useState<ThermalFeatureCollection | null>(null);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null);
  const [isCalculatingThermal, setIsCalculatingThermal] =
    useState<boolean>(true);

  // Left Sidebar Tab State: "controls" (Layers) | "simulate" ("What-If?" Sim) | "analyze" (Gemini AI Audit)
  const [leftTab, setLeftTab] = useState<"controls" | "simulate" | "analyze">(
    "controls"
  );
  const [auditTriggerCount, setAuditTriggerCount] = useState<number>(0);

  // Layer Controls State
  const [showHeatmap, setShowHeatmap] = useState<boolean>(true);
  const [heatmapOpacity, setHeatmapOpacity] = useState<number>(0.85);
  const [showHotspots, setShowHotspots] = useState<boolean>(true);
  const [show3DBuildings, setShow3DBuildings] = useState<boolean>(true);

  // Phase 3: "What If?" Cooling Simulation State
  const [simConfig, setSimConfig] = useState<InterventionConfig>(
    DEFAULT_INTERVENTION_CONFIG
  );
  const [targetHotspot, setTargetHotspot] = useState<Hotspot | null>(null);
  const [isBaselinePreview, setIsBaselinePreview] = useState<boolean>(false);
  const [simulationNotice, setSimulationNotice] = useState<string | null>(null);

  // Load real OSM + satellite LST dataset whenever city or custom location changes
  useEffect(() => {
    let isMounted = true;

    async function updateThermalPipeline() {
      setIsCalculatingThermal(true);
      setSelectedHotspot(null);
      setTargetHotspot(null);
      setSimConfig(DEFAULT_INTERVENTION_CONFIG);
      setIsBaselinePreview(false);

      try {
        if (customLocation) {
          const result = await fetchLiveRealThermalData(
            customLocation.center,
            "heatwave"
          );
          if (isMounted) {
            setThermalData(result.data);
            const topSpots = detectTopHotspots(result.data, 5);
            setHotspots(topSpots);
            if (topSpots.length > 0) {
              setTargetHotspot(topSpots[0]);
            }
          }
        } else {
          // Minimum brief telemetry calibration visibility on city switch so user sees calculation status
          const [data] = await Promise.all([
            loadCityThermalData(activeCityId),
            new Promise((resolve) => setTimeout(resolve, 650)),
          ]);
          if (isMounted) {
            setThermalData(data);
            const topSpots = detectTopHotspots(data, 5);
            setHotspots(topSpots);
            if (topSpots.length > 0) {
              setTargetHotspot(topSpots[0]);
            }
          }
        }
      } finally {
        if (isMounted) {
          setIsCalculatingThermal(false);
        }
      }
    }

    updateThermalPipeline();
    return () => {
      isMounted = false;
    };
  }, [activeCityId, customLocation]);

  // Keep simulation target synchronized when user clicks a hotspot marker or card
  const handleSelectHotspot = (hotspot: Hotspot | null) => {
    setSelectedHotspot(hotspot);
    if (hotspot) {
      setTargetHotspot(hotspot);
      setSimConfig((prev) => ({ ...prev, sectorWide: false }));
    }
  };

  const handleSelectPresetCity = (cityId: string) => {
    if (cityId === activeCityId && !customLocation) return;
    setCustomLocation(null);
    setActiveCityId(cityId);
    setSimulationNotice(null);
  };

  const handleSelectCustomLocation = (loc: {
    id: string;
    name: string;
    state: string;
    center: [number, number];
  }) => {
    setCustomLocation(loc);
    setSimulationNotice(null);
  };

  const currentCityMeta =
    SUPPORTED_CITIES[activeCityId] || SUPPORTED_CITIES.portland;
  const activeCenter: [number, number] = customLocation
    ? customLocation.center
    : currentCityMeta.center;
  const activeCityName = customLocation
    ? `${customLocation.name}, ${customLocation.state}`
    : `${currentCityMeta.name}, ${currentCityMeta.state}`;

  // Determine the exact target coordinates for the cooling simulation
  const effectiveTargetHotspot =
    targetHotspot ||
    selectedHotspot ||
    (hotspots.length > 0 ? hotspots[0] : null);
  const simulationTargetCoords: [number, number] = effectiveTargetHotspot
    ? effectiveTargetHotspot.coordinates
    : activeCenter;

  const hasActiveInterventions =
    simConfig.treeCount > 0 ||
    simConfig.coolRoofPct > 0 ||
    simConfig.waterFeatureCount > 0;

  // Run physical cooling simulation in real time (< 16ms for 420 OSM features)
  const simulationResult = useMemo(() => {
    if (!thermalData) return null;
    return runCoolingSimulation(
      thermalData,
      simulationTargetCoords,
      simConfig
    );
  }, [thermalData, simulationTargetCoords, simConfig]);

  // Persist latest active simulation summary to localStorage for /dashboard
  useEffect(() => {
    if (!simulationResult || !hasActiveInterventions) return;
    try {
      const payload = {
        timestamp: new Date().toISOString(),
        cityName: activeCityName,
        targetZoneName: simConfig.sectorWide
          ? `${activeCityName} Metro Sector`
          : effectiveTargetHotspot?.name || `${activeCityName} Core`,
        config: simConfig,
        baselinePeakTempF: simulationResult.baselinePeakTempF,
        projectedPeakTempF: simulationResult.projectedPeakTempF,
        baselineMeanTempF: simulationResult.baselineMeanTempF,
        projectedMeanTempF: simulationResult.projectedMeanTempF,
        temperatureDeltaF: simulationResult.temperatureDeltaF,
        temperatureDeltaC: simulationResult.temperatureDeltaC,
        affectedParcelCount: simulationResult.affectedParcelCount,
        affectedAreaSqMeters: simulationResult.affectedAreaSqMeters,
        estimatedCostUSD: simulationResult.estimatedCostUSD,
        annualCo2OffsetMetricTons: simulationResult.annualCo2OffsetMetricTons,
        annualEnergySavedMwh: simulationResult.annualEnergySavedMwh,
        heatRiskReductionPct: simulationResult.heatRiskReductionPct,
      };
      localStorage.setItem(
        "heatshield_last_simulation",
        JSON.stringify(payload)
      );
    } catch {
      // Ignore storage quota errors in private browsing
    }
  }, [
    simulationResult,
    hasActiveInterventions,
    activeCityName,
    effectiveTargetHotspot,
    simConfig,
  ]);

  // Triggered when user clicks "Simulate Cooling" on any Hotspot card
  const handleSimulateHotspot = (hotspot: Hotspot) => {
    setSelectedHotspot(hotspot);
    setTargetHotspot(hotspot);
    setLeftTab("simulate");
    setIsBaselinePreview(false);

    // Pre-populate a high-impact cooling intervention stack so the user immediately sees the map cool down
    setSimConfig((prev) => ({
      treeCount: prev.treeCount > 0 ? prev.treeCount : 850,
      coolRoofPct: prev.coolRoofPct > 0 ? prev.coolRoofPct : 45,
      waterFeatureCount:
        prev.waterFeatureCount > 0 ? prev.waterFeatureCount : 5,
      radiusMeters: prev.radiusMeters,
      sectorWide: false,
    }));

    setSimulationNotice(
      `Simulating Cooling on "${hotspot.name}" (${hotspot.peakTempF.toFixed(
        1
      )}°F baseline)`
    );
    setTimeout(() => {
      setSimulationNotice(null);
    }, 4500);
  };

  // Triggered when user clicks "AI Audit" on any Hotspot card
  const handleAuditHotspot = (hotspot: Hotspot) => {
    setSelectedHotspot(hotspot);
    setTargetHotspot(hotspot);
    setLeftTab("analyze");
    setAuditTriggerCount((prev) => prev + 1);
  };

  // Triggered when user clicks "Apply Prescription to 3D Simulator" inside AnalysisReport
  const handleApplyAiPrescription = (prescription: {
    treeCount: number;
    coolRoofPct: number;
    waterFeatureCount: number;
  }) => {
    setSimConfig((prev) => ({
      ...prev,
      treeCount: prescription.treeCount,
      coolRoofPct: prescription.coolRoofPct,
      waterFeatureCount: prescription.waterFeatureCount,
      sectorWide: false,
    }));
    setIsBaselinePreview(false);
    setLeftTab("simulate");

    setSimulationNotice(
      `Applied Gemini AI Prescription (${prescription.treeCount} trees, ${prescription.coolRoofPct}% cool roofs, ${prescription.waterFeatureCount} bioswales)`
    );
    setTimeout(() => {
      setSimulationNotice(null);
    }, 4500);
  };

  // Decide whether CoreMap renders baseline thermalData or simulated modifiedGeoJSON
  const displayedThermalData =
    hasActiveInterventions && !isBaselinePreview && simulationResult
      ? simulationResult.modifiedGeoJSON
      : thermalData;

  // Geodesic Bio-Emerald circle overlay on the map when Simulator is open or active (and not sector-wide)
  const simulationZoneOverlay = useMemo(() => {
    if (simConfig.sectorWide) return null;
    if (leftTab !== "simulate" && !hasActiveInterventions) return null;
    return {
      center: simulationTargetCoords,
      radiusMeters: simConfig.radiusMeters,
      active: true,
    };
  }, [
    leftTab,
    hasActiveInterventions,
    simulationTargetCoords,
    simConfig.radiusMeters,
    simConfig.sectorWide,
  ]);

  // Build live telemetry context for Groq Chat Advisor
  const liveMapContext: MapContextPayload = useMemo(
    () => ({
      cityName: activeCityName,
      parcelCount: thermalData ? thermalData.features.length : 420,
      selectedHotspot: effectiveTargetHotspot
        ? {
            rank: effectiveTargetHotspot.rank,
            name: effectiveTargetHotspot.name,
            peakTempF: effectiveTargetHotspot.peakTempF,
            deltaF: effectiveTargetHotspot.deltaF,
            riskLevel: effectiveTargetHotspot.riskLevel,
            surfaceType: effectiveTargetHotspot.surfaceType,
            primaryCause: effectiveTargetHotspot.primaryCause,
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
      simulation:
        hasActiveInterventions && simulationResult
          ? {
              treeCount: simConfig.treeCount,
              coolRoofPct: simConfig.coolRoofPct,
              waterFeatureCount: simConfig.waterFeatureCount,
              radiusMeters: simConfig.radiusMeters,
              baselinePeakTempF: simulationResult.baselinePeakTempF,
              projectedPeakTempF: simulationResult.projectedPeakTempF,
              temperatureDeltaF: simulationResult.temperatureDeltaF,
              temperatureDeltaC: simulationResult.temperatureDeltaC,
              estimatedCostUSD: simulationResult.estimatedCostUSD,
              annualCo2OffsetMetricTons:
                simulationResult.annualCo2OffsetMetricTons,
              annualEnergySavedMwh: simulationResult.annualEnergySavedMwh,
              heatRiskReductionPct: simulationResult.heatRiskReductionPct,
            }
          : null,
    }),
    [
      activeCityName,
      thermalData,
      effectiveTargetHotspot,
      hotspots,
      hasActiveInterventions,
      simulationResult,
      simConfig,
    ]
  );

  return (
    <div className="w-full h-[100dvh] pt-20 pb-3 px-3 sm:px-4 bg-[#060809] flex flex-col overflow-hidden">
      <div className="flex-1 w-full bezel-shell shadow-[0_30px_100px_rgba(0,0,0,0.9)] relative overflow-hidden">
        <div className="bezel-core w-full h-full overflow-hidden relative">
          {/* Core 3D WebGL Map */}
          <CoreMap
            className="w-full h-full"
            activeCityId={activeCityId}
            customLocation={customLocation}
            thermalData={displayedThermalData}
            hotspots={hotspots}
            selectedHotspot={selectedHotspot}
            onSelectHotspot={handleSelectHotspot}
            showHeatmap={showHeatmap}
            heatmapOpacity={heatmapOpacity}
            showHotspots={showHotspots}
            show3DBuildings={show3DBuildings}
            simulationZone={simulationZoneOverlay}
            showOverlayControls={true}
            isCalculatingThermal={isCalculatingThermal}
            calculatingCityName={activeCityName}
          />

          {/* Top-Center: Geocoding City Search & Benchmark Switcher */}
          <div className="absolute top-3.5 left-1/2 -translate-x-1/2 z-30 w-[94%] sm:w-auto sm:min-w-[520px] max-w-xl">
            <CitySearch
              activeCityId={activeCityId}
              customCityName={
                customLocation
                  ? `${customLocation.name} · ${customLocation.state}`
                  : null
              }
              onSelectPresetCity={handleSelectPresetCity}
              onSelectCustomLocation={handleSelectCustomLocation}
            />
          </div>

          {/* Left Floating Column: 3-Tab Mode Switcher (Layers | Simulate | AI Audit) */}
          <div className="hidden lg:flex flex-col gap-2.5 absolute top-20 left-4 bottom-16 z-20 pointer-events-none">
            {/* Double-Bezel 3-Tab Mode Switcher Bar */}
            <div className="pointer-events-auto w-80 sm:w-[350px] bezel-shell shadow-xl shrink-0">
              <div className="bezel-core bg-[#060809]/95 backdrop-blur-xl p-1 grid grid-cols-3 gap-1">
                <button
                  type="button"
                  onClick={() => setLeftTab("controls")}
                  className={`flex items-center justify-center gap-1 py-2 px-2 rounded-[12px] font-mono text-[10px] uppercase tracking-[0.11em] transition-all ${
                    leftTab === "controls"
                      ? "bg-[#10B981] text-[#060809] font-bold shadow-[0_0_16px_rgba(16,185,129,0.3)]"
                      : "text-[#94A3AB] hover:text-[#F4F6F7] hover:bg-white/[0.04]"
                  }`}
                >
                  <Layers className="w-3 h-3 stroke-[2]" />
                  <span>Layers</span>
                </button>

                <button
                  type="button"
                  onClick={() => setLeftTab("simulate")}
                  className={`flex items-center justify-center gap-1 py-2 px-2 rounded-[12px] font-mono text-[10px] uppercase tracking-[0.11em] transition-all relative ${
                    leftTab === "simulate"
                      ? "bg-[#10B981] text-[#060809] font-bold shadow-[0_0_16px_rgba(16,185,129,0.3)]"
                      : "text-[#94A3AB] hover:text-[#F4F6F7] hover:bg-white/[0.04]"
                  }`}
                >
                  <SlidersHorizontal className="w-3 h-3 stroke-[2]" />
                  <span>Simulate</span>
                  {hasActiveInterventions && leftTab !== "simulate" && (
                    <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping absolute top-1.5 right-1.5" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setLeftTab("analyze")}
                  className={`flex items-center justify-center gap-1 py-2 px-2 rounded-[12px] font-mono text-[10px] uppercase tracking-[0.11em] transition-all ${
                    leftTab === "analyze"
                      ? "bg-[#10B981] text-[#060809] font-bold shadow-[0_0_16px_rgba(16,185,129,0.3)]"
                      : "text-[#94A3AB] hover:text-[#F4F6F7] hover:bg-white/[0.04]"
                  }`}
                >
                  <FileSpreadsheet className="w-3 h-3 stroke-[2]" />
                  <span>AI Audit</span>
                </button>
              </div>
            </div>

            {/* Active Left Panel Content */}
            <div className="pointer-events-auto overflow-y-auto pr-0.5 flex flex-col gap-3">
              {leftTab === "controls" && (
                <>
                  <MapControls
                    showHeatmap={showHeatmap}
                    onToggleHeatmap={setShowHeatmap}
                    heatmapOpacity={heatmapOpacity}
                    onChangeOpacity={setHeatmapOpacity}
                    showHotspots={showHotspots}
                    onToggleHotspots={setShowHotspots}
                    show3DBuildings={show3DBuildings}
                    onToggle3DBuildings={setShow3DBuildings}
                    currentCoords={activeCenter}
                    activeCityName={activeCityName}
                  />

                  {/* Sector Calibration Summary Pill */}
                  <div className="w-72 sm:w-80 bezel-shell shadow-xl">
                    <div className="bezel-core bg-[#060809]/95 backdrop-blur-xl p-3 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#10B981] flex items-center gap-1.5">
                          {isCalculatingThermal ? (
                            <>
                              <Loader2 className="w-2.5 h-2.5 animate-spin" />
                              Calculating Heated Zones...
                            </>
                          ) : (
                            <>
                              <Radio className="w-2.5 h-2.5" />
                              Real OSM + Satellite LST
                            </>
                          )}
                        </span>
                        <span className="font-medium text-[#F4F6F7] truncate block max-w-[175px] mt-0.5">
                          {activeCityName}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#526068] block">
                          Mapped Parcels
                        </span>
                        <span className="font-mono text-xs font-semibold text-[#10B981] tabular-nums">
                          {isCalculatingThermal
                            ? "SYNCING"
                            : `${
                                thermalData ? thermalData.features.length : 0
                              } ways`}
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {leftTab === "simulate" && (
                <SimulationPanel
                  hotspots={hotspots}
                  targetHotspot={effectiveTargetHotspot}
                  onSelectTargetHotspot={(hs) => {
                    setTargetHotspot(hs);
                    if (hs) setSelectedHotspot(hs);
                  }}
                  config={simConfig}
                  onChangeConfig={setSimConfig}
                  simulationResult={simulationResult}
                  isBaselinePreview={isBaselinePreview}
                  onToggleBaselinePreview={setIsBaselinePreview}
                  onResetSimulation={() => {
                    setSimConfig(DEFAULT_INTERVENTION_CONFIG);
                    setIsBaselinePreview(false);
                  }}
                  activeCityName={activeCityName}
                />
              )}

              {leftTab === "analyze" && (
                <AnalysisReport
                  hotspots={hotspots}
                  targetHotspot={effectiveTargetHotspot}
                  onSelectTargetHotspot={(hs) => {
                    setTargetHotspot(hs);
                    if (hs) setSelectedHotspot(hs);
                  }}
                  activeCityName={activeCityName}
                  parcelCount={thermalData ? thermalData.features.length : 420}
                  autoTriggerCount={auditTriggerCount}
                  onApplyRecommendationToSim={handleApplyAiPrescription}
                />
              )}
            </div>
          </div>

          {/* Right Floating Column: Hotspot Ranking & Selected Hotspot Detail Card */}
          <div className="hidden md:flex flex-col gap-3 absolute top-20 right-4 bottom-20 z-20 pointer-events-none overflow-y-auto items-end">
            <div className="pointer-events-auto flex flex-col gap-3">
              <HotspotMarkers
                hotspots={hotspots}
                selectedHotspot={selectedHotspot}
                onSelectHotspot={handleSelectHotspot}
                onSimulateHotspot={handleSimulateHotspot}
                onAuditHotspot={handleAuditHotspot}
              />
            </div>
          </div>

          {/* Active Simulation Floating HUD Pill (Top-Center below CitySearch when interventions active) */}
          {hasActiveInterventions && simulationResult && (
            <div className="hidden sm:flex items-center gap-2.5 absolute top-[72px] left-1/2 -translate-x-1/2 z-20 px-3.5 py-1.5 rounded-full bg-[#060809]/90 border border-[#10B981]/40 backdrop-blur-md shadow-xl">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#F4F6F7]">
                {isBaselinePreview
                  ? "Viewing BEFORE (Baseline)"
                  : `Cooling Active: ${simulationResult.temperatureDeltaF.toFixed(
                      1
                    )}°F (${simulationResult.temperatureDeltaC.toFixed(1)}°C)`}
              </span>
              <button
                type="button"
                onClick={() => setIsBaselinePreview(!isBaselinePreview)}
                className="px-2 py-0.5 rounded-full bg-[#10B981]/15 border border-[#10B981]/35 font-mono text-[9px] uppercase tracking-[0.12em] text-[#10B981] hover:bg-[#10B981]/25 transition-colors"
              >
                {isBaselinePreview ? "Show Cool Map" : "Compare Before"}
              </button>
            </div>
          )}

          {/* Simulation Trigger Notification Toast */}
          {simulationNotice && (
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-40 bezel-shell shadow-2xl animate-in fade-in slide-in-from-bottom-3">
              <div className="bezel-core bg-[#060809]/95 backdrop-blur-xl px-4 py-2.5 flex items-center gap-2.5 border border-[#10B981]/40">
                <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
                <span className="font-mono text-xs text-[#F4F6F7]">
                  {simulationNotice}
                </span>
              </div>
            </div>
          )}

          {/* Phase 4: Slide-Out Streaming AI Chat Advisor Drawer (Groq LPU + Qwen 3.8 Vision) */}
          <ChatAdvisor mapContext={liveMapContext} />
        </div>
      </div>
    </div>
  );
}
