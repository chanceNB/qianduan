import { useState } from "react";
import { NavLink, useNavigate, useSearchParams } from "react-router-dom";
import { showcaseApi, type Showcase } from "../../demo/showcase";
import { studentApi } from "../../api/student";
import { useResource } from "../../hooks/useResource";
import {
  Card,
  Badges,
  ErrorState,
  Skeleton,
  QualityBadge,
  formatMs,
} from "../ui";
import { EvidenceLinks, useEvidence } from "../EvidenceDrawer";
import { ReplayCanvas } from "../ReplayCanvas";
import {
  QuestionDistributionChart,
  ReturnRatioChart,
  RevisionCandidateChart,
  ProgressDivergencePanel,
  questionLabel,
} from "./ClassStateCharts";
import { StudentProcessComparison } from "./StudentProcessComparison";
import { EventTimeline } from "./EventTimeline";

export function Q5Showcase({
  sessionId,
  tab,
}: {
  sessionId: string;
  tab: string;
}) {
  const resource = useResource(() => showcaseApi.get(sessionId), [sessionId]);
  if (resource.loading) return <Skeleton />;
  if (resource.error)
    return <ErrorState error={resource.error} retry={resource.reload} />;
  return (
    resource.data && (
      <ShowcaseContent key={sessionId} data={resource.data} tab={tab} />
    )
  );
}
function ShowcaseContent({ data, tab }: { data: Showcase; tab: string }) {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const { open } = useEvidence();
  const question = data.questions.some(
    (q) => q.question_id === params.get("question"),
  )
    ? params.get("question")!
    : "Q05";
  const student =
    data.students.find((s) => s.participant_id === params.get("student")) ??
    data.students[0];
  const [full, setFull] = useState(false);
  const processes = useResource(
    () =>
      Promise.all(
        data.students.map((s) =>
          studentApi.process(data.session.session_id, s.participant_id),
        ),
      ),
    [data.session.session_id],
  );
  const replay = useResource(
    () => studentApi.replay(data.session.session_id, student.participant_id),
    [data.session.session_id, student.participant_id],
  );
  const [time, setTime] = useState<number>();
  const process = processes.data?.find(
    (p) => p.participant_id === student.participant_id,
  );
  function selection(q: string, id: string) {
    const next = new URLSearchParams(params);
    next.set("question", q);
    next.set("student", id);
    return next;
  }
  function selectStudent(id: string, scroll = false) {
    setParams(selection(question, id));
    setFull(scroll);
    if (scroll)
      document
        .getElementById("showcase-replay")
        ?.scrollIntoView?.({ behavior: "smooth", block: "start" });
  }
  const evidence =
    question === data.node.question_ids[0] ? data.node.evidence_refs : [];
  const timelineEvents =
    process?.event_timeline.filter((e) => full || e.question_id === question) ??
    [];
  return (
    <div className="q5-showcase">
      <section className="showcase-hero">
        <div>
          <p className="showcase-eyebrow">挑战杯 · 数学课堂过程演示</p>
          <h1>{data.session.lesson_title}</h1>
          <p>关键节点 → 班级态势 → 结果与过程对照 → 事件回放 → Evidence</p>
          <Badges tags={data.authenticity} />
        </div>
        <div className="hero-facts">
          <div>
            <strong>{data.session.participant_count}</strong>
            <span>演示学生</span>
          </div>
          <div>
            <strong>{data.questions.length}</strong>
            <span>本节题目</span>
          </div>
          <div>
            <strong>Q5</strong>
            <span>关键节点</span>
          </div>
          <div>
            <strong>
              {formatMs(data.state.window.start_ms)}–
              {formatMs(data.state.window.end_ms)}
            </strong>
            <span>课堂开始后 · 左闭右开</span>
          </div>
        </div>
      </section>
      <div className="showcase-navigation">
        <div className="tabs">
          {[
            ["overview", "课堂总览"],
            ["class-state", "班级态势"],
            ["key-nodes", "关键节点"],
          ].map(([key, label]) => (
            <NavLink
              key={key}
              to={`/classroom/${data.session.session_id}/${key}?${selection(question, student.participant_id)}`}
            >
              {label}
            </NavLink>
          ))}
        </div>
        <label>
          当前题目{" "}
          <select
            aria-label="演示题目"
            value={question}
            onChange={(e) => {
              setParams(selection(e.target.value, student.participant_id));
              setFull(false);
            }}
          >
            {data.questions.map((q) => (
              <option key={q.question_id} value={q.question_id}>
                {questionLabel(q.question_id)}
              </option>
            ))}
          </select>
        </label>
      </div>
      {!["overview", "class-state", "key-nodes"].includes(tab) ? (
        <ErrorState error={new Error("未知工作区")} />
      ) : (
        <>
          <section
            className={`key-node-banner ${tab === "key-nodes" ? "selected" : ""}`}
            aria-label="Q5 关键节点"
          >
            <div className="node-symbol">Q5</div>
            <div>
              <p className="showcase-eyebrow">14–15 分钟 · 关键观察窗口</p>
              <h2>{data.node.title}</h2>
              <p>{data.node.description}</p>
            </div>
            <div className="node-actions">
              <button
                className="primary-button"
                onClick={() => {
                  navigate(
                    `/classroom/${data.session.session_id}/class-state?${selection("Q05", student.participant_id)}`,
                  );
                }}
              >
                查看班级态势
              </button>
              <button
                className="soft-button"
                onClick={() => open(data.node.evidence_refs[0])}
              >
                查看 Evidence
              </button>
            </div>
          </section>
          <section aria-label="班级态势可视化">
            <div className="showcase-section-title">
              <h2>{questionLabel(question)} · 班级态势</h2>
              <span>
                统计窗口 [{formatMs(data.state.window.start_ms)},{" "}
                {formatMs(data.state.window.end_ms)})
              </span>
            </div>
            <QualityBadge quality={data.state.quality} />
            <div className="showcase-charts">
              <QuestionDistributionChart
                state={data.state}
                selected={question}
                select={(q) => {
                  setParams(selection(q, student.participant_id));
                  setFull(false);
                }}
              />
              <ReturnRatioChart
                state={data.state}
                question={question}
                evidence={evidence}
              />
              <RevisionCandidateChart
                state={data.state}
                question={question}
                evidence={evidence}
              />
              <ProgressDivergencePanel state={data.state} />
            </div>
            <p className="showcase-muted">
              有效分母：窗口结束前有题目访问记录的去重参与者。所有数据为合成演示，不用于真实教学判断。
            </p>
          </section>
          {processes.loading ? (
            <Skeleton />
          ) : processes.error ? (
            <ErrorState error={processes.error} retry={processes.reload} />
          ) : (
            <StudentProcessComparison
              students={data.students}
              processes={processes.data ?? []}
              question={question}
              selected={student.participant_id}
              select={selectStudent}
            />
          )}
          <section
            id="showcase-replay"
            aria-label={`${student.display_name} 作答事件回放`}
          >
            <div className="showcase-section-title">
              <h2>{student.display_name} · 作答事件回放</h2>
              <button
                className="soft-button"
                onClick={() => setFull((f) => !f)}
              >
                {full ? "仅看当前题目" : "展示完整课堂过程"}
              </button>
            </div>
            <div className="showcase-replay-layout">
              <Card
                title={`${full ? "完整课堂" : questionLabel(question)} 事件时间轴`}
              >
                {processes.loading ? (
                  <Skeleton />
                ) : processes.error ? (
                  <ErrorState error={processes.error} />
                ) : (
                  <EventTimeline
                    key={`${student.participant_id}:${question}:${full}`}
                    events={timelineEvents}
                    onTime={setTime}
                  />
                )}
              </Card>
              <Card title="笔迹与证据">
                <p className="showcase-muted">
                  {student.participant_id} · DEMO / SYNTHETIC
                </p>
                {replay.loading ? (
                  <Skeleton />
                ) : replay.error ? (
                  <ErrorState error={replay.error} />
                ) : (
                  replay.data && (
                    <ReplayCanvas
                      key={student.participant_id}
                      replay={replay.data}
                      timeMs={time}
                    />
                  )
                )}
                <EvidenceLinks ids={evidence} />
              </Card>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
