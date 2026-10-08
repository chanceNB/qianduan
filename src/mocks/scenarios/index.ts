export const scenarios = [
  "empty",
  "demo_happy_path",
  "demo_missing_vision",
  "demo_not_computable",
  "demo_insufficient_evidence",
  "demo_version_mismatch",
] as const;
export type Scenario = (typeof scenarios)[number];
