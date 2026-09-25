"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { ShieldCheck, ArrowRight, Lock, Check } from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  const [name, setName] = useState("Aarav");
  const [studyHours, setStudyHours] = useState("09:00 - 18:00");
  const [consentCalendar, setConsentCalendar] = useState(true);
  const [consentBrowser, setConsentBrowser] = useState(true);
  const [consentLLM, setConsentLLM] = useState(false);
  const [llmProvider, setLlmProvider] = useState("template");
  const [saving, setSaving] = useState(false);

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateConsent({
        consent_calendar: consentCalendar,
        consent_browser_signals: consentBrowser,
        consent_llm_sharing: consentLLM,
        llm_provider: llmProvider,
      });
      router.push("/");
    } catch (e) {
      console.error(e);
      router.push("/");
    }
  };

  return (
    <main className="flex flex-col flex-1 p-5 space-y-5 justify-center">
      {/* Brand header */}
      <div className="space-y-1 text-center">
        <div className="w-12 h-12 rounded-2xl bg-accent/15 border border-accent/30 flex items-center justify-center mx-auto text-accent mb-2">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold text-textPrimary tracking-tight">
          Welcome to MaxxLoop
        </h1>
        <p className="text-xs text-textSecondary">
          A closed-loop AI companion that protects your focus and recovery capacity.
        </p>
      </div>

      <form onSubmit={handleComplete} className="space-y-4">
        {/* Name input */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-textSecondary font-mono uppercase">
            Your Name / Nickname
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-xs text-textPrimary focus:outline-none focus:border-accent"
            placeholder="e.g. Aarav"
            required
          />
        </div>

        {/* Typical study hours */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-textSecondary font-mono uppercase">
            Typical Focus Hours
          </label>
          <input
            type="text"
            value={studyHours}
            onChange={(e) => setStudyHours(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-xs text-textPrimary focus:outline-none focus:border-accent"
            placeholder="09:00 - 18:00"
          />
        </div>

        {/* Data Source Toggles */}
        <div className="rounded-xl glass-panel p-3.5 border border-border space-y-3">
          <span className="text-[10px] font-mono uppercase text-accent font-semibold block">
            Local Telemetry Consent
          </span>

          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-xs text-textPrimary">Calendar Duration & Meeting Count</span>
            <input
              type="checkbox"
              checked={consentCalendar}
              onChange={(e) => setConsentCalendar(e.target.checked)}
              className="w-4 h-4 accent-accent"
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-xs text-textPrimary">Browser Tab-Switch Count</span>
            <input
              type="checkbox"
              checked={consentBrowser}
              onChange={(e) => setConsentBrowser(e.target.checked)}
              className="w-4 h-4 accent-accent"
            />
          </label>
        </div>

        {/* What Leaves Your Device */}
        <div className="rounded-xl bg-surfaceHover/70 p-3 border border-border/70 text-[11px] font-mono text-textMuted space-y-1">
          <span className="text-textSecondary font-semibold uppercase flex items-center gap-1.5">
            <Lock className="w-3 h-3 text-accent" /> What Leaves Your Device:
          </span>
          <p>
            <span className="text-accent">Zero raw text.</span> By default, all explanations run via local TemplateProvider. No API keys required.
          </p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 px-4 rounded-xl bg-accent text-background font-bold text-xs hover:bg-accent-hover transition flex items-center justify-center gap-2 shadow-glow"
        >
          {saving ? "Setting up..." : "Enter MaxxLoop"} <ArrowRight className="w-4 h-4" />
        </button>
      </form>
    </main>
  );
}
