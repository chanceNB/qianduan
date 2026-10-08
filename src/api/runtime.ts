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
if (apiMode === "mock") {
  const { createMockTransport } = await import("../mocks/handlers");
  transport = createMockTransport(
    import.meta.env.VITE_MOCK_SCENARIO ?? "empty",
  );
}
export const apiClient = createClient({
  baseUrl,
  transport,
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
