import { ThermalFeatureCollection } from "./thermal-data";
import { haversineDistanceMeters } from "./simulation";

export type HealthProfileId =
  | "general"
  | "senior"
  | "child"
  | "worker"
  | "pet";

export interface HealthProfileMeta {
  id: HealthProfileId;
  label: string;
  shortLabel: string;
  description: string;
  heatSensitivityMultiplier: number; // >1 means faster heat stress onset
  baseHydrationOzPerHr: number;
}

export const HEALTH_PROFILES: HealthProfileMeta[] = [
  {
    id: "general",
    label: "General Adult",
    shortLabel: "Adult",
    description: "Standard walking, commuting, and neighborhood errands",
    heatSensitivityMultiplier: 1.0,
    baseHydrationOzPerHr: 16,
  },
  {
    id: "senior",
    label: "Seniors (65+) & Sensitive",
    shortLabel: "Senior 65+",
    description: "Higher sensitivity to heat stress, heart, or respiratory conditions",
    heatSensitivityMultiplier: 1.42,
    baseHydrationOzPerHr: 20,
  },
  {
    id: "child",
    label: "Children & Infants",
    shortLabel: "Child",
    description: "Faster heat absorption & closer to hot sidewalk radiation",
    heatSensitivityMultiplier: 1.35,
    baseHydrationOzPerHr: 14,
  },
  {
    id: "worker",
    label: "Runner / Outdoor Worker",
    shortLabel: "Runner / Work",
    description: "High exertion, exercise, or physical labor outdoors",
    heatSensitivityMultiplier: 1.28,
    baseHydrationOzPerHr: 28,
  },
  {
    id: "pet",
    label: "Dog Walk / Pet Owner",
    shortLabel: "Pet Walk",
    description: "Direct paw-pad contact with hot asphalt & lower evaporative cooling",
    heatSensitivityMultiplier: 1.45,
    baseHydrationOzPerHr: 16,
  },
];

export type LeaveHomeStatus = "safe" | "caution" | "danger";

export interface CoolRefugeSpot {
  id: string;
  name: string;
  surfaceType: string;
  temperatureF: number;
  coolerByF: number;
  distanceMiles: number;
  coordinates: [number, number];
}

export interface AreaHealthAssessment {
  profile: HealthProfileMeta;
  zoneName: string;
  status: LeaveHomeStatus;
  verdictBadge: string;
  verdictHeadline: string;
  verdictSummary: string;
  effectiveFeelsLikeF: number;
  baselineFeelsLikeF: number;
  surfaceTempF: number;
  baselineSurfaceTempF: number;
  activeCoolingDropF: number;
  maxSafeExposureMinutes: number;
  baselineMaxSafeMinutes: number;
  addedSafeMinutesFromCooling: number;
  hydrationOzPerHour: number;
  hydrationCupsPerHour: number;
  pavementSafety: {
    status: "safe" | "hot" | "burn_hazard";
    label: string;
    detail: string;
    maxPawContactSeconds: number | null;
  };
  dailyScheduleWindows: Array<{
    period: string;
    timeRange: string;
    status: LeaveHomeStatus;
    recommendation: string;
  }>;
  safetyChecklist: string[];
}

function computeSingleStateMetrics(
  surfaceTempF: number,
  uhiDeltaF: number,
  ambientAirTempF: number,
  profile: HealthProfileMeta
) {
  // Street-level Effective Feels-Like Temperature (combines air temp + mean radiant load from hot asphalt/roofs)
  const estimatedAirF = Math.max(ambientAirTempF, surfaceTempF - uhiDeltaF * 0.62);
  const radiantContributionF = Math.max(0, (surfaceTempF - estimatedAirF) * 0.34);
  const effectiveFeelsLikeF = Number(
    (
      estimatedAirF +
      radiantContributionF * (0.85 + (profile.heatSensitivityMultiplier - 1) * 0.5)
    ).toFixed(1)
  );

  // Determine Leave-Home Status thresholds adjusted by personal vulnerability profile
  const dangerThresholdF =
    profile.id === "senior" || profile.id === "pet"
      ? 92.0
      : profile.id === "child"
      ? 93.5
      : profile.id === "worker"
      ? 94.5
      : 97.5;

  const cautionThresholdF =
    profile.id === "senior" || profile.id === "pet"
      ? 81.5
      : profile.id === "child"
      ? 83.0
      : profile.id === "worker"
      ? 84.0
      : 86.5;

  let status: LeaveHomeStatus = "safe";
  if (
    effectiveFeelsLikeF >= dangerThresholdF ||
    (profile.id === "pet" && surfaceTempF >= 122)
  ) {
    status = "danger";
  } else if (
    effectiveFeelsLikeF >= cautionThresholdF ||
    (profile.id === "pet" && surfaceTempF >= 106)
  ) {
    status = "caution";
  }

  // Compute Max Safe Continuous Outdoor Exposure (minutes)
  const thermalStressExcess = Math.max(0, effectiveFeelsLikeF - 74);
  const rawMinutes =
    210 *
    Math.exp(-thermalStressExcess / (24 / profile.heatSensitivityMultiplier));
  const maxSafeExposureMinutes = Math.max(
    10,
    Math.min(180, Math.round(rawMinutes / 5) * 5)
  );

  return {
    effectiveFeelsLikeF,
    status,
    maxSafeExposureMinutes,
  };
}

/**
 * Evaluates whether a person should leave home and visit the selected area right now,
 * computing exposure limits, hydration needs, sidewalk burn risk, and optimal time windows.
 */
export function evaluateAreaHealthSafety(params: {
  zoneName: string;
  baselineSurfaceTempF: number;
  uhiDeltaF: number;
  coolingDropF?: number; // Positive magnitude of simulated cooling (e.g. 6.8)
  ambientAirTempF?: number;
  profileId: HealthProfileId;
}): AreaHealthAssessment {
  const {
    zoneName,
    baselineSurfaceTempF,
    uhiDeltaF,
    coolingDropF = 0,
    ambientAirTempF = 82.0,
    profileId,
  } = params;

  const profile =
    HEALTH_PROFILES.find((p) => p.id === profileId) || HEALTH_PROFILES[0];

  const activeCoolingDropF = Math.max(0, coolingDropF);
  const currentSurfaceTempF = Number(
    Math.max(68, baselineSurfaceTempF - activeCoolingDropF).toFixed(1)
  );
  const currentUhiDeltaF = Math.max(0.5, uhiDeltaF - activeCoolingDropF);

  const baselineState = computeSingleStateMetrics(
    baselineSurfaceTempF,
    uhiDeltaF,
    ambientAirTempF,
    profile
  );

  const currentState = computeSingleStateMetrics(
    currentSurfaceTempF,
    currentUhiDeltaF,
    ambientAirTempF,
    profile
  );

  const addedSafeMinutesFromCooling = Math.max(
    0,
    currentState.maxSafeExposureMinutes - baselineState.maxSafeExposureMinutes
  );

  // Verdict Copy
  let verdictBadge = "Safe to Go Outside";
  let verdictHeadline = `Comfortable conditions in ${zoneName} for ${profile.label.toLowerCase()}.`;
  let verdictSummary = `Street-level heat load feels like ${currentState.effectiveFeelsLikeF}°F (surface ${currentSurfaceTempF}°F). Safe for up to ${currentState.maxSafeExposureMinutes} minutes of continuous outdoor activity with normal hydration.`;

  if (currentState.status === "danger") {
    verdictBadge = "Stay Indoors · High Heat Risk";
    verdictHeadline = `Avoid unnecessary midday trips to ${zoneName} right now.`;
    verdictSummary =
      profile.id === "pet"
        ? `Asphalt surface reaches ${currentSurfaceTempF}°F with a ${currentState.effectiveFeelsLikeF}°F street heat index—high risk of paw-pad burns and rapid overheating. Postpone walks until after 7:30 PM or visit a shaded park refuge.`
        : profile.id === "senior"
        ? `Intense radiant heat (${currentState.effectiveFeelsLikeF}°F feels-like, ${currentSurfaceTempF}°F surface) creates high cardiovascular & heat exhaustion strain within ${currentState.maxSafeExposureMinutes} minutes. Stay in air-conditioned spaces until evening.`
        : `High urban heat island intensity (${currentState.effectiveFeelsLikeF}°F street feels-like). Limit essential outdoor errands to under ${currentState.maxSafeExposureMinutes} minutes, stay in shade, and drink water before leaving home.`;
  } else if (currentState.status === "caution") {
    verdictBadge = "Use Caution Outdoors";
    verdictHeadline = `Moderate heat stress in ${zoneName} — pace outdoor activity.`;
    verdictSummary = `Street level feels like ${currentState.effectiveFeelsLikeF}°F due to +${currentUhiDeltaF.toFixed(
      1
    )}°F urban surface heat retention. Keep continuous outdoor time under ${
      currentState.maxSafeExposureMinutes
    } minutes and take shade breaks.`;
  }

  // Hydration Calculation
  const heatHydrationFactor =
    currentState.status === "danger"
      ? 1.55
      : currentState.status === "caution"
      ? 1.25
      : 1.0;
  const hydrationOzPerHour = Math.round(
    profile.baseHydrationOzPerHr * heatHydrationFactor
  );
  const hydrationCupsPerHour = Number((hydrationOzPerHour / 8).toFixed(1));

  // Pavement & Pet Paw Burn Safety (Dermatological & Veterinary Thermal Conduction Thresholds)
  let pavementSafety: AreaHealthAssessment["pavementSafety"];
  if (currentSurfaceTempF >= 122) {
    pavementSafety = {
      status: "burn_hazard",
      label: `Burn Hazard (${currentSurfaceTempF}°F Asphalt)`,
      detail:
        "7-second rule failed: unshaded asphalt at this temperature can blister dog paws or bare skin in under 60 seconds. Walk strictly on grass or wait until sunset.",
      maxPawContactSeconds: 7,
    };
  } else if (currentSurfaceTempF >= 105) {
    pavementSafety = {
      status: "hot",
      label: `Hot Pavement (${currentSurfaceTempF}°F Surface)`,
      detail:
        "Uncomfortable for bare feet and sensitive pet paws during prolonged standing. Keep pets moving on shaded sidewalks or grass strips.",
      maxPawContactSeconds: 35,
    };
  } else {
    pavementSafety = {
      status: "safe",
      label: `Safe Surface Temp (${currentSurfaceTempF}°F)`,
      detail:
        "Sidewalk and street surfaces are within safe thermal contact limits for strollers, shoes, and pet paws.",
      maxPawContactSeconds: null,
    };
  }

  // Best Time of Day Windows to Leave Home
  const dailyScheduleWindows: AreaHealthAssessment["dailyScheduleWindows"] = [
    {
      period: "Morning Window (Best)",
      timeRange: "6:00 AM – 9:45 AM",
      status: "safe",
      recommendation:
        "Lowest asphalt radiant heat & UV. Ideal time to leave home for walks, exercise, or errands.",
    },
    {
      period: "Midday & Afternoon Peak",
      timeRange: "12:30 PM – 5:30 PM",
      status: currentState.status,
      recommendation:
        currentState.status === "danger"
          ? `Avoid leaving home unless essential (peaks at ${currentSurfaceTempF}°F surface heat).`
          : currentState.status === "caution"
          ? `Use shaded streets and limit outdoor trips to ${currentState.maxSafeExposureMinutes} mins.`
          : "Comfortable with normal sun protection and water.",
    },
    {
      period: "Evening Cool-Down",
      timeRange: "After 7:30 PM",
      status: currentUhiDeltaF > 26 ? "caution" : "safe",
      recommendation:
        currentUhiDeltaF > 26
          ? "Asphalt retains stored heat after sunset; choose tree-lined streets or waterfront paths."
          : "Safe, comfortable evening air for families, seniors, and dog walks.",
    },
  ];

  // Actionable Personal Safety Checklist
  const safetyChecklist: string[] = [];
  if (currentState.status === "danger") {
    safetyChecklist.push(
      `Limit continuous outdoor time in ${zoneName} to ${currentState.maxSafeExposureMinutes} mins max.`
    );
  } else {
    safetyChecklist.push(
      `Safe for up to ${currentState.maxSafeExposureMinutes} mins outdoors with periodic shade breaks.`
    );
  }
  safetyChecklist.push(
    `Drink ${hydrationCupsPerHour} cups (${hydrationOzPerHour} oz) of cool water per hour outdoors.`
  );
  if (profile.id === "pet") {
    safetyChecklist.push(
      pavementSafety.status === "safe"
        ? "Pavement is safe for paws; carry a collapsible water bowl."
        : "Press the back of your hand to asphalt for 7 seconds before walking your dog; use booties or grass."
    );
  } else if (profile.id === "senior") {
    safetyChecklist.push(
      "Wear loose, light-colored breathable clothing and check on neighbors without AC."
    );
  } else if (profile.id === "child") {
    safetyChecklist.push(
      "Avoid dark stroller canopies that trap heat; use a battery clip-on fan and wide-brim hat."
    );
  } else if (profile.id === "worker") {
    safetyChecklist.push(
      "Follow OSHA work/rest cycles: 15 mins shaded rest every hour and electrolyte replacement."
    );
  } else {
    safetyChecklist.push(
      "Wear light-colored breathable fabrics, UV sunglasses, and walk on the shaded side of the street."
    );
  }

  return {
    profile,
    zoneName,
    status: currentState.status,
    verdictBadge,
    verdictHeadline,
    verdictSummary,
    effectiveFeelsLikeF: currentState.effectiveFeelsLikeF,
    baselineFeelsLikeF: baselineState.effectiveFeelsLikeF,
    surfaceTempF: currentSurfaceTempF,
    baselineSurfaceTempF,
    activeCoolingDropF: Number(activeCoolingDropF.toFixed(1)),
    maxSafeExposureMinutes: currentState.maxSafeExposureMinutes,
    baselineMaxSafeMinutes: baselineState.maxSafeExposureMinutes,
    addedSafeMinutesFromCooling,
    hydrationOzPerHour,
    hydrationCupsPerHour,
    pavementSafety,
    dailyScheduleWindows,
    safetyChecklist,
  };
}

/**
 * Finds the 3 coolest nearby natural refuges (parks, tree canopy, river/waterfront parcels)
 * from the city's real OpenStreetMap thermal dataset so residents know where to cool down.
 */
export function findNearestCoolRefuges(
  thermalData: ThermalFeatureCollection | null,
  targetCoords: [number, number],
  referenceTempF: number,
  topN: number = 3
): CoolRefugeSpot[] {
  if (!thermalData || !thermalData.features || thermalData.features.length === 0) {
    return [];
  }

  // Filter for genuinely cool parcels (canopy, water, or low-temperature residential/park nodes)
  const coolCandidates = thermalData.features.filter((f) => {
    const p = f.properties;
    return (
      p.surfaceType === "canopy" ||
      p.surfaceType === "water" ||
      p.temperatureF <= referenceTempF - 8.0
    );
  });

  const pool =
    coolCandidates.length >= topN
      ? coolCandidates
      : [...thermalData.features].sort(
          (a, b) => a.properties.temperatureF - b.properties.temperatureF
        ).slice(0, 25);

  const scored = pool.map((f) => {
    const coords = f.geometry.coordinates;
    const distMeters = haversineDistanceMeters(targetCoords, coords);
    const distMiles = Number((distMeters / 1609.34).toFixed(2));
    const coolerByF = Number(
      Math.max(2.0, referenceTempF - f.properties.temperatureF).toFixed(1)
    );
    // Balance proximity and cooling relief
    const score = distMiles * 4.5 - coolerByF * 0.45;
    return {
      feature: f,
      distMiles,
      coolerByF,
      score,
    };
  });

  scored.sort((a, b) => a.score - b.score);

  const selected: CoolRefugeSpot[] = [];
  const usedNames = new Set<string>();

  for (const item of scored) {
    const rawName = item.feature.properties.areaName || "Urban Green Park Refuge";
    const cleanKey = rawName.toLowerCase();
    if (usedNames.has(cleanKey)) continue;
    usedNames.add(cleanKey);

    selected.push({
      id: item.feature.properties.id,
      name: rawName,
      surfaceType: item.feature.properties.surfaceType,
      temperatureF: Number(item.feature.properties.temperatureF.toFixed(1)),
      coolerByF: item.coolerByF,
      distanceMiles: Math.max(0.15, item.distMiles),
      coordinates: item.feature.geometry.coordinates,
    });

    if (selected.length >= topN) break;
  }

  return selected;
}
