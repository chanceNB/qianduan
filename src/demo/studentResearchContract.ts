import { z } from "zod";
import { sessionSchema, eventSchema, qualitySchema } from "../contracts";
const result = z.object({
  question_id: z.string(),
  answer: z.string(),
  correct: z.boolean(),
  source: z.literal("SYNTHETIC"),
  is_research_evidence: z.literal(false),
});
export const personalSchema = z
  .object({
    session: sessionSchema,
    participant_id: z.enum(["anon_p017", "anon_p018", "anon_p019"]),
    display_name: z.string(),
    data_nature: z.literal("DEMO / SYNTHETIC"),
    is_research_evidence: z.literal(false),
    results: z.array(result).length(6),
    events: z.array(eventSchema),
    evidence: z
      .object({
        evidence_id: z.string(),
        participant_id: z.string(),
        event_ids: z.array(z.string()),
        window: z.object({ start_ms: z.number(), end_ms: z.number() }),
        quality: qualitySchema,
        source: z.literal("SYNTHETIC"),
        is_research_evidence: z.literal(false),
      })
      .nullable(),
    review_status: z.enum([
      "UNREVIEWED",
      "ACCEPT",
      "EDIT_AND_ACCEPT",
      "REJECT",
      "INSUFFICIENT_EVIDENCE",
    ]),
    focus: z.array(z.string()),
    focus_source: z.enum(["NONE", "TEACHER", "TEACHER_APPROVED_TEMPLATE"]),
    storage_warning: z.string().nullable(),
  })
  .superRefine((p, ctx) => {
    if (
      p.events.some(
        (e) =>
          !e.event_id.startsWith(`${p.participant_id}_`) ||
          e.evidence_refs.length,
      ) ||
      (p.evidence &&
        (p.evidence.participant_id !== p.participant_id ||
          p.evidence.event_ids.some(
            (id) => !p.events.some((e) => e.event_id === id),
          )))
    )
      ctx.addIssue({ code: "custom", message: "Personal scope mismatch" });
    if (
      !["ACCEPT", "EDIT_AND_ACCEPT"].includes(p.review_status) &&
      p.focus.length
    )
      ctx.addIssue({ code: "custom", message: "Unapproved focus" });
  });
export type Personal = z.infer<typeof personalSchema>;
export const researchShowcaseSchema = z.object({
  data_nature: z.literal("DEMO / SYNTHETIC"),
  is_research_evidence: z.literal(false),
  fusion_status: z.literal("Prototype / Not Validated"),
  model_metrics: z.null(),
  vision_artifacts: z.array(z.never()),
  sections: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      cards: z.array(
        z.object({
          title: z.string(),
          status: z.enum([
            "SOFTWARE_VERIFIED",
            "SYNTHETIC",
            "DEVELOPING",
            "NOT_VALIDATED",
          ]),
          description: z.string(),
          source: z.string(),
        }),
      ),
    }),
  ),
  evidence_id: z.string().nullable(),
});
