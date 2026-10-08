import { it, expect, vi } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import { z } from "zod";
import { createClient } from "../src/api/client";
import { createMockTransport } from "../src/mocks/handlers";
import {
  EvidenceProvider,
  useEvidence,
} from "../src/components/EvidenceDrawer";
import { useResource } from "../src/hooks/useResource";
it("delayed 401 cannot invalidate a newer session", async () => {
  let generation = 1;
  let done: (response: Response) => void = () => {};
  const unauthorized = vi.fn();
  const c = createClient({
    baseUrl: "/api/v1",
    getToken: () => "same-token",
    getAuthGeneration: () => generation,
    onUnauthorized: unauthorized,
    transport: () =>
      new Promise((resolve) => {
        done = resolve;
      }),
  });
  const pending = c.get("/me", z.unknown()).catch((e) => e);
  generation = 2;
  done(
    new Response(
      JSON.stringify({
        success: false,
        request_id: "old",
        error: {
          code: "UNAUTHENTICATED",
          message: "expired",
          details: {},
          retryable: false,
        },
        meta: { api_version: "0.1" },
      }),
      { status: 401 },
    ),
  );
  await pending;
  expect(unauthorized).not.toHaveBeenCalled();
});
it("auth reset closes global Evidence drawer", async () => {
  sessionStorage.setItem("zhicha-token", "mock.teacher.token");
  function Trigger() {
    const { open } = useEvidence();
    return <button onClick={() => open("missing")}>回查</button>;
  }
  render(
    <EvidenceProvider>
      <Trigger />
    </EvidenceProvider>,
  );
  fireEvent.click(screen.getByText("回查"));
  await waitFor(() => expect(screen.getByRole("dialog")).toBeInTheDocument());
  act(() => window.dispatchEvent(new Event("zhicha-auth-reset")));
  expect(screen.queryByRole("dialog")).toBeNull();
});
it("resource key change never renders previous classroom data", async () => {
  function Harness({ id }: { id: string }) {
    const r = useResource(
      () =>
        id === "A"
          ? Promise.resolve("A result")
          : new Promise<string>(() => {}),
      [id],
    );
    return <p>{r.data ?? "loading"}</p>;
  }
  const { rerender } = render(<Harness id="A" />);
  await screen.findByText("A result");
  rerender(<Harness id="B" />);
  expect(screen.queryByText("A result")).toBeNull();
});
it("mock transport rejects undeclared methods and paths and nonexact IDs", async () => {
  const transport = createMockTransport("demo_happy_path");
  const init = { headers: { Authorization: "Bearer mock.teacher.token" } };
  for (const [path, method] of [
    ["/me", "POST"],
    ["/unregistered/overview", "GET"],
    ["/evidence/prefix_ev_sess001_q05_0003", "GET"],
  ]) {
    const response = await transport(`/mock-api/v1${path}`, {
      ...init,
      method,
    });
    expect(response.ok).toBe(false);
  }
});
