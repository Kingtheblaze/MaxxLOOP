"use client";

import React, { useEffect, useRef } from "react";
import { Phone, Heart, ExternalLink, ShieldCheck } from "lucide-react";
import { CrisisInfo } from "@/types";

interface CrisisModalProps {
  isOpen: boolean;
  onClose: () => void;
  crisisData?: CrisisInfo;
}

export const CrisisModal: React.FC<CrisisModalProps> = ({
  isOpen,
  onClose,
  crisisData,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
      if (event.key !== "Tab" || !modalRef.current) return;
      const focusable = Array.from(modalRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled])'));
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previousFocus?.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const helpline = crisisData || {
    country: "India",
    primary_helpline: "Tele-MANAS",
    // Note: Tele-MANAS is India's 24/7 National Mental Health Helpline (14416). Verify all numbers before production release.
    toll_free_number: "14416 / 1800-891-4416",
    secondary_helpline: "KIRAN Mental Health Helpline (1800-599-0019)",
    international_resource: "https://findahelpline.com/",
    support_message:
      "We noticed you may be carrying an overwhelming amount of stress right now. MaxxLoop is a focus and energy companion, not a crisis or medical service. Please connect with someone who can support you right now.",
    disclaimer: "Wellness support, not medical advice. No diagnoses, treatments, or prescriptions.",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div ref={modalRef} role="alertdialog" aria-modal="true" aria-labelledby="crisis-title" aria-describedby="crisis-description" className="w-full max-w-sm bg-surface border border-drop/40 rounded-2xl p-6 shadow-2xl space-y-4">
        <div className="w-12 h-12 rounded-full bg-drop/10 border border-drop/30 flex items-center justify-center mx-auto text-drop">
          <Heart className="w-6 h-6 animate-pulse" />
        </div>

        <div className="text-center space-y-2">
          <h3 id="crisis-title" className="text-lg font-semibold text-textPrimary">You are not alone</h3>
          <p id="crisis-description" className="text-sm text-textSecondary leading-relaxed">
            {helpline.support_message}
          </p>
        </div>

        {/* Helpline Contact Card */}
        <div className="bg-surfaceHover p-4 rounded-xl border border-border space-y-3">
          <div className="flex items-center justify-between text-xs text-textMuted font-mono">
            <span>24/7 FREE & CONFIDENTIAL</span>
            <span>{helpline.country}</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent shrink-0">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-textPrimary">{helpline.primary_helpline}</p>
              <a
                href={`tel:${helpline.toll_free_number.split('/')[0].trim()}`}
                className="text-base font-mono font-bold text-accent hover:underline"
              >
                {helpline.toll_free_number}
              </a>
            </div>
          </div>

          {helpline.secondary_helpline && (
            <p className="text-[11px] text-textMuted pt-1 border-t border-border/50">
              Secondary: {helpline.secondary_helpline}
            </p>
          )}
        </div>

        <div className="space-y-2 pt-2">
          <a
            href={helpline.international_resource}
            target="_blank"
            rel="noopener noreferrer"
            className="app-button-secondary w-full"
          >
            Find international helplines <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            ref={closeRef}
            onClick={onClose}
            className="app-button-secondary w-full"
          >
            Return to app
          </button>
        </div>

        <p className="text-[10px] text-center text-textMuted italic flex items-center justify-center gap-1">
          <ShieldCheck className="w-3 h-3 text-textMuted" />
          {helpline.disclaimer}
        </p>
      </div>
    </div>
  );
};
