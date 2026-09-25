"use client";

import React from "react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

interface CapacityGaugeProps {
  score: number;
  baseline: number;
  delta: number;
  isDrop: boolean;
  statusLabel: string;
}

export const CapacityGauge: React.FC<CapacityGaugeProps> = ({
  score,
  baseline,
  delta,
  isDrop,
  statusLabel,
}) => {
  // SVG circular arc calculation
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, score)) / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center py-4">
      <div className="relative w-44 h-44 flex items-center justify-center">
        {/* SVG Circular Gauge */}
        <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 160 160">
          {/* Background Ring */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            className="stroke-surfaceHover"
            strokeWidth="10"
            fill="transparent"
          />
          {/* Baseline Indicator Tick (at 50%) */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            stroke="#334155"
            strokeWidth="12"
            strokeDasharray="2 300"
            strokeDashoffset={circumference - (50 / 100) * circumference}
            fill="transparent"
          />
          {/* Active Score Ring */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            className={`transition-all duration-1000 ease-out ${
              isDrop
                ? "stroke-drop filter drop-shadow-[0_0_8px_rgba(255,69,101,0.5)]"
                : "stroke-accent filter drop-shadow-[0_0_8px_rgba(0,229,153,0.4)]"
            }`}
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
          />
        </svg>

        {/* Center Value Content */}
        <div className="absolute flex flex-col items-center text-center">
          <span className="text-[11px] font-mono tracking-widest text-textMuted uppercase">
            Capacity
          </span>
          <span
            className={`text-4xl font-bold font-mono tracking-tight ${
              isDrop ? "text-drop" : "text-textPrimary"
            }`}
          >
            {Math.round(score)}
          </span>
          <div className="flex items-center gap-1 mt-0.5">
            {delta < 0 ? (
              <ArrowDownRight className="w-3.5 h-3.5 text-drop" />
            ) : delta > 0 ? (
              <ArrowUpRight className="w-3.5 h-3.5 text-accent" />
            ) : (
              <Minus className="w-3.5 h-3.5 text-textMuted" />
            )}
            <span
              className={`text-xs font-medium font-mono ${
                delta < 0 ? "text-drop" : delta > 0 ? "text-accent" : "text-textMuted"
              }`}
            >
              {delta > 0 ? `+${delta}` : delta} vs base
            </span>
          </div>
        </div>
      </div>

      {/* Status Pill */}
      <div
        className={`mt-2 px-3 py-1 rounded-full text-xs font-medium tracking-wide flex items-center gap-1.5 ${
          isDrop
            ? "bg-drop/10 text-drop border border-drop/30 animate-pulseSlow"
            : "bg-surfaceHover text-textSecondary border border-border"
        }`}
      >
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            isDrop ? "bg-drop" : "bg-accent"
          }`}
        />
        {statusLabel}
      </div>
    </div>
  );
};
