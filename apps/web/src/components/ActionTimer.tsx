"use client";

import React, { useState, useEffect } from "react";
import { Play, Pause, CheckCircle } from "lucide-react";

interface ActionTimerProps {
  initialSeconds: number;
  onComplete: () => void;
  autoStart?: boolean;
}

export const ActionTimer: React.FC<ActionTimerProps> = ({
  initialSeconds,
  onComplete,
  autoStart = true,
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(autoStart);

  useEffect(() => {
    setSecondsRemaining(initialSeconds);
  }, [initialSeconds]);

  useEffect(() => {
    if (!isRunning || secondsRemaining <= 0) {
      if (secondsRemaining <= 0) {
        onComplete();
      }
      return;
    }

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, secondsRemaining, onComplete]);

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const progress = ((initialSeconds - secondsRemaining) / Math.max(initialSeconds, 1)) * 100;

  return (
    <div className="flex flex-col items-center py-2">
      <div className="relative w-28 h-28 flex items-center justify-center">
        {/* Circular Progress Ring */}
        <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="42"
            className="stroke-surfaceHover"
            strokeWidth="6"
            fill="transparent"
          />
          <circle
            cx="50"
            cy="50"
            r="42"
            className="stroke-accent transition-all duration-300 ease-linear"
            strokeWidth="6"
            strokeDasharray={2 * Math.PI * 42}
            strokeDashoffset={2 * Math.PI * 42 * (1 - progress / 100)}
            strokeLinecap="round"
            fill="transparent"
          />
        </svg>

        <div className="absolute flex flex-col items-center">
          <span className="text-2xl font-bold font-mono text-textPrimary tracking-tight">
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </span>
          <span className="text-[10px] text-textMuted uppercase font-mono">
            {secondsRemaining === 0 ? "Completed" : "Focus Timer"}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 mt-3">
        {secondsRemaining > 0 ? (
          <button
            onClick={() => setIsRunning(!isRunning)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surfaceHover border border-border text-xs text-textSecondary hover:text-textPrimary transition"
          >
            {isRunning ? (
              <>
                <Pause className="w-3.5 h-3.5" /> Pause
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" /> Resume
              </>
            )}
          </button>
        ) : (
          <div className="flex items-center gap-1 text-xs text-accent font-medium">
            <CheckCircle className="w-4 h-4" /> Ready for Measurement
          </div>
        )}
      </div>
    </div>
  );
};
