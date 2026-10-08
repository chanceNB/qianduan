import { useState } from "react";
import { useParams } from "react-router-dom";
import { Database, Tag, ShieldCheck } from "lucide-react";
import { researchApi } from "../api/research";
import { useResource } from "../hooks/useResource";
import { useGlobalSearch } from "../layouts/AppShell";
import {
  PageTitle,
  Card,
  EmptyState,
  ErrorState,
  Skeleton,
  SearchField,
  DataFields,
  Badges,
} from "../components/ui";
import { EvidenceLinks, TraceView } from "../components/EvidenceDrawer";
type ResearchItem = Record<string, unknown>;
const sections: Record<
  string,
  {
    title: string;
    description: string;
    load: () => Promise<{ items: ResearchItem[] }>;
    id: string;
  }
> = {
  datasets: {
    title: "数据集",
    description: "查看可回查的数据来源、版本、切分与真实性信息",
    load: researchApi.datasets,
    id: "dataset_id",
  },
  models: {
    title: "模型",
    description: "查看模型版本、任务与局限；Fusion 仅展示接口 / 原型状态",
    load: researchApi.models,
    id: "model_id",
  },
  experiments: {
    title: "实验",
    description: "查看 Baseline、实验版本与可追溯 Run",
    load: researchApi.experiments,
    id: "experiment_id",
  },
  "failure-cases": {
    title: "失败案例",
    description: "查看可追溯的失败现象、预期与实际结果",
    load: researchApi.failures,
    id: "case_id",
  },
};
export function Research() {
  const { section = "datasets" } = useParams();
  const config = sections[section];
  const [search, setSearch] = useState("");
  const global = useGlobalSearch();
  const [selected, setSelected] = useState("");
  const [source, setSource] = useState("");
  const [version, setVersion] = useState("");
  const [truth, setTruth] = useState("");
  const list = useResource(
    () => (config ? config.load() : Promise.resolve({ items: [] })),
    [section],
  );
  const [traceInput, setTraceInput] = useState("");
  const [traceId, setTraceId] = useState("");
  const trace = useResource(
    () => (traceId ? researchApi.trace(traceId) : Promise.resolve(null)),
    [traceId],
  );
  const items = list.data?.items ?? [];
  const filtered = items.filter(
    (item) =>
      JSON.stringify(item)
        .toLowerCase()
        .includes((search || global).toLowerCase()) &&
      (section !== "datasets" ||
        ((!source || item.source_type === source) &&
          (!version || item.version === version) &&
          (!truth || JSON.stringify(item.authenticity ?? []).includes(truth)))),
  );
  const detail = config
    ? filtered.find((item) => item[config.id] === selected)
    : null;
  if (section === "evidence-trace")
    return (
      <>
        <PageTitle
          title="证据追溯"
          description="Sensor Fact → Observable Event → Derived Pattern → Evidence Package → Teaching Hypothesis"
        />
        <Card title="Evidence 回查">
          <form
            className="trace-search"
            onSubmit={(e) => {
              e.preventDefault();
              setTraceId(traceInput.trim());
            }}
          >
            <input
              required
              aria-label="Evidence ID"
              placeholder="输入 Evidence ID"
              value={traceInput}
              onChange={(e) => setTraceInput(e.target.value)}
            />
            <button className="primary-button">追溯证据</button>
          </form>
          {trace.loading ? (
            <Skeleton />
          ) : trace.error ? (
            <ErrorState error={trace.error} />
          ) : trace.data ? (
            <TraceView trace={trace.data} />
          ) : (
            <EmptyState
              title="请输入可回查的 Evidence ID"
              description="查看证据链、版本、来源、质量与 Manifest / Run 引用"
            />
          )}
        </Card>
      </>
    );
  if (!config) return <ErrorState error={new Error("未知科研页面")} />;
  return (
    <>
      <PageTitle title={config.title} description={config.description} />
      {section === "datasets" && (
        <div className="filter-row">
          {[
            {
              label: "数据来源",
              icon: Database,
              value: source,
              set: setSource,
              values: [...new Set(items.map((i) => String(i.source_type)))],
            },
            {
              label: "版本",
              icon: Tag,
              value: version,
              set: setVersion,
              values: [...new Set(items.map((i) => String(i.version)))],
            },
            {
              label: "真实性",
              icon: ShieldCheck,
              value: truth,
              set: setTruth,
              values: [
                "TEAM_COLLECTED_PEN",
                "OPEN_DATA_MODEL",
                "CSTUDENTACT",
                "DEMO",
                "SYNTHETIC",
                "REAL_PAIRED",
              ],
            },
          ].map(({ label, icon: Icon, value, set, values }) => (
            <label className="filter" key={label}>
              <Icon size={17} />
              <select
                aria-label={label}
                value={value}
                onChange={(e) => set(e.target.value)}
              >
                <option value="">{label}</option>
                {values.map((v) => (
                  <option value={v} key={v}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
      )}
      {list.error ? (
        <ErrorState error={list.error} retry={list.reload} />
      ) : (
        <div className="research-workspace split-panel">
          <Card
            title={
              <>
                {config.title}列表{" "}
                <span className="count">{list.data?.items.length ?? "—"}</span>
              </>
            }
          >
            <SearchField
              value={search}
              onChange={setSearch}
              placeholder={`搜索已加载的${config.title}名称…`}
            />
            {list.loading ? (
              <Skeleton />
            ) : filtered.length ? (
              filtered.map((item) => (
                <button
                  className={`list-row ${selected === item[config.id] ? "selected" : ""}`}
                  key={String(item[config.id])}
                  onClick={() => setSelected(String(item[config.id]))}
                >
                  <Database size={20} />
                  {String(item.name ?? item.description ?? item[config.id])}
                </button>
              ))
            ) : (
              <>
                <Skeleton rows={3} decorative />
                <p className="quiet-empty">暂无{config.title}数据</p>
              </>
            )}
          </Card>
          <Card title={`${config.title}详情`}>
            {detail ? (
              <>
                <DataFields
                  data={Object.fromEntries(
                    Object.entries(detail).filter(
                      ([key]) => key !== "authenticity",
                    ),
                  )}
                />
                {Array.isArray(detail.authenticity) && (
                  <Badges
                    tags={
                      detail.authenticity as Parameters<
                        typeof Badges
                      >[0]["tags"]
                    }
                  />
                )}{" "}
                {typeof detail.evidence_id === "string" && (
                  <EvidenceLinks ids={[detail.evidence_id]} />
                )}
              </>
            ) : (
              <div className="detail-placeholder">
                <EmptyState
                  icon="database"
                  title={`请选择一个${config.title}`}
                  description={`从左侧列表中选择一个${config.title}，查看详细信息。`}
                />
              </div>
            )}
          </Card>
        </div>
      )}
    </>
  );
}
