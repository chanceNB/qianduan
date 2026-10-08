import { it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
vi.stubEnv("VITE_MOCK_SCENARIO", "demo_happy_path");
const { App } = await import("../src/App");
const open = () => {
  sessionStorage.setItem("zhicha-token", "mock.teacher.token");
  window.history.replaceState({}, "", "/home");
  return render(<App />);
};
it("starts six-step guide, advances, goes back, explores, resumes and exits", async () => {
  open();
  fireEvent.click(
    await screen.findByRole("button", { name: "开始核心功能演示" }),
  );
  expect(await screen.findByText("1 / 6 · Q5 课堂")).toBeVisible();
  for (let i = 2; i <= 6; i++) {
    fireEvent.click(screen.getByRole("button", { name: "下一步" }));
    expect(await screen.findByText(new RegExp(`${i} / 6 ·`))).toBeVisible();
  }
  fireEvent.click(screen.getByRole("button", { name: "上一步" }));
  expect(await screen.findByText("5 / 6 · 学生反馈")).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "自由探索" }));
  expect(screen.getByRole("button", { name: "继续引导" })).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "继续引导" }));
  expect(await screen.findByText("5 / 6 · 学生反馈")).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "退出引导" }));
  expect(
    screen.queryByRole("button", { name: "下一步" }),
  ).not.toBeInTheDocument();
});
it("reset requires confirmation and removes only Showcase records", async () => {
  localStorage.setItem(
    "zhicha-showcase-v0.1:demo_happy_path:teacher_001:demo_session_001:review_0001",
    "saved",
  );
  localStorage.setItem("zhicha-pref-density", "compact");
  localStorage.setItem("zhicha-showcase-v0.1:production:keep", "keep");
  open();
  fireEvent.click(await screen.findByRole("button", { name: "重置演示" }));
  expect(
    localStorage.getItem(
      "zhicha-showcase-v0.1:demo_happy_path:teacher_001:demo_session_001:review_0001",
    ),
  ).toBe("saved");
  fireEvent.click(screen.getByRole("button", { name: "确认重置" }));
  expect(
    localStorage.getItem(
      "zhicha-showcase-v0.1:demo_happy_path:teacher_001:demo_session_001:review_0001",
    ),
  ).toBeNull();
  expect(localStorage.getItem("zhicha-pref-density")).toBe("compact");
  expect(localStorage.getItem("zhicha-showcase-v0.1:production:keep")).toBe(
    "keep",
  );
  expect(await screen.findByText("1 / 6 · Q5 课堂")).toBeVisible();
});
it("restores guide on reload and advances from open Evidence without auto-review", async () => {
  sessionStorage.setItem(
    "zhicha-showcase-guide-v1",
    JSON.stringify({
      step: 2,
      paused: false,
      student: "anon_p019",
      time: "882000",
      full: "0",
    }),
  );
  sessionStorage.setItem("zhicha-token", "mock.teacher.token");
  window.history.replaceState(
    {},
    "",
    "/classroom/demo_session_001/overview?student=anon_p019&question=Q05&time=882000",
  );
  render(<App />);
  fireEvent.click(
    await screen.findByRole("button", { name: "打开本步 Evidence" }),
  );
  expect(
    await screen.findByRole("dialog", { name: "Evidence 回查" }),
  ).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "下一步" }));
  expect(await screen.findByText("4 / 6 · AI 与教师审核")).toBeVisible();
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(window.location.search).toContain("anon_p019");
  expect(localStorage.length).toBe(0);
});
it("guide captures current timeline time across steps", async () => {
  open();
  fireEvent.click(
    await screen.findByRole("button", { name: "开始核心功能演示" }),
  );
  await screen.findByLabelText("事件时间定位");
  fireEvent.change(screen.getByLabelText("事件时间定位"), {
    target: { value: "870000" },
  });
  for (let i = 0; i < 3; i++)
    fireEvent.click(screen.getByRole("button", { name: "下一步" }));
  expect(decodeURIComponent(window.location.search)).toContain("time=870000");
});
it("preserves full classroom replay and time after entering student feedback", async () => {
  open();
  fireEvent.click(
    await screen.findByRole("button", { name: "开始核心功能演示" }),
  );
  fireEvent.click(
    await screen.findByRole("button", { name: "展示完整课堂过程" }),
  );
  fireEvent.change(screen.getByLabelText("事件时间定位"), {
    target: { value: "870000" },
  });
  expect(window.location.search).toContain("full=1");
  expect(window.location.search).toContain("time=870000");
  for (let i = 0; i < 4; i++)
    fireEvent.click(screen.getByRole("button", { name: "下一步" }));
  await screen.findByText("我的学习反馈");
  const g = JSON.parse(sessionStorage.getItem("zhicha-showcase-guide-v1")!);
  expect(g.full).toBe("1");
  expect(g.time).toBe("870000");
});
