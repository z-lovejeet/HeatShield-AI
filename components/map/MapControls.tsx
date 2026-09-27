"use client";

import React, { useState, useEffect } from "react";
import {
  Layers,
  Flame,
  Building2,
  Wind,
  CloudSun,
  Sliders,
  ChevronDown,
  ChevronUp,
  MapPin,
  RefreshCw,
} from "lucide-react";

interface WeatherData {
  temperatureF: number;
  windSpeedMph: number;
  weatherCode: number;
  time: string;
}

interface MapControlsProps {
  showHeatmap: boolean;
  onToggleHeatmap: (show: boolean) => void;
  heatmapOpacity: number;
  onChangeOpacity: (opacity: number) => void;
  showHotspots: boolean;
  onToggleHotspots: (show: boolean) => void;
  show3DBuildings: boolean;
  onToggle3DBuildings: (show: boolean) => void;
  currentCoords: [number, number]; // [lng, lat]
  activeCityName: string;
}

export function MapControls({
  showHeatmap,
  onToggleHeatmap,
  heatmapOpacity,
  onChangeOpacity,
  showHotspots,
  onToggleHotspots,
  show3DBuildings,
  onToggle3DBuildings,
  currentCoords,
}: MapControlsProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);

  const fetchWeather = async (coords: [number, number]) => {
    const [lng, lat] = coords;
    setWeatherLoading(true);
    try {
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(
          4
        )}&longitude=${lng.toFixed(
          4
        )}&current_weather=true&temperature_unit=fahrenheit&windspeed_unit=mph`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.current_weather) {
          setWeather({
            temperatureF: data.current_weather.temperature,
            windSpeedMph: data.current_weather.windspeed,
            weatherCode: data.current_weather.weathercode,
            time: data.current_weather.time,
          });
        }
      }
    } catch {
      // Non-blocking fallback
    } finally {
      setWeatherLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather(currentCoords);
  }, [currentCoords[0], currentCoords[1]]);

  return (
    <div className="w-full rounded-2xl bg-[#211F1C] border border-[#33302B] p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-[#5E9A7B]/15 text-[#78B093]">
            <Layers className="w-4 h-4" />
          </span>
          <span className="font-display text-sm font-semibold text-[#F5F3EF]">
            Map Display &amp; Weather
          </span>
        </div>
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-label={isExpanded ? "Collapse controls" : "Expand controls"}
          className="p-1.5 text-[#B8B1A7] hover:text-[#F5F3EF] transition-colors rounded-lg hover:bg-white/[0.04]"
        >
          {isExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>
      </div>

      {isExpanded && (
        <div className="flex flex-col gap-3.5 pt-2 border-t border-[#2F2C28]">
          {/* Heatmap Layer Toggle */}
          <div className="flex items-center justify-between">
            <label
              htmlFor="toggle-heatmap"
              className="flex items-center gap-2.5 text-[13px] font-medium text-[#F5F3EF] cursor-pointer"
            >
              <Flame
                className={`w-4 h-4 ${
                  showHeatmap ? "text-[#D98A5B]" : "text-[#8C857B]"
                }`}
              />
              <span>Surface Heat Layer</span>
            </label>
            <button
              id="toggle-heatmap"
              type="button"
              onClick={() => onToggleHeatmap(!showHeatmap)}
              aria-checked={showHeatmap}
              role="switch"
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                showHeatmap ? "bg-[#5E9A7B]" : "bg-[#38342F]"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-[#141311] shadow ring-0 transition duration-200 ease-in-out ${
                  showHeatmap ? "translate-x-4" : "translate-x-0.5"
                } mt-0.5`}
              />
            </button>
          </div>

          {/* Heatmap Opacity Slider */}
          {showHeatmap && (
            <div className="flex flex-col gap-1.5 pl-6 border-l-2 border-[#33302B]">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#B8B1A7] flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-[#8C857B]" />
                  Heatmap Opacity
                </span>
                <span className="font-mono text-[#F5F3EF] tabular-nums">
                  {Math.round(heatmapOpacity * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={heatmapOpacity}
                onChange={(e) => onChangeOpacity(parseFloat(e.target.value))}
                aria-label="Heatmap opacity"
                className="w-full h-1.5 bg-[#38342F] rounded-lg appearance-none cursor-pointer accent-[#5E9A7B]"
              />
            </div>
          )}

          {/* Hotspot Markers Toggle */}
          <div className="flex items-center justify-between">
            <label
              htmlFor="toggle-hotspots"
              className="flex items-center gap-2.5 text-[13px] font-medium text-[#F5F3EF] cursor-pointer"
            >
              <MapPin
                className={`w-4 h-4 ${
                  showHotspots ? "text-[#78B093]" : "text-[#8C857B]"
                }`}
              />
              <span>Hotspot Map Pins</span>
            </label>
            <button
              id="toggle-hotspots"
              type="button"
              onClick={() => onToggleHotspots(!showHotspots)}
              aria-checked={showHotspots}
              role="switch"
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                showHotspots ? "bg-[#5E9A7B]" : "bg-[#38342F]"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-[#141311] shadow ring-0 transition duration-200 ease-in-out ${
                  showHotspots ? "translate-x-4" : "translate-x-0.5"
                } mt-0.5`}
              />
            </button>
          </div>

          {/* 3D Buildings Toggle */}
          <div className="flex items-center justify-between">
            <label
              htmlFor="toggle-buildings"
              className="flex items-center gap-2.5 text-[13px] font-medium text-[#F5F3EF] cursor-pointer"
            >
              <Building2
                className={`w-4 h-4 ${
                  show3DBuildings ? "text-[#78B093]" : "text-[#8C857B]"
                }`}
              />
              <span>3D Building Heights</span>
            </label>
            <button
              id="toggle-buildings"
              type="button"
              onClick={() => onToggle3DBuildings(!show3DBuildings)}
              aria-checked={show3DBuildings}
              role="switch"
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                show3DBuildings ? "bg-[#5E9A7B]" : "bg-[#38342F]"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-[#141311] shadow ring-0 transition duration-200 ease-in-out ${
                  show3DBuildings ? "translate-x-4" : "translate-x-0.5"
                } mt-0.5`}
              />
            </button>
          </div>

          {/* Live Open-Meteo Weather Telemetry Box */}
          <div className="mt-1 pt-3 border-t border-[#2F2C28] bg-[#1A1816] rounded-xl p-3 border border-[#2C2925]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-[#B8B1A7] flex items-center gap-1.5">
                <CloudSun className="w-4 h-4 text-[#78B093]" />
                Live Local Weather (Open-Meteo)
              </span>
              <button
                type="button"
                onClick={() => fetchWeather(currentCoords)}
                title="Refresh live weather"
                className="text-[#B8B1A7] hover:text-[#78B093] transition-colors p-1"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${
                    weatherLoading ? "animate-spin text-[#78B093]" : ""
                  }`}
                />
              </button>
            </div>

            {weather ? (
              <div className="flex items-center justify-between text-xs">
                <div>
                  <span className="text-[#8C857B] block">Air Temperature</span>
                  <span className="font-display text-base font-bold text-[#F5F3EF] tabular-nums">
                    {weather.temperatureF.toFixed(1)}°F
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[#8C857B] flex items-center justify-end gap-1">
                    <Wind className="w-3.5 h-3.5 text-[#78B093]" />
                    Wind Speed
                  </span>
                  <span className="font-mono text-sm font-semibold text-[#F5F3EF] tabular-nums">
                    {weather.windSpeedMph.toFixed(1)} mph
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-xs text-[#8C857B] py-1">
                {weatherLoading
                  ? "Loading live weather..."
                  : "Live weather standing by"}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
