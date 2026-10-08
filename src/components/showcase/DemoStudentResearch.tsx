import { useEffect, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { personalApi, researchShowcaseApi } from "../../demo/studentResearch";
import type { Personal } from "../../demo/studentResearchContract";
import { showcaseEnabled } from "../../demo/showcase";
import { getDemoScenario } from "../../api/runtime";
import { useResource } from "../../hooks/useResource";
import { Card, ErrorState, Skeleton, formatMs } from "../ui";
import { EventTimeline } from "./EventTimeline";
import { EvidenceLinks } from "../EvidenceDrawer";
import { ApiError } from "../../api/client";
const fallback =
  "/classroom/demo_session_001/overview?question=Q05&student=anon_p017";
function useDemoContext() {
  const [params, setParams] = useSearchParams();
  const session = params.get("session") ?? "demo_session_001";
  const back = params.get("return");
  const returnUrl =
    back && /^\/(classroom|ai|demo)\//.test(back) && !back.startsWith("//")
      ? back
      : back?.startsWith("/ai?")
        ? back
        : fallback;
  return { params, setParams, session, returnUrl };
}
export function DemoStudent() {
  const context = useDemoContext();
  if (!showcaseEnabled)
    return (
      <ErrorState
        error={new ApiError("NOT_FOUND", "仅在 Mock Demo 中提供", 404, "demo")}
      />
    );
  return (
    <StudentWorkspace
      key={`${context.session}:${getDemoScenario()}`}
      {...context}
    />
  );
}
function StudentWorkspace({
  params,
  setParams,
  session,
  returnUrl,
}: ReturnType<typeof useDemoContext>) {
  const id = params.get("student") ?? "anon_p017";
  const question = params.get("question") ?? "Q05";
  const resource = useResource(
    () => personalApi.get(session, id),
    [session, id, getDemoScenario()],
  );
  const [evidence, setEvidence] = useState(false);
  useEffect(() => setEvidence(false), [id, question]);
  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    next.set(key, value);
    setParams(next);
  };
  if (resource.loading) return <Skeleton />;
  if (resource.error || !resource.data)
    return <ErrorState error={resource.error} />;
  const p = resource.data;
  const q5 = p.results.find((r) => r.question_id === "Q05")!;
  const q5Events = p.events.filter((e) => e.question_id === "Q05");
  const events = p.events.filter((e) => e.question_id === question);
  return (
    <div className="showcase-workspace demo-personal">
      <header>
        <p className="showcase-eyebrow">
          DEMO / SYNTHETIC · 教师授权的演示学生视角
        </p>
        <h1>我的课堂 · {p.display_name}</h1>
        <p>
          这是比赛演示视角切换，不代表生产学生登录或安全鉴权。合成数据不是科研结果。
        </p>
        <nav className="demo-flow-links">
          <Link to={returnUrl}>返回教师演示</Link>
          <Link
            to={`/demo/research/datasets?${new URLSearchParams({ session, return: window.location.pathname + window.location.search })}`}
          >
            Research Lab
          </Link>
          <Link
            to={`/ai?${new URLSearchParams({ session, question: "Q05", node: "node_0003", evidence: "ev_sess001_q05_0003", return: window.location.pathname + window.location.search })}`}
          >
            教师审核工作区
          </Link>
        </nav>
      </header>
      <Card title="我的课堂">
        <p>
          {p.session.lesson_title} · {p.results.length} 道题目 ·{" "}
          {p.participant_id}
        </p>
        <label>
          演示学生{" "}
          <select
            aria-label="演示学生"
            value={id}
            onChange={(e) => update("student", e.target.value)}
          >
            {["anon_p017", "anon_p018", "anon_p019"].map((id, i) => (
              <option key={id} value={id}>
                学生 {["A", "B", "C"][i]} / {id}
              </option>
            ))}
          </select>
        </label>
        <h2>
          个人 Q5：{q5.correct ? "正确" : "错误"} · RETURN{" "}
          {q5Events.filter((e) => e.event_type === "RETURN").length} 次 ·
          修改候选{" "}
          {q5Events.filter((e) => e.event_type === "REVISION_CANDIDATE").length}{" "}
          次
        </h2>
      </Card>
      <Card title="我的题目">
        <div className="demo-question-grid">
          {p.results.map((r) => (
            <button
              className={r.question_id === question ? "selected" : ""}
              aria-pressed={r.question_id === question}
              key={r.question_id}
              onClick={() => update("question", r.question_id)}
            >
              {r.question_id.replace("Q0", "Q")} · {r.correct ? "正确" : "错误"}
            </button>
          ))}
        </div>
        <p>结果来源：SYNTHETIC 合成答案记录，非真实传感器事件。</p>
      </Card>
      <div className="demo-personal-grid">
        <section aria-label="我的过程">
          <Card title="我的过程">
            <p>暂无可回放笔迹</p>
            <EventTimeline key={`${id}:${question}`} events={events} />
          </Card>
        </section>
        <section>
          <Card title="我的学习反馈">
            <p>
              客观过程回顾：{question.replace("Q0", "Q")} 共 {events.length}{" "}
              条实际记录，RETURN{" "}
              {events.filter((e) => e.event_type === "RETURN").length}{" "}
              次，修改候选{" "}
              {
                events.filter((e) => e.event_type === "REVISION_CANDIDATE")
                  .length
              }{" "}
              次。次数不解释原因，也不评判能力或心理状态。
            </p>
            {p.storage_warning && <p role="alert">{p.storage_warning}</p>}
            <h3>全班 Q5 教学关注项</h3>
            <p>全班备课建议不等价于个人诊断。</p>
            {p.review_status === "INSUFFICIENT_EVIDENCE" ? (
              <p>证据不足 · 已拒绝生成</p>
            ) : p.review_status === "REJECT" ? (
              <p>已驳回 · 不展示被驳回的建议</p>
            ) : p.review_status === "UNREVIEWED" ? (
              <p>尚未审核 · 仅展示个人过程事实</p>
            ) : (
              <>
                <p>
                  {p.focus_source === "TEACHER"
                    ? "来源：教师修改并采纳"
                    : "来源：模板经教师认可"}
                </p>
                {p.focus.map((f) => (
                  <p key={f}>{f}</p>
                ))}
              </>
            )}
            <button className="soft-button" onClick={resource.reload}>
              刷新教师审核结果
            </button>
          </Card>
          <Card title="我的 Evidence">
            <p>
              仅展示 {p.participant_id} 的 Q5 事件投影；不返回班级 student_set
              或其他学生事件。其他题目暂无 Evidence 包。
            </p>
            {p.evidence && question === "Q05" ? (
              <button
                className="primary-button"
                onClick={() => setEvidence(true)}
              >
                查看我的 Evidence
              </button>
            ) : (
              <p>当前无可用个人证据引用</p>
            )}
          </Card>
        </section>
      </div>
      {evidence && p.evidence && (
        <PersonalEvidence key={id} p={p} close={() => setEvidence(false)} />
      )}
    </div>
  );
}
function PersonalEvidence({ p, close }: { p: Personal; close: () => void }) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    ref.current?.querySelector<HTMLButtonElement>("button")?.focus();
    const listener = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "Tab") {
        const buttons = ref.current?.querySelectorAll<HTMLElement>(
          "button,[href],summary",
        );
        if (!buttons?.length) return;
        const first = buttons[0],
          last = buttons[buttons.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", listener);
    return () => {
      document.removeEventListener("keydown", listener);
      previous?.focus();
    };
  }, [close]);
  const evidence = p.evidence!;
  return (
    <div className="personal-evidence-overlay">
      <aside
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label="我的 Evidence · 个人投影"
        className="personal-evidence-drawer"
      >
        <button onClick={close}>关闭</button>
        <h2>我的 Evidence · 个人投影</h2>
        <p>DEMO / SYNTHETIC · 非科研证据</p>
        <p>包来源：{evidence.evidence_id}</p>
        <p>限定范围：{p.participant_id}；此视图不加载完整班级 Evidence 包。</p>
        <p>
          窗口：[{evidence.window.start_ms}, {evidence.window.end_ms}) ms ·{" "}
          {formatMs(evidence.window.start_ms)}–
          {formatMs(evidence.window.end_ms)}
        </p>
        <p>
          质量：{evidence.quality.source_quality_status} /{" "}
          {evidence.quality.availability}
        </p>
        <h3>个人 Q5 事件 ID</h3>
        <ul>
          {evidence.event_ids.map((id) => (
            <li key={id}>
              <code>{id}</code>
            </li>
          ))}
        </ul>
        <h3>Evidence Trace</h3>
        <p>
          个人合成事件 → Q5 个人证据投影 →
          客观过程回顾。全班建议另由教师审核；无真实 Sensor Fact、stroke_ref 或
          video_ref。
        </p>
      </aside>
    </div>
  );
}
export function ResearchShowcase() {
  const { session, returnUrl, params } = useDemoContext();
  const { section = "datasets" } = useParams();
  const resource = useResource(
    () => researchShowcaseApi.get(session),
    [session, getDemoScenario()],
  );
  if (!showcaseEnabled)
    return (
      <ErrorState
        error={new ApiError("NOT_FOUND", "仅在 Mock Demo 中提供", 404, "demo")}
      />
    );
  if (resource.loading) return <Skeleton />;
  if (resource.error || !resource.data)
    return <ErrorState error={resource.error} />;
  const data = resource.data,
    selected = data.sections.find((s) => s.id === section);
  if (!selected)
    return (
      <ErrorState
        error={new ApiError("NOT_FOUND", "展示分区不存在", 404, "demo")}
      />
    );
  const labels = {
    SOFTWARE_VERIFIED: "软件行为已核验 · 非模型成绩",
    SYNTHETIC: "Synthetic 演示结果",
    DEVELOPING: "正在研发 · 无评测产物",
    NOT_VALIDATED: "尚未验证",
  };
  return (
    <div className="showcase-workspace demo-research">
      <header>
        <p className="showcase-eyebrow">DEMO / SYNTHETIC · Mock 只读研究展示</p>
        <h1>Research Lab · Demo</h1>
        <p>
          只读比赛入口；正式 Research API
          角色权限保持不变。未提供真实实验材料的项目不填写指标。
        </p>
        <Link to={returnUrl}>返回演示流程</Link>
      </header>
      <nav className="demo-research-tabs" aria-label="研究展示分区">
        {data.sections.map((s) => (
          <Link
            key={s.id}
            aria-current={s.id === section ? "page" : undefined}
            to={`/demo/research/${s.id}?${params}`}
          >
            {s.title}
          </Link>
        ))}
      </nav>
      <h2>{selected.title}</h2>
      <div className="demo-research-grid">
        {selected.cards.map((c) => (
          <Card key={c.title} title={c.title}>
            <span className="demo-status">{labels[c.status]}</span>
            <p>{c.description}</p>
            <p className="showcase-muted">依据：{c.source}</p>
          </Card>
        ))}
      </div>
      <p>
        Fusion：<strong>{data.fusion_status}</strong>
      </p>
      {section === "evidence-trace" &&
        (data.evidence_id ? (
          <EvidenceLinks ids={[data.evidence_id]} />
        ) : (
          <p>证据不足 · 无可用 Evidence 引用</p>
        ))}
      {section === "evidence-trace" && data.evidence_id && (
        <ResearchEvidenceButton id={data.evidence_id} />
      )}
      {section === "failure-cases" && (
        <Link
          to={`/ai?${new URLSearchParams({ session, question: "Q05", node: "node_0003", return: window.location.pathname + window.location.search })}`}
        >
          到 AI 验证证据不足场景
        </Link>
      )}
    </div>
  );
}
import { useEvidence } from "../EvidenceDrawer";
function ResearchEvidenceButton({ id }: { id: string }) {
  const { open } = useEvidence();
  return (
    <button className="primary-button" onClick={() => open(id)}>
      查看 Q5 Evidence 追溯
    </button>
  );
}
