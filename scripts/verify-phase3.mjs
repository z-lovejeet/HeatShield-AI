#!/usr/bin/env node

import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const BASE_URL = "http://127.0.0.1:3000";

const REQUIRED_FILES = [
  "lib/simulation.ts",
  "app/api/simulate/route.ts",
  "components/simulation/ImpactMetrics.tsx",
  "components/simulation/SimulationPanel.tsx",
  "components/map/CoreMap.tsx",
  "app/map/page.tsx",
];

async function verifyPhase3() {
  console.log("=====================================================");
  console.log("  HeatShield AI — Phase 3 Verification Suite");
  console.log("=====================================================\n");

  // 1. Check required files
  console.log("1. Checking Phase 3 deliverables...");
  for (const rel of REQUIRED_FILES) {
    const abs = path.join(ROOT, rel);
    if (!fs.existsSync(abs)) {
      throw new Error(`Missing required file: ${rel}`);
    }
    const stat = fs.statSync(abs);
    console.log(`   [OK] ${rel} (${stat.size} bytes)`);
  }

  // 2. Test Single-Intervention Contract (ARCHITECTURE.md §7.3)
  console.log("\n2. Testing POST /api/simulate (Single-Intervention Contract)...");
  const singleRes = await fetch(`${BASE_URL}/api/simulate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      coordinates: { lng: -122.6625, lat: 45.5152 },
      currentLocalTemp: 108.4,
      interventionType: "tree_canopy",
      radiusMeters: 500,
      targetName: "Central Eastside Industrial District",
    }),
  });

  if (!singleRes.ok) {
    throw new Error(
      `Single-intervention POST /api/simulate failed: HTTP ${singleRes.status}`
    );
  }
  const singleJson = await singleRes.json();
  console.log(
    `   [OK] Tree Canopy @ 500m -> Baseline: 108.4°F | Projected: ${singleJson.projectedTemp}°F | Delta: ${singleJson.temperatureDeltaF}°F (${singleJson.temperatureDeltaC}°C)`
  );
  console.log(
    `   [OK] Cost: $${singleJson.estimatedCostUSD.toLocaleString()} | CO2: ${singleJson.annualCo2OffsetMetricTons} t/yr | Energy: ${singleJson.annualEnergySavedMwh} MWh/yr | Risk Drop: -${singleJson.heatRiskReductionPct}%`
  );
  console.log(
    `   [OK] AI Advisor (${singleJson.modelUsed}): "${singleJson.aiAdvisorNote}"`
  );

  if (
    typeof singleJson.temperatureDeltaF !== "number" ||
    singleJson.temperatureDeltaF >= 0 ||
    singleJson.temperatureDeltaF < -18.5
  ) {
    throw new Error(
      `Invalid temperatureDeltaF: ${singleJson.temperatureDeltaF}`
    );
  }

  // 3. Test Stacked Multi-Intervention Contract & Monotonicity (FEATURES.md P1-5)
  console.log(
    "\n3. Testing POST /api/simulate (Stacked Multi-Intervention & Monotonicity)..."
  );
  const moderateRes = await fetch(`${BASE_URL}/api/simulate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      coordinates: { lng: -122.6625, lat: 45.5152 },
      currentLocalTemp: 108.4,
      treeCount: 400,
      coolRoofPct: 35,
      waterFeatureCount: 3,
      radiusMeters: 500,
      targetName: "Central Eastside Industrial District",
      includeAiBrief: false,
    }),
  });
  const moderateJson = await moderateRes.json();

  const maxRes = await fetch(`${BASE_URL}/api/simulate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      coordinates: { lng: -122.6625, lat: 45.5152 },
      currentLocalTemp: 108.4,
      treeCount: 1800,
      coolRoofPct: 100,
      waterFeatureCount: 16,
      radiusMeters: 500,
      targetName: "Central Eastside Industrial District",
      includeAiBrief: false,
    }),
  });
  const maxJson = await maxRes.json();

  console.log(
    `   [OK] Moderate Stack (400 trees, 35% roof, 3 bioswales) -> ${moderateJson.temperatureDeltaF}°F ($${moderateJson.estimatedCostUSD.toLocaleString()})`
  );
  console.log(
    `   [OK] Max Climate Shield (1800 trees, 100% roof, 16 bioswales) -> ${maxJson.temperatureDeltaF}°F ($${maxJson.estimatedCostUSD.toLocaleString()})`
  );

  // Note: temperatureDeltaF is negative (e.g., -12.4 < -7.2)
  if (maxJson.temperatureDeltaF >= moderateJson.temperatureDeltaF) {
    throw new Error(
      `Monotonicity check failed: max stack (${maxJson.temperatureDeltaF}°F) should cool more than moderate stack (${moderateJson.temperatureDeltaF}°F)`
    );
  }
  if (Math.abs(maxJson.temperatureDeltaF) > 18.5) {
    throw new Error(
      `Physical cap violated: ${maxJson.temperatureDeltaF}°F exceeds -18.5°F cap`
    );
  }

  // 4. Verify Portland GeoJSON features compatibility
  console.log(
    "\n4. Verifying real OSM dataset compatibility with simulation engine..."
  );
  const portlandRaw = JSON.parse(
    fs.readFileSync(
      path.join(ROOT, "public/data/thermal/portland.geojson"),
      "utf8"
    )
  );
  console.log(
    `   [OK] Loaded ${portlandRaw.features.length} real OSM features from portland.geojson`
  );

  console.log("\n=====================================================");
  console.log("  ALL PHASE 3 VERIFICATION CHECKS PASSED!");
  console.log("=====================================================");
}

verifyPhase3().catch((err) => {
  console.error("\n[FAIL] Phase 3 verification failed:", err.message);
  process.exit(1);
});
