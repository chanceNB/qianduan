import { useNavigate, useLocation } from "react-router-dom";
import { Presentation, Clipboard, UsersRound, ScanLine } from "lucide-react";
import { Card, EmptyState } from "../components/ui";
import { useAuth } from "../components/AuthProvider";
export function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const recent = useLocation().pathname.endsWith("/recent");
  return (
    <div className="home-page">
      {!recent && (
        <>
          <section className="welcome-banner">
            <h1>
              下午好，{user?.display_name ?? "—"} <span>👋</span>
            </h1>
            <p>用数据看见课堂，让教学更有依据。</p>
          </section>
          <div className="navigation-cards">
            {[
              {
                icon: Presentation,
                title: "课堂分析",
                description: "进入课堂，查看整体情况",
                path: "/classroom",
              },
              {
                icon: Clipboard,
                title: "关键节点",
                description: "定位值得关注的过程时刻",
                path: "/classroom",
              },
              {
                icon: UsersRound,
                title: "学生过程",
                description: "了解学生作答与修改轨迹",
                path: "/students",
              },
              {
                icon: ScanLine,
                title: "AI 复盘与备课",
                description: "生成课堂回顾与下一课建议",
                path: "/ai",
              },
            ].map(({ icon: Icon, title, description, path }, i) => (
              <button
                key={title}
                className="navigation-card"
                onClick={() => navigate(path)}
              >
                <div className={`entry-icon entry-${i}`}>
                  <Icon size={32} />
                </div>
                <h2>{title}</h2>
                <p>{description}</p>
              </button>
            ))}
          </div>
        </>
      )}
      <Card title="最近访问" className="recent-card">
        <EmptyState
          icon="class"
          title="暂无最近访问"
          description="你访问过的课堂、学生或题目会显示在这里"
        />
      </Card>
    </div>
  );
}
