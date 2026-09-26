import { NextRequest, NextResponse } from "next/server";
import {
  ThermalFeature,
  ThermalFeatureCollection,
  ThermalPointProperties,
  generateSyntheticThermalGrid,
} from "@/lib/thermal-data";

export const dynamic = "force-dynamic";

interface OverpassElement {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

const MATERIAL_ALBEDO: Record<
  ThermalPointProperties["surfaceType"],
  { albedo: number; evapCoolingF: number }
> = {
  asphalt: { albedo: 0.08, evapCoolingF: 0.0 },
  commercial_roof: { albedo: 0.13, evapCoolingF: 0.0 },
  residential: { albedo: 0.2, evapCoolingF: 2.5 },
  canopy: { albedo: 0.25, evapCoolingF: 21.5 },
  water: { albedo: 0.08, evapCoolingF: 25.0 },
};

function haversineMeters(
  coord1: [number, number],
  coord2: [number, number]
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(coord2[1] - coord1[1]);
  const dLng = toRad(coord2[0] - coord1[0]);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(coord1[1])) *
      Math.cos(toRad(coord2[1])) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Real-time Urban Heat Island (UHI) Geospatial Pipeline
 * Combines:
 * 1. Open-Meteo Live Meteorological & Solar Irradiance API
 * 2. OpenStreetMap Overpass API (real industrial zones, commercial complexes, asphalt parking lots, highways, and parks)
 * 3. Physical Surface Energy Balance Model + 450m Spatial Impervious Cluster Density
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = parseFloat(searchParams.get("lat") || "45.5202");
  const lng = parseFloat(searchParams.get("lng") || "-122.6742");
  const mode = searchParams.get("mode") || "heatwave"; // "heatwave" | "live"

  if (isNaN(lat) || isNaN(lng)) {
    return NextResponse.json(
      { error: "Invalid lat/lng parameters" },
      { status: 400 }
    );
  }

  try {
    // 1. Fetch Live Meteorological & Solar Radiation Telemetry from Open-Meteo
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(
      4
    )}&longitude=${lng.toFixed(
      4
    )}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,shortwave_radiation,direct_radiation&temperature_unit=fahrenheit&wind_speed_unit=mph`;

    let liveAirTempF = 78.0;
    let liveWindMph = 6.5;
    let liveSolarWm2 = 680;
    let liveHumidity = 45;

    try {
      const weatherRes = await fetch(weatherUrl, { next: { revalidate: 300 } });
      if (weatherRes.ok) {
        const wData = await weatherRes.json();
        if (wData.current) {
          liveAirTempF = wData.current.temperature_2m ?? 78.0;
          liveWindMph = wData.current.wind_speed_10m ?? 6.5;
          liveSolarWm2 = wData.current.shortwave_radiation ?? 680;
          liveHumidity = wData.current.relative_humidity_2m ?? 45;
        }
      }
    } catch {
      // Non-blocking fallback if firewall restricts external weather call
    }

    const baselineRuralF =
      mode === "live"
        ? Number(liveAirTempF.toFixed(1))
        : Number(Math.max(liveAirTempF, 80.0).toFixed(1));

    const effectiveSolarWm2 =
      mode === "live"
        ? Math.max(180, liveSolarWm2)
        : Math.max(840, liveSolarWm2);

    const windConvectionFactor = 21.0 + liveWindMph * 0.85;

    // 2. Fast Bounding-Box Overpass QL Query for real OpenStreetMap ways
    const dLat = 0.042;
    const dLng = 0.055;
    const bbox = `${(lat - dLat).toFixed(4)},${(lng - dLng).toFixed(4)},${(
      lat + dLat
    ).toFixed(4)},${(lng + dLng).toFixed(4)}`;

    const overpassQuery = `[out:json][timeout:10];(way["landuse"~"industrial|commercial|retail"](${bbox});way["amenity"="parking"](${bbox});way["leisure"="park"](${bbox}););out center 280;`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 9000);

    let elements: OverpassElement[] = [];
    try {
      const overpassRes = await fetch(
        "https://overpass-api.de/api/interpreter",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "User-Agent": "HeatShield-AI-Observatory/1.0",
          },
          body: `data=${encodeURIComponent(overpassQuery)}`,
          signal: controller.signal,
        }
      );
      clearTimeout(timeoutId);

      if (overpassRes.ok) {
        const osmData = await overpassRes.json();
        elements = osmData.elements || [];
      }
    } catch {
      clearTimeout(timeoutId);
    }

    // Parse real OSM ways first
    const parsedWays = elements
      .map((el) => {
        const ptLat = el.lat ?? el.center?.lat;
        const ptLng = el.lon ?? el.center?.lon;
        if (!ptLat || !ptLng) return null;

        const tags = el.tags || {};
        let surfaceType: ThermalPointProperties["surfaceType"] = "residential";
        let defaultCategoryName = "Urban Sector";

        if (tags.landuse === "industrial") {
          surfaceType = "commercial_roof";
          defaultCategoryName = "Industrial Logistics & Manufacturing Zone";
        } else if (tags.amenity === "parking") {
          surfaceType = "asphalt";
          defaultCategoryName = "Impervious Surface Asphalt Parking Lot";
        } else if (
          tags.landuse === "commercial" ||
          tags.landuse === "retail"
        ) {
          surfaceType = "commercial_roof";
          defaultCategoryName = "Commercial Corridor & Retail Plaza";
        } else if (tags.leisure === "park") {
          surfaceType = "canopy";
          defaultCategoryName = "Urban Park & Tree Canopy Sink";
        }

        const realName =
          tags.name ||
          (tags["addr:street"]
            ? `${tags["addr:street"]} (${defaultCategoryName})`
            : tags.operator
            ? `${tags.operator} — ${defaultCategoryName}`
            : `${defaultCategoryName} (OSM Way #${el.id})`);

        return {
          id: el.id,
          coords: [Number(ptLng.toFixed(5)), Number(ptLat.toFixed(5))] as [
            number,
            number
          ],
          surfaceType: surfaceType as ThermalPointProperties["surfaceType"],
          realName,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);

    // 3. Compute 450m Spatial Neighbor Energy Balance for every real OSM parcel
    const features: ThermalFeature[] = parsedWays.map((way) => {
      const mat =
        MATERIAL_ALBEDO[way.surfaceType] || MATERIAL_ALBEDO.commercial_roof;

      let imperviousNeighbors = 0;
      let canopyNeighbors = 0;

      for (const other of parsedWays) {
        if (other.id === way.id) continue;
        const dist = haversineMeters(way.coords, other.coords);
        if (dist <= 450) {
          if (
            other.surfaceType === "asphalt" ||
            other.surfaceType === "commercial_roof"
          ) {
            imperviousNeighbors++;
          } else if (
            other.surfaceType === "canopy" ||
            other.surfaceType === "water"
          ) {
            canopyNeighbors++;
          }
        }
      }

      const absorbedSolarWm2 = (1 - mat.albedo) * effectiveSolarWm2;
      const radiativeDeltaF = absorbedSolarWm2 / windConvectionFactor;
      const clusterTrappingF = Math.min(11.5, imperviousNeighbors * 0.55);
      const greenBufferCoolingF = Math.min(6.5, canopyNeighbors * 0.75);

      const deltaF = Number(
        Math.max(
          0.8,
          radiativeDeltaF +
            clusterTrappingF -
            greenBufferCoolingF -
            mat.evapCoolingF
        ).toFixed(1)
      );
      const temperatureF = Number((baselineRuralF + deltaF).toFixed(1));
      const temperatureC = Number(((temperatureF - 32) * (5 / 9)).toFixed(1));

      let severity: ThermalPointProperties["severity"] = "Low";
      if (deltaF >= 24.0) severity = "Critical";
      else if (deltaF >= 16.0) severity = "High";
      else if (deltaF >= 8.0) severity = "Moderate";

      return {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: way.coords,
        },
        properties: {
          id: `osm-way-${way.id}`,
          temperatureF,
          temperatureC,
          baselineRuralF,
          deltaF,
          severity,
          surfaceType: way.surfaceType,
          areaName: way.realName,
          censusTract: `OSM Way #${way.id} • ${imperviousNeighbors} impervious ways/450m`,
        },
      };
    });

    const collection: ThermalFeatureCollection =
      features.length >= 15
        ? { type: "FeatureCollection", features }
        : generateSyntheticThermalGrid([lng, lat], baselineRuralF, 220);

    return NextResponse.json({
      source:
        features.length >= 15 ? "osm_overpass_live" : "calibrated_fallback",
      telemetry: {
        liveAirTempF,
        liveWindMph,
        liveSolarWm2,
        liveHumidity,
        baselineRuralF,
        mode,
        featureCount: collection.features.length,
      },
      data: collection,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to fetch live thermal telemetry" },
      { status: 500 }
    );
  }
}
