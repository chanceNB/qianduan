import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { it, expect } from "vitest";
import { EmptyState, ErrorState, MetricValue } from "../src/components/ui";
import { ApiError } from "../src/api/client";
import { canAccess } from "../src/routes/permissions";
import {
  EvidenceProvider,
  useEvidence,
} from "../src/components/EvidenceDrawer";
it("empty state does not display fabricated counts", () => {
  render(<EmptyState title="暂无课堂数据" description="请选择班级" />);
  expect(screen.getByText("暂无课堂数据")).toBeInTheDocument();
  expect(screen.queryByText("0%")).toBeNull();
});
it("shows insufficient evidence explicitly", () => {
  render(
    <ErrorState
      error={new ApiError("INSUFFICIENT_EVIDENCE", "missing", 422, "req")}
    />,
  );
  expect(screen.getByText("证据不足 / 暂不可回查")).toBeInTheDocument();
});
it("keeps null and zero semantically separate", () => {
  const { rerender } = render(
    <MetricValue value={null} availability="NOT_COMPUTABLE" />,
  );
  expect(screen.getByText("不可计算")).toBeInTheDocument();
  rerender(<MetricValue value={0} availability="AVAILABLE" />);
  expect(screen.getByText("0")).toBeInTheDocument();
});
it("guards direct role routes and feature flags", () => {
  expect(
    canAccess("STUDENT", "teacher", {
      research_lab: true,
      teacher_agent: true,
    }),
  ).toBe(false);
  expect(
    canAccess("RESEARCHER", "research", {
      research_lab: true,
      teacher_agent: true,
    }),
  ).toBe(true);
  expect(
    canAccess("TEACHER", "ai", { research_lab: true, teacher_agent: false }),
  ).toBe(false);
});
it("global drawer fetches by ID and closes", async () => {
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
  fireEvent.click(screen.getByLabelText("关闭 Evidence"));
  expect(screen.queryByRole("dialog")).toBeNull();
});
