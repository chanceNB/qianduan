import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { X, Link } from "lucide-react";
import { evidenceApi } from "../api/evidence";
import { useResource } from "../hooks/useResource";
import { ErrorState, Skeleton, QualityBadge, Badges, DataFields } from "./ui";
import type { z } from "zod";
import { traceSchema } from "../contracts";
import { showcaseApi, showcaseEnabled } from "../demo/showcase";
import { formatMs } from "./ui";
const Context = createContext<{ open: (id: string) => void }>({
  open: () => {},
});
export const useEvidence = () => useContext(Context);
export function EvidenceLinks({ ids }: { ids: string[] }) {
  const { open } = useEvidence();
  return (
    <div className="evidence-links">
      {ids.map((id) => (
        <button key={id} className="text-button" onClick={() => open(id)}>
          <Link size={14} />
          {localStorage.getItem("zhicha-pref-evidence") === "false"
            ? "查看 Evidence"
            : id}
        </button>
      ))}
    </div>
  );
}
export function TraceView({ trace }: { trace: z.infer<typeof traceSchema> }) {
  return (
    <>
      <div className="trace-chain">
        {trace.chain.map((node, i) => (
          <div key={i}>
            <strong>{node.level}</strong>
            <p>{node.description ?? "—"}</p>
            <code>{node.reference ?? "—"}</code>
            {i < trace.chain.length - 1 && (
              <span className="trace-arrow">↓</span>
            )}
          </div>
        ))}
      </div>
      <DataFields
        data={{
          versions:
            localStorage.getItem("zhicha-pref-technical") === "false"
              ? "已隐藏版本信息"
              : trace.versions,
          source: trace.source,
          manifest: trace.manifest_ref,
          run_reference: trace.run_ref,
        }}
      />
      <QualityBadge quality={trace.quality} />
    </>
  );
}
function Drawer({ id, close }: { id: string; close: () => void }) {
  const { data, error, loading } = useResource(() => evidenceApi.get(id), [id]);
  const [tab, setTab] = useState("detail");
  const trace = useResource(
    () => (tab === "trace" ? evidenceApi.trace(id) : Promise.resolve(null)),
    [id, tab],
  );
  const context = useResource(
    () =>
      data &&
      showcaseEnabled &&
      data.authenticity.some((t) => t.data_nature === "SYNTHETIC")
        ? showcaseApi.get(data.session_id)
        : Promise.resolve(null),
    [id, data?.session_id],
  );
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const prior = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const handle = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "Tab") {
        const drawerItems = ref.current?.querySelectorAll<HTMLElement>(
          'button, a, input, select, textarea, summary, [tabindex="0"]',
        );
        const items = [
          ...document.querySelectorAll<HTMLElement>(
            ".showcase-guide button:not(:disabled)",
          ),
          ...Array.from(drawerItems ?? []),
        ];
        if (!items.length) return;
        const current=items.indexOf(document.activeElement as HTMLElement);
        e.preventDefault();items[(current+(e.shiftKey?-1:1)+items.length)%items.length].focus();
      }
    };
    document.addEventListener("keydown", handle);
    return () => {
      document.removeEventListener("keydown", handle);
      prior?.focus();
    };
  }, [close]);
  return (
    <div
      className="drawer-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        ref={ref}
        tabIndex={-1}
        className="evidence-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Evidence 回查"
      >
        <header>
          <div>
            <h2>Evidence 回查</h2>
            <small>{id}</small>
          </div>
          <button
            className="icon-button"
            aria-label="关闭 Evidence"
            onClick={close}
          >
            <X />
          </button>
        </header>
        <div className="tabs">
          <button
            className={tab === "detail" ? "active" : ""}
            onClick={() => setTab("detail")}
          >
            证据详情
          </button>
          <button
            className={tab === "trace" ? "active" : ""}
            onClick={() => setTab("trace")}
          >
            证据追溯
          </button>
        </div>
        {loading ? (
          <Skeleton />
        ) : error ? (
          <ErrorState error={error} />
        ) : data && tab === "detail" ? (
          <>
            <Badges tags={data.authenticity} />
            <QualityBadge quality={data.quality} />
            <section className="evidence-summary" aria-label="证据摘要">
              <h3>证据来源与边界</h3>
              <p>
                {data.authenticity
                  .map((t) => t.note)
                  .filter(Boolean)
                  .join("；")}
              </p>
              {context.data && (
                <p>
                  分析窗口：{formatMs(context.data.state.window.start_ms)}–
                  {formatMs(context.data.state.window.end_ms)}（左闭右开）
                </p>
              )}
              {context.loading && showcaseEnabled && <p>正在加载分析窗口…</p>}
              {context.error && <p>分析窗口暂不可回查</p>}
              <p>
                题目：{data.question_id ?? "缺失"} · 匿名参与者{" "}
                {data.student_set.length} 人
              </p>
              <p>
                笔迹引用：
                {data.pen_evidence?.stroke_refs.length
                  ? data.pen_evidence.stroke_refs.join("、")
                  : "未提供"}{" "}
                · 配对视频：
                {data.video_evidence ? "查看下方来源引用" : "未提供"}
              </p>
              <details>
                <summary>
                  事件 ID · {data.pen_evidence?.event_refs.length ?? 0} 条
                </summary>
                <ul>
                  {data.pen_evidence?.event_refs.map((event) => (
                    <li key={event}>
                      <code>{event}</code>
                    </li>
                  ))}
                </ul>
              </details>
            </section>
            <details className="evidence-raw">
              <summary>完整结构与追溯信息</summary>
              <DataFields
                data={{
                  ...data,
                  provenance:
                    localStorage.getItem("zhicha-pref-technical") === "false"
                      ? "已隐藏版本信息"
                      : data.provenance,
                }}
              />
            </details>
          </>
        ) : trace.loading ? (
          <Skeleton />
        ) : trace.error ? (
          <ErrorState error={trace.error} />
        ) : (
          trace.data && <TraceView trace={trace.data} />
        )}
      </div>
    </div>
  );
}
export function EvidenceProvider({ children }: { children: ReactNode }) {
  const [id, setId] = useState<string | null>(null);
  useEffect(() => {
    const clear = () => setId(null);
    window.addEventListener("zhicha-auth-reset", clear);
    window.addEventListener("showcase-close-evidence", clear);
    return () => {
      window.removeEventListener("zhicha-auth-reset", clear);
      window.removeEventListener("showcase-close-evidence", clear);
    };
  }, []);
  return (
    <Context.Provider value={{ open: setId }}>
      {children}
      {id && <Drawer key={id} id={id} close={() => setId(null)} />}
    </Context.Provider>
  );
}
