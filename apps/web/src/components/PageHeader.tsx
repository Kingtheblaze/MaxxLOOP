import React from "react";

interface PageHeaderProps {
  eyebrow: React.ReactNode;
  title: string;
  description: React.ReactNode;
  action?: React.ReactNode;
  centered?: boolean;
}

export function PageHeader({ eyebrow, title, description, action, centered = false }: PageHeaderProps) {
  return (
    <header className={`app-page-header ${centered ? "sm:flex-col sm:items-center text-center" : ""}`}>
      <div className="min-w-0">
        <div className="app-eyebrow mb-2">{eyebrow}</div>
        <h1 className="app-page-title">{title}</h1>
        <p className={`app-page-description mt-2 ${centered ? "mx-auto" : ""}`}>{description}</p>
      </div>
      {action ? <div className={centered ? "flex justify-center" : "shrink-0"}>{action}</div> : null}
    </header>
  );
}
