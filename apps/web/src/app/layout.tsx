import "./globals.css";
import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "MaxxLoop - Closed-Loop Focus & Recovery Companion",
  description:
    "Detect capacity drops, explain root drivers in plain language, take exactly ONE high-leverage micro-action, and measure true counterfactual net recovery.",
  manifest: "/manifest.json",
  themeColor: "#090D14",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background text-textPrimary min-h-screen flex flex-col items-center justify-start antialiased selection:bg-accent/30 selection:text-accent">
        {/* Mobile Viewport Container: 390px centered design frame */}
        <div className="w-full max-w-[420px] min-h-screen bg-background border-x border-border flex flex-col relative pb-20 shadow-2xl">
          {children}
          <Navbar />
        </div>
      </body>
    </html>
  );
}
