import {
  render,
  screen,
  fireEvent,
  within,
  waitFor,
} from "@testing-library/react";
import { it, expect, vi } from "vitest";
vi.stubEnv("VITE_MOCK_SCENARIO", "demo_happy_path");
const { App } = await import("../src/App");
function open(query = "") {
  sessionStorage.setItem("zhicha-token", "mock.teacher.token");
  window.history.replaceState(
    {},
    "",
    `/classroom/demo_session_001/overview${query}`,
  );
  return render(<App />);
}
it("shows event-derived Q5 ratios, position counts, missing completion and truth labels", async () => {
  open();
  expect(await screen.findByText("33.3%")).toBeInTheDocument();
  expect(screen.getByText("4 / 12 名参与者")).toBeInTheDocument();
  expect(screen.getByText("3 / 12 名参与者")).toBeInTheDocument();
  expect(screen.getByText("25%")).toBeInTheDocument();
  expect(screen.getByLabelText("Q5 题目位置：8 名参与者")).toBeInTheDocument();
  expect(screen.getByLabelText("Q4 题目位置：2 名参与者")).toBeInTheDocument();
  expect(screen.getByLabelText("Q6 题目位置：2 名参与者")).toBeInTheDocument();
  expect(screen.getByText("不可计算")).toBeInTheDocument();
  expect(screen.getAllByText("SYNTHETIC").length).toBeGreaterThan(0);
  expect(screen.getAllByText(/DEMO/).length).toBeGreaterThan(0);
});
it("compares A/B/C and switches the timeline while preserving URL selection after Evidence closes", async () => {
  open();
  const a = await screen.findByRole("button", { name: "选择学生 A" });
  expect(a).toHaveTextContent("正确");
  expect(a).toHaveTextContent("RETURN 0 次");
  expect(screen.getByRole("button", { name: "选择学生 B" })).toHaveTextContent(
    "RETURN 2 次",
  );
  const c = screen.getByRole("button", { name: "选择学生 C" });
  expect(c).toHaveTextContent("错误");
  expect(c).toHaveTextContent("修改候选 1 次");
  fireEvent.click(c);
  const timeline = await screen.findByRole("region", {
    name: "学生 C 作答事件回放",
  });
  await waitFor(() =>
    expect(within(timeline).getByText("修改候选")).toBeInTheDocument(),
  );
  expect(window.location.search).toContain("student=anon_p019");
  expect(within(timeline).getByText("暂无可回放笔迹")).toBeInTheDocument();
  expect(timeline.querySelector("canvas")).toBeNull();
  fireEvent.click(
    within(timeline).getAllByRole("button", { name: "ev_sess001_q05_0003" })[0],
  );
  const drawer = await screen.findByRole("dialog", { name: "Evidence 回查" });
  await waitFor(() =>
    expect(
      within(drawer).getByText("分析窗口：14:00–15:00（左闭右开）"),
    ).toBeInTheDocument(),
  );
  fireEvent.click(
    within(drawer).getByRole("button", { name: "关闭 Evidence" }),
  );
  expect(
    screen.getByRole("region", { name: "学生 C 作答事件回放" }),
  ).toBeInTheDocument();
  expect(window.location.search).toContain("student=anon_p019");
});
it("loads a selected student and question from a refreshed deep link", async () => {
  open("?question=Q05&student=anon_p018");
  expect(
    await screen.findByRole("region", { name: "学生 B 作答事件回放" }),
  ).toBeInTheDocument();
  expect(screen.getByLabelText("演示题目")).toHaveValue("Q05");
  fireEvent.click(screen.getByRole("button", { name: "查看班级态势" }));
  await waitFor(() =>
    expect(window.location.pathname).toContain("class-state"),
  );
  expect(window.location.search).toContain("student=anon_p018");
});
it("keeps all six question results available when the question filter changes", async () => {
  open();
  await screen.findByRole("button", { name: "选择学生 C" });
  fireEvent.change(screen.getByLabelText("演示题目"), {
    target: { value: "Q01" },
  });
  expect(screen.getByRole("button", { name: "选择学生 C" })).toHaveTextContent(
    "正确",
  );
  expect(screen.getByRole("button", { name: "选择学生 C" })).toHaveTextContent(
    "Q1 最终答案：1/4",
  );
});
it("traps focus across the evidence disclosure summaries", async () => {
  open();
  fireEvent.click(
    await screen.findByRole("button", { name: "查看 Evidence" }),
  );
  const drawer = await screen.findByRole("dialog", { name: "Evidence 回查" });
  const summary = await within(drawer).findByText("完整结构与追溯信息");
  summary.focus();
  fireEvent.keyDown(document, { key: "Tab" });
  expect(
    within(drawer).getByRole("button", { name: "关闭 Evidence" }),
  ).toHaveFocus();
});
it("opens the same valid Evidence from a class statistic", async () => {
  open();
  const title = await screen.findByRole("heading", { name: "Q5 返回比例" });
  fireEvent.click(
    within(title.closest("section")!).getByRole("button", {
      name: "ev_sess001_q05_0003",
    }),
  );
  const drawer = await screen.findByRole("dialog", { name: "Evidence 回查" });
  expect(await within(drawer).findByText("证据来源与边界")).toBeInTheDocument();
  expect(drawer.querySelector("header")).toHaveTextContent("ev_sess001_q05_0003");
});
