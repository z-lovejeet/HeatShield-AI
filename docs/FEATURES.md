# HeatShield AI Features & Roadmap

This document outlines the required features for HeatShield AI, organized by priority. It provides detailed acceptance criteria to serve as an exact specification for AI coding agents.

## P0 — MUST SHIP (Core MVP)
*Without these features, the project is incomplete.*

### 1. Interactive Heatmap
- **Description:** Full-screen Mapbox map with thermal heatmap overlay showing urban temperature data.
- **Component/Page:** `app/map/page.tsx` -> `components/Map.tsx`
- **Dependencies:** Mapbox GL JS setup, sample temperature GeoJSON data.
- **Complexity:** High
- **Acceptance Criteria:**
  - When the map page loads, a full-screen map must render seamlessly.
  - A color gradient layer (cool/blue to hot/red) representing temperature must overlay the map.
  - The map must support smooth zooming, panning, and rotation without significant lag.
  - Hardcoded or realistic sample thermal data must be visible for at least 3 demo cities (e.g., Los Angeles, Phoenix, New York).

### 2. City Search & Navigation
- **Description:** Search bar to find and fly to any major US city.
- **Component/Page:** `components/CitySearch.tsx` (placed over the Map)
- **Dependencies:** Interactive Heatmap (P0-1), Mapbox Geocoding API.
- **Complexity:** Medium
- **Acceptance Criteria:**
  - User can type a city name into the search bar, which must display autocomplete suggestions.
  - Selecting a city must trigger a smooth camera fly-to animation centering on the target city coordinates.

### 3. Heat Hotspot Detection
- **Description:** Algorithm identifies and marks the hottest zones in the current viewport.
- **Component/Page:** `components/HotspotMarkers.tsx`
- **Dependencies:** Interactive Heatmap (P0-1).
- **Complexity:** Medium
- **Acceptance Criteria:**
  - System must identify the top 3-5 hottest localized areas within the current visible bounds.
  - These areas must be marked with custom pulsing Mapbox markers.
  - Clicking a marker must open a Mapbox popup containing: Area Name, Average Temperature, and Risk Level (e.g., High, Critical).

### 4. Legend & Layer Controls
- **Description:** Temperature scale legend and basic map layer controls.
- **Component/Page:** `components/MapControls.tsx`
- **Dependencies:** Interactive Heatmap (P0-1).
- **Complexity:** Low
- **Acceptance Criteria:**
  - A fixed overlay element must display the temperature scale (gradient bar with degree labels).
  - A toggle switch must allow the user to show/hide the thermal heatmap layer.
  - A slider must adjust the opacity of the thermal heatmap layer from 0% to 100%.

### 5. "What If?" Simulation Panel
- **Description:** Sidebar panel to apply cooling interventions and visualize projected temperature drops.
- **Component/Page:** `components/SimulationSidebar.tsx`
- **Dependencies:** Interactive Heatmap (P0-1).
- **Complexity:** High
- **Acceptance Criteria:**
  - Sidebar must offer at least 3 intervention types: "Plant Trees", "Install Cool Roofs", "Add Water Features".
  - User must be able to adjust intensity/quantity using a slider.
  - Applying the intervention must visually update the heatmap colors in a simulated localized radius, showing a projected temperature reduction.
  - UI must display a "Before/After" metric summary (e.g., "-2.5°C average reduction").

### 6. AI Chat Advisor
- **Description:** Slide-out chat panel powered by Groq for answering sustainability and cooling queries.
- **Component/Page:** `components/AiChatAdvisor.tsx`
- **Dependencies:** Groq API integration.
- **Complexity:** Medium
- **Acceptance Criteria:**
  - A floating action button opens a chat sidebar.
  - Chat interface must include at least 3 clickable pre-loaded suggestion prompts.
  - User inputs must be sent to the Groq API.
  - The API response must stream smoothly into the chat UI.
  - The AI prompt context must restrict answers to urban cooling, sustainability, and the current map state.

### 7. Landing Page
- **Description:** Promotional homepage to hook users and introduce the project.
- **Component/Page:** `app/page.tsx`
- **Dependencies:** None
- **Complexity:** Low
- **Acceptance Criteria:**
  - Hero section must include a strong hook statistic about urban heat islands.
  - Must include a clear project description and a prominent CTA button.
  - Clicking the CTA must navigate the user to `/map`.
  - Design must be clean, modern, and utilize the chosen Tailwind/shadcn ui aesthetic.

---

## P1 — SHOULD SHIP
*Strengthens the project significantly.*

### 1. Vulnerability Overlay
- **Description:** Toggle layer showing vulnerable population density.
- **Component/Page:** `components/MapControls.tsx` & `components/Map.tsx`
- **Dependencies:** Interactive Heatmap (P0-1).
- **Complexity:** Medium
- **Acceptance Criteria:**
  - Users can toggle a "Vulnerability Map" which overlays census tracts colored by demographic risk (e.g., elderly, low-income).
  - Clicking a tract shows basic demographic stats in a popup.

### 2. Impact Metrics Dashboard
- **Description:** Dedicated page summarizing total project/simulation impact.
- **Component/Page:** `app/dashboard/page.tsx`
- **Dependencies:** None (can use mocked data if simulations aren't persistent).
- **Complexity:** Medium
- **Acceptance Criteria:**
  - Page must display at least 4 key stats cards (e.g., hotspots identified, estimated lives saved).
  - Must include at least one chart (e.g., Recharts) showing temperature distribution.

### 3. Historical Temperature Comparison
- **Description:** Compare current vs. 5-year-ago temperatures.
- **Component/Page:** `components/TimeSlider.tsx`
- **Dependencies:** Interactive Heatmap (P0-1), historical dataset.
- **Complexity:** Medium
- **Acceptance Criteria:**
  - User can toggle between "Current" and "-5 Years" datasets.
  - The map heatmap layer must transition to show the corresponding dataset.

### 4. AI-Powered Analysis Report
- **Description:** Button that generates a structured Gemini API analysis of the selected area.
- **Component/Page:** `components/AnalysisPanel.tsx`
- **Dependencies:** Gemini API integration.
- **Complexity:** High
- **Acceptance Criteria:**
  - Clicking "Generate Report" sends current viewport stats to Gemini.
  - System must parse the response and render a structured view containing: Top Risks, Recommended Interventions, Priority Ranking, and Estimated Costs.

### 5. Multiple Intervention Stacking
- **Description:** Allow placing multiple interventions simultaneously.
- **Component/Page:** `components/SimulationSidebar.tsx`
- **Dependencies:** "What If?" Simulation Panel (P0-5).
- **Complexity:** High
- **Acceptance Criteria:**
  - Users can select multiple intervention types and apply them together.
  - The simulated temperature drop must reflect the cumulative effect on the map.

---

## P2 — NICE TO HAVE
*Only build if ahead of schedule.*

1. **Downloadable PDF Report** — Export the AI analysis report as a formatted PDF.
2. **Mobile Responsive Design** — UI layouts explicitly handle mobile screen sizes seamlessly.
3. **Dark/Light Theme Toggle** — Implement `next-themes` for system-wide light/dark mode.
4. **Social Sharing** — Generate a URL containing simulation state parameters to share results.
5. **Animation/Transitions** — Framer Motion page transitions and skeleton loaders.
6. **Real-time Weather Integration** — Fetch OpenWeatherAPI data to show current temp in the UI.

---

## EXPLICITLY NOT BUILDING (Cut List)
- User authentication / accounts
- Database / persistent storage
- Real-time satellite data processing
- Mobile native app
- Multi-language support
- Payment / monetization
- Admin panel
