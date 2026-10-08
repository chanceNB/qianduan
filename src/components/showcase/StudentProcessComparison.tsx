import type { Showcase } from "../../demo/showcase";
import type { z } from "zod";
import type { processSchema } from "../../contracts";
import { eventLabel } from "./eventLabels";
import { questionLabel } from "./ClassStateCharts";
type Process = z.infer<typeof processSchema>;
export function StudentProcessComparison({
  students,
  processes,
  selected,
  question,
  select,
}: {
  students: Showcase["students"];
  processes: Process[];
  selected: string;
  question: string;
  select: (id: string, scroll?: boolean) => void;
}) {
  return (
    <section aria-label="学生结果与过程对照">
      <div className="showcase-section-title">
        <h2>学生 A / B / C · 结果与过程对照</h2>
        <span>同一结果，也可能有不同过程</span>
      </div>
      <div className="comparison-grid">
        {students.map((s) => {
          const events =
            processes
              .find((p) => p.participant_id === s.participant_id)
              ?.event_timeline.filter((e) => e.question_id === question) ?? [];
          const summary = processes
            .find((p) => p.participant_id === s.participant_id)
            ?.question_summaries.find((q) => q.question_id === question);
          const result = s.results.find((r) => r.question_id === question);
          return (
            <article
              key={s.participant_id}
              className={`comparison-card ${selected === s.participant_id ? "selected" : ""}`}
            >
              <button
                className="comparison-select"
                aria-label={`选择${s.display_name}`}
                aria-pressed={selected === s.participant_id}
                onClick={() => select(s.participant_id)}
              >
                <div className="student-heading">
                  <span className="student-letter">
                    {s.display_name.at(-1)}
                  </span>
                  <div>
                    <h3>{s.display_name}</h3>
                    <code>{s.participant_id}</code>
                  </div>
                  <span
                    className={`result-pill ${result?.correct === false ? "incorrect" : ""}`}
                  >
                    {result ? (result.correct ? "正确" : "错误") : "结果未提供"}
                  </span>
                </div>
                <p>
                  {questionLabel(question)} 最终答案：{result?.answer ?? "缺失"}{" "}
                  <small>合成演示结果</small>
                </p>
                <div className="process-path">
                  {events.map((e) => eventLabel(e.event_type)).join(" → ") ||
                    "暂无事件"}
                </div>
                <div className="process-counts">
                  <span>RETURN {summary?.return_count ?? "—"} 次</span>
                  <span>
                    修改候选 {summary?.revision_candidate_count ?? "—"} 次
                  </span>
                </div>
              </button>
              <button
                className="soft-button"
                onClick={() => select(s.participant_id, true)}
              >
                查看完整过程 · {s.display_name}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
