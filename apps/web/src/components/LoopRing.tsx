"use client";

import React from "react";
import { LoopStage } from "@/types";
import { Activity, Compass, Zap, Gauge, TrendingUp } from "lucide-react";

interface LoopRingProps {
  currentStage: LoopStage;
  className?: string;
}

const STAGES: { id: LoopStage; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "track", label: "Track", icon: Activity },
  { id: "understand", label: "Understand", icon: Compass },
  { id: "act", label: "Act", icon: Zap },
  { id: "measure", label: "Measure", icon: Gauge },
  { id: "improve", label: "Improve", icon: TrendingUp },
];

export const LoopRing: React.FC<LoopRingProps> = ({ currentStage, className = "" }) => {
  const currentIndex = STAGES.findIndex((s) => s.id === currentStage);

  return (
    <div className={`flex flex-col items-center justify-center p-3 ${className}`}>
      {/* 5-Step Segmented Bar / Circular Progress Representation */}
      <div className="relative w-full px-2">
        {/* Background track line */}
        <div aria-hidden="true" className="absolute left-6 right-6 top-[18px] h-[2px] bg-border z-0" />

        {/* Progress highlight line */}
        <div
          aria-hidden="true"
          className="absolute left-6 top-[18px] h-[2px] bg-accent transition-all duration-500 z-0"
          style={{
            width: `${(currentIndex / (STAGES.length - 1)) * 88}%`,
          }}
        />

        <ol aria-label="Closed-loop stages" className="relative z-10 flex w-full items-center justify-between">
        {STAGES.map((s, idx) => {
          const isActive = s.id === currentStage;
          const isPassed = idx < currentIndex;
          const Icon = s.icon;

          return (
            <li
              key={s.id}
              aria-current={isActive ? "step" : undefined}
              className="flex flex-col items-center"
            >
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isActive
                    ? "bg-accent text-background ring-4 ring-accent/20 shadow-glow scale-110"
                    : isPassed
                    ? "bg-surfaceHover text-accent border border-accent/40"
                    : "bg-surface text-textMuted border border-border"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "stroke-[2.5]" : "stroke-[1.8]"}`} />
              </div>
              <span
                className={`mt-1.5 text-[10px] font-medium tracking-wider uppercase transition-colors ${
                  isActive
                    ? "text-accent font-semibold"
                    : isPassed
                    ? "text-textSecondary"
                    : "text-textMuted"
                }`}
              >
                {s.label}
              </span>
            </li>
          );
        })}
        </ol>
      </div>
    </div>
  );
};
