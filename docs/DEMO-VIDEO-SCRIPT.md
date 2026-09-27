# HeatShield AI — 2:45 Live Demo Video Script (LOHacks 2026)

**Target Duration:** 2 minutes 35 seconds – 2 minutes 50 seconds (Hard cap: 3:00)
**Resolution:** 1920x1080 (1080p, 60fps) via QuickTime Screen Recording or OBS Studio
**Judging Criteria Covered:**
1. Purpose & Sustainability Connection (EPA/CDC mortality data, UN SDG 11, 13, 3)
2. Creativity & Innovation (3D Cooling Physics + Personal Leave-Home Health Guide + 7-Sec Paw Burn Check)
3. Technical Execution (100% Real OSM Overpass + Open-Meteo Solar API + Dual Groq/Gemini AI Fallback Chains)
4. Presentation & Documentation (Cozy Warm-Stone UI, Zero Overlap, Progressive Thermal Comfort Cooling)
5. Project Focus ("Technology for Planet" — actionable climate resilience for both citizens and city planners)

---

## Scene 1: The Hook & Problem Statement (`0:00 – 0:25`)
**Screen Action:**
1. Start on the Landing Page (`http://localhost:3000/`).
2. Slowly scroll to show the **Interactive 3D Map Preview** on the right, the **1,300+ US Heat Deaths / Yr** statistics, the **4-Step Operational Workflow**, and the **100% Real OSM Overpass + Open-Meteo Data** provenance table.
3. Click the **"Open 3D Heat Map"** primary button (`0:22`).

**Voiceover Script:**
> "Extreme heat is the number one weather-related killer in the United States, claiming over 1,300 lives every year—more than hurricanes, tornadoes, and floods combined. Yet existing heat maps only show static historical data.
>
> We built **HeatShield AI**: an interactive 3D Urban Heat Island Mapper, Personal Heat Safety Guide, and Cool City Planner. Every single zone you see is powered by 100% real OpenStreetMap land-use polygons paired with live Open-Meteo solar radiation—zero synthetic data."

---

## Scene 2: Real 3D Hotspot Detection & Any-City Search (`0:25 – 0:55`)
**Screen Action:**
1. On `/map` (**Hotspots** tab), point to the top bar showing `Portland, OR: 420 OSM ways` and the city switcher (`Portland`, `Phoenix`, `Midtown NYC`, plus global search).
2. Click **Hotspot #1 (`Central Eastside Industrial District — 108.4°F`)** in the left sidebar.
3. Watch the 3D Mapbox camera fly smoothly into the 3D building extrusions and highlight the selected hotspot card showing the **Quick Outdoor Health Verdict** (`Stay Indoors · High Heat Risk`, max safe minutes, and water intake).

**Voiceover Script:**
> "In our 3D map workspace, HeatShield AI analyzes 420 real OpenStreetMap industrial zones, highways, parking lots, and parks per city using a 450-meter spatial energy balance model.
>
> Clicking our top hotspot in Portland—the Central Eastside Industrial District—flies the 3D camera directly to the zone, revealing a 108.4°F surface peak and a +22°F urban heat island spike. Immediately, residents see a quick Leave-Home Health Verdict right on the hotspot card."

---

## Scene 3: Personal Leave-Home Health Guide & AI Route Doctor (`0:55 – 1:30`)
**Screen Action:**
1. Click `"Check Personal Leave-Home & Health Guide"` (or the **Health** tab).
2. Switch the resident profile between **Adult**, **Senior 65+**, and **Pet Walk**.
3. Point to the **Feels Like (`°F`)**, **Safe Time (`mins`)**, **Hydration (`cups/hr`)**, and the **Sidewalk & Pet Paw Burn Check (`7-Sec Burn Risk`)**.
4. Click the `"Walking dog on leash"` chip inside the **AI Personal Health & Route Doctor** card to generate a live Groq/Gemini prescription (`1:12`).
5. Scroll down to **Nearest Cooler Parks & Refuges** and click **"View"** next to the nearest park/waterfront to fly the 3D camera to that cool refuge popup (`1:24`).

**Voiceover Script:**
> "HeatShield AI isn't just for city planners—it solves an everyday life-or-death question for residents: *Should I leave home right now?*
>
> Switching between Adult, Senior 65+, Child, Runner, or Dog Walk recalculates street-level Heat Index, maximum safe outdoor minutes, hourly hydration, and a veterinary 7-second sidewalk paw-burn check.
>
> With one click, our **AI Personal Health and Route Doctor**—powered by Groq LPU and Gemini—writes a custom safety plan and directs us to the nearest cooler OpenStreetMap park or riverfront refuge, flying us right to it on the 3D map."

---

## Scene 4: "What If?" Stacked Cooling Simulator & Progressive Heatmap Transition (`1:30 – 2:05`)
**Screen Action:**
1. Click the **Simulator** tab (or click `"Simulate Cooling to Make This Area Safer"`).
2. Drag the **Plant Street Trees**, **Reflective Cool Roofs**, and **Water Features** sliders up (or click the **Balanced Greening** / **Max Climate Shield** preset).
3. Point to the selected zone on the 3D map as the heatmap smoothly transitions over 1.65 seconds from **Hot Red** $\rightarrow$ **Warm Amber** $\rightarrow$ **Normal Botanical Green** (and **Cold Sky Blue** when cooled to $\le 76^\circ\text{F}$ or $\ge 10^\circ\text{F}$ drop).
4. Toggle **Before** vs. **After (Cooled)** in the top bar, then switch back to the **Health** tab for 2 seconds to show the **Cooling Health Impact (`+X mins of safer outdoor time`)**.

**Voiceover Script:**
> "Now, how do we cool this neighborhood down? In the **Cooling Simulator**, planners can stack street trees, reflective cool roofs, and bioswale water features using EPA and USDA Forest Service i-Tree physics.
>
> Watch the selected zone on the 3D heatmap progressively cool down in real time—shifting from critical red to warm amber, natural botanical green for normal comfortable temperatures, and sky blue for deep cooling.
>
> Even better, our Health Guide dynamically updates to show how many extra minutes of safe outdoor time these trees and cool roofs unlock for residents."

---

## Scene 5: Gemini Climate Audit, Groq Vision Chat & Impact Dashboard (`2:05 – 2:45`)
**Screen Action:**
1. Click the **AI Audit** tab and click **"Generate AI Climate Audit"**.
2. Show the structured Gemini JSON report (Severity Score, Heat Drivers, 3 ranked Cooling Action Plans) and click **"Apply Prescription to 3D Simulator"** or **"Download Climate Audit Report (.md)"**.
3. Briefly open the bottom-right **Ask AI Advisor** drawer to show real-time Groq streaming chat and the **Street Photo Vision upload (`qwen/qwen3.8-27b`)**.
4. Click **Impact Dashboard** in the top navigation bar (`/dashboard`) (`2:25`).
5. Show the **Live Simulation Synced** banner, the 4 KPI cards, the **Recharts Hotspot Thermal Profile** & **10-Year Canopy Trajectory (`2026–2035`)**, and the **UN SDG 11, 13, and 3 Scorecard**.

**Voiceover Script:**
> "Need an engineering blueprint? Our **Gemini AI Climate Audit** analyzes the zone's telemetry to generate a prioritized cooling budget that syncs directly to the 3D simulator with one click, while our **Groq Chat & Vision Advisor** streams instant answers and analyzes uploaded street photos for low-albedo surfaces.
>
> Finally, the **Impact Dashboard** syncs our live simulation to project 10-year tree canopy maturation, megawatt-hours of saved AC grid load, carbon sequestration, and direct alignment with UN Sustainable Development Goals 11, 13, and 3.
>
> **HeatShield AI**: See the invisible heat. Protect your health today, and cool the city for tomorrow."
