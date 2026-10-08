import type { Quality, Authenticity, Replay } from "../../contracts";
import {
  calculateClassState,
  summarizeQuestions,
  type DemoEvent,
} from "../calculations";
export const quality: Quality = {
  availability: "AVAILABLE",
  source_quality_status: "VALID",
  flags: [],
  reason: null,
};
export const demoTags: Authenticity[] = [
  {
    data_nature: "DEMO",
    label: "DEMO CLASS SCENARIO",
    is_research_evidence: false,
    note: "用于挑战杯流程演示，不是科研结果",
  },
  {
    data_nature: "SYNTHETIC",
    label: "SYNTHETIC",
    is_research_evidence: false,
    note: "事件和答案为合成情境，无真实笔迹或配对视频",
  },
];
export const participants = Array.from({ length: 12 }, (_, i) => ({
  participant_id: `anon_p${String(17 + i).padStart(3, "0")}`,
  display_name: i < 3 ? `学生 ${["A", "B", "C"][i]}` : `学生 ${i + 1}`,
}));
export const questions = Array.from({ length: 6 }, (_, i) => ({
  question_id: `Q0${i + 1}`,
  knowledge_point: "分数应用题",
}));
export const session = {
  session_id: "demo_session_001",
  class_id: "class_3a",
  course_name: "数学",
  lesson_title: "分数应用题随堂练习",
  started_at_ms: Date.parse("2026-10-08T09:00:00+08:00"),
  duration_ms: 2400000,
  participant_count: participants.length,
  authenticity: demoTags,
};
export const evidenceId = "ev_sess001_q05_0003";
export const window = { start_ms: 840000, end_ms: 900000 };
// Times are relative to lesson start; statistics use the half-open Q5 window.
export const events: DemoEvent[] = participants.flatMap((p, i) => {
  const timeline: DemoEvent[] = [];
  const add = (question: string, type: string, time: number) =>
    timeline.push({
      participant_id: p.participant_id,
      event_id: `${p.participant_id}_${question}_${type}_${timeline.length}`,
      event_type: type,
      question_id: question,
      start_time_ms: time,
      end_time_ms: time,
      evidence_refs: question === "Q05" ? [evidenceId] : [],
    });
  for (let q = 1; q <= 4; q++) {
    add(`Q0${q}`, "QUESTION_VISIT", q * 110000 + i * 1000);
    add(`Q0${q}`, "ANSWER_SUBMIT", q * 110000 + 50000 + i * 1000);
  }
  // A is correct/direct, B correct/returning, C incorrect/returning and revising.
  add("Q05", "QUESTION_VISIT", 600000 + i * 1000);
  if (i >= 1 && i <= 4) {
    add("Q04", "QUESTION_VISIT", 820000 + i * 1000);
    add("Q05", "RETURN", 850000 + i * 1000);
    if (i === 1) {
      add("Q04", "QUESTION_VISIT", 860000);
      add("Q05", "RETURN", 870000);
    }
  }
  if (i >= 2 && i <= 4) add("Q05", "REVISION_CANDIDATE", 880000 + i * 1000);
  if (i === 8 || i === 9) add("Q04", "QUESTION_VISIT", 890000 + i * 100);
  if (i >= 10) add("Q06", "QUESTION_VISIT", 890000 + i * 100);
  if (i >= 8) add("Q05", "RETURN", 950000 + i * 1000);
  add("Q05", "ANSWER_SUBMIT", 1000000 + i * 1000);
  if (i < 10) add("Q06", "QUESTION_VISIT", 1100000 + i * 1000);
  else add("Q06", "RETURN", 1100000 + i * 1000);
  add("Q06", "ANSWER_SUBMIT", 1200000 + i * 1000);
  return timeline;
});
export const results = participants.flatMap((p, i) =>
  questions.map((q) => ({
    participant_id: p.participant_id,
    question_id: q.question_id,
    answer: q.question_id === "Q05" && [2, 4, 8].includes(i) ? "3/8" : "1/4",
    correct: !(q.question_id === "Q05" && [2, 4, 8].includes(i)),
    source: "SYNTHETIC",
    is_research_evidence: false,
  })),
);
export const processes = participants.map((p) => ({
  participant_id: p.participant_id,
  session_id: session.session_id,
  event_timeline: events
    .filter((e) => e.participant_id === p.participant_id)
    .sort((a, b) => a.start_time_ms - b.start_time_ms)
    .map((e) => ({
      event_id: e.event_id,
      event_type: e.event_type,
      question_id: e.question_id,
      start_time_ms: e.start_time_ms,
      end_time_ms: e.end_time_ms,
      evidence_refs: e.evidence_refs,
    })),
  question_summaries: summarizeQuestions(
    events.filter((e) => e.participant_id === p.participant_id),
    questions.map((q) => q.question_id),
  ),
  quality,
}));
export const process = processes[0];
export function replayFor(participantId: string): Replay {
  return {
    coordinate_system: "PAGE_NORM_TOP_LEFT",
    page_id: "page_01",
    strokes: [],
    events:
      processes
        .find((p) => p.participant_id === participantId)
        ?.event_timeline.map((e) => e.event_id) ?? [],
    quality: {
      ...quality,
      availability: "UNAVAILABLE",
      flags: ["NO_REAL_PEN_TRAJECTORY"],
      reason: "无实际点阵轨迹；请查看合成事件时间轴",
    },
  };
}
export const replay = replayFor(process.participant_id);
export const classState = () =>
  calculateClassState(
    events,
    questions.map((q) => q.question_id),
    window,
  );
export function keyNode() {
  const state = classState();
  const affected = Math.round(
    (state.return_ratio.Q05 ?? 0) * (state.valid_participant_count ?? 0),
  );
  return {
    node_id: "node_0003",
    session_id: session.session_id,
    start_time_ms: window.start_ms,
    end_time_ms: window.end_ms,
    title: "Q5 返回行为集中出现",
    description: `该窗口内 ${affected}/${state.valid_participant_count} 名有效参与者发生 RETURN（合成演示）。`,
    question_ids: ["Q05"],
    affected_participant_count: affected,
    tags: ["RETURN_CLUSTER"],
    evidence_refs: [evidenceId],
    quality,
  };
}
export const node = keyNode();
export const evidence = {
  evidence_id: evidenceId,
  session_id: session.session_id,
  task_segment_id: "seg_practice_01",
  question_id: "Q05",
  knowledge_point: "分数应用题",
  student_set: participants.map((p) => p.participant_id),
  pen_evidence: {
    event_refs: events
      .filter((e) => e.question_id === "Q05")
      .map((e) => e.event_id),
    stroke_refs: [],
  },
  video_evidence: null,
  result_evidence: results.filter((r) => r.question_id === "Q05"),
  quality: {
    ...quality,
    availability: "PARTIAL",
    flags: ["SYNTHETIC_EVENTS", "NO_REAL_PEN_TRAJECTORY", "NO_PAIRED_VIDEO"],
    reason: "仅合成事件与答案支持演示观察；不代表真实课堂或融合模型结果",
  },
  provenance: {
    event_generator_version: "showcase-events-v0.1",
    pen_algorithm_version: null,
    vision_model_version: null,
  },
  claim_level: "L2_DERIVED_PATTERN",
  authenticity: demoTags,
};
export const trace = {
  evidence_id: evidenceId,
  chain: [
    {
      level: "Sensor Fact",
      reference: null,
      description: "无真实传感器事实；使用 SYNTHETIC 事件情境",
    },
    {
      level: "Observable Event",
      reference: events.find((e) => e.event_type === "RETURN")!.event_id,
      description: "离开题目后再次进入",
    },
    {
      level: "Derived Pattern",
      reference: node.node_id,
      description: node.description,
    },
    {
      level: "Evidence Package",
      reference: evidenceId,
      description: "合成事件与答案证据包",
    },
    {
      level: "Teaching Hypothesis",
      reference: "review_0001",
      description: "演示建议，等待教师复核",
    },
  ],
  versions: { api: "0.1", generator: "showcase-events-v0.1" },
  source: "DEMO / SYNTHETIC",
  quality: evidence.quality,
  manifest_ref: null,
  run_ref: null,
};
export const review = {
  review_id: "review_0001",
  summary: `合成演示中，${node.description} [${evidenceId}] 建议教师核对 Q5 题意到列式的步骤；返回与修改候选事件不能证明困难原因。`,
  concerned_questions: ["Q05"],
  knowledge_points: ["分数应用题"],
  affected_student_ids: [
    ...new Set(
      events
        .filter(
          (e) =>
            e.question_id === "Q05" &&
            e.event_type === "RETURN" &&
            e.start_time_ms >= window.start_ms &&
            e.start_time_ms < window.end_ms,
        )
        .map((e) => e.participant_id),
    ),
  ],
  evidence_ids: [evidenceId],
  suggested_focus: ["对照答案和过程，并由教师核查关键步骤"],
  confidence: null,
  requires_teacher_review: true,
  status: "READY",
  quality: evidence.quality,
};
