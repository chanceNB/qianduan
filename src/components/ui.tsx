import type { ReactNode } from "react";
import {
  FileText,
  Presentation,
  AlertCircle,
  Search,
  UsersRound,
  Database,
} from "lucide-react";
import { ApiError } from "../api/client";
import type { Quality, Authenticity, Availability } from "../contracts";
export function EmptyState({
  title,
  description,
  icon = "file",
  action,
}: {
  title: string;
  description?: ReactNode;
  icon?: "file" | "class" | "student" | "database";
  action?: ReactNode;
}) {
  const Icon =
    icon === "class"
      ? Presentation
      : icon === "student"
        ? UsersRound
        : icon === "database"
          ? Database
          : FileText;
  return (
    <div className="empty-state">
      <Icon size={54} strokeWidth={1.2} />
      <strong>{title}</strong>
      {description && <div className="empty-description">{description}</div>}
      {action}
    </div>
  );
}
const errors: Record<string, string> = {
  INVALID_REQUEST: "请求参数无效",
  UNAUTHENTICATED: "登录已失效",
  FORBIDDEN: "无权限访问",
  NOT_FOUND: "暂无数据 / 资源不存在",
  VERSION_MISMATCH: "版本不兼容，请刷新或联系维护人员",
  INVALID_SCHEMA: "数据结构不符合契约",
  NOT_COMPUTABLE: "不可计算",
  INSUFFICIENT_EVIDENCE: "证据不足 / 暂不可回查",
  MISSING_INPUT: "缺少必要输入",
  INTERNAL_ERROR: "服务暂不可用",
};
export function ErrorState({
  error,
  retry,
}: {
  error: unknown;
  retry?: () => void;
}) {
  const e = error instanceof ApiError ? error : null;
  return (
    <div className="error-state" role="alert">
      <AlertCircle size={34} />
      <strong>{errors[e?.code ?? "INTERNAL_ERROR"]}</strong>
      <p>{e?.message ?? "请稍后重试"}</p>
      {e && <small>request_id: {e.requestId}</small>}
      {retry && e?.retryable && (
        <button className="soft-button" onClick={retry}>
          重试
        </button>
      )}
    </div>
  );
}
export function Skeleton({
  rows = 3,
  decorative = false,
}: {
  rows?: number;
  decorative?: boolean;
}) {
  return (
    <div
      className="skeleton-stack"
      aria-label={decorative ? undefined : "正在加载"}
      role={decorative ? undefined : "status"}
      aria-hidden={decorative || undefined}
    >
      {Array.from({ length: rows }, (_, i) => (
        <div className="skeleton-row" key={i}>
          <span />
          <div>
            <i />
            <i />
          </div>
        </div>
      ))}
    </div>
  );
}
export function Card({
  title,
  children,
  className = "",
}: {
  title?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`card ${className}`}>
      {title && <h2>{title}</h2>}
      {children}
    </section>
  );
}
export function PageTitle({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <header className="page-title">
      <h1>{title}</h1>
      {description && <p>{description}</p>}
    </header>
  );
}
export function QualityBadge({ quality }: { quality: Quality }) {
  const showDetails = localStorage.getItem("zhicha-pref-quality") !== "false";
  return (
    <div className={`quality ${quality.availability.toLowerCase()}`}>
      <span>
        {
          {
            AVAILABLE: "可用",
            PARTIAL: "数据部分可用",
            UNAVAILABLE: "暂不可用",
            NOT_COMPUTABLE: "不可计算",
          }[quality.availability]
        }
      </span>
      {quality.reason && <small>{quality.reason}</small>}
      {showDetails && quality.flags.length > 0 && (
        <small>{quality.flags.join(" · ")}</small>
      )}
    </div>
  );
}
export function Badges({ tags }: { tags: Authenticity[] }) {
  const compact = localStorage.getItem("zhicha-pref-authenticity") === "false";
  return (
    <div className="badges">
      {tags.map((tag) => (
        <span
          className="badge"
          key={tag.data_nature}
          title={tag.note ?? undefined}
        >
          {compact ? tag.data_nature : tag.label}
        </span>
      ))}
    </div>
  );
}
export function MetricValue({
  value,
  availability,
}: {
  value: string | number | null;
  availability: Availability | "UNKNOWN" | "INSUFFICIENT_EVIDENCE";
}) {
  const text =
    availability === "NOT_COMPUTABLE"
      ? "不可计算"
      : availability === "UNAVAILABLE"
        ? "暂不可用"
        : availability === "UNKNOWN"
          ? "未知 / 待确认"
          : availability === "INSUFFICIENT_EVIDENCE"
            ? "证据不足"
            : value === null
              ? "—"
              : String(value);
  return <span>{text}</span>;
}
export function SearchField({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <label className="search-field">
      <Search size={16} />
      <input
        aria-label={placeholder}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
export function DataFields({ data }: { data: Record<string, unknown> }) {
  return (
    <dl className="data-fields">
      {Object.entries(data).map(([key, value]) => (
        <div key={key}>
          <dt>{key}</dt>
          <dd>
            {value === null ? (
              "—"
            ) : typeof value === "object" ? (
              <pre>{JSON.stringify(value, null, 2)}</pre>
            ) : value === "UNKNOWN" ? (
              "未知 / 待确认"
            ) : (
              String(value)
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}
export function formatMs(value: number) {
  return `${Math.floor(value / 60000)
    .toString()
    .padStart(2, "0")}:${Math.floor((value % 60000) / 1000)
    .toString()
    .padStart(2, "0")}`;
}
