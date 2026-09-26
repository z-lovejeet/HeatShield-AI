"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Compass, RotateCcw } from "lucide-react";
import {
  ThermalFeatureCollection,
  loadCityThermalData,
  fetchLiveRealThermalData,
  SUPPORTED_CITIES,
} from "@/lib/thermal-data";
import { Hotspot, detectTopHotspots } from "@/lib/hotspots";
import { createGeodesicCircleGeoJSON } from "@/lib/simulation";

const DEFAULT_CENTER: [number, number] = [-122.6742, 45.5202];
const DEFAULT_ZOOM = 11.8;

export interface CoreMapProps {
  initialCenter?: [number, number];
  initialZoom?: number;
  activeCityId?: string;
  customLocation?: {
    id: string;
    name: string;
    state: string;
    center: [number, number];
  } | null;
  thermalData?: ThermalFeatureCollection | null;
  hotspots?: Hotspot[] | null;
  selectedHotspot?: Hotspot | null;
  onSelectHotspot?: (hotspot: Hotspot | null) => void;
  showHeatmap?: boolean;
  heatmapOpacity?: number;
  showHotspots?: boolean;
  show3DBuildings?: boolean;
  simulationZone?: {
    center: [number, number];
    radiusMeters: number;
    active: boolean;
  } | null;
  onMapLoaded?: (map: mapboxgl.Map) => void;
  onCoordinatesChange?: (coords: {
    lng: number;
    lat: number;
    zoom: number;
    pitch: number;
  }) => void;
  className?: string;
  showOverlayControls?: boolean;
  standaloneMode?: boolean;
  isCalculatingThermal?: boolean;
  calculatingCityName?: string;
}

const CALCULATION_STAGES = [
  "Querying OpenStreetMap Overpass land-use & asphalt ways...",
  "Fetching Open-Meteo solar irradiance & wind telemetry...",
  "Computing 450m spatial energy balance & UHI hotspots...",
];

export function CoreMap({
  initialCenter = DEFAULT_CENTER,
  initialZoom = DEFAULT_ZOOM,
  activeCityId: propCityId,
  customLocation = null,
  thermalData: externalThermalData = null,
  hotspots: externalHotspots = null,
  selectedHotspot = null,
  onSelectHotspot,
  showHeatmap = true,
  heatmapOpacity = 0.85,
  showHotspots = true,
  show3DBuildings = true,
  simulationZone = null,
  onMapLoaded,
  onCoordinatesChange,
  className = "w-full h-full",
  showOverlayControls = true,
  standaloneMode = false,
  isCalculatingThermal = false,
  calculatingCityName,
}: CoreMapProps) {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const popupRef = useRef<mapboxgl.Popup | null>(null);

  // Refs for callbacks & latest data to prevent map teardown on re-renders
  const onMapLoadedRef = useRef(onMapLoaded);
  const onCoordinatesChangeRef = useRef(onCoordinatesChange);
  const onSelectHotspotRef = useRef(onSelectHotspot);
  onMapLoadedRef.current = onMapLoaded;
  onCoordinatesChangeRef.current = onCoordinatesChange;
  onSelectHotspotRef.current = onSelectHotspot;

  const [isLoaded, setIsLoaded] = useState(false);
  const [internalCityId, setInternalCityId] = useState<string>("portland");
  const [internalThermalData, setInternalThermalData] =
    useState<ThermalFeatureCollection | null>(null);
  const [internalHotspots, setInternalHotspots] = useState<Hotspot[]>([]);
  const [internalCalculating, setInternalCalculating] = useState<boolean>(false);
  const [calcStageIndex, setCalcStageIndex] = useState<number>(0);
  const [coordinates, setCoordinates] = useState({
    lng: initialCenter[0],
    lat: initialCenter[1],
    zoom: initialZoom,
    pitch: 48,
  });

  const activeCityId = propCityId || internalCityId;
  const activeData = externalThermalData || internalThermalData;
  const activeHotspots = externalHotspots || internalHotspots;
  const activeDataRef = useRef<ThermalFeatureCollection | null>(null);
  activeDataRef.current = activeData;

  const showCalculationOverlay =
    isLoaded && (isCalculatingThermal || internalCalculating);

  // Cycle through the 3 calculation telemetry stages while calculating
  useEffect(() => {
    if (!showCalculationOverlay) {
      setCalcStageIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setCalcStageIndex((prev) => (prev < 2 ? prev + 1 : prev));
    }, 650);
    return () => clearInterval(interval);
  }, [showCalculationOverlay]);

  // Load thermal data if not provided externally (e.g. on Landing Page or standalone)
  useEffect(() => {
    if (externalThermalData) return;

    let isMounted = true;
    async function loadData() {
      setInternalCalculating(true);
      try {
        if (customLocation) {
          const res = await fetchLiveRealThermalData(
            customLocation.center,
            "heatwave"
          );
          if (isMounted) {
            setInternalThermalData(res.data);
            setInternalHotspots(detectTopHotspots(res.data, 5));
          }
        } else {
          const data = await loadCityThermalData(activeCityId);
          if (isMounted) {
            setInternalThermalData(data);
            setInternalHotspots(detectTopHotspots(data, 5));
          }
        }
      } finally {
        if (isMounted) {
          setInternalCalculating(false);
        }
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [activeCityId, customLocation, externalThermalData]);

  // Initialize Mapbox WebGL instance ONCE on mount
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) {
      console.error("Mapbox token missing: NEXT_PUBLIC_MAPBOX_TOKEN");
      return;
    }

    mapboxgl.accessToken = token;

    const mapInstance = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: initialCenter,
      zoom: initialZoom,
      pitch: 48,
      bearing: -16,
      attributionControl: true,
      antialias: true,
    });

    map.current = mapInstance;

    mapInstance.addControl(
      new mapboxgl.NavigationControl({
        visualizePitch: true,
      }),
      "bottom-right"
    );

    mapInstance.on("load", () => {
      const layers = mapInstance.getStyle()?.layers;
      const labelLayerId = layers?.find(
        (layer) => layer.type === "symbol" && layer.layout?.["text-field"]
      )?.id;

      // 1. 3D Building Extrusions
      if (!mapInstance.getLayer("3d-buildings")) {
        mapInstance.addLayer(
          {
            id: "3d-buildings",
            source: "composite",
            "source-layer": "building",
            filter: ["==", "extrude", "true"],
            type: "fill-extrusion",
            minzoom: 11,
            paint: {
              "fill-extrusion-color": "#10161A",
              "fill-extrusion-height": [
                "interpolate",
                ["linear"],
                ["zoom"],
                11,
                0,
                13,
                ["get", "height"],
              ],
              "fill-extrusion-base": [
                "interpolate",
                ["linear"],
                ["zoom"],
                11,
                0,
                13,
                ["get", "min_height"],
              ],
              "fill-extrusion-opacity": 0.72,
            },
          },
          labelLayerId
        );
      }

      // 2. GeoJSON Source for Satellite & OSM Thermal Points
      mapInstance.addSource("thermal-source", {
        type: "geojson",
        data: activeDataRef.current || {
          type: "FeatureCollection",
          features: [],
        },
      });

      // 3. GPU WebGL Thermal Heatmap Layer (Visible across all zoom levels up to Z16)
      mapInstance.addLayer(
        {
          id: "thermal-heatmap",
          type: "heatmap",
          source: "thermal-source",
          maxzoom: 16,
          paint: {
            "heatmap-weight": [
              "interpolate",
              ["linear"],
              ["get", "deltaF"],
              0,
              0.15,
              12,
              0.6,
              28,
              1.0,
            ],
            "heatmap-intensity": [
              "interpolate",
              ["linear"],
              ["zoom"],
              9,
              1.1,
              12,
              1.9,
              15,
              3.0,
            ],
            "heatmap-color": [
              "interpolate",
              ["linear"],
              ["heatmap-density"],
              0,
              "rgba(6, 8, 9, 0)",
              0.12,
              "rgba(56, 189, 248, 0.38)", // Cool Sky Blue
              0.3,
              "rgba(52, 211, 153, 0.58)", // Bio-Emerald
              0.52,
              "rgba(250, 204, 21, 0.78)", // Solar Amber
              0.75,
              "rgba(249, 115, 22, 0.88)", // Thermal Orange
              1.0,
              "rgba(239, 68, 68, 0.96)", // Critical Crimson
            ],
            "heatmap-radius": [
              "interpolate",
              ["linear"],
              ["zoom"],
              9,
              22,
              12,
              38,
              15,
              60,
            ],
            "heatmap-opacity": 0.85,
          },
        },
        "3d-buildings"
      );

      // 4. Street-Level Parcel Thermal Nodes (Visible from Z12.5+)
      mapInstance.addLayer(
        {
          id: "thermal-points",
          type: "circle",
          source: "thermal-source",
          minzoom: 12.5,
          paint: {
            "circle-radius": [
              "interpolate",
              ["linear"],
              ["zoom"],
              12.5,
              3,
              15,
              6.5,
              17,
              11,
            ],
            "circle-color": [
              "interpolate",
              ["linear"],
              ["get", "temperatureF"],
              74,
              "#38BDF8",
              84,
              "#34D399",
              96,
              "#FACC15",
              105,
              "#F97316",
              115,
              "#EF4444",
            ],
            "circle-stroke-width": 1.2,
            "circle-stroke-color": "#060809",
            "circle-opacity": [
              "interpolate",
              ["linear"],
              ["zoom"],
              12.5,
              0.25,
              14,
              0.85,
            ],
          },
        },
        labelLayerId
      );

      // 5. GeoJSON Source & Layers for Bio-Emerald Cooling Simulation Radius Ring
      mapInstance.addSource("simulation-zone-source", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [],
        },
      });

      mapInstance.addLayer(
        {
          id: "simulation-zone-fill",
          type: "fill",
          source: "simulation-zone-source",
          paint: {
            "fill-color": "#10B981",
            "fill-opacity": 0.11,
          },
        },
        labelLayerId
      );

      mapInstance.addLayer(
        {
          id: "simulation-zone-outline",
          type: "line",
          source: "simulation-zone-source",
          paint: {
            "line-color": "#10B981",
            "line-width": 2,
            "line-dasharray": [2, 2],
            "line-opacity": 0.85,
          },
        },
        labelLayerId
      );

      // Click on any individual thermal point to inspect parcel telemetry
      mapInstance.on("click", "thermal-points", (e) => {
        if (!e.features || e.features.length === 0) return;
        const feature = e.features[0];
        const props = feature.properties;
        const coords = (feature.geometry as any).coordinates.slice() as [
          number,
          number
        ];

        if (popupRef.current) popupRef.current.remove();
        popupRef.current = new mapboxgl.Popup({
          closeButton: true,
          closeOnClick: true,
          maxWidth: "280px",
        })
          .setLngLat(coords)
          .setHTML(
            `<div style="font-family: var(--font-jakarta), sans-serif; padding: 2px;">
              <div style="font-family: var(--font-jetbrains-mono), monospace; font-size: 9px; text-transform: uppercase; letter-spacing: 0.14em; color: #10B981; margin-bottom: 4px;">
                ${props?.severity || "HIGH"} THERMAL NODE • ${props?.censusTract || "OSM"}
              </div>
              <div style="font-weight: 700; font-size: 13px; color: #F4F6F7; margin-bottom: 6px;">
                ${props?.areaName || "Urban Surface Parcel"}
              </div>
              <div style="display: flex; align-items: baseline; justify-content: space-between; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 6px;">
                <span style="font-family: var(--font-space-grotesk), sans-serif; font-size: 18px; font-weight: 700; color: #F4F6F7;">
                  ${Number(props?.temperatureF).toFixed(1)}°F
                </span>
                <span style="font-family: var(--font-jetbrains-mono), monospace; font-size: 11px; color: #10B981;">
                  +${Number(props?.deltaF).toFixed(1)}°F UHI
                </span>
              </div>
            </div>`
          )
          .addTo(mapInstance);
      });

      mapInstance.on("mouseenter", "thermal-points", () => {
        mapInstance.getCanvas().style.cursor = "pointer";
      });
      mapInstance.on("mouseleave", "thermal-points", () => {
        mapInstance.getCanvas().style.cursor = "";
      });

      setIsLoaded(true);
      if (onMapLoadedRef.current) {
        onMapLoadedRef.current(mapInstance);
      }
    });

    mapInstance.on("move", () => {
      const center = mapInstance.getCenter();
      const current = {
        lng: Number(center.lng.toFixed(4)),
        lat: Number(center.lat.toFixed(4)),
        zoom: Number(mapInstance.getZoom().toFixed(2)),
        pitch: Math.round(mapInstance.getPitch()),
      };
      setCoordinates(current);
      if (onCoordinatesChangeRef.current) {
        onCoordinatesChangeRef.current(current);
      }
    });

    const resizeObserver = new ResizeObserver(() => {
      mapInstance.resize();
    });
    resizeObserver.observe(mapContainer.current);

    return () => {
      resizeObserver.disconnect();
      markersRef.current.forEach((m) => m.remove());
      if (popupRef.current) popupRef.current.remove();
      mapInstance.remove();
      map.current = null;
    };
    // Empty dependency array ensures Mapbox WebGL instance is NEVER destroyed on state updates
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Push GeoJSON data into 'thermal-source' whenever data changes or map finishes loading
  useEffect(() => {
    if (!map.current || !isLoaded || !activeData) return;
    const source = map.current.getSource(
      "thermal-source"
    ) as mapboxgl.GeoJSONSource | undefined;
    if (source) {
      source.setData(activeData);
    }
  }, [activeData, isLoaded]);

  // Push Bio-Emerald geodesic circle into 'simulation-zone-source' when simulation is active
  useEffect(() => {
    if (!map.current || !isLoaded) return;
    const source = map.current.getSource(
      "simulation-zone-source"
    ) as mapboxgl.GeoJSONSource | undefined;
    if (!source) return;

    if (simulationZone && simulationZone.active) {
      const circleGeoJSON = createGeodesicCircleGeoJSON(
        simulationZone.center,
        simulationZone.radiusMeters
      );
      source.setData(circleGeoJSON);
    } else {
      source.setData({
        type: "FeatureCollection",
        features: [],
      });
    }
  }, [simulationZone, isLoaded]);

  // Sync Heatmap visibility & opacity
  useEffect(() => {
    if (!map.current || !isLoaded) return;
    const mapInstance = map.current;

    if (mapInstance.getLayer("thermal-heatmap")) {
      mapInstance.setLayoutProperty(
        "thermal-heatmap",
        "visibility",
        showHeatmap ? "visible" : "none"
      );
      mapInstance.setPaintProperty(
        "thermal-heatmap",
        "heatmap-opacity",
        heatmapOpacity
      );
    }

    if (mapInstance.getLayer("thermal-points")) {
      mapInstance.setLayoutProperty(
        "thermal-points",
        "visibility",
        showHeatmap ? "visible" : "none"
      );
    }
  }, [showHeatmap, heatmapOpacity, isLoaded]);

  // Sync 3D Buildings visibility
  useEffect(() => {
    if (!map.current || !isLoaded) return;
    if (map.current.getLayer("3d-buildings")) {
      map.current.setLayoutProperty(
        "3d-buildings",
        "visibility",
        show3DBuildings ? "visible" : "none"
      );
    }
  }, [show3DBuildings, isLoaded]);

  // Fly to selected city or custom geocoded location
  useEffect(() => {
    if (!map.current || !isLoaded) return;

    if (customLocation) {
      map.current.flyTo({
        center: customLocation.center,
        zoom: 12.3,
        pitch: 50,
        bearing: -12,
        duration: 2200,
        essential: true,
      });
    } else if (SUPPORTED_CITIES[activeCityId]) {
      const city = SUPPORTED_CITIES[activeCityId];
      map.current.flyTo({
        center: city.center,
        zoom: city.zoom,
        pitch: city.pitch,
        bearing: city.bearing,
        duration: 2200,
        essential: true,
      });
    }
  }, [activeCityId, customLocation, isLoaded]);

  // Fly to selected hotspot when user selects one from the sidebar or clicks a marker
  useEffect(() => {
    if (!map.current || !isLoaded || !selectedHotspot) return;

    map.current.flyTo({
      center: selectedHotspot.coordinates,
      zoom: Math.max(map.current.getZoom(), 13.4),
      pitch: 54,
      duration: 1500,
      essential: true,
    });
  }, [selectedHotspot, isLoaded]);

  // Render pulsing tactical Mapbox DOM markers for top hotspots
  useEffect(() => {
    if (!map.current || !isLoaded) return;
    const mapInstance = map.current;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    if (!showHotspots || !activeHotspots || activeHotspots.length === 0) return;

    activeHotspots.forEach((hotspot) => {
      const el = document.createElement("div");
      el.className =
        "group cursor-pointer relative flex items-center justify-center";
      el.style.width = "38px";
      el.style.height = "38px";

      const isCurrentSelected = selectedHotspot?.id === hotspot.id;

      el.innerHTML = `
        <div class="absolute inset-0 rounded-full ${
          isCurrentSelected
            ? "bg-[#10B981]/45 animate-ping"
            : "bg-[#EF4444]/35 animate-pulse"
        }"></div>
        <div class="relative w-7 h-7 rounded-full flex items-center justify-center font-mono text-[10px] font-bold shadow-lg transition-transform transform group-hover:scale-110 border ${
          isCurrentSelected
            ? "bg-[#10B981] text-[#060809] border-white shadow-[0_0_18px_rgba(16,185,129,0.7)]"
            : "bg-[#060809] text-[#F4F6F7] border-[#EF4444] shadow-[0_0_14px_rgba(239,68,68,0.6)]"
        }">
          #${hotspot.rank}
        </div>
      `;

      el.addEventListener("click", (e) => {
        e.stopPropagation();
        if (onSelectHotspotRef.current) {
          onSelectHotspotRef.current(hotspot);
        }

        // Also open a tactical popup directly over the marker
        if (popupRef.current) popupRef.current.remove();
        popupRef.current = new mapboxgl.Popup({
          closeButton: true,
          closeOnClick: true,
          offset: 18,
          maxWidth: "290px",
        })
          .setLngLat(hotspot.coordinates)
          .setHTML(
            `<div style="font-family: var(--font-jakarta), sans-serif; padding: 2px;">
              <div style="font-family: var(--font-jetbrains-mono), monospace; font-size: 9px; text-transform: uppercase; letter-spacing: 0.14em; color: #10B981; margin-bottom: 4px;">
                HOTSPOT #${hotspot.rank} • ${hotspot.riskLevel.toUpperCase()} RISK
              </div>
              <div style="font-weight: 700; font-size: 13px; color: #F4F6F7; margin-bottom: 4px;">
                ${hotspot.name}
              </div>
              <div style="font-size: 11px; color: #94A3AB; margin-bottom: 8px; line-height: 1.35;">
                ${hotspot.primaryCause}
              </div>
              <div style="display: flex; align-items: baseline; justify-content: space-between; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 6px;">
                <span style="font-family: var(--font-space-grotesk), sans-serif; font-size: 18px; font-weight: 700; color: #F4F6F7;">
                  ${hotspot.peakTempF.toFixed(1)}°F
                </span>
                <span style="font-family: var(--font-jetbrains-mono), monospace; font-size: 11px; color: #10B981;">
                  +${hotspot.deltaF.toFixed(1)}°F UHI
                </span>
              </div>
            </div>`
          )
          .addTo(mapInstance);
      });

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat(hotspot.coordinates)
        .addTo(mapInstance);

      markersRef.current.push(marker);
    });
  }, [activeHotspots, showHotspots, selectedHotspot, isLoaded]);

  const handleResetCamera = useCallback(() => {
    if (!map.current) return;
    const city = SUPPORTED_CITIES[activeCityId] || SUPPORTED_CITIES.portland;
    map.current.flyTo({
      center: customLocation ? customLocation.center : city.center,
      zoom: customLocation ? 12.2 : city.zoom,
      pitch: customLocation ? 50 : city.pitch,
      bearing: customLocation ? -12 : city.bearing,
      duration: 1800,
      essential: true,
    });
  }, [activeCityId, customLocation]);

  const isStandalone = !propCityId && !externalThermalData;
  const currentMeta =
    SUPPORTED_CITIES[activeCityId] || SUPPORTED_CITIES.portland;

  return (
    <div className={`relative overflow-hidden bg-[#060809] ${className}`}>
      {/* Mapbox WebGL Canvas */}
      <div ref={mapContainer} className="w-full h-full" />

      {/* Loading Canvas Shield */}
      {!isLoaded && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#060809]">
          <div className="w-48 h-[2px] bg-white/[0.06] rounded-full overflow-hidden mb-4">
            <div className="w-1/2 h-full bg-[#10B981] animate-pulse rounded-full" />
          </div>
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#94A3AB]">
            Calibrating WebGL Thermal Surface
          </span>
        </div>
      )}

      {/* Tactical Heated-Zone Calculation Overlay (while querying OSM Overpass + Open-Meteo + Physics) */}
      {showCalculationOverlay && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#060809]/55 backdrop-blur-[3px] pointer-events-none transition-opacity duration-300">
          <div className="w-[90%] max-w-md bezel-shell shadow-[0_25px_70px_rgba(0,0,0,0.85)]">
            <div className="bezel-core bg-[#060809]/95 backdrop-blur-xl p-5 border border-[#10B981]/35 flex flex-col gap-3.5">
              {/* Top Status Badge */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#10B981]" />
                  </span>
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#10B981]">
                    Thermal Physics Engine Active
                  </span>
                </div>
                <span className="font-mono text-[10px] text-[#94A3AB] tabular-nums">
                  STEP 0{calcStageIndex + 1} / 03
                </span>
              </div>

              {/* Target Sector Title */}
              <div>
                <h4 className="font-display text-base font-bold text-[#F4F6F7] tracking-tight">
                  Calculating Heated Zones —{" "}
                  <span className="text-[#10B981]">
                    {calculatingCityName ||
                      (customLocation
                        ? `${customLocation.name}, ${customLocation.state}`
                        : `${currentMeta.name}, ${currentMeta.state}`)}
                  </span>
                </h4>
                <p className="text-xs text-[#94A3AB] mt-0.5">
                  Mapping impervious surfaces, solar absorption, and 450m neighbor heat trapping...
                </p>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-1.5 bg-white/[0.07] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#10B981] rounded-full transition-all duration-500 ease-out shadow-[0_0_12px_rgba(16,185,129,0.7)]"
                  style={{
                    width:
                      calcStageIndex === 0
                        ? "36%"
                        : calcStageIndex === 1
                        ? "72%"
                        : "94%",
                  }}
                />
              </div>

              {/* Live Telemetry Step Log */}
              <div className="space-y-1.5 pt-1 border-t border-white/[0.06] font-mono text-[11px]">
                {CALCULATION_STAGES.map((stageText, idx) => {
                  const isDone = idx < calcStageIndex;
                  const isCurrent = idx === calcStageIndex;
                  return (
                    <div
                      key={idx}
                      className={`flex items-center gap-2 transition-colors ${
                        isCurrent
                          ? "text-[#F4F6F7]"
                          : isDone
                          ? "text-[#10B981]"
                          : "text-[#526068]"
                      }`}
                    >
                      <span className="text-[10px] tabular-nums">
                        {isDone ? "[✓]" : isCurrent ? "[►]" : "[·]"}
                      </span>
                      <span className="truncate">{stageText}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Standalone Top-Left City Preset Switcher (for Landing Page Hero Map) */}
      {showOverlayControls && isStandalone && (
        <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-1.5 p-1 rounded-full bg-[#0B0F12]/90 border border-white/[0.08] backdrop-blur-md shadow-2xl">
          {Object.values(SUPPORTED_CITIES).map((city) => {
            const isSelected = activeCityId === city.id;
            return (
              <button
                key={city.id}
                type="button"
                onClick={() => setInternalCityId(city.id)}
                className={`px-3 py-1 rounded-full font-mono text-[11px] transition-all duration-300 whitespace-nowrap ${
                  isSelected
                    ? "bg-[#10B981] text-[#060809] font-semibold shadow-[0_0_16px_rgba(16,185,129,0.3)]"
                    : "text-[#94A3AB] hover:text-[#F4F6F7] hover:bg-white/[0.04]"
                }`}
              >
                {city.id === "portland"
                  ? "Portland · OR"
                  : city.id === "phoenix"
                  ? "Phoenix · AZ"
                  : "NYC · NY"}
              </button>
            );
          })}
          <button
            type="button"
            onClick={handleResetCamera}
            title="Reset 3D Camera View"
            aria-label="Reset 3D Camera View"
            className="p-1.5 rounded-full text-[#94A3AB] hover:text-[#F4F6F7] hover:bg-white/[0.06] transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 stroke-[1.75]" />
          </button>
        </div>
      )}

      {/* HUD Overlays */}
      {showOverlayControls && (
        <>
          {/* Top-Right Quick Reset (on /map) */}
          {!isStandalone && (
            <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetCamera}
                title="Reset 3D Camera View"
                aria-label="Reset 3D Camera View"
                className="p-2 rounded-full bg-[#060809]/90 border border-white/[0.08] text-[#94A3AB] hover:text-[#F4F6F7] hover:bg-white/[0.06] transition-colors backdrop-blur-md shadow-xl"
              >
                <RotateCcw className="w-3.5 h-3.5 stroke-[1.75]" />
              </button>
            </div>
          )}

          {/* Bottom Calibration Scale & Geodetics */}
          <div className="absolute bottom-4 left-4 right-14 z-10 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
            <div className="pointer-events-auto flex items-center gap-3 px-3.5 py-2 rounded-full bg-[#060809]/90 border border-white/[0.08] backdrop-blur-md shadow-xl">
              <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#94A3AB]">
                LST Scale
              </span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-[#94A3AB] tabular-nums">
                  68°F
                </span>
                <div className="h-1.5 w-28 sm:w-36 rounded-full bg-gradient-to-r from-sky-500 via-[#34D399] via-amber-400 to-rose-600 opacity-90" />
                <span className="font-mono text-[10px] text-[#F4F6F7] tabular-nums">
                  {currentMeta.peakSurfaceF}
                </span>
              </div>
            </div>

            <div className="pointer-events-auto hidden md:flex items-center gap-2.5 px-3.5 py-2 rounded-full bg-[#060809]/90 border border-white/[0.08] backdrop-blur-md font-mono text-[11px] text-[#94A3AB] tabular-nums">
              <Compass className="w-3.5 h-3.5 text-[#10B981] stroke-[1.75]" />
              <span>
                {coordinates.lat.toFixed(4)}°N,{" "}
                {Math.abs(coordinates.lng).toFixed(4)}°W
              </span>
              <span className="text-white/[0.15]">/</span>
              <span>Z {coordinates.zoom}</span>
              <span className="text-white/[0.15]">/</span>
              <span>{coordinates.pitch}° Tilt</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
