import { describe, it, expect } from "vitest";
import { createClient, ApiError } from "../src/api/client";
import { createMockTransport } from "../src/mocks/handlers";
import { userSchema, pageSchema, sessionSchema } from "../src/contracts";
import { z } from "zod";
const client = (scenario = "empty", token = "mock.teacher.token") =>
  createClient({
    transport: createMockTransport(scenario),
    baseUrl: "/mock-api/v1",
    getToken: () => token,
    onUnauthorized: () => {},
  });
describe("contract API boundary", () => {
  it("keeps default classroom data empty", async () => {
    expect(
      (
        await client().get(
          "/classes",
          pageSchema(z.object({ class_id: z.string(), name: z.string() })),
        )
      ).items,
    ).toEqual([]);
  });
  it("returns authoritative user identity instead of role hint", async () => {
    expect((await client().get("/me", userSchema)).role).toBe("TEACHER");
  });
  it("rejects unauthenticated calls", async () => {
    await expect(
      client("empty", "").get("/me", userSchema),
    ).rejects.toMatchObject({ code: "UNAUTHENTICATED", status: 401 });
  });
  it("preserves forbidden Research access", async () => {
    await expect(
      client().get("/research/datasets", z.unknown()),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
  it("returns demo sessions with explicit authenticity", async () => {
    const data = await client("demo_happy_path").get(
      "/classes/class_3a/sessions",
      pageSchema(sessionSchema),
    );
    expect(data.items[0].authenticity[0].data_nature).toBe("DEMO");
  });
  it("does not manufacture evidence when references are insufficient", async () => {
    await expect(
      client("demo_insufficient_evidence").get(
        "/evidence/ev_sess001_q05_0003",
        z.unknown(),
      ),
    ).rejects.toMatchObject({ code: "INSUFFICIENT_EVIDENCE" });
  });
  it("blocks incompatible major response versions", async () => {
    const c = createClient({
      baseUrl: "/api/v1",
      transport: async () =>
        new Response(
          JSON.stringify({
            success: true,
            request_id: "test",
            data: {},
            meta: { api_version: "2.0" },
          }),
        ),
      getToken: () => "",
      onUnauthorized: () => {},
    });
    await expect(c.get("/me", z.unknown())).rejects.toMatchObject({
      code: "VERSION_MISMATCH",
    });
  });
  it("rejects malformed successful DTOs", async () => {
    const c = createClient({
      baseUrl: "/api/v1",
      transport: async () =>
        new Response(
          JSON.stringify({
            success: true,
            request_id: "test",
            data: { role: "TEACHER" },
            meta: { api_version: "0.1" },
          }),
        ),
      getToken: () => "",
      onUnauthorized: () => {},
    });
    await expect(c.get("/me", userSchema)).rejects.toBeInstanceOf(ApiError);
  });
  it("allows compatible minor API versions", async () => {
    const c = createClient({
      baseUrl: "/api/v1",
      transport: async () =>
        new Response(
          JSON.stringify({
            success: true,
            request_id: "test",
            data: "ok",
            meta: { api_version: "0.2" },
          }),
        ),
      getToken: () => "",
      onUnauthorized: () => {},
    });
    expect(await c.get("/x", z.string())).toBe("ok");
  });
});
