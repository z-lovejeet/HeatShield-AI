"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Trees, Map, BarChart3, Home } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Overview", icon: Home },
  { href: "/map", label: "Heat Map & Simulator", icon: Map },
  { href: "/dashboard", label: "Impact Dashboard", icon: BarChart3 },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 inset-x-0 z-50 h-14 bg-[#1B1917]/95 border-b border-[#2F2C28] backdrop-blur-md shrink-0">
      <div className="max-w-[1600px] mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-4">
        {/* Brand Wordmark */}
        <Link
          href="/"
          className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5E9A7B] rounded-lg"
        >
          <div className="w-8 h-8 rounded-lg bg-[#5E9A7B]/15 border border-[#5E9A7B]/35 flex items-center justify-center text-[#78B093]">
            <Trees className="w-4 h-4" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-display font-semibold text-base tracking-tight text-[#F5F3EF]">
              HeatShield AI
            </span>
            <span className="hidden md:inline-block text-xs text-[#8C857B]">
              Cool City Planner
            </span>
          </div>
        </Link>

        {/* Primary Navigation */}
        <nav aria-label="Primary" className="flex items-center gap-1 bg-[#141311] p-1 rounded-xl border border-[#2C2925]">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-[13px] font-medium transition-colors whitespace-nowrap",
                  isActive
                    ? "bg-[#5E9A7B] text-[#141311] font-semibold"
                    : "text-[#B8B1A7] hover:text-[#F5F3EF] hover:bg-white/[0.04]"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right Action CTA */}
        <div className="hidden lg:flex items-center gap-3">
          <span className="text-xs text-[#8C857B]">
            Real OpenStreetMap + Open-Meteo Data
          </span>
          {pathname !== "/map" && (
            <Link
              href="/map"
              className="px-3.5 py-1.5 rounded-lg bg-[#5E9A7B] hover:bg-[#6CA889] text-[#141311] text-xs font-semibold transition-colors"
            >
              Open 3D Map
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
