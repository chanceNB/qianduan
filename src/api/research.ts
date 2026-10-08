import { apiClient, segment } from "./runtime";
import {
  pageSchema,
  datasetSchema,
  modelSchema,
  experimentSchema,
  failureSchema,
  traceSchema,
} from "../contracts";
export const researchApi = {
  datasets: () =>
    apiClient.get("/research/datasets", pageSchema(datasetSchema)),
  models: () => apiClient.get("/research/models", pageSchema(modelSchema)),
  experiments: () =>
    apiClient.get("/research/experiments", pageSchema(experimentSchema)),
  failures: () =>
    apiClient.get("/research/failure-cases", pageSchema(failureSchema)),
  trace: (id: string) =>
    apiClient.get(`/research/evidence-trace/${segment(id)}`, traceSchema),
};
