# HeatShield AI — Development Roadmap

**Project:** HeatShield AI — Urban Heat Island Mapper & Cool City Planner
**Timeline:** 32-hour hackathon build window
**Stack:** Next.js 14+ (App Router), Tailwind CSS, shadcn/ui, Mapbox GL JS, Gemini API, Groq API
**Target:** Vercel Deployment

This roadmap serves as the Master Plan for AI agents during the hackathon. It outlines the step-by-step phases required to build the application from scratch to final deployment.

---

## PHASE 1: Project Foundation & Setup

- **Goal:** Establish a working Next.js application, configure core libraries, and verify API connections.
- **Duration Estimate:** 2 hours
- **Prerequisites:** None
- **Deliverables:**
  - `package.json` with Next.js, Mapbox, Tailwind, shadcn/ui, and AI SDKs.
  - Basic Next.js App Router structure (`app/page.tsx`, `app/layout.tsx`).
  - `.env.local` configured with keys for Mapbox, Gemini, and Groq.
  - Basic map component (`components/map/CoreMap.tsx`) rendering a Mapbox dark theme map.
  - Initial Vercel deployment.
- **Definition of Done:**
  - Next.js app runs locally and builds successfully.
  - Dark map renders without errors.
  - Live Vercel URL displays the empty map.
- **Risk Factors & Mitigation:**
  - *Risk:* API keys invalid or rate-limited.
  - *Mitigation:* Test keys individually with simple cURL or Node scripts before integrating into the app.

## PHASE 2: Thermal Data Pipeline & Core Map

- **Goal:** Implement the primary mapping features, including heatmap rendering, location search, and hotspot detection.
- **Duration Estimate:** 6 hours
- **Prerequisites:** Phase 1 complete (Mapbox installed and rendering).
- **Deliverables:**
  - Mock thermal data generator or processing script (`utils/data/thermalData.ts`).
  - Mapbox heatmap layer integration (`components/map/HeatmapLayer.tsx`).
  - Search bar with geocoding and map fly-to functionality (`components/map/CitySearch.tsx`).
  - Hotspot detection algorithm and markers (`utils/math/hotspotFinder.ts`, `components/map/HotspotMarkers.tsx`).
  - Map controls and legend UI (`components/map/MapControls.tsx`).
- **Definition of Done:**
  - User can search for a city and the map smoothly animates to that location.
  - Heatmap overlay correctly visualizes temperature gradients.
  - The top 3 hottest zones are identified with interactive markers.
- **Risk Factors & Mitigation:**
  - *Risk:* Mapbox GL rendering performance drops with large datasets.
  - *Mitigation:* Use Mapbox's built-in clustering or limit data point resolution (e.g., GeoJSON simplification) if performance degrades.

## PHASE 3: Simulation Engine

- **Goal:** Build the 'What If?' intervention simulator, calculating and displaying the effects of cooling strategies.
- **Duration Estimate:** 6 hours
- **Prerequisites:** Phase 2 complete (Heatmap and core map working).
- **Deliverables:**
  - Simulation panel component (`components/simulation/SimulationPanel.tsx`).
  - Intervention models (e.g., cool roofs, tree canopy) (`utils/simulation/models.ts`).
  - Map layer updates to show before/after thermal states (`components/map/BeforeAfterLayer.tsx`).
  - Impact metrics display (`components/simulation/ImpactMetrics.tsx`).
- **Definition of Done:**
  - User can select an intervention (e.g., "Add 100 Trees"), adjust a slider, and instantly see the heatmap visually cool down.
  - Numerical metrics (e.g., "-1.5°C average reduction") update dynamically.
- **Risk Factors & Mitigation:**
  - *Risk:* Complex math blocks the main thread.
  - *Mitigation:* Keep simulation models simple (linear approximations) for the hackathon; avoid heavy geospatial processing in the browser.

## PHASE 4: AI Integration

- **Goal:** Connect Gemini and Groq APIs to provide intelligent analysis and an AI advisor chat.
- **Duration Estimate:** 5 hours
- **Prerequisites:** Phase 2 complete.
- **Deliverables:**
  - AI Advisor chat component using Groq API with streaming (`components/ai/ChatAdvisor.tsx`, `app/api/chat/route.ts`).
  - AI Analysis report generator using Gemini API (`components/ai/AnalysisReport.tsx`, `app/api/analysis/route.ts`).
  - Prompts configuration (`utils/ai/prompts.ts`).
  - Fallback logic for both AI services to ensure reliability.
- **Definition of Done:**
  - User can chat with the AI Advisor about heat mitigation and receive fast, streaming responses.
  - Gemini generates a structured markdown report for a selected hotspot area.
- **Risk Factors & Mitigation:**
  - *Risk:* API timeouts or context length limits exceeded.
  - *Mitigation:* Implement strict token limits and robust error handling/fallback chains.

## PHASE 5: Landing Page & Dashboard

- **Goal:** Build out the non-map interfaces, including the hero page and impact dashboard.
- **Duration Estimate:** 4 hours
- **Prerequisites:** Phase 3 and 4 complete.
- **Deliverables:**
  - Landing page hero section with stats and CTA (`app/page.tsx`).
  - Impact dashboard for visualizing statistics (`app/dashboard/page.tsx`, `components/dashboard/StatCard.tsx`).
  - Navigation header (`components/layout/Header.tsx`).
- **Definition of Done:**
  - The application has a welcoming entry point.
  - Dashboard effectively displays overall project impact and simulated reductions using charts/cards.
- **Risk Factors & Mitigation:**
  - *Risk:* Wasting time on over-designing.
  - *Mitigation:* Heavily rely on shadcn/ui defaults and simple Tailwind classes.

## PHASE 6: Polish, Bug Fixes & Integration Testing

- **Goal:** Refine the user experience, fix remaining bugs, and ensure all features work together seamlessly.
- **Duration Estimate:** 5 hours
- **Prerequisites:** Phases 1-5 complete.
- **Deliverables:**
  - Loading states, error states, and skeleton screens.
  - Refined animations and hover states.
  - Performance optimizations (e.g., lazy loading non-critical components).
  - Fully responsive layout for desktop and tablet sizes.
- **Definition of Done:**
  - All P0 features function without breaking.
  - The UI feels smooth and cohesive.
- **Risk Factors & Mitigation:**
  - *Risk:* Last-minute feature creep breaking core functionality.
  - *Mitigation:* STRICT feature freeze. Only bug fixes and UI polish allowed in this phase.

## PHASE 7: Demo & Submission Prep

- **Goal:** Finalize the project for Devpost submission.
- **Duration Estimate:** 4 hours
- **Prerequisites:** Phase 6 complete.
- **Deliverables:**
  - Final Vercel deployment.
  - High-quality screenshots of the heatmap, simulation, and chat.
  - Recorded 2-3 minute demo video.
  - System architecture diagram (`docs/ARCHITECTURE-DIAGRAM.md` or image).
  - Devpost submission text detailing inspiration, tech stack, and future plans.
- **Definition of Done:**
  - Hackathon submission is successfully submitted on Devpost with working live link, video, and code repo.
- **Risk Factors & Mitigation:**
  - *Risk:* Running out of time for submission due to technical issues.
  - *Mitigation:* Start recording the video and taking screenshots as soon as P0 features are stable, even if polish is ongoing.
