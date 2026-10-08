import { beforeEach, expect, it } from "vitest";
import { z } from "zod";
import { createClient } from "../src/api/client";
import { createMockTransport } from "../src/mocks/handlers";
import {
  classStateSchema,
  overviewSchema,
  pageSchema,
  participantSchema,
  processSchema,
  replaySchema,
  evidenceSchema,
  reviewSchema,
} from "../src/contracts";
import * as demo from "../src/mocks/fixtures/demo";

const session = "/teacher/sessions/demo_session_001";
const client = (scenario = "demo_happy_path") =>
  createClient({
    transport: createMockTransport(scenario),
    baseUrl: "/mock-api/v1",
    getToken: () => "mock.teacher.token",
    onUnauthorized: () => {},
  });
beforeEach(() => localStorage.clear());

it("serves twelve complete six-question processes without invented handwriting", async () => {
  const c = client();
  const students = await c.get(
    `${session}/students`,
    pageSchema(participantSchema),
  );
  expect(students.total).toBe(12);
  const ids = new Set<string>();
  for (const student of students.items) {
    const process = await c.get(
      `${session}/students/${student.participant_id}/process`,
      processSchema,
    );
    expect(process.question_summaries.map((q) => q.question_id)).toEqual([
      "Q01",
      "Q02",
      "Q03",
      "Q04",
      "Q05",
      "Q06",
    ]);
    const times = process.event_timeline.map((e) => e.start_time_ms);
    expect(times).toEqual([...times].sort((a, b) => a - b));
    for (const event of process.event_timeline) {
      expect(ids.has(event.event_id)).toBe(false);
      ids.add(event.event_id);
    }
    const replay = await c.get(
      `${session}/students/${student.participant_id}/replay`,
      replaySchema,
    );
    expect(replay.strokes).toEqual([]);
    expect(replay.events).toEqual(
      process.event_timeline.map((e) => e.event_id),
    );
    expect(replay.quality.availability).toBe("UNAVAILABLE");
  }
});

it("derives Q5 metrics consistently and counts returning participants once", async () => {
  const c = client();
  const state = await c.get(`${session}/class-state`, classStateSchema);
  expect(state.valid_participant_count).toBe(12);
  expect(state.return_ratio.Q05).toBeCloseTo(4 / 12);
  expect(state.revision_candidate_ratio.Q05).toBeCloseTo(3 / 12);
  expect(state.question_distribution).toEqual([
    { question_id: "Q01", count: 0, ratio: 0 },
    { question_id: "Q02", count: 0, ratio: 0 },
    { question_id: "Q03", count: 0, ratio: 0 },
    { question_id: "Q04", count: 2, ratio: 2 / 12 },
    { question_id: "Q05", count: 8, ratio: 8 / 12 },
    { question_id: "Q06", count: 2, ratio: 2 / 12 },
  ]);
  const overview = await c.get(`${session}/overview`, overviewSchema);
  expect(overview.session.participant_count).toBe(12);
  expect(overview.metrics[0].value).toBe(state.return_ratio.Q05);
  expect(overview.question_distribution).toEqual(state.question_distribution);
  expect(overview.key_nodes[0].affected_participant_count).toBe(4);
});

it("returns only participants with the requested event on the requested question", async () => {
  const c = client();
  expect(
    (
      await c.get(
        `${session}/students?question_id=Q05&event_type=REVISION_CANDIDATE`,
        pageSchema(participantSchema),
      )
    ).total,
  ).toBe(3);
  expect(
    (
      await c.get(
        `${session}/students?question_id=Q01&event_type=RETURN`,
        pageSchema(participantSchema),
      )
    ).total,
  ).toBe(0);
});

it("Q5 evidence references existing synthetic events and results without visual or stroke claims", async () => {
  const c = client();
  const evidence = await c.get("/evidence/ev_sess001_q05_0003", evidenceSchema);
  expect(evidence.video_evidence).toBeNull();
  expect(evidence.pen_evidence?.stroke_refs).toEqual([]);
  expect(evidence.authenticity.some((t) => t.data_nature === "SYNTHETIC")).toBe(
    true,
  );
  expect(evidence.authenticity.every((t) => !t.is_research_evidence)).toBe(
    true,
  );
  expect(evidence.result_evidence).not.toBeNull();
  const eventIds: string[] = [];
  for (const id of evidence.student_set) {
    const process = await c.get(
      `${session}/students/${id}/process`,
      processSchema,
    );
    eventIds.push(...process.event_timeline.map((e) => e.event_id));
  }
  expect(evidence.pen_evidence?.event_refs.length).toBeGreaterThan(0);
  expect(
    evidence.pen_evidence?.event_refs.every((id) => eventIds.includes(id)),
  ).toBe(true);
});

it("persists teacher edits locally and restores them through a new transport", async () => {
  const c = client();
  await c.post(
    `${session}/agent/reviews`,
    { question: "复盘", scope: { question_ids: ["Q05"], key_node_ids: [] } },
    reviewSchema,
  );
  await c.post(
    "/teacher/agent/reviews/review_0001/feedback",
    {
      action: "EDIT_AND_ACCEPT",
      edited_text: "教师已审核的 Q5 建议",
      comment: null,
    },
    z.null(),
  );
  const restored = await client().post(
    `${session}/agent/reviews`,
    { question: "复盘", scope: { question_ids: ["Q05"], key_node_ids: [] } },
    reviewSchema,
  );
  expect(restored.summary).toBe("教师已审核的 Q5 建议");
});

it("refuses a review when its scope has no valid evidence", async () => {
  await expect(
    client().post(
      `${session}/agent/reviews`,
      { question: "复盘", scope: { question_ids: ["Q01"], key_node_ids: [] } },
      reviewSchema,
    ),
  ).rejects.toMatchObject({ code: "INSUFFICIENT_EVIDENCE" });
});

it("pairs every synthetic result with a submit event on the active question", () => {
  for (const result of demo.results) {
    const submits = demo.events.filter(
      (e) =>
        e.participant_id === result.participant_id &&
        e.question_id === result.question_id &&
        e.event_type === "ANSWER_SUBMIT",
    );
    expect(submits.length).toBeGreaterThan(0);
    for (const submit of submits) {
      const visits = demo.events
        .filter(
          (e) =>
            e.participant_id === submit.participant_id &&
            e.start_time_ms <= submit.start_time_ms &&
            ["QUESTION_VISIT", "RETURN"].includes(e.event_type),
        )
        .sort((a, b) => a.start_time_ms - b.start_time_ms);
      expect(visits.at(-1)?.question_id).toBe(submit.question_id);
    }
  }
});
