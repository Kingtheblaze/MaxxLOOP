"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import {
  PlayCircle,
  FastForward,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";

export default function DemoConsolePage() {
  const [selectedPersona, setSelectedPersona] = useState<"aarav" | "meera">("aarav");
  const [seedStatus, setSeedStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [demoState, setDemoState] = useState<any>(null);
  const [statusError, setStatusError] = useState(false);

  const loadStatus = async () => {
    try {
      const st = await api.getDemoStatus();
      setDemoState(st);
    } catch (e) {
      setStatusError(true);
      setSeedStatus("Demo status could not be loaded. Please retry.");
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleSeed = async (persona: "aarav" | "meera") => {
    setLoading(true);
    setSeedStatus(null);
    setStatusError(false);
    try {
      setSelectedPersona(persona);
      const res = await api.seedDemo(persona);
      setSeedStatus(`Seeded ${res.persona_name} with ${res.signals_seeded} signals!`);
      await loadStatus();
    } catch (e: any) {
      setStatusError(true);
      setSeedStatus(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerDrop = async () => {
    setLoading(true);
    setStatusError(false);
    try {
      const res = await api.triggerDrop();
      setSeedStatus(`Capacity drop triggered (Score: ${res.score})!`);
      await loadStatus();
    } catch (e: any) {
      setStatusError(true);
      setSeedStatus(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTimewarp = async () => {
    setLoading(true);
    setStatusError(false);
    try {
      const res = await api.timewarp();
      setSeedStatus(res.message);
      await loadStatus();
    } catch (e: any) {
      setStatusError(true);
      setSeedStatus(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main id="main-content" tabIndex={-1} className="mx-auto flex w-full max-w-5xl flex-1 flex-col space-y-6 px-5 pb-12 pt-6 md:px-8 md:pt-8">
      {/* Header */}
      <PageHeader eyebrow={<span className="flex items-center gap-1.5 text-amber-300"><PlayCircle aria-hidden="true" className="h-3.5 w-3.5 text-amber-400" /> Interactive walkthrough</span>} title="See one complete MaxxLoop cycle." description="Use local demo data to follow a capacity signal through a recommended action, a measured outcome, and the next learning loop." />

      {/* 90-Second Walkthrough Guide */}
      <details className="rounded-xl border border-border bg-surfaceHover/50 p-4">
        <summary className="cursor-pointer text-sm font-semibold text-textPrimary focus-visible:text-accent">
          Guided demo steps
        </summary>
        <div className="mt-3 space-y-2 text-sm text-textSecondary">
          <p><span className="font-semibold text-textPrimary">1. Choose a persona</span> to load a deterministic signal history.</p>
          <p><span className="font-semibold text-textPrimary">2. Trigger a capacity drop</span> to create a new loop.</p>
          <p><span className="font-semibold text-textPrimary">3. Open Now</span> to review detected drivers and one recommended action.</p>
          <p><span className="font-semibold text-textPrimary">4. Start the action</span>, then use time-warp to advance the measurement window.</p>
          <p><span className="font-semibold text-textPrimary">5. Measure and share feedback</span> to update the insight for the next loop.</p>
        </div>
      </details>

      <section aria-labelledby="workflow-heading" className="app-panel p-5 md:p-6">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="app-eyebrow">The MaxxLoop cycle</p>
            <h2 id="workflow-heading" className="mt-1 text-lg font-semibold text-textPrimary">From signal to the next loop</h2>
          </div>
          <span className="text-xs text-textSecondary">One measured loop</span>
        </div>
        <ol aria-label="Eight steps in the MaxxLoop cycle" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[["01", "Input", "Check-in signals"], ["02", "Analysis", "Identify drivers"], ["03", "Recommendation", "Choose one action"], ["04", "Action", "Try the action"], ["05", "Measurement", "Compare change"], ["06", "Feedback", "Rate helpfulness"], ["07", "Insight", "Update what works"], ["08", "Next loop", "Use what was learned"]].map(([number, title, detail]) => (
            <li key={number} className="flex min-w-0 items-start gap-3 rounded-xl border border-border bg-surfaceHover/50 p-3">
              <span className="font-mono text-xs font-semibold text-accent">{number}</span>
              <span className="min-w-0"><span className="block text-sm font-semibold text-textPrimary">{title}</span><span className="mt-0.5 block text-xs text-textSecondary">{detail}</span></span>
            </li>
          ))}
        </ol>
      </section>

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2 lg:gap-6">
      {/* Persona Selection */}
      <section className="space-y-3">
        <h2 className="app-section-title">
          Step 1: Select Demo Persona
        </h2>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
          {/* Aarav Card */}
          <button
            type="button"
            onClick={() => handleSeed("aarav")}
            disabled={loading}
            aria-pressed={selectedPersona === "aarav"}
            className={`w-full rounded-xl border p-4 text-left transition ${
              selectedPersona === "aarav"
                ? "bg-surfaceHover border-accent shadow-glow"
                : "bg-surface border-border hover:border-borderLight"
            }`}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-textPrimary">
                Aarav Sharma (Exam Week)
              </h3>
              {selectedPersona === "aarav" && (
                <CheckCircle className="w-4 h-4 text-accent" />
              )}
            </div>
            <p className="text-xs text-textSecondary mt-1 leading-snug">
              Final-year CS student facing midterms, late-night sleep debt (5.8h), and high tab thrashing.
            </p>
            <div className="flex items-center gap-2 mt-2 text-[10px] font-mono text-textMuted">
              <span>Sleep: 5.8h</span>
              <span>•</span>
              <span>Tabs: 24/hr</span>
              <span>•</span>
              <span>14-day history</span>
            </div>
          </button>

          {/* Meera Card */}
          <button
            type="button"
            onClick={() => handleSeed("meera")}
            disabled={loading}
            aria-pressed={selectedPersona === "meera"}
            className={`w-full rounded-xl border p-4 text-left transition ${
              selectedPersona === "meera"
                ? "bg-surfaceHover border-accent shadow-glow"
                : "bg-surface border-border hover:border-borderLight"
            }`}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-textPrimary">
                Meera Patel (Meeting Heavy)
              </h3>
              {selectedPersona === "meera" && (
                <CheckCircle className="w-4 h-4 text-accent" />
              )}
            </div>
            <p className="text-xs text-textSecondary mt-1 leading-snug">
              Tech intern overwhelmed with 6+ hours of back-to-back Zoom calls and no recovery buffer.
            </p>
            <div className="flex items-center gap-2 mt-2 text-[10px] font-mono text-textMuted">
              <span>Meetings: 260m</span>
              <span>•</span>
              <span>Back-to-backs: 4</span>
              <span>•</span>
              <span>14-day history</span>
            </div>
          </button>
        </div>
      </section>

      {/* Action Triggers */}
      <section className="app-panel space-y-4 p-5 md:p-6">
        <h2 className="app-section-title">
          Step 2 & 3: Interactive Triggers
        </h2>

        <div className="space-y-2">
          <button
            onClick={handleTriggerDrop}
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-drop/20 border border-drop/50 text-drop font-semibold text-xs hover:bg-drop/30 transition flex items-center justify-center gap-2"
          >
            <AlertTriangle className="w-4 h-4" /> {loading ? "Working…" : "Trigger Immediate Capacity Drop"}
          </button>

          <button
            onClick={handleTimewarp}
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-accent/20 border border-accent/50 text-accent font-semibold text-xs hover:bg-accent/30 transition flex items-center justify-center gap-2"
          >
            <FastForward className="w-4 h-4" /> {loading ? "Working…" : "Time-Warp Measurement Window (20s)"}
          </button>
        </div>

        {seedStatus && (
          <p role={statusError ? "alert" : "status"} aria-live="polite" className={`rounded-xl border p-3 text-center text-sm ${statusError ? "border-drop/40 bg-drop/10 text-drop" : "border-accent/30 bg-accent/5 text-accent"}`}>
            {seedStatus}
          </p>
        )}
      </section>
      </div>

      {/* Return to Now screen */}
      <Link
        href="/"
        className="app-button-primary w-full md:mx-auto md:max-w-lg"
      >
        Open Hero Loop Screen (Now) <ExternalLink className="w-4 h-4" />
      </Link>
    </main>
  );
}
