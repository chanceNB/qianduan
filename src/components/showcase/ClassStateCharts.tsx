import type { Showcase } from "../../demo/showcase";
import { Card } from "../ui";
import { EvidenceLinks } from "../EvidenceDrawer";
type State = Showcase["state"];
export const questionLabel = (q: string) => q.replace(/^Q0/, "Q");
export const percent = (n: number) => `${Number((n * 100).toFixed(1))}%`;
export function QuestionDistributionChart({
  state,
  selected,
  select,
}: {
  state: State;
  selected: string;
  select: (q: string) => void;
}) {
  return (
    <Card title="题目位置分布">
      <p className="showcase-muted">
        窗口终点前的最后题目位置 · 分母{" "}
        {state.valid_participant_count ?? "缺失"} 人
      </p>
      <div className="distribution-chart">
        {state.question_distribution.map((q) => (
          <button
            key={q.question_id}
            className={selected === q.question_id ? "selected" : ""}
            aria-label={`${questionLabel(q.question_id)} 题目位置：${q.count === null ? "缺失" : q.count} 名参与者`}
            onClick={() => select(q.question_id)}
          >
            <strong>{q.count ?? "—"}</strong>
            <div className="distribution-track">
              <i
                style={{ height: q.ratio === null ? 0 : `${q.ratio * 100}%` }}
              />
            </div>
            <span>{questionLabel(q.question_id)}</span>
          </button>
        ))}
      </div>
    </Card>
  );
}
function RatioChart({
  title,
  ratio,
  denominator,
  definition,
  evidence,
}: {
  title: string;
  ratio: number | null | undefined;
  denominator: number | null;
  definition: string;
  evidence: string[];
}) {
  const available = ratio != null && denominator != null && denominator > 0;
  return (
    <Card title={title}>
      <strong className="showcase-metric">
        {available ? percent(ratio) : "数据缺失"}
      </strong>
      <p>
        {available
          ? `${Math.round(ratio * denominator)} / ${denominator} 名参与者`
          : "无有效统计分母"}
      </p>
      <div className="ratio-track" aria-hidden="true">
        <i style={{ width: available ? `${ratio * 100}%` : 0 }} />
      </div>
      <p className="showcase-muted">{definition}</p>
      <EvidenceLinks ids={evidence} />
    </Card>
  );
}
export function ReturnRatioChart({
  state,
  question,
  evidence,
}: {
  state: State;
  question: string;
  evidence: string[];
}) {
  return (
    <RatioChart
      title={`${questionLabel(question)} 返回比例`}
      ratio={state.return_ratio[question]}
      denominator={state.valid_participant_count}
      definition="窗口内发生 RETURN 的去重人数 / 有效参与人数；不是事件次数。"
      evidence={evidence}
    />
  );
}
export function RevisionCandidateChart({
  state,
  question,
  evidence,
}: {
  state: State;
  question: string;
  evidence: string[];
}) {
  return (
    <RatioChart
      title={`${questionLabel(question)} 修改候选比例`}
      ratio={state.revision_candidate_ratio[question]}
      denominator={state.valid_participant_count}
      definition="窗口内发生修改候选的去重人数 / 有效参与人数；候选不等于确认修改。"
      evidence={evidence}
    />
  );
}
export function ProgressDivergencePanel({ state }: { state: State }) {
  return (
    <Card title="进度分化">
      <dl className="divergence-values">
        <div>
          <dt>题目位置方差</dt>
          <dd>{state.progress_divergence?.variance?.toFixed(3) ?? "缺失"}</dd>
        </div>
        <div>
          <dt>归一化分布熵</dt>
          <dd>
            {state.progress_divergence?.entropy_norm?.toFixed(3) ?? "缺失"}
          </dd>
        </div>
      </dl>
      <p className="showcase-muted">
        仅比较题目序号分布，不表示完成耗时、学习能力或心理状态。
      </p>
      <div className="completion-note">
        题目完成比例{" "}
        <strong>
          {state.completion_ratio === null
            ? "不可计算"
            : "暂无可展示的可信完成指标"}
        </strong>
        <small>无可信完成标记；合成答案提交不能替代。</small>
      </div>
    </Card>
  );
}
