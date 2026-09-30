import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Navbar } from "@/components/Navbar";
import { AuthProvider } from "@/components/AuthProvider";
import { ThemeProvider } from "@/components/ThemeProvider";

const themeBootstrap = `(()=>{let v='system';try{const p=localStorage.getItem('maxxloop-theme');if(p==='light'||p==='dark'||p==='system')v=p}catch(e){}const d=v==='dark'||(v==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);const r=document.documentElement;r.classList.toggle('dark',d);r.dataset.themePreference=v;r.style.colorScheme=d?'dark':'light'})()`;

export const metadata: Metadata = {
  title: "MaxxLoop — Focus & recovery",
  description: "Track your capacity, discover useful recovery actions, and learn from measured outcomes.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#F5F7F6",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeBootstrap }} /></head>
      <body className="min-h-screen bg-background text-textPrimary antialiased">
        <a href="#main-content" className="sr-only z-[70] rounded-lg bg-white px-4 py-3 text-textPrimary shadow-card focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
          Skip to main content
        </a>
        <ThemeProvider>
          <AuthProvider>
            <Navbar>{children}</Navbar>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
