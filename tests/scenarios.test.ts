import { it, expect } from "vitest";
import { createClient } from "../src/api/client";
import { createMockTransport } from "../src/mocks/handlers";
import {
  overviewSchema,
  classStateSchema,
  pageSchema,
  nodeSchema,
  participantSchema,
  processSchema,
  replaySchema,
  evidenceSchema,
  traceSchema,
  reviewSchema,
  datasetSchema,
  modelSchema,
  experimentSchema,
  failureSchema,
} from "../src/contracts";
import { z } from "zod";
const client = (scenario: string, token = "mock.teacher.token") =>
  createClient({
    transport: createMockTransport(scenario),
    baseUrl: "/mock-api/v1",
    getToken: () => token,
    onUnauthorized: () => {},
  });
const s = "/teacher/sessions/demo_session_001";
const id = "ev_sess001_q05_0003";
it("validates all teacher happy-path DTOs and evidence chain", async () => {
  const c = client("demo_happy_path");
  expect(
    (await c.get(`${s}/overview`, overviewSchema)).session.session_id,
  ).toBe("demo_session_001");
  expect(
    (await c.get(`${s}/class-state`, classStateSchema)).completion_ratio,
  ).toBeNull();
  expect(
    (await c.get(`${s}/key-nodes`, pageSchema(nodeSchema))).items[0]
      .evidence_refs,
  ).toContain(id);
  expect(
    (await c.get(`${s}/students`, pageSchema(participantSchema))).items[0]
      .participant_id,
  ).toBe("anon_p017");
  const process = await c.get(`${s}/students/anon_p017/process`, processSchema);
  expect(process.event_timeline[1].event_type).toBe("RETURN");
  const replay = await c.get(`${s}/students/anon_p017/replay`, replaySchema);
  expect(replay.coordinate_system).toBe("PAGE_NORM_TOP_LEFT");
  expect(
    (await c.get(`/evidence/${id}`, evidenceSchema)).authenticity[0]
      .data_nature,
  ).toBe("DEMO");
  expect(
    (await c.get(`/evidence/${id}/trace`, traceSchema)).chain.map(
      (n) => n.level,
    ),
  ).toEqual([
    "Sensor Fact",
    "Observable Event",
    "Derived Pattern",
    "Evidence Package",
    "Teaching Hypothesis",
  ]);
  const review = await c.post(
    `${s}/agent/reviews`,
    {
      question: "为什么 Q5 值得复盘？",
      scope: { question_ids: ["Q05"], key_node_ids: ["node_0003"] },
    },
    reviewSchema,
  );
  expect(review.evidence_ids).toContain(id);
  for (const action of ["ACCEPT", "EDIT_AND_ACCEPT", "REJECT"])
    expect(
      await c.post(
        `/teacher/agent/reviews/${review.review_id}/feedback`,
        {
          action,
          edited_text: action === "EDIT_AND_ACCEPT" ? "教师修改后的复盘" : null,
          comment: null,
        },
        z.null(),
      ),
    ).toBeNull();
});
it("missing vision stays unavailable rather than normal or zero", async () => {
  const data = await client("demo_missing_vision").get(
    `${s}/overview`,
    overviewSchema,
  );
  expect(data.macro_vision).toMatchObject({
    quality: { availability: "UNAVAILABLE" },
  });
});
it("not-computable completion remains null", async () => {
  const data = await client("demo_not_computable").get(
    `${s}/class-state`,
    classStateSchema,
  );
  expect(data.completion_ratio).toBeNull();
  expect(data.quality.availability).toBe("NOT_COMPUTABLE");
});
it("insufficient evidence blocks agent conclusions", async () => {
  await expect(
    client("demo_insufficient_evidence").post(
      `${s}/agent/reviews`,
      { question: "复盘", scope: { question_ids: [], key_node_ids: [] } },
      reviewSchema,
    ),
  ).rejects.toMatchObject({ code: "INSUFFICIENT_EVIDENCE", status: 422 });
});
it("version-mismatch scenario blocks business data", async () => {
  await expect(
    client("demo_version_mismatch").get(`${s}/overview`, overviewSchema),
  ).rejects.toMatchObject({ code: "VERSION_MISMATCH", status: 409 });
});
it("research demo data stays truthful and fusion carries no trained metrics", async () => {
  const c = client("demo_happy_path", "mock.researcher.token");
  expect(
    (await c.get("/research/datasets", pageSchema(datasetSchema))).items[0]
      .authenticity[0].data_nature,
  ).toBe("DEMO");
  const model = (await c.get("/research/models", pageSchema(modelSchema)))
    .items[0];
  expect(model.status).toBe("SKELETON_ONLY");
  expect(model.metrics_summary).toBeNull();
  expect(
    (await c.get("/research/experiments", pageSchema(experimentSchema))).items,
  ).toEqual([]);
  expect(
    (await c.get("/research/failure-cases", pageSchema(failureSchema))).items,
  ).toEqual([]);
});
it("filters apply question/event constraints and preserve zero result count", async () => {
  const c = client("demo_happy_path");
  const data = await c.get(
    `${s}/students?event_type=REVISION_CANDIDATE`,
    pageSchema(participantSchema),
  );
  expect(data.total).toBe(0);
  expect(data.items).toEqual([]);
});
it("rejects out-of-page coordinates without normalization guesses", () => {
  expect(
    replaySchema.safeParse({
      coordinate_system: "PAGE_NORM_TOP_LEFT",
      page_id: "p",
      strokes: [
        {
          stroke_id: "s",
          start_time_ms: 0,
          end_time_ms: 1,
          question_id: null,
          points: [{ x: 2, y: 0, t_ms: 0 }],
        },
      ],
      events: [],
      quality: {
        availability: "AVAILABLE",
        source_quality_status: "VALID",
        flags: [],
        reason: null,
      },
    }).success,
  ).toBe(false);
});
