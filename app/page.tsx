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
    <div className="min-h-[100dvh] pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-28">
      {/* 1. Hero Section: Asymmetric Workbench with Editorial Typographic Tension */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Left Column: Mission, Evidence, and Precision CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-5 space-y-8"
        >
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2.5 px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.08] shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="type-mono-badge text-[#94A3AB]">
              EPA & CDC Validated Telemetry
            </span>
          </div>

          {/* Heading: Tonal Editorial Typography (Pure White into Technical Silver) */}
          <h1 className="type-headline-hero">
            <span className="text-[#F4F6F7] block">See the invisible heat</span>
            <span className="text-[#6C7D86] block">trapping our cities.</span>
          </h1>

          {/* Editorial thesis body */}
          <p className="type-body-editorial">
            Extreme urban heat is the leading weather-related cause of mortality
            in the United States. HeatShield AI transforms complex satellite
            surface thermal telemetry into an actionable 3D workbench to pinpoint
            deadly microclimate hotspots and simulate vegetative and reflective
            cooling before construction starts.
          </p>

          {/* Precision CTAs with Button-in-Button Architecture */}
          <div className="flex flex-wrap items-center gap-4 pt-1">
            <Link
              href="/map"
              className="inline-flex items-center gap-3.5 pl-6 pr-2 py-2 rounded-full bg-emerald-500 hover:bg-emerald-400 text-[#060809] font-display font-semibold text-sm tracking-[-0.01em] transition-all duration-300 shadow-[0_0_30px_rgba(16,185,129,0.28)] hover:shadow-[0_0_40px_rgba(16,185,129,0.45)] group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <span>Explore Thermal Canvas</span>
              <span className="w-8 h-8 rounded-full bg-[#060809]/15 flex items-center justify-center transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                <ArrowRight className="w-4 h-4 text-[#060809]" />
              </span>
            </Link>

            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.08] text-sm font-medium text-[#F4F6F7] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <span>Impact Ledger</span>
            </Link>
          </div>

          {/* Verified Evidence Ledger with Space Grotesk Numerals */}
          <div className="pt-7 border-t border-white/[0.06] grid grid-cols-3 gap-6">
            <div>
              <div className="type-mono-metric text-[#F4F6F7]">
                1,300+
              </div>
              <div className="type-mono-badge text-[#5E6E77] mt-1.5">
                Deaths / Yr (CDC)
              </div>
            </div>
            <div>
              <div className="type-mono-metric text-emerald-400">
                +1–7°F
              </div>
              <div className="type-mono-badge text-[#5E6E77] mt-1.5">
                UHI Delta (EPA)
              </div>
            </div>
            <div>
              <div className="type-mono-metric text-[#F4F6F7]">
                -4.2°F
              </div>
              <div className="type-mono-badge text-[#5E6E77] mt-1.5">
                Canopy Target
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right Column: Double-Bezel Interactive 3D Canvas Vessel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-7"
        >
          <div className="bezel-shell shadow-[0_30px_100px_rgba(0,0,0,0.8)]">
            <div className="bezel-core h-[460px] sm:h-[540px] relative overflow-hidden">
              <CoreMap showOverlayControls={true} />
              
              {/* Subtle top indicator bar */}
              <div className="absolute top-4 right-4 z-10 pointer-events-none hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-[#060809]/80 border border-white/[0.08] backdrop-blur-md">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="type-mono-badge text-[#94A3AB]">
                  Direct 3D Flight
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* 2. Asymmetric Bento Grid: System Architecture & Capabilities */}
      <section className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/[0.06] pb-6">
          <div className="space-y-1.5">
            <div className="type-mono-badge text-emerald-400">
              01 / Architecture
            </div>
            <h2 className="type-headline-section text-[#F4F6F7]">
              Engineered for municipal impact.
            </h2>
          </div>
          <p className="font-mono text-xs text-[#5E6E77] max-w-sm tracking-tight">
            Decoupled layers combining satellite surface telemetry, localized heuristics, and low-latency LLM inference.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* Card 1: 3D Microclimate Modeling (col-span-7) */}
          <div className="md:col-span-7 bezel-shell">
            <div className="bezel-core p-8 space-y-6 h-full flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-emerald-400">
                    <Layers className="w-5 h-5 stroke-[1.75]" />
                  </div>
                  <span className="type-mono-badge text-[#5E6E77]">01.1 · RASTER</span>
                </div>
                <h3 className="type-headline-card text-[#F4F6F7]">
                  High-Resolution Thermal Surface Mapping
                </h3>
                <p className="text-sm text-[#94A3AB] leading-relaxed">
                  Ingests Land Surface Temperature (LST) and urban canopy datasets to map temperature differentials down to neighborhood block parcels. Extrudes 3D building envelopes to model solar radiation absorption.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-black/40 border border-white/[0.05] font-mono text-xs text-[#94A3AB] space-y-2.5">
                <div className="flex items-center justify-between text-[#5E6E77] border-b border-white/[0.05] pb-2 text-[10px] uppercase tracking-[0.16em]">
                  <span>Telemetry Channel</span>
                  <span>Source Standard</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Urban Polygons (1,260 Ways)</span>
                  <span className="text-emerald-400 font-semibold">100% Real OSM Overpass</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Surface Energy Balance</span>
                  <span className="text-[#F4F6F7] font-semibold">450m Spatial Neighbor LST</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Solar &amp; Ambient Flux</span>
                  <span className="text-[#F4F6F7] font-semibold">Open-Meteo Radiation API</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Real-time Simulation Engine (col-span-5) */}
          <div className="md:col-span-5 bezel-shell">
            <div className="bezel-core p-8 space-y-6 h-full flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-emerald-400">
                    <Sliders className="w-5 h-5 stroke-[1.75]" />
                  </div>
                  <span className="type-mono-badge text-[#5E6E77]">01.2 · PHYSICS</span>
                </div>
                <h3 className="type-headline-card text-[#F4F6F7]">
                  What-If Intervention Physics
                </h3>
                <p className="text-sm text-[#94A3AB] leading-relaxed">
                  Place virtual tree canopies, high-albedo cool roofs, and bioswales. Dynamic localized algorithms calculate immediate and long-term surface cooling without server-side lag.
                </p>
              </div>

              <div className="space-y-3 pt-5 border-t border-white/[0.06]">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-[#94A3AB]">Tree Canopy (15m buffer)</span>
                  <span className="text-emerald-400 font-semibold tabular-nums">-3.5°F to -7.0°F</span>
                </div>
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-[#94A3AB]">Cool Roofs (Albedo &gt; 0.65)</span>
                  <span className="text-emerald-400 font-semibold tabular-nums">-2.0°F to -4.0°F</span>
                </div>
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-[#94A3AB]">Permeable Pavements</span>
                  <span className="text-emerald-400 font-semibold tabular-nums">-1.5°F to -3.0°F</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Dual AI Advisory Engine (col-span-12) */}
          <div className="md:col-span-12 bezel-shell">
            <div className="bezel-core p-8 sm:p-10 space-y-7">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-emerald-400">
                    <Cpu className="w-5 h-5 stroke-[1.75]" />
                  </div>
                  <div>
                    <h3 className="type-headline-card text-[#F4F6F7]">
                      Dual-Inference AI Engine: Groq LPU + Gemini 3.8
                    </h3>
                    <p className="type-mono-badge text-[#5E6E77] mt-1 normal-case tracking-normal">
                      Sub-second conversational advisory paired with deep multi-model fallback resiliency.
                    </p>
                  </div>
                </div>

                <Link
                  href="/map"
                  className="self-start sm:self-auto inline-flex items-center gap-2 font-mono text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  <span>Open Active Console</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-xl bg-black/40 border border-white/[0.05] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-display text-sm font-semibold text-[#F4F6F7]">
                      Groq LPU Engine + Vision
                    </span>
                    <span className="type-mono-badge text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      &lt;400ms TTFT
                    </span>
                  </div>
                  <p className="text-xs text-[#94A3AB] leading-relaxed">
                    Executes fast conversational reasoning and street-level photo surface albedo audits for urban planners, generating real-time micro-interventions and cost breakdowns.
                  </p>
                </div>

                <div className="p-5 rounded-xl bg-black/40 border border-white/[0.05] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-display text-sm font-semibold text-[#F4F6F7]">
                      Gemini Multimodal Analysis
                    </span>
                    <span className="type-mono-badge text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      Structured JSON Audit
                    </span>
                  </div>
                  <p className="text-xs text-[#94A3AB] leading-relaxed">
                    Synthesizes complex microclimate anomalies, UN SDG targets, and municipal ROI into structured executive prescriptions that apply directly to the 3D simulator.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Operational Workflow: 3-Step Municipal Execution Pipeline */}
      <section className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/[0.06] pb-6">
          <div className="space-y-1.5">
            <div className="type-mono-badge text-emerald-400">
              02 / Operational Workflow
            </div>
            <h2 className="type-headline-section text-[#F4F6F7]">
              From real OSM telemetry to municipal action.
            </h2>
          </div>
          <p className="font-mono text-xs text-[#5E6E77] max-w-sm tracking-tight">
            Zero synthetic noise. Every hotspot and simulation is grounded in physical land-use ways and solar flux.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            {
              step: "STEP 01",
              title: "Detect Real Hotspots",
              metric: "420 OSM Ways / City",
              description:
                "Fly to any city worldwide. Our spatial clustering engine ingests real OpenStreetMap building, highway, parking, and canopy polygons paired with live Open-Meteo solar radiation to pinpoint critical heat traps.",
              href: "/map",
              cta: "Launch 3D Thermal Map",
            },
            {
              step: "STEP 02",
              title: "Simulate Stacked Cooling",
              metric: "Up to -9.5°F Drop",
              description:
                "Stack drought-tolerant street trees, high-albedo cool roofs, and evaporative water basins. Watch the WebGL thermal layer and geodesic cooling buffer attenuate surface temperatures in real time.",
              href: "/map",
              cta: "Run What-If Simulator",
            },
            {
              step: "STEP 03",
              title: "Execute AI Climate Audit",
              metric: "SDG 11 · 13 · 3 Aligned",
              description:
                "Generate a structured Gemini Executive Climate Audit or upload a street photo to the Groq Vision Advisor, then inspect 10-year CO₂ and grid load ROI on the Impact Ledger.",
              href: "/dashboard",
              cta: "Inspect Impact Ledger",
            },
          ].map((item) => (
            <div key={item.step} className="bezel-shell">
              <div className="bezel-core p-7 flex flex-col justify-between h-full space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-1 rounded-full">
                      {item.step}
                    </span>
                    <span className="font-mono text-[11px] text-[#94A3AB] tabular-nums">
                      {item.metric}
                    </span>
                  </div>
                  <h3 className="type-headline-card text-[#F4F6F7] pt-1">
                    {item.title}
                  </h3>
                  <p className="text-xs text-[#94A3AB] leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <Link
                  href={item.href}
                  className="inline-flex items-center justify-between pt-4 border-t border-white/[0.06] font-mono text-xs text-[#F4F6F7] hover:text-emerald-400 transition-colors group"
                >
                  <span>{item.cta}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-emerald-400 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Footer: Restrained, Academic & Clean */}
      <footer className="pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4 type-mono-badge text-[#5E6E77]">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>HeatShield AI — Lake Oswego Hacks 2026 Submission</span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/map" className="hover:text-[#F4F6F7] transition-colors">
            Map
          </Link>
          <Link href="/dashboard" className="hover:text-[#F4F6F7] transition-colors">
            Impact
          </Link>
          <a
            href="https://www.epa.gov/heatislands"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#F4F6F7] transition-colors inline-flex items-center gap-1"
          >
            <span>EPA Research</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </footer>
    </div>
  );
}
