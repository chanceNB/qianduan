import { expect, it } from "vitest";
import {
  calculateClassState,
  summarizeQuestions,
  type DemoEvent,
} from "../src/mocks/calculations";
const event = (
  id: string,
  participant: string,
  question: string,
  type: string,
  time: number,
): DemoEvent => ({
  event_id: id,
  participant_id: participant,
  question_id: question,
  event_type: type,
  start_time_ms: time,
  end_time_ms: time,
  evidence_refs: [],
});
it("uses half-open windows, deduplicates participants, and preserves its input", () => {
  const events = [
    event("r3", "a", "Q05", "RETURN", 20),
    event("v1", "a", "Q04", "QUESTION_VISIT", 0),
    event("r1", "a", "Q05", "RETURN", 10),
    event("v2", "b", "Q05", "QUESTION_VISIT", 1),
    event("r2", "a", "Q05", "RETURN", 19),
  ];
  const before = structuredClone(events);
  const state = calculateClassState(events, ["Q04", "Q05"], {
    start_ms: 10,
    end_ms: 20,
  });
  expect(state.valid_participant_count).toBe(2);
  expect(state.return_ratio.Q05).toBe(0.5);
  expect(state.question_distribution).toEqual([
    { question_id: "Q04", count: 0, ratio: 0 },
    { question_id: "Q05", count: 2, ratio: 1 },
  ]);
  expect(state.progress_divergence).toEqual({ variance: 0, entropy_norm: 0 });
  expect(events).toEqual(before);
  expect(
    summarizeQuestions(
      events.filter((e) => e.participant_id === "a"),
      ["Q04", "Q05"],
    )[1],
  ).toEqual({
    question_id: "Q05",
    visit_count: 3,
    return_count: 3,
    revision_candidate_count: 0,
  });
});
it("returns unavailable ratios rather than zero for an empty denominator", () => {
  const state = calculateClassState([], ["Q05"], { start_ms: 10, end_ms: 20 });
  expect(state.return_ratio.Q05).toBeNull();
  expect(state.revision_candidate_ratio.Q05).toBeNull();
  expect(state.question_distribution[0]).toEqual({
    question_id: "Q05",
    count: null,
    ratio: null,
  });
  expect(state.progress_divergence).toBeNull();
  expect(state.quality.availability).toBe("NOT_COMPUTABLE");
});
it("recalculates after a source event is removed", () => {
  const events = [
    event("v1", "a", "Q05", "QUESTION_VISIT", 0),
    event("v2", "b", "Q04", "QUESTION_VISIT", 0),
    event("r1", "b", "Q05", "RETURN", 15),
  ];
  expect(
    calculateClassState(events, ["Q04", "Q05"], { start_ms: 10, end_ms: 20 })
      .return_ratio.Q05,
  ).toBe(0.5);
  const changed = calculateClassState(events.slice(0, 2), ["Q04", "Q05"], {
    start_ms: 10,
    end_ms: 20,
  });
  expect(changed.return_ratio.Q05).toBe(0);
  expect(changed.question_distribution[0].count).toBe(1);
});
