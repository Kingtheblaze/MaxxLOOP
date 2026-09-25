"use client";

import React, { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import {
  CapacityData,
  ActiveLoopState,
  LoopStage,
  CrisisInfo,
} from "@/types";
import { LoopRing } from "@/components/LoopRing";
import { CapacityGauge } from "@/components/CapacityGauge";
import { SparklineChart } from "@/components/SparklineChart";
import { DriverChip } from "@/components/DriverChip";
import { ActionTimer } from "@/components/ActionTimer";
import { WhyThisDrawer } from "@/components/WhyThisDrawer";
import { CrisisModal } from "@/components/CrisisModal";
import { DemoBar } from "@/components/DemoBar";
import {
  Check,
  ChevronRight,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  Sparkles,
  ShieldAlert,
  Send,
  Sliders,
  CheckCircle2,
} from "lucide-react";

export default function NowPage() {
  const [capacity, setCapacity] = useState<CapacityData | null>(null);
  const [activeLoop, setActiveLoop] = useState<ActiveLoopState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 10-second checkin form state
  const [focusVal, setFocusVal] = useState(3.5);
  const [energyVal, setEnergyVal] = useState(3.0);
  const [stressVal, setStressVal] = useState(2.5);
  const [checkinNote, setCheckinNote] = useState("");
  const [checkinSubmitting, setCheckinSubmitting] = useState(false);
  const [showCheckinDrawer, setShowCheckinDrawer] = useState(false);

  // Post-window measure form state
  const [postFocus, setPostFocus] = useState(4.0);
  const [postEnergy, setPostEnergy] = useState(3.8);
  const [postStress, setPostStress] = useState(2.0);
  const [measureSubmitting, setMeasureSubmitting] = useState(false);

  // Safety crisis modal state
  const [crisisData, setCrisisData] = useState<CrisisInfo | null>(null);
  const [showCrisisModal, setShowCrisisModal] = useState(false);

  // Feedback state
  const [feedbackSent, setFeedbackSent] = useState<boolean | null>(null);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const [capRes, loopRes] = await Promise.all([
        api.getCapacity(),
        api.getActiveLoop(),
      ]);
      setCapacity(capRes);
      setActiveLoop(loopRes);
    } catch (err: any) {
      console.error(err);
      setError("Unable to connect to MaxxLoop Engine. Ensure API is running on :8000.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle 10-second check-in submission
  const handleCheckinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckinSubmitting(true);
    try {
      const res = await api.submitCheckin({
        focus_self: Number(focusVal),
        energy_self: Number(energyVal),
        stress_self: Number(stressVal),
        note: checkinNote.trim() || undefined,
      });

      if (res.status === "crisis_intercepted" && res.crisis_card) {
        setCrisisData(res.crisis_card);
        setShowCrisisModal(true);
        setCheckinNote("");
        return;
      }

      setCheckinNote("");
      setShowCheckinDrawer(false);
      await loadData();
    } catch (err: any) {
      setError(err.message || "Failed to submit check-in");
    } finally {
      setCheckinSubmitting(false);
    }
  };

  // Start action
  const handleStartAction = async () => {
    if (!activeLoop?.intervention_id) return;
    try {
      await api.startLoopAction(activeLoop.intervention_id);
      await loadData();
    } catch (e: any) {
      setError(e.message);
    }
  };

  // Skip action (converts to control window)
  const handleSkipAction = async () => {
    if (!activeLoop?.intervention_id) return;
    try {
      await api.skipLoopAction(activeLoop.intervention_id, "User skipped");
      await loadData();
    } catch (e: any) {
      setError(e.message);
    }
  };

  // Submit measurement
  const handleMeasureSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeLoop?.intervention_id) return;
    setMeasureSubmitting(true);
    try {
      await api.measureLoopOutcome(activeLoop.intervention_id, {
        focus_self: Number(postFocus),
        energy_self: Number(postEnergy),
        stress_self: Number(postStress),
      });
      await loadData();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setMeasureSubmitting(false);
    }
  };

  // Submit feedback
  const handleFeedback = async (helpful: boolean) => {
    if (!activeLoop?.intervention_id) return;
    try {
      await api.submitFeedback(activeLoop.intervention_id, helpful);
      setFeedbackSent(helpful);
    } catch (e: any) {
      console.error(e);
    }
  };

  const currentStage: LoopStage = activeLoop?.has_active_loop
    ? activeLoop.stage
    : "track";

  return (
    <main className="flex flex-col flex-1 pb-10">
      {/* Top Demo Bar */}
      <DemoBar onRefresh={loadData} />

      {/* Signature 5-Stage Loop Ring */}
      <div className="pt-2 pb-1 border-b border-border/40">
        <LoopRing currentStage={currentStage} />
      </div>

      <div className="p-4 space-y-4">
        {/* Error Notification */}
        {error && (
          <div className="p-3 rounded-xl bg-drop/10 border border-drop/30 text-xs text-drop flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={loadData}
              className="underline font-semibold hover:text-white"
            >
              Retry
            </button>
          </div>
        )}

        {/* HERO LOOP CARD (When Capacity Drop or Intervention is active) */}
        {activeLoop?.has_active_loop && activeLoop.action && (
          <div className="rounded-2xl glass-panel-accent p-4 border border-accent/30 shadow-card space-y-3.5 relative overflow-hidden">
            {/* Stage Indicator Pill */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-widest text-accent font-semibold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                Active Loop • {activeLoop.stage}
              </span>
              <span className="text-[10px] text-textMuted font-mono">
                {activeLoop.explainer_provider} engine
              </span>
            </div>

            {/* STAGE: UNDERSTAND (Offered) */}
            {activeLoop.stage === "understand" && (
              <div className="space-y-3">
                <div>
                  <h2 className="text-base font-semibold text-textPrimary leading-snug">
                    {activeLoop.explanation?.headline || "Capacity Dip Detected"}
                  </h2>
                  <p className="text-xs text-textSecondary mt-1 leading-relaxed">
                    {activeLoop.explanation?.why}
                  </p>
                </div>

                {/* Root Driver Chips */}
                {activeLoop.drivers && activeLoop.drivers.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-mono text-textMuted uppercase tracking-wider block">
                      Detected Root Drivers
                    </span>
                    <div className="grid grid-cols-1 gap-1.5">
                      {activeLoop.drivers.map((d) => (
                        <DriverChip key={d.kind} driver={d} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommended ONE Action */}
                <div className="bg-surface/90 border border-accent/30 rounded-xl p-3.5 space-y-2 mt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase text-accent font-semibold">
                      Recommended 1 Micro-Action
                    </span>
                    <span className="text-[11px] font-mono text-textMuted">
                      {activeLoop.action.duration_min} min
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-textPrimary">
                    {activeLoop.action.title}
                  </h3>
                  <p className="text-xs text-textSecondary leading-relaxed">
                    {activeLoop.action.one_line_why}
                  </p>

                  <div className="space-y-1 pt-1">
                    {activeLoop.action.steps.map((step, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2 text-xs text-textSecondary"
                      >
                        <span className="w-4 h-4 rounded-full bg-surfaceHover text-textMuted flex items-center justify-center text-[10px] shrink-0 font-mono mt-0.5">
                          {idx + 1}
                        </span>
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Why This Drawer */}
                <WhyThisDrawer
                  score={capacity?.score || 35}
                  baseline={capacity?.baseline || 50}
                  drivers={activeLoop.drivers || []}
                  action={activeLoop.action}
                  provider={activeLoop.explainer_provider}
                />

                {/* Controls: Start or Skip */}
                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={handleStartAction}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-accent text-background font-semibold text-xs hover:bg-accent-hover transition flex items-center justify-center gap-1.5 shadow-glow"
                  >
                    Start {activeLoop.action.duration_min}m Action
                  </button>
                  <button
                    onClick={handleSkipAction}
                    className="py-2.5 px-3 rounded-xl bg-surfaceHover border border-border text-textMuted text-xs hover:text-textSecondary transition"
                    title="Skip (will count as counterfactual control window)"
                  >
                    Skip
                  </button>
                </div>
              </div>
            )}

            {/* STAGE: ACT (Started) */}
            {activeLoop.stage === "act" && (
              <div className="space-y-3 text-center">
                <div>
                  <h2 className="text-base font-semibold text-textPrimary">
                    {activeLoop.action.title}
                  </h2>
                  <p className="text-xs text-textSecondary mt-0.5">
                    {activeLoop.action.one_line_why}
                  </p>
                </div>

                {/* Countdown Timer */}
                <ActionTimer
                  initialSeconds={activeLoop.window_seconds_remaining || 180}
                  onComplete={() => loadData()}
                />

                <div className="bg-surface/70 rounded-xl p-3 text-left space-y-1.5 border border-border/50">
                  <span className="text-[10px] font-mono text-textMuted uppercase">
                    Step Checklist
                  </span>
                  {activeLoop.action.steps.map((st, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 text-xs text-textSecondary"
                    >
                      <Check className="w-3.5 h-3.5 text-accent shrink-0 mt-0.5" />
                      <span>{st}</span>
                    </div>
                  ))}
                </div>

                {/* Manual Complete / Proceed to Measurement */}
                <button
                  onClick={() => {
                    setActiveLoop((prev) =>
                      prev ? { ...prev, stage: "measure" } : null
                    );
                  }}
                  className="w-full py-2.5 rounded-xl bg-surfaceHover border border-border text-textSecondary hover:text-textPrimary text-xs transition"
                >
                  I finished early → Proceed to Measure
                </button>
              </div>
            )}

            {/* STAGE: MEASURE (Post-window Re-check) */}
            {activeLoop.stage === "measure" && (
              <form onSubmit={handleMeasureSubmit} className="space-y-3">
                <div>
                  <h2 className="text-base font-semibold text-textPrimary">
                    Closing the Loop: Re-Measure
                  </h2>
                  <p className="text-xs text-textSecondary mt-0.5">
                    2-tap check-in to compute your observed delta vs counterfactual no-action baseline.
                  </p>
                </div>

                {/* Sliders */}
                <div className="space-y-2.5 bg-surface/80 p-3 rounded-xl border border-border">
                  <div>
                    <div className="flex justify-between text-xs text-textSecondary mb-1 font-mono">
                      <span>Post Focus</span>
                      <span className="text-accent font-semibold">{postFocus}/5</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      step="0.5"
                      value={postFocus}
                      onChange={(e) => setPostFocus(parseFloat(e.target.value))}
                      className="w-full accent-accent"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-textSecondary mb-1 font-mono">
                      <span>Post Energy</span>
                      <span className="text-accent font-semibold">{postEnergy}/5</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      step="0.5"
                      value={postEnergy}
                      onChange={(e) => setPostEnergy(parseFloat(e.target.value))}
                      className="w-full accent-accent"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-textSecondary mb-1 font-mono">
                      <span>Post Stress</span>
                      <span className="text-drop font-semibold">{postStress}/5</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      step="0.5"
                      value={postStress}
                      onChange={(e) => setPostStress(parseFloat(e.target.value))}
                      className="w-full accent-drop"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={measureSubmitting}
                  className="w-full py-2.5 rounded-xl bg-accent text-background font-semibold text-xs hover:bg-accent-hover transition flex items-center justify-center gap-1.5 shadow-glow"
                >
                  {measureSubmitting ? "Computing Net Effect..." : "Measure & Record Outcome"}
                </button>
              </form>
            )}

            {/* STAGE: IMPROVE (Outcome Result) */}
            {activeLoop.stage === "improve" && activeLoop.latest_outcome && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold text-textPrimary">
                    Loop Outcome Recorded
                  </h2>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surfaceHover text-textSecondary border border-border">
                    {activeLoop.latest_outcome.confidence} Confidence
                  </span>
                </div>

                {/* Before / After Stats Bar */}
                <div className="grid grid-cols-3 gap-2 bg-surface/80 p-3 rounded-xl border border-border text-center font-mono">
                  <div>
                    <span className="text-[10px] text-textMuted uppercase block">Pre</span>
                    <span className="text-sm font-semibold text-drop">
                      {Math.round(activeLoop.latest_outcome.pre_score)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-textMuted uppercase block">Post</span>
                    <span className="text-sm font-semibold text-accent">
                      {Math.round(activeLoop.latest_outcome.post_score)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-textMuted uppercase block">Net Effect</span>
                    <span className="text-sm font-bold text-accent">
                      +{activeLoop.latest_outcome.net_effect} pts
                    </span>
                  </div>
                </div>

                <p className="text-xs text-textSecondary leading-relaxed bg-surfaceHover/50 p-2.5 rounded-lg border border-border/40">
                  <span className="text-accent font-semibold">Honest Measurement:</span> Observed change was{" "}
                  <span className="text-textPrimary font-mono">
                    +{activeLoop.latest_outcome.observed_delta} pts
                  </span>. After subtracting your estimated counterfactual drift without action (
                  <span className="text-textPrimary font-mono">
                    +{activeLoop.latest_outcome.expected_delta_no_action} pts
                  </span>), the net treatment effect is{" "}
                  <span className="text-accent font-mono font-semibold">
                    +{activeLoop.latest_outcome.net_effect} pts
                  </span>.
                </p>

                {/* Was this helpful? */}
                <div className="pt-1">
                  <span className="text-[11px] text-textMuted block text-center mb-2">
                    Did this micro-action help you feel more grounded?
                  </span>
                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={() => handleFeedback(true)}
                      className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-xs transition ${
                        feedbackSent === true
                          ? "bg-accent/20 border-accent text-accent font-semibold"
                          : "bg-surfaceHover border-border text-textSecondary hover:text-textPrimary"
                      }`}
                    >
                      <ThumbsUp className="w-3.5 h-3.5" /> Yes, helpful
                    </button>
                    <button
                      onClick={() => handleFeedback(false)}
                      className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-xs transition ${
                        feedbackSent === false
                          ? "bg-drop/20 border-drop text-drop font-semibold"
                          : "bg-surfaceHover border-border text-textMuted hover:text-textSecondary"
                      }`}
                    >
                      <ThumbsDown className="w-3.5 h-3.5" /> Not helpful
                    </button>
                  </div>
                </div>

                <button
                  onClick={loadData}
                  className="w-full py-2 rounded-xl bg-surface border border-border text-xs text-textSecondary hover:text-textPrimary transition mt-2"
                >
                  Close Loop & Return Home
                </button>
              </div>
            )}
          </div>
        )}

        {/* DEFAULT VIEW: CAPACITY GAUGE & 10-SEC CHECKIN */}
        <div className="rounded-2xl glass-panel p-4 border border-border shadow-card space-y-4">
          <CapacityGauge
            score={capacity?.score || 50}
            baseline={capacity?.baseline || 50}
            delta={capacity?.delta || 0}
            isDrop={capacity?.is_drop || false}
            statusLabel={capacity?.status_label || "Balanced Operational Capacity"}
          />

          {/* 14-Day Sparkline */}
          <div className="pt-2 border-t border-border/50">
            <SparklineChart data={capacity?.sparkline || []} baseline={50} />
          </div>

          {/* Quick Check-in Drawer Toggle */}
          <div className="pt-1">
            {!showCheckinDrawer ? (
              <button
                onClick={() => setShowCheckinDrawer(true)}
                className="w-full py-2.5 px-4 rounded-xl bg-surfaceHover border border-border hover:border-accent/40 text-xs text-textSecondary hover:text-textPrimary transition flex items-center justify-between group"
              >
                <span className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-accent" />
                  10-Second State Check-in
                </span>
                <ChevronRight className="w-4 h-4 text-textMuted group-hover:translate-x-0.5 transition" />
              </button>
            ) : (
              <form onSubmit={handleCheckinSubmit} className="space-y-3.5 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-textPrimary">
                    10-Second Check-in
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowCheckinDrawer(false)}
                    className="text-[10px] text-textMuted hover:text-textSecondary"
                  >
                    Cancel
                  </button>
                </div>

                <div className="space-y-2 text-xs font-mono">
                  <div>
                    <div className="flex justify-between text-textSecondary mb-1">
                      <span>Focus Level</span>
                      <span className="text-accent">{focusVal}/5</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      step="0.5"
                      value={focusVal}
                      onChange={(e) => setFocusVal(parseFloat(e.target.value))}
                      className="w-full accent-accent"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-textSecondary mb-1">
                      <span>Energy Level</span>
                      <span className="text-accent">{energyVal}/5</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      step="0.5"
                      value={energyVal}
                      onChange={(e) => setEnergyVal(parseFloat(e.target.value))}
                      className="w-full accent-accent"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-textSecondary mb-1">
                      <span>Stress Level</span>
                      <span className="text-drop">{stressVal}/5</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      step="0.5"
                      value={stressVal}
                      onChange={(e) => setStressVal(parseFloat(e.target.value))}
                      className="w-full accent-drop"
                    />
                  </div>
                </div>

                {/* Optional Note (Tested with crisis scanner) */}
                <div>
                  <input
                    type="text"
                    value={checkinNote}
                    onChange={(e) => setCheckinNote(e.target.value)}
                    placeholder="Optional note (e.g. 3 back-to-back classes)..."
                    className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-xs text-textPrimary placeholder:text-textMuted focus:outline-none focus:border-accent"
                  />
                  <p className="text-[10px] text-textMuted mt-1">
                    Crisis words automatically trigger Tele-MANAS (14416) safety card.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={checkinSubmitting}
                  className="w-full py-2.5 rounded-xl bg-accent text-background font-semibold text-xs hover:bg-accent-hover transition shadow-glow flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  {checkinSubmitting ? "Evaluating Engine..." : "Submit Check-in"}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Safety Note */}
        <div className="text-center pt-2 text-[10px] text-textMuted font-mono">
          Wellness support companion, not medical advice. MaxxLoop ASYNC 2026.
        </div>
      </div>

      {/* Crisis Interception Modal */}
      <CrisisModal
        isOpen={showCrisisModal}
        onClose={() => setShowCrisisModal(false)}
        crisisData={crisisData || undefined}
      />
    </main>
  );
}
