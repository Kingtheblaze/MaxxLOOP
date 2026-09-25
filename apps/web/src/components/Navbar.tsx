"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CircleDot, BarChart3, ShieldCheck, PlayCircle } from "lucide-react";

export const Navbar: React.FC = () => {
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: "Now", icon: CircleDot },
    { href: "/insights", label: "Insights", icon: BarChart3 },
    { href: "/privacy", label: "Privacy", icon: ShieldCheck },
    { href: "/demo", label: "Demo", icon: PlayCircle },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-surface/90 backdrop-blur-lg border-t border-border max-w-[420px] mx-auto">
      <div className="flex items-center justify-around py-2.5 px-3">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg transition-colors ${
                isActive
                  ? "text-accent font-semibold"
                  : "text-textMuted hover:text-textSecondary"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "stroke-[2.5]" : "stroke-[1.8]"}`} />
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
