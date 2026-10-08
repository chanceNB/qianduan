import { z } from "zod";
import { reviewSchema, feedbackSchema } from "../contracts";
export const reportTasks = [
  "课堂复盘",
  "关键节点说明",
  "下一课关注项",
] as const;
export const demoReportInputSchema = z
  .object({
    question_id: z.string(),
    key_node_id: z.string(),
    evidence_ids: z.array(z.string()),
    task: z.enum(reportTasks),
  })
  .strict();
export type DemoReportInput = z.infer<typeof demoReportInputSchema>;
export const demoReportSchema = reviewSchema.extend({
  confidence: z.null(),
  requires_teacher_review: z.literal(true),
  status: z.enum(["READY", "INSUFFICIENT_EVIDENCE"]),
  engine: z.literal("EVIDENCE_TEMPLATE_DEMO"),
  data_nature: z.literal("SYNTHETIC"),
  is_research_evidence: z.literal(false),
});
export type DemoReport = z.infer<typeof demoReportSchema>;
export const demoReportEnvelopeSchema = z.object({
  report: demoReportSchema.nullable(),
  feedback: feedbackSchema.nullable(),
  storage_warning: z.string().nullable(),
});
export type DemoReportEnvelope = z.infer<typeof demoReportEnvelopeSchema>;
