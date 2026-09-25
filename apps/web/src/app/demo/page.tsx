"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import {
  PlayCircle,
  FastForward,
  AlertTriangle,
  UserCheck,
  RotateCcw,
  Sparkles,
  CheckCircle,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

export default function DemoConsolePage() {
  const [selectedPersona, setSelectedPersona] = useState<"aarav" | "meera">("aarav");
  const [seedStatus, setSeedStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [demoState, setDemoState] = useState<any>(null);

  const loadStatus = async () => {
    try {
      const st = await api.getDemoStatus();
      setDemoState(st);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleSeed = async (persona: "aarav" | "meera") => {
    setLoading(true);
    setSeedStatus(null);
    try {
      setSelectedPersona(persona);
      const res = await api.seedDemo(persona);
      setSeedStatus(`Seeded ${res.persona_name} with ${res.signals_seeded} signals!`);
      await loadStatus();
    } catch (e: any) {
      setSeedStatus(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerDrop = async () => {
    setLoading(true);
    try {
      const res = await api.triggerDrop();
      setSeedStatus(`Capacity drop triggered (Score: ${res.score})!`);
      await loadStatus();
    } catch (e: any) {
      setSeedStatus(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTimewarp = async () => {
    setLoading(true);
    try {
      const res = await api.timewarp();
      setSeedStatus(res.message);
      await loadStatus();
    } catch (e: any) {
      setSeedStatus(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex flex-col flex-1 p-4 space-y-4 pb-12">
      {/* Header */}
      <div>
        <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-semibold flex items-center gap-1.5">
          <PlayCircle className="w-3.5 h-3.5 text-amber-400" />
          Judge Evaluation Suite
        </span>
        <h1 className="text-xl font-bold text-textPrimary tracking-tight">
          Demo Console (90-Sec Loop)
        </h1>
        <p className="text-xs text-textSecondary mt-0.5">
          Deterministic closed-loop demonstration for ASYNC 2026 Hackathon judges.
        </p>
      </div>

      {/* 90-Second Walkthrough Guide */}
      <div className="rounded-2xl bg-surfaceHover/80 p-3.5 border border-border space-y-2">
        <h2 className="text-xs font-semibold text-textPrimary uppercase tracking-wider font-mono">
          90-Second Demo Cheat Sheet
        </h2>
        <div className="space-y-1.5 text-xs text-textSecondary">
          <p>
            <span className="text-accent font-semibold">1. Seed Persona:</span> Pick Aarav (Exam week) or Meera (Meetings).
          </p>
          <p>
            <span className="text-drop font-semibold">2. Trigger Drop:</span> Simulates acute capacity drop below threshold.
          </p>
          <p>
            <span className="text-calmBlue font-semibold">3. Go to Now:</span> Observe Detect → Understand (drivers) → Start Action.
          </p>
          <p>
            <span className="text-amber-300 font-semibold">4. Time-Warp:</span> Fast-forward 25m window to 20s for instant measurement.
          </p>
          <p>
            <span className="text-accent font-semibold">5. Measure & Close:</span> 2-tap check-in displays net effect & posterior update.
          </p>
        </div>
      </div>

      {/* Persona Selection */}
      <div className="space-y-2">
        <span className="text-xs font-semibold text-textPrimary uppercase tracking-wider font-mono">
          Step 1: Select Demo Persona
        </span>

        <div className="grid grid-cols-1 gap-2.5">
          {/* Aarav Card */}
          <div
            onClick={() => handleSeed("aarav")}
            className={`p-3.5 rounded-xl border cursor-pointer transition ${
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
          </div>

          {/* Meera Card */}
          <div
            onClick={() => handleSeed("meera")}
            className={`p-3.5 rounded-xl border cursor-pointer transition ${
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
          </div>
        </div>
      </div>

      {/* Action Triggers */}
      <div className="rounded-2xl glass-panel p-4 border border-border space-y-3">
        <span className="text-xs font-semibold text-textPrimary uppercase tracking-wider font-mono">
          Step 2 & 3: Interactive Triggers
        </span>

        <div className="space-y-2">
          <button
            onClick={handleTriggerDrop}
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-drop/20 border border-drop/50 text-drop font-semibold text-xs hover:bg-drop/30 transition flex items-center justify-center gap-2"
          >
            <AlertTriangle className="w-4 h-4" /> Trigger Immediate Capacity Drop
          </button>

          <button
            onClick={handleTimewarp}
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-accent/20 border border-accent/50 text-accent font-semibold text-xs hover:bg-accent/30 transition flex items-center justify-center gap-2"
          >
            <FastForward className="w-4 h-4" /> Time-Warp Measurement Window (20s)
          </button>
        </div>

        {seedStatus && (
          <p className="text-xs text-accent font-mono text-center p-2 rounded bg-surfaceHover border border-border">
            {seedStatus}
          </p>
        )}
      </div>

      {/* Return to Now screen */}
      <Link
        href="/"
        className="w-full py-3 px-4 rounded-xl bg-accent text-background font-bold text-xs hover:bg-accent-hover transition flex items-center justify-center gap-2 shadow-glow"
      >
        Open Hero Loop Screen (Now) <ExternalLink className="w-4 h-4" />
      </Link>
    </main>
  );
}
