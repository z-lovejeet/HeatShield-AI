"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Workbench" },
  { href: "/map", label: "Thermal Canvas" },
  { href: "/dashboard", label: "Impact Ledger" },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="fixed top-5 inset-x-0 z-50 flex justify-center px-4 pointer-events-none">
      {/* N5 Floating Island Pill with Double-Bezel Architecture */}
      <div className="pointer-events-auto p-1 rounded-full bg-white/[0.03] border border-white/[0.08] shadow-[0_20px_50px_rgba(0,0,0,0.7)] backdrop-blur-xl">
        <div className="flex items-center gap-2 sm:gap-6 pl-4 pr-2 py-1.5 rounded-full bg-[#0B0F12]/95 border border-white/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
          {/* Wordmark */}
          <Link
            href="/"
            className="flex items-center gap-2.5 pr-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-full"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="font-display font-semibold text-sm tracking-[-0.02em] text-[#F4F6F7] whitespace-nowrap">
              HeatShield
            </span>
            <span className="hidden md:inline-block font-mono text-[10px] uppercase tracking-[0.18em] text-[#5E6E77] border-l border-white/[0.08] pl-2.5">
              UHI-SYS
            </span>
          </Link>

          {/* Navigation Links with Shared Layout Indicator */}
          <nav aria-label="Primary" className="flex items-center gap-0.5">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors duration-200 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
                    isActive
                      ? "text-[#060809] font-semibold"
                      : "text-[#94A3AB] hover:text-[#F4F6F7]"
                  )}
                >
                  {isActive && (
                    <motion.span
                      layoutId="active-nav-pill"
                      transition={{
                        type: "spring",
                        stiffness: 380,
                        damping: 32,
                      }}
                      className="absolute inset-0 rounded-full bg-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.35)]"
                    />
                  )}
                  <span className="relative z-10">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Action Pill (Button-in-Button micro pattern) */}
          <Link
            href="/map"
            className="hidden sm:inline-flex items-center gap-2 pl-3.5 pr-1.5 py-1 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-medium text-[#F4F6F7] transition-all duration-300 group whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <span className="font-mono text-[11px] text-[#94A3AB] group-hover:text-[#F4F6F7] transition-colors">
              Launch 3D
            </span>
            <span className="w-6 h-6 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300">
              <ArrowUpRight className="w-3.5 h-3.5 stroke-[1.75]" />
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}
