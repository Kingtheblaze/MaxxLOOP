"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { Activity, ArrowDownRight, ArrowRight, ArrowUpRight, Check, ChevronRight, Clock3, Heart, RefreshCw, Send, Sparkles, ThumbsDown, ThumbsUp, TrendingUp } from "lucide-react";
import { api } from "@/lib/api";
import { ActiveLoopState, CapacityData, CrisisInfo, InsightsData, LoopStage } from "@/types";
import { ActionTimer } from "@/components/ActionTimer";
import { AuthProvider, useAuth } from "@/components/AuthProvider";
import { CrisisModal } from "@/components/CrisisModal";
import { CycleProgress } from "@/components/CycleProgress";
import { DemoBar } from "@/components/DemoBar";
import { DriverChip } from "@/components/DriverChip";
import { PageHeader } from "@/components/PageHeader";
import { SparklineChart } from "@/components/SparklineChart";
import { StatusMessage } from "@/components/StatusMessage";
import { WhyThisDrawer } from "@/components/WhyThisDrawer";

interface SignalRecord { id: number; kind: string; value: number; source: string; ts: string }

function MetricCard({ label, value, note, icon: Icon, tone = "green" }: { label: string; value: string; note: string; icon: typeof Activity; tone?: "green" | "blue" | "neutral" }) {
  const iconTone = tone === "green" ? "bg-success/10 text-success" : tone === "blue" ? "bg-info/10 text-info" : "bg-surfaceHover text-textSecondary";
  return <section className="metric-card">
    <div className="flex items-center justify-between gap-2"><p className="text-xs font-medium text-textSecondary">{label}</p><span className={`grid h-8 w-8 place-items-center rounded-lg ${iconTone}`}><Icon aria-hidden="true" className="h-4 w-4" /></span></div>
    <p className="mt-3 text-2xl font-semibold tracking-tight text-textPrimary">{value}</p>
    <p className="mt-1 text-xs text-textMuted">{note}</p>
  </section>;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [capacity, setCapacity] = useState<CapacityData | null>(null);
  const [activeLoop, setActiveLoop] = useState<ActiveLoopState | null>(null);
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [recentSignals, setRecentSignals] = useState<SignalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [demoMode, setDemoMode] = useState(false);
  const [routeReady, setRouteReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [focusVal, setFocusVal] = useState(3.5);
  const [energyVal, setEnergyVal] = useState(3);
  const [stressVal, setStressVal] = useState(2.5);
  const [checkinNote, setCheckinNote] = useState("");
  const [checkinSubmitting, setCheckinSubmitting] = useState(false);
  const [showCheckin, setShowCheckin] = useState(false);
  const [checkinSuccess, setCheckinSuccess] = useState(false);

  const [postFocus, setPostFocus] = useState(4);
  const [postEnergy, setPostEnergy] = useState(3.8);
  const [postStress, setPostStress] = useState(2);
  const [measureSubmitting, setMeasureSubmitting] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState<boolean | null>(null);
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [crisisData, setCrisisData] = useState<CrisisInfo | null>(null);
  const [showCrisisModal, setShowCrisisModal] = useState(false);

  useEffect(() => {
    setDemoMode(new URLSearchParams(window.location.search).get("demo") === "1");
    setRouteReady(true);
  }, []);

  const loadData = useCallback(async () => {
    setError(null);
    try {
      const [capacityResult, loopResult] = await Promise.all([api.getCapacity(demoMode), api.getActiveLoop(demoMode)]);
      setCapacity(capacityResult);
      setActiveLoop(loopResult);
      setFeedbackSent(loopResult.latest_outcome?.user_helpful ?? null);
      const [insightsResult, signalResult] = await Promise.all([
        api.getInsights(demoMode).catch(() => null),
        demoMode ? Promise.resolve([]) : api.getHistory().catch(() => []),
      ]);
      setInsights(insightsResult as InsightsData | null);
      setRecentSignals(signalResult as SignalRecord[]);
    } catch {
      setError("We couldn't load your workspace. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [demoMode]);

  useEffect(() => { if (routeReady) void loadData(); }, [loadData, routeReady]);

  const handleCheckinSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCheckinSubmitting(true);
    setError(null);
    try {
      const result = await api.submitCheckin({ focus_self: Number(focusVal), energy_self: Number(energyVal), stress_self: Number(stressVal), note: checkinNote.trim() || undefined });
      if (result.status === "crisis_intercepted" && result.crisis_card) {
        setCrisisData(result.crisis_card);
        setShowCrisisModal(true);
        setCheckinNote("");
        return;
      }
      setCheckinNote("");
      setShowCheckin(false);
      setCheckinSuccess(true);
      await loadData();
    } catch {
      setError("Your check-in couldn't be saved. Please retry.");
    } finally {
      setCheckinSubmitting(false);
    }
  };

  const handleStartAction = async () => {
    if (!activeLoop?.intervention_id) return;
    if (demoMode) { setError("Actions are read-only in presentation mode. Return to the demo console to control the walkthrough."); return; }
    try { await api.startLoopAction(activeLoop.intervention_id); await loadData(); }
    catch { setError("The action couldn't be started. Please retry."); }
  };

  const handleSkipAction = async () => {
    if (!activeLoop?.intervention_id) return;
    try { await api.skipLoopAction(activeLoop.intervention_id, "User skipped"); await loadData(); }
    catch { setError("The action couldn't be skipped. Please retry."); }
  };

  const handleMeasureSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!activeLoop?.intervention_id) return;
    setMeasureSubmitting(true);
    try {
      await api.measureLoopOutcome(activeLoop.intervention_id, { focus_self: Number(postFocus), energy_self: Number(postEnergy), stress_self: Number(postStress) });
      await loadData();
    } catch { setError("Your measurement couldn't be recorded. Please retry."); }
    finally { setMeasureSubmitting(false); }
  };

  const handleFeedback = async (helpful: boolean) => {
    if (!activeLoop?.intervention_id) return;
    setFeedbackSubmitting(true);
    setFeedbackError(null);
    try { await api.submitFeedback(activeLoop.intervention_id, helpful); setFeedbackSent(helpful); }
    catch { setFeedbackError("Your feedback couldn't be saved. Please retry."); }
    finally { setFeedbackSubmitting(false); }
  };

  const currentStage: LoopStage = activeLoop?.has_active_loop ? activeLoop.stage : "track";
  const hasMeasurements = Boolean(capacity?.sparkline?.length);
  const number = (value: number | undefined) => value === undefined || !Number.isFinite(value) ? "—" : `${value > 0 ? "+" : ""}${value}`;

  return (
    <main id="main-content" tabIndex={-1} className="space-y-6 outline-none">
      {demoMode && <DemoBar onRefresh={loadData} compact />}
      <PageHeader
        eyebrow={demoMode ? "Presentation workspace · separate data" : "Your personal workspace"}
        title={demoMode ? "Demo dashboard" : "Dashboard"}
        description={demoMode ? "Follow the sample cycle without mixing demo activity into your account." : "Your capacity overview, recent check-ins, and the next step in your MaxxLoop cycle."}
        action={<button type="button" onClick={() => void loadData()} className="app-button-secondary min-h-10 px-3"><RefreshCw aria-hidden="true" className="h-4 w-4" />Refresh</button>}
      />

      {error && <StatusMessage kind="error" className="items-center" action={<button type="button" onClick={() => void loadData()} className="app-button-secondary min-h-9 px-3 text-xs">Try again</button>}>{error}</StatusMessage>}
      <CycleProgress currentStage={currentStage} />

      <section aria-label="Capacity overview" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Current capacity" value={loading ? "…" : hasMeasurements ? `${Math.round(capacity?.score ?? 0)}` : "—"} note={hasMeasurements ? capacity?.status_label ?? "Latest measurement" : "Complete a check-in to begin"} icon={Activity} />
        <MetricCard label="Personal baseline" value={loading ? "…" : hasMeasurements ? `${Math.round(capacity?.baseline ?? 0)}` : "—"} note="Calculated from your measurements" icon={TrendingUp} tone="blue" />
        <MetricCard label="Change from baseline" value={loading ? "…" : hasMeasurements ? number(capacity?.delta) : "—"} note="Latest measured difference" icon={capacity?.delta && capacity.delta < 0 ? ArrowDownRight : ArrowUpRight} tone={capacity?.delta && capacity.delta < 0 ? "neutral" : "green"} />
        <MetricCard label="Measured loops" value={loading ? "…" : `${insights?.total_loops_closed ?? 0}`} note="Completed with an outcome" icon={Check} tone="blue" />
      </section>

      <div className="grid min-w-0 grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,.85fr)]">
        <section className="app-panel min-w-0 p-5 sm:p-6" aria-labelledby="capacity-trend-title">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div><h2 id="capacity-trend-title" className="app-section-title">Capacity trend</h2><p className="mt-1 text-sm text-textSecondary">Your measured capacity over time</p></div>
            {hasMeasurements && <span className="rounded-full bg-success/10 px-3 py-1 text-xs font-medium text-success">{capacity?.sparkline.length} measurements</span>}
          </div>
          {loading && !capacity ? <div role="status" aria-label="Loading capacity chart" className="space-y-3 py-6"><div className="h-3 w-32 animate-pulse rounded bg-surfaceHover"/><div className="h-44 animate-pulse rounded-xl bg-surfaceHover/60"/></div> : hasMeasurements ? <SparklineChart data={capacity?.sparkline ?? []} baseline={capacity?.baseline ?? 50} height={230} emptyMessage="No capacity trend is available yet." /> : <div className="empty-state">
            <div><span className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-xl bg-accent/10 text-accent"><Activity className="h-5 w-5" aria-hidden="true" /></span><h3 className="text-sm font-semibold text-textPrimary">No measurements yet</h3><p className="mx-auto mt-1 max-w-sm text-sm text-textSecondary">Complete your first MaxxLoop check-in to begin a capacity trend based on your data.</p><button type="button" onClick={() => setShowCheckin(true)} className="app-button-primary mt-4">Start your first check-in <ArrowRight className="h-4 w-4" aria-hidden="true" /></button></div>
          </div>}
        </section>

        <section id="active-loop" aria-labelledby="next-action-title" className="app-panel min-w-0 p-5 sm:p-6">
          <div className="mb-5 flex items-start justify-between gap-3"><div><p className="app-eyebrow">Your next action</p><h2 id="next-action-title" className="mt-1 text-lg font-semibold text-textPrimary">{activeLoop?.has_active_loop ? "Continue your cycle" : "A practical next step"}</h2></div><span className="grid h-9 w-9 place-items-center rounded-xl bg-accent/10 text-accent"><Sparkles className="h-4 w-4" aria-hidden="true" /></span></div>
          {loading && !activeLoop ? <div role="status" className="h-40 animate-pulse rounded-xl bg-surfaceHover/60" /> : activeLoop?.has_active_loop && activeLoop.action ? <div className="space-y-4">
            <div className="rounded-xl border border-success/25 bg-success/10 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2"><span className="text-xs font-semibold text-success">{activeLoop.stage === "understand" ? "Recommended for you" : `Cycle stage · ${activeLoop.stage}`}</span><span className="rounded-full bg-surface px-2.5 py-1 text-xs text-textSecondary">{activeLoop.action.duration_min} min</span></div>
              <h3 className="mt-2 text-base font-semibold text-textPrimary">{activeLoop.action.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-textSecondary">{activeLoop.explanation?.why || activeLoop.action.one_line_why}</p>
            </div>

            {activeLoop.stage === "understand" && <>
              {activeLoop.drivers?.length ? <div className="space-y-2"><p className="text-xs font-semibold text-textSecondary">Signals behind this recommendation</p><div className="flex flex-wrap gap-2">{activeLoop.drivers.map((driver) => <DriverChip key={driver.kind} driver={driver} />)}</div></div> : null}
              <details className="rounded-xl border border-border bg-surface px-4 py-3"><summary className="cursor-pointer text-sm font-medium text-textPrimary">Why this recommendation?</summary><div className="mt-3 text-sm text-textSecondary"><p>{activeLoop.explanation?.why || activeLoop.action.one_line_why}</p>{activeLoop.action.steps.length > 0 && <ol className="mt-3 list-inside list-decimal space-y-1">{activeLoop.action.steps.map((step) => <li key={step}>{step}</li>)}</ol>}</div></details>
              <div className="flex gap-2"><button type="button" onClick={() => void handleStartAction()} className="app-button-primary flex-1">Start action <ArrowRight className="h-4 w-4" aria-hidden="true" /></button><button type="button" onClick={() => void handleSkipAction()} className="app-button-secondary px-3">Skip</button></div>
            </>}

            {activeLoop.stage === "act" && <div className="space-y-4"><ActionTimer initialSeconds={activeLoop.window_seconds_remaining || 180} onComplete={() => void loadData()} /><ol className="space-y-2">{activeLoop.action.steps.map((step, index) => <li key={step} className="flex gap-3 text-sm text-textSecondary"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-surfaceHover text-xs font-semibold text-textSecondary">{index + 1}</span>{step}</li>)}</ol><button type="button" onClick={() => setActiveLoop((current) => current ? { ...current, stage: "measure" } : current)} className="app-button-secondary w-full">I finished early · measure now</button></div>}

            {activeLoop.stage === "measure" && <form onSubmit={handleMeasureSubmit} className="space-y-4">
              <p className="text-sm text-textSecondary">How are you feeling after the action? Your answers measure what changed.</p>
              {[{label:"Focus",value:postFocus,set:setPostFocus},{label:"Energy",value:postEnergy,set:setPostEnergy},{label:"Stress",value:postStress,set:setPostStress}].map((item) => <label key={item.label} className="block text-sm text-textSecondary"> <span className="mb-1 flex justify-between"><span>{item.label}</span><span className="font-medium text-textPrimary">{item.value}/5</span></span><input aria-label={`Post-action ${item.label.toLowerCase()}`} type="range" min="1" max="5" step="0.5" value={item.value} onChange={(event) => item.set(Number(event.target.value))} className="w-full accent-accent" /></label>)}
              <button type="submit" disabled={measureSubmitting} aria-busy={measureSubmitting} className="app-button-primary w-full">{measureSubmitting ? "Recording measurement…" : "Record measurement"}</button>
            </form>}

            {activeLoop.stage === "improve" && activeLoop.latest_outcome && <div className="space-y-4">
              <div className="grid grid-cols-3 divide-x divide-border rounded-xl bg-surfaceHover p-3 text-center"><div><p className="text-xs text-textMuted">Before</p><p className="mt-1 text-lg font-semibold">{Math.round(activeLoop.latest_outcome.pre_score)}</p></div><div><p className="text-xs text-textMuted">After</p><p className="mt-1 text-lg font-semibold">{Math.round(activeLoop.latest_outcome.post_score)}</p></div><div><p className="text-xs text-textMuted">Net change</p><p className="mt-1 text-lg font-semibold text-accent">{number(activeLoop.latest_outcome.net_effect)}</p></div></div>
              <p className="text-sm text-textSecondary">Measurement confidence: <span className="font-medium text-textPrimary">{activeLoop.latest_outcome.confidence}</span></p>
              <div><p className="mb-2 text-center text-sm font-medium text-textPrimary">Was this action helpful?</p><div className="flex gap-2"><button type="button" onClick={() => void handleFeedback(true)} disabled={feedbackSubmitting} aria-pressed={feedbackSent === true} className={`app-button-secondary flex-1 ${feedbackSent === true ? "border-success/40 bg-success/10 text-success" : ""}`}><ThumbsUp className="h-4 w-4" aria-hidden="true"/>Helpful</button><button type="button" onClick={() => void handleFeedback(false)} disabled={feedbackSubmitting} aria-pressed={feedbackSent === false} className={`app-button-secondary flex-1 ${feedbackSent === false ? "border-error/40 bg-error/10 text-error" : ""}`}><ThumbsDown className="h-4 w-4" aria-hidden="true"/>Not helpful</button></div></div>
              {feedbackSent !== null && <StatusMessage kind="success">Feedback saved. It will inform future recommendations.</StatusMessage>}{feedbackError && <StatusMessage kind="error">{feedbackError}</StatusMessage>}
              <button type="button" onClick={() => void loadData()} className="w-full text-sm font-medium text-accent hover:underline">Return to your overview</button>
            </div>}
          </div> : <div className="empty-state min-h-[235px]">
            <div><span className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-xl bg-surfaceHover text-textSecondary"><Heart className="h-5 w-5" aria-hidden="true" /></span><h3 className="text-sm font-semibold text-textPrimary">No active action right now</h3><p className="mx-auto mt-1 max-w-sm text-sm text-textSecondary">A short check-in helps MaxxLoop understand what you need and whether an action may help.</p>{demoMode ? <Link href="/demo" className="app-button-secondary mt-4">Open demo console <ChevronRight className="h-4 w-4" aria-hidden="true" /></Link> : <button type="button" onClick={() => setShowCheckin(true)} className="app-button-primary mt-4">Start a check-in <ArrowRight className="h-4 w-4" aria-hidden="true" /></button>}</div>
          </div>}
        </section>
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-5 lg:grid-cols-2">
        <section className="app-panel min-w-0 p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3"><div><h2 className="app-section-title">What’s working</h2><p className="mt-1 text-sm text-textSecondary">Patterns from your measured cycles</p></div><TrendingUp className="h-5 w-5 text-accent" aria-hidden="true" /></div>
          {insights?.top_actions?.length ? <ol className="divide-y divide-border">{insights.top_actions.slice(0,3).map((action,index) => <li key={action.action_id} className="flex items-center gap-3 py-3"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-success/10 text-xs font-semibold text-success">0{index+1}</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium text-textPrimary">{action.title}</span><span className="text-xs text-textMuted">{action.n_uses} measured {action.n_uses===1?"cycle":"cycles"}</span></span><span className="text-sm font-semibold text-success">{number(action.mean_net_effect)}</span></li>)}</ol> : <div className="rounded-xl bg-surfaceHover px-4 py-5 text-sm text-textSecondary">Not enough data yet. Complete and rate more cycles to discover what works for you.<Link href="/insights" className="mt-2 inline-flex items-center gap-1 font-medium text-accent">View insights <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></Link></div>}
        </section>

        <section className="app-panel min-w-0 p-5 sm:p-6">
          <div className="mb-3 flex items-center justify-between gap-3"><div><h2 className="app-section-title">Recent activity</h2><p className="mt-1 text-sm text-textSecondary">Your latest saved check-in signals</p></div><Link href="/history" aria-label="View all history" className="rounded-lg p-2 text-textMuted hover:bg-surfaceHover hover:text-accent"><Clock3 className="h-4 w-4" aria-hidden="true" /></Link></div>
          {recentSignals.length ? <ol>{recentSignals.slice(0,4).map((signal) => <li key={signal.id} className="activity-row"><span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-surfaceHover text-textSecondary"><Activity className="h-4 w-4" aria-hidden="true" /></span><span className="min-w-0 flex-1"><span className="block text-sm font-medium capitalize text-textPrimary">{signal.kind.replaceAll("_"," ")} recorded</span><time dateTime={signal.ts} className="text-xs text-textMuted">{new Date(signal.ts).toLocaleString()}</time></span><span className="text-sm font-semibold text-textSecondary">{signal.value}</span></li>)}</ol> : <div className="rounded-xl bg-surfaceHover px-4 py-6 text-center text-sm text-textSecondary">{loading ? "Loading your recent activity…" : "Your check-ins will appear here once you record a measurement."}</div>}
        </section>
      </div>

      {checkinSuccess && <StatusMessage kind="success"><span className="font-semibold">Check-in saved.</span> Your capacity view is up to date.</StatusMessage>}
      {showCheckin && !demoMode && <section className="app-panel p-5 sm:p-6" aria-labelledby="checkin-title">
        <div className="mb-4 flex items-start justify-between gap-4"><div><p className="app-eyebrow">Track</p><h2 id="checkin-title" className="mt-1 text-lg font-semibold">How are you feeling right now?</h2><p className="mt-1 text-sm text-textSecondary">A quick check-in keeps your capacity trend personal.</p></div><button type="button" onClick={() => setShowCheckin(false)} className="app-button-secondary min-h-9 px-3 text-xs">Cancel</button></div>
        <form onSubmit={handleCheckinSubmit} className="grid gap-4 md:grid-cols-3">
          {[{label:"Focus",value:focusVal,set:setFocusVal},{label:"Energy",value:energyVal,set:setEnergyVal},{label:"Stress",value:stressVal,set:setStressVal}].map((item) => <label key={item.label} className="block text-sm text-textSecondary"><span className="mb-2 flex justify-between"><span>{item.label}</span><span className="font-medium text-textPrimary">{item.value}/5</span></span><input aria-label={`${item.label} level`} type="range" min="1" max="5" step="0.5" value={item.value} onChange={(event) => item.set(Number(event.target.value))} className="w-full accent-accent" /></label>)}
          <label className="text-sm text-textSecondary md:col-span-3">Optional note<input type="text" value={checkinNote} onChange={(event) => setCheckinNote(event.target.value)} className="app-field mt-1.5" placeholder="Anything that may be affecting your focus?"/><span className="mt-1 block text-xs text-textMuted">Notes are private and checked for safety before they are saved.</span></label>
          <button type="submit" disabled={checkinSubmitting} aria-busy={checkinSubmitting} className="app-button-primary md:col-span-3"><Send className="h-4 w-4" aria-hidden="true"/>{checkinSubmitting ? "Saving check-in…" : "Save check-in"}</button>
        </form>
      </section>}

      <p className="text-center text-xs text-textMuted">MaxxLoop supports focus and recovery habits. It is not a medical service.</p>
      <CrisisModal isOpen={showCrisisModal} onClose={() => setShowCrisisModal(false)} crisisData={crisisData || undefined} />
    </main>
  );
}
