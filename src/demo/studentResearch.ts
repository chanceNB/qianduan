import { apiClient, segment } from "../api/runtime";
import {
  personalSchema,
  researchShowcaseSchema,
} from "./studentResearchContract";
export const personalApi = {
  get: (session: string, student: string) =>
    apiClient.get(
      `/teacher/sessions/${segment(session)}/demo-students/${segment(student)}`,
      personalSchema,
    ),
};
export const researchShowcaseApi = {
  get: (session: string) =>
    apiClient.get(
      `/teacher/sessions/${segment(session)}/research-showcase`,
      researchShowcaseSchema,
    ),
};
