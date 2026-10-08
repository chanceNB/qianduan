import { apiClient, segment } from "./runtime";
import { processSchema, replaySchema } from "../contracts";
const root = (s: string, p: string) =>
  `/teacher/sessions/${segment(s)}/students/${segment(p)}`;
export const studentApi = {
  process: (s: string, p: string) =>
    apiClient.get(`${root(s, p)}/process`, processSchema),
  replay: (s: string, p: string) =>
    apiClient.get(`${root(s, p)}/replay`, replaySchema),
};
