import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "MaxxLoop - Closed-Loop Focus & Recovery Companion",
  description:
    "Detect capacity drops, explain root drivers in plain language, take exactly ONE high-leverage micro-action, and measure true counterfactual net recovery.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#090D14",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background text-textPrimary antialiased selection:bg-accent/30 selection:text-accent">
        <a href="#main-content" className="sr-only z-50 rounded-lg bg-surface px-4 py-3 text-textPrimary focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
          Skip to main content
        </a>
        <div className="mx-auto min-h-screen w-full max-w-[420px] border-x border-border bg-background pb-[calc(5rem+env(safe-area-inset-bottom))] md:max-w-6xl md:border-x-0 md:px-8 md:pb-10">
          <Navbar />
          {children}
          <footer className="hidden border-t border-border/70 px-8 py-5 text-xs text-textMuted md:block">
            <div className="flex items-center justify-between gap-4">
              <span>MaxxLoop · Focus and recovery, measured over time.</span>
              <a href="/privacy" className="rounded-sm hover:text-textPrimary">Privacy and data controls</a>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
