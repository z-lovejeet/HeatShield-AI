"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, MapPin, Loader2, X, Compass } from "lucide-react";
import { SUPPORTED_CITIES } from "@/lib/thermal-data";

interface GeocodingFeature {
  id: string;
  place_name: string;
  text: string;
  center: [number, number];
  context?: Array<{ id: string; text: string; short_code?: string }>;
}

interface CitySearchProps {
  activeCityId: string;
  customCityName?: string | null;
  onSelectPresetCity: (cityId: string) => void;
  onSelectCustomLocation: (location: {
    id: string;
    name: string;
    state: string;
    center: [number, number];
  }) => void;
}

export function CitySearch({
  activeCityId,
  customCityName,
  onSelectPresetCity,
  onSelectCustomLocation,
}: CitySearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeocodingFeature[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced Mapbox Geocoding search
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
      if (!token) return;

      setIsLoading(true);
      try {
        const endpoint = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          trimmed
        )}.json?types=place,locality,neighborhood&country=us&limit=5&access_token=${token}`;
        const res = await fetch(endpoint);
        if (res.ok) {
          const data = await res.json();
          setResults(data.features || []);
          setIsOpen(true);
          setHighlightedIndex(data.features?.length ? 0 : -1);
        }
      } catch (err) {
        // Silent fallback on network error
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelectFeature = (feature: GeocodingFeature) => {
    const [lng, lat] = feature.center;

    // Check if matches one of our calibrated benchmark cities
    const lowerName = feature.place_name.toLowerCase();
    if (lowerName.includes("portland") || lowerName.includes("lake oswego")) {
      onSelectPresetCity("portland");
    } else if (lowerName.includes("phoenix")) {
      onSelectPresetCity("phoenix");
    } else if (
      lowerName.includes("new york") ||
      lowerName.includes("manhattan") ||
      lowerName.includes("bronx")
    ) {
      onSelectPresetCity("nyc");
    } else {
      const regionCtx = feature.context?.find((c) => c.id.startsWith("region"));
      const stateCode = regionCtx?.short_code
        ? regionCtx.short_code.replace("US-", "")
        : regionCtx?.text || "US";

      onSelectCustomLocation({
        id: `custom-${feature.id}`,
        name: feature.text,
        state: stateCode,
        center: [lng, lat],
      });
    }

    setQuery("");
    setResults([]);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev <= 0 ? results.length - 1 : prev - 1
      );
    } else if (e.key === "Enter" && highlightedIndex >= 0) {
      e.preventDefault();
      handleSelectFeature(results[highlightedIndex]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative z-30 w-full max-w-xl">
      <div className="bezel-shell shadow-2xl">
        <div className="bezel-core flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-1.5 bg-[#060809]/95 backdrop-blur-xl">
          {/* Geocoding Search Input */}
          <div className="relative flex-1 flex items-center">
            <Search className="w-3.5 h-3.5 text-[#94A3AB] ml-3 mr-2.5 shrink-0 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => {
                if (results.length > 0) setIsOpen(true);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Search any US city or sector (e.g., Seattle, Austin, Miami)..."
              aria-label="Search city or sector"
              className="w-full bg-transparent text-xs text-[#F4F6F7] placeholder:text-[#526068] focus:outline-none py-1.5 pr-7 font-sans"
            />
            {isLoading && (
              <Loader2 className="w-3.5 h-3.5 text-[#10B981] animate-spin absolute right-2.5" />
            )}
            {!isLoading && query.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setResults([]);
                  setIsOpen(false);
                }}
                aria-label="Clear search"
                className="absolute right-2 text-[#526068] hover:text-[#F4F6F7] p-0.5 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="hidden sm:block h-4 w-[1px] bg-white/[0.08]" />

          {/* Calibrated Benchmark City Quick Switcher */}
          <div className="flex items-center gap-1 px-1 overflow-x-auto">
            {Object.values(SUPPORTED_CITIES).map((city) => {
              const isActive = activeCityId === city.id && !customCityName;
              return (
                <button
                  key={city.id}
                  type="button"
                  onClick={() => onSelectPresetCity(city.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium tracking-tight transition-all flex items-center gap-1.5 whitespace-nowrap ${
                    isActive
                      ? "bg-[#10B981]/15 text-[#F4F6F7] border border-[#10B981]/35 shadow-sm"
                      : "text-[#94A3AB] hover:text-[#F4F6F7] hover:bg-white/[0.04] border border-transparent"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isActive ? "bg-[#10B981]" : "bg-[#526068]"
                    }`}
                  />
                  <span>{city.id === "portland" ? "Portland" : city.id === "phoenix" ? "Phoenix" : "NYC"}</span>
                  <span className="font-mono text-[10px] text-[#526068]">
                    {city.state}
                  </span>
                </button>
              );
            })}
            {customCityName && (
              <span className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-[#10B981]/15 text-[#F4F6F7] border border-[#10B981]/35 flex items-center gap-1.5 whitespace-nowrap">
                <Compass className="w-3 h-3 text-[#10B981]" />
                <span>{customCityName}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Autocomplete Suggestions Dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute left-0 right-0 mt-2 bezel-shell shadow-2xl overflow-hidden z-50">
          <div className="bezel-core bg-[#060809]/95 backdrop-blur-xl py-1.5 divide-y divide-white/[0.05]">
            <div className="px-3 py-1 flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#526068]">
                Mapbox Satellite Geocoder
              </span>
              <span className="font-mono text-[10px] text-[#10B981]">
                {results.length} SECTORS FOUND
              </span>
            </div>
            {results.map((feature, idx) => {
              const isHighlighted = idx === highlightedIndex;
              const [lng, lat] = feature.center;
              return (
                <button
                  key={feature.id}
                  type="button"
                  onClick={() => handleSelectFeature(feature)}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  className={`w-full text-left px-3.5 py-2.5 flex items-center justify-between gap-3 transition-colors ${
                    isHighlighted ? "bg-[#10B981]/10" : "hover:bg-white/[0.03]"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <MapPin
                      className={`w-3.5 h-3.5 shrink-0 ${
                        isHighlighted ? "text-[#10B981]" : "text-[#94A3AB]"
                      }`}
                    />
                    <div className="truncate">
                      <p className="text-xs font-medium text-[#F4F6F7] truncate">
                        {feature.place_name}
                      </p>
                    </div>
                  </div>
                  <span className="font-mono text-[10px] text-[#94A3AB] tabular-nums shrink-0">
                    {lat.toFixed(2)}°N, {Math.abs(lng).toFixed(2)}°W
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
