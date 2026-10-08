import { z } from "zod";
import {
  authenticitySchema,
  sessionSchema,
  nodeSchema,
  classStateSchema,
} from "../contracts";
import { apiClient, apiMode, segment } from "../api/runtime";

// This read-only projection is Mock-only; production DTOs remain unchanged.
export const showcaseSchema = z.object({
  session: sessionSchema,
  questions: z
    .array(z.object({ question_id: z.string(), knowledge_point: z.string() }))
    .min(1),
  node: nodeSchema,
  state: classStateSchema,
  authenticity: z
    .array(authenticitySchema)
    .refine(
      (tags) =>
        ["DEMO", "SYNTHETIC"].every((nature) =>
          tags.some((t) => t.data_nature === nature),
        ) && tags.every((t) => !t.is_research_evidence),
      "Demo projection must retain DEMO/SYNTHETIC and cannot claim research evidence",
    ),
  students: z
    .array(
      z.object({
        participant_id: z.string(),
        display_name: z.string(),
        results: z.array(
          z.object({
            question_id: z.string(),
            answer: z.string(),
            correct: z.boolean(),
            source: z.literal("SYNTHETIC"),
            is_research_evidence: z.literal(false),
          }),
        ),
      }),
    )
    .min(1),
});
export type Showcase = z.infer<typeof showcaseSchema>;
export const showcaseEnabled =
  apiMode === "mock" &&
  (import.meta.env.VITE_MOCK_SCENARIO ?? "empty").startsWith("demo_");
export const showcaseApi = {
  get: (session: string) =>
    apiClient.get(
      `/teacher/sessions/${segment(session)}/showcase`,
      showcaseSchema,
    ),
};
