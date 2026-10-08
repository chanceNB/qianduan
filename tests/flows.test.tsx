import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { it, expect } from "vitest";
import { App } from "../src/App";
it("starts unauthenticated at login then loads empty teacher workspace", async () => {
  window.history.replaceState({}, "", "/classroom");
  render(<App />);
  await waitFor(() =>
    expect(screen.getByPlaceholderText("请输入账号")).toBeInTheDocument(),
  );
  fireEvent.change(screen.getByPlaceholderText("请输入账号"), {
    target: { value: "teacher_demo" },
  });
  fireEvent.change(screen.getByPlaceholderText("请输入密码"), {
    target: { value: "mock-password" },
  });
  fireEvent.click(screen.getByRole("button", { name: "登录" }));
  await waitFor(() =>
    expect(
      screen.getByRole("heading", { name: "最近访问" }),
    ).toBeInTheDocument(),
  );
  fireEvent.click(screen.getByRole("link", { name: "课堂" }));
  await waitFor(() =>
    expect(screen.getByText("暂无课堂数据")).toBeInTheDocument(),
  );
});
it("blocks direct student access to teacher classroom route", async () => {
  sessionStorage.setItem("zhicha-token", "mock.student.token");
  window.history.replaceState({}, "", "/classroom");
  render(<App />);
  await waitFor(() =>
    expect(screen.getByText("无权限访问")).toBeInTheDocument(),
  );
});
it("expired bearer token clears auth and returns to login", async () => {
  sessionStorage.setItem("zhicha-token", "expired");
  window.history.replaceState({}, "", "/classroom");
  render(<App />);
  await waitFor(() =>
    expect(screen.getByPlaceholderText("请输入账号")).toBeInTheDocument(),
  );
  expect(sessionStorage.getItem("zhicha-token")).toBeNull();
});
