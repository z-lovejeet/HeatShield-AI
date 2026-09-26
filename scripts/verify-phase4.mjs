#!/usr/bin/env node

import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const BASE_URL = "http://127.0.0.1:3000";

const REQUIRED_FILES = [
  "lib/prompts.ts",
  "lib/groq.ts",
  "lib/gemini.ts",
  "app/api/chat/route.ts",
  "app/api/analyze/route.ts",
  "components/chat/ChatAdvisor.tsx",
  "components/chat/AnalysisReport.tsx",
  "app/map/page.tsx",
];

async function verifyPhase4() {
  console.log("=====================================================");
  console.log("  HeatShield AI — Phase 4 Verification Suite");
  console.log("=====================================================\n");

  // 1. Check required files
  console.log("1. Checking Phase 4 deliverables...");
  for (const rel of REQUIRED_FILES) {
    const abs = path.join(ROOT, rel);
    if (!fs.existsSync(abs)) {
      throw new Error(`Missing required file: ${rel}`);
    }
    const stat = fs.statSync(abs);
    console.log(`   [OK] ${rel} (${stat.size} bytes)`);
  }

  // 2. Test Live Streaming Chat Advisor (POST /api/chat via Groq LPU)
  console.log("\n2. Testing POST /api/chat (Groq Streaming Chat Advisor)...");
  const startChat = Date.now();
  const chatRes = await fetch(`${BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: [
        {
          role: "user",
          content:
            "In 2 sentences, what is the most cost-effective cooling intervention for Central Eastside Industrial District?",
        },
      ],
      mapContext: {
        cityName: "Portland, OR",
        parcelCount: 420,
        selectedHotspot: {
          rank: 1,
          name: "Central Eastside Industrial District",
          peakTempF: 108.4,
          deltaF: 29.8,
          riskLevel: "Critical",
          surfaceType: "commercial_roof",
          primaryCause: "Dense dark warehouse roofs and impervious asphalt",
        },
      },
    }),
  });

  if (!chatRes.ok) {
    throw new Error(`POST /api/chat failed: HTTP ${chatRes.status}`);
  }

  const chatModel = chatRes.headers.get("X-Model-Used") || "unknown";
  const chatText = await chatRes.text();
  const elapsedChatMs = Date.now() - startChat;

  if (!chatText || chatText.trim().length < 20) {
    throw new Error(`POST /api/chat returned empty or too short response: "${chatText}"`);
  }

  console.log(
    `   [OK] Streamed ${chatText.length} chars in ${elapsedChatMs}ms using model: ${chatModel}`
  );
  console.log(
    `   [OK] Sample Stream Output: "${chatText.replace(/\s+/g, " ").slice(0, 180)}..."`
  );

  // 3. Test Structured Gemini Area Analysis Report (POST /api/analyze)
  console.log("\n3. Testing POST /api/analyze (Gemini Structured JSON Audit)...");
  const startAnalyze = Date.now();
  const analyzeRes = await fetch(`${BASE_URL}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      cityName: "Portland, OR",
      parcelCount: 420,
      targetHotspot: {
        rank: 1,
        name: "Central Eastside Industrial District",
        peakTempF: 108.4,
        meanTempF: 99.6,
        deltaF: 29.8,
        riskLevel: "Critical",
        surfaceType: "commercial_roof",
        primaryCause: "Dense dark warehouse roofs and impervious asphalt",
      },
      averageTemp: 99.6,
      populationDensityEstimate: 7400,
    }),
  });

  if (!analyzeRes.ok) {
    throw new Error(`POST /api/analyze failed: HTTP ${analyzeRes.status}`);
  }

  const report = await analyzeRes.json();
  const elapsedAnalyzeMs = Date.now() - startAnalyze;

  console.log(
    `   [OK] Generated JSON report in ${elapsedAnalyzeMs}ms using model: ${report.modelUsed}`
  );
  console.log(
    `   [OK] Area: "${report.areaName}" | Severity: ${report.severityScore}/10 (${report.severityLabel}) | Peak: ${report.peakTemperature}°F`
  );
  console.log(
    `   [OK] Causes: ${report.primaryCauses?.length} | Risks: ${report.riskFactors?.length} | Interventions: ${report.recommendedInterventions?.length} | SDGs: ${report.sdgAlignment?.length}`
  );
  console.log(
    `   [OK] Top Recommendation: "${report.recommendedInterventions?.[0]?.type}" (${report.recommendedInterventions?.[0]?.coolingPotential}, ${report.recommendedInterventions?.[0]?.estimatedCost})`
  );

  if (
    !report.areaName ||
    typeof report.severityScore !== "number" ||
    !Array.isArray(report.recommendedInterventions) ||
    report.recommendedInterventions.length < 3
  ) {
    throw new Error("Analysis report JSON schema validation failed");
  }

  console.log("\n=====================================================");
  console.log("  ALL PHASE 4 VERIFICATION CHECKS PASSED!");
  console.log("=====================================================");
}

verifyPhase4().catch((err) => {
  console.error("\n[FAIL] Phase 4 verification failed:", err.message);
  process.exit(1);
});
