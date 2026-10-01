const API_BASE = "/api";

async function request<T = any>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: "include",
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
const demoQuery = (demo: boolean) => demo ? "?demo=true" : "";

export const api = {
  signUp: (data: { name: string; email: string; password: string }) => post("/auth/signup", data),
  signIn: (data: { email: string; password: string }) => post("/auth/login", data),
  signOut: () => post("/auth/logout"),
  getCurrentUser: () => request("/auth/me"),
  getCapacity: (demo = false) => request(`/capacity/now${demoQuery(demo)}`),
  getActiveLoop: (demo = false) => request(`/loop/active${demoQuery(demo)}`),
  getInsights: (demo = false) => request(`/insights${demoQuery(demo)}`),
  getDemoStatus: () => request("/demo/status"),
  getHistory: () => request("/signals?limit=100"),
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
  startLoopAction: (id: number, demo = false) => post(`/loop/${id}/start${demoQuery(demo)}`),
  skipLoopAction: (id: number, reason: string, demo = false) => post(`/loop/${id}/skip${demoQuery(demo)}`, { reason }),
  measureLoopOutcome: (id: number, data: unknown, demo = false) => post(`/loop/${id}/measure${demoQuery(demo)}`, data),
  submitFeedback: (id: number, helpful: boolean, demo = false) => post(`/loop/${id}/feedback${demoQuery(demo)}`, { helpful }),
};
