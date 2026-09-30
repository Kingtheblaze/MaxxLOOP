"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { FastForward, AlertTriangle, RefreshCw } from "lucide-react";
import { api } from "@/lib/api";

export const DemoBar: React.FC<{ onRefresh?: () => void; compact?: boolean }> = ({ onRefresh, compact = false }) => {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getDemoStatus().then(setStatus).catch(() => setError("Demo status is unavailable."));
  }, []);

  const handleTriggerDrop = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      await api.triggerDrop();
      setMessage("Capacity drop triggered.");
      if (onRefresh) onRefresh();
    } catch (e) {
      setError("Capacity drop could not be triggered. Please retry.");
    } finally {
      setLoading(false);
    }
  };

  const handleTimewarp = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const result = await api.timewarp();
      setMessage(result.message || "Measurement window advanced.");
      if (onRefresh) onRefresh();
    } catch (e) {
      setError("Measurement window could not be advanced. Please retry.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full border-b border-border/70 bg-surface/70 px-4 py-2.5 md:px-8">
    <div className="flex items-center justify-between gap-3 text-xs">
      <div className="flex items-center gap-1.5 text-textSecondary">
        <span aria-hidden="true" className="h-2 w-2 rounded-full bg-amber-400" />
        <span className="font-semibold text-textPrimary">DEMO ENVIRONMENT</span>
        <span className="hidden text-textMuted sm:inline">
          {status?.persona ? `· ${status.persona === "meera" ? "Meera Patel" : "Aarav Sharma"}` : error ? "· status unavailable" : "· loading status"}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {compact ? (
          <>
            {onRefresh && <button onClick={onRefresh} className="app-nav-link min-h-9 gap-1.5 px-2 text-xs" aria-label="Refresh page data"><RefreshCw aria-hidden="true" className="h-3.5 w-3.5" /> Refresh</button>}
            <Link href="/demo" className="app-nav-link min-h-9 px-2 text-xs">Demo console</Link>
          </>
        ) : <>
        <button
          onClick={handleTriggerDrop}
          disabled={loading}
          className="app-button-secondary min-h-9 border-drop/30 px-2.5 text-xs text-drop hover:bg-drop/10"
          title="Simulate capacity drop"
          aria-label="Simulate capacity drop"
        >
          <AlertTriangle aria-hidden="true" className="h-3.5 w-3.5" /> {loading ? "Working" : "Drop"}
        </button>

        <button
          onClick={handleTimewarp}
          disabled={loading}
          className="app-button-secondary min-h-9 border-accent/30 px-2.5 text-xs text-accent hover:bg-accent/10"
          title="Fast-forward measurement window to 20s"
          aria-label="Fast-forward measurement window"
        >
          <FastForward aria-hidden="true" className="h-3.5 w-3.5" /> {loading ? "Working" : "Warp"}
        </button>

        <Link
          href="/demo"
          className="app-nav-link min-h-9 px-2 text-xs"
        >
          Demo console
        </Link>
        </>}
      </div>
    </div>
    {(error || message) && <p role={error ? "alert" : "status"} aria-live="polite" className={`mt-2 text-xs ${error ? "text-drop" : "text-accent"}`}>{error || message}</p>}
    </div>
  );
};
