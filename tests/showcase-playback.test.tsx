import { render, screen, fireEvent, act } from "@testing-library/react";
import { it, expect, vi } from "vitest";
import { EventTimeline } from "../src/components/showcase/EventTimeline";
const events = [
  {
    event_id: "visit",
    event_type: "QUESTION_VISIT",
    question_id: "Q05",
    start_time_ms: 600000,
    end_time_ms: 600000,
    evidence_refs: [],
  },
  {
    event_id: "return",
    event_type: "RETURN",
    question_id: "Q05",
    start_time_ms: 650000,
    end_time_ms: 650000,
    evidence_refs: [],
  },
  {
    event_id: "submit",
    event_type: "ANSWER_SUBMIT",
    question_id: "Q05",
    start_time_ms: 700000,
    end_time_ms: 700000,
    evidence_refs: [],
  },
];
it("plays, pauses, seeks to an event, and replays without inventing event types", () => {
  vi.useFakeTimers();
  try {
    render(<EventTimeline events={events} />);
    const slider = screen.getByRole("slider", { name: "事件时间定位" });
    expect(slider).toHaveValue("600000");
    fireEvent.click(screen.getByRole("button", { name: "播放" }));
    act(() => vi.advanceTimersByTime(1000));
    expect(slider).toHaveValue("610000");
    fireEvent.click(screen.getByRole("button", { name: "暂停" }));
    act(() => vi.advanceTimersByTime(1000));
    expect(slider).toHaveValue("610000");
    fireEvent.click(screen.getByRole("button", { name: /定位 返回题目/ }));
    expect(slider).toHaveValue("650000");
    fireEvent.change(slider, { target: { value: "700000" } });
    expect(slider).toHaveValue("700000");
    fireEvent.click(screen.getByRole("button", { name: "重新播放" }));
    expect(slider).toHaveValue("600000");
    act(() => vi.advanceTimersByTime(12000));
    expect(slider).toHaveValue("700000");
    expect(screen.getByRole("button", { name: "播放" })).toBeInTheDocument();
    expect(screen.queryByText("过程结束")).not.toBeInTheDocument();
    expect(screen.getByText("合成结果提交")).toBeInTheDocument();
  } finally {
    vi.useRealTimers();
  }
});
it("shows an empty state and no playback controls for missing events", () => {
  render(<EventTimeline events={[]} />);
  expect(screen.getByText("暂无作答事件")).toBeInTheDocument();
  expect(screen.queryByRole("slider")).toBeNull();
});
