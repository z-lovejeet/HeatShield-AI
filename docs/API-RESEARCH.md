# HeatShield AI — API & Data Source Research

This document outlines all APIs, datasets, and AI models required for the HeatShield AI project. It is intended as a definitive reference for AI coding agents during the 32-hour hackathon.

---

## 1. Thermal/Temperature Data & Urban Heat Islands (UHI)

### 1A. Pre-processed UHI Datasets (Hackathon Priority)
Processing raw Landsat/MODIS satellite imagery (GeoTIFFs, HDF) requires GDAL, Rasterio, and significant compute time. For a 32-hour hackathon, **pre-processed GeoJSON or CSV datasets are strictly required**.

*   **Trust for Public Land (TPL) Urban Heat Island Data**
    *   **Doc Link:** [TPL Open Data](https://www.tpl.org/)
    *   **Data Format:** ESRI Shapefile / GeoJSON / CSV with Census Tract geometries and Mean LST (Land Surface Temperature) severity.
    *   **Auth:** None required for public open data portals.
    *   **Usage:** Download GeoJSON for target cities (e.g., NYC, LA) and serve them statically from the `public/` folder to Mapbox.
*   **EPA Heat Island Community Mapping Datasets**
    *   **Doc Link:** [EPA Heat Island](https://www.epa.gov/heatislands)
    *   **Data Format:** GeoJSON/CSV.
*   **Fallback Plan:** **Generate Synthetic Data**
    *   If suitable open data for a target city isn't found quickly, we will generate realistic synthetic thermal points (GeoJSON) clustered around known industrial zones/dense downtown areas and cooler points near parks/water bodies using a script.

### 1B. NASA/USGS APIs (Reference / Advanced)
*   **USGS EarthExplorer / M2M API**
    *   **Doc Link:** [USGS M2M API](https://m2m.cr.usgs.gov/)
    *   **Auth:** Requires registered account & API Key.
    *   **Format:** Scene metadata (JSON), actual data is heavy GeoTIFF.
    *   **Actionable Advice:** Avoid for this hackathon unless strictly necessary; use pre-processed static datasets instead.

---

## 2. Map & Geospatial

### 2A. Mapbox GL JS & Mapbox Web Services
*   **Doc Link:** [Mapbox GL JS Docs](https://docs.mapbox.com/mapbox-gl-js/api/)
*   **Auth:** API Access Token (pk....). Passed in headers or initialized via `mapboxgl.accessToken`.
*   **Free Tier:** 50,000 map loads/month free. 100,000 Geocoding requests/month free.
*   **Key Features Used:**
    *   **Heatmap Layer:** `type: 'heatmap'` for UHI visualization.
    *   **3D Terrain:** `mapbox://mapbox.mapbox-terrain-dem-v1`
*   **Geocoding Endpoint:**
    *   `GET https://api.mapbox.com/geocoding/v5/mapbox.places/{query}.json?access_token={token}`
*   **Sample Request:**
    ```bash
    curl "https://api.mapbox.com/geocoding/v5/mapbox.places/Portland.json?access_token=YOUR_TOKEN"
    ```
*   **Sample Response:**
    ```json
    {
      "type": "FeatureCollection",
      "features": [
        {
          "type": "Feature",
          "place_name": "Portland, Oregon, United States",
          "center": [-122.6742, 45.5202]
        }
      ]
    }
    ```
*   **Fallback:** Google Maps JS API + Geocoding API.

### 2B. OpenStreetMap / Overpass API (Building & Park Footprints)
*   **Doc Link:** [Overpass API](https://wiki.openstreetmap.org/wiki/Overpass_API)
*   **Auth:** None.
*   **Rate Limits:** ~10,000 requests per day, limited concurrency.
*   **Endpoint:** `https://overpass-api.de/api/interpreter`
*   **Sample Request (Fetching parks in a bounding box):**
    ```bash
    curl -g 'https://overpass-api.de/api/interpreter?data=[out:json];way[leisure=park](45.5,-122.7,45.6,-122.6);out geom;'
    ```
*   **Fallback:** Use Mapbox standard vector tiles for building and landuse rendering.

---

## 3. Weather & Climate

### 3A. Open-Meteo API
*   **Doc Link:** [Open-Meteo API](https://open-meteo.com/en/docs)
*   **Auth:** None required.
*   **Free Tier:** 10,000 API calls per day.
*   **Key Endpoint:** Current weather and hourly forecast.
    *   `GET https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lng}&current_weather=true&hourly=temperature_2m,relativehumidity_2m`
*   **Sample Request:**
    ```bash
    curl "https://api.open-meteo.com/v1/forecast?latitude=45.52&longitude=-122.67&current_weather=true"
    ```
*   **Sample Response:**
    ```json
    {
      "latitude": 45.52,
      "longitude": -122.67,
      "current_weather": {
        "temperature": 25.3,
        "windspeed": 10.2,
        "weathercode": 0
      }
    }
    ```
*   **Fallback:** OpenWeatherMap API (requires key, 1000 calls/day free).

---

## 4. Demographics & Vulnerability

### 4A. US Census API
*   **Doc Link:** [Census API Docs](https://www.census.gov/data/developers/guidance/api-user-guide.html)
*   **Auth:** API Key (optional but recommended for higher limits).
*   **Key Endpoint:** American Community Survey (ACS) 5-Year Data.
    *   `GET https://api.census.gov/data/2021/acs/acs5?get=NAME,B01001_001E&for=tract:*&in=state:41&in=county:051` (Total population by tract in Multnomah County, OR)
*   **Fallback:** Static JSON files containing pre-downloaded vulnerability index metrics by tract.

### 4B. EPA EJScreen
*   **Doc Link:** [EJScreen Mapping Tool](https://www.epa.gov/ejscreen)
*   **Data Access:** Best used by downloading the national EJScreen CSV/GeoJSON datasets beforehand and filtering by target city bounding boxes, as the REST services can be slow or complex for hackathons.

---

## 5. AI APIs

### 5A. Gemini API (Google)
*   **Endpoint:** `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={API_KEY}`
*   **Auth:** API Key in URL.
*   **Models:**
    *   `gemini-3.8-flash`: Primary choice for reasoning and complex JSON generation.
    *   `gemini-3.7-flash`: Fallback 1.
    *   `gemini-3.6-flash`: Fallback 2.
    *   `gemini-3.5-flash`: Fallback 3.
    *   `gemini-3.5-flash-lite`: For quick, lightweight classification or summarization.
*   **Context Window:** Up to 1M+ tokens for flash models.
*   **Sample Request:**
    ```bash
    curl -H 'Content-Type: application/json' \
         -d '{"contents":[{"parts":[{"text":"Suggest 3 cooling interventions for an urban heat island."}]}]}' \
         "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=YOUR_API_KEY"
    ```
*   **Sample Response:**
    ```json
    {
      "candidates": [
        {
          "content": {
            "parts": [
              { "text": "1. Green roofs...\n2. Cool pavements...\n3. Urban tree canopy..." }
            ]
          }
        }
      ]
    }
    ```

### 5B. Groq API
*   **Endpoint:** `https://api.groq.com/openai/v1/chat/completions` (OpenAI compatible)
*   **Auth:** Bearer Token.
*   **Models:**
    *   `gpt-oss-120b`: Primary. High intelligence, high speed.
    *   `gpt-oss-20b`: Fallback.
*   **Rate Limits:** Check Groq dashboard, typically 30 RPM / 144k TPM on free tier.
*   **Sample Request:**
    ```bash
    curl https://api.groq.com/openai/v1/chat/completions \
      -H "Authorization: Bearer $GROQ_API_KEY" \
      -H "Content-Type: application/json" \
      -d '{
        "model": "gpt-oss-120b",
        "messages": [{"role": "user", "content": "Analyze these UHI metrics."}]
      }'
    ```

---

## 6. Supplementary

### 6A. Carbon Interface API
*   **Doc Link:** [Carbon Interface](https://docs.carboninterface.com/)
*   **Auth:** Bearer Token.
*   **Use Case:** Estimating carbon offset of planting trees or reducing AC usage.
*   **Endpoint:** `POST https://www.carboninterface.com/api/v1/estimates`
*   **Fallback:** Hardcode standard carbon reduction multipliers (e.g., 1 mature tree absorbs ~22kg CO2/year) for quick calculations without API latency.
