import { useState } from "react";
import { useNavigate, useLocation, NavLink, useParams } from "react-router-dom";
import { teacherApi } from "../api/teacher";
import { useResource } from "../hooks/useResource";
import { useGlobalSearch } from "../layouts/AppShell";
import {
  PageTitle,
  EmptyState,
  ErrorState,
  Skeleton,
  SearchField,
  Badges,
  Card,
  QualityBadge,
  MetricValue,
  DataFields,
  formatMs,
} from "../components/ui";
import { EvidenceLinks } from "../components/EvidenceDrawer";
import { showcaseEnabled } from "../demo/showcase";
import { Q5Showcase } from "../components/showcase/Q5Showcase";
export function Classroom() {
  const [classId, setClassId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const global = useGlobalSearch();
  const classes = useResource(() => teacherApi.classes(), []);
  const sessions = useResource(
    () =>
      classId
        ? teacherApi.sessions(classId, {
            date_from: from,
            date_to: to,
            page,
            page_size: 20,
          })
        : Promise.resolve(null),
    [classId, from, to, page],
  );
  const navigate = useNavigate();
  const recent = useLocation().pathname.endsWith("/recent");
  const filtered =
    sessions.data?.items.filter((s) =>
      `${s.lesson_title} ${s.course_name} ${s.session_id}`
        .toLowerCase()
        .includes((search || global).toLowerCase()),
    ) ?? [];
  return (
    <>
      <PageTitle title="课堂" description="选择一节课堂，进入过程分析工作区" />
      <div className="tabs">
        <NavLink to="/classroom" end>
          全部课堂
        </NavLink>
        <NavLink to="/classroom/recent">最近课堂</NavLink>
      </div>
      <div className="class-filters">
        <label>
          班级
          <select
            aria-label="班级"
            value={classId}
            onChange={(e) => {
              setClassId(e.target.value);
              setPage(1);
            }}
          >
            <option value="">全部</option>
            {classes.data?.items.map((c) => (
              <option key={c.class_id} value={c.class_id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          开始日期
          <input
            type="date"
            aria-label="开始日期"
            value={from}
            onChange={(e) => {
              setFrom(e.target.value);
              setPage(1);
            }}
          />
        </label>
        <label>
          结束日期
          <input
            type="date"
            aria-label="结束日期"
            min={from}
            value={to}
            onChange={(e) => {
              setTo(e.target.value);
              setPage(1);
            }}
          />
        </label>
      </div>
      <SearchField
        value={search}
        onChange={setSearch}
        placeholder="搜索已加载的课堂名称…"
      />
      {classes.error ? (
        <ErrorState error={classes.error} retry={classes.reload} />
      ) : sessions.error ? (
        <ErrorState error={sessions.error} retry={sessions.reload} />
      ) : classes.loading || sessions.loading ? (
        <Skeleton />
      ) : recent ? (
        <EmptyState
          icon="class"
          title="暂无最近课堂"
          description="当前版本没有最近访问记录接口"
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="class"
          title="暂无课堂数据"
          description="请选择班级并查看可用课堂"
          action={
            <button
              className="primary-button"
              onClick={() =>
                document
                  .querySelector<HTMLSelectElement>('[aria-label="班级"]')
                  ?.focus()
              }
            >
              选择课堂
            </button>
          }
        />
      ) : (
        <div className="session-list">
          {filtered.map((s) => (
            <button
              className="session-card"
              key={s.session_id}
              onClick={() => navigate(`/classroom/${s.session_id}/overview`)}
            >
              <h2>{s.lesson_title}</h2>
              <p>
                {s.course_name} · {formatMs(s.duration_ms)} ·{" "}
                {s.participant_count} 名参与者
              </p>
              <Badges tags={s.authenticity} />
            </button>
          ))}
          <div className="pagination">
            <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
              上一页
            </button>
            <span>第 {page} 页</span>
            <button
              disabled={!sessions.data?.has_next}
              onClick={() => setPage((p) => p + 1)}
            >
              下一页
            </button>
          </div>
        </div>
      )}
    </>
  );
}
export function SessionWorkspace() {
  const { sessionId = "", tab = "overview" } = useParams();
  return showcaseEnabled ? (
    <Q5Showcase sessionId={sessionId} tab={tab} />
  ) : (
    <StandardSessionWorkspace />
  );
}
function StandardSessionWorkspace() {
  const { sessionId = "", tab = "overview" } = useParams();
  const overview = useResource(
    () => teacherApi.overview(sessionId),
    [sessionId],
  );
  const state = useResource(
    () =>
      tab === "class-state"
        ? teacherApi.classState(sessionId)
        : Promise.resolve(null),
    [sessionId, tab],
  );
  const nodes = useResource(
    () =>
      tab === "key-nodes"
        ? teacherApi.keyNodes(sessionId)
        : Promise.resolve(null),
    [sessionId, tab],
  );
  const [nodeId, setNodeId] = useState("");
  const [questionId, setQuestionId] = useState("");
  const question = useResource(
    () =>
      questionId
        ? teacherApi.question(sessionId, questionId)
        : Promise.resolve(null),
    [sessionId, questionId],
  );
  const data = overview.data;
  const selected =
    nodes.data?.items.find((n) => n.node_id === nodeId) ?? nodes.data?.items[0];
  return (
    <>
      <PageTitle
        title={data?.session.lesson_title ?? "课堂工作区"}
        description="课堂总览 · 班级态势 · 关键节点"
      />
      {data && <Badges tags={data.authenticity} />}
      <div className="tabs">
        {[
          ["overview", "课堂总览"],
          ["class-state", "班级态势"],
          ["key-nodes", "关键节点"],
        ].map(([key, label]) => (
          <NavLink key={key} to={`/classroom/${sessionId}/${key}`}>
            {label}
          </NavLink>
        ))}
      </div>
      {overview.loading ? (
        <Skeleton />
      ) : overview.error ? (
        <ErrorState error={overview.error} />
      ) : data && tab === "overview" ? (
        <>
          <div className="metric-grid">
            {data.metrics.map((m) => (
              <Card title={m.label} key={m.metric_key}>
                <div className="metric-number">
                  <MetricValue
                    value={m.display_value ?? m.value}
                    availability={m.quality.availability}
                  />
                </div>
                <QualityBadge quality={m.quality} />
                <EvidenceLinks ids={m.evidence_refs} />
              </Card>
            ))}
          </div>
          <Card title="题目进度概览">
            {data.question_distribution.map((q) => (
              <button
                className="soft-button"
                key={q.question_id}
                onClick={() => setQuestionId(q.question_id)}
              >
                {q.question_id} ·{" "}
                {q.count === null ? "—" : `${q.count} 名参与者`}
              </button>
            ))}
          </Card>
          <Card title="关键节点">
            {data.key_nodes.map((n) => (
              <div key={n.node_id}>
                <h3>{n.title}</h3>
                <p>{n.description}</p>
                <EvidenceLinks ids={n.evidence_refs} />
              </div>
            ))}
          </Card>
          <Card title="宏观视觉摘要">
            {data.macro_vision === null ? (
              <EmptyState title="暂无视觉摘要" description="等待可用视觉数据" />
            ) : (
              <DataFields data={{ macro_vision: data.macro_vision }} />
            )}
          </Card>
          <Card title="复盘预览">
            {data.agent_preview === null ? (
              <EmptyState title="暂无复盘预览" />
            ) : (
              <DataFields data={{ agent_preview: data.agent_preview }} />
            )}
          </Card>
        </>
      ) : tab === "class-state" ? (
        state.loading ? (
          <Skeleton />
        ) : state.error ? (
          <ErrorState error={state.error} />
        ) : (
          state.data && (
            <Card title="班级态势">
              <QualityBadge quality={state.data.quality} />
              <DataFields
                data={{
                  窗口: `${formatMs(state.data.window.start_ms)}—${formatMs(state.data.window.end_ms)}`,
                  有效参与者: state.data.valid_participant_count,
                  题目分布: state.data.question_distribution,
                  返回比例: state.data.return_ratio,
                  修改候选比例: state.data.revision_candidate_ratio,
                  题目完成比例:
                    state.data.completion_ratio === null
                      ? "不可计算"
                      : state.data.completion_ratio,
                  进度分化: state.data.progress_divergence,
                }}
              />
            </Card>
          )
        )
      ) : tab === "key-nodes" ? (
        nodes.loading ? (
          <Skeleton />
        ) : nodes.error ? (
          <ErrorState error={nodes.error} />
        ) : (
          <div className="split-panel">
            <Card title="时间线">
              {nodes.data?.items.map((n) => (
                <button
                  className={`list-row ${selected?.node_id === n.node_id ? "selected" : ""}`}
                  key={n.node_id}
                  onClick={() => setNodeId(n.node_id)}
                >
                  <small>{formatMs(n.start_time_ms)}</small>
                  <strong>{n.title}</strong>
                </button>
              ))}
              {nodes.data?.items.length === 0 && (
                <EmptyState title="暂无关键节点" />
              )}
            </Card>
            <Card title="节点详情">
              {selected ? (
                <>
                  <h3>{selected.title}</h3>
                  <p>{selected.description}</p>
                  <QualityBadge quality={selected.quality} />
                  <EvidenceLinks ids={selected.evidence_refs} />
                  {selected.question_ids.map((q) => (
                    <button
                      className="soft-button"
                      key={q}
                      onClick={() => setQuestionId(q)}
                    >
                      查看 {q}
                    </button>
                  ))}
                  <NavLink
                    className="soft-button"
                    to={`/students?session=${sessionId}`}
                  >
                    查看相关匿名学生
                  </NavLink>
                </>
              ) : (
                <EmptyState title="请选择一个关键节点" />
              )}
            </Card>
          </div>
        )
      ) : (
        <ErrorState error={new Error("未知工作区")} />
      )}{" "}
      {questionId && (
        <Card
          title={
            <div className="panel-title">
              题目详情 · {questionId}
              <button onClick={() => setQuestionId("")}>关闭</button>
            </div>
          }
        >
          {question.loading ? (
            <Skeleton />
          ) : question.error ? (
            <ErrorState error={question.error} />
          ) : (
            question.data && (
              <>
                <DataFields
                  data={{
                    question_id: question.data.question_id,
                    knowledge_point: question.data.knowledge_point,
                    question_distribution: question.data.question_distribution,
                    students: question.data.students,
                  }}
                />
                <EvidenceLinks ids={question.data.evidence_refs} />
              </>
            )
          )}
        </Card>
      )}
    </>
  );
}
