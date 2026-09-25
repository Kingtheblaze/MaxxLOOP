"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Sparkles, FastForward, AlertTriangle, RefreshCw } from "lucide-react";
import { api } from "@/lib/api";

export const DemoBar: React.FC<{ onRefresh?: () => void }> = ({ onRefresh }) => {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.getDemoStatus().then(setStatus).catch(() => {});
  }, []);

  const handleTriggerDrop = async () => {
    setLoading(true);
    try {
      await api.triggerDrop();
      if (onRefresh) onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleTimewarp = async () => {
    setLoading(true);
    try {
      await api.timewarp();
      if (onRefresh) onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-surfaceHover/90 border-b border-border/80 px-3.5 py-1.5 flex items-center justify-between text-[11px] font-mono">
      <div className="flex items-center gap-1.5 text-textSecondary">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
        <span className="text-amber-300 font-semibold uppercase">Demo data</span>
        <span className="text-textMuted text-[10px]">
          ({status?.persona === "meera" ? "Meera" : "Aarav"})
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handleTriggerDrop}
          disabled={loading}
          className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-drop/15 text-drop border border-drop/30 hover:bg-drop/25 transition"
          title="Simulate capacity drop"
        >
          <AlertTriangle className="w-3 h-3" /> Drop
        </button>

        <button
          onClick={handleTimewarp}
          disabled={loading}
          className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-accent/15 text-accent border border-accent/30 hover:bg-accent/25 transition"
          title="Fast-forward measurement window to 20s"
        >
          <FastForward className="w-3 h-3" /> Warp
        </button>

        <Link
          href="/demo"
          className="text-textMuted hover:text-textPrimary text-[10px] underline ml-1"
        >
          Console
        </Link>
      </div>
    </div>
  );
};
