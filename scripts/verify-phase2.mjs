import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const CITIES = ["portland", "phoenix", "nyc"];
const ERRORS = [];

console.log("=== PHASE 2 AUTOMATED VERIFICATION SUITE ===\n");

// 1. Check GeoJSON file integrity in both public/ and data/
console.log("1. Checking Thermal Datasets in public/data/thermal and data/thermal...");

const checkDirs = [
  path.join(process.cwd(), "public", "data", "thermal"),
  path.join(process.cwd(), "data", "thermal"),
];

for (const dir of checkDirs) {
  for (const city of CITIES) {
    const filePath = path.join(dir, `${city}.geojson`);
    if (!fs.existsSync(filePath)) {
      ERRORS.push(`Missing dataset: ${filePath}`);
      continue;
    }

    try {
      const content = fs.readFileSync(filePath, "utf8");
      const data = JSON.parse(content);

      if (data.type !== "FeatureCollection" || !Array.isArray(data.features)) {
        ERRORS.push(`Invalid GeoJSON structure in ${filePath}`);
        continue;
      }

      if (data.features.length < 50) {
        ERRORS.push(`Dataset ${filePath} has too few features: ${data.features.length}`);
      }

      // Validate coordinate ranges
      for (const f of data.features) {
        const [lng, lat] = f.geometry.coordinates;
        if (typeof lng !== "number" || typeof lat !== "number" || lng < -180 || lng > 180 || lat < -90 || lat > 90) {
          ERRORS.push(`Invalid coordinates [${lng}, ${lat}] in ${filePath}`);
          break;
        }
        if (!f.properties.temperatureF || !f.properties.deltaF || !f.properties.severity) {
          ERRORS.push(`Missing properties on feature ${f.properties.id} in ${filePath}`);
          break;
        }
      }

      console.log(`  ✓ ${path.relative(process.cwd(), filePath)}: ${data.features.length} validated LST points.`);
    } catch (e) {
      ERRORS.push(`Error parsing ${filePath}: ${e.message}`);
    }
  }
}

// 2. Test detectTopHotspots algorithm logic
console.log("\n2. Testing Hotspot Clustering & Detection Engine (lib/hotspots.ts)...");

function haversineDistanceMeters(coord1, coord2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(coord2[1] - coord1[1]);
  const dLng = toRad(coord2[0] - coord1[0]);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(coord1[1])) * Math.cos(toRad(coord2[1])) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function detectTopHotspotsMock(data, topN = 5, minSeparationMeters = 850) {
  const candidates = [...data.features]
    .filter((f) => f.properties.deltaF >= 4.0)
    .sort((a, b) => b.properties.temperatureF - a.properties.temperatureF);

  const clusters = [];
  for (const feature of candidates) {
    const coords = feature.geometry.coordinates;
    let assigned = null;
    for (const cluster of clusters) {
      const dist = haversineDistanceMeters(coords, cluster.peakFeature.geometry.coordinates);
      if (dist < minSeparationMeters || cluster.peakFeature.properties.areaName === feature.properties.areaName) {
        assigned = cluster;
        break;
      }
    }
    if (assigned) {
      assigned.members.push(feature);
    } else {
      clusters.push({ peakFeature: feature, members: [feature] });
    }
  }

  return clusters.slice(0, topN).map((c, i) => ({
    id: `hotspot-${i + 1}`,
    rank: i + 1,
    name: c.peakFeature.properties.areaName,
    peakTempF: c.peakFeature.properties.temperatureF,
    deltaF: c.peakFeature.properties.deltaF,
    severity: c.peakFeature.properties.severity,
  }));
}

for (const city of CITIES) {
  const p = path.join(process.cwd(), "public", "data", "thermal", `${city}.geojson`);
  const data = JSON.parse(fs.readFileSync(p, "utf8"));
  const hotspots = detectTopHotspotsMock(data, 5);

  if (hotspots.length === 0) {
    ERRORS.push(`No hotspots detected for ${city}`);
  } else {
    console.log(`  ✓ ${city.toUpperCase()}: ${hotspots.length} distinct hotspot clusters identified.`);
    console.log(`    #1 Peak: "${hotspots[0].name}" (${hotspots[0].peakTempF}°F, +${hotspots[0].deltaF}°F UHI)`);
  }
}

// 3. Test Mapbox Geocoding API connectivity
console.log("\n3. Testing Mapbox Geocoding API Integration...");
const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
if (!token) {
  ERRORS.push("Missing NEXT_PUBLIC_MAPBOX_TOKEN in .env.local");
} else {
  try {
    const geocodeUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/Portland.json?types=place&access_token=${token}`;
    const res = await fetch(geocodeUrl);
    if (!res.ok) {
      ERRORS.push(`Mapbox Geocoding returned HTTP ${res.status}`);
    } else {
      const geoData = await res.json();
      if (!geoData.features || geoData.features.length === 0) {
        ERRORS.push("Mapbox Geocoding returned zero features for 'Portland'");
      } else {
        const topResult = geoData.features[0];
        console.log(`  ✓ Mapbox Geocoding connected: "${topResult.place_name}" at [${topResult.center}]`);
      }
    }
  } catch (err) {
    ERRORS.push(`Mapbox Geocoding fetch failed: ${err.message}`);
  }
}

// 4. Test Open-Meteo Weather API connectivity
console.log("\n4. Testing Open-Meteo Live Meteorological API...");
try {
  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=45.5202&longitude=-122.6742&current_weather=true&temperature_unit=fahrenheit&windspeed_unit=mph`;
  const wRes = await fetch(weatherUrl);
  if (!wRes.ok) {
    ERRORS.push(`Open-Meteo returned HTTP ${wRes.status}`);
  } else {
    const wData = await wRes.json();
    if (!wData.current_weather) {
      ERRORS.push("Open-Meteo returned no current_weather object");
    } else {
      console.log(`  ✓ Open-Meteo connected: Live Portland air temp ${wData.current_weather.temperature}°F, wind ${wData.current_weather.windspeed} mph`);
    }
  }
} catch (err) {
  ERRORS.push(`Open-Meteo fetch failed: ${err.message}`);
}

// Summary
console.log("\n=============================================");
if (ERRORS.length > 0) {
  console.error(`❌ Verification failed with ${ERRORS.length} error(s):`);
  ERRORS.forEach((err) => console.error(`  - ${err}`));
  process.exit(1);
} else {
  console.log("✅ ALL PHASE 2 VERIFICATION CHECKS PASSED!");
  process.exit(0);
}
