"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Compass, RotateCcw, Snowflake, Leaf, Flame } from "lucide-react";
import {
  ThermalFeature,
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
    coolingDeltaF?: number;
    baselinePeakTempF?: number;
    projectedPeakTempF?: number;
    zoneName?: string;
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
  focusedRefuge?: {
    name: string;
    temperatureF: number;
    coolerByF: number;
    coordinates: [number, number];
  } | null;
}

const CALCULATION_STAGES = [
  "Querying OpenStreetMap Overpass land-use & asphalt ways...",
  "Fetching Open-Meteo solar irradiance & wind telemetry...",
  "Computing 450m spatial energy balance & UHI hotspots...",
];

type ThermalBand = "hot" | "warm" | "normal" | "cold";

/**
 * Determines the thermal band ("hot" | "warm" | "normal" | "cold") for a zone
 * based on its actual temperature and cooling reduction:
 * - "cold" (Blue): ONLY when actual temp <= 76°F OR cooling drop >= 10.0°F
 * - "normal" (Green): Normal comfortable temperature (temp <= 88°F OR cooling drop 4.2°F - 9.9°F)
 * - "warm" (Amber/Yellow): Partial cooling (cooling drop 1.5°F - 4.1°F)
 * - "hot" (Orange/Red): Uncooled or minimal cooling (< 1.5°F)
 */
function getZoneThermalBand(
  projectedTempF: number,
  coolingMagnitudeF: number
): ThermalBand {
  if (projectedTempF <= 76.0 || coolingMagnitudeF >= 10.0) {
    return "cold";
  }
  if (projectedTempF <= 88.0 || coolingMagnitudeF >= 4.2) {
    return "normal";
  }
  if (coolingMagnitudeF >= 1.5) {
    return "warm";
  }
  return "hot";
}

/**
 * Returns the Mapbox 'heatmap-color' expression for the selected zone's cooling layer
 * matching its current thermal band (Warm Amber -> Normal Green -> Cold Blue).
 */
function getCoolingLayerColorExpression(
  band: ThermalBand
): mapboxgl.ExpressionSpecification {
  if (band === "cold") {
    // Cold / Very Cool Temperature -> Sky Blue
    return [
      "interpolate",
      ["linear"],
      ["heatmap-density"],
      0,
      "rgba(23, 22, 20, 0)",
      0.15,
      "rgba(52, 211, 153, 0.35)",
      0.4,
      "rgba(45, 212, 191, 0.68)",
      0.7,
      "rgba(56, 189, 248, 0.88)",
      1.0,
      "rgba(96, 165, 250, 0.96)",
    ];
  }

  if (band === "normal") {
    // Normal Temperature -> Natural Botanical Green / Emerald (NO Blue)
    return [
      "interpolate",
      ["linear"],
      ["heatmap-density"],
      0,
      "rgba(23, 22, 20, 0)",
      0.15,
      "rgba(163, 230, 53, 0.30)",
      0.4,
      "rgba(74, 222, 128, 0.62)",
      0.72,
      "rgba(52, 211, 153, 0.84)",
      1.0,
      "rgba(16, 185, 129, 0.94)",
    ];
  }

  // Warm Temperature -> Warm Amber / Yellow
  return [
    "interpolate",
    ["linear"],
    ["heatmap-density"],
    0,
    "rgba(23, 22, 20, 0)",
    0.15,
    "rgba(251, 146, 60, 0.28)",
    0.45,
    "rgba(250, 204, 21, 0.60)",
    0.75,
    "rgba(234, 179, 8, 0.80)",
    1.0,
    "rgba(163, 230, 53, 0.88)",
  ];
}

/**
 * Generates concentric radial microclimate nodes inside the selected zone
 * so Mapbox's WebGL cooling-heatmap layer renders a smooth, high-visibility
 * color transition across the entire selected radius as temperature cools down.
 */
function createCoolingFieldNodesGeoJSON(
  center: [number, number],
  radiusMeters: number,
  coolingMagnitudeF: number
) {
  if (coolingMagnitudeF <= 0.1) {
    return {
      type: "FeatureCollection" as const,
      features: [],
    };
  }

  const [lng, lat] = center;
  const earthRadius = 6371000;
  const latRad = (lat * Math.PI) / 180;
  const normalized = Math.min(1.25, coolingMagnitudeF / 6.0);

  const rings = [
    { fraction: 0, count: 1, weightFactor: 1.0 },
    { fraction: 0.28, count: 6, weightFactor: 0.92 },
    { fraction: 0.56, count: 12, weightFactor: 0.76 },
    { fraction: 0.84, count: 18, weightFactor: 0.48 },
  ];

  const features: Array<{
    type: "Feature";
    geometry: { type: "Point"; coordinates: [number, number] };
    properties: { coolingWeight: number; coolingF: number };
  }> = [];

  for (const ring of rings) {
    const dist = radiusMeters * ring.fraction;
    for (let i = 0; i < ring.count; i++) {
      const angle = (i / ring.count) * 2 * Math.PI;
      const dx = dist * Math.cos(angle);
      const dy = dist * Math.sin(angle);
      const dLat = (dy / earthRadius) * (180 / Math.PI);
      const dLng = (dx / (earthRadius * Math.cos(latRad))) * (180 / Math.PI);

      features.push({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [
            Number((lng + dLng).toFixed(5)),
            Number((lat + dLat).toFixed(5)),
          ],
        },
        properties: {
          coolingWeight: Number((normalized * ring.weightFactor).toFixed(3)),
          coolingF: Number((coolingMagnitudeF * ring.weightFactor).toFixed(2)),
        },
      });
    }
  }

  return {
    type: "FeatureCollection" as const,
    features,
  };
}

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
  focusedRefuge = null,
}: CoreMapProps) {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const renderedFeaturesRef = useRef<ThermalFeature[]>([]);
  const renderedCoolingMagRef = useRef<number>(0);
  const lastAppliedBandRef = useRef<ThermalBand>("normal");

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
  const [animatedCoolingF, setAnimatedCoolingF] = useState<number>(0);
  const [isTransitioningCooling, setIsTransitioningCooling] =
    useState<boolean>(false);
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
              "fill-extrusion-color": "#1C1A17",
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

      // 3. GeoJSON Source for Selected Zone Radial Cooling Field
      mapInstance.addSource("cooling-field-source", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [],
        },
      });

      // 4. GPU WebGL Thermal Heatmap Layer
      // Cold (Blue) -> Normal (Green) -> Warm (Amber) -> Hot (Orange/Red)
      mapInstance.addLayer(
        {
          id: "thermal-heatmap",
          type: "heatmap",
          source: "thermal-source",
          maxzoom: 17,
          paint: {
            "heatmap-weight": [
              "interpolate",
              ["linear"],
              ["get", "deltaF"],
              0,
              0,
              2.5,
              0.04,
              10,
              0.45,
              26,
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
              2.8,
            ],
            "heatmap-color": [
              "interpolate",
              ["linear"],
              ["heatmap-density"],
              0,
              "rgba(23, 22, 20, 0)",
              0.1,
              "rgba(56, 189, 248, 0.32)", // Cold / Cool Water & Park Sinks (Blue)
              0.28,
              "rgba(52, 211, 153, 0.58)", // Normal Comfortable Temp (Green)
              0.52,
              "rgba(250, 204, 21, 0.78)", // Warm Temp (Amber/Yellow)
              0.75,
              "rgba(249, 115, 22, 0.88)", // Hot Temp (Orange)
              1.0,
              "rgba(239, 68, 68, 0.96)", // Extreme Heat (Red)
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
              64,
            ],
            "heatmap-opacity": 0.85,
          },
        },
        "3d-buildings"
      );

      // 5. Dedicated GPU WebGL Selected Zone Microclimate Layer
      // Color dynamically adapts to the zone's temperature band:
      // Warm (Amber) -> Normal (Botanical Green) -> Cold (Blue ONLY when genuinely cold/max cooled)
      mapInstance.addLayer(
        {
          id: "cooling-heatmap",
          type: "heatmap",
          source: "cooling-field-source",
          maxzoom: 18,
          paint: {
            "heatmap-weight": [
              "interpolate",
              ["linear"],
              ["get", "coolingWeight"],
              0,
              0,
              0.2,
              0.35,
              0.6,
              0.75,
              1.0,
              1.0,
            ],
            "heatmap-intensity": [
              "interpolate",
              ["linear"],
              ["zoom"],
              9,
              1.2,
              12,
              1.8,
              14,
              2.4,
              16,
              3.0,
            ],
            "heatmap-color": getCoolingLayerColorExpression("normal"),
            "heatmap-radius": [
              "interpolate",
              ["linear"],
              ["zoom"],
              9,
              26,
              12,
              48,
              14,
              74,
              16,
              105,
            ],
            "heatmap-opacity": 0.9,
          },
        },
        "3d-buildings"
      );

      // 6. Street-Level Parcel Thermal Nodes (Visible from Z12+)
      // Colored strictly by temperature/thermal state:
      // Blue ONLY when cold (<=76°F or >=10°F cooling), Green for normal, Yellow for warm, Orange/Red for hot
      mapInstance.addLayer(
        {
          id: "thermal-points",
          type: "circle",
          source: "thermal-source",
          minzoom: 12,
          paint: {
            "circle-radius": [
              "interpolate",
              ["linear"],
              ["zoom"],
              12,
              [
                "case",
                [">", ["coalesce", ["get", "coolingF"], 0], 0.5],
                5.5,
                3,
              ],
              14.5,
              [
                "case",
                [">", ["coalesce", ["get", "coolingF"], 0], 0.5],
                9,
                6,
              ],
              17,
              [
                "case",
                [">", ["coalesce", ["get", "coolingF"], 0], 0.5],
                14,
                10,
              ],
            ],
            "circle-color": [
              "case",
              // Cold temperature (<= 76°F or deep cooling >= 10°F) -> Blue
              [
                "any",
                ["<=", ["get", "temperatureF"], 76],
                [">=", ["coalesce", ["get", "coolingF"], 0], 10.0],
              ],
              "#38BDF8",
              // Normal comfortable temperature (<= 86°F or moderate cooling 4.2°F - 9.9°F) -> Normal Green
              [
                "any",
                ["<=", ["get", "temperatureF"], 86],
                [">=", ["coalesce", ["get", "coolingF"], 0], 4.2],
              ],
              "#34D399",
              // Warm temperature (<= 95°F or light cooling 1.5°F - 4.1°F) -> Warm Amber/Yellow
              [
                "any",
                ["<=", ["get", "temperatureF"], 95],
                [">=", ["coalesce", ["get", "coolingF"], 0], 1.5],
              ],
              "#FACC15",
              // Hot temperature (<= 105°F) -> Orange
              ["<=", ["get", "temperatureF"], 105],
              "#F97316",
              // Extreme heat (> 105°F) -> Red
              "#EF4444",
            ],
            "circle-stroke-width": [
              "case",
              [">", ["coalesce", ["get", "coolingF"], 0], 0.6],
              1.6,
              1.1,
            ],
            "circle-stroke-color": [
              "case",
              [">", ["coalesce", ["get", "coolingF"], 0], 0.6],
              "#F5F3EF",
              "#171614",
            ],
            "circle-opacity": [
              "interpolate",
              ["linear"],
              ["zoom"],
              12,
              0.4,
              13.5,
              0.9,
            ],
          },
        },
        labelLayerId
      );

      // 7. GeoJSON Source & Layers for Selected Zone Boundary Ring
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
            "fill-color": "#34D399",
            "fill-opacity": 0.12,
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
            "line-color": "#34D399",
            "line-width": 2.2,
            "line-dasharray": [2, 2],
            "line-opacity": 0.88,
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
        const coolingVal = Number(props?.coolingF || 0);
        const tempVal = Number(props?.temperatureF || 90);
        const parcelBand = getZoneThermalBand(tempVal, coolingVal);
        const accentHex =
          parcelBand === "cold"
            ? "#38BDF8"
            : parcelBand === "normal"
            ? "#34D399"
            : parcelBand === "warm"
            ? "#FACC15"
            : "#D98A5B";

        if (popupRef.current) popupRef.current.remove();
        popupRef.current = new mapboxgl.Popup({
          closeButton: true,
          closeOnClick: true,
          maxWidth: "290px",
        })
          .setLngLat(coords)
          .setHTML(
            `<div style="font-family: var(--font-jakarta), sans-serif; padding: 2px;">
              <div style="font-family: var(--font-jetbrains-mono), monospace; font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: ${accentHex}; margin-bottom: 4px;">
                ${
                  coolingVal > 0.5
                    ? `${parcelBand.toUpperCase()} TEMP (-${coolingVal.toFixed(
                        1
                      )}°F)`
                    : `${props?.severity || "HIGH"} THERMAL NODE`
                } • ${props?.censusTract || "OSM"}
              </div>
              <div style="font-weight: 700; font-size: 13px; color: #F5F3EF; margin-bottom: 6px;">
                ${props?.areaName || "Urban Surface Parcel"}
              </div>
              <div style="display: flex; align-items: baseline; justify-content: space-between; border-top: 1px solid rgba(245,243,239,0.1); padding-top: 6px;">
                <span style="font-family: var(--font-space-grotesk), sans-serif; font-size: 18px; font-weight: 700; color: #F5F3EF;">
                  ${tempVal.toFixed(1)}°F
                </span>
                <span style="font-family: var(--font-jetbrains-mono), monospace; font-size: 11px; color: ${accentHex};">
                  ${
                    coolingVal > 0.5
                      ? `Was ${Number(
                          props?.originalTempF || tempVal
                        ).toFixed(1)}°F`
                      : `+${Number(props?.deltaF).toFixed(1)}°F UHI`
                  }
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
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      resizeObserver.disconnect();
      markersRef.current.forEach((m) => m.remove());
      if (popupRef.current) popupRef.current.remove();
      mapInstance.remove();
      map.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Helper to update the cooling-heatmap and zone ring colors based on the current animated temperature band
  const syncCoolingBandColors = useCallback(
    (mapInstance: mapboxgl.Map, currentTempF: number, currentCoolingMag: number) => {
      const band = getZoneThermalBand(currentTempF, currentCoolingMag);
      if (
        band !== lastAppliedBandRef.current &&
        mapInstance.getLayer("cooling-heatmap")
      ) {
        lastAppliedBandRef.current = band;
        mapInstance.setPaintProperty(
          "cooling-heatmap",
          "heatmap-color",
          getCoolingLayerColorExpression(band)
        );
      }

      const ringColor =
        band === "cold"
          ? "#38BDF8" // Cold -> Blue
          : band === "normal"
          ? "#34D399" // Normal -> Green
          : band === "warm"
          ? "#FACC15" // Warm -> Amber
          : "#D98A5B"; // Hot -> Terracotta

      if (mapInstance.getLayer("simulation-zone-fill")) {
        mapInstance.setPaintProperty(
          "simulation-zone-fill",
          "fill-color",
          ringColor
        );
        mapInstance.setPaintProperty(
          "simulation-zone-fill",
          "fill-opacity",
          currentCoolingMag > 0.2 ? 0.13 : 0.07
        );
      }
      if (mapInstance.getLayer("simulation-zone-outline")) {
        mapInstance.setPaintProperty(
          "simulation-zone-outline",
          "line-color",
          ringColor
        );
      }
    },
    []
  );

  // Smoothly animate heatmap & cooling zone color transition over 1,650ms whenever thermalData or cooling changes
  useEffect(() => {
    if (!map.current || !isLoaded || !activeData) return;
    const mapInstance = map.current;
    const thermalSource = mapInstance.getSource(
      "thermal-source"
    ) as mapboxgl.GeoJSONSource | undefined;
    const coolingFieldSource = mapInstance.getSource(
      "cooling-field-source"
    ) as mapboxgl.GeoJSONSource | undefined;

    if (!thermalSource) return;

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    const nextFeatures = activeData.features;
    const prevFeatures = renderedFeaturesRef.current;

    const targetCoolingMag =
      simulationZone && simulationZone.active && simulationZone.coolingDeltaF
        ? Math.abs(simulationZone.coolingDeltaF)
        : 0;
    const startCoolingMag = renderedCoolingMagRef.current;
    const baselinePeak = simulationZone?.baselinePeakTempF || 104.0;

    // Check if this is the same city dataset (matching feature count & first feature ID)
    const isSameCityDataset =
      prevFeatures.length === nextFeatures.length &&
      prevFeatures.length > 0 &&
      prevFeatures[0].properties.id === nextFeatures[0].properties.id;

    // Check if any feature's temperature/cooling actually changed
    const hasThermalChange =
      isSameCityDataset &&
      (Math.abs(targetCoolingMag - startCoolingMag) > 0.05 ||
        nextFeatures.some(
          (nf, idx) =>
            Math.abs(
              nf.properties.deltaF - prevFeatures[idx].properties.deltaF
            ) > 0.05 ||
            Math.abs(
              (nf.properties.coolingF || 0) -
                (prevFeatures[idx].properties.coolingF || 0)
            ) > 0.05
        ));

    if (!isSameCityDataset || !hasThermalChange) {
      thermalSource.setData(activeData);
      renderedFeaturesRef.current = nextFeatures;
      renderedCoolingMagRef.current = targetCoolingMag;
      setAnimatedCoolingF(targetCoolingMag);
      setIsTransitioningCooling(false);

      syncCoolingBandColors(
        mapInstance,
        baselinePeak - targetCoolingMag,
        targetCoolingMag
      );

      if (coolingFieldSource) {
        if (simulationZone && simulationZone.active && targetCoolingMag > 0.1) {
          coolingFieldSource.setData(
            createCoolingFieldNodesGeoJSON(
              simulationZone.center,
              simulationZone.radiusMeters,
              targetCoolingMag
            )
          );
        } else {
          coolingFieldSource.setData({
            type: "FeatureCollection",
            features: [],
          });
        }
      }
      return;
    }

    // Smoothly animate the heatmap color transition in the selected zone over 1,650ms
    const DURATION_MS = 1650;
    const startTime = performance.now();
    setIsTransitioningCooling(true);

    const stepAnimation = (now: number) => {
      const elapsed = now - startTime;
      const rawT = Math.min(1, elapsed / DURATION_MS);
      // Smooth cubic ease-in-out
      const easedT =
        rawT < 0.5
          ? 4 * rawT * rawT * rawT
          : 1 - Math.pow(-2 * rawT + 2, 3) / 2;

      const currentCoolingMag =
        startCoolingMag + (targetCoolingMag - startCoolingMag) * easedT;
      renderedCoolingMagRef.current = currentCoolingMag;
      setAnimatedCoolingF(Number(currentCoolingMag.toFixed(1)));

      // Dynamically shift the zone's heatmap color through Hot -> Warm (Amber) -> Normal (Green) -> Cold (Blue)
      syncCoolingBandColors(
        mapInstance,
        baselinePeak - currentCoolingMag,
        currentCoolingMag
      );

      const interpolatedFeatures: ThermalFeature[] = nextFeatures.map(
        (targetF, i) => {
          const fromF = prevFeatures[i] || targetF;
          const fromProps = fromF.properties;
          const toProps = targetF.properties;

          const fromDelta = fromProps.deltaF;
          const toDelta = toProps.deltaF;
          const fromTemp = fromProps.temperatureF;
          const toTemp = toProps.temperatureF;
          const fromCool = fromProps.coolingF || 0;
          const toCool = toProps.coolingF || 0;

          if (
            Math.abs(toDelta - fromDelta) < 0.01 &&
            Math.abs(toCool - fromCool) < 0.01
          ) {
            return targetF;
          }

          return {
            ...targetF,
            properties: {
              ...toProps,
              deltaF: Number(
                (fromDelta + (toDelta - fromDelta) * easedT).toFixed(2)
              ),
              temperatureF: Number(
                (fromTemp + (toTemp - fromTemp) * easedT).toFixed(1)
              ),
              coolingF: Number(
                (fromCool + (toCool - fromCool) * easedT).toFixed(2)
              ),
            },
          };
        }
      );

      renderedFeaturesRef.current = interpolatedFeatures;
      thermalSource.setData({
        type: "FeatureCollection",
        features: interpolatedFeatures,
      });

      if (coolingFieldSource && simulationZone && simulationZone.active) {
        coolingFieldSource.setData(
          createCoolingFieldNodesGeoJSON(
            simulationZone.center,
            simulationZone.radiusMeters,
            currentCoolingMag
          )
        );
      }

      if (rawT < 1) {
        animFrameRef.current = requestAnimationFrame(stepAnimation);
      } else {
        renderedFeaturesRef.current = nextFeatures;
        renderedCoolingMagRef.current = targetCoolingMag;
        setAnimatedCoolingF(Number(targetCoolingMag.toFixed(1)));
        setIsTransitioningCooling(false);
        animFrameRef.current = null;
      }
    };

    animFrameRef.current = requestAnimationFrame(stepAnimation);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    };
  }, [activeData, simulationZone, isLoaded, syncCoolingBandColors]);

  // Push geodesic circle into 'simulation-zone-source'
  useEffect(() => {
    if (!map.current || !isLoaded) return;
    const mapInstance = map.current;
    const source = mapInstance.getSource(
      "simulation-zone-source"
    ) as mapboxgl.GeoJSONSource | undefined;
    if (!source) return;

    if (simulationZone && simulationZone.active) {
      const circleGeoJSON = createGeodesicCircleGeoJSON(
        simulationZone.center,
        simulationZone.radiusMeters
      );
      source.setData(circleGeoJSON);

      const coolingMag = Math.abs(simulationZone.coolingDeltaF || 0);
      const basePeak = simulationZone.baselinePeakTempF || 104.0;
      syncCoolingBandColors(mapInstance, basePeak - coolingMag, coolingMag);
    } else {
      source.setData({
        type: "FeatureCollection",
        features: [],
      });
    }
  }, [simulationZone, isLoaded, syncCoolingBandColors]);

  // Sync Heatmap visibility & opacity across both thermal-heatmap and cooling-heatmap
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

    if (mapInstance.getLayer("cooling-heatmap")) {
      mapInstance.setLayoutProperty(
        "cooling-heatmap",
        "visibility",
        showHeatmap ? "visible" : "none"
      );
      mapInstance.setPaintProperty(
        "cooling-heatmap",
        "heatmap-opacity",
        Math.min(1, heatmapOpacity + 0.05)
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
      zoom: Math.max(map.current.getZoom(), 13.2),
      pitch: 52,
      duration: 1300,
      essential: true,
    });
  }, [selectedHotspot, isLoaded]);

  // Fly to a Cool Refuge spot when user clicks "View" in the Personal Health & Safety panel
  useEffect(() => {
    if (!map.current || !isLoaded || !focusedRefuge) return;
    const mapInstance = map.current;

    mapInstance.flyTo({
      center: focusedRefuge.coordinates,
      zoom: Math.max(mapInstance.getZoom(), 13.6),
      pitch: 52,
      duration: 1400,
      essential: true,
    });

    if (popupRef.current) popupRef.current.remove();
    popupRef.current = new mapboxgl.Popup({
      closeButton: true,
      closeOnClick: true,
      offset: 14,
      maxWidth: "280px",
    })
      .setLngLat(focusedRefuge.coordinates)
      .setHTML(
        `<div style="font-family: var(--font-jakarta), sans-serif; padding: 2px;">
          <div style="font-size: 11px; font-weight: 600; color: #34D399; margin-bottom: 4px;">
            Cool Outdoor Refuge · Safe Zone
          </div>
          <div style="font-weight: 700; font-size: 14px; color: #F5F3EF; margin-bottom: 6px;">
            ${focusedRefuge.name}
          </div>
          <div style="display: flex; align-items: baseline; justify-content: space-between; border-top: 1px solid rgba(245,243,239,0.1); padding-top: 6px;">
            <span style="font-family: var(--font-space-grotesk), sans-serif; font-size: 18px; font-weight: 700; color: #34D399;">
              ${focusedRefuge.temperatureF.toFixed(1)}°F
            </span>
            <span style="font-family: var(--font-jetbrains-mono), monospace; font-size: 12px; color: #78B093;">
              -${focusedRefuge.coolerByF.toFixed(1)}°F cooler
            </span>
          </div>
        </div>`
      )
      .addTo(mapInstance);
  }, [focusedRefuge, isLoaded]);

  // Render Mapbox DOM markers for top hotspots (colored by thermal state: Warm Amber / Normal Green / Cold Blue)
  useEffect(() => {
    if (!map.current || !isLoaded) return;
    const mapInstance = map.current;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    if (!showHotspots || !activeHotspots || activeHotspots.length === 0) return;

    const activeCoolingDelta =
      simulationZone && simulationZone.active
        ? simulationZone.coolingDeltaF || 0
        : 0;
    const coolingMag = Math.abs(activeCoolingDelta);

    activeHotspots.forEach((hotspot) => {
      const el = document.createElement("div");
      el.className =
        "group cursor-pointer relative flex items-center justify-center";

      const isCurrentSelected = selectedHotspot?.id === hotspot.id;
      const isThisHotspotCooled =
        isCurrentSelected && activeCoolingDelta < -0.2;

      if (isThisHotspotCooled) {
        const cooledPeakNum = hotspot.peakTempF + activeCoolingDelta;
        const cooledPeak = cooledPeakNum.toFixed(1);
        const band = getZoneThermalBand(cooledPeakNum, coolingMag);

        const badgeStyles =
          band === "cold"
            ? "bg-[#11222B] text-[#E0F2FE] border-[#38BDF8]"
            : band === "normal"
            ? "bg-[#16261E] text-[#ECFDF5] border-[#34D399]"
            : "bg-[#262015] text-[#FEF9C3] border-[#FACC15]";

        const accentText =
          band === "cold"
            ? "text-[#38BDF8]"
            : band === "normal"
            ? "text-[#34D399]"
            : "text-[#FACC15]";

        el.innerHTML = `
          <div class="relative flex items-center gap-1.5 px-2.5 py-1 rounded-xl font-mono text-xs font-bold shadow-lg border-2 ${badgeStyles} whitespace-nowrap transition-transform transform group-hover:scale-105">
            <span>#${hotspot.rank}</span>
            <span class="${accentText}">${cooledPeak}°F</span>
            <span class="text-[10px] px-1.5 py-0.5 rounded bg-black/25 ${accentText}">${activeCoolingDelta.toFixed(
              1
            )}°F</span>
          </div>
        `;
      } else {
        el.style.width = "38px";
        el.style.height = "38px";
        el.innerHTML = `
          <div class="relative w-8 h-8 rounded-xl flex items-center justify-center font-mono text-xs font-bold shadow-md transition-transform transform group-hover:scale-105 border-2 ${
            isCurrentSelected
              ? "bg-[#5E9A7B] text-[#141311] border-[#F5F3EF]"
              : "bg-[#211F1C] text-[#F5F3EF] border-[#D98A5B]"
          }">
            #${hotspot.rank}
          </div>
        `;
      }

      el.addEventListener("click", (e) => {
        e.stopPropagation();
        if (onSelectHotspotRef.current) {
          onSelectHotspotRef.current(hotspot);
        }

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
              <div style="font-size: 11px; font-weight: 600; color: #78B093; margin-bottom: 4px;">
                Hotspot #${hotspot.rank} · ${hotspot.riskLevel} Risk
              </div>
              <div style="font-weight: 700; font-size: 14px; color: #F5F3EF; margin-bottom: 4px;">
                ${hotspot.name}
              </div>
              <div style="font-size: 12px; color: #B8B1A7; margin-bottom: 8px; line-height: 1.4;">
                ${hotspot.primaryCause}
              </div>
              <div style="display: flex; align-items: baseline; justify-content: space-between; border-top: 1px solid rgba(245,243,239,0.1); padding-top: 6px;">
                <span style="font-family: var(--font-space-grotesk), sans-serif; font-size: 18px; font-weight: 700; color: #F5F3EF;">
                  ${hotspot.peakTempF.toFixed(1)}°F
                </span>
                <span style="font-family: var(--font-jetbrains-mono), monospace; font-size: 12px; color: #D98A5B;">
                  +${hotspot.deltaF.toFixed(1)}°F heat island
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
  }, [
    activeHotspots,
    showHotspots,
    selectedHotspot,
    simulationZone,
    isLoaded,
  ]);

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

  const hasActiveCoolingOverlay =
    simulationZone &&
    simulationZone.active &&
    (animatedCoolingF > 0.1 || (simulationZone.coolingDeltaF || 0) < -0.1);

  const liveBaselinePeak = simulationZone?.baselinePeakTempF || 106.4;
  const liveAnimatedTempNum = liveBaselinePeak - animatedCoolingF;
  const liveAnimatedTempF = liveAnimatedTempNum.toFixed(1);
  const currentBand = getZoneThermalBand(liveAnimatedTempNum, animatedCoolingF);

  const bandTheme =
    currentBand === "cold"
      ? {
          label: "Cold / Cool Temperature",
          border: "border-[#38BDF8]/40",
          accentText: "text-[#38BDF8]",
          badgeBg: "bg-[#38BDF8]/15 border-[#38BDF8]/30 text-[#38BDF8]",
          barColor: "from-[#EF4444] via-[#34D399] to-[#38BDF8]",
        }
      : currentBand === "normal"
      ? {
          label: "Normal Comfortable Temp",
          border: "border-[#34D399]/40",
          accentText: "text-[#34D399]",
          badgeBg: "bg-[#34D399]/15 border-[#34D399]/30 text-[#34D399]",
          barColor: "from-[#EF4444] via-[#FACC15] to-[#34D399]",
        }
      : {
          label: "Warm Temperature",
          border: "border-[#FACC15]/40",
          accentText: "text-[#FACC15]",
          badgeBg: "bg-[#FACC15]/15 border-[#FACC15]/30 text-[#FACC15]",
          barColor: "from-[#EF4444] to-[#FACC15]",
        };

  const targetCoolingMag = Math.abs(simulationZone?.coolingDeltaF || 0);
  const coolingProgressPct =
    targetCoolingMag > 0.1
      ? Math.min(100, Math.round((animatedCoolingF / targetCoolingMag) * 100))
      : 0;

  return (
    <div className={`relative overflow-hidden bg-[#171614] ${className}`}>
      {/* Mapbox WebGL Canvas */}
      <div ref={mapContainer} className="w-full h-full" />

      {/* Live Selected Zone Cooling Transition HUD (Top-Left of Map Canvas) */}
      {hasActiveCoolingOverlay && (
        <div className="absolute top-4 left-4 z-20 pointer-events-none max-w-sm">
          <div
            className={`rounded-2xl bg-[#1C1A17]/95 border ${bandTheme.border} px-4 py-3 shadow-2xl space-y-2 backdrop-blur-md transition-colors duration-300`}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                {currentBand === "cold" ? (
                  <Snowflake
                    className={`w-4 h-4 text-[#38BDF8] ${
                      isTransitioningCooling ? "animate-spin" : ""
                    }`}
                  />
                ) : currentBand === "normal" ? (
                  <Leaf className="w-4 h-4 text-[#34D399]" />
                ) : (
                  <Flame className="w-4 h-4 text-[#FACC15]" />
                )}
                <span className="text-xs font-semibold text-[#F5F3EF]">
                  {isTransitioningCooling
                    ? "Cooling Selected Zone..."
                    : bandTheme.label}
                </span>
              </div>
              <span
                className={`font-mono text-xs font-bold border px-2 py-0.5 rounded-md tabular-nums ${bandTheme.badgeBg}`}
              >
                -{animatedCoolingF.toFixed(1)}°F
              </span>
            </div>

            {simulationZone?.zoneName && (
              <div className="text-xs text-[#B8B1A7] truncate">
                Zone:{" "}
                <span className="text-[#F5F3EF] font-medium">
                  {simulationZone.zoneName}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between text-xs font-mono pt-0.5">
              <span className="text-[#D98A5B] line-through tabular-nums">
                {liveBaselinePeak.toFixed(1)}°F Hot
              </span>
              <span className="text-[#8C857B]">→</span>
              <span
                className={`text-sm font-bold tabular-nums ${bandTheme.accentText}`}
              >
                {liveAnimatedTempF}°F (
                {currentBand === "cold"
                  ? "Cold"
                  : currentBand === "normal"
                  ? "Normal"
                  : "Warm"}
                )
              </span>
            </div>

            {/* Smooth Color Spectrum Progress Bar */}
            <div className="w-full h-2 rounded-full bg-[#141311] overflow-hidden p-0.5 border border-[#2F2C28]">
              <div
                className={`h-full rounded-full transition-all duration-150 bg-gradient-to-r ${bandTheme.barColor}`}
                style={{ width: `${Math.max(12, coolingProgressPct)}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Loading Canvas Shield */}
      {!isLoaded && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#171614]">
          <div className="w-48 h-1.5 bg-[#2A2724] rounded-full overflow-hidden mb-3">
            <div className="w-1/2 h-full bg-[#5E9A7B] animate-pulse rounded-full" />
          </div>
          <span className="text-xs font-medium text-[#B8B1A7]">
            Loading 3D Thermal Map...
          </span>
        </div>
      )}

      {/* Heated-Zone Calculation Overlay (while querying OSM Overpass + Open-Meteo + Physics) */}
      {showCalculationOverlay && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#171614]/65 backdrop-blur-sm pointer-events-none transition-opacity duration-300">
          <div className="w-[90%] max-w-md rounded-2xl bg-[#211F1C] border border-[#38342F] p-5 shadow-2xl flex flex-col gap-3.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#78B093]">
                Calculating Urban Heat Zones
              </span>
              <span className="font-mono text-[#B8B1A7] tabular-nums">
                Step {calcStageIndex + 1} of 3
              </span>
            </div>

            <div>
              <h4 className="font-display text-base font-semibold text-[#F5F3EF]">
                Mapping{" "}
                <span className="text-[#78B093]">
                  {calculatingCityName ||
                    (customLocation
                      ? `${customLocation.name}, ${customLocation.state}`
                      : `${currentMeta.name}, ${currentMeta.state}`)}
                </span>
              </h4>
              <p className="text-xs text-[#B8B1A7] mt-0.5">
                Analyzing OpenStreetMap buildings, asphalt surfaces, and live solar heat...
              </p>
            </div>

            <div className="w-full h-2 bg-[#141311] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#5E9A7B] rounded-full transition-all duration-500 ease-out"
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

            <div className="space-y-1.5 pt-2 border-t border-[#2F2C28] text-xs">
              {CALCULATION_STAGES.map((stageText, idx) => {
                const isDone = idx < calcStageIndex;
                const isCurrent = idx === calcStageIndex;
                return (
                  <div
                    key={idx}
                    className={`flex items-center gap-2 ${
                      isCurrent
                        ? "text-[#F5F3EF] font-medium"
                        : isDone
                        ? "text-[#78B093]"
                        : "text-[#8C857B]"
                    }`}
                  >
                    <span className="font-mono text-xs">
                      {isDone ? "✓" : isCurrent ? "→" : "·"}
                    </span>
                    <span className="truncate">{stageText}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Standalone Top-Left City Preset Switcher (for Landing Page Hero Map) */}
      {showOverlayControls && isStandalone && (
        <div className="absolute top-3.5 left-3.5 z-10 flex flex-wrap items-center gap-1.5 p-1.5 rounded-xl bg-[#211F1C]/95 border border-[#38342F] shadow-lg">
          {Object.values(SUPPORTED_CITIES).map((city) => {
            const isSelected = activeCityId === city.id;
            return (
              <button
                key={city.id}
                type="button"
                onClick={() => setInternalCityId(city.id)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                  isSelected
                    ? "bg-[#5E9A7B] text-[#141311] font-semibold"
                    : "text-[#B8B1A7] hover:text-[#F5F3EF] hover:bg-white/[0.04]"
                }`}
              >
                {city.id === "portland"
                  ? "Portland, OR"
                  : city.id === "phoenix"
                  ? "Phoenix, AZ"
                  : "New York, NY"}
              </button>
            );
          })}
        </div>
      )}

      {/* Bottom Legend Bar & Camera Reset (Non-Overlapping) */}
      {showOverlayControls && (
        <div className="absolute bottom-4 left-4 z-10 flex flex-wrap items-center gap-2.5 pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-3 px-3.5 py-2 rounded-xl bg-[#211F1C]/95 border border-[#38342F] shadow-lg">
            <span className="text-xs font-medium text-[#B8B1A7]">
              Temp Scale
            </span>
            <div className="flex items-center gap-2 text-[11px] font-medium">
              <span className="text-[#38BDF8]">Cold</span>
              <span className="text-[#8C857B]">·</span>
              <span className="text-[#34D399]">Normal</span>
              <div className="h-2 w-24 sm:w-32 rounded-full bg-gradient-to-r from-[#38BDF8] via-[#34D399] via-[#FACC15] to-[#EF4444]" />
              <span className="text-[#EF4444]">Hot ({currentMeta.peakSurfaceF})</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleResetCamera}
            title="Reset 3D Camera View"
            aria-label="Reset 3D Camera View"
            className="pointer-events-auto flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#211F1C]/95 hover:bg-[#2A2724] border border-[#38342F] text-xs font-medium text-[#B8B1A7] hover:text-[#F5F3EF] transition-colors shadow-lg"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset View</span>
          </button>

          <div className="pointer-events-auto hidden xl:flex items-center gap-2 px-3 py-2 rounded-xl bg-[#211F1C]/95 border border-[#38342F] font-mono text-xs text-[#B8B1A7] tabular-nums shadow-lg">
            <Compass className="w-3.5 h-3.5 text-[#78B093]" />
            <span>
              {coordinates.lat.toFixed(3)}°N, {Math.abs(coordinates.lng).toFixed(3)}°W
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
