// Imported by the Mock transport only. Business pages never import fixtures/events.
import { evidenceSchema, nodeSchema } from "../contracts";
import { calculateClassState, type DemoEvent } from "../mocks/calculations";
import {
  demoReportSchema,
  type DemoReportInput,
  type DemoReport,
} from "./reportContract";
export function generateDemoReport(
  input: DemoReportInput,
  source: {
    sessionId: string;
    evidence: unknown;
    node: unknown;
    events: DemoEvent[];
    questionIds: string[];
  },
): DemoReport {
  const common = {
    review_id: "review_0001",
    confidence: null,
    requires_teacher_review: true,
    engine: "EVIDENCE_TEMPLATE_DEMO",
    data_nature: "SYNTHETIC",
    is_research_evidence: false,
    affected_student_ids: [],
  };
  const refuse = (reason: string) =>
    demoReportSchema.parse({
      ...common,
      summary: "证据不足，拒绝生成教学判断",
      concerned_questions: [],
      knowledge_points: [],
      evidence_ids: [],
      suggested_focus: [],
      status: "INSUFFICIENT_EVIDENCE",
      quality: {
        availability: "UNAVAILABLE",
        source_quality_status: "INVALID",
        flags: ["INSUFFICIENT_EVIDENCE"],
        reason,
      },
    });
  const parsed = evidenceSchema.safeParse(source.evidence);
  const nodeResult = nodeSchema.safeParse(source.node);
  if (!parsed.success || !nodeResult.success)
    return refuse("Evidence 不可用或数据结构未通过验证。");
  const evidence = parsed.data,
    node = nodeResult.data;
  if (
    input.question_id !== "Q05" ||
    node.session_id !== source.sessionId ||
    input.key_node_id !== node.node_id ||
    !node.question_ids.includes(input.question_id) ||
    evidence.session_id !== source.sessionId ||
    evidence.question_id !== input.question_id ||
    input.evidence_ids.length !== 1 ||
    input.evidence_ids[0] !== evidence.evidence_id ||
    !node.evidence_refs.includes(evidence.evidence_id)
  )
    return refuse(
      "所选课堂、题目、节点与 Evidence 不匹配，或未选择有效 Evidence。",
    );
  if (
    !["AVAILABLE", "PARTIAL"].includes(evidence.quality.availability) ||
    evidence.quality.source_quality_status !== "VALID" ||
    !["DEMO", "SYNTHETIC"].every((n) =>
      evidence.authenticity.some((t) => t.data_nature === n),
    ) ||
    evidence.authenticity.some((t) => t.is_research_evidence)
  )
    return refuse("Evidence 质量或 Synthetic 来源标签不支持此 Demo 模板。");
  const refs = evidence.pen_evidence?.event_refs ?? [];
  const qEvents = source.events.filter(
    (e) => e.question_id === input.question_id,
  );
  if (
    !refs.length ||
    new Set(refs).size !== refs.length ||
    refs.some((id) => !qEvents.some((e) => e.event_id === id)) ||
    qEvents.some((e) => !refs.includes(e.event_id)) ||
    source.events.some((e) => !Number.isFinite(e.start_time_ms)) ||
    node.start_time_ms !== 840000 ||
    node.end_time_ms !== 900000
  )
    return refuse("Q5 事件引用不完整、无效或观察窗口不匹配。");
  const state = calculateClassState(source.events, source.questionIds, {
    start_ms: node.start_time_ms,
    end_ms: node.end_time_ms,
  });
  const denominator = state.valid_participant_count;
  const returns = state.return_ratio[input.question_id],
    revisions = state.revision_candidate_ratio[input.question_id];
  if (
    !denominator ||
    returns == null ||
    revisions == null ||
    !source.questionIds.includes(input.question_id)
  )
    return refuse("缺少有效参与人数或可计算的事件统计。");
  return demoReportSchema.parse({
    ...common,
    summary: `Synthetic 合成演示统计：14:00–15:00 观察窗口内，${denominator} 名有效参与者中有 ${Math.round(returns * denominator)} 名出现 RETURN，${Math.round(revisions * denominator)} 名出现 REVISION_CANDIDATE。按参与者去重，分母为窗口终点前有题目访问记录的参与者；不是实际课堂研究发现。返回与修改候选不能确定错误原因，修改候选不代表已确认修改。`,
    concerned_questions: [input.question_id],
    knowledge_points: evidence.knowledge_point
      ? [evidence.knowledge_point]
      : [],
    evidence_ids: [evidence.evidence_id],
    suggested_focus: [
      "教学建议（非事实判断）：建议教师核对 Q5 关键解题步骤，对照答案与作答事件后决定下一课关注项。",
    ],
    status: "READY",
    quality: evidence.quality,
  });
}
