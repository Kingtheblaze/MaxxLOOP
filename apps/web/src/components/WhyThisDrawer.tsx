"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp, Cpu, Info } from "lucide-react";
import { DriverItem, ActionData } from "@/types";

interface WhyThisDrawerProps {
  score: number;
  baseline: number;
  drivers: DriverItem[];
  action?: ActionData;
  provider?: string;
  mathDetails?: Record<string, any>;
}

export const WhyThisDrawer: React.FC<WhyThisDrawerProps> = ({
  score,
  baseline,
  drivers,
  action,
  provider = "template",
  mathDetails,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="w-full mt-3 border border-border/70 rounded-xl overflow-hidden bg-surface/50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 text-xs text-textSecondary hover:text-textPrimary transition"
      >
        <span className="flex items-center gap-1.5 font-medium">
          <Cpu className="w-3.5 h-3.5 text-accent" />
          Why this recommendation? (Math & Drivers)
        </span>
        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {isOpen && (
        <div className="px-3.5 pb-3.5 pt-1 border-t border-border/50 text-[11px] font-mono space-y-2.5 text-textSecondary">
          {/* Engine Computation Table */}
          <div>
            <span className="text-[10px] text-textMuted uppercase tracking-wider block mb-1">
              Active Driver Attributions
            </span>
            <div className="space-y-1">
              {drivers.map((d) => (
                <div
                  key={d.kind}
                  className="flex items-center justify-between bg-surfaceHover/80 px-2 py-1 rounded"
                >
                  <span className="text-textPrimary">{d.kind}</span>
                  <span className="text-drop">
                    z: {d.z_score} | impact: {Math.round(d.contribution * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Thompson Sampling Posterior */}
          <div className="bg-surfaceHover/60 p-2.5 rounded-lg border border-border/40">
            <span className="text-[10px] text-textMuted uppercase tracking-wider block mb-1">
              Recommender: Thompson Sampling
            </span>
            <p className="text-textSecondary leading-relaxed text-[11px]">
              Sampled from personal Beta posterior distribution. Action selected addressing overlapping drivers:{" "}
              <span className="text-accent">
                {action?.target_drivers.join(", ") || "general recovery"}
              </span>.
            </p>
            <div className="mt-1.5 flex items-center gap-3 text-[10px] text-textMuted">
              <span>Prior effect: {action?.prior_effect || 0.65}</span>
              <span>Exploration window: 15%</span>
              <span>Risk: low-risk non-medical</span>
            </div>
          </div>

          {/* Provider Attribution */}
          <div className="flex items-center justify-between pt-1 text-[10px] text-textMuted">
            <span>Explainer Engine:</span>
            <span className="text-accent uppercase font-semibold">{provider}</span>
          </div>
        </div>
      )}
    </div>
  );
};
