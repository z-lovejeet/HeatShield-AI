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
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.45,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
      className="bezel-shell"
    >
      <div className="bezel-core p-6 h-full flex flex-col justify-between space-y-5">
        <div className="flex items-center justify-between gap-2">
          <span className="type-mono-badge text-[#5E6E77]">
            {index} · {label}
          </span>
          <div className="w-8 h-8 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center text-[#10B981]">
            <Icon className="w-4 h-4 stroke-[1.75]" />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-baseline justify-between gap-2">
            <div className="type-mono-metric text-[#F4F6F7] tracking-tight">
              {value}
            </div>
            {trendBadge && (
              <span className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#10B981]/12 text-[#10B981] border border-[#10B981]/30 tabular-nums whitespace-nowrap">
                {trendBadge}
              </span>
            )}
          </div>
          <p className="text-xs text-[#94A3AB] leading-relaxed font-sans">
            {subtext}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
