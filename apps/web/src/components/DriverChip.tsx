"use client";

import React from "react";
import { Moon, Monitor, Calendar, AlertCircle, Clock, Wind } from "lucide-react";
import { DriverItem } from "@/types";

interface DriverChipProps {
  driver: DriverItem;
}

export const DriverChip: React.FC<DriverChipProps> = ({ driver }) => {
  const getIcon = (kind: string) => {
    switch (kind) {
      case "sleep_hours":
        return <Moon className="w-3.5 h-3.5 text-blue-400" />;
      case "context_switches_per_hour":
      case "screen_minutes":
        return <Monitor className="w-3.5 h-3.5 text-amber-400" />;
      case "meeting_minutes":
      case "back_to_back_count":
        return <Calendar className="w-3.5 h-3.5 text-purple-400" />;
      case "hours_since_break":
        return <Clock className="w-3.5 h-3.5 text-rose-400" />;
      default:
        return <AlertCircle className="w-3.5 h-3.5 text-drop" />;
    }
  };

  return (
    <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-surface/80 border border-border text-left">
      <div className="p-1 rounded bg-surfaceHover shrink-0 mt-0.5">
        {getIcon(driver.kind)}
      </div>
      <div className="flex flex-col">
        <span className="text-xs text-textPrimary leading-snug font-medium">
          {driver.label}
        </span>
        <span className="text-[10px] text-textMuted font-mono mt-0.5">
          Weight impact: {Math.round(driver.contribution * 100)}% (z: {driver.z_score})
        </span>
      </div>
    </div>
  );
};
