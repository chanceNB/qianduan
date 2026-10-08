import { z } from "zod";
import { authenticitySchema, jsonValueSchema } from "./common";
export const datasetSchema = z.object({
  dataset_id: z.string(),
  name: z.string(),
  version: z.string(),
  source_type: z.string(),
  sample_count: z.number().int().nullable(),
  split_summary: jsonValueSchema,
  license_status: z.string(),
  privacy_status: z.string(),
  manifest_hash: z.string().nullable(),
  authenticity: z.array(authenticitySchema),
});
export const modelSchema = z
  .object({
    model_id: z.string(),
    name: z.string(),
    model_version: z.string(),
    task: z.string(),
    dataset_version: z.string().nullable(),
    status: z.string(),
    checkpoint_ref: z.string().nullable(),
    metrics_summary: jsonValueSchema,
    limitations: z.array(z.string()),
  })
  .superRefine((v, c) => {
    if (
      v.model_id === "quality_aware_fusion" &&
      (!["SKELETON_ONLY", "NOT_TRAINED"].includes(v.status) ||
        v.metrics_summary !== null)
    )
      c.addIssue({
        code: "custom",
        message: "Fusion 只能显示原型状态且不含正式指标",
      });
  });
export const experimentSchema = z.object({
  experiment_id: z.string(),
  name: z.string(),
  run_id: z.string(),
  baseline: jsonValueSchema,
  comparison: jsonValueSchema,
  metrics: jsonValueSchema,
  split_hash: z.string().nullable(),
  status: z.string(),
  artifact_refs: z.array(z.string()),
});
export const failureSchema = z.object({
  case_id: z.string(),
  module: z.string(),
  category: z.string(),
  description: z.string(),
  source_ref: z.string().nullable(),
  expected: jsonValueSchema,
  actual: jsonValueSchema,
  evidence_id: z.string().nullable(),
  resolution_status: z.string(),
});
