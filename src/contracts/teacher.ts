import { z } from "zod";
import { qualitySchema, authenticitySchema, jsonValueSchema } from "./common";
// CONTRACT_GAP: Class/list/question DTO shapes pending R3 confirmation.
export const classSchema = z.object({ class_id: z.string(), name: z.string() });
export const sessionSchema = z.object({
  session_id: z.string(),
  class_id: z.string(),
  course_name: z.string(),
  lesson_title: z.string(),
  started_at_ms: z.number().int(),
  duration_ms: z.number().int(),
  participant_count: z.number().int(),
  authenticity: z.array(authenticitySchema),
});
export const metricSchema = z.object({
  metric_key: z.string(),
  label: z.string(),
  value: z.number().nullable(),
  unit: z.string(),
  display_value: z.string().nullable(),
  quality: qualitySchema,
  evidence_refs: z.array(z.string()),
});
export const distributionSchema = z.object({
  question_id: z.string(),
  count: z.number().int().nullable(),
  ratio: z.number().nullable(),
});
export const nodeSchema = z.object({
  node_id: z.string(),
  session_id: z.string(),
  start_time_ms: z.number().int(),
  end_time_ms: z.number().int(),
  title: z.string(),
  description: z.string(),
  question_ids: z.array(z.string()),
  affected_participant_count: z.number().int().nullable(),
  tags: z.array(z.string()),
  evidence_refs: z.array(z.string()),
  quality: qualitySchema,
});
export const overviewSchema = z.object({
  session: sessionSchema,
  metrics: z.array(metricSchema),
  question_distribution: z.array(distributionSchema),
  key_nodes: z.array(nodeSchema),
  macro_vision: jsonValueSchema,
  agent_preview: jsonValueSchema,
  authenticity: z.array(authenticitySchema),
});
export const classStateSchema = z.object({
  window: z.object({ start_ms: z.number().int(), end_ms: z.number().int() }),
  valid_participant_count: z.number().int().nullable(),
  question_distribution: z.array(distributionSchema),
  return_ratio: z.record(z.string(), z.number().nullable()),
  revision_candidate_ratio: z.record(z.string(), z.number().nullable()),
  completion_ratio: z.record(z.string(), z.number().nullable()).nullable(),
  progress_divergence: z
    .object({
      variance: z.number().nullable(),
      entropy_norm: z.number().nullable(),
    })
    .nullable(),
  quality: qualitySchema,
});
export const participantSchema = z.object({ participant_id: z.string() });
export const questionSchema = z.object({
  question_id: z.string(),
  knowledge_point: z.string().nullable(),
  question_distribution: z.array(distributionSchema),
  key_nodes: z.array(nodeSchema),
  students: z.array(participantSchema),
  evidence_refs: z.array(z.string()),
});
export const reviewInputSchema = z
  .object({
    question: z.string().min(1).max(500),
    scope: z.object({
      question_ids: z.array(z.string()),
      key_node_ids: z.array(z.string()),
    }),
  })
  .strict();
export const reviewSchema = z.object({
  review_id: z.string(),
  summary: z.string(),
  concerned_questions: z.array(z.string()),
  knowledge_points: z.array(z.string()),
  affected_student_ids: z.array(z.string()),
  evidence_ids: z.array(z.string()),
  suggested_focus: z.array(z.string()),
  confidence: z.number().nullable(),
  requires_teacher_review: z.boolean(),
  status: z.enum(["READY", "INSUFFICIENT_EVIDENCE", "PENDING", "FAILED"]),
  quality: qualitySchema,
});
export const feedbackSchema = z
  .object({
    action: z.enum(["ACCEPT", "EDIT_AND_ACCEPT", "REJECT"]),
    edited_text: z.string().nullable(),
    comment: z.string().nullable(),
  })
  .superRefine((v, c) => {
    if (v.action === "EDIT_AND_ACCEPT" && !v.edited_text?.trim())
      c.addIssue({
        code: "custom",
        message: "请填写修改后的内容",
        path: ["edited_text"],
      });
  });
export type Session = z.infer<typeof sessionSchema>;
export type Review = z.infer<typeof reviewSchema>;
