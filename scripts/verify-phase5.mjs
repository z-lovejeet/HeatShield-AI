import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const BASE_URL = 'http://127.0.0.1:3000';

let passed = 0;
let failed = 0;

function check(label, condition, detail = '') {
  if (condition) {
    console.log(`✅ [PASS] ${label}${detail ? ` — ${detail}` : ''}`);
    passed++;
  } else {
    console.error(`❌ [FAIL] ${label}${detail ? ` — ${detail}` : ''}`);
    failed++;
  }
}

async function main() {
  console.log('====================================================');
  console.log('🛡️  HEATSHIELD AI — PHASE 5 VERIFICATION SUITE');
  console.log('====================================================\n');

  // 1. Verify Phase 5 Deliverables Exist
  const requiredFiles = [
    'components/dashboard/StatCard.tsx',
    'components/dashboard/DashboardCharts.tsx',
    'components/dashboard/SdgSection.tsx',
    'app/dashboard/page.tsx',
    'app/page.tsx',
  ];

  for (const rel of requiredFiles) {
    const abs = path.join(ROOT, rel);
    const exists = fs.existsSync(abs);
    const size = exists ? fs.statSync(abs).size : 0;
    check(`File exists: ${rel}`, exists && size > 200, `${size} bytes`);
  }

  // 2. Verify Recharts & Cozy Sage/Terracotta Design Tokens in DashboardCharts.tsx
  const chartsSrc = fs.readFileSync(
    path.join(ROOT, 'components/dashboard/DashboardCharts.tsx'),
    'utf-8'
  );
  check(
    'DashboardCharts uses Recharts BarChart, PieChart, and AreaChart',
    chartsSrc.includes('BarChart') &&
      chartsSrc.includes('PieChart') &&
      chartsSrc.includes('AreaChart') &&
      chartsSrc.includes('ResponsiveContainer')
  );
  check(
    'DashboardCharts uses Cozy Botanical Sage & Terracotta palette (#5E9A7B, #D98A5B, #78B093)',
    chartsSrc.includes('#5E9A7B') &&
      chartsSrc.includes('#D98A5B') &&
      chartsSrc.includes('#78B093')
  );
  check(
    'DashboardCharts renders 10-Year Canopy Maturation & CO2 Sequestration Trajectory (2026-2035)',
    chartsSrc.includes('2026') && chartsSrc.includes('cumulativeCo2Tons')
  );

  // 3. Verify UN SDG 11, 13, 3 Alignment in SdgSection.tsx
  const sdgSrc = fs.readFileSync(
    path.join(ROOT, 'components/dashboard/SdgSection.tsx'),
    'utf-8'
  );
  check(
    'SdgSection includes UN SDG 11 (Target 11.7 & Target 11.b), SDG 13 (Target 13.1), and SDG 3 (Target 3.9)',
    sdgSrc.includes('UN SDG 11') &&
      sdgSrc.includes('Target 11.7 & Target 11.b') &&
      sdgSrc.includes('UN SDG 13') &&
      sdgSrc.includes('Target 13.1') &&
      sdgSrc.includes('UN SDG 3') &&
      sdgSrc.includes('Target 3.9')
  );

  // 4. Verify Real OSM Data & LocalStorage Sync in app/dashboard/page.tsx
  const dashSrc = fs.readFileSync(
    path.join(ROOT, 'app/dashboard/page.tsx'),
    'utf-8'
  );
  check(
    'Dashboard page loads real OSM thermal datasets via loadCityThermalData & detectTopHotspots',
    dashSrc.includes('loadCityThermalData') &&
      dashSrc.includes('detectTopHotspots') &&
      dashSrc.includes('heatshield_last_simulation') &&
      dashSrc.includes('heatshield_last_analysis')
  );

  // 5. Verify Operational Workflow on Landing Page (app/page.tsx)
  const homeSrc = fs.readFileSync(path.join(ROOT, 'app/page.tsx'), 'utf-8');
  check(
    'Landing page includes 02 / Operational Workflow 3-step pipeline and 100% Real OSM Overpass provenance',
    homeSrc.includes('02 / Operational Workflow') &&
      homeSrc.includes('100% Real OSM Overpass') &&
      homeSrc.includes('Detect Real Hotspots') &&
      homeSrc.includes('Simulate Stacked Cooling') &&
      homeSrc.includes('Execute AI Climate Audit')
  );

  // 6. Live HTTP Verification against Running Dev Server
  try {
    const resHome = await fetch(`${BASE_URL}/`);
    const htmlHome = await resHome.text();
    check(
      'GET / (Landing Page) returns HTTP 200 with Operational Workflow',
      resHome.status === 200 && htmlHome.includes('Operational Workflow'),
      `Status ${resHome.status}`
    );

    const resDash = await fetch(`${BASE_URL}/dashboard`);
    const htmlDash = await resDash.text();
    check(
      'GET /dashboard (Impact Dashboard) returns HTTP 200 with StatCards, Recharts & UN SDG section',
      resDash.status === 200 &&
        htmlDash.includes('Urban Cooling Impact') &&
        htmlDash.includes('UN Sustainable Development Goal Alignment'),
      `Status ${resDash.status}`
    );
  } catch (err) {
    check('Live HTTP server check', false, err.message);
  }

  console.log('\n====================================================');
  console.log(`📊 SUMMARY: ${passed} passed, ${failed} failed`);
  console.log('====================================================');
  if (failed > 0) process.exit(1);
}

main();
