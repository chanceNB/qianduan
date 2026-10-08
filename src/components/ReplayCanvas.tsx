import { useEffect, useRef, useState } from "react";
import type { Replay } from "../contracts";
import { EmptyState, QualityBadge, formatMs } from "./ui";
export function ReplayCanvas({
  replay,
  timeMs,
}: {
  replay: Replay;
  timeMs?: number;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const end = Math.max(0, ...replay.strokes.map((s) => s.end_time_ms));
  const start = Math.min(end, ...replay.strokes.map((s) => s.start_time_ms));
  const [time, setTime] = useState(end);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    if (time >= end) setPlaying(false);
  }, [time, end]);
  useEffect(() => {
    const ctx = canvas.current?.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, 600, 800);
    ctx.strokeStyle = "#168c46";
    ctx.lineWidth = 2;
    for (const stroke of replay.strokes) {
      ctx.beginPath();
      let first = true;
      for (const p of stroke.points) {
        if (p.t_ms > (timeMs ?? time)) break;
        if (first) {
          ctx.moveTo(p.x * 600, p.y * 800);
          first = false;
        } else ctx.lineTo(p.x * 600, p.y * 800);
      }
      ctx.stroke();
    }
  }, [replay, time, timeMs]);
  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(
      () =>
        setTime((t) => {
          if (t >= end) return end;
          return Math.min(end, t + 50);
        }),
      50,
    );
    return () => clearInterval(timer);
  }, [playing, end]);
  return (
    <div className="replay">
      <QualityBadge quality={replay.quality} />
      {replay.strokes.length === 0 ? (
        <EmptyState
          title="暂无可回放笔迹"
          description="未提供实际点阵坐标，请查看作答事件时间轴。"
        />
      ) : (
        <>
          <canvas
            ref={canvas}
            width={600}
            height={800}
            aria-label="标准归一化点阵回放"
          />
          {timeMs === undefined && (
            <div className="replay-controls">
              <button
                onClick={() => {
                  if (time >= end) {
                    setTime(start);
                    setPlaying(true);
                  } else setPlaying((x) => !x);
                }}
              >
                {playing && time < end ? "暂停" : "播放"}
              </button>
              <input
                aria-label="回放时间"
                type="range"
                min={start}
                max={end}
                value={time}
                onChange={(e) => {
                  setPlaying(false);
                  setTime(Number(e.target.value));
                }}
              />
              <span>{formatMs(time)}</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
