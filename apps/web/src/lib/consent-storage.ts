export interface ConsentPreferences {
  consent_calendar: boolean;
  consent_browser_signals: boolean;
  consent_llm_sharing: boolean;
}

const STORAGE_KEY = "maxxloop-consent-preferences";

export function readConsentPreferences(): ConsentPreferences | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (!value) return null;
    const parsed = JSON.parse(value) as Partial<ConsentPreferences>;
    if (
      typeof parsed.consent_calendar !== "boolean" ||
      typeof parsed.consent_browser_signals !== "boolean" ||
      typeof parsed.consent_llm_sharing !== "boolean"
    ) return null;
    return {
      consent_calendar: parsed.consent_calendar,
      consent_browser_signals: parsed.consent_browser_signals,
      consent_llm_sharing: parsed.consent_llm_sharing,
    };
  } catch {
    return null;
  }
}

export function writeConsentPreferences(preferences: ConsentPreferences): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  } catch {
    // Keep the API update authoritative if browser storage is unavailable.
  }
}

export function clearConsentPreferences(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Browser storage may be unavailable in private browsing contexts.
  }
}
