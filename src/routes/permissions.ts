import type { Role } from "../contracts";
export function canAccess(
  role: Role,
  area: "teacher" | "research" | "settings" | "home" | "ai",
  features: { research_lab: boolean; teacher_agent: boolean },
) {
  if (area === "home" || area === "settings") return true;
  if (area === "research")
    return (
      features.research_lab && (role === "TEACHER" || role === "RESEARCHER")
    );
  if (area === "ai") return role === "TEACHER" && features.teacher_agent;
  return role === "TEACHER";
}
