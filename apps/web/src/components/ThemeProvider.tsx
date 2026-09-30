"use client";

import { createContext, useCallback, useContext, useLayoutEffect, useEffect, useMemo, useState } from "react";

export type ThemePreference = "light" | "dark" | "system";
interface ThemeContextValue { preference: ThemePreference; setPreference: (preference: ThemePreference) => void }

const ThemeContext = createContext<ThemeContextValue | null>(null);
const STORAGE_KEY = "maxxloop-theme";

function applyTheme(preference: ThemePreference) {
  const dark = preference === "dark" || (preference === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  const root = document.documentElement;
  root.classList.toggle("dark", dark);
  root.dataset.themePreference = preference;
  root.style.colorScheme = dark ? "dark" : "light";
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", dark ? "#181e23" : "#f5f7f6");
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>("system");
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    let saved: ThemePreference = "system";
    try {
      const candidate = localStorage.getItem(STORAGE_KEY);
      if (candidate === "light" || candidate === "dark" || candidate === "system") saved = candidate;
    } catch { /* Keep the system preference when browser storage is unavailable. */ }
    setPreferenceState(saved);
    applyTheme(saved);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    applyTheme(preference);
    try { localStorage.setItem(STORAGE_KEY, preference); } catch { /* Theme remains active for this session. */ }
    if (preference !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const updateSystemTheme = () => applyTheme("system");
    media.addEventListener("change", updateSystemTheme);
    return () => media.removeEventListener("change", updateSystemTheme);
  }, [preference, ready]);

  const setPreference = useCallback((next: ThemePreference) => setPreferenceState(next), []);
  const value = useMemo(() => ({ preference, setPreference }), [preference, setPreference]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
}
