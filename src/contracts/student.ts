import { z } from "zod";
import { qualitySchema } from "./common";
export const eventSchema = z.object({
  event_id: z.string(),
  event_type: z.string(),
  question_id: z.string().nullable(),
  start_time_ms: z.number().int(),
  end_time_ms: z.number().int(),
  evidence_refs: z.array(z.string()),
});
export const processSchema = z.object({
  participant_id: z.string(),
  session_id: z.string(),
  event_timeline: z.array(eventSchema),
  question_summaries: z.array(
    z.object({
      question_id: z.string(),
      visit_count: z.number().int(),
      return_count: z.number().int(),
      revision_candidate_count: z.number().int(),
    }),
  ),
  quality: qualitySchema,
});
export const replaySchema = z.object({
  coordinate_system: z.literal("PAGE_NORM_TOP_LEFT"),
  page_id: z.string(),
  strokes: z.array(
    z.object({
      stroke_id: z.string(),
      start_time_ms: z.number().int(),
      end_time_ms: z.number().int(),
      question_id: z.string().nullable(),
      points: z.array(
        z.object({
          x: z.number().min(0).max(1),
          y: z.number().min(0).max(1),
          t_ms: z.number().int(),
        }),
      ),
    }),
  ),
  events: z.array(z.string()),
  quality: qualitySchema,
});
export type Replay = z.infer<typeof replaySchema>;
