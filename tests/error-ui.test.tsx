import { render, screen } from "@testing-library/react";
import { it, expect } from "vitest";
import { ErrorState, DataFields } from "../src/components/ui";
import { ApiError } from "../src/api/client";
it.each([
  ["INVALID_REQUEST", 400, "请求参数无效"],
  ["UNAUTHENTICATED", 401, "登录已失效"],
  ["FORBIDDEN", 403, "无权限访问"],
  ["NOT_FOUND", 404, "暂无数据 / 资源不存在"],
  ["VERSION_MISMATCH", 409, "版本不兼容，请刷新或联系维护人员"],
  ["INVALID_SCHEMA", 422, "数据结构不符合契约"],
  ["NOT_COMPUTABLE", 422, "不可计算"],
  ["INSUFFICIENT_EVIDENCE", 422, "证据不足 / 暂不可回查"],
  ["MISSING_INPUT", 424, "缺少必要输入"],
  ["INTERNAL_ERROR", 500, "服务暂不可用"],
] as const)("maps %s to explicit error UI", (code, status, label) => {
  render(<ErrorState error={new ApiError(code, "原因", status, "req_test")} />);
  expect(screen.getByText(label)).toBeInTheDocument();
  expect(screen.getByText("request_id: req_test")).toBeInTheDocument();
});
it("shows unknown explicitly without changing zero or empty arrays", () => {
  render(
    <DataFields data={{ 未知: "UNKNOWN", 零: 0, 数组: [], 空值: null }} />,
  );
  expect(screen.getByText("未知 / 待确认")).toBeInTheDocument();
  expect(screen.getByText("0")).toBeInTheDocument();
  expect(screen.getByText("[]")).toBeInTheDocument();
  expect(screen.getByText("—")).toBeInTheDocument();
});
