# HeatShield AI — Devpost Submission Package (Lake Oswego Hacks 2026)

**Project Name:** HeatShield AI
**Tagline:** See the invisible heat. Protect your health today, and cool the city for tomorrow.
**Track:** Hackathon (Technical) — Theme: "Technology for Planet" (Sustainability)

---

## Inspiration
Extreme heat is the **#1 weather-related killer in the United States**, claiming over **1,300 lives every year**—more than hurricanes, tornadoes, and floods combined (CDC/EPA). Because of the **Urban Heat Island (UHI)** effect, neighborhoods dominated by dark asphalt, industrial roofs, and treeless parking lots trap solar radiation and spike **1°F to 7°F+ hotter** than surrounding areas, with surface temperatures exceeding **115°F–125°F**.

While researchers have static historical satellite maps, everyday citizens and local community planners lack an interactive tool that answers two urgent questions:
1. **For Residents Today:** *"Is it safe for me, my grandparents, my kids, or my dog to leave home and walk in this specific area right now—and where is the nearest cooler park?"*
2. **For City Planners Tomorrow:** *"If we plant 800 street trees, retrofit 50% of roofs with high-albedo cool coatings, and add bioswales in this exact hotspot, how many degrees will it cool down, what will it cost, and how much carbon and grid energy will it save over 10 years?"*

---

## What It Does
**HeatShield AI** is a full-stack 3D urban climate intelligence and personal heat safety platform:

1. **100% Real OpenStreetMap + Open-Meteo 3D Thermal Mapper (`/map`)**
   - Maps **1,260 real OpenStreetMap land-use polygons/ways** across benchmark cities (Portland, Phoenix, Midtown NYC) and supports **live any-city scanning** via the OpenStreetMap Overpass API + Open-Meteo Solar Radiation (`shortwave_radiation`) & Wind API.
   - Computes a **450m spatial neighbor energy balance** to detect and rank the top 5 urban heat island hotspots with 3D building extrusions.

2. **Personal Leave-Home Health Guide & AI Route Doctor (`Health` Tab)**
   - Evaluates any neighborhood across **5 vulnerability profiles** (`General Adult`, `Senior 65+`, `Child / Stroller`, `Runner / Outdoor Worker`, and `Dog Walk / Pet`).
   - Calculates real-time **Leave-Home Verdicts** (`Safe to Go Outside`, `Use Caution Outdoors`, `Stay Indoors · High Heat Risk`), **Street Heat Index (`°F`)**, **Max Safe Continuous Outdoor Exposure (`mins`)**, **Hourly Hydration (`cups/hr` & `oz/hr`)**, **Best Time of Day to Leave Home**, and a **Sidewalk & Pet Paw 7-Second Burn Check**.
   - Scans the city's real OpenStreetMap features to find the **3 Nearest Cooler Parks & Waterfront Refuges** with 1-click 3D Map Fly-To, plus a live **AI Personal Health & Route Doctor** powered by Groq and Gemini.

3. **"What If?" Stacked Cooling Simulator (`Simulator` Tab)**
   - Lets users stack **Street Tree Canopy (`0–2,500 trees`)**, **High-SRI Cool Roofs (`0–100%`)**, and **Evaporative Water Features (`0–25 basins`)** grounded in **EPA Urban Heat Island Compendium** and **USDA Forest Service i-Tree** multipliers.
   - Progressively animates the selected zone's thermal comfort band on the 3D WebGL map (`Hot Red` $\rightarrow$ `Warm Amber` $\rightarrow$ `Normal Botanical Green` $\rightarrow$ `Cold Sky Blue`), with instant **Before vs. After** comparison, **Shareable Scenario URLs**, and live health feedback showing how many **extra safe outdoor minutes** the cooling intervention unlocks.

4. **Dual-Engine AI Climate Planner (Groq LPU + Google Gemini)**
   - **Gemini AI Climate Audit (`AI Audit` Tab):** Generates structured JSON engineering reports (Severity Score `1–10`, Primary Heat Drivers, 3 ranked Cooling Action Plans with budgets/timelines, 1-click Simulator prescription sync, and `.md` report export).
   - **Groq Streaming Chat & Street Vision Drawer:** Ultra-fast conversational sustainability advisor (`openai/gpt-oss-120b` $\rightarrow$ `20b`) plus multimodal street/satellite photo analysis (`qwen/qwen3.8-27b`) to identify dark asphalt and low-albedo roof surfaces.

5. **Municipal Impact & UN SDG Dashboard (`/dashboard`)**
   - Syncs live simulation and AI audit state to visualize **Baseline vs. Cooled Hotspot Temperatures (Bar Chart)**, **Intervention Attenuation Share (Donut Chart)**, and a **10-Year Canopy Maturation & Carbon Trajectory (`2026–2035` Area Chart)**, mapped directly to **UN SDG 11 (Targets 11.7 & 11.b)**, **SDG 13 (Target 13.1)**, and **SDG 3 (Target 3.9)**.

---

## How We Built It
- **Frontend & Framework:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Framer Motion, Recharts.
- **3D Geospatial Engine:** Mapbox GL JS (`v3`) with 3D building extrusions, radial concentric microclimate WebGL heatmaps, and Mapbox Geocoding.
- **Real Environmental Telemetry:** OpenStreetMap Overpass API (`landuse`, `highway`, `building`, `leisure=park`, `natural=water`) + Open-Meteo Forecast & Solar Radiation API.
- **Multi-Model AI Architecture with Resilient Fallback Chains:**
  - **Groq SDK:** `openai/gpt-oss-120b` $\rightarrow$ `openai/gpt-oss-20b` $\rightarrow$ `qwen/qwen3.8-27b` (plus cross-provider failover to Gemini).
  - **Google Generative AI SDK:** `gemini-3.8-flash` $\rightarrow$ `gemini-3.7-flash` $\rightarrow$ `gemini-3.6-flash` $\rightarrow$ `gemini-3.5-flash` $\rightarrow$ `gemini-3.5-flash-lite` $\rightarrow$ `gemini-2.5-flash`.

---

## Challenges We Ran Into
1. **Eliminating Synthetic Noise in Urban Heat Mapping:** Single-point land-use tags can make a small parking lot look hotter than a massive industrial railyard. We solved this by implementing a **450-meter Haversine spatial neighbor energy balance** so surrounded industrial corridors retain realistic thermal inertia while riverside parks create genuine cooling gradients.
2. **Progressive Thermal Comfort Visualization in WebGL:** When users cool a zone, snapping immediately to blue feels artificial—especially when a cooled zone is `82°F` (a comfortable normal temperature, not freezing cold). We engineered a custom 60fps cubic-eased WebGL interpolation engine that transitions through realistic thermal comfort bands (`Red/Orange` for Hot $\rightarrow$ `Amber` for Warm $\rightarrow$ `Botanical Green` for Normal temperature $\rightarrow$ `Sky Blue` strictly for Cold temperatures $\le 76^\circ\text{F}$ or deep $\ge 10^\circ\text{F}$ cooling).
3. **Zero-Overlap Cozy Ergonomics on Dense Data Screens:** Combining a 3D map, 4-tab control workbench, AI chat drawer, and thermal legends risked visual clutter. We redesigned the layout into a docked split-screen architecture with a warm-stone and botanical-sage palette (`#171614` / `#5E9A7B`) with zero overlapping controls.

---

## Accomplishments That We're Proud Of
- **100% Real OpenStreetMap & Open-Meteo Telemetry:** `1,260` real urban features across our benchmark cities (`0` synthetic points) plus live Overpass scanning for any searched city.
- **Bridging Municipal Planning & Personal Daily Health:** Connecting city-scale cooling physics directly to human biometeorology—showing how planting trees and cool roofs literally adds **+25 to +60 minutes of safe outdoor exposure** for seniors, children, and pets.
- **Zero-Downtime Multi-Model AI Resilience:** Automatic 6-tier Gemini and 3-tier Groq fallback chains ensure every AI audit, vision check, and health prescription succeeds even under heavy API rate limits.

---

## What's Next for HeatShield AI
- **Satellite Landsat-9 & ECOSTRESS Live Tile Ingestion:** Automated nightly ingestion of NASA ECOSTRESS 70m thermal rasters fused with OpenStreetMap parcel boundaries.
- **Shaded Pedestrian Routing:** Turn-by-turn walking and cycling navigation that routes residents and dog walkers along tree-shaded street corridors during heat advisories.
- **Municipal Grant & FEMA BRIC Export:** One-click generation of federal climate resilience grant applications pre-filled with census-tract vulnerability and i-Tree ROI calculations.
