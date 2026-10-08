import { it, expect, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
vi.stubEnv("VITE_MOCK_SCENARIO", "demo_happy_path");
const { App } = await import("../src/App");
const open = (
  path = "/demo/student?session=demo_session_001&student=anon_p017",
) => {
  sessionStorage.setItem("zhicha-token", "mock.teacher.token");
  window.history.replaceState({}, "", path);
  return render(<App />);
};
it("switches A/B/C, questions, scoped evidence and preserves selection after close", async () => {
  open();
  expect(
    await screen.findByText("个人 Q5：正确 · RETURN 0 次 · 修改候选 0 次"),
  ).toBeVisible();
  fireEvent.change(screen.getByLabelText("演示学生"), {
    target: { value: "anon_p018" },
  });
  expect(
    await screen.findByText("个人 Q5：正确 · RETURN 2 次 · 修改候选 0 次"),
  ).toBeVisible();
  fireEvent.change(screen.getByLabelText("演示学生"), {
    target: { value: "anon_p019" },
  });
  expect(
    await screen.findByText("个人 Q5：错误 · RETURN 1 次 · 修改候选 1 次"),
  ).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "查看我的 Evidence" }));
  const drawer = screen.getByRole("dialog", {
    name: "我的 Evidence · 个人投影",
  });
  expect(within(drawer).getByText(/anon_p019_Q05_RETURN/)).toBeVisible();
  expect(drawer.textContent).not.toContain("anon_p018");
  fireEvent.click(within(drawer).getByRole("button", { name: "关闭" }));
  expect(screen.getByLabelText("演示学生")).toHaveValue("anon_p019");
  fireEvent.click(screen.getByRole("button", { name: "Q1 · 正确" }));
  expect(window.location.search).toContain("question=Q01");
  expect(screen.getByText("暂无可回放笔迹")).toBeVisible();
  expect(
    screen.queryByRole("button", { name: /ev_sess/ }),
  ).not.toBeInTheDocument();
});
it.each(["ACCEPT", "EDIT_AND_ACCEPT", "REJECT"] as const)(
  "student feedback renders persisted %s honestly",
  async (action) => {
    localStorage.setItem(
      "zhicha-showcase-v0.1:demo_happy_path:teacher_001:demo_session_001:review_0001",
      JSON.stringify({
        action,
        edited_text: action === "EDIT_AND_ACCEPT" ? "教师改写关注项" : null,
        comment: null,
      }),
    );
    open();
    await screen.findByText(/个人 Q5：/);
    if (action === "EDIT_AND_ACCEPT")
      expect(screen.getByText("教师改写关注项")).toBeVisible();
    if (action === "REJECT")
      expect(screen.getByText("已驳回 · 不展示被驳回的建议")).toBeVisible();
    if (action === "ACCEPT")
      expect(screen.getByText(/模板经教师认可/)).toBeVisible();
    expect(screen.getByText(/不等价于个人诊断/)).toBeVisible();
  },
);
it("Research has functional sections, trace and return", async () => {
  open("/demo/research/datasets?session=demo_session_001");
  await screen.findByText("Research Lab · Demo");
  fireEvent.click(screen.getByRole("link", { name: "Models" }));
  expect(await screen.findByText("R2 · Macro Vision Perception")).toBeVisible();
  expect(screen.getByText("Prototype / Not Validated")).toBeVisible();
  fireEvent.click(screen.getByRole("link", { name: "Evidence Trace" }));
  fireEvent.click(
    await screen.findByRole("button", { name: "查看 Q5 Evidence 追溯" }),
  );
  expect(await screen.findByRole("dialog")).toBeVisible();
});
it("insufficient student view refuses focus and AI uses refusal label", async () => {
  const { setDemoScenario } = await import("../src/api/runtime");
  setDemoScenario("demo_insufficient_evidence");
  open();
  expect(await screen.findByText("证据不足 · 已拒绝生成")).toBeVisible();
  expect(
    screen.queryByRole("button", { name: "查看我的 Evidence" }),
  ).not.toBeInTheDocument();
  setDemoScenario("demo_happy_path");
});
it("production student guard still rejects Demo student perspective", async () => {
  sessionStorage.setItem("zhicha-token", "mock.student.token");
  window.history.replaceState({}, "", "/demo/student");
  render(<App />);
  expect(await screen.findByText(/当前身份或功能开关不允许/)).toBeVisible();
  expect(screen.queryByText("我的学习反馈")).not.toBeInTheDocument();
});
it("preserves full replay and scrubbed time through Research and AI round trips", async () => {
  open("/classroom/demo_session_001/overview?question=Q05&student=anon_p018");
  fireEvent.click(
    await screen.findByRole("button", { name: "展示完整课堂过程" }),
  );
  fireEvent.change(screen.getByLabelText("事件时间定位"), {
    target: { value: "870000" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Research Lab" }));
  fireEvent.click(await screen.findByRole("link", { name: "Failure Cases" }));
  fireEvent.click(
    await screen.findByRole("link", { name: "到 AI 验证证据不足场景" }),
  );
  fireEvent.click(await screen.findByRole("link", { name: "返回演示流程" }));
  expect(await screen.findByText("Research Lab · Demo")).toBeVisible();
  fireEvent.click(screen.getByRole("link", { name: "返回演示流程" }));
  expect(await screen.findByLabelText("当前事件时间")).toHaveTextContent(
    "14:30",
  );
  expect(screen.getByRole("button", { name: "仅看当前题目" })).toBeVisible();
});
