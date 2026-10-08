import { it, expect, vi } from "vitest";
import { z } from "zod";
import { createClient } from "../src/api/client";
import { createMockTransport } from "../src/mocks/handlers";
const root = "/teacher/sessions/demo_session_001";
const input = {
  question_id: "Q05",
  key_node_id: "node_0003",
  evidence_ids: ["ev_sess001_q05_0003"],
  task: "课堂复盘",
};
const client = (scenario = "demo_happy_path", token = "mock.teacher.token") =>
  createClient({
    baseUrl: "/mock-api/v1",
    transport: createMockTransport(scenario),
    getToken: () => token,
    onUnauthorized: () => {},
  });
const response = z.object({
  report: z
    .object({
      summary: z.string(),
      status: z.string(),
      evidence_ids: z.array(z.string()),
      confidence: z.null(),
      requires_teacher_review: z.literal(true),
    })
    .passthrough()
    .nullable(),
  feedback: z
    .object({ action: z.string(), edited_text: z.string().nullable() })
    .nullable(),
  storage_warning: z.string().nullable(),
});
it("generates an evidence-grounded synthetic report with S1 counts", async () => {
  const r = await client().post(`${root}/demo-report`, input, response);
  expect(r.report?.status).toBe("READY");
  expect(r.report?.summary).toContain(
    "12 名有效参与者中有 4 名出现 RETURN，3 名出现 REVISION_CANDIDATE",
  );
  expect(r.report?.summary).toContain("14:00–15:00");
  expect(r.report?.summary).toContain("Synthetic");
  expect(r.report?.evidence_ids).toEqual(input.evidence_ids);
});
it.each([{ evidence_ids: [] }, { evidence_ids: ["fake"] }])(
  "invalid evidence %j yields no conclusions or references",
  async ({ evidence_ids }) => {
    const r = await client().post(
      `${root}/demo-report`,
      { ...input, evidence_ids },
      response,
    );
    expect(r.report?.status).toBe("INSUFFICIENT_EVIDENCE");
    expect(r.report?.evidence_ids).toEqual([]);
    expect(r.report?.summary).not.toContain("4 名");
  },
);
it("insufficient scenario blocks reports and all feedback actions", async () => {
  const c = client("demo_insufficient_evidence");
  const r = await c.post(`${root}/demo-report`, input, response);
  expect(r.report?.status).toBe("INSUFFICIENT_EVIDENCE");
  expect(r.report?.evidence_ids).toEqual([]);
  for (const action of ["ACCEPT", "EDIT_AND_ACCEPT", "REJECT"])
    await expect(
      c.post(
        "/teacher/agent/reviews/review_0001/feedback",
        { action, edited_text: "修改", comment: null },
        z.null(),
      ),
    ).rejects.toMatchObject({ code: "INSUFFICIENT_EVIDENCE" });
});
it.each(["ACCEPT", "EDIT_AND_ACCEPT", "REJECT"])(
  "restores %s using S1 persistence without replacing original report",
  async (action) => {
    const c = client();
    const original = (await c.post(`${root}/demo-report`, input, response))
      .report?.summary;
    await c.post(
      "/teacher/agent/reviews/review_0001/feedback",
      {
        action,
        edited_text: action === "EDIT_AND_ACCEPT" ? "教师核查文本" : null,
        comment: null,
      },
      z.null(),
    );
    const restored = await client().get(`${root}/demo-report`, response);
    expect(restored.feedback?.action).toBe(action);
    expect(restored.report?.summary).toBe(original);
    if (action === "EDIT_AND_ACCEPT")
      expect(restored.feedback?.edited_text).toBe("教师核查文本");
  },
);
it("storage save failure is an error and corrupt/read-failed storage is disclosed", async () => {
  const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("blocked");
  });
  await expect(
    client().post(
      "/teacher/agent/reviews/review_0001/feedback",
      { action: "ACCEPT", edited_text: null, comment: null },
      z.null(),
    ),
  ).rejects.toMatchObject({ code: "LOCAL_STORAGE_UNAVAILABLE" });
  spy.mockRestore();
  localStorage.setItem(
    "zhicha-showcase-v0.1:demo_happy_path:teacher_001:demo_session_001:review_0001",
    "corrupt",
  );
  expect(
    (await client().get(`${root}/demo-report`, response)).storage_warning,
  ).toBeTruthy();
});
it("retains role and exact session checks for demo reports", async () => {
  await expect(
    client("demo_happy_path", "mock.student.token").post(
      `${root}/demo-report`,
      input,
      response,
    ),
  ).rejects.toMatchObject({ status: 403 });
  await expect(
    client().get("/teacher/sessions/other/demo-report", response),
  ).rejects.toMatchObject({ status: 404 });
});
it("rejects feedback after invalid Evidence and allows retry with valid Evidence", async () => {
  const c = client();
  await c.post(
    `${root}/demo-report`,
    { ...input, evidence_ids: ["fake"] },
    response,
  );
  await expect(
    c.post(
      "/teacher/agent/reviews/review_0001/feedback",
      { action: "ACCEPT", edited_text: null, comment: null },
      z.null(),
    ),
  ).rejects.toMatchObject({ code: "INSUFFICIENT_EVIDENCE" });
  await c.post(`${root}/demo-report`, input, response);
  expect(
    await c.post(
      "/teacher/agent/reviews/review_0001/feedback",
      { action: "ACCEPT", edited_text: null, comment: null },
      z.null(),
    ),
  ).toBeNull();
});
