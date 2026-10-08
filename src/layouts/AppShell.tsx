import { useState, createContext, useContext } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  Presentation,
  UserRound,
  Network,
  NotebookText,
  Settings,
  Search,
  SlidersHorizontal,
  Bell,
  X,
  RotateCcw,
  Database,
  Box,
  FlaskConical,
  Link,
  ShieldCheck,
  PanelRight,
  UsersRound,
  Info,
} from "lucide-react";
import { EmptyState } from "../components/ui";
import { useAuth } from "../components/AuthProvider";
import { showcaseEnabled } from "../demo/showcase";
import { Guide } from "../components/showcase/Guide";
const primary = [
  { path: "/home", label: "首页", icon: Home },
  { path: "/classroom", label: "课堂", icon: Presentation },
  { path: "/students", label: "学生", icon: UserRound },
  { path: "/ai", label: "AI", icon: Network },
  { path: "/research", label: "Research", icon: NotebookText },
  { path: "/settings", label: "设置", icon: Settings },
];
const secondary: Record<
  string,
  { title: string; items: { path: string; label: string; icon: typeof Home }[] }
> = {
  research: {
    title: "科研实验室",
    items: [
      { path: "/research/datasets", label: "数据集", icon: Database },
      { path: "/research/models", label: "模型", icon: Box },
      { path: "/research/experiments", label: "实验", icon: FlaskConical },
      {
        path: "/research/failure-cases",
        label: "失败案例",
        icon: FlaskConical,
      },
      { path: "/research/evidence-trace", label: "证据追溯", icon: Link },
    ],
  },
  settings: {
    title: "设置",
    items: [
      { path: "/settings/account", label: "账户与身份", icon: UserRound },
      { path: "/settings/preferences", label: "界面偏好", icon: Box },
      { path: "/settings/privacy", label: "数据与隐私", icon: ShieldCheck },
      { path: "/settings/system", label: "系统信息", icon: Info },
    ],
  },
  home: {
    title: "首页",
    items: [
      { path: "/home", label: "工作台总览", icon: Home },
      { path: "/home/recent", label: "最近访问", icon: Presentation },
    ],
  },
  classroom: {
    title: "课堂",
    items: [
      { path: "/classroom", label: "全部课堂", icon: Presentation },
      { path: "/classroom/recent", label: "最近课堂", icon: Presentation },
    ],
  },
  students: {
    title: "学生",
    items: [{ path: "/students", label: "学生过程", icon: UsersRound }],
  },
  ai: {
    title: "AI",
    items: [{ path: "/ai", label: "AI 复盘与备课", icon: Network }],
  },
};
const SearchContext = createContext("");
export const useGlobalSearch = () => useContext(SearchContext);
export function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const module = location.pathname.startsWith("/demo/research/")
    ? "research-showcase"
    : location.pathname.startsWith("/demo/student")
      ? "students"
      : location.pathname.split("/")[1];
  const config = secondary[module] ?? secondary.home;
  const expanded = module === "research" || module === "settings";
  const [activity, setActivity] = useState(!showcaseEnabled);
  const [search, setSearch] = useState("");
  const { user, bootstrap } = useAuth();
  return (
    <SearchContext.Provider value={search}>
      <div
        className={`app-shell ${expanded ? "expanded" : ""} ${activity && module !== "settings" ? "with-activity" : ""}`}
      >
        <aside className="primary-rail">
          <NavLink className="brand" to="/home">
            <img src="/assets/logo.png" alt="" />
            <strong>智察课堂 2.0</strong>
          </NavLink>
          <nav>
            {primary
              .filter(
                (item) =>
                  item.path !== "/ai" || bootstrap?.features.teacher_agent,
              )
              .filter(
                (item) =>
                  item.path !== "/research" || bootstrap?.features.research_lab,
              )
              .map(({ path, label, icon: Icon }) => (
                <NavLink
                  key={path}
                  to={
                    showcaseEnabled &&
                    user?.role === "TEACHER" &&
                    path === "/research"
                      ? "/demo/research/datasets?session=demo_session_001"
                      : path
                  }
                  aria-label={label}
                  title={label}
                  className={({ isActive }) => (isActive ? "active" : "")}
                >
                  <Icon size={20} />
                  <span>{label}</span>
                </NavLink>
              ))}
          </nav>
          <button
            className="avatar"
            aria-label="当前账户"
            onClick={() => navigate("/settings/account")}
          >
            {user?.role === "TEACHER"
              ? "T"
              : user?.role === "RESEARCHER"
                ? "R"
                : "S"}
          </button>
        </aside>
        <aside className="secondary-sidebar">
          <h2>{config.title}</h2>
          <nav>
            {config.items.map(({ path, label, icon: Icon }) => (
              <NavLink
                key={path}
                to={path}
                aria-label={label}
                title={label}
                end
                className={({ isActive }) => (isActive ? "active" : "")}
              >
                <Icon size={18} />
                {label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <div className="main-column">
          <header className="topbar">
            {showcaseEnabled && (
              <span className="showcase-runtime-label">DEMO / SYNTHETIC</span>
            )}
            <label className="global-search">
              <Search size={18} />
              <input
                aria-label="搜索当前已加载数据"
                placeholder="搜索课堂、学生、题目或 Evidence..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button aria-label="清除搜索" onClick={() => setSearch("")}>
                  <X size={14} />
                </button>
              )}
            </label>
            <button
              className="icon-button"
              title="界面偏好"
              onClick={() => navigate("/settings/preferences")}
            >
              <SlidersHorizontal size={20} />
            </button>
            <button
              className="icon-button notification"
              title="最近动态"
              onClick={() => setActivity((x) => !x)}
            >
              <Bell size={22} />
              <i />
            </button>
            {!activity && (
              <button
                className="icon-button"
                aria-label="打开最近动态"
                onClick={() => setActivity(true)}
              >
                <PanelRight size={20} />
              </button>
            )}
          </header>
          <main className="workspace">
            <Guide />
            <Outlet />
          </main>
        </div>
        {activity && module !== "settings" && (
          <aside className="activity-panel">
            <header>
              <strong>最近动态</strong>
              <button
                className="icon-button"
                aria-label="关闭最近动态"
                onClick={() => setActivity(false)}
              >
                <X size={18} />
              </button>
            </header>
            <div className="activity-filter">
              <select aria-label="动态类型">
                <option>全部动态</option>
              </select>
              <button
                className="icon-button"
                aria-label="刷新动态空态"
                onClick={() => setActivity(true)}
              >
                <RotateCcw size={15} />
              </button>
            </div>
            <EmptyState
              title="暂无动态"
              description={`${module === "home" ? "后续" : module === "classroom" ? "课堂" : module === "students" ? "学生过程" : module === "ai" ? "AI 复盘" : module === "research" ? "Research" : "对应模块"}操作记录将在这里显示`}
            />
          </aside>
        )}
      </div>
    </SearchContext.Provider>
  );
}
