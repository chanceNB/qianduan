import { z } from "zod";
import { natureSchema } from "./common";
export const roleSchema = z.enum(["TEACHER", "STUDENT", "RESEARCHER", "ADMIN"]);
export const userSchema = z.object({
  user_id: z.string(),
  display_name: z.string(),
  role: roleSchema,
});
export const loginInputSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
  role_hint: roleSchema.optional(),
});
export const loginSchema = z.object({
  access_token: z.string(),
  expires_in: z.number().positive(),
  user: userSchema,
});
export const bootstrapSchema = z.object({
  app_name: z.string(),
  api_version: z.string(),
  features: z.object({
    teacher_agent: z.boolean(),
    student_feedback: z.boolean(),
    research_lab: z.boolean(),
    fusion: z.boolean(),
  }),
  fusion_status: z.enum(["SKELETON_ONLY", "NOT_TRAINED"]),
  truth_labels: z.array(natureSchema),
});
export type User = z.infer<typeof userSchema>;
export type Role = z.infer<typeof roleSchema>;
export type Bootstrap = z.infer<typeof bootstrapSchema>;
