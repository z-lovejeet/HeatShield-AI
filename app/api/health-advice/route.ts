import { NextResponse } from "next/server";
import { callGroqWithFallback } from "@/lib/groq";
import { callGeminiJSON } from "@/lib/gemini";

export interface HealthAdviceRequest {
  cityName: string;
  zoneName: string;
  profileId: "adult" | "senior" | "child" | "athlete" | "pet";
  profileLabel: string;
  surfaceTempF: number;
  feelsLikeF: number;
  verdict: "go" | "caution" | "stay_home";
  maxSafeMinutes: number;
  waterCupsPerHour: number;
  pavementTempF: number;
  treeCanopyPct: number;
  imperviousPct: number;
  coolingAppliedF?: number;
  nearestRefuges?: Array<{
    name: string;
    distanceMiles: number;
    temperatureF: number;
    coolerByF: number;
  }>;
  userScenario?: string;
}

export interface AIHealthPrescription {
  doctorVerdict: string;
  personalizedPlan: string;
  coolestRouteAdvice: string;
  hydrationProtocol: string;
  warningSignsForProfile: string[];
  essentialChecklist: string[];
  modelUsed: string;
}

const HEALTH_DOCTOR_SYSTEM_PROMPT = `You are the HeatShield AI Environmental Health & Biometeorology Physician Advisor.
Given real-time neighborhood thermal telemetry (surface temperature, street-level feels-like temperature, tree canopy %, pavement contact temperature, and nearby cooler park/water refuges) plus the user's vulnerability profile and planned activity, generate a concise, medically grounded, actionable outdoor safety prescription.

Return ONLY a valid JSON object matching this exact schema (no markdown fences):
{
  "doctorVerdict": "1 crisp sentence stating whether they should go out right now or reschedule, tailored to their activity and profile",
  "personalizedPlan": "2-3 sentences of specific guidance for their exact activity/condition in this neighborhood, referencing the feels-like temperature and max safe exposure minutes",
  "coolestRouteAdvice": "1-2 sentences naming the specific nearest cool refuge/park from the telemetry and how to use shade corridors or avoid high-asphalt blocks",
  "hydrationProtocol": "1-2 sentences detailing exact pre-departure and hourly water/electrolyte intake (or pet water bowl cadence)",
  "warningSignsForProfile": [
    "Specific early symptom 1 for this profile",
    "Specific early symptom 2 for this profile",
    "Specific early symptom 3 for this profile"
  ],
  "essentialChecklist": [
    "Specific gear/prep item 1",
    "Specific gear/prep item 2",
    "Specific gear/prep item 3"
  ]
}`;

function buildDeterministicHealthPrescription(
  body: HealthAdviceRequest
): AIHealthPrescription {
  const topRefuge = body.nearestRefuges?.[0];
  const scenarioText = body.userScenario?.trim() || `general outdoor time as a ${body.profileLabel}`;

  const refugeSentence = topRefuge
    ? `Route directly toward ${topRefuge.name} (${topRefuge.distanceMiles} mi away), where surface temperatures are ${topRefuge.coolerByF}°F cooler (${topRefuge.temperatureF}°F) than ${body.zoneName}.`
    : `Stay on tree-shaded residential blocks and avoid exposed parking lots (${body.imperviousPct}% impervious cover in ${body.zoneName}).`;

  const isStayHome = body.verdict === "stay_home";
  const isCaution = body.verdict === "caution";

  return {
    doctorVerdict: isStayHome
      ? `Postpone "${scenarioText}" in ${body.zoneName} right now (${body.feelsLikeF}°F street feels-like) and shift your outing to before 10:00 AM or after 7:00 PM.`
      : isCaution
      ? `Proceed with "${scenarioText}" in ${body.zoneName} in short ${body.maxSafeMinutes}-minute intervals with mandatory shade breaks.`
      : `Conditions in ${body.zoneName} (${body.feelsLikeF}°F street feels-like) are safe for "${scenarioText}" with standard sun and hydration precautions.`,
    personalizedPlan: `At ${body.surfaceTempF}°F peak surface temperature (${body.feelsLikeF}°F pedestrian feels-like) with ${body.treeCanopyPct}% canopy shade, continuous outdoor exposure for ${body.profileLabel} should not exceed ${body.maxSafeMinutes} minutes without cooling recovery. ${
      body.pavementTempF >= 125
        ? `Asphalt contact temperature is ${body.pavementTempF}°F—strictly avoid direct skin or pet paw contact with dark pavement.`
        : `Pavement contact temperature is ${body.pavementTempF}°F.`
    }`,
    coolestRouteAdvice: refugeSentence,
    hydrationProtocol:
      body.profileId === "pet"
        ? `Offer cool fresh water every 15–20 minutes (${body.waterCupsPerHour} cups/hr) and wet paw pads with cool water if panting increases.`
        : `Drink 8 oz of cool water 20 minutes before leaving home, then maintain ${body.waterCupsPerHour} cups/hr (${body.waterCupsPerHour * 8} oz/hr) with electrolytes if sweating heavily.`,
    warningSignsForProfile:
      body.profileId === "pet"
        ? [
            "Excessive heavy panting or drooling with bright red gums",
            "Lifting paws repeatedly or hesitating to step on asphalt",
            "Lethargy, stumbling, or seeking shade under parked cars",
          ]
        : body.profileId === "senior"
        ? [
            "Sudden lightheadedness, dizziness, or unusual fatigue",
            "Rapid pulse, headache, or clammy skin despite minimal exertion",
            "Confusion, nausea, or muscle cramping in calves/shoulders",
          ]
        : [
            "Early headache, dizziness, or unusual shortness of breath",
            "Heavy sweating followed by muscle cramps or nausea",
            "Flushed skin, rapid heart rate, or difficulty focusing",
          ],
    essentialChecklist:
      body.profileId === "pet"
        ? [
            "Collapsible water bowl + 16 oz cool water bottle",
            "7-second back-of-hand pavement test before every street crossing",
            "Breathable mesh harness (avoid heavy collars) or protective dog booties",
          ]
        : [
            `Insulated bottle with at least ${Math.max(16, body.waterCupsPerHour * 8)} oz of cool water + electrolytes`,
            "Light-colored, loose-fitting UPF/breathable clothing and wide-brim hat",
            "Fully charged phone and planned cool-down stop after " + body.maxSafeMinutes + " minutes",
          ],
    modelUsed: "noaa-clinical-biometeorology-engine",
  };
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as HealthAdviceRequest;

    const refugeListText =
      body.nearestRefuges && body.nearestRefuges.length > 0
        ? body.nearestRefuges
            .map(
              (r) =>
                `${r.name} (${r.distanceMiles} mi away, ${r.temperatureF}°F, ${r.coolerByF}°F cooler)`
            )
            .join("; ")
        : "None within immediate radius";

    const userPrompt = `Generate a personalized outdoor health & safety prescription for:
- City: ${body.cityName}
- Selected Zone: ${body.zoneName}
- Resident Profile: ${body.profileLabel} (${body.profileId})
- Planned Activity / Health Question: "${body.userScenario || `Should I leave home right now in ${body.zoneName}?`}"
- Peak Surface Temp: ${body.surfaceTempF}°F
- Street-Level Feels-Like Temp: ${body.feelsLikeF}°F
- Pavement / Sidewalk Contact Temp: ${body.pavementTempF}°F
- Tree Canopy Cover: ${body.treeCanopyPct}% | Impervious Surface: ${body.imperviousPct}%
- Active Cooling Simulation Applied: -${(body.coolingAppliedF || 0).toFixed(1)}°F
- Baseline Safety Verdict: ${body.verdict.toUpperCase()} (Max safe continuous outdoor time: ${body.maxSafeMinutes} mins, Water intake: ${body.waterCupsPerHour} cups/hr)
- Nearest Cooler Parks & Refuges: ${refugeListText}`;

    // 1. Primary: Groq LPU with JSON mode for fast interactive response
    try {
      const { response, modelUsed } = await callGroqWithFallback(
        [
          { role: "system", content: HEALTH_DOCTOR_SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        {
          temperature: 0.35,
          max_tokens: 900,
          response_format: { type: "json_object" },
        }
      );

      const content = (response as any)?.choices?.[0]?.message?.content;
      if (content) {
        const parsed = JSON.parse(content);
        return NextResponse.json({
          doctorVerdict: parsed.doctorVerdict,
          personalizedPlan: parsed.personalizedPlan,
          coolestRouteAdvice: parsed.coolestRouteAdvice,
          hydrationProtocol: parsed.hydrationProtocol,
          warningSignsForProfile: Array.isArray(parsed.warningSignsForProfile)
            ? parsed.warningSignsForProfile.slice(0, 3)
            : [],
          essentialChecklist: Array.isArray(parsed.essentialChecklist)
            ? parsed.essentialChecklist.slice(0, 3)
            : [],
          modelUsed: `Groq (${modelUsed})`,
        } satisfies AIHealthPrescription);
      }
    } catch (groqErr) {
      console.warn("[HealthAdvice] Groq failed, falling back to Gemini JSON:", groqErr);
    }

    // 2. Secondary Fallback: Gemini JSON fallback chain
    try {
      const { response, modelUsed } = await callGeminiJSON(
        userPrompt,
        HEALTH_DOCTOR_SYSTEM_PROMPT
      );
      const text = response.text();
      if (text) {
        const parsed = JSON.parse(text);
        return NextResponse.json({
          doctorVerdict: parsed.doctorVerdict,
          personalizedPlan: parsed.personalizedPlan,
          coolestRouteAdvice: parsed.coolestRouteAdvice,
          hydrationProtocol: parsed.hydrationProtocol,
          warningSignsForProfile: Array.isArray(parsed.warningSignsForProfile)
            ? parsed.warningSignsForProfile.slice(0, 3)
            : [],
          essentialChecklist: Array.isArray(parsed.essentialChecklist)
            ? parsed.essentialChecklist.slice(0, 3)
            : [],
          modelUsed: `Gemini (${modelUsed})`,
        } satisfies AIHealthPrescription);
      }
    } catch (geminiErr) {
      console.warn("[HealthAdvice] Gemini failed, using deterministic clinical engine:", geminiErr);
    }

    // 3. Final deterministic clinical fallback
    return NextResponse.json(buildDeterministicHealthPrescription(body));
  } catch (error: any) {
    console.error("[HealthAdvice] Route error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to generate health advice" },
      { status: 500 }
    );
  }
}
