import React from "react";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";

interface StatusMessageProps {
  kind: "success" | "error" | "info";
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

const styles = {
  success: { wrapper: "app-status-success", Icon: CheckCircle2, role: "status" },
  error: { wrapper: "app-status-error", Icon: AlertCircle, role: "alert" },
  info: { wrapper: "app-status-info", Icon: Info, role: "status" },
} as const;

export function StatusMessage({ kind, children, action, className = "" }: StatusMessageProps) {
  const config = styles[kind];
  const Icon = config.Icon;
  return (
    <div role={config.role} aria-live={kind === "error" ? "assertive" : "polite"} className={`${config.wrapper} flex items-start gap-2.5 ${className}`}>
      <Icon aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0 flex-1">{children}</div>
      {action}
    </div>
  );
}
