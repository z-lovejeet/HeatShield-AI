# HeatShield AI
**Tagline:** "See the invisible. Cool the city."

## 1. Hackathon Context
- **Hackathon:** Lake Oswego Hacks (LOHacks), 32-hour virtual hackathon
- **Theme:** "Technology for Planet" (Sustainability)
- **Organized by:** FRC Team 2635 (Lake Monsters Robotics)
- **Track:** Hackathon (Technical)
- **Judging Criteria:**
  1. Purpose & Sustainability Connection
  2. Creativity & Innovation
  3. Technical Execution
  4. Presentation & Documentation
  5. Project Focus
- **Prizes:** Best Overall $100, Most Technical $80

## 2. Problem Statement
Urban Heat Islands (UHIs) are areas that experience significantly higher temperatures than their surrounding rural environments, posing a major public health and environmental crisis.

- **Mortality:** Extreme heat is the #1 weather-related killer in the US. Over 1,300 Americans die annually from extreme heat, exceeding deaths from hurricanes, tornadoes, and floods combined. (CDC/EPA data)
- **Temperature Difference:** Urban areas are typically 1-7°F hotter during the day and up to 2-5°F hotter at night than outlying areas (EPA).
- **Climate Context:** 2024 was globally recorded as the hottest year on record, compounding UHI effects.
- **Disproportionate Impact:** Black and African American individuals are 40–59% more likely to live in high-impact heat mortality areas. It also disproportionately affects the elderly, low-income communities, and Hispanic/Latino populations. 

## 3. What Exists vs What We Do Differently
**Existing Tools:**
- *Google Tree Canopy Tool / Environmental Insights Explorer:* Focuses on mapping existing tree coverage and general heat but lacks interactive, real-time intervention simulation.
- *EPA Heat Island Maps / NOAA Heat.gov:* Provides extensive historical data and UHI indices but caters mostly to researchers and policy-makers, lacking accessible "what-if" modeling for local community planners.

**Our Unique Value (What We Do Differently):**
- **Interactive Simulation:** Users can drop virtual trees, cool roofs, or water features on a 3D map and instantly see the projected localized temperature reduction.
- **AI-Powered Recommendations:** Gemini and Groq APIs analyze local data to suggest optimal interventions tailored to specific neighborhoods, maximizing ROI on cooling efforts.
- **Accessibility:** Designed for non-experts—no GIS degree required.

## 4. Target Users
- **City Planners:** For data-driven urban development and zoning.
- **Community Activists:** To advocate for equitable green infrastructure in vulnerable neighborhoods.
- **Municipal Governments:** To allocate sustainability budgets efficiently.
- **Students & Environmental Researchers:** For educational purposes and academic study.

## 5. Value Proposition
HeatShield AI democratizes urban climate resilience by transforming complex satellite thermal data into an interactive, AI-driven 3D platform. We empower communities and city planners to not just visualize deadly heat islands, but actively simulate and optimize cooling interventions—turning data into immediate, life-saving action.

## 6. UN SDG Mapping
Our project directly advances the United Nations Sustainable Development Goals:
- **SDG 11 (Sustainable Cities and Communities):** Target 11.7 (Provide access to safe, inclusive green and public spaces). Target 11.b (Implement policies for inclusion, resource efficiency, mitigation and adaptation to climate change).
- **SDG 13 (Climate Action):** Target 13.1 (Strengthen resilience and adaptive capacity to climate-related hazards).
- **SDG 3 (Good Health and Well-Being):** Target 3.9 (Substantially reduce the number of deaths and illnesses from hazardous chemicals and air, water and soil pollution/contamination, which includes extreme heat).

## 7. Quantified Environmental Impact
If implemented across 50 major US cities, our targeted AI-driven interventions could:
- **Reduce Peak Temperatures:** Achieve a localized reduction of 2-4°C (3.6-7.2°F) in critical hotspots.
- **Save Lives:** Prevent an estimated 300+ heat-related deaths annually by targeting the most vulnerable top 10% of high-UHI neighborhoods.
- **Economic & Healthcare Savings:** Save an estimated $150M+ annually in emergency healthcare costs and reduced energy demand (HVAC loads) during peak summer months.

## 8. Scope Boundaries
**What We ARE Building (In-Scope):**
- A web application with an interactive 3D map using Mapbox GL JS.
- Visual overlays of thermal data (mocked or open-source sample data for a specific target city if live global satellite data is too heavy).
- UI controls to place cooling interventions (trees, cool roofs).
- AI integration (Gemini/Groq) to generate a brief summary report of projected temperature changes and health impacts based on user-placed interventions.

**What We ARE NOT Building (Out-of-Scope):**
- Real-time global satellite API ingestion (we will use static datasets or single-city focus for the MVP).
- A complete thermodynamic physics engine (AI will estimate the temperature reductions based on proven heuristics).
- User authentication and saving projects (stateless MVP for the hackathon).
- Mobile native app (responsive web only).

## 9. Tech Stack Overview
- **Frontend:** Next.js (React), Tailwind CSS, shadcn/ui
- **Mapping:** Mapbox GL JS
- **AI Integration:** Gemini API (for detailed reporting and context), Groq API (for rapid, low-latency intervention heuristics)
*(See `ARCHITECTURE.md` for detailed technical specifications)*

## 10. Success Criteria (MVP Definition of Done)
1. **Interactive Map:** The application successfully renders a 3D city map with a visible "heat" overlay.
2. **Intervention Placement:** A user can click to place at least two types of interventions (e.g., Tree, Cool Roof) on the map.
3. **Dynamic Feedback:** Upon placing an estimated intervention, the UI updates to show an estimated local temperature drop.
4. **AI Report Generation:** The user can click "Analyze Impact," which triggers an AI prompt summarizing the environmental and health benefits of their specific placements.
5. **Deployment:** The app is deployed live (e.g., Vercel) and accessible via a public URL for the judges.
