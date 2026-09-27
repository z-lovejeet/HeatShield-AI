"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Layers,
  Cpu,
  Sliders,
  ExternalLink,
} from "lucide-react";
import { CoreMap } from "@/components/map/CoreMap";

export default function HomePage() {
  return (
    <div className="min-h-[calc(100dvh-3.5rem)] py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-20">
      {/* 1. Hero Section */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
        {/* Left Column: Clear Mission & CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-5 space-y-6"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#211F1C] border border-[#33302B]">
            <span className="w-2 h-2 rounded-full bg-[#78B093]" />
            <span className="text-xs font-medium text-[#B8B1A7]">
              EPA &amp; CDC Validated Urban Climate Data
            </span>
          </div>

          <h1 className="type-headline-hero">
            <span className="text-[#F5F3EF] block">See the invisible heat</span>
            <span className="text-[#B8B1A7] block">trapping our cities.</span>
          </h1>

          <p className="text-base text-[#B8B1A7] leading-relaxed">
            Extreme urban heat is the leading weather-related cause of mortality
            in the United States. HeatShield AI turns real OpenStreetMap land-use
            data and live solar radiation into an easy-to-use 3D city planner—helping
            communities find heat hotspots and test tree planting, cool roofs,
            and water features before construction starts.
          </p>

          {/* Warm, Cozy CTAs (Zero Neon Glow) */}
          <div className="flex flex-wrap items-center gap-3.5 pt-1">
            <Link
              href="/map"
              className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-[#5E9A7B] hover:bg-[#6CA889] text-[#141311] font-display font-semibold text-sm transition-colors group"
            >
              <span>Open 3D Heat Map</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </Link>

            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#211F1C] hover:bg-[#2A2724] border border-[#38342F] text-sm font-medium text-[#F5F3EF] transition-colors"
            >
              <span>View Impact Dashboard</span>
            </Link>
          </div>

          {/* Key Statistics */}
          <div className="pt-6 border-t border-[#2F2C28] grid grid-cols-3 gap-5">
            <div>
              <div className="font-display text-2xl sm:text-3xl font-bold text-[#F5F3EF] tabular-nums">
                1,300+
              </div>
              <div className="text-xs text-[#8C857B] mt-1">
                US Heat Deaths / Yr
              </div>
            </div>
            <div>
              <div className="font-display text-2xl sm:text-3xl font-bold text-[#E09F67] tabular-nums">
                +1–7°F
              </div>
              <div className="text-xs text-[#8C857B] mt-1">
                Urban Heat Island
              </div>
            </div>
            <div>
              <div className="font-display text-2xl sm:text-3xl font-bold text-[#78B093] tabular-nums">
                -4.2°F
              </div>
              <div className="text-xs text-[#8C857B] mt-1">
                Cooling Goal
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right Column: Interactive 3D Map Preview */}
        <motion.div
          initial={{ opacity: 0, scale: 0.99 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-7"
        >
          <div className="rounded-2xl bg-[#211F1C] border border-[#38342F] p-2 shadow-xl">
            <div className="rounded-xl h-[450px] sm:h-[510px] relative overflow-hidden">
              <CoreMap showOverlayControls={true} />
            </div>
          </div>
        </motion.div>
      </section>

      {/* 2. How It Works: 4-Step Operational Workflow */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#2F2C28] pb-5">
          <div className="space-y-1">
            <div className="text-xs font-semibold uppercase tracking-wider text-[#78B093]">
              02 / Operational Workflow
            </div>
            <h2 className="type-headline-section text-[#F5F3EF]">
              From real city data to personal safety &amp; cooling action.
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-[#8C857B] max-w-md">
            Zero synthetic noise. Every hotspot, leave-home health check, and simulation is grounded in real OpenStreetMap land-use ways and live solar flux.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            {
              step: "Step 1",
              title: "Detect Real Hotspots",
              metric: "420 OSM Ways / City",
              description:
                "Search any city. Our spatial clustering engine analyzes real OpenStreetMap buildings, highways, parking lots, and parks paired with live Open-Meteo solar radiation.",
              href: "/map?tab=controls",
              cta: "Explore 3D Heat Map",
            },
            {
              step: "Step 2",
              title: "Leave-Home Health Check",
              metric: "5 Resident Profiles",
              description:
                "Check whether it is safe to go outside right now for Adults, Seniors, Children, Runners, or Dogs—complete with a 7-sec pavement burn test and AI Route Doctor.",
              href: "/map?tab=health",
              cta: "Check Personal Health Guide",
            },
            {
              step: "Step 3",
              title: "Simulate Stacked Cooling",
              metric: "Up to -11.9°F Drop",
              description:
                "Add street trees, reflective cool roofs, and water basins with simple sliders. Watch the selected zone progressively cool from Red to Green and Blue.",
              href: "/map?tab=simulate",
              cta: "Try Cooling Simulator",
            },
            {
              step: "Step 4",
              title: "AI Audit & Impact ROI",
              metric: "SDG 11 · 13 · 3 Aligned",
              description:
                "Generate a Gemini Climate Audit or upload a street photo to Groq Vision, then track 10-year carbon and energy savings on the Impact Dashboard.",
              href: "/dashboard",
              cta: "Open Impact Dashboard",
            },
          ].map((item) => (
            <div key={item.step} className="rounded-2xl bg-[#211F1C] border border-[#33302B] p-5 flex flex-col justify-between space-y-5">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-[#94C4AB] bg-[#5E9A7B]/15 border border-[#5E9A7B]/35 px-2.5 py-1 rounded-lg">
                    {item.step}
                  </span>
                  <span className="font-mono text-[11px] text-[#B8B1A7] tabular-nums">
                    {item.metric}
                  </span>
                </div>
                <h3 className="type-headline-card text-[#F5F3EF] pt-1">
                  {item.title}
                </h3>
                <p className="text-sm text-[#B8B1A7] leading-relaxed">
                  {item.description}
                </p>
              </div>

              <Link
                href={item.href}
                className="inline-flex items-center justify-between pt-4 border-t border-[#2F2C28] text-xs sm:text-sm font-medium text-[#F5F3EF] hover:text-[#78B093] transition-colors group"
              >
                <span>{item.cta}</span>
                <ArrowRight className="w-4 h-4 text-[#78B093] transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* 3. System Capabilities & Data Provenance */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#2F2C28] pb-5">
          <div className="space-y-1">
            <div className="text-xs font-semibold uppercase tracking-wider text-[#78B093]">
              01 / Architecture &amp; Data Sources
            </div>
            <h2 className="type-headline-section text-[#F5F3EF]">
              Built on real environmental science.
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-[#8C857B] max-w-md">
            Combining real OpenStreetMap footprints, EPA cooling physics, and fast multi-model AI assistance.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* Card 1: Real Data Sources */}
          <div className="md:col-span-7 rounded-2xl bg-[#211F1C] border border-[#33302B] p-6 sm:p-7 flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-[#5E9A7B]/15 border border-[#5E9A7B]/35 flex items-center justify-center text-[#78B093]">
                  <Layers className="w-5 h-5" />
                </div>
                <span className="text-xs font-mono text-[#8C857B]">Real Geospatial Data</span>
              </div>
              <h3 className="type-headline-card text-[#F5F3EF]">
                High-Resolution Surface Temperature Mapping
              </h3>
              <p className="text-sm text-[#B8B1A7] leading-relaxed">
                Maps urban heat differentials down to individual city blocks by analyzing asphalt highways, industrial roofs, parking lots, and tree-covered parks.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#181614] border border-[#2F2C28] text-xs sm:text-sm text-[#B8B1A7] space-y-2.5">
              <div className="flex items-center justify-between text-[#8C857B] border-b border-[#2F2C28] pb-2 text-xs font-medium">
                <span>Data Layer</span>
                <span>Verified Source</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Urban Polygons (1,260 Ways)</span>
                <span className="text-[#78B093] font-semibold">100% Real OSM Overpass</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Surface Energy Balance</span>
                <span className="text-[#F5F3EF] font-medium">450m Spatial Neighbor LST</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Solar &amp; Ambient Weather</span>
                <span className="text-[#F5F3EF] font-medium">Open-Meteo Radiation API</span>
              </div>
            </div>
          </div>

          {/* Card 2: Cooling Physics */}
          <div className="md:col-span-5 rounded-2xl bg-[#211F1C] border border-[#33302B] p-6 sm:p-7 flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-[#5E9A7B]/15 border border-[#5E9A7B]/35 flex items-center justify-center text-[#78B093]">
                  <Sliders className="w-5 h-5" />
                </div>
                <span className="text-xs font-mono text-[#8C857B]">EPA &amp; i-Tree Model</span>
              </div>
              <h3 className="type-headline-card text-[#F5F3EF]">
                What-If Cooling Physics
              </h3>
              <p className="text-sm text-[#B8B1A7] leading-relaxed">
                Test virtual tree canopies, reflective cool roofs, and water basins to see immediate temperature drops and 10-year carbon savings.
              </p>
            </div>

            <div className="space-y-3 pt-4 border-t border-[#2F2C28] text-xs sm:text-sm">
              <div className="flex items-center justify-between">
                <span className="text-[#B8B1A7]">Street Tree Canopy</span>
                <span className="font-mono text-[#78B093] font-semibold tabular-nums">-3.5°F to -6.8°F</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#B8B1A7]">Reflective Cool Roofs</span>
                <span className="font-mono text-[#78B093] font-semibold tabular-nums">-2.0°F to -4.5°F</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#B8B1A7]">Water Basins &amp; Bioswales</span>
                <span className="font-mono text-[#78B093] font-semibold tabular-nums">-1.5°F to -2.8°F</span>
              </div>
            </div>
          </div>

          {/* Card 3: Dual AI Engine */}
          <div className="md:col-span-12 rounded-2xl bg-[#211F1C] border border-[#33302B] p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-[#5E9A7B]/15 border border-[#5E9A7B]/35 flex items-center justify-center text-[#78B093]">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="type-headline-card text-[#F5F3EF]">
                    Dual AI Climate Planner: Groq LPU + Google Gemini
                  </h3>
                  <p className="text-xs sm:text-sm text-[#B8B1A7] mt-0.5">
                    Instant conversational guidance paired with structured neighborhood climate audits.
                  </p>
                </div>
              </div>

              <Link
                href="/map?tab=analyze"
                className="self-start sm:self-auto inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-[#78B093] hover:text-[#94C4AB] transition-colors"
              >
                <span>Open AI Planner</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-xl bg-[#181614] border border-[#2F2C28] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-display text-sm font-semibold text-[#F5F3EF]">
                    Groq Chat &amp; Street Vision
                  </span>
                  <span className="text-xs font-medium text-[#78B093] bg-[#5E9A7B]/15 px-2.5 py-0.5 rounded-lg border border-[#5E9A7B]/30">
                    Real-Time Streaming
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-[#B8B1A7] leading-relaxed">
                  Ask questions about cooling costs, tree species, or upload a street photo to analyze dark asphalt and roof surfaces.
                </p>
              </div>

              <div className="p-5 rounded-xl bg-[#181614] border border-[#2F2C28] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-display text-sm font-semibold text-[#F5F3EF]">
                    Gemini Climate Audit
                  </span>
                  <span className="text-xs font-medium text-[#78B093] bg-[#5E9A7B]/15 px-2.5 py-0.5 rounded-lg border border-[#5E9A7B]/30">
                    1-Click Simulator Sync
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-[#B8B1A7] leading-relaxed">
                  Generates a prioritized cooling plan with estimated costs, timelines, and UN SDG alignment that applies directly to the 3D simulator.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Footer */}
      <footer className="pt-8 border-t border-[#2F2C28] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#8C857B]">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#5E9A7B]" />
          <span>HeatShield AI — Lake Oswego Hacks 2026</span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/map" className="hover:text-[#F5F3EF] transition-colors">
            3D Heat Map
          </Link>
          <Link href="/dashboard" className="hover:text-[#F5F3EF] transition-colors">
            Impact Dashboard
          </Link>
          <a
            href="https://www.epa.gov/heatislands"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#F5F3EF] transition-colors inline-flex items-center gap-1"
          >
            <span>EPA Heat Island Research</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </footer>
    </div>
  );
}
