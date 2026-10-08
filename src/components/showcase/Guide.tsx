import { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthProvider";
import { showcaseEnabled } from "../../demo/showcase";
import {
  readGuide,
  saveGuide,
  defaultGuide,
  guideUrl,
  resetShowcase,
  type GuideState,
} from "../../demo/guide";
import { useEvidence } from "../EvidenceDrawer";
const steps = [
  [
    "Q5 课堂",
    "观察 14–15 分钟窗口：RETURN 4/12，修改候选 3/12；这是 Synthetic 事件统计。",
  ],
  [
    "学生对照",
    "依次选择 A、B、C，点击播放时间轴；比较同结果不同过程，不判断心理或能力。",
  ],
  ["Evidence", "打开 Q5 Evidence，核对事件 ID、窗口、PARTIAL 质量与合成来源。"],
  [
    "AI 与教师审核",
    "点击生成复盘，区分事实和建议；由教师自行认可、修改或驳回。",
  ],
  [
    "学生反馈",
    "查看个人事件；只有教师采纳的全班关注项可见，不等价于个人诊断。",
  ],
  ["Research Lab", "依次查看五分区；真实模型材料缺失，Fusion 仍未验证。"],
];
export function DemoStart() {
  const navigate = useNavigate();
  const { user } = useAuth();
  if (!showcaseEnabled || user?.role !== "TEACHER") return null;
  return (
    <section className="showcase-start">
      <p>DEMO / SYNTHETIC · 从课堂过程到可追溯的教学反馈</p>
      <h2>用作答事件看见课堂，让教学复盘有据可查。</h2>
      <button
        className="primary-button"
        onClick={() => {
          saveGuide({ ...defaultGuide });
          navigate(guideUrl(defaultGuide));
        }}
      >
        开始核心功能演示
      </button>
      <ResetDemo />
    </section>
  );
}
export function ResetDemo() {
  const [confirm, setConfirm] = useState(false),
    [error, setError] = useState("");
  const navigate = useNavigate();
  const { user } = useAuth();
  if (!showcaseEnabled || user?.role !== "TEACHER") return null;
  return (
    <>
      <button className="soft-button" onClick={() => setConfirm(true)}>
        重置演示
      </button>
      {confirm && (
        <div className="demo-reset" role="dialog" aria-label="重置演示确认">
          <p>仅清除 Showcase 演示审核与引导状态，保留账号、生产数据和偏好。</p>
          <button
            onClick={() => {
              try {
                resetShowcase();
                setConfirm(false);
                navigate(guideUrl(defaultGuide));
              } catch {
                setError("重置失败，请检查浏览器存储设置后重试。");
              }
            }}
          >
            确认重置
          </button>
          <button onClick={() => setConfirm(false)}>取消</button>
          {error && <p role="alert">{error}</p>}
        </div>
      )}
    </>
  );
}
export function Guide() {
  const { user } = useAuth();
  return showcaseEnabled && user?.role === "TEACHER" ? (
    <GuideWorkspace />
  ) : null;
}
function GuideWorkspace() {
  const panel = useRef<HTMLElement>(null);
  const [g, setG] = useState(readGuide);
  const { user } = useAuth();
  const navigate = useNavigate(),
    location = useLocation();
  const { open } = useEvidence();
  useEffect(() => {
    const measure = () => {
      if (panel.current)
        document.documentElement.style.setProperty(
          "--showcase-guide-bottom",
          `${Math.ceil(panel.current.getBoundingClientRect().bottom) + 12}px`,
        );
    };
    measure();
    window.addEventListener("scroll", measure, true);
    window.addEventListener("resize", measure);
    const observer =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(measure);
    if (panel.current) observer?.observe(panel.current);
    return () => {
      window.removeEventListener("scroll", measure, true);
      window.removeEventListener("resize", measure);
      observer?.disconnect();
      document.documentElement.style.removeProperty("--showcase-guide-bottom");
    };
  }, [g?.step, g?.paused]);
  useEffect(() => {
    const listener = () => setG(readGuide());
    const timeListener = (event: Event) => {
      const current = readGuide();
      if (current && !current.paused)
        saveGuide({
          ...current,
          ...(event as CustomEvent<{time:string;full:string;student:string}>).detail,
        });
    };
    window.addEventListener("showcase-guide-change", listener);
    window.addEventListener("showcase-classroom-context", timeListener);
    return () => {
      window.removeEventListener("showcase-guide-change", listener);
      window.removeEventListener("showcase-classroom-context", timeListener);
    };
  }, []);
  useEffect(() => {
    const g = readGuide();
    if (!g) return;
    const params = new URLSearchParams(location.search);
    const next = {
      ...g,
      student: params.get("student") ?? g.student,
      time: params.get("time") ?? g.time,
      full: params.get("full") ?? g.full,
    };
    if (JSON.stringify(next) !== JSON.stringify(g)) saveGuide(next);
  }, [location.search]);
  if (!showcaseEnabled || user?.role !== "TEACHER" || !g) return null;
  const move = (step: number) => {
    const next: GuideState = { ...g, step, paused: false };
    window.dispatchEvent(new Event("showcase-close-evidence"));
    saveGuide(next);
    navigate(guideUrl(next));
  };
  return (
    <aside ref={panel} className="showcase-guide" aria-label="比赛演示引导">
      <div>
        <strong>
          {g.step + 1} / 6 · {steps[g.step][0]}
        </strong>
        <span>DEMO / SYNTHETIC · {g.paused ? "自由探索" : "比赛引导"}</span>
        <p>{steps[g.step][1]}</p>
      </div>
      <div className="guide-actions">
        {g.paused ? (
          <button onClick={() => move(g.step)}>继续引导</button>
        ) : (
          <>
            <button disabled={g.step === 0} onClick={() => move(g.step - 1)}>
              上一步
            </button>
            <button disabled={g.step === 5} onClick={() => move(g.step + 1)}>
              下一步
            </button>
            <button onClick={() => saveGuide({ ...g, paused: true })}>
              自由探索
            </button>
            {g.step === 2 && (
              <button onClick={() => open("ev_sess001_q05_0003")}>
                打开本步 Evidence
              </button>
            )}
          </>
        )}
        <button
          onClick={() => {
            window.dispatchEvent(new Event("showcase-close-evidence"));
            saveGuide(null);
          }}
        >
          退出引导
        </button>
      </div>
    </aside>
  );
}
