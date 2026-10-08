import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useClassroomSelection } from "../../hooks/useClassroomSelection";
import { useResource } from "../../hooks/useResource";
import { teacherApi } from "../../api/teacher";
import { evidenceApi } from "../../api/evidence";
import { getDemoScenario, setDemoScenario } from "../../api/runtime";
import {
  demoReportApi,
  reportTasks,
  type DemoReportInput,
  type DemoReportEnvelope,
} from "../../demo/report";
import { SelectionFilters } from "../SelectionFilters";
import { EvidenceLinks } from "../EvidenceDrawer";
import {
  PageTitle,
  Card,
  Badges,
  ErrorState,
  EmptyState,
  QualityBadge,
} from "../ui";

export function DemoAI() {
  const selection = useClassroomSelection();
  const [params, setParams] = useSearchParams();
  const [scenario, setScenario] = useState(getDemoScenario);
  const [scenarioError, setScenarioError] = useState<unknown>(null);
  const question = params.get("question") ?? "Q05";
  const node = params.get("node") ?? "node_0003";
  const evidence =
    params.get("evidence") ??
    selection.overview.data?.key_nodes.find(
      (n) => n.node_id === node && n.question_ids.includes(question),
    )?.evidence_refs[0] ??
    "";
  const session = selection.sessionId;
  const returnPath = params.get("return");
  const fallback = `/classroom/${encodeURIComponent(session)}/overview?question=Q05`;
  const back =
    returnPath?.startsWith(`/classroom/${encodeURIComponent(session)}/`) &&
    /^\/classroom\/[^/]+\/(overview|class-state|key-nodes)\?/.test(returnPath)
      ? returnPath
      : returnPath &&
          /^\/demo\/(student\?|research\/(datasets|models|experiments|failure-cases|evidence-trace)\?)/.test(
            returnPath,
          )
        ? returnPath
        : fallback;
  function update(values: Record<string, string>) {
    const next = new URLSearchParams(params);
    Object.entries(values).forEach(([key, value]) =>
      value ? next.set(key, value) : next.delete(key),
    );
    setParams(next);
  }
  return (
    <>
      <PageTitle
        title="AI 复盘与备课"
        description="Q5 关键节点 → Evidence → 课堂复盘 → 教师审核"
      />
      <div className="demo-ai-mode">
        <strong>Evidence 驱动模板 · Demo</strong>
        <span>
          本地模板生成，不调用实时 LLM；DEMO / SYNTHETIC，不用于科研结论。
        </span>
      </div>
      <div className="filter-row">
        <SelectionFilters
          selection={{
            ...selection,
            setClassId: (id) => {
              selection.setClassId(id);
              update({
                session: "",
                question: "Q05",
                node: "node_0003",
                evidence: "",
                return: "",
              });
            },
            setSessionId: (id) => {
              const value =
                typeof id === "function" ? id(selection.sessionId) : id;
              selection.setSessionId(value);
              update({
                session: value,
                question: "Q05",
                node: "node_0003",
                evidence: "",
                return: "",
              });
            },
          }}
        />
        {session && (
          <Link className="soft-button" to={back}>
            {back.startsWith("/demo/") ? "返回演示流程" : "返回课堂"}
          </Link>
        )}
        {session && (
          <>
            <Link
              className="soft-button"
              to={`/demo/student?${new URLSearchParams({ session, student: new URL(back, "http://demo.local").searchParams.get("student") ?? "anon_p017", question: "Q05", return: back })}`}
            >
              演示学生反馈
            </Link>
            <Link
              className="soft-button"
              to={`/demo/research/datasets?${new URLSearchParams({ session, return: back })}`}
            >
              Research Lab
            </Link>
          </>
        )}
        <button
          className="soft-button"
          onClick={() => {
            try {
              const next =
                scenario === "demo_insufficient_evidence"
                  ? "demo_happy_path"
                  : "demo_insufficient_evidence";
              setDemoScenario(next);
              setScenario(next);
              setScenarioError(null);
            } catch (e) {
              setScenarioError(e);
            }
          }}
        >
          {scenario === "demo_insufficient_evidence"
            ? "恢复正常证据"
            : "演示证据不足"}
        </button>
      </div>
      {scenarioError && <ErrorState error={scenarioError} />}
      {selection.overview.data && (
        <Badges tags={selection.overview.data.authenticity} />
      )}
      {selection.classes.error ||
      selection.sessions.error ||
      selection.overview.error ? (
        <ErrorState
          error={
            selection.classes.error ??
            selection.sessions.error ??
            selection.overview.error
          }
        />
      ) : !session ? (
        <EmptyState title="尚未选择课堂" />
      ) : (
        <DemoReportWorkspace
          key={`${session}:${question}:${node}:${evidence}:${scenario}`}
          session={session}
          question={question}
          node={node}
          evidence={evidence}
          title={selection.overview.data?.session.lesson_title ?? "加载课堂…"}
          questions={
            selection.overview.data?.question_distribution.map(
              (q) => q.question_id,
            ) ?? []
          }
          changeQuestion={(q) =>
            update({
              question: q,
              evidence:
                q === "Q05"
                  ? (selection.overview.data?.key_nodes[0]?.evidence_refs[0] ??
                    "")
                  : "",
            })
          }
        />
      )}
    </>
  );
}
function DemoReportWorkspace({
  session,
  question,
  node,
  evidence,
  title,
  questions,
  changeQuestion,
}: {
  session: string;
  question: string;
  node: string;
  evidence: string;
  title: string;
  questions: string[];
  changeQuestion: (q: string) => void;
}) {
  const evidenceResource = useResource(
    () => (evidence ? evidenceApi.get(evidence) : Promise.resolve(null)),
    [evidence],
  );
  const [selected, setSelected] = useState(true);
  const [task, setTask] = useState<DemoReportInput["task"]>("课堂复盘");
  const input: DemoReportInput = {
    question_id: question,
    key_node_id: node,
    evidence_ids: selected && evidence ? [evidence] : [],
    task,
  };
  const restored = useResource(
    () =>
      demoReportApi.restore(session, {
        question_id: question,
        key_node_id: node,
        evidence_ids: evidence ? [evidence] : [],
        task: "课堂复盘",
      }),
    [session, question, node, evidence],
  );
  const [result, setResult] = useState<DemoReportEnvelope | null>(null);
  const current = result ?? restored.data;
  const report = current?.report;
  const [edited, setEdited] = useState<string | null>(null);
  const editText =
    edited ?? current?.feedback?.edited_text ?? report?.summary ?? "";
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  async function generate() {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const r = await demoReportApi.generate(session, input);
      if (alive.current) {
        setResult(r);
        setEdited(null);
      }
    } catch (e) {
      if (alive.current) setError(e);
    } finally {
      if (alive.current) setBusy(false);
    }
  }
  async function feedback(action: "ACCEPT" | "EDIT_AND_ACCEPT" | "REJECT") {
    if (!report || report.status !== "READY") return;
    setBusy(true);
    setError(null);
    const value = {
      action,
      edited_text: action === "EDIT_AND_ACCEPT" ? editText : null,
      comment: null,
    };
    try {
      await teacherApi.feedback(report.review_id, value);
      if (alive.current)
        setResult({ report, feedback: value, storage_warning: null });
    } catch (e) {
      if (alive.current) setError(e);
    } finally {
      if (alive.current) setBusy(false);
    }
  }
  return (
    <div className="demo-ai-workspace">
      <Card title="复盘输入区">
        <p className="showcase-eyebrow">课堂与 Evidence 上下文</p>
        <h3>{title}</h3>
        <label className="demo-ai-field">
          关注题目
          <select
            aria-label="AI 选择题目"
            disabled={busy}
            value={question}
            onChange={(e) => changeQuestion(e.target.value)}
          >
            {questions.map((q) => (
              <option key={q}>{q}</option>
            ))}
          </select>
        </label>
        <p>
          关键节点：<code>{node}</code>
        </p>
        <h3>可用 Evidence</h3>
        {evidenceResource.loading ? (
          <p>正在验证 Evidence…</p>
        ) : evidenceResource.error || !evidenceResource.data ? (
          <p role="status">Evidence 暂不可用；当前输入不能支持教学判断。</p>
        ) : (
          <>
            <label className="demo-evidence-choice">
              <input
                type="checkbox"
                aria-label="选择复盘证据"
                disabled={busy}
                checked={selected}
                onChange={(e) => {
                  setSelected(e.target.checked);
                  setResult({
                    report: null,
                    feedback: null,
                    storage_warning: null,
                  });
                }}
              />
              {evidenceResource.data.evidence_id}
            </label>
            <EvidenceLinks ids={[evidenceResource.data.evidence_id]} />
            <QualityBadge quality={evidenceResource.data.quality} />
            <Badges tags={evidenceResource.data.authenticity} />
          </>
        )}
        <h3>任务选择</h3>
        <div className="task-templates">
          {reportTasks.map((t) => (
            <label key={t}>
              <input
                type="radio"
                name="demo-task"
                disabled={busy}
                checked={task === t}
                onChange={() => setTask(t)}
              />
              {t}
            </label>
          ))}
        </div>
        <p className="showcase-muted">
          三项任务共用同一份 Evidence
          报告；所选任务决定阅读重点，不改变事实或审核版本。
        </p>
        <button
          className="primary-button"
          disabled={busy || restored.loading || evidenceResource.loading}
          onClick={generate}
        >
          {busy ? "处理中…" : "生成复盘"}
        </button>
        <p className="showcase-muted">
          复盘只描述可观察事件。下一课关注项是教学建议，必须由教师审核。
        </p>
      </Card>
      <Card title="课堂复盘与教师审核" className="demo-report-card">
        {error != null && <ErrorState error={error} />}
        {restored.error != null && <ErrorState error={restored.error} />}
        {current?.storage_warning && (
          <p role="alert">{current.storage_warning}</p>
        )}
        {!report ? (
          <EmptyState
            title={busy ? "正在生成模板报告" : "尚未生成复盘"}
            description="选择 Evidence 后生成；已有教师审核会从本地恢复。"
          />
        ) : (
          <section aria-label="Demo 课堂复盘">
            <p className="showcase-eyebrow">当前阅读重点：{task}</p>
            <p className="showcase-eyebrow">
              DEMO / SYNTHETIC · {report.status} ·{" "}
              {report.status === "INSUFFICIENT_EVIDENCE"
                ? "证据不足 · 已拒绝生成"
                : "必须人工审核"}
            </p>
            <h3 className={task === "课堂复盘" ? "demo-task-focus" : ""}>
              本节课堂可观察事实
            </h3>
            <p aria-label="原始模板报告" className="demo-report-summary">
              {report.summary}
            </p>
            {report.status === "INSUFFICIENT_EVIDENCE" ? (
              <>
                <p role="alert">{report.quality.reason}</p>
                <p>
                  无有效证据引用；本报告不可采纳。可恢复正常证据后重新生成。
                </p>
              </>
            ) : (
              <>
                <p>关注题目：{report.concerned_questions.join("、")}</p>
                <p>
                  已知关联知识点：{report.knowledge_points.join("、") || "缺失"}
                </p>
                <h3
                  className={task === "关键节点说明" ? "demo-task-focus" : ""}
                >
                  证据引用
                </h3>
                <EvidenceLinks ids={report.evidence_ids} />
                <QualityBadge quality={report.quality} />
                <h3
                  className={task === "下一课关注项" ? "demo-task-focus" : ""}
                >
                  下一课建议关注项
                </h3>
                {report.suggested_focus.map((f) => (
                  <p key={f}>{f}</p>
                ))}
                <div className="demo-review-state">
                  <strong>
                    {!current?.feedback
                      ? "待教师审核 · 未采纳"
                      : current.feedback.action === "REJECT"
                        ? "已驳回 · 未采纳"
                        : current.feedback.action === "EDIT_AND_ACCEPT"
                          ? "已采纳 · 教师修改"
                          : "已采纳 · 原始模板"}
                  </strong>
                  {current?.feedback &&
                    current.feedback.action !== "REJECT" && (
                      <>
                        <p>
                          来源：
                          {current.feedback.action === "EDIT_AND_ACCEPT"
                            ? "教师编辑文本"
                            : "Evidence 驱动模板，经教师认可"}
                        </p>
                        <p aria-label="教师采用文本">
                          {current.feedback.action === "EDIT_AND_ACCEPT"
                            ? current.feedback.edited_text
                            : report.summary}
                        </p>
                      </>
                    )}
                </div>
                <label className="edited-review">
                  教师修改文本（与原始模板分开保存）
                  <textarea
                    aria-label="修改复盘内容"
                    value={editText}
                    placeholder={
                      current?.feedback?.edited_text ?? report.summary
                    }
                    onChange={(e) => setEdited(e.target.value)}
                  />
                </label>
                <div className="feedback-actions">
                  <button disabled={busy} onClick={() => feedback("ACCEPT")}>
                    认可
                  </button>
                  <button
                    disabled={busy || !editText.trim()}
                    onClick={() => feedback("EDIT_AND_ACCEPT")}
                  >
                    修改后采用
                  </button>
                  <button disabled={busy} onClick={() => feedback("REJECT")}>
                    驳回
                  </button>
                </div>
              </>
            )}
          </section>
        )}
      </Card>
    </div>
  );
}
