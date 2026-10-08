import { useState, useRef, useEffect } from "react";
import { reviewDisplayState } from "../components/reviewPolicy";
import { teacherApi } from "../api/teacher";
import { useResource } from "../hooks/useResource";
import { useClassroomSelection } from "../hooks/useClassroomSelection";
import { SelectionFilters } from "../components/SelectionFilters";
import {
  PageTitle,
  Card,
  EmptyState,
  ErrorState,
  QualityBadge,
  MetricValue,
  DataFields,
  Badges,
} from "../components/ui";
import { EvidenceLinks } from "../components/EvidenceDrawer";
import type { Review } from "../contracts";
import { showcaseEnabled } from "../demo/showcase";
import { DemoAI } from "../components/showcase/DemoAI";
const templates = [
  "生成本节课堂复盘",
  "为什么当前关键节点值得关注？",
  "生成下一课关注项",
  "总结需要重点复盘的题目",
];
export function AI() {
  return showcaseEnabled ? <DemoAI /> : <StandardAI />;
}
function StandardAI() {
  const selection = useClassroomSelection();
  const [question, setQuestion] = useState("");
  const [node, setNode] = useState("");
  const [range, setRange] = useState("session");
  const [template, setTemplate] = useState(templates[0]);
  const [custom, setCustom] = useState("");
  const [result, setResult] = useState<{
    sessionId: string;
    review: Review;
  } | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [edited, setEdited] = useState("");
  const [message, setMessage] = useState("");
  const [feedbackBusy, setFeedbackBusy] = useState(false);
  const { sessionId } = selection;
  const operation = useRef(0);
  useEffect(
    () => () => {
      operation.current++;
    },
    [],
  );
  function resetWork() {
    operation.current++;
    setResult(null);
    setError(null);
    setLoading(false);
    setFeedbackBusy(false);
    setMessage("");
    setEdited("");
    setQuestion("");
    setNode("");
  }
  const nodes = useResource(
    () => (sessionId ? teacherApi.keyNodes(sessionId) : Promise.resolve(null)),
    [sessionId],
  );
  const current = result?.sessionId === sessionId ? result.review : null;
  async function generate() {
    if (!sessionId) return;
    const generation = ++operation.current;
    setError(null);
    setLoading(true);
    setResult(null);
    setMessage("");
    try {
      const id = sessionId;
      const review = await teacherApi.review(id, {
        question: custom.trim() || template,
        scope: {
          question_ids: range === "question" && question ? [question] : [],
          key_node_ids: range === "node" && node ? [node] : [],
        },
      });
      if (generation !== operation.current) return;
      setResult({ sessionId: id, review });
      setEdited(review.summary);
    } catch (e) {
      if (generation === operation.current) setError(e);
    } finally {
      if (generation === operation.current) setLoading(false);
    }
  }
  async function feedback(action: "ACCEPT" | "EDIT_AND_ACCEPT" | "REJECT") {
    if (!current || reviewDisplayState(current) !== "ready") return;
    const generation = ++operation.current;
    setFeedbackBusy(true);
    setMessage("");
    try {
      await teacherApi.feedback(current.review_id, {
        action,
        edited_text: action === "EDIT_AND_ACCEPT" ? edited : null,
        comment: null,
      });
      if (generation === operation.current) setMessage("教师反馈已提交");
    } catch (e) {
      if (generation === operation.current) setError(e);
    } finally {
      if (generation === operation.current) setFeedbackBusy(false);
    }
  }
  return (
    <>
      <PageTitle
        title="AI 复盘与备课"
        description="基于课堂 Evidence 生成可追溯的复盘与下一课关注项"
      />
      <div className="filter-row">
        <SelectionFilters
          selection={{
            ...selection,
            setClassId: (id) => {
              resetWork();
              selection.setClassId(id);
            },
            setSessionId: (id) => {
              resetWork();
              selection.setSessionId(id);
              setResult(null);
              setError(null);
              setQuestion("");
              setNode("");
            },
          }}
        />
        <label className="filter">
          <select
            aria-label="分析范围"
            value={range}
            onChange={(e) => setRange(e.target.value)}
          >
            <option value="session">分析范围 · 当前课堂</option>
            <option value="question">当前题目</option>
            <option value="node">关键节点</option>
          </select>
        </label>
        <label className="filter">
          <select
            aria-label="AI 选择题目"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          >
            <option value="">选择题目</option>
            {selection.overview.data?.question_distribution.map((q) => (
              <option key={q.question_id}>{q.question_id}</option>
            ))}
          </select>
        </label>
        <label className="filter">
          <select
            aria-label="关键节点"
            value={node}
            onChange={(e) => setNode(e.target.value)}
          >
            <option value="">关键节点</option>
            {nodes.data?.items.map((n) => (
              <option value={n.node_id} key={n.node_id}>
                {n.title}
              </option>
            ))}
          </select>
        </label>
      </div>
      {selection.classes.error ? (
        <ErrorState error={selection.classes.error} />
      ) : selection.sessions.error ? (
        <ErrorState error={selection.sessions.error} />
      ) : selection.overview.error ? (
        <ErrorState error={selection.overview.error} />
      ) : nodes.error ? (
        <ErrorState error={nodes.error} />
      ) : (
        <div className="ai-workspace split-panel">
          <Card title="复盘输入区">
            <p className="section-caption">选择课堂与分析范围，生成 AI 复盘</p>
            <div className="review-context">
              <DataFields
                data={{
                  当前课堂:
                    selection.overview.data?.session.lesson_title ?? null,
                  分析范围: sessionId
                    ? {
                        session: "当前课堂",
                        question: "当前题目",
                        node: "关键节点",
                      }[range]
                    : null,
                  题目: question || null,
                  关键节点: node || null,
                  可用Evidence:
                    selection.overview.data?.key_nodes.flatMap(
                      (n) => n.evidence_refs,
                    ) ?? null,
                  数据质量: selection.overview.data
                    ? "以当前数据质量为准"
                    : null,
                }}
              />
            </div>
            {selection.overview.data && (
              <Badges tags={selection.overview.data.authenticity} />
            )}
            <h3>任务模板</h3>
            <div className="task-templates">
              {templates.map((t) => (
                <label key={t}>
                  <input
                    type="radio"
                    name="template"
                    checked={template === t}
                    onChange={() => setTemplate(t)}
                  />
                  {t}
                </label>
              ))}
            </div>
            <h3>自定义问题（可选）</h3>
            <textarea
              aria-label="自定义问题"
              placeholder="基于当前 Evidence 输入问题…"
              maxLength={500}
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
            />
            <div className="character-count">{custom.length} / 500</div>
            {sessionId && (
              <button
                className="primary-button"
                onClick={generate}
                disabled={
                  loading ||
                  (range === "question" && !question) ||
                  (range === "node" && !node)
                }
              >
                {loading ? "正在生成…" : "生成复盘"}
              </button>
            )}
          </Card>
          <Card title="AI 复盘结果" className="ai-result">
            <p className="section-caption">
              AI 基于当前课堂的 Evidence 生成结构化复盘
            </p>
            {error ? (
              <ErrorState error={error} />
            ) : loading ? (
              <EmptyState
                title="正在生成结构化复盘"
                description="等待课堂 Evidence 分析结果"
              />
            ) : !current ? (
              <EmptyState
                title={sessionId ? "尚未生成复盘" : "尚未选择课堂"}
                description={
                  <>
                    选择一节课堂后，
                    <br />
                    AI 将基于可用课堂与对应的 Evidence
                    <br />
                    生成课堂复盘与下一课关注项。
                  </>
                }
                action={
                  <button
                    className="primary-button"
                    onClick={() =>
                      document
                        .querySelector<HTMLSelectElement>(
                          '[aria-label="选择班级"]',
                        )
                        ?.focus()
                    }
                  >
                    选择课堂
                  </button>
                }
              />
            ) : reviewDisplayState(current) === "pending" ? (
              <EmptyState
                title="复盘仍在生成中"
                description="等待后端返回 READY 结果后再进行教师复核。"
              />
            ) : reviewDisplayState(current) === "failed" ? (
              <EmptyState
                title="复盘生成失败"
                description={current.quality.reason ?? "请稍后重新生成。"}
              />
            ) : reviewDisplayState(current) === "insufficient" ? (
              <EmptyState
                title="证据不足"
                description="当前证据无法支持确定性结论，请补充可靠 Evidence。"
              />
            ) : (
              <>
                <h3>{current.summary}</h3>
                <QualityBadge quality={current.quality} />
                <DataFields
                  data={{
                    关注题目: current.concerned_questions,
                    知识点: current.knowledge_points,
                    相关匿名学生: current.affected_student_ids,
                    建议关注项: current.suggested_focus,
                    status: current.status,
                    需要教师复核: current.requires_teacher_review ? "是" : "否",
                  }}
                />
                <p>
                  模型检测置信：
                  <MetricValue
                    value={current.confidence}
                    availability={current.quality.availability}
                  />
                </p>
                <EvidenceLinks ids={current.evidence_ids} />
                <label className="edited-review">
                  修改后采用
                  <textarea
                    aria-label="修改复盘内容"
                    value={edited}
                    onChange={(e) => setEdited(e.target.value)}
                  />
                </label>
                <div className="feedback-actions">
                  <button
                    disabled={feedbackBusy}
                    onClick={() => feedback("ACCEPT")}
                  >
                    认同
                  </button>
                  <button
                    disabled={feedbackBusy || !edited.trim()}
                    onClick={() => feedback("EDIT_AND_ACCEPT")}
                  >
                    修改后采用
                  </button>
                  <button
                    disabled={feedbackBusy}
                    onClick={() => feedback("REJECT")}
                  >
                    驳回
                  </button>
                </div>
                {message && <p role="status">{message}</p>}
              </>
            )}
          </Card>
        </div>
      )}
    </>
  );
}
