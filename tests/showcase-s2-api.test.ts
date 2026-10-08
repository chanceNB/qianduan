import { it, expect } from "vitest";
import { showcaseSchema } from "../src/demo/showcase";
import { createClient } from "../src/api/client";
import { createMockTransport } from "../src/mocks/handlers";
const get = (
  token = "mock.teacher.token",
  scenario = "demo_happy_path",
  id = "demo_session_001",
) =>
  createClient({
    transport: createMockTransport(scenario),
    baseUrl: "/mock-api/v1",
    getToken: () => token,
    onUnauthorized: () => {},
  }).get(`/teacher/sessions/${id}/showcase`, showcaseSchema);
it("serves a separate demo projection of frozen A/B/C results", async () => {
  const data = await get();
  expect(
    data.students.map((s) => [
      s.participant_id,
      s.results.find((r) => r.question_id === "Q05")?.correct,
    ]),
  ).toEqual([
    ["anon_p017", true],
    ["anon_p018", true],
    ["anon_p019", false],
  ]);
});
it("preserves role and missing session enforcement for the demo projection", async () => {
  await expect(get("mock.student.token")).rejects.toMatchObject({
    status: 403,
  });
  await expect(get("mock.researcher.token")).rejects.toMatchObject({
    status: 403,
  });
  await expect(get("mock.teacher.token", "empty")).rejects.toMatchObject({
    status: 404,
  });
  await expect(
    get("mock.teacher.token", "demo_happy_path", "unknown"),
  ).rejects.toMatchObject({ status: 404 });
});
it("rejects empty projection lists before rendering", async () => {
  const data = await get();
  expect(showcaseSchema.safeParse({ ...data, students: [] }).success).toBe(
    false,
  );
  expect(showcaseSchema.safeParse({ ...data, questions: [] }).success).toBe(
    false,
  );
});
it("preserves version-mismatch, missing-vision and completion-unavailable scenarios", async () => {
  await expect(
    get("mock.teacher.token", "demo_version_mismatch"),
  ).rejects.toMatchObject({ status: 409, code: "VERSION_MISMATCH" });
  const noCompletion = await get("mock.teacher.token", "demo_not_computable");
  expect(noCompletion.state.completion_ratio).toBeNull();
  expect(noCompletion.state.quality.availability).toBe("NOT_COMPUTABLE");
  const noVision = await get("mock.teacher.token", "demo_missing_vision");
  expect(noVision.state.return_ratio.Q05).toBeCloseTo(4 / 12);
  expect(noVision.authenticity.every((t) => !t.is_research_evidence)).toBe(
    true,
  );
});
it("rejects a projection that drops synthetic labels or claims research evidence", async () => {
  const data = await get();
  expect(showcaseSchema.safeParse({ ...data, authenticity: [] }).success).toBe(
    false,
  );
  expect(
    showcaseSchema.safeParse({
      ...data,
      authenticity: data.authenticity.map((t) => ({
        ...t,
        is_research_evidence: true,
      })),
    }).success,
  ).toBe(false);
});
