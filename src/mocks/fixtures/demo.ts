import type { Quality, Authenticity } from "../../contracts";
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
    note: "用于前端完整流程演示",
  },
];
export const session = {
  session_id: "demo_session_001",
  class_id: "class_3a",
  course_name: "数学",
  lesson_title: "分数应用题随堂练习",
  started_at_ms: 0,
  duration_ms: 2400000,
  participant_count: 40,
  authenticity: demoTags,
};
export const evidenceId = "ev_sess001_q05_0003";
export const node = {
  node_id: "node_0003",
  session_id: session.session_id,
  start_time_ms: 840000,
  end_time_ms: 900000,
  title: "Q5 返回行为集中出现",
  description: "该窗口内 8/40 名有效参与者发生 RETURN。",
  question_ids: ["Q05"],
  affected_participant_count: 8,
  tags: ["RETURN_CLUSTER"],
  evidence_refs: [evidenceId],
  quality,
};
export const process = {
  participant_id: "anon_p017",
  session_id: session.session_id,
  event_timeline: [
    {
      event_id: "evt_01",
      event_type: "QUESTION_VISIT",
      question_id: "Q05",
      start_time_ms: 510000,
      end_time_ms: 510000,
      evidence_refs: [evidenceId],
    },
    {
      event_id: "evt_02",
      event_type: "RETURN",
      question_id: "Q05",
      start_time_ms: 690000,
      end_time_ms: 690000,
      evidence_refs: [evidenceId],
    },
  ],
  question_summaries: [
    {
      question_id: "Q05",
      visit_count: 2,
      return_count: 1,
      revision_candidate_count: 1,
    },
  ],
  quality,
};
export const replay = {
  coordinate_system: "PAGE_NORM_TOP_LEFT",
  page_id: "page_01",
  strokes: [
    {
      stroke_id: "stroke_000087",
      start_time_ms: 18320,
      end_time_ms: 18740,
      points: [
        { x: 0.4931, y: 0.1445, t_ms: 18320 },
        { x: 0.497, y: 0.146, t_ms: 18342 },
      ],
      question_id: "Q05",
    },
  ],
  events: ["evt_02"],
  quality,
};
export const evidence = {
  evidence_id: evidenceId,
  session_id: session.session_id,
  task_segment_id: "seg_practice_01",
  question_id: "Q05",
  knowledge_point: "分数应用题",
  student_set: ["anon_p017"],
  pen_evidence: { event_refs: ["evt_02"], stroke_refs: ["stroke_000087"] },
  video_evidence: {
    frame_refs: ["frame_000120"],
    window_refs: ["window_000007"],
  },
  result_evidence: null,
  quality: {
    ...quality,
    availability: "PARTIAL",
    flags: ["VIDEO_OPEN_DATA_CONTEXT"],
    reason: "Not a real paired classroom",
  },
  provenance: {
    pen_algorithm_version: "r1-event-rule-v0.2.2",
    vision_model_version: "vision-tcn-cstudentact-v0.1",
  },
  claim_level: "L2_DERIVED_PATTERN",
  authenticity: demoTags,
};
export const trace = {
  evidence_id: evidenceId,
  chain: [
    {
      level: "Sensor Fact",
      reference: "stroke_000087",
      description: "标准点阵轨迹",
    },
    {
      level: "Observable Event",
      reference: "evt_02",
      description: "离开题目后再次进入",
    },
    {
      level: "Derived Pattern",
      reference: "node_0003",
      description: "RETURN 集中出现",
    },
    {
      level: "Evidence Package",
      reference: evidenceId,
      description: "结构化证据包",
    },
    {
      level: "Teaching Hypothesis",
      reference: "review_0001",
      description: "等待教师复核",
    },
  ],
  versions: { api: "0.1", pen: "r1-event-rule-v0.2.2" },
  source: "DEMO CLASS SCENARIO",
  quality,
  manifest_ref: null,
  run_ref: null,
};
export const review = {
  review_id: "review_0001",
  summary: "Q5 在练习中段出现集中 RETURN，建议教师复盘该题的关键步骤。",
  concerned_questions: ["Q05"],
  knowledge_points: ["分数应用题"],
  affected_student_ids: ["anon_p017"],
  evidence_ids: [evidenceId],
  suggested_focus: ["核对题意到列式的关键步骤"],
  confidence: 0.82,
  requires_teacher_review: true,
  status: "READY",
  quality,
};
