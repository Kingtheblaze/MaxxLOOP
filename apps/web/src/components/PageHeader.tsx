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
    <header className={`app-page-header ${centered ? "text-center" : ""}`}>
      <div className="app-eyebrow">{eyebrow}</div>
      <h1 className="app-page-title">{title}</h1>
      <p className={`app-page-description ${centered ? "mx-auto" : ""}`}>{description}</p>
      {action ? <div className={centered ? "flex justify-center" : ""}>{action}</div> : null}
    </header>
  );
}
