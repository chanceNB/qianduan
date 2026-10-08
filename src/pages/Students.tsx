import { useState } from "react";
import { FileText, Filter, UsersRound } from "lucide-react";
import { teacherApi } from "../api/teacher";
import { studentApi } from "../api/student";
import { useResource } from "../hooks/useResource";
import { useClassroomSelection } from "../hooks/useClassroomSelection";
import { SelectionFilters } from "../components/SelectionFilters";
import {
  Card,
  EmptyState,
  ErrorState,
  PageTitle,
  SearchField,
  Skeleton,
  QualityBadge,
  Badges,
  formatMs,
} from "../components/ui";
import { EvidenceLinks } from "../components/EvidenceDrawer";
import { ReplayCanvas } from "../components/ReplayCanvas";
import { useGlobalSearch } from "../layouts/AppShell";
const eventLabels: Record<string, string> = {
  QUESTION_VISIT: "进入题目",
  RETURN: "离开题目后再次进入",
  REVISION_CANDIDATE: "修改候选",
  PROCESS_END: "过程结束",
};
export function Students() {
  const selection = useClassroomSelection();
  const [question, setQuestion] = useState("");
  const [event, setEvent] = useState("");
  const [participant, setParticipant] = useState("");
  const [search, setSearch] = useState("");
  const global = useGlobalSearch();
  const [page, setPage] = useState(1);
  const { sessionId } = selection;
  const students = useResource(
    () =>
      sessionId
        ? teacherApi.students(sessionId, {
            question_id: question,
            event_type: event,
            page,
            page_size: 20,
          })
        : Promise.resolve(null),
    [sessionId, question, event, page],
  );
  const process = useResource(
    () =>
      sessionId && participant
        ? studentApi.process(sessionId, participant)
        : Promise.resolve(null),
    [sessionId, participant],
  );
  const replay = useResource(
    () =>
      sessionId && participant
        ? studentApi.replay(sessionId, participant)
        : Promise.resolve(null),
    [sessionId, participant],
  );
  const chosen = students.data?.items.some(
    (p) => p.participant_id === participant,
  );
  return (
    <>
      <PageTitle
        title="学生过程"
        description="从课堂问题进入个体匿名作答过程"
      />
      {selection.overview.data && (
        <Badges tags={selection.overview.data.authenticity} />
      )}
      <div className="filter-row">
        <SelectionFilters
          selection={{
            ...selection,
            setClassId: (id) => {
              selection.setClassId(id);
              setParticipant("");
              setQuestion("");
              setEvent("");
              setPage(1);
            },
            setSessionId: (id) => {
              selection.setSessionId(id);
              setQuestion("");
              setParticipant("");
              setEvent("");
              setPage(1);
            },
          }}
        />
        <label className="filter">
          <FileText size={16} />
          <select
            aria-label="选择题目"
            value={question}
            onChange={(e) => {
              setQuestion(e.target.value);
              setParticipant("");
              setPage(1);
            }}
          >
            <option value="">选择题目</option>
            {selection.overview.data?.question_distribution.map((q) => (
              <option key={q.question_id}>{q.question_id}</option>
            ))}
          </select>
        </label>
        <label className="filter">
          <Filter size={16} />
          <select
            aria-label="过程事件"
            value={event}
            onChange={(e) => {
              setEvent(e.target.value);
              setParticipant("");
              setPage(1);
            }}
          >
            <option value="">过程事件</option>
            {Object.entries(eventLabels).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
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
      ) : (
        <div className="student-workspace split-panel">
          <Card
            title={
              <>
                相关学生{" "}
                <span className="count">{students.data?.total ?? "—"}</span>
              </>
            }
          >
            <SearchField
              value={search}
              onChange={setSearch}
              placeholder="搜索匿名学生编号…"
            />
            {students.loading ? (
              <Skeleton />
            ) : students.error ? (
              <ErrorState error={students.error} />
            ) : students.data?.items.length ? (
              <>
                {students.data.items
                  .filter((p) =>
                    p.participant_id
                      .toLowerCase()
                      .includes((search || global).toLowerCase()),
                  )
                  .map((p) => (
                    <button
                      className={`list-row ${participant === p.participant_id ? "selected" : ""}`}
                      key={p.participant_id}
                      onClick={() => setParticipant(p.participant_id)}
                    >
                      <UsersRound size={20} />
                      {p.participant_id}
                    </button>
                  ))}
                <div className="pagination">
                  <button
                    disabled={page === 1}
                    onClick={() => {
                      setPage((p) => p - 1);
                      setParticipant("");
                    }}
                  >
                    上一页
                  </button>
                  <span>{page}</span>
                  <button
                    disabled={!students.data.has_next}
                    onClick={() => {
                      setPage((p) => p + 1);
                      setParticipant("");
                    }}
                  >
                    下一页
                  </button>
                </div>
              </>
            ) : (
              <EmptyState
                icon="student"
                title={sessionId ? "暂无相关匿名学生" : "请先选择课堂"}
                description={
                  <>
                    选择一节课堂后，
                    <br />
                    选择题目与过程事件
                    <br />
                    查看相关的学生。
                  </>
                }
              />
            )}
          </Card>
          <Card title="学生详情">
            {!chosen ? (
              <>
                <div className="profile-skeleton">
                  <span />
                  <div>
                    <i />
                    <i />
                  </div>
                </div>
                <EmptyState
                  title="暂无学生信息"
                  description={
                    <>
                      从左侧选择一名学生，
                      <br />
                      查看其作答过程。
                    </>
                  }
                />
              </>
            ) : process.loading ? (
              <Skeleton />
            ) : process.error ? (
              <ErrorState error={process.error} />
            ) : (
              process.data && (
                <>
                  <h3>{process.data.participant_id}</h3>
                  <QualityBadge quality={process.data.quality} />
                  <div className="event-timeline">
                    {process.data.event_timeline.map((e) => (
                      <div key={e.event_id}>
                        <small>
                          {formatMs(e.start_time_ms)} · {e.question_id ?? "—"}
                        </small>
                        <h3>{eventLabels[e.event_type] ?? e.event_type}</h3>
                        <EvidenceLinks ids={e.evidence_refs} />
                      </div>
                    ))}
                  </div>
                  <h3>作答过程 Replay</h3>
                  {replay.loading ? (
                    <Skeleton />
                  ) : replay.error ? (
                    <ErrorState error={replay.error} />
                  ) : (
                    replay.data && (
                      <ReplayCanvas key={participant} replay={replay.data} />
                    )
                  )}
                </>
              )
            )}
          </Card>
        </div>
      )}
    </>
  );
}
