"use client";

import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  ReferenceLine,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { SparklinePoint } from "@/types";

interface SparklineChartProps {
  data: SparklinePoint[];
  baseline?: number;
  height?: number;
}

export const SparklineChart: React.FC<SparklineChartProps> = ({
  data,
  baseline = 50,
  height = 70,
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-16 flex items-center justify-center text-xs text-textMuted font-mono">
        Collecting baseline signals...
      </div>
    );
  }

  // Format date labels
  const formattedData = data.map((d, index) => ({
    ...d,
    index,
    displayTime: new Date(d.ts).toLocaleDateString([], {
      weekday: "short",
      hour: "2-digit",
    }),
  }));

  return (
    <div className="w-full flex flex-col">
      <div className="flex items-center justify-between text-[11px] text-textMuted font-mono mb-1">
        <span>14-DAY CAPACITY TRAJECTORY</span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-[2px] bg-slate-500 inline-block" />
          Base 50
        </span>
      </div>
      <div style={{ width: "100%", height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={formattedData} margin={{ top: 4, right: 2, left: 2, bottom: 0 }}>
            <defs>
              <linearGradient id="capacityGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00E599" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#00E599" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <YAxis domain={[20, 80]} hide />
            <XAxis dataKey="index" hide />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const p = payload[0].payload as SparklinePoint & { displayTime: string };
                  return (
                    <div className="bg-surface border border-border px-2.5 py-1.5 rounded shadow-lg text-xs font-mono">
                      <p className="text-textMuted text-[10px]">{p.displayTime}</p>
                      <p className="text-accent font-semibold">
                        Capacity: {Math.round(p.score)}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            {/* 50 Baseline Reference Line */}
            <ReferenceLine
              y={baseline}
              stroke="#334155"
              strokeDasharray="3 3"
              strokeWidth={1}
            />
            <Area
              type="monotone"
              dataKey="score"
              stroke="#00E599"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#capacityGradient)"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
