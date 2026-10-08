import { createClient, type Transport } from "./client";
export const apiMode = import.meta.env.VITE_API_MODE ?? "mock";
export const baseUrl = import.meta.env.VITE_API_BASE_URL ?? "/mock-api/v1";
let authGeneration = 0;
export const tokenStore = {
  generation: () => authGeneration,
  get: () =>
    sessionStorage.getItem("zhicha-token") ??
    localStorage.getItem("zhicha-token") ??
    "",
  set: (token: string, remember = false) => {
    tokenStore.clear();
    (remember ? localStorage : sessionStorage).setItem("zhicha-token", token);
  },
  clear: () => {
    authGeneration++;
    sessionStorage.removeItem("zhicha-token");
    localStorage.removeItem("zhicha-token");
    window.dispatchEvent(new Event("zhicha-auth-reset"));
  },
};
let transport: Transport = (url, init) => fetch(url, init);
const defaultScenario = import.meta.env.VITE_MOCK_SCENARIO ?? "empty";
const scenarioKey = "zhicha-showcase-scenario";
let mockFactory:
  typeof import("../mocks/handlers").createMockTransport | undefined;
export function getDemoScenario() {
  if (apiMode === "mock" && defaultScenario.startsWith("demo_")) {
    try {
      const saved = sessionStorage.getItem(scenarioKey);
      if (saved === "demo_happy_path" || saved === "demo_insufficient_evidence")
        return saved;
    } catch {
      /* Use the configured scenario if storage cannot be read. */
    }
  }
  return defaultScenario;
}
export function setDemoScenario(
  scenario: "demo_happy_path" | "demo_insufficient_evidence",
) {
  if (!mockFactory || !defaultScenario.startsWith("demo_"))
    throw new Error("当前模式不支持 Demo 场景切换");
  sessionStorage.setItem(scenarioKey, scenario);
  transport = mockFactory(scenario);
  window.dispatchEvent(new Event("zhicha-auth-reset")); // Close stale Evidence; retain authentication.
}
if (apiMode === "mock") {
  const { createMockTransport } = await import("../mocks/handlers");
  mockFactory = createMockTransport;
  transport = createMockTransport(getDemoScenario());
}
export const apiClient = createClient({
  baseUrl,
  transport: (url, init) => transport(url, init),
  getToken: tokenStore.get,
  getAuthGeneration: tokenStore.generation,
  onUnauthorized: () => {
    tokenStore.clear();
    window.dispatchEvent(new Event("zhicha-unauthorized"));
  },
});
export const segment = encodeURIComponent;
export function query(values: Record<string, string | number | undefined>) {
  const q = new URLSearchParams();
  Object.entries(values).forEach(([k, v]) => {
    if (v !== undefined && v !== "") q.set(k, String(v));
  });
  return q.size ? `?${q}` : "";
}
