"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { InsightsData } from "@/types";
import { DemoBar } from "@/components/DemoBar";
import { PageHeader } from "@/components/PageHeader";
import { StatusMessage } from "@/components/StatusMessage";
import {
  TrendingUp,
  Award,
  Clock,
  Flame,
  ThumbsUp,
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
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadInsights = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      setData(await api.getInsights());
    } catch {
      setLoadError("Insights could not be loaded. Check the API connection and retry.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadInsights();
  }, []);

  return (
    <main id="main-content" tabIndex={-1} className="flex flex-col flex-1 pb-10">
      <DemoBar onRefresh={loadInsights} compact />

      <div className="mx-auto w-full max-w-5xl space-y-5 p-5 md:space-y-6 md:p-8">
        <PageHeader eyebrow="Recommender intelligence" title="Personal insights" description="See which actions have helped and how your capacity has changed across measured loops." />

        {loadError && (
          <StatusMessage kind="error" className="items-center" action={
            <button onClick={loadInsights} disabled={loading} className="app-button-secondary min-h-9 shrink-0 border-drop/40 px-3 text-xs text-drop">
              Retry
            </button>
          }>{loadError}</StatusMessage>
        )}
        {!loading && !loadError && data && <p className="text-xs text-textSecondary">Based on {data.total_loops_closed} measured {data.total_loops_closed === 1 ? "loop" : "loops"}.</p>}

        {/* Pitch Success Metrics */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4">
          {/* Metric 1 */}
          <div className="app-panel flex min-h-32 flex-col justify-between p-4 md:p-5">
            <div className="flex items-center justify-between text-textMuted text-[10px] font-mono">
              <span>HELPFULNESS</span>
              <ThumbsUp className="w-3.5 h-3.5 text-accent" />
            </div>
            <div className="mt-2">
              <span className="text-3xl font-semibold font-mono text-accent">
                {loading || !data?.total_loops_closed ? "—" : `${data.pct_helpful}%`}
              </span>
              <p className="text-[10px] text-textMuted mt-0.5 leading-snug">
                Actions rated helpful by you
              </p>
            </div>
          </div>

          {/* Metric 2 */}
          <div className="app-panel flex min-h-32 flex-col justify-between p-4 md:p-5">
            <div className="flex items-center justify-between text-textMuted text-[10px] font-mono">
              <span>AVERAGE NET EFFECT</span>
              <TrendingUp className="w-3.5 h-3.5 text-calmBlue" />
            </div>
            <div className="mt-2">
              <span className="text-3xl font-semibold font-mono text-calmBlue">
                {loading || !data?.total_loops_closed ? "—" : `${data.avg_score_improvement > 0 ? "+" : ""}${data.avg_score_improvement}`}
              </span>
              <p className="text-[10px] text-textMuted mt-0.5 leading-snug">
                Measured points vs estimated no-action change
              </p>
            </div>
          </div>
        </div>

        {/* Streak & Closed Loops Badge */}
        <div className="app-panel flex items-center justify-between gap-3 p-4 md:px-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-amber-400/10 flex items-center justify-center text-amber-400">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-textPrimary">
                {loading || !data ? "—" : data.current_streak} Loop Streak
              </p>
              <p className="text-[10px] text-textMuted">
                {loading || !data ? "—" : data.total_loops_closed} total loops measured end-to-end
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono px-2 py-1 rounded bg-surface text-accent border border-border">
            {loading ? "Loading" : data?.total_loops_closed ? "Learning" : "No loops yet"}
          </span>
        </div>

        {/* Recommender Leaderboard: What Works For You */}
        <div className="app-panel space-y-4 p-5 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="app-section-title">
                What Works For You (Ranked by Net Effect)
              </h2>
              <p className="mt-1 text-xs text-textSecondary">
                Posterior means & 95% Credible Intervals
              </p>
            </div>
            <Award className="w-4 h-4 text-accent" />
          </div>

          <div className="space-y-2.5">
            {data?.top_actions && data.top_actions.length > 0 ? (
              data.top_actions.map((act, index) => (
                <div
                  key={act.action_id}
                  className="bg-surfaceHover/60 rounded-xl p-4 border border-border/50 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-textPrimary">
                      {index + 1}. {act.title}
                    </span>
                    <span className="text-xs font-mono font-bold text-accent">
                      +{act.mean_net_effect} pts
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-textSecondary">
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
              <div role="status" className="rounded-xl border border-border bg-surfaceHover/50 px-4 py-6 text-center text-sm text-textSecondary">
                {loading ? "Loading action outcomes…" : loadError ? "Action outcomes are unavailable right now." : "No completed loops yet. Close a loop to see measured outcomes here."}
              </div>
            )}
          </div>
        </div>

        {/* Time of Day Distribution of Drops */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <section className="app-panel space-y-4 p-5 md:p-6">
          <div className="flex items-center justify-between">
            <h2 className="app-section-title">
              When Drops Occur (Time of Day)
            </h2>
            <Clock className="w-4 h-4 text-textMuted" />
          </div>

          <div className="grid grid-cols-4 gap-2 text-center font-mono">
            {["morning", "afternoon", "evening", "night"].map((bucket) => {
              const count = loading || !data?.total_loops_closed ? "—" : data.time_of_day_distribution?.[bucket] ?? 0;
              return (
                <div key={bucket} className="bg-surfaceHover/70 p-3 rounded-xl border border-border/50">
                  <span className="text-[10px] uppercase tracking-wide text-textSecondary block">
                    {bucket}
                  </span>
                  <span className="text-sm font-semibold text-textPrimary mt-0.5 block">
                    {count}
                  </span>
                  <span className="text-[10px] text-textSecondary">drops</span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Weekly Trend Bar Chart */}
        <figure role="group" aria-labelledby="weekly-trend-caption" aria-describedby="weekly-trend-description" className="app-panel space-y-4 p-5 md:p-6">
          <figcaption className="app-section-title">
            <span id="weekly-trend-caption">
            7-Day Capacity Score Averages
            </span>
          </figcaption>
          <p id="weekly-trend-description" className="sr-only">{data?.weekly_trend?.map((point) => `${point.day}: ${point.score}`).join(". ") || "No capacity trend data is available."}</p>

          {data?.weekly_trend?.length ? <div className="h-48 w-full pt-2" aria-hidden="true">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.weekly_trend}>
                <XAxis
                  dataKey="day"
                  stroke="#8190A5"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis domain={[0, 100]} hide />
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
          </div> : <p role="status" className="flex h-48 items-center justify-center rounded-xl border border-border bg-surfaceHover/40 px-4 text-center text-sm text-textSecondary">{loading ? "Loading capacity trend…" : loadError ? "Capacity trend is unavailable right now." : "No capacity trend is available yet."}</p>}
        </figure>
        </div>
      </div>
    </main>
  );
}
