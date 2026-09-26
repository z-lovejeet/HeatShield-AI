import { ThermalFeature, ThermalFeatureCollection, ThermalPointProperties } from "./thermal-data";

export interface Hotspot {
  id: string;
  rank: number;
  name: string;
  coordinates: [number, number]; // [lng, lat]
  peakTempF: number;
  peakTempC: number;
  meanTempF: number;
  baselineRuralF: number;
  deltaF: number;
  riskLevel: "Low" | "Moderate" | "High" | "Critical";
  surfaceType: ThermalPointProperties["surfaceType"];
  censusTract: string;
  primaryCause: string;
  recommendedAction: string;
  estimatedCoolingPotentialF: number;
  pointCount: number;
}

/**
 * Calculates approximate distance in meters between two [lng, lat] coordinates using Haversine formula.
 */
function haversineDistanceMeters(
  coord1: [number, number],
  coord2: [number, number]
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371000; // Earth radius in meters
  const dLat = toRad(coord2[1] - coord1[1]);
  const dLng = toRad(coord2[0] - coord1[0]);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(coord1[1])) *
      Math.cos(toRad(coord2[1])) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function deriveCauseAndAction(
  surfaceType: ThermalPointProperties["surfaceType"],
  deltaF: number
): {
  primaryCause: string;
  recommendedAction: string;
  estimatedCoolingPotentialF: number;
} {
  if (surfaceType === "commercial_roof") {
    return {
      primaryCause:
        "Low-albedo commercial bitumastic roofs & lack of evaporative vegetative cover",
      recommendedAction:
        "Deploy high-SRI elastomeric Cool Roof coatings + perimeter urban forestry",
      estimatedCoolingPotentialF: Number(Math.min(9.5, deltaF * 0.31).toFixed(1)),
    };
  }
  if (surfaceType === "asphalt") {
    return {
      primaryCause:
        "Impervious dark asphalt arterial expanse & high thermal-mass freight yards",
      recommendedAction:
        "Install high-density street tree canopy corridors + reflective solar pavement",
      estimatedCoolingPotentialF: Number(Math.min(8.8, deltaF * 0.28).toFixed(1)),
    };
  }
  return {
    primaryCause:
      "Dense building canyon geometry trapping longwave infrared radiation",
    recommendedAction:
      "Integrate pocket bioswales, misting micro-water features & shade canopy",
    estimatedCoolingPotentialF: Number(Math.min(7.4, deltaF * 0.25).toFixed(1)),
  };
}

/**
 * Statistical peak-clustering algorithm that analyzes a ThermalFeatureCollection
 * and detects the top N spatially distinct Urban Heat Island (UHI) hotspots.
 */
export function detectTopHotspots(
  data: ThermalFeatureCollection,
  topN: number = 5,
  minSeparationMeters: number = 900
): Hotspot[] {
  if (!data || !data.features || data.features.length === 0) {
    return [];
  }

  // Filter for elevated UHI anomalies (deltaF >= 4.0°F) and sort descending by temperatureF
  const candidates = [...data.features]
    .filter((f) => f.properties.deltaF >= 4.0)
    .sort((a, b) => b.properties.temperatureF - a.properties.temperatureF);

  const clusters: {
    peakFeature: ThermalFeature;
    members: ThermalFeature[];
  }[] = [];

  for (const feature of candidates) {
    const coords = feature.geometry.coordinates;

    // Check if this point belongs to an already-discovered peak cluster
    let assignedCluster = null;
    for (const cluster of clusters) {
      const dist = haversineDistanceMeters(
        coords,
        cluster.peakFeature.geometry.coordinates
      );
      if (dist < minSeparationMeters || cluster.peakFeature.properties.areaName === feature.properties.areaName) {
        assignedCluster = cluster;
        break;
      }
    }

    if (assignedCluster) {
      assignedCluster.members.push(feature);
    } else {
      clusters.push({
        peakFeature: feature,
        members: [feature],
      });
    }
  }

  // Convert top N clusters into structured Hotspot telemetry objects
  return clusters.slice(0, topN).map((cluster, index) => {
    const peak = cluster.peakFeature;
    const props = peak.properties;

    const totalTemp = cluster.members.reduce(
      (acc, m) => acc + m.properties.temperatureF,
      0
    );
    const meanTempF = Number((totalTemp / cluster.members.length).toFixed(1));

    let riskLevel: Hotspot["riskLevel"] = "Moderate";
    if (props.deltaF >= 22.0 || props.temperatureF >= 104.0) {
      riskLevel = "Critical";
    } else if (props.deltaF >= 14.0 || props.temperatureF >= 95.0) {
      riskLevel = "High";
    } else if (props.deltaF < 8.0) {
      riskLevel = "Low";
    }

    const { primaryCause, recommendedAction, estimatedCoolingPotentialF } =
      deriveCauseAndAction(props.surfaceType, props.deltaF);

    return {
      id: `hotspot-${index + 1}-${props.id}`,
      rank: index + 1,
      name: props.areaName,
      coordinates: peak.geometry.coordinates,
      peakTempF: props.temperatureF,
      peakTempC: props.temperatureC,
      meanTempF,
      baselineRuralF: props.baselineRuralF,
      deltaF: props.deltaF,
      riskLevel,
      surfaceType: props.surfaceType,
      censusTract: props.censusTract || `Tract 10${index + 1}.00`,
      primaryCause,
      recommendedAction,
      estimatedCoolingPotentialF,
      pointCount: cluster.members.length,
    };
  });
}
