export interface MapContextPayload {
  cityName?: string;
  parcelCount?: number;
  selectedHotspot?: {
    rank?: number;
    name: string;
    peakTempF: number;
    deltaF: number;
    riskLevel: string;
    surfaceType: string;
    primaryCause: string;
  } | null;
  topHotspots?: Array<{
    rank: number;
    name: string;
    peakTempF: number;
    deltaF: number;
    riskLevel?: string;
    surfaceType?: string;
  }>;
  simulation?: {
    treeCount: number;
    coolRoofPct: number;
    waterFeatureCount: number;
    radiusMeters: number;
    baselinePeakTempF: number;
    projectedPeakTempF: number;
    temperatureDeltaF: number;
    temperatureDeltaC: number;
    estimatedCostUSD: number;
    annualCo2OffsetMetricTons: number;
    annualEnergySavedMwh: number;
    heatRiskReductionPct: number;
  } | null;
}

export interface RecommendedInterventionItem {
  type: string;
  priority: "High" | "Medium" | "Low";
  estimatedCost: string;
  coolingPotential: string;
  implementationTime: string;
  description: string;
  suggestedSimConfig?: {
    treeCount: number;
    coolRoofPct: number;
    waterFeatureCount: number;
  };
}

export interface AnalysisReportData {
  // AGENT-ARCHITECTURE.md §2.2 fields
  areaName: string;
  severityScore: number; // 1-10
  severityLabel: "Low" | "Moderate" | "High" | "Critical";
  averageTemperature: number; // °F
  peakTemperature: number; // °F
  primaryCauses: string[];
  riskFactors: string[];
  recommendedInterventions: RecommendedInterventionItem[];
  projectedImpact: string;
  sdgAlignment: string[];

  // ARCHITECTURE.md §7.2 compatibility aliases
  severityLevel: "Low" | "Moderate" | "High" | "Critical";
  primaryRiskFactors: string[];
  recommendedIntervention: string;
  executiveSummary: string;
  modelUsed?: string;
}

/**
 * Exact Chat Advisor System Prompt from AGENT-ARCHITECTURE.md §2.1
 */
export const CHAT_ADVISOR_SYSTEM_PROMPT = `You are HeatShield AI Advisor — an expert urban climatologist and sustainability consultant.

ROLE: Help users understand urban heat islands (UHI), evaluate cooling interventions, and make data-driven decisions about urban cooling strategies.

GUIDELINES:
- Be concise and actionable. Lead with the key insight, then provide supporting data.
- Always quantify when possible: temperatures in °F and °C, costs in USD, areas in sq meters/acres.
- Reference real research and EPA/NOAA data when discussing UHI effects.
- When recommending interventions, rank by cost-effectiveness (cooling per dollar).
- Cooling strategies you should know deeply: tree canopy expansion, cool/green roofs, reflective pavements, urban parks, water features, shade structures, building orientation.
- If the user provides coordinates or area context, tailor your response to that specific location.
- Never fabricate specific study citations. Use general "EPA research shows..." or "studies indicate..." framing.

TONE: Professional, crisp, and accessible. A knowledgeable urban climate engineer, not an academic lecturer. Format key metrics clearly using concise bullet points where helpful.`;

/**
 * Exact Analysis Report System Prompt from AGENT-ARCHITECTURE.md §2.2 + ARCHITECTURE.md §7.2
 */
export const ANALYSIS_REPORT_SYSTEM_PROMPT = `You are an expert urban heat island analyst. Given thermal data and geographic context for a specific area, generate a comprehensive analysis report.

OUTPUT FORMAT — strict JSON only (no markdown code fences, no extra prose):
{
  "areaName": "string — name of the analyzed area",
  "severityScore": 9,
  "severityLabel": "Critical",
  "averageTemperature": 96.4,
  "peakTemperature": 108.5,
  "primaryCauses": ["array of 3-4 specific physical causes of heat accumulation in this zone"],
  "riskFactors": ["array of 3-4 vulnerable population and infrastructure risk factors"],
  "recommendedInterventions": [
    {
      "type": "string — e.g., 'High-SRI Elastomeric Cool Roof Retrofit'",
      "priority": "High",
      "estimatedCost": "string — e.g., '$120,000–$185,000'",
      "coolingPotential": "string — e.g., '-4.2°F to -6.1°F (-2.3°C to -3.4°C)'",
      "implementationTime": "string — e.g., '4–9 months'",
      "description": "string — 1-2 sentence engineering explanation of ROI and placement"
    }
  ],
  "projectedImpact": "string — 2-3 sentence executive paragraph describing cumulative cooling, energy savings, and health protection if all interventions are applied",
  "sdgAlignment": [
    "SDG 11: Sustainable Cities & Communities (Target 11.7 & 11.b)",
    "SDG 13: Climate Action (Target 13.1 Urban Thermal Resilience)",
    "SDG 3: Good Health & Well-Being (Target 3.9 Heat Mortality Reduction)"
  ]
}

RULES:
- Base all estimates on peer-reviewed UHI research, EPA Urban Heat Island Compendium, and USDA Forest Service i-Tree guidelines.
- Be realistic about costs and timelines.
- Always recommend exactly 3 interventions ranked by cost-effectiveness (High priority first).
- Severity score: 1-3 = Low, 4-5 = Moderate, 6-7 = High, 8-10 = Critical.`;

/**
 * Vision Analysis System Prompt for qwen/qwen3.8-27b (AGENT-ARCHITECTURE.md §2.4)
 */
export const VISION_ADVISOR_SYSTEM_PROMPT = `You are HeatShield Vision Analyst (powered by Qwen 3.8 Vision on Groq).
Analyze the uploaded urban street photograph, satellite view, or thermal map screenshot:
1. Identify heat-trapping impervious materials visible (dark asphalt, low-albedo commercial roofs, unshaded concrete corridors).
2. Estimate the surface albedo deficiency and solar absorption risk.
3. Recommend 3 specific, high-ROI physical cooling interventions (street tree canopy placement, high-SRI cool roof coating, permeable bioswales) with projected localized °F/°C surface cooling and estimated municipal cost.`;

/**
 * Builds a dynamic telemetry context block to append to the system prompt so the AI
 * knows the exact real-time map state on /map.
 */
export function buildMapContextPrompt(ctx?: MapContextPayload): string {
  if (!ctx) return "";

  const lines: string[] = [
    "\n\n--- LIVE HEATSHIELD 3D WORKBENCH TELEMETRY ---",
  ];

  if (ctx.cityName) {
    lines.push(
      `Active Metro Sector: ${ctx.cityName} (${ctx.parcelCount || 420} real OpenStreetMap land-use & asphalt ways mapped)`
    );
  }

  if (ctx.selectedHotspot) {
    const h = ctx.selectedHotspot;
    lines.push(
      `Currently Focused Hotspot: #${h.rank || 1} "${h.name}" | Peak LST: ${h.peakTempF.toFixed(1)}°F (+${h.deltaF.toFixed(1)}°F UHI anomaly) | Risk: ${h.riskLevel} | Surface: ${h.surfaceType} | Primary Driver: ${h.primaryCause}`
    );
  }

  if (ctx.topHotspots && ctx.topHotspots.length > 0) {
    const summary = ctx.topHotspots
      .slice(0, 5)
      .map(
        (h) =>
          `#${h.rank} ${h.name} (${h.peakTempF.toFixed(1)}°F, +${h.deltaF.toFixed(1)}°F UHI)`
      )
      .join("; ");
    lines.push(`Top Detected UHI Hotspots in Viewport: ${summary}`);
  }

  if (
    ctx.simulation &&
    (ctx.simulation.treeCount > 0 ||
      ctx.simulation.coolRoofPct > 0 ||
      ctx.simulation.waterFeatureCount > 0)
  ) {
    const s = ctx.simulation;
    lines.push(
      `Active "What-If?" Cooling Simulation (${s.radiusMeters}m radius): ${s.treeCount} urban trees + ${s.coolRoofPct}% high-SRI cool roofs + ${s.waterFeatureCount} bioswale water features -> Peak Surface Cooling: ${s.temperatureDeltaF.toFixed(1)}°F (${s.temperatureDeltaC.toFixed(1)}°C), dropping peak from ${s.baselinePeakTempF.toFixed(1)}°F to ${s.projectedPeakTempF.toFixed(1)}°F | Capital Cost: $${s.estimatedCostUSD.toLocaleString()} | CO2 Offset: ${s.annualCo2OffsetMetricTons} t/yr | HVAC Energy Saved: ${s.annualEnergySavedMwh} MWh/yr | Heat Mortality Risk Drop: -${s.heatRiskReductionPct}%`
    );
  } else {
    lines.push(
      `Active Simulation Status: Unmitigated baseline (0 trees, 0% cool roofs, 0 bioswales currently applied).`
    );
  }

  lines.push(
    "Use these exact live telemetry figures when answering questions about the current city, hotspot, or simulation."
  );

  return lines.join("\n");
}
