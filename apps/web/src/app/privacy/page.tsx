"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { LLMPayloadInspection } from "@/types";
import { DemoBar } from "@/components/DemoBar";
import {
  ShieldCheck,
  Eye,
  Download,
  Trash2,
  Lock,
  Calendar,
  Monitor,
  Cpu,
  CheckCircle2,
} from "lucide-react";

export default function PrivacyPage() {
  const [llmPayload, setLlmPayload] = useState<LLMPayloadInspection | null>(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);

  // Consent flags
  const [consentCalendar, setConsentCalendar] = useState(true);
  const [consentBrowser, setConsentBrowser] = useState(true);
  const [consentLLM, setConsentLLM] = useState(false);

  useEffect(() => {
    api.getLLMPayload().then(setLlmPayload).catch(console.error);
  }, []);

  const handleExport = async () => {
    setExportLoading(true);
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
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Export error", e);
    } finally {
      setExportLoading(false);
    }
  };

  const handleDeleteAll = async () => {
    try {
      await api.deleteData();
      setDeleteSuccess(true);
      setDeleteConfirm(false);
    } catch (e) {
      console.error("Delete error", e);
    }
  };

  const handleToggleConsent = async (
    field: "calendar" | "browser" | "llm",
    newVal: boolean
  ) => {
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
      await api.updateConsent({
        consent_calendar: cal,
        consent_browser_signals: br,
        consent_llm_sharing: ll,
        llm_provider: "template",
      });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <main className="flex flex-col flex-1 pb-10">
      <DemoBar />

      <div className="p-4 space-y-4">
        {/* Header */}
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-accent font-semibold flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-accent" />
            Zero-Knowledge Local First
          </span>
          <h1 className="text-xl font-bold text-textPrimary tracking-tight">
            Data & Privacy
          </h1>
          <p className="text-xs text-textSecondary mt-0.5">
            You own your telemetry. Stored locally in SQLite. Never sold.
          </p>
        </div>

        {/* Connected Sources & Consent Toggles */}
        <div className="rounded-2xl glass-panel p-4 border border-border space-y-3">
          <h2 className="text-xs font-semibold text-textPrimary uppercase tracking-wider font-mono">
            Connected Signal Sources
          </h2>

          <div className="space-y-2.5">
            {/* Calendar */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-surfaceHover/70 border border-border/50">
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
                onChange={(e) => handleToggleConsent("calendar", e.target.checked)}
                className="w-4 h-4 accent-accent cursor-pointer"
              />
            </div>

            {/* Browser Visibility */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-surfaceHover/70 border border-border/50">
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
                onChange={(e) => handleToggleConsent("browser", e.target.checked)}
                className="w-4 h-4 accent-accent cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Live LLM Payload Transparency Viewer */}
        <div className="rounded-2xl glass-panel p-4 border border-border space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xs font-semibold text-textPrimary">
                Exact Sanitized Payload Sent to LLM
              </h2>
              <p className="text-[10px] text-textMuted font-mono">
                Provider: {llmPayload?.provider_used || "template"}
              </p>
            </div>
            <Eye className="w-4 h-4 text-accent" />
          </div>

          <div className="bg-surfaceHover/90 p-3 rounded-xl border border-border/60 font-mono text-[11px] text-textSecondary overflow-x-auto max-h-48">
            <pre className="text-accent">
              {JSON.stringify(llmPayload?.last_payload_sent || { status: "No LLM query executed yet" }, null, 2)}
            </pre>
          </div>

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
        </div>

        {/* Export & Delete Actions */}
        <div className="rounded-2xl glass-panel p-4 border border-border space-y-3">
          <h2 className="text-xs font-semibold text-textPrimary uppercase tracking-wider font-mono">
            Data Portability & Right to Erasure
          </h2>

          <div className="space-y-2">
            <button
              onClick={handleExport}
              disabled={exportLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-surfaceHover border border-border hover:border-accent/40 text-xs text-textPrimary font-semibold transition flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4 text-accent" />
              {exportLoading ? "Preparing JSON Export..." : "Export All Telemetry as JSON"}
            </button>

            {!deleteConfirm ? (
              <button
                onClick={() => setDeleteConfirm(true)}
                className="w-full py-2 px-4 rounded-xl bg-drop/10 border border-drop/30 hover:bg-drop/20 text-xs text-drop transition flex items-center justify-center gap-2"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete All Data Permanently
              </button>
            ) : (
              <div className="p-3 rounded-xl bg-drop/15 border border-drop/40 space-y-2">
                <p className="text-xs text-drop font-semibold text-center">
                  Are you sure? This erases all SQLite rows immediately.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleDeleteAll}
                    className="flex-1 py-1.5 rounded-lg bg-drop text-white text-xs font-semibold hover:bg-red-600 transition"
                  >
                    Yes, Erase Everything
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(false)}
                    className="flex-1 py-1.5 rounded-lg bg-surface border border-border text-xs text-textSecondary hover:text-white transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {deleteSuccess && (
              <p className="text-xs text-accent font-mono text-center flex items-center justify-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> All user telemetry deleted.
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
