"use client";

import React from "react";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

export interface StatCardProps {
  index: string;
  label: string;
  value: string;
  subtext: string;
  trendBadge?: string;
  icon: LucideIcon;
  delay?: number;
}

export function StatCard({
  index,
  label,
  value,
  subtext,
  trendBadge,
  icon: Icon,
  delay = 0,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
      className="rounded-2xl border border-[#33302B] bg-[#211F1C] p-6 flex flex-col justify-between space-y-4 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.45)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="text-[11px] font-medium text-[#8C857B] uppercase tracking-wider block">
            {index}
          </span>
          <span className="text-[13px] font-medium text-[#B8B1A7] mt-0.5 block">
            {label}
          </span>
        </div>
        <div className="w-9 h-9 rounded-xl bg-[#5E9A7B]/12 border border-[#5E9A7B]/25 flex items-center justify-center text-[#78B093] shrink-0">
          <Icon className="w-4 h-4 stroke-[1.75]" />
        </div>
      </div>

      <div className="space-y-2 pt-1">
        <div className="flex items-baseline justify-between gap-2 flex-wrap">
          <div className="font-display text-2xl sm:text-3xl font-bold text-[#F5F3EF] tracking-tight tabular-nums">
            {value}
          </div>
          {trendBadge && (
            <span className="font-mono text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-[#5E9A7B]/12 text-[#78B093] border border-[#5E9A7B]/25 tabular-nums whitespace-nowrap">
              {trendBadge}
            </span>
          )}
        </div>
        <p className="text-[13px] text-[#B8B1A7] leading-relaxed">
          {subtext}
        </p>
      </div>
    </motion.div>
  );
}
