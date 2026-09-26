import { NextRequest, NextResponse } from "next/server";
import { callGeminiLite, GEMINI_LITE_MODEL } from "@/lib/gemini";

export interface SimulateRequest {
  // Single intervention contract (ARCHITECTURE.md §7.3)
  interventionType?: "tree_canopy" | "cool_roof" | "water_feature";
  coordinates?: {
    lng: number;
    lat: number;
  };
  radiusMeters?: number;
  currentLocalTemp?: number;

  // Stacked multi-intervention parameters (FEATURES.md P1-5)
  treeCount?: number;
  coolRoofPct?: number;
  waterFeatureCount?: number;
  targetName?: string;
  surfaceType?: string;
  includeAiBrief?: boolean;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as SimulateRequest;

    const radiusMeters = Math.max(300, Number(body.radiusMeters || 800));
    const currentLocalTemp = Number(body.currentLocalTemp || 108.0);
    const targetName = body.targetName || "Selected Urban Sector";

    // Map single interventionType if stacked sliders aren't provided
    let treeCount = Number(body.treeCount ?? 0);
    let coolRoofPct = Number(body.coolRoofPct ?? 0);
    let waterFeatureCount = Number(body.waterFeatureCount ?? 0);

    if (
      treeCount === 0 &&
      coolRoofPct === 0 &&
      waterFeatureCount === 0 &&
      body.interventionType
    ) {
      if (body.interventionType === "tree_canopy") treeCount = 600;
      else if (body.interventionType === "cool_roof") coolRoofPct = 65;
      else if (body.interventionType === "water_feature") waterFeatureCount = 8;
    }

    // Physical cooling computation matching lib/simulation.ts
    const treeCoolingF = 8.2 * Math.pow(Math.min(1, treeCount / 1600), 0.72);
    const roofCoolingF =
      9.4 * Math.pow(Math.min(1, coolRoofPct / 100), 0.85);
    const waterCoolingF =
      4.8 * Math.pow(Math.min(1, waterFeatureCount / 20), 0.78);

    const rawCombinedF = treeCoolingF + roofCoolingF + waterCoolingF;
    const peakReductionF = Number(
      (18.5 * (1 - Math.exp(-rawCombinedF / 16.5)) * 0.88).toFixed(1)
    );

    const projectedTempF = Number(
      Math.max(72.0, currentLocalTemp - peakReductionF).toFixed(1)
    );
    const temperatureDeltaF = Number((-peakReductionF).toFixed(1));
    const temperatureDeltaC = Number((-peakReductionF * (5 / 9)).toFixed(1));

    const affectedAreaSqMeters = Math.round(
      Math.PI * Math.pow(Math.min(radiusMeters, 3500), 2)
    );

    const estimatedCostUSD = Math.round(
      treeCount * 320 + coolRoofPct * 3800 + waterFeatureCount * 14500
    );

    const annualEnergySavedMwh = Number(
      (treeCount * 0.085 + coolRoofPct * 3.4 + waterFeatureCount * 1.6).toFixed(
        1
      )
    );

    const annualCo2OffsetMetricTons = Number(
      (treeCount * 0.022 + annualEnergySavedMwh * 0.42).toFixed(1)
    );

    const heatRiskReductionPct = Number(
      Math.min(68.0, peakReductionF * 4.4).toFixed(1)
    );

    // Deterministic engineering fallback note
    let aiAdvisorNote = `Deploying ${treeCount} street trees, ${coolRoofPct}% high-SRI cool roof coverage, and ${waterFeatureCount} bioswale water features across "${targetName}" yields a projected ${temperatureDeltaF}°F (${temperatureDeltaC}°C) peak surface reduction, offsetting ${annualCo2OffsetMetricTons}t CO₂/yr at a capital cost of $${estimatedCostUSD.toLocaleString()}.`;
    let modelUsed = "deterministic-heuristic";

    // Call Gemini 3.5 Flash Lite (Simulation Advisor Agent per AGENT-ARCHITECTURE.md §2.3)
    if (body.includeAiBrief !== false && process.env.GEMINI_API_KEY) {
      try {
        const prompt = `Target Area: ${targetName} (Baseline Peak Surface Temp: ${currentLocalTemp}°F, Surface Type: ${body.surfaceType || "impervious urban"}).
Proposed Intervention Stack within ${radiusMeters}m radius:
- Urban Trees Planted: ${treeCount}
- Commercial Cool Roof Retrofit: ${coolRoofPct}%
- Permeable Bioswales / Water Features: ${waterFeatureCount}
Calculated Outcome: ${temperatureDeltaF}°F (${temperatureDeltaC}°C) surface cooling, Projected Peak: ${projectedTempF}°F, Capital Cost: $${estimatedCostUSD.toLocaleString()}, Annual Energy Saved: ${annualEnergySavedMwh} MWh, CO2 Offset: ${annualCo2OffsetMetricTons} metric tons/yr.

Write a crisp, authoritative 2-sentence municipal engineering assessment of this specific intervention mix's ROI and thermal effectiveness. Do not use markdown bullet points.`;

        const res = await callGeminiLite(
          prompt,
          "You are HeatShield Simulation Advisor (Gemini 3.5 Flash Lite). Provide a concise, technical 2-sentence urban climate engineering ROI insight with exact numbers."
        );
        const text = res.text()?.trim();
        if (text && text.length > 20) {
          aiAdvisorNote = text;
          modelUsed = GEMINI_LITE_MODEL;
        }
      } catch {
        // Keep deterministic engineering note on rate-limit or timeout
      }
    }

    return NextResponse.json({
      projectedTemp: projectedTempF,
      temperatureDelta: temperatureDeltaC, // ARCHITECTURE.md §7.3 (°C delta)
      temperatureDeltaF,
      temperatureDeltaC,
      affectedAreaSqMeters,
      estimatedCostUSD,
      annualCo2OffsetMetricTons,
      annualEnergySavedMwh,
      heatRiskReductionPct,
      aiAdvisorNote,
      modelUsed,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Simulation failed" },
      { status: 500 }
    );
  }
}
