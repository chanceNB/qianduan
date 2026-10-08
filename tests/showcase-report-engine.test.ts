import { it, expect } from "vitest";
import { generateDemoReport } from "../src/demo/reportEngine";
import * as demo from "../src/mocks/fixtures/demo";
const input = {
  question_id: "Q05",
  key_node_id: demo.node.node_id,
  evidence_ids: [demo.evidenceId],
  task: "课堂复盘" as const,
};
const source = {
  sessionId: demo.session.session_id,
  node: demo.node,
  evidence: demo.evidence,
  events: demo.events,
  questionIds: demo.questions.map((q) => q.question_id),
};
it.each([
  { node: { ...demo.node, session_id: "other" } },
  { evidence: { ...demo.evidence, session_id: "other" } },
  {
    evidence: {
      ...demo.evidence,
      quality: { ...demo.evidence.quality, source_quality_status: "INVALID" },
    },
  },
  {
    evidence: {
      ...demo.evidence,
      pen_evidence: { stroke_refs: [], event_refs: ["fake"] },
    },
  },
  {
    evidence: {
      ...demo.evidence,
      pen_evidence: {
        stroke_refs: [],
        event_refs: demo.evidence.pen_evidence.event_refs.slice(1),
      },
    },
  },
  {
    evidence: {
      ...demo.evidence,
      authenticity: demo.demoTags.map((t) => ({
        ...t,
        is_research_evidence: true,
      })),
    },
  },
  { node: { ...demo.node, end_time_ms: 900001 } },
  { events: [] },
])("rejects invalid evidence/event/quality source %j", (changes) => {
  const report = generateDemoReport(input, { ...source, ...changes });
  expect(report.status).toBe("INSUFFICIENT_EVIDENCE");
  expect(report.evidence_ids).toEqual([]);
  expect(report.suggested_focus).toEqual([]);
});
it("derives ratios from supplied events instead of hardcoded statistics", () => {
  const events = demo.events.filter((e) => e.event_type !== "RETURN");
  const evidence = {
    ...demo.evidence,
    pen_evidence: {
      stroke_refs: [],
      event_refs: events
        .filter((e) => e.question_id === "Q05")
        .map((e) => e.event_id),
    },
  };
  const r = generateDemoReport(input, { ...source, events, evidence });
  expect(r.status).toBe("READY");
  expect(r.summary).toContain("0 名出现 RETURN");
  expect(r.confidence).toBeNull();
  expect(r.summary).not.toMatch(/心理|情绪|专注|人格|置信/);
});
