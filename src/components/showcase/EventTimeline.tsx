import type { z } from "zod";
import type { eventSchema } from "../../contracts";
import { useEffect, useState } from "react";
import { EvidenceLinks } from "../EvidenceDrawer";
import { EmptyState, formatMs } from "../ui";
import { eventLabel } from "./eventLabels";
import { questionLabel } from "./ClassStateCharts";
export function EventTimeline({
  events,
  onTime,
}: {
  events: z.infer<typeof eventSchema>[];
  onTime?: (time: number) => void;
}) {
  const ordered = [...events].sort((a, b) => a.start_time_ms - b.start_time_ms);
  const start = ordered[0]?.start_time_ms ?? 0;
  const end = ordered.at(-1)?.end_time_ms ?? start;
  const [time, setTime] = useState(start);
  const [playing, setPlaying] = useState(false);
  const current = ordered.filter((e) => e.start_time_ms <= time).at(-1);
  useEffect(() => {
    onTime?.(time);
  }, [onTime, time]);
  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(
      () => setTime((t) => Math.min(end, t + 1000)),
      100,
    );
    return () => window.clearInterval(timer);
  }, [playing, end]);
  useEffect(() => {
    if (time >= end) setPlaying(false);
  }, [time, end]);
  if (!ordered.length) return <EmptyState title="暂无作答事件" />;
  return (
    <div className="event-player">
      <div className="event-controls">
        <button
          className="primary-button"
          disabled={start === end}
          onClick={() => {
            if (time >= end) setTime(start);
            setPlaying((p) => !p);
          }}
        >
          {playing ? "暂停" : "播放"}
        </button>
        <button
          className="soft-button"
          disabled={start === end}
          onClick={() => {
            setTime(start);
            setPlaying(true);
          }}
        >
          重新播放
        </button>
        <input
          type="range"
          aria-label="事件时间定位"
          min={start}
          max={end}
          step={1}
          value={time}
          onChange={(e) => {
            setPlaying(false);
            setTime(Number(e.target.value));
          }}
        />
        <output aria-label="当前事件时间">{formatMs(time)}</output>
        <span>10× 事件时间</span>
      </div>
      <p className="showcase-muted">
        时间相对于课堂开始。结果提交为 Synthetic 记录，非 R1
        传感器事件；未出现的离题、书写或过程结束事件不补造。
      </p>
      <ol className="event-list">
        {ordered.map((e) => (
          <li
            key={e.event_id}
            className={e.event_id === current?.event_id ? "selected" : ""}
          >
            <button
              aria-label={`定位 ${eventLabel(e.event_type)} ${formatMs(e.start_time_ms)} ${e.event_id}`}
              aria-pressed={e.event_id === current?.event_id}
              onClick={() => {
                setPlaying(false);
                setTime(e.start_time_ms);
              }}
            >
              <time>{formatMs(e.start_time_ms)}</time>
              <strong>{eventLabel(e.event_type)}</strong>
              <span>{e.question_id ? questionLabel(e.question_id) : "—"}</span>
              <code>{e.event_id}</code>
              {e.event_type === "ANSWER_SUBMIT" && (
                <small>SYNTHETIC · 非传感器事件</small>
              )}
            </button>
            <EvidenceLinks ids={e.evidence_refs} />
          </li>
        ))}
      </ol>
    </div>
  );
}
