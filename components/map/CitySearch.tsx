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
      } catch {
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelectFeature = (feature: GeocodingFeature) => {
    const [lng, lat] = feature.center;

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
    <div ref={containerRef} className="relative z-40 w-full max-w-2xl">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        {/* Search Input Box */}
        <div className="relative flex-1 flex items-center bg-[#141311] border border-[#33302B] rounded-xl focus-within:border-[#5E9A7B] transition-colors">
          <Search className="w-4 h-4 text-[#8C857B] ml-3.5 mr-2.5 shrink-0 pointer-events-none" />
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
            placeholder="Search any US city (e.g., Seattle, Austin, Chicago)..."
            aria-label="Search city or sector"
            className="w-full bg-transparent text-xs sm:text-[13px] text-[#F5F3EF] placeholder:text-[#8C857B] focus:outline-none py-2 pr-8 font-sans"
          />
          {isLoading && (
            <Loader2 className="w-4 h-4 text-[#78B093] animate-spin absolute right-3" />
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
              className="absolute right-2.5 text-[#8C857B] hover:text-[#F5F3EF] p-0.5 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Benchmark City Pills */}
        <div className="flex items-center gap-1.5 bg-[#141311] p-1 rounded-xl border border-[#33302B] overflow-x-auto shrink-0">
          {Object.values(SUPPORTED_CITIES).map((city) => {
            const isActive = activeCityId === city.id && !customCityName;
            return (
              <button
                key={city.id}
                type="button"
                onClick={() => onSelectPresetCity(city.id)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                  isActive
                    ? "bg-[#5E9A7B] text-[#141311] font-semibold"
                    : "text-[#B8B1A7] hover:text-[#F5F3EF] hover:bg-white/[0.04]"
                }`}
              >
                <span>
                  {city.id === "portland"
                    ? "Portland, OR"
                    : city.id === "phoenix"
                    ? "Phoenix, AZ"
                    : "New York, NY"}
                </span>
              </button>
            );
          })}
          {customCityName && (
            <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-[#5E9A7B]/20 text-[#F5F3EF] border border-[#5E9A7B]/40 flex items-center gap-1.5 whitespace-nowrap">
              <Compass className="w-3.5 h-3.5 text-[#78B093]" />
              <span>{customCityName}</span>
            </span>
          )}
        </div>
      </div>

      {/* Autocomplete Suggestions Dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute left-0 right-0 mt-2 rounded-xl bg-[#211F1C] border border-[#38342F] shadow-2xl overflow-hidden z-50">
          <div className="py-1 divide-y divide-[#2F2C28]">
            <div className="px-3.5 py-1.5 flex items-center justify-between text-[11px] text-[#8C857B]">
              <span>Matching Cities</span>
              <span className="font-mono text-[#78B093]">
                {results.length} found
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
                    isHighlighted ? "bg-[#5E9A7B]/15" : "hover:bg-white/[0.03]"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <MapPin
                      className={`w-4 h-4 shrink-0 ${
                        isHighlighted ? "text-[#78B093]" : "text-[#8C857B]"
                      }`}
                    />
                    <div className="truncate">
                      <p className="text-xs sm:text-[13px] font-medium text-[#F5F3EF] truncate">
                        {feature.text}
                      </p>
                      <p className="text-xs text-[#8C857B] truncate">
                        {feature.place_name}
                      </p>
                    </div>
                  </div>
                  <span className="font-mono text-[11px] text-[#8C857B] shrink-0 tabular-nums">
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
