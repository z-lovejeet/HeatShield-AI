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
  activeCityName,
}: MapControlsProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);

  // Fetch live Open-Meteo ambient weather for current center coordinates
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
    } catch (err) {
      // Non-blocking fallback
    } finally {
      setWeatherLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather(currentCoords);
  }, [currentCoords[0], currentCoords[1]]);

  return (
    <div className="relative z-20 w-72 sm:w-80 bezel-shell shadow-2xl">
      <div className="bezel-core bg-[#060809]/95 backdrop-blur-xl p-3.5 flex flex-col gap-3">
        {/* Header / Toggle Collapse */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-[#10B981]/15 text-[#10B981]">
              <Layers className="w-3.5 h-3.5" />
            </span>
            <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-[#F4F6F7]">
              Tactical Observatory
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            aria-label={isExpanded ? "Collapse controls" : "Expand controls"}
            className="p-1 text-[#94A3AB] hover:text-[#F4F6F7] transition-colors rounded hover:bg-white/[0.04]"
          >
            {isExpanded ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {isExpanded && (
          <div className="flex flex-col gap-3 pt-1 border-t border-white/[0.06]">
            {/* Heatmap Layer Toggle */}
            <div className="flex items-center justify-between">
              <label
                htmlFor="toggle-heatmap"
                className="flex items-center gap-2 text-xs font-medium text-[#F4F6F7] cursor-pointer"
              >
                <Flame
                  className={`w-3.5 h-3.5 ${
                    showHeatmap ? "text-[#10B981]" : "text-[#526068]"
                  }`}
                />
                <span>Thermal LST Heatmap</span>
              </label>
              <button
                id="toggle-heatmap"
                type="button"
                onClick={() => onToggleHeatmap(!showHeatmap)}
                aria-checked={showHeatmap}
                role="switch"
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  showHeatmap ? "bg-[#10B981]" : "bg-white/[0.12]"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-[#060809] shadow ring-0 transition duration-200 ease-in-out ${
                    showHeatmap ? "translate-x-4" : "translate-x-0.5"
                  } mt-0.5`}
                />
              </button>
            </div>

            {/* Heatmap Opacity Slider */}
            {showHeatmap && (
              <div className="flex flex-col gap-1.5 pl-5 border-l border-white/[0.06]">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#94A3AB] flex items-center gap-1">
                    <Sliders className="w-3 h-3 text-[#526068]" />
                    Density Opacity
                  </span>
                  <span className="font-mono text-[#F4F6F7] tabular-nums">
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
                  className="w-full h-1 bg-white/[0.12] rounded-lg appearance-none cursor-pointer accent-[#10B981]"
                />
              </div>
            )}

            {/* Hotspot Markers Toggle */}
            <div className="flex items-center justify-between">
              <label
                htmlFor="toggle-hotspots"
                className="flex items-center gap-2 text-xs font-medium text-[#F4F6F7] cursor-pointer"
              >
                <MapPin
                  className={`w-3.5 h-3.5 ${
                    showHotspots ? "text-[#10B981]" : "text-[#526068]"
                  }`}
                />
                <span>Pulsing Hotspot Markers</span>
              </label>
              <button
                id="toggle-hotspots"
                type="button"
                onClick={() => onToggleHotspots(!showHotspots)}
                aria-checked={showHotspots}
                role="switch"
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  showHotspots ? "bg-[#10B981]" : "bg-white/[0.12]"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-[#060809] shadow ring-0 transition duration-200 ease-in-out ${
                    showHotspots ? "translate-x-4" : "translate-x-0.5"
                  } mt-0.5`}
                />
              </button>
            </div>

            {/* 3D Buildings Toggle */}
            <div className="flex items-center justify-between">
              <label
                htmlFor="toggle-buildings"
                className="flex items-center gap-2 text-xs font-medium text-[#F4F6F7] cursor-pointer"
              >
                <Building2
                  className={`w-3.5 h-3.5 ${
                    show3DBuildings ? "text-[#10B981]" : "text-[#526068]"
                  }`}
                />
                <span>3D Canyon Extrusions</span>
              </label>
              <button
                id="toggle-buildings"
                type="button"
                onClick={() => onToggle3DBuildings(!show3DBuildings)}
                aria-checked={show3DBuildings}
                role="switch"
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  show3DBuildings ? "bg-[#10B981]" : "bg-white/[0.12]"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-[#060809] shadow ring-0 transition duration-200 ease-in-out ${
                    show3DBuildings ? "translate-x-4" : "translate-x-0.5"
                  } mt-0.5`}
                />
              </button>
            </div>

            {/* Live Open-Meteo Weather Telemetry Box */}
            <div className="mt-1 pt-2.5 border-t border-white/[0.06] bg-white/[0.02] rounded-lg p-2.5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#526068] flex items-center gap-1.5">
                  <CloudSun className="w-3 h-3 text-[#10B981]" />
                  Open-Meteo Ambient Telemetry
                </span>
                <button
                  type="button"
                  onClick={() => fetchWeather(currentCoords)}
                  title="Refresh live weather"
                  className="text-[#94A3AB] hover:text-[#10B981] transition-colors"
                >
                  <RefreshCw
                    className={`w-2.5 h-2.5 ${
                      weatherLoading ? "animate-spin text-[#10B981]" : ""
                    }`}
                  />
                </button>
              </div>

              {weather ? (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-[#94A3AB] block">
                      Ambient Air Temp
                    </span>
                    <span className="font-mono text-sm font-semibold text-[#F4F6F7] tabular-nums">
                      {weather.temperatureF.toFixed(1)}°F
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#94A3AB] block flex items-center gap-1">
                      <Wind className="w-2.5 h-2.5 text-[#526068]" />
                      Surface Wind
                    </span>
                    <span className="font-mono text-sm font-semibold text-[#F4F6F7] tabular-nums">
                      {weather.windSpeedMph.toFixed(0)} mph
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-[11px] text-[#94A3AB] font-mono animate-pulse">
                  Querying meteorological stream...
                </div>
              )}

              <div className="mt-2 text-[9px] text-[#526068] leading-tight">
                Satellite surface LST in high-density asphalt zones typically
                exceeds ambient air temperature by +15°F to +35°F.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
