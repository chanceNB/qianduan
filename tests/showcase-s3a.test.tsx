import { it, expect, vi } from "vitest";
import { StrictMode } from "react";
import {
  render,
  screen,
  fireEvent,
  within,
  waitFor,
} from "@testing-library/react";
vi.stubEnv("VITE_MOCK_SCENARIO", "demo_happy_path");
const { App } = await import("../src/App");
function open(
  path = "/ai?session=demo_session_001&question=Q05&node=node_0003&evidence=ev_sess001_q05_0003",
) {
  sessionStorage.setItem("zhicha-token", "mock.teacher.token");
  window.history.replaceState({}, "", path);
  return render(<App />);
}
async function generate() {
  const button = await screen.findByRole("button", { name: "生成复盘" });
  await waitFor(() => expect(button).toBeEnabled());
  fireEvent.click(button);
}
it("carries Q5 context and returns to the same student and event time", async () => {
  open(
    "/classroom/demo_session_001/overview?question=Q05&student=anon_p018&time=870000",
  );
  fireEvent.click(await screen.findByRole("button", { name: "AI 复盘" }));
  expect(
    await screen.findByText("Evidence 驱动模板 · Demo"),
  ).toBeInTheDocument();
  expect(window.location.search).toContain("node=node_0003");
  expect(screen.getByLabelText("AI 选择题目")).toHaveValue("Q05");
  expect(screen.getByLabelText("选择复盘证据")).toBeChecked();
  fireEvent.click(screen.getByRole("link", { name: "返回课堂" }));
  expect(
    await screen.findByRole("region", { name: "学生 B 作答事件回放" }),
  ).toBeInTheDocument();
  expect(await screen.findByLabelText("当前事件时间")).toHaveTextContent(
    "14:30",
  );
});
it("preserves full-class replay mode and a time before Q5 when returning from AI", async () => {
  open("/classroom/demo_session_001/overview?question=Q05&student=anon_p017");
  fireEvent.click(
    await screen.findByRole("button", { name: "展示完整课堂过程" }),
  );
  const slider = await screen.findByLabelText("事件时间定位");
  fireEvent.change(slider, { target: { value: "120000" } });
  fireEvent.click(screen.getByRole("button", { name: "AI 复盘" }));
  fireEvent.click(await screen.findByRole("link", { name: "返回课堂" }));
  expect(await screen.findByLabelText("当前事件时间")).toHaveTextContent(
    "02:00",
  );
  expect(
    screen.getByRole("button", { name: "仅看当前题目" }),
  ).toBeInTheDocument();
});
it("generates a template, opens evidence, and restores teacher edits after refresh", async () => {
  const mounted = open();
  await generate();
  const report = await screen.findByRole("region", { name: "Demo 课堂复盘" });
  expect(report).toHaveTextContent(
    "12 名有效参与者中有 4 名出现 RETURN，3 名出现 REVISION_CANDIDATE",
  );
  expect(report).not.toHaveTextContent("置信");
  fireEvent.click(
    within(report).getByRole("button", { name: "ev_sess001_q05_0003" }),
  );
  const drawer = await screen.findByRole("dialog", { name: "Evidence 回查" });
  expect(
    await within(drawer).findByText("分析窗口：14:00–15:00（左闭右开）"),
  ).toBeInTheDocument();
  fireEvent.click(
    within(drawer).getByRole("button", { name: "关闭 Evidence" }),
  );
  fireEvent.change(screen.getByLabelText("修改复盘内容"), {
    target: { value: "教师核对列式步骤" },
  });
  fireEvent.click(screen.getByRole("button", { name: "修改后采用" }));
  expect(await screen.findByText("已采纳 · 教师修改")).toBeInTheDocument();
  mounted.unmount();
  open();
  expect(await screen.findByText("已采纳 · 教师修改")).toBeInTheDocument();
  expect(screen.getByLabelText("教师采用文本")).toHaveTextContent(
    "教师核对列式步骤",
  );
  expect(screen.getByLabelText("修改复盘内容")).toHaveValue("教师核对列式步骤");
  expect(screen.getByLabelText("原始模板报告")).toHaveTextContent(
    "12 名有效参与者",
  );
  fireEvent.click(screen.getByRole("button", { name: "驳回" }));
  expect(await screen.findByText("已驳回 · 未采纳")).toBeInTheDocument();
  expect(screen.queryByLabelText("教师采用文本")).toBeNull();
});
it("insufficient evidence offers no adoption and can switch back", async () => {
  open();
  fireEvent.click(await screen.findByRole("button", { name: "演示证据不足" }));
  await generate();
  expect(
    await screen.findByText("证据不足，拒绝生成教学判断"),
  ).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "认可" })).toBeNull();
  const report = screen.getByRole("region", { name: "Demo 课堂复盘" });
  expect(
    within(report).queryByRole("button", { name: "ev_sess001_q05_0003" }),
  ).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "恢复正常证据" }));
  await generate();
  expect(
    await screen.findByRole("button", { name: "认可" }),
  ).toBeInTheDocument();
});
it("changing classroom removes the previous report and review actions", async () => {
  open();
  await generate();
  await screen.findByRole("button", { name: "认可" });
  fireEvent.change(screen.getByLabelText("选择课堂"), {
    target: { value: "" },
  });
  await waitFor(() =>
    expect(screen.queryByRole("button", { name: "认可" })).toBeNull(),
  );
  expect(screen.queryByLabelText("原始模板报告")).toBeNull();
});
it("generates and saves under production StrictMode lifecycle", async () => {
  sessionStorage.setItem("zhicha-token", "mock.teacher.token");
  window.history.replaceState(
    {},
    "",
    "/ai?session=demo_session_001&question=Q05&node=node_0003&evidence=ev_sess001_q05_0003",
  );
  render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
  await generate();
  fireEvent.click(await screen.findByRole("button", { name: "认可" }));
  expect(await screen.findByText("已采纳 · 原始模板")).toBeInTheDocument();
});
it("does not show successful adoption when local save fails", async () => {
  open();
  await generate();
  await screen.findByRole("button", { name: "认可" });
  const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("blocked");
  });
  fireEvent.click(screen.getByRole("button", { name: "认可" }));
  expect(await screen.findByText(/本地反馈保存失败/)).toBeInTheDocument();
  expect(screen.queryByText("已采纳 · 原始模板")).toBeNull();
  spy.mockRestore();
});
