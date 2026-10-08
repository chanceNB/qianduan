// @vitest-environment node
import { it, expect } from "vitest";
import config from "../vite.showcase.config";
it("Showcase config forces Mock regardless of inherited real API environment", () => {
  const c = config as {
    define: Record<string, string>;
    build: { outDir: string };
  };
  expect(c.define["import.meta.env.VITE_API_MODE"]).toBe('"mock"');
  expect(c.define["import.meta.env.VITE_API_BASE_URL"]).toBe('"/mock-api/v1"');
  expect(c.define["import.meta.env.VITE_MOCK_SCENARIO"]).toBe(
    '"demo_happy_path"',
  );
  expect(c.build.outDir).toBe("dist-showcase");
});
