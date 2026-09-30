"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { api } from "@/lib/api";
import { LLMPayloadInspection } from "@/types";
import { DemoBar } from "@/components/DemoBar";
import { PageHeader } from "@/components/PageHeader";
import { StatusMessage } from "@/components/StatusMessage";
import { clearConsentPreferences, readConsentPreferences, writeConsentPreferences } from "@/lib/consent-storage";
import {
  Eye,
  Download,
  Trash2,
  Lock,
  Calendar,
  Monitor,
  Cpu,
} from "lucide-react";

export default function PrivacyPage() {
  const { user, loading: authLoading } = useAuth();
  const [llmPayload, setLlmPayload] = useState<LLMPayloadInspection | null>(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [payloadLoading, setPayloadLoading] = useState(true);
  const [payloadError, setPayloadError] = useState(false);
  const [consentSaving, setConsentSaving] = useState(false);
  const [consentStatus, setConsentStatus] = useState<string | null>(null);

  // Consent flags
  const [consentCalendar, setConsentCalendar] = useState(true);
  const [consentBrowser, setConsentBrowser] = useState(true);
  const [consentLLM, setConsentLLM] = useState(false);

  const loadPayload = useCallback(async () => {
    setPayloadLoading(true);
    setPayloadError(false);
    try {
      setLlmPayload(await api.getLLMPayload());
    } catch {
      setPayloadError(true);
    } finally {
      setPayloadLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    const saved = readConsentPreferences();
    if (saved) {
      setConsentCalendar(saved.consent_calendar);
      setConsentBrowser(saved.consent_browser_signals);
      setConsentLLM(saved.consent_llm_sharing);
    }
    void loadPayload();
  }, [loadPayload, user]);

  const handleExport = async () => {
    setExportLoading(true);
    setActionError(null);
    setExportSuccess(false);
    try {
      const data = await api.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `maxxloop-export-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setExportSuccess(true);
    } catch (e) {
      setActionError("The telemetry export could not be prepared. Please retry.");
    } finally {
      setExportLoading(false);
    }
  };

  const handleDeleteAll = async () => {
    setDeleteLoading(true);
    setActionError(null);
    try {
      await api.deleteData();
      clearConsentPreferences();
      setDeleteSuccess(true);
      setDeleteConfirm(false);
    } catch (e) {
      setActionError("Data could not be deleted. Please retry.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleToggleConsent = async (
    field: "calendar" | "browser" | "llm",
    newVal: boolean
  ) => {
    const previous = { calendar: consentCalendar, browser: consentBrowser, llm: consentLLM };
    setConsentSaving(true);
    setConsentStatus(null);
    setActionError(null);
    let cal = consentCalendar;
    let br = consentBrowser;
    let ll = consentLLM;

    if (field === "calendar") {
      setConsentCalendar(newVal);
      cal = newVal;
    } else if (field === "browser") {
      setConsentBrowser(newVal);
      br = newVal;
    } else {
      setConsentLLM(newVal);
      ll = newVal;
    }

    try {
      const preferences = {
        consent_calendar: cal,
        consent_browser_signals: br,
        consent_llm_sharing: ll,
        llm_provider: "template",
      };
      await api.updateConsent(preferences);
      writeConsentPreferences(preferences);
      setConsentStatus("Privacy preferences saved.");
    } catch (e) {
      setConsentCalendar(previous.calendar);
      setConsentBrowser(previous.browser);
      setConsentLLM(previous.llm);
      setActionError("Your consent preference could not be saved. Please retry.");
    } finally {
      setConsentSaving(false);
    }
  };

  if (authLoading) {
    return <main className="mx-auto flex min-h-[60vh] w-full max-w-4xl flex-1 items-center justify-center px-5 text-sm text-textSecondary" aria-live="polite">Loading privacy controls…</main>;
  }

  if (!user) {
    return (
      <main id="main-content" tabIndex={-1} className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-5 py-10 md:px-8 md:py-16">
        <PageHeader eyebrow="Privacy at MaxxLoop" title="Your focus data belongs to you." description="Your personal workspace keeps check-ins and measured loops separate from other accounts. Account data controls are available after you sign in." />
        <section className="app-panel space-y-3 p-5 md:p-6"><h2 className="app-section-title">Private by account</h2><p className="text-sm leading-relaxed text-textSecondary">MaxxLoop associates each check-in, capacity history, recommendation, and feedback with the account authenticated by the API. The demo personas stay in their own shared presentation dataset.</p><Link href="/login" className="app-button-primary">Sign in to privacy controls</Link></section>
      </main>
    );
  }

  return (
    <main id="main-content" tabIndex={-1} className="mx-auto flex w-full max-w-5xl flex-1 flex-col pb-10">
      <DemoBar compact />

      <div className="mx-auto w-full space-y-5">
        <PageHeader eyebrow={<span className="flex items-center gap-2"><Lock aria-hidden="true" className="h-3.5 w-3.5" /> Your data, your controls</span>} title="Privacy and data" description="Review the signals MaxxLoop can use, inspect sanitized explanation payloads, and export or erase your telemetry." />

        {actionError && <StatusMessage kind="error">{actionError}</StatusMessage>}
        {consentStatus && <StatusMessage kind="success">{consentStatus}</StatusMessage>}

        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2 lg:gap-6">
        {/* Connected Sources & Consent Toggles */}
        <section className="app-panel space-y-4 p-5 md:p-6">
          <div><h2 className="app-section-title">Signal permissions</h2><p className="mt-1 text-sm text-textSecondary">Change which information may inform your capacity estimates.</p></div>

          <div className="space-y-2.5">
            {/* Calendar */}
            <label className="flex min-h-16 cursor-pointer items-center justify-between gap-4 rounded-xl border border-border/50 bg-surfaceHover/70 p-4">
              <div className="flex items-center gap-2.5">
                <Calendar className="w-4 h-4 text-purple-400" />
                <div>
                  <p className="text-xs font-semibold text-textPrimary">
                    Calendar Load Telemetry
                  </p>
                  <p className="text-[10px] text-textMuted">
                    Aggregates duration & meeting counts only. Raw event titles are never stored.
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={consentCalendar}
                disabled={consentSaving}
                onChange={(e) => handleToggleConsent("calendar", e.target.checked)}
                aria-label="Allow calendar duration and meeting-count signals"
                className="h-5 w-5 shrink-0 accent-accent"
              />
            </label>

            <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-border/50 bg-surfaceHover/70 p-3">
              <span className="flex items-start gap-2.5"><Cpu aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-calmBlue" /><span><span className="block text-sm font-medium text-textPrimary">Sanitized explanation summaries</span><span className="mt-1 block text-xs leading-relaxed text-textSecondary">Off by default. Raw notes and personal text are excluded.</span></span></span>
              <input type="checkbox" checked={consentLLM} disabled={consentSaving} onChange={(e) => handleToggleConsent("llm", e.target.checked)} aria-label="Allow sanitized summaries to be shared with an explanation provider" className="h-5 w-5 shrink-0 accent-accent" />
            </label>

            {/* Browser Visibility */}
            <label className="flex min-h-16 cursor-pointer items-center justify-between gap-4 rounded-xl border border-border/50 bg-surfaceHover/70 p-4">
              <div className="flex items-center gap-2.5">
                <Monitor className="w-4 h-4 text-amber-400" />
                <div>
                  <p className="text-xs font-semibold text-textPrimary">
                    Browser Tab-Switch Rate
                  </p>
                  <p className="text-[10px] text-textMuted">
                    Counts blur events during focus sprints. URLs and page content are never captured.
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={consentBrowser}
                disabled={consentSaving}
                onChange={(e) => handleToggleConsent("browser", e.target.checked)}
                aria-label="Allow browser tab-switch signals"
                className="h-5 w-5 shrink-0 accent-accent"
              />
            </label>
          </div>
        </section>

        {/* Live LLM Payload Transparency Viewer */}
        <section className="app-panel space-y-4 p-5 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-textPrimary">
                Sanitized explanation payload
              </h2>
              <p className="text-[10px] text-textMuted font-mono">
                Provider: {llmPayload?.provider_used || "template"}
              </p>
            </div>
            <Eye className="w-4 h-4 text-accent" />
          </div>

          <details className="overflow-hidden rounded-xl border border-border/60 bg-surfaceHover/90">
            <summary className="flex min-h-11 cursor-pointer items-center px-4 py-3 text-sm font-medium text-textSecondary hover:text-textPrimary">View last sanitized payload</summary>
            <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words border-t border-border/60 p-4 font-mono text-xs text-accent" aria-live={payloadLoading ? "polite" : undefined}>
              {payloadLoading ? "Loading payload details…" : JSON.stringify(llmPayload?.last_payload_sent || { status: "No LLM query executed yet" }, null, 2)}
            </pre>
          </details>
          {payloadError && <StatusMessage kind="error" className="items-center">Payload details could not be loaded.<button type="button" onClick={loadPayload} className="app-button-secondary min-h-9 shrink-0 border-drop/40 px-3 text-xs text-drop">Retry</button></StatusMessage>}

          {/* Excluded Fields Guarantee */}
          <div className="bg-surfaceHover/50 p-2.5 rounded-lg border border-border/30 text-[10px] text-textMuted space-y-1">
            <span className="font-semibold text-textSecondary uppercase font-mono block">
              Explicitly Excluded Fields (Redacted by Design):
            </span>
            <ul className="list-disc list-inside space-y-0.5 font-mono">
              <li>Raw calendar titles & attendee emails</li>
              <li>Free-text self-report notes</li>
              <li>Browser URLs & website domains</li>
              <li>Device IP address & persistent hardware IDs</li>
            </ul>
          </div>
        </section>

        {/* Export & Delete Actions */}
        <section className="app-panel space-y-4 p-5 md:col-span-2 md:p-6">
          <h2 className="app-section-title">
            Data Portability & Right to Erasure
          </h2>

          <div className="space-y-3">
            <button
              onClick={handleExport}
              disabled={exportLoading}
              className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-border bg-surfaceHover px-4 py-3 text-sm font-semibold text-textPrimary transition hover:border-accent/40"
            >
              <Download className="w-4 h-4 text-accent" />
              {exportLoading ? "Preparing JSON Export..." : "Export All Telemetry as JSON"}
            </button>

            {exportSuccess && <StatusMessage kind="success">Your telemetry export is ready.</StatusMessage>}

            {deleteConfirm && <StatusMessage kind="error" className="items-center"><span><strong>Permanent deletion.</strong> This erases all stored telemetry and cannot be undone.</span></StatusMessage>}
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                onClick={deleteConfirm ? handleDeleteAll : () => { setActionError(null); setDeleteConfirm(true); }}
                disabled={deleteSuccess || deleteLoading}
                aria-busy={deleteLoading}
                className="app-button-secondary min-h-11 flex-1 border-drop/40 text-drop hover:border-drop hover:bg-drop/10"
              >
                <Trash2 aria-hidden="true" className="h-4 w-4" /> {deleteLoading ? "Deleting…" : deleteConfirm ? "Confirm permanent deletion" : "Delete all data"}
              </button>
              {deleteConfirm && <button disabled={deleteLoading} onClick={() => setDeleteConfirm(false)} className="app-button-secondary min-h-11 flex-1">Cancel</button>}
            </div>

            {deleteSuccess && (
              <StatusMessage kind="success">All stored telemetry has been deleted.</StatusMessage>
            )}
          </div>
        </section>
        </div>
      </div>
    </main>
  );
}
