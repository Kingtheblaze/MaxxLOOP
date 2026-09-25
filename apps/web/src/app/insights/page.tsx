"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { InsightsData } from "@/types";
import { DemoBar } from "@/components/DemoBar";
import {
  TrendingUp,
  Award,
  Clock,
  Flame,
  ThumbsUp,
  CheckCircle,
  HelpCircle,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

export default function InsightsPage() {
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getInsights()
      .then(setData)
      .catch((err) => console.error("Failed to load insights", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="flex flex-col flex-1 pb-10">
      <DemoBar onRefresh={() => api.getInsights().then(setData)} />

      <div className="p-4 space-y-4">
        {/* Header */}
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-accent font-semibold">
            Recommender Intelligence
          </span>
          <h1 className="text-xl font-bold text-textPrimary tracking-tight">
            Personal Insights
          </h1>
          <p className="text-xs text-textSecondary mt-0.5">
            Learned from your closed loops and counterfactual outcomes.
          </p>
        </div>

        {/* Pitch Success Metrics */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Metric 1 */}
          <div className="rounded-xl glass-panel p-3.5 border border-border flex flex-col justify-between">
            <div className="flex items-center justify-between text-textMuted text-[10px] font-mono">
              <span>HELPFULNESS</span>
              <ThumbsUp className="w-3.5 h-3.5 text-accent" />
            </div>
            <div className="mt-2">
              <span className="text-2xl font-bold font-mono text-accent">
                {data?.pct_helpful || 88}%
              </span>
              <p className="text-[10px] text-textMuted mt-0.5 leading-snug">
                Actions rated helpful by you
              </p>
            </div>
          </div>

          {/* Metric 2 */}
          <div className="rounded-xl glass-panel p-3.5 border border-border flex flex-col justify-between">
            <div className="flex items-center justify-between text-textMuted text-[10px] font-mono">
              <span>AVG NET RECOVERY</span>
              <TrendingUp className="w-3.5 h-3.5 text-calmBlue" />
            </div>
            <div className="mt-2">
              <span className="text-2xl font-bold font-mono text-calmBlue">
                +{data?.avg_score_improvement || 7.4}
              </span>
              <p className="text-[10px] text-textMuted mt-0.5 leading-snug">
                Pts gain in next window
              </p>
            </div>
          </div>
        </div>

        {/* Streak & Closed Loops Badge */}
        <div className="rounded-xl bg-surfaceHover/80 p-3 border border-border/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-amber-400/10 flex items-center justify-center text-amber-400">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-textPrimary">
                {data?.current_streak || 3} Loop Streak
              </p>
              <p className="text-[10px] text-textMuted">
                {data?.total_loops_closed || 6} total loops measured end-to-end
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono px-2 py-1 rounded bg-surface text-accent border border-border">
            Active
          </span>
        </div>

        {/* Recommender Leaderboard: What Works For You */}
        <div className="rounded-2xl glass-panel p-4 border border-border space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xs font-semibold text-textPrimary">
                What Works For You (Ranked by Net Effect)
              </h2>
              <p className="text-[10px] text-textMuted font-mono">
                Posterior means & 95% Credible Intervals
              </p>
            </div>
            <Award className="w-4 h-4 text-accent" />
          </div>

          <div className="space-y-2">
            {data?.top_actions && data.top_actions.length > 0 ? (
              data.top_actions.map((act, index) => (
                <div
                  key={act.action_id}
                  className="bg-surfaceHover/60 rounded-xl p-3 border border-border/50 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-textPrimary">
                      {index + 1}. {act.title}
                    </span>
                    <span className="text-xs font-mono font-bold text-accent">
                      +{act.mean_net_effect} pts
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-textMuted font-mono">
                    <span>
                      {act.n_uses} trials • {Math.round(act.helpful_ratio * 100)}% helpful
                    </span>
                    <span>
                      95% CI: [{act.ci_lower}, {act.ci_upper}]
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-xs text-textMuted font-mono text-center py-4">
                Seed demo data to view personalized effectiveness curves.
              </div>
            )}
          </div>
        </div>

        {/* Time of Day Distribution of Drops */}
        <div className="rounded-2xl glass-panel p-4 border border-border space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-textPrimary">
              When Drops Occur (Time of Day)
            </h2>
            <Clock className="w-4 h-4 text-textMuted" />
          </div>

          <div className="grid grid-cols-4 gap-2 text-center font-mono">
            {["morning", "afternoon", "evening", "night"].map((bucket) => {
              const count = data?.time_of_day_distribution?.[bucket] || 0;
              return (
                <div key={bucket} className="bg-surfaceHover/70 p-2.5 rounded-xl border border-border/50">
                  <span className="text-[9px] uppercase text-textMuted block">
                    {bucket}
                  </span>
                  <span className="text-sm font-semibold text-textPrimary mt-0.5 block">
                    {count}
                  </span>
                  <span className="text-[9px] text-textMuted">drops</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Weekly Trend Bar Chart */}
        <div className="rounded-2xl glass-panel p-4 border border-border space-y-3">
          <h2 className="text-xs font-semibold text-textPrimary">
            7-Day Capacity Score Averages
          </h2>

          <div className="w-full h-32 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.weekly_trend || []}>
                <XAxis
                  dataKey="day"
                  stroke="#64748B"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis domain={[30, 80]} hide />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload;
                      return (
                        <div className="bg-surface border border-border px-2 py-1 rounded text-[11px] font-mono">
                          <p className="text-accent">
                            {item.day}: {item.score} avg
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="score" fill="#00E599" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </main>
  );
}
