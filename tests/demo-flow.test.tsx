import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { it, expect, vi, beforeEach } from "vitest";
vi.stubEnv("VITE_MOCK_SCENARIO", "demo_happy_path");
const { App } = await import("../src/App");
it("dataset truth filter cannot break model navigation", async () => {
  sessionStorage.setItem("zhicha-token", "mock.researcher.token");
  window.history.replaceState({}, "", "/research/datasets");
  render(<App />);
  await screen.findByRole("button", { name: /前端流程演示数据集/ });
  fireEvent.change(screen.getByLabelText("真实性"), {
    target: { value: "DEMO" },
  });
  fireEvent.click(screen.getByRole("link", { name: "模型" }));
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Quality-aware Fusion" }),
    ).toBeInTheDocument(),
  );
});
// jsdom has no raster canvas; drawing is verified in the real browser.
beforeEach(() => {
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
});
it("key-node student deep link keeps session context", async () => {
  sessionStorage.setItem("zhicha-token", "mock.teacher.token");
  window.history.replaceState({}, "", "/students?session=demo_session_001");
  render(<App />);
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "anon_p017" }),
    ).toBeInTheDocument(),
  );
  fireEvent.click(screen.getByRole("button", { name: "anon_p017" }));
  await waitFor(() =>
    expect(screen.getByText("离开题目后再次进入")).toBeInTheDocument(),
  );
});
