"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, BarChart3, ShieldCheck, PlayCircle, SlidersHorizontal } from "lucide-react";

export const Navbar: React.FC = () => {
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: "Now", icon: Activity },
    { href: "/insights", label: "Insights", icon: BarChart3 },
    { href: "/onboarding", label: "Setup", icon: SlidersHorizontal },
    { href: "/privacy", label: "Privacy", icon: ShieldCheck },
    { href: "/demo", label: "Demo", icon: PlayCircle },
  ];

  const links = (mobile = false) => navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`${mobile ? "flex min-h-12 flex-col items-center justify-center gap-1 px-1" : "app-nav-link"} ${
                isActive
                  ? "bg-accent/10 text-accent"
                  : "text-textSecondary hover:bg-surfaceHover hover:text-textPrimary"
              }`}
            >
              <Icon aria-hidden="true" className={`${mobile ? "h-4 w-4" : "h-4 w-4"} ${isActive ? "stroke-[2.25]" : "stroke-[1.8]"}`} />
              <span className={mobile ? "text-[10px] leading-none" : ""}>{item.label}</span>
            </Link>
          );
        });

  return (
    <>
      <header className="sticky top-0 z-40 hidden border-b border-border/80 bg-background/95 py-3 backdrop-blur-lg md:block">
        <div className="flex items-center justify-between gap-6">
          <Link href="/" className="flex min-h-11 items-center gap-3 rounded-lg" aria-label="MaxxLoop home">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-accent/30 bg-accent/10 text-accent">
              <Activity aria-hidden="true" className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-sm font-semibold tracking-tight text-textPrimary">MaxxLoop</span>
              <span className="block text-xs text-textMuted">Focus &amp; recovery</span>
            </span>
          </Link>
          <nav aria-label="Main navigation" className="flex items-center gap-1">{links()}</nav>
        </div>
      </header>
      <nav aria-label="Main navigation" className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg md:hidden">
        <div className="mx-auto grid w-full max-w-[420px] grid-cols-5 px-2 py-1.5">{links(true)}</div>
      </nav>
    </>
  );
};
