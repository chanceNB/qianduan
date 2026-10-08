import { it, expect } from "vitest";
import { z } from "zod";
import { createClient } from "../src/api/client";
import { createMockTransport } from "../src/mocks/handlers";
import {
  personalSchema,
  researchShowcaseSchema,
} from "../src/demo/studentResearchContract";
const root = "/teacher/sessions/demo_session_001";
const client = (scenario = "demo_happy_path", token = "mock.teacher.token") =>
  createClient({
    baseUrl: "/mock-api/v1",
    transport: createMockTransport(scenario),
    getToken: () => token,
    onUnauthorized: () => {},
  });
it.each([
  ["anon_p017", true, 0, 0],
  ["anon_p018", true, 2, 0],
  ["anon_p019", false, 1, 1],
] as const)(
  "personal projection %s is scoped and matches frozen facts",
  async (id, correct, returns, revisions) => {
    const p = await client().get(`${root}/demo-students/${id}`, personalSchema);
    expect(p.results).toHaveLength(6);
    expect(p.results.find((r) => r.question_id === "Q05")?.correct).toBe(
      correct,
    );
    expect(
      p.events.filter(
        (e) => e.question_id === "Q05" && e.event_type === "RETURN",
      ),
    ).toHaveLength(returns);
    expect(
      p.events.filter(
        (e) => e.question_id === "Q05" && e.event_type === "REVISION_CANDIDATE",
      ),
    ).toHaveLength(revisions);
    expect(
      p.events.every(
        (e) => e.event_id.startsWith(id) && e.evidence_refs.length === 0,
      ),
    ).toBe(true);
    expect(p.evidence?.event_ids.every((e) => e.startsWith(id))).toBe(true);
    expect(p.evidence?.quality.availability).toBe("PARTIAL");
    expect(JSON.stringify(p)).not.toContain("student_set");
    expect(p.focus).toEqual([]);
  },
);
it.each(["ACCEPT", "EDIT_AND_ACCEPT", "REJECT"] as const)(
  "shares persisted %s review without leaking rejected text",
  async (action) => {
    await client().post(
      "/teacher/agent/reviews/review_0001/feedback",
      {
        action,
        edited_text:
          action === "EDIT_AND_ACCEPT" ? "教师修改的全班关注项" : null,
        comment: null,
      },
      z.null(),
    );
    const p = await client().get(
      `${root}/demo-students/anon_p019`,
      personalSchema,
    );
    expect(p.review_status).toBe(action);
    if (action === "REJECT") expect(p.focus).toEqual([]);
    else expect(p.focus.length).toBeGreaterThan(0);
    if (action === "EDIT_AND_ACCEPT") {
      expect(p.focus).toEqual(["教师修改的全班关注项"]);
      expect(p.focus_source).toBe("TEACHER");
    }
  },
);
it("insufficient evidence retains facts but refuses suggestions and references", async () => {
  const p = await client("demo_insufficient_evidence").get(
    `${root}/demo-students/anon_p019`,
    personalSchema,
  );
  expect(p.events.length).toBeGreaterThan(0);
  expect(p.evidence).toBeNull();
  expect(p.focus).toEqual([]);
  expect(p.review_status).toBe("INSUFFICIENT_EVIDENCE");
});
it("isolates roles, sessions, unknown students and read-only methods", async () => {
  for (const token of ["mock.student.token", "mock.researcher.token"])
    await expect(
      client("demo_happy_path", token).get(
        `${root}/demo-students/anon_p017`,
        personalSchema,
      ),
    ).rejects.toMatchObject({ status: 403 });
  await expect(
    client().get(
      "/teacher/sessions/other/demo-students/anon_p017",
      personalSchema,
    ),
  ).rejects.toMatchObject({ status: 404 });
  await expect(
    client().get(`${root}/demo-students/anon_p028`, personalSchema),
  ).rejects.toMatchObject({ status: 404 });
  await expect(
    client().post(`${root}/demo-students/anon_p017`, {}, personalSchema),
  ).rejects.toMatchObject({ status: 404 });
});
it("teacher reads research showcase while formal Research still rejects teacher", async () => {
  const r = await client().get(
    `${root}/research-showcase`,
    researchShowcaseSchema,
  );
  expect(r.fusion_status).toBe("Prototype / Not Validated");
  expect(r.model_metrics).toBeNull();
  expect(r.vision_artifacts).toEqual([]);
  expect(r.sections.map((s) => s.id)).toEqual([
    "datasets",
    "models",
    "experiments",
    "failure-cases",
    "evidence-trace",
  ]);
  await expect(
    client().get("/research/datasets", z.unknown()),
  ).rejects.toMatchObject({ status: 403 });
  await expect(
    client().post(`${root}/research-showcase`, {}, z.unknown()),
  ).rejects.toMatchObject({ status: 404 });
});
