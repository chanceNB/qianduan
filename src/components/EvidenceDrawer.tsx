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
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const prior = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const handle = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "Tab") {
        const items = ref.current?.querySelectorAll<HTMLElement>(
          'button, a, input, [tabindex="0"]',
        );
        if (!items?.length) return;
        const first = items[0],
          last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
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
            <DataFields
              data={{
                ...data,
                provenance:
                  localStorage.getItem("zhicha-pref-technical") === "false"
                    ? "已隐藏版本信息"
                    : data.provenance,
              }}
            />
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
    return () => window.removeEventListener("zhicha-auth-reset", clear);
  }, []);
  return (
    <Context.Provider value={{ open: setId }}>
      {children}
      {id && <Drawer key={id} id={id} close={() => setId(null)} />}
    </Context.Provider>
  );
}
