import { z } from "zod";
import { apiClient, segment, query } from "./runtime";
import {
  pageSchema,
  classSchema,
  sessionSchema,
  overviewSchema,
  classStateSchema,
  nodeSchema,
  questionSchema,
  participantSchema,
  reviewSchema,
  reviewInputSchema,
  feedbackSchema,
} from "../contracts";
const root = (id: string) => `/teacher/sessions/${segment(id)}`;
export const teacherApi = {
  classes: () => apiClient.get("/classes", pageSchema(classSchema)),
  sessions: (
    id: string,
    filters: Record<string, string | number | undefined> = {},
  ) =>
    apiClient.get(
      `/classes/${segment(id)}/sessions${query(filters)}`,
      pageSchema(sessionSchema),
    ),
  overview: (id: string) =>
    apiClient.get(`${root(id)}/overview`, overviewSchema),
  classState: (
    id: string,
    filters: Record<string, string | number | undefined> = {},
  ) =>
    apiClient.get(`${root(id)}/class-state${query(filters)}`, classStateSchema),
  keyNodes: (
    id: string,
    filters: Record<string, string | number | undefined> = {},
  ) =>
    apiClient.get(
      `${root(id)}/key-nodes${query(filters)}`,
      pageSchema(nodeSchema),
    ),
  question: (id: string, q: string) =>
    apiClient.get(`${root(id)}/questions/${segment(q)}`, questionSchema),
  students: (
    id: string,
    filters: Record<string, string | number | undefined> = {},
  ) =>
    apiClient.get(
      `${root(id)}/students${query(filters)}`,
      pageSchema(participantSchema),
    ),
  review: (id: string, input: z.infer<typeof reviewInputSchema>) =>
    apiClient.post(
      `${root(id)}/agent/reviews`,
      reviewInputSchema.parse(input),
      reviewSchema,
    ),
  feedback: (id: string, input: z.infer<typeof feedbackSchema>) =>
    apiClient.post(
      `/teacher/agent/reviews/${segment(id)}/feedback`,
      feedbackSchema.parse(input),
      z.null(),
    ),
};
