import { z } from "zod";
export const availabilitySchema = z.enum([
  "AVAILABLE",
  "PARTIAL",
  "UNAVAILABLE",
  "NOT_COMPUTABLE",
]);
export const qualitySchema = z.object({
  availability: availabilitySchema,
  source_quality_status: z.string(),
  flags: z.array(z.string()),
  reason: z.string().nullable(),
});
export const natureSchema = z.enum([
  "TEAM_COLLECTED_PEN",
  "OPEN_DATA_MODEL",
  "CSTUDENTACT",
  "DEMO",
  "SYNTHETIC",
  "REAL_PAIRED",
]);
export const authenticitySchema = z.object({
  data_nature: natureSchema,
  label: z.string(),
  is_research_evidence: z.boolean(),
  note: z.string().nullable(),
});
export const pageSchema = <T extends z.ZodType>(item: T) =>
  z.object({
    items: z.array(item),
    page: z.number().int().min(1),
    page_size: z.number().int().min(1),
    total: z.number().int().nonnegative(),
    has_next: z.boolean(),
  });
export const envelopeSchema = z.discriminatedUnion("success", [
  z.object({
    success: z.literal(true),
    request_id: z.string(),
    data: z.unknown(),
    meta: z.object({
      api_version: z.string(),
      generated_at: z.string().optional(),
    }),
  }),
  z.object({
    success: z.literal(false),
    request_id: z.string(),
    error: z.object({
      code: z.string(),
      message: z.string(),
      details: z.record(z.string(), z.unknown()),
      retryable: z.boolean(),
    }),
    meta: z.object({ api_version: z.string() }),
  }),
]);
export type Quality = z.infer<typeof qualitySchema>;
export type Authenticity = z.infer<typeof authenticitySchema>;
export type Availability = z.infer<typeof availabilitySchema>;
export const jsonValueSchema: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(jsonValueSchema),
    z.record(z.string(), jsonValueSchema),
  ]),
);
export type JsonValue =
  string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };
