import { z } from "zod";
import { qualitySchema, authenticitySchema, jsonValueSchema } from "./common";
export const evidenceSchema = z.object({
  evidence_id: z.string(),
  session_id: z.string(),
  task_segment_id: z.string().nullable(),
  question_id: z.string().nullable(),
  knowledge_point: z.string().nullable(),
  student_set: z.array(z.string()),
  pen_evidence: z
    .object({
      event_refs: z.array(z.string()),
      stroke_refs: z.array(z.string()),
    })
    .nullable(),
  video_evidence: z
    .object({
      frame_refs: z.array(z.string()),
      window_refs: z.array(z.string()),
    })
    .nullable(),
  result_evidence: jsonValueSchema,
  quality: qualitySchema,
  provenance: z.record(z.string(), z.string().nullable()),
  claim_level: z.string(),
  authenticity: z.array(authenticitySchema),
});
// CONTRACT_GAP: trace node/manifest/run shape is not frozen in V0.1.
export const traceSchema = z.object({
  evidence_id: z.string(),
  chain: z.array(
    z.object({
      level: z.enum([
        "Sensor Fact",
        "Observable Event",
        "Derived Pattern",
        "Evidence Package",
        "Teaching Hypothesis",
      ]),
      reference: z.string().nullable(),
      description: z.string().nullable(),
    }),
  ),
  versions: z.record(z.string(), z.string()),
  source: z.string().nullable(),
  quality: qualitySchema,
  manifest_ref: z.string().nullable(),
  run_ref: z.string().nullable(),
});
