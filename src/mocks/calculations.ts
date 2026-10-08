import type { z } from "zod";
import type { eventSchema, classStateSchema } from "../contracts";
export type DemoEvent = z.infer<typeof eventSchema> & {
  participant_id: string;
};
export function summarizeQuestions(events: DemoEvent[], questionIds: string[]) {
  return questionIds.map((question_id) => {
    const onQuestion = events.filter((e) => e.question_id === question_id);
    return {
      question_id,
      visit_count: onQuestion.filter((e) =>
        ["QUESTION_VISIT", "RETURN"].includes(e.event_type),
      ).length,
      return_count: onQuestion.filter((e) => e.event_type === "RETURN").length,
      revision_candidate_count: onQuestion.filter(
        (e) => e.event_type === "REVISION_CANDIDATE",
      ).length,
    };
  });
}
export function calculateClassState(
  events: DemoEvent[],
  questionIds: string[],
  window: { start_ms: number; end_ms: number },
): z.infer<typeof classStateSchema> {
  const ordered = [...events].sort((a, b) => a.start_time_ms - b.start_time_ms);
  const current = new Map<string, string>();
  for (const e of ordered) {
    if (e.start_time_ms >= window.end_ms) break;
    if (
      e.question_id &&
      questionIds.includes(e.question_id) &&
      ["QUESTION_VISIT", "RETURN"].includes(e.event_type)
    )
      current.set(e.participant_id, e.question_id);
  }
  const denominator = current.size;
  const windowEvents = ordered.filter(
    (e) =>
      current.has(e.participant_id) &&
      e.start_time_ms >= window.start_ms &&
      e.start_time_ms < window.end_ms,
  );
  const ratio = (q: string, type: string) =>
    denominator
      ? new Set(
          windowEvents
            .filter((e) => e.question_id === q && e.event_type === type)
            .map((e) => e.participant_id),
        ).size / denominator
      : null;
  const distribution = questionIds.map((question_id) => {
    const count = [...current.values()].filter((q) => q === question_id).length;
    return {
      question_id,
      count: denominator ? count : null,
      ratio: denominator ? count / denominator : null,
    };
  });
  const indices = [...current.values()].map((q) => questionIds.indexOf(q) + 1);
  const mean = indices.reduce((sum, n) => sum + n, 0) / denominator;
  const entropy = -distribution.reduce(
    (sum, q) => sum + (q.ratio ? q.ratio * Math.log(q.ratio) : 0),
    0,
  );
  return {
    window,
    valid_participant_count: denominator,
    question_distribution: distribution,
    return_ratio: Object.fromEntries(
      questionIds.map((q) => [q, ratio(q, "RETURN")]),
    ),
    revision_candidate_ratio: Object.fromEntries(
      questionIds.map((q) => [q, ratio(q, "REVISION_CANDIDATE")]),
    ),
    completion_ratio: null,
    progress_divergence: denominator
      ? {
          variance:
            indices.reduce((sum, n) => sum + (n - mean) ** 2, 0) / denominator,
          entropy_norm:
            questionIds.length > 1
              ? Math.max(0, entropy / Math.log(questionIds.length))
              : 0,
        }
      : null,
    quality: {
      availability: denominator ? "PARTIAL" : "NOT_COMPUTABLE",
      source_quality_status: "VALID",
      flags: ["SYNTHETIC_EVENTS", "COMPLETION_NOT_COMPUTABLE"],
      reason:
        "合成事件；无可信完成标记。分母为窗口结束前有题目访问记录的去重参与者。",
    },
  };
}
