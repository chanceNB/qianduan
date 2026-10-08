import * as demo from "./fixtures/demo";
import { feedbackSchema } from "../contracts";
import { generateDemoReport } from "../demo/reportEngine";
export function personalProjection(
  id: string,
  scenario: string,
  feedbackKey: string,
) {
  const student = demo.participants
    .slice(0, 3)
    .find((p) => p.participant_id === id);
  if (!student) return null;
  const events = demo.events
    .filter((e) => e.participant_id === id)
    .map((e) => ({ ...e, evidence_refs: [] }));
  const insufficient = scenario === "demo_insufficient_evidence";
  let feedback = null,
    storage_warning: string | null = null;
  try {
    const raw = localStorage.getItem(feedbackKey);
    if (raw) {
      const parsed = feedbackSchema.safeParse(JSON.parse(raw));
      if (parsed.success) feedback = parsed.data;
      else storage_warning = "审核记录无效，无法确认已采纳状态。";
    }
  } catch {
    storage_warning = "本地审核记录读取失败，无法确认已采纳状态。";
  }
  const report = generateDemoReport(
    {
      question_id: "Q05",
      key_node_id: "node_0003",
      evidence_ids: insufficient ? [] : [demo.evidenceId],
      task: "课堂复盘",
    },
    {
      sessionId: demo.session.session_id,
      evidence: demo.evidence,
      node: demo.keyNode(),
      events: demo.events,
      questionIds: demo.questions.map((q) => q.question_id),
    },
  );
  const valid = report.status === "READY";
  const adopted =
    valid &&
    feedback &&
    (feedback.action === "ACCEPT" || feedback.action === "EDIT_AND_ACCEPT");
  return {
    session: demo.session,
    ...student,
    data_nature: "DEMO / SYNTHETIC",
    is_research_evidence: false,
    results: demo.results.filter((r) => r.participant_id === id),
    events,
    evidence: insufficient
      ? null
      : {
          evidence_id: demo.evidenceId,
          participant_id: id,
          event_ids: demo.evidence.pen_evidence.event_refs.filter((ref) =>
            events.some((e) => e.event_id === ref),
          ),
          window: demo.window,
          quality: demo.evidence.quality,
          source: "SYNTHETIC",
          is_research_evidence: false,
        },
    review_status: !valid
      ? "INSUFFICIENT_EVIDENCE"
      : (feedback?.action ?? "UNREVIEWED"),
    focus: adopted
      ? feedback?.action === "EDIT_AND_ACCEPT"
        ? [feedback.edited_text!]
        : report.suggested_focus
      : [],
    focus_source: adopted
      ? feedback?.action === "EDIT_AND_ACCEPT"
        ? "TEACHER"
        : "TEACHER_APPROVED_TEMPLATE"
      : "NONE",
    storage_warning,
  };
}
export function researchProjection(scenario: string) {
  const card = (
    title: string,
    status: string,
    description: string,
    source: string,
  ) => ({ title, status, description, source });
  return {
    data_nature: "DEMO / SYNTHETIC",
    is_research_evidence: false,
    fusion_status: "Prototype / Not Validated",
    model_metrics: null,
    vision_artifacts: [],
    evidence_id:
      scenario === "demo_insufficient_evidence" ? null : demo.evidenceId,
    sections: [
      {
        id: "datasets",
        title: "Dataset",
        cards: [
          card(
            "课堂演示数据",
            "SYNTHETIC",
            "12 名匿名参与者、Q1～Q6；事件与结果为合成情境，不是科研数据集。",
            "src/mocks/fixtures/demo.ts",
          ),
          card(
            "真实研究数据与授权",
            "NOT_VALIDATED",
            "当前仓库没有可核验的真实数据清单、划分或授权材料；不展示真实视觉样例。",
            "仓库材料审计：未发现实验数据 manifest 或授权记录",
          ),
        ],
      },
      {
        id: "models",
        title: "Models",
        cards: [
          card(
            "R1 · Pen Process Extraction",
            "DEVELOPING",
            "已对齐作答事件接口与时间轴；没有可核验的真实点阵提取产物或模型评测。",
            "docs/contract-source.txt；src/contracts/",
          ),
          card(
            "R2 · Macro Vision Perception",
            "NOT_VALIDATED",
            "缺少真实推理产物、来源与授权条件。不提供视频、检测框或模型成绩。",
            "当前仓库未提供视觉推理文件",
          ),
          card(
            "Fusion",
            "NOT_VALIDATED",
            "Prototype / Not Validated；尚未验证多模态性能增益。",
            "bootstrap fusion=false；现有 Fusion 骨架",
          ),
        ],
      },
      {
        id: "experiments",
        title: "Experiments",
        cards: [
          card(
            "R3/R4 · Class State、Evidence、Agent Evaluation",
            "SOFTWARE_VERIFIED",
            "事件聚合、证据验证和教师审核可通过网站自动化测试核验；网站测试数量不是 R1/R2 模型准确率。",
            "src/mocks/calculations.ts；tests/showcase-report-engine.test.ts；tests/showcase-s3a-api.test.ts",
          ),
          card(
            "Q5 流程演示",
            "SYNTHETIC",
            "14:00–15:00：RETURN 4/12，修改候选 3/12；只表示合成数据的事件统计。",
            "S1 冻结事件；src/mocks/calculations.ts",
          ),
          card(
            "真实模型实验",
            "NOT_VALIDATED",
            "没有实际实验文件或日志支持的指标；准确率、召回率与性能增益均未填写。",
            "仓库材料审计：无模型实验日志",
          ),
        ],
      },
      {
        id: "failure-cases",
        title: "Failure Cases",
        cards: [
          card(
            "证据不足拒绝生成",
            "SOFTWARE_VERIFIED",
            "demo_insufficient_evidence 返回拒绝原因，不生成确定性判断或允许采纳。可到 AI 页面切换场景验证。",
            "src/demo/reportEngine.ts；tests/showcase-s3a-api.test.ts",
          ),
          card(
            "无真实坐标轨迹",
            "SYNTHETIC",
            "仅回放事件时间轴，明确显示暂无可回放笔迹。",
            "src/components/ReplayCanvas.tsx；tests/showcase-playback.test.tsx",
          ),
        ],
      },
      {
        id: "evidence-trace",
        title: "Evidence Trace",
        cards: [
          card(
            "Q5 证据链",
            "SYNTHETIC",
            "合成事件 → 派生班级统计 → Evidence → 模板建议 → 教师审核。无真实 Sensor Fact、stroke_ref 或配对 video_ref。",
            "ev_sess001_q05_0003；src/mocks/fixtures/demo.ts",
          ),
        ],
      },
    ],
  };
}
