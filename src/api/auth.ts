import { z } from "zod";
import { apiClient } from "./runtime";
import {
  loginInputSchema,
  loginSchema,
  userSchema,
  bootstrapSchema,
} from "../contracts";
export const authApi = {
  login: (input: z.infer<typeof loginInputSchema>) =>
    apiClient.post("/auth/login", loginInputSchema.parse(input), loginSchema),
  me: () => apiClient.get("/me", userSchema),
  bootstrap: () => apiClient.get("/app/bootstrap", bootstrapSchema),
  logout: () => apiClient.post("/auth/logout", {}, z.null()),
};
