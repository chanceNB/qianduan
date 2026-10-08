import { apiClient, segment } from "./runtime";
import { evidenceSchema, traceSchema } from "../contracts";
export const evidenceApi = {
  get: (id: string) =>
    apiClient.get(`/evidence/${segment(id)}`, evidenceSchema),
  trace: (id: string) =>
    apiClient.get(`/evidence/${segment(id)}/trace`, traceSchema),
};
