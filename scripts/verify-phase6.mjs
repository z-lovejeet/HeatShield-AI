import fs from "node:fs";
import path from "node:path";

const BASE_URL = process.env.BASE_URL || "http://127.0.0.1:3000";
const ROOT = process.cwd();

let passed = 0;
let failed = 0;

function assert(condition, label, detail = "") {
  if (condition) {
    console.log(`   [PASS] ${label}${detail ? ` — ${detail}` : ""}`);
    passed++;
  } else {
    console.error(`   [FAIL] ${label}${detail ? ` — ${detail}` : ""}`);
    failed++;
  }
}

async function runPhase6Verification() {
  console.log("=====================================================");
  console.log("  HeatShield AI — Phase 6 & Demo Readiness E2E Suite");
  console.log("=====================================================\n");

  // 1. Check all Phase 6 & Submission Deliverables
  console.log("1. Checking Phase 6 & Demo Readiness files...");
  const requiredFiles = [
    "app/page.tsx",
    "app/map/page.tsx",
    "app/dashboard/page.tsx",
    "lib/health-advisor.ts",
    "components/health/HealthSafetyPanel.tsx",
    "app/api/health-advice/route.ts",
    ".env.example",
    "docs/DEMO-VIDEO-SCRIPT.md",
    "docs/DEVPOST-SUBMISSION.md",
  ];

  for (const rel of requiredFiles) {
    const full = path.join(ROOT, rel);
    const exists = fs.existsSync(full);
    const size = exists ? fs.statSync(full).size : 0;
    assert(exists && size > 100, `${rel}`, `${size} bytes`);
  }

  // 2. Verify 1,260 Real OpenStreetMap Features (0 Synthetic)
  console.log("\n2. Auditing 100% Real OpenStreetMap Thermal Datasets...");
  const cities = ["portland", "phoenix", "nyc"];
  let totalFeatures = 0;
  let syntheticCount = 0;

  for (const city of cities) {
    const geoPath = path.join(ROOT, "public", "data", "thermal", `${city}.geojson`);
    const raw = JSON.parse(fs.readFileSync(geoPath, "utf8"));
    const count = raw.features?.length || 0;
    totalFeatures += count;
    for (const f of raw.features || []) {
      if (f.properties?.isSynthetic) syntheticCount++;
    }
    assert(count === 420, `${city}.geojson has 420 real OSM features`, `count=${count}`);
  }
  assert(
    totalFeatures === 1260 && syntheticCount === 0,
    "Total 1,260 Real OSM Ways with 0 synthetic noise",
    `total=${totalFeatures}, synthetic=${syntheticCount}`
  );

  // 3. Test Frontend Routes & Deep Links
  console.log("\n3. Testing Frontend Pages & Cross-Page Deep Links...");
  const routesToTest = [
    "/",
    "/map",
    "/map?city=phoenix&tab=health",
    "/map?city=nyc&tab=simulate&trees=900&roofs=55&water=6",
    "/dashboard",
  ];

  for (const route of routesToTest) {
    const res = await fetch(`${BASE_URL}${route}`);
    assert(res.status === 200, `GET ${route}`, `HTTP ${res.status}`);
  }

  // 4. Test Runtime API Endpoints
  console.log("\n4. Testing Runtime AI & Physics API Endpoints...");

  // 4a. POST /api/simulate
  const simRes = await fetch(`${BASE_URL}/api/simulate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      treeCount: 800,
      coolRoofPct: 50,
      waterFeatureCount: 5,
      radiusMeters: 600,
      targetName: "Central Eastside Industrial District",
      currentLocalTemp: 108.4,
      includeAiBrief: false,
    }),
  });
  const simData = await simRes.json();
  assert(
    simRes.status === 200 && simData.temperatureDeltaF < 0,
    "POST /api/simulate",
    `Delta: ${simData.temperatureDeltaF}°F | Cost: $${simData.estimatedCostUSD?.toLocaleString()}`
  );

  // 4b. POST /api/health-advice
  const healthRes = await fetch(`${BASE_URL}/api/health-advice`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      cityName: "Portland, OR",
      zoneName: "Central Eastside Industrial District",
      profileId: "senior",
      profileLabel: "Seniors (65+) & Sensitive",
      surfaceTempF: 108.4,
      feelsLikeF: 99.6,
      verdict: "stay_home",
      maxSafeMinutes: 15,
      waterCupsPerHour: 2.5,
      pavementTempF: 126,
      treeCanopyPct: 8,
      imperviousPct: 89,
      coolingAppliedF: 0,
      nearestRefuges: [
        {
          name: "Willamette River Esplanade",
          distanceMiles: 0.4,
          temperatureF: 83.2,
          coolerByF: 25.2,
        },
      ],
      userScenario: "30-min walk or errands",
    }),
  });
  const healthData = await healthRes.json();
  assert(
    healthRes.status === 200 && Boolean(healthData.doctorVerdict),
    "POST /api/health-advice",
    `Model: ${healthData.modelUsed} | Verdict: "${healthData.doctorVerdict?.slice(0, 65)}..."`
  );

  // 4c. POST /api/analyze
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
        meanTempF: 101.2,
        deltaF: 22.4,
        riskLevel: "Critical",
        surfaceType: "industrial",
        primaryCause: "High impervious asphalt and zero tree canopy",
        coordinates: [-122.6615, 45.5189],
      },
      averageTemp: 101.2,
      populationDensityEstimate: 7400,
    }),
  });
  const analyzeData = await analyzeRes.json();
  assert(
    analyzeRes.status === 200 &&
      Array.isArray(analyzeData.recommendedInterventions) &&
      analyzeData.recommendedInterventions.length >= 3,
    "POST /api/analyze",
    `Model: ${analyzeData.modelUsed} | Severity: ${analyzeData.severityScore}/10`
  );

  console.log("\n=====================================================");
  console.log(`  Summary: ${passed} passed, ${failed} failed`);
  console.log("=====================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase6Verification().catch((err) => {
  console.error("Verification failed with exception:", err);
  process.exit(1);
});
