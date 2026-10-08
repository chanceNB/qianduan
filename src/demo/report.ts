import { apiClient, query, segment } from "../api/runtime";
import {
  demoReportInputSchema,
  demoReportEnvelopeSchema,
  type DemoReportInput,
} from "./reportContract";
export * from "./reportContract";
const root = (id: string) => `/teacher/sessions/${segment(id)}/demo-report`;
export const demoReportApi = {
  generate: (id: string, input: DemoReportInput) =>
    apiClient.post(
      root(id),
      demoReportInputSchema.parse(input),
      demoReportEnvelopeSchema,
    ),
  restore: (id: string, input: DemoReportInput) =>
    apiClient.get(
      `${root(id)}${query({ question_id: input.question_id, key_node_id: input.key_node_id, evidence_id: input.evidence_ids.join(","), task: input.task })}`,
      demoReportEnvelopeSchema,
    ),
};
