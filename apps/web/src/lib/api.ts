const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function request<T = any>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.detail || `Request failed (${response.status})`);
  }
  return body as T;
}

const post = (path: string, body?: unknown) =>
  request(path, { method: "POST", body: JSON.stringify(body ?? {}) });

export const api = {
  getCapacity: () => request("/capacity/now"),
  getActiveLoop: () => request("/loop/active"),
  getInsights: () => request("/insights"),
  getDemoStatus: () => request("/demo/status"),
  getLLMPayload: () => request("/privacy/llm-payload"),
  exportData: () => request("/privacy/export"),
  deleteData: () => request("/privacy/data", { method: "DELETE" }),
  updateConsent: (data: {
    consent_calendar: boolean;
    consent_browser_signals: boolean;
    consent_llm_sharing: boolean;
    llm_provider: string;
  }) => request(`/privacy/consent?${new URLSearchParams({
    consent_calendar: String(data.consent_calendar),
    consent_browser_signals: String(data.consent_browser_signals),
    consent_llm_sharing: String(data.consent_llm_sharing),
    llm_provider: data.llm_provider,
  })}`, { method: "POST" }),
  seedDemo: (persona: string) => post("/demo/seed", { persona }),
  triggerDrop: () => post("/demo/trigger-drop"),
  timewarp: () => post("/demo/timewarp"),
  submitCheckin: (data: unknown) => post("/checkins", data),
  startLoopAction: (id: number) => post(`/loop/${id}/start`),
  skipLoopAction: (id: number, reason: string) => post(`/loop/${id}/skip`, { reason }),
  measureLoopOutcome: (id: number, data: unknown) => post(`/loop/${id}/measure`, data),
  submitFeedback: (id: number, helpful: boolean) => post(`/loop/${id}/feedback`, { helpful }),
};
