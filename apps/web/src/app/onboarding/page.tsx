"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { ArrowRight, CalendarDays, Cpu, Monitor, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { StatusMessage } from "@/components/StatusMessage";
import { readConsentPreferences, writeConsentPreferences } from "@/lib/consent-storage";

export default function OnboardingPage() {
  const router = useRouter();
  const [consentCalendar, setConsentCalendar] = useState(true);
  const [consentBrowser, setConsentBrowser] = useState(true);
  const [consentLLM, setConsentLLM] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [complete, setComplete] = useState(false);

  React.useEffect(() => {
    const saved = readConsentPreferences();
    if (!saved) return;
    setConsentCalendar(saved.consent_calendar);
    setConsentBrowser(saved.consent_browser_signals);
    setConsentLLM(saved.consent_llm_sharing);
  }, []);

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const preferences = {
        consent_calendar: consentCalendar,
        consent_browser_signals: consentBrowser,
        consent_llm_sharing: consentLLM,
        llm_provider: "template",
      };
      await api.updateConsent(preferences);
      writeConsentPreferences(preferences);
      setComplete(true);
    } catch {
      setError("Your preferences could not be saved. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main id="main-content" tabIndex={-1} className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center space-y-7 px-5 py-8 md:px-8 md:py-12">
      <div className="mb-1 flex items-center justify-between gap-4">
        <span className="flex items-center gap-2 text-sm font-semibold text-textPrimary">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-accent/30 bg-accent/10 text-accent"><ShieldCheck aria-hidden="true" className="h-5 w-5" /></span>
          Setup
        </span>
        <span aria-current="step" className="text-xs text-textSecondary">Step 1 of 1</span>
      </div>
      <div aria-hidden="true" className="h-1.5 overflow-hidden rounded-full bg-surfaceHover">
        <div className="h-full w-full rounded-full bg-accent" />
      </div>

      <PageHeader
        eyebrow="Private by default"
        title={complete ? "Your preferences are saved." : "Choose the signals MaxxLoop can use."}
        description={complete ? "You can review or update these choices any time in Privacy." : "Your choices control which signals can inform capacity estimates and whether sanitized summaries may be shared with an explanation provider."}
      />

      {error && <StatusMessage kind="error">{error}</StatusMessage>}

      {complete ? (
        <section className="app-panel space-y-4 p-5 md:p-6">
          <StatusMessage kind="success">Setup complete. Your consent preferences were saved.</StatusMessage>
          <button type="button" onClick={() => router.push("/")} className="app-button-primary w-full">
            Go to your workspace <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </button>
        </section>
      ) : (
        <form onSubmit={handleComplete} className="space-y-5">
          <fieldset className="app-panel space-y-4 p-5 md:p-6">
            <legend className="sr-only">Signal and explanation preferences</legend>
            <div>
              <h2 className="app-section-title">Signal permissions</h2>
              <p className="mt-1 text-sm text-textSecondary">Each source is optional. You can change these settings later.</p>
            </div>

            <label className="flex min-h-16 cursor-pointer items-center justify-between gap-4 rounded-xl border border-border bg-surfaceHover/50 p-4">
              <span className="flex items-start gap-3"><CalendarDays aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-calmBlue" /><span><span className="block text-sm font-medium text-textPrimary">Calendar load</span><span className="mt-1 block text-xs leading-relaxed text-textSecondary">Meeting duration and counts. Titles and attendee details are excluded.</span></span></span>
              <input type="checkbox" checked={consentCalendar} onChange={(e) => setConsentCalendar(e.target.checked)} aria-label="Allow calendar duration and meeting-count signals" className="h-5 w-5 shrink-0 accent-accent" />
            </label>

            <label className="flex min-h-16 cursor-pointer items-center justify-between gap-4 rounded-xl border border-border bg-surfaceHover/50 p-4">
              <span className="flex items-start gap-3"><Monitor aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-calmBlue" /><span><span className="block text-sm font-medium text-textPrimary">Browser switching</span><span className="mt-1 block text-xs leading-relaxed text-textSecondary">Tab-switch counts during focus sessions. URLs and page content are excluded.</span></span></span>
              <input type="checkbox" checked={consentBrowser} onChange={(e) => setConsentBrowser(e.target.checked)} aria-label="Allow browser tab-switch signals" className="h-5 w-5 shrink-0 accent-accent" />
            </label>

            <label className="flex min-h-16 cursor-pointer items-center justify-between gap-4 rounded-xl border border-border bg-surfaceHover/50 p-4">
              <span className="flex items-start gap-3"><Cpu aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-calmBlue" /><span><span className="block text-sm font-medium text-textPrimary">Share sanitized summaries for explanations</span><span className="mt-1 block text-xs leading-relaxed text-textSecondary">Off by default. Raw notes and personal text are excluded from the summary.</span></span></span>
              <input type="checkbox" checked={consentLLM} onChange={(e) => setConsentLLM(e.target.checked)} aria-label="Allow sanitized summaries to be shared with an explanation provider" className="h-5 w-5 shrink-0 accent-accent" />
            </label>
          </fieldset>

          <div className="rounded-xl border border-border bg-surfaceHover/40 p-4 text-sm text-textSecondary">
            <p className="font-medium text-textPrimary">What MaxxLoop does with your choices</p>
            <p className="mt-1 leading-relaxed">These permissions are saved to your local MaxxLoop profile. MaxxLoop is a focus and recovery companion; it does not provide medical advice.</p>
          </div>

          <button type="submit" disabled={saving} aria-busy={saving} className="app-button-primary w-full">
            {saving ? "Saving preferences…" : "Save preferences"}
            {!saving && <ArrowRight aria-hidden="true" className="h-4 w-4" />}
          </button>
        </form>
      )}
    </main>
  );
}
