"use client";

import React, { useState, useEffect, useMemo } from "react";
import { CoreMap } from "@/components/map/CoreMap";
import { CitySearch } from "@/components/map/CitySearch";
import { MapControls } from "@/components/map/MapControls";
import { HotspotMarkers } from "@/components/map/HotspotMarkers";
import { SimulationPanel } from "@/components/simulation/SimulationPanel";
import { AnalysisReport } from "@/components/chat/AnalysisReport";
import { ChatAdvisor } from "@/components/chat/ChatAdvisor";
import { HealthSafetyPanel } from "@/components/health/HealthSafetyPanel";
import { CoolRefugeSpot } from "@/lib/health-advisor";
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
  HeartPulse,
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
  const [focusedRefuge, setFocusedRefuge] = useState<CoolRefugeSpot | null>(
    null
  );
  const [isCalculatingThermal, setIsCalculatingThermal] =
    useState<boolean>(true);

  // Left Sidebar Tab State: "controls" (Hotspots) | "health" (Personal Leave-Home & Health Guide) | "simulate" (Cooling Sim) | "analyze" (AI Audit)
  const [leftTab, setLeftTab] = useState<
    "controls" | "health" | "simulate" | "analyze"
  >("controls");
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
  const [pendingDeepLink, setPendingDeepLink] = useState<{
    hotspotId?: string;
    trees?: number;
    roofs?: number;
    water?: number;
    radius?: number;
  } | null>(null);

  // Hydrate URL query parameters (?city=...&tab=...&hotspot=...&trees=...&roofs=...&water=...) or last active city on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const cityParam = params.get("city")?.toLowerCase();
    const tabParam = params.get("tab")?.toLowerCase();
    const hotspotParam = params.get("hotspot");
    const treesParam = params.get("trees");
    const roofsParam = params.get("roofs");
    const waterParam = params.get("water");
    const radiusParam = params.get("radius");

    if (cityParam && SUPPORTED_CITIES[cityParam]) {
      setActiveCityId(cityParam);
    } else {
      try {
        const savedCity = localStorage.getItem("heatshield_active_city");
        if (savedCity && SUPPORTED_CITIES[savedCity]) {
          setActiveCityId(savedCity);
        }
      } catch {
        // Ignore storage errors
      }
    }

    if (
      tabParam === "controls" ||
      tabParam === "health" ||
      tabParam === "simulate" ||
      tabParam === "analyze"
    ) {
      setLeftTab(tabParam);
    } else if (treesParam || roofsParam || waterParam) {
      setLeftTab("simulate");
    }

    if (hotspotParam || treesParam || roofsParam || waterParam) {
      setPendingDeepLink({
        hotspotId: hotspotParam || undefined,
        trees: treesParam ? parseInt(treesParam, 10) : undefined,
        roofs: roofsParam ? parseInt(roofsParam, 10) : undefined,
        water: waterParam ? parseInt(waterParam, 10) : undefined,
        radius: radiusParam ? parseInt(radiusParam, 10) : undefined,
      });
    }
  }, []);

  // Persist active benchmark city to localStorage so /dashboard stays synced
  useEffect(() => {
    if (customLocation) return;
    try {
      localStorage.setItem("heatshield_active_city", activeCityId);
    } catch {
      // Ignore storage errors
    }
  }, [activeCityId, customLocation]);

  useEffect(() => {
    let isMounted = true;

    async function updateThermalPipeline() {
      setIsCalculatingThermal(true);
      setSelectedHotspot(null);
      setTargetHotspot(null);
      setFocusedRefuge(null);
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
          const [data] = await Promise.all([
            loadCityThermalData(activeCityId),
            new Promise((resolve) => setTimeout(resolve, 500)),
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

  // Apply deep-linked hotspot or shared simulation parameters once hotspots are loaded
  useEffect(() => {
    if (!pendingDeepLink || hotspots.length === 0 || isCalculatingThermal) {
      return;
    }

    let matchedSpot = hotspots[0];
    if (pendingDeepLink.hotspotId) {
      const found = hotspots.find(
        (h) =>
          h.id === pendingDeepLink.hotspotId ||
          String(h.rank) === pendingDeepLink.hotspotId
      );
      if (found) matchedSpot = found;
    }

    setSelectedHotspot(matchedSpot);
    setTargetHotspot(matchedSpot);

    const hasCustomSimParams =
      (pendingDeepLink.trees && pendingDeepLink.trees > 0) ||
      (pendingDeepLink.roofs && pendingDeepLink.roofs > 0) ||
      (pendingDeepLink.water && pendingDeepLink.water > 0);

    if (hasCustomSimParams) {
      setTimeout(() => {
        setSimConfig({
          treeCount: pendingDeepLink.trees || 0,
          coolRoofPct: pendingDeepLink.roofs || 0,
          waterFeatureCount: pendingDeepLink.water || 0,
          radiusMeters: pendingDeepLink.radius || 600,
          sectorWide: false,
        });
      }, 250);
    } else if (leftTab === "simulate") {
      // Trigger default simulation when arriving from Dashboard "Simulate" button
      setTimeout(() => {
        setSimConfig((prev) => ({
          treeCount: prev.treeCount > 0 ? prev.treeCount : 900,
          coolRoofPct: prev.coolRoofPct > 0 ? prev.coolRoofPct : 55,
          waterFeatureCount:
            prev.waterFeatureCount > 0 ? prev.waterFeatureCount : 6,
          radiusMeters: prev.radiusMeters,
          sectorWide: false,
        }));
      }, 250);
    }

    setPendingDeepLink(null);
  }, [pendingDeepLink, hotspots, isCalculatingThermal, leftTab]);

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

  const simulationResult = useMemo(() => {
    if (!thermalData) return null;
    return runCoolingSimulation(
      thermalData,
      simulationTargetCoords,
      simConfig
    );
  }, [thermalData, simulationTargetCoords, simConfig]);

  useEffect(() => {
    if (!simulationResult || !hasActiveInterventions) return;
    try {
      const payload = {
        timestamp: new Date().toISOString(),
        cityId: activeCityId,
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
      // Ignore storage quota errors
    }
  }, [
    simulationResult,
    hasActiveInterventions,
    activeCityId,
    activeCityName,
    effectiveTargetHotspot,
    simConfig,
  ]);

  const handleSimulateHotspot = (hotspot: Hotspot) => {
    setSelectedHotspot(hotspot);
    setTargetHotspot(hotspot);
    setLeftTab("simulate");
    setIsBaselinePreview(false);

    // Briefly show baseline red hotspot for 300ms while camera centers, then trigger smooth cooling transition
    setTimeout(() => {
      setSimConfig((prev) => ({
        treeCount: prev.treeCount > 0 ? prev.treeCount : 900,
        coolRoofPct: prev.coolRoofPct > 0 ? prev.coolRoofPct : 55,
        waterFeatureCount:
          prev.waterFeatureCount > 0 ? prev.waterFeatureCount : 6,
        radiusMeters: prev.radiusMeters,
        sectorWide: false,
      }));
    }, 300);

    setSimulationNotice(
      `Simulating cooling on "${hotspot.name}" (${hotspot.peakTempF.toFixed(
        1
      )}°F baseline)`
    );
    setTimeout(() => {
      setSimulationNotice(null);
    }, 4500);
  };

  const handleAuditHotspot = (hotspot: Hotspot) => {
    setSelectedHotspot(hotspot);
    setTargetHotspot(hotspot);
    setLeftTab("analyze");
    setAuditTriggerCount((prev) => prev + 1);
  };

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
      `Applied AI cooling plan (${prescription.treeCount} trees, ${prescription.coolRoofPct}% cool roofs, ${prescription.waterFeatureCount} water basins)`
    );
    setTimeout(() => {
      setSimulationNotice(null);
    }, 4500);
  };

  const displayedThermalData =
    hasActiveInterventions && !isBaselinePreview && simulationResult
      ? simulationResult.modifiedGeoJSON
      : thermalData;

  const simulationZoneOverlay = useMemo(() => {
    const activeCoolingDelta =
      hasActiveInterventions && !isBaselinePreview && simulationResult
        ? simulationResult.temperatureDeltaF
        : 0;

    if (simConfig.sectorWide) {
      if (!hasActiveInterventions) return null;
      return {
        center: simulationTargetCoords,
        radiusMeters: 2200,
        active: true,
        coolingDeltaF: activeCoolingDelta,
        baselinePeakTempF: simulationResult?.baselinePeakTempF,
        projectedPeakTempF: simulationResult?.projectedPeakTempF,
        zoneName: `${activeCityName} Metro Sector`,
      };
    }
    if (leftTab !== "simulate" && !hasActiveInterventions) return null;
    return {
      center: simulationTargetCoords,
      radiusMeters: simConfig.radiusMeters,
      active: true,
      coolingDeltaF: activeCoolingDelta,
      baselinePeakTempF:
        simulationResult?.baselinePeakTempF ||
        effectiveTargetHotspot?.peakTempF,
      projectedPeakTempF: simulationResult?.projectedPeakTempF,
      zoneName: effectiveTargetHotspot?.name || `${activeCityName} Core`,
    };
  }, [
    leftTab,
    hasActiveInterventions,
    isBaselinePreview,
    simulationResult,
    simulationTargetCoords,
    simConfig.radiusMeters,
    simConfig.sectorWide,
    effectiveTargetHotspot,
    activeCityName,
  ]);

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
    <div className="w-full h-[calc(100dvh-3.5rem)] bg-[#171614] flex flex-col overflow-hidden">
      {/* Dedicated Top Control Bar (Zero Overlap with Map or Sidebar) */}
      <div className="bg-[#1B1917] border-b border-[#2F2C28] px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0 z-30">
        <CitySearch
          activeCityId={activeCityId}
          customCityName={
            customLocation
              ? `${customLocation.name}, ${customLocation.state}`
              : null
          }
          onSelectPresetCity={handleSelectPresetCity}
          onSelectCustomLocation={handleSelectCustomLocation}
        />

        {/* Right Status & Active Simulation Bar */}
        <div className="hidden xl:flex items-center gap-3">
          {hasActiveInterventions && simulationResult && (
            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-[#5E9A7B]/15 border border-[#5E9A7B]/40">
              <span className="w-2 h-2 rounded-full bg-[#78B093]" />
              <span className="text-xs font-medium text-[#F5F3EF]">
                {isBaselinePreview
                  ? "Viewing Before (Baseline)"
                  : `Cooling Active: ${simulationResult.temperatureDeltaF.toFixed(
                      1
                    )}°F (${simulationResult.temperatureDeltaC.toFixed(1)}°C)`}
              </span>
              <button
                type="button"
                onClick={() => setIsBaselinePreview(!isBaselinePreview)}
                className="px-2.5 py-0.5 rounded-lg bg-[#5E9A7B] text-[#141311] text-xs font-semibold hover:bg-[#6CA889] transition-colors"
              >
                {isBaselinePreview ? "Show Cooled" : "Compare Before"}
              </button>
            </div>
          )}

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#141311] border border-[#2C2925] text-xs">
            {isCalculatingThermal ? (
              <>
                <Loader2 className="w-3.5 h-3.5 text-[#78B093] animate-spin" />
                <span className="text-[#B8B1A7]">Mapping heat zones...</span>
              </>
            ) : (
              <>
                <Radio className="w-3.5 h-3.5 text-[#78B093]" />
                <span className="text-[#B8B1A7]">{activeCityName}:</span>
                <span className="font-mono font-semibold text-[#78B093] tabular-nums">
                  {thermalData ? thermalData.features.length : 0} OSM ways
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Split-Screen Workspace (Docked Left Sidebar + Unobstructed Right 3D Map) */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Docked Left Sidebar */}
        <aside className="w-full md:w-[390px] lg:w-[430px] shrink-0 bg-[#1B1917] border-b md:border-b-0 md:border-r border-[#2F2C28] flex flex-col h-[46%] md:h-full z-20">
          {/* 4-Tab Segmented Switcher */}
          <div className="p-3 border-b border-[#2F2C28] shrink-0">
            <div className="bg-[#141311] border border-[#2C2925] rounded-xl p-1 grid grid-cols-4 gap-1">
              <button
                type="button"
                onClick={() => setLeftTab("controls")}
                className={`flex items-center justify-center gap-1 py-2 px-1.5 rounded-lg text-xs font-medium transition-colors ${
                  leftTab === "controls"
                    ? "bg-[#5E9A7B] text-[#141311] font-semibold"
                    : "text-[#B8B1A7] hover:text-[#F5F3EF] hover:bg-white/[0.04]"
                }`}
              >
                <Layers className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Hotspots</span>
              </button>

              <button
                type="button"
                onClick={() => setLeftTab("health")}
                className={`flex items-center justify-center gap-1 py-2 px-1.5 rounded-lg text-xs font-medium transition-colors ${
                  leftTab === "health"
                    ? "bg-[#5E9A7B] text-[#141311] font-semibold"
                    : "text-[#B8B1A7] hover:text-[#F5F3EF] hover:bg-white/[0.04]"
                }`}
              >
                <HeartPulse className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Health</span>
              </button>

              <button
                type="button"
                onClick={() => setLeftTab("simulate")}
                className={`flex items-center justify-center gap-1 py-2 px-1.5 rounded-lg text-xs font-medium transition-colors relative ${
                  leftTab === "simulate"
                    ? "bg-[#5E9A7B] text-[#141311] font-semibold"
                    : "text-[#B8B1A7] hover:text-[#F5F3EF] hover:bg-white/[0.04]"
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Simulator</span>
                {hasActiveInterventions && leftTab !== "simulate" && (
                  <span className="w-2 h-2 rounded-full bg-[#78B093] absolute top-1.5 right-1" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setLeftTab("analyze")}
                className={`flex items-center justify-center gap-1 py-2 px-1.5 rounded-lg text-xs font-medium transition-colors ${
                  leftTab === "analyze"
                    ? "bg-[#5E9A7B] text-[#141311] font-semibold"
                    : "text-[#B8B1A7] hover:text-[#F5F3EF] hover:bg-white/[0.04]"
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">AI Audit</span>
              </button>
            </div>
          </div>

          {/* Scrollable Sidebar Body */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5">
            {leftTab === "controls" && (
              <>
                <HotspotMarkers
                  hotspots={hotspots}
                  selectedHotspot={selectedHotspot}
                  onSelectHotspot={handleSelectHotspot}
                  onSimulateHotspot={handleSimulateHotspot}
                  onAuditHotspot={handleAuditHotspot}
                  onOpenHealthGuide={(hs) => {
                    setSelectedHotspot(hs);
                    setTargetHotspot(hs);
                    setLeftTab("health");
                  }}
                  activeCoolingDropF={
                    hasActiveInterventions &&
                    !isBaselinePreview &&
                    simulationResult
                      ? Math.abs(simulationResult.temperatureDeltaF)
                      : 0
                  }
                />

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
              </>
            )}

            {leftTab === "health" && (
              <HealthSafetyPanel
                hotspots={hotspots}
                targetHotspot={effectiveTargetHotspot}
                onSelectTargetHotspot={(hs) => {
                  setTargetHotspot(hs);
                  setSelectedHotspot(hs);
                }}
                thermalData={thermalData}
                activeCityName={activeCityName}
                activeCenter={activeCenter}
                activeCoolingDropF={
                  hasActiveInterventions &&
                  !isBaselinePreview &&
                  simulationResult
                    ? Math.abs(simulationResult.temperatureDeltaF)
                    : 0
                }
                onOpenSimulator={() => {
                  if (effectiveTargetHotspot) {
                    handleSimulateHotspot(effectiveTargetHotspot);
                  } else {
                    setLeftTab("simulate");
                  }
                }}
                onFlyToCoolRefuge={(refuge) => {
                  setFocusedRefuge(refuge);
                  setSimulationNotice(
                    `Flying to cool refuge: "${refuge.name}" (${refuge.temperatureF}°F)`
                  );
                  setTimeout(() => {
                    setSimulationNotice(null);
                  }, 4000);
                }}
              />
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
                activeCityId={activeCityId}
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
        </aside>

        {/* Right Area: Unobstructed 3D Map Canvas */}
        <div className="flex-1 relative h-[54%] md:h-full overflow-hidden">
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
            focusedRefuge={focusedRefuge}
          />

          {/* Simulation Notification Toast */}
          {simulationNotice && (
            <div className="absolute bottom-16 left-4 z-30 rounded-xl bg-[#211F1C]/95 border border-[#5E9A7B]/50 px-4 py-2.5 shadow-xl flex items-center gap-2.5 max-w-md pointer-events-none">
              <CheckCircle2 className="w-4 h-4 text-[#78B093] shrink-0" />
              <span className="text-xs font-medium text-[#F5F3EF]">
                {simulationNotice}
              </span>
            </div>
          )}

          {/* Slide-Out Streaming AI Chat Advisor Drawer */}
          <ChatAdvisor mapContext={liveMapContext} />
        </div>
      </div>
    </div>
  );
}
