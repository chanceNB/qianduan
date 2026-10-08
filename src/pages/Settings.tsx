import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  UserRound,
  ShieldCheck,
  LockKeyhole,
  CheckCircle2,
  LogOut,
  Info,
} from "lucide-react";
import { useAuth } from "../components/AuthProvider";
import { apiMode } from "../api/runtime";
import { PageTitle, Card, DataFields, ErrorState } from "../components/ui";
import { ResetDemo } from "../components/showcase/Guide";
const prefs = [
  ["density", "内容密度"],
  ["authenticity", "完整真实性标签"],
  ["quality", "质量详情显示"],
  ["evidence", "Evidence ID 显示"],
  ["technical", "技术版本信息显示"],
];
export function Settings() {
  const { section = "account" } = useParams();
  const { user, bootstrap, logout } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);
  const [preferences, setPreferences] = useState(() =>
    Object.fromEntries(
      prefs.map(([key]) => [
        key,
        localStorage.getItem(`zhicha-pref-${key}`) ??
          (key === "density" ? "comfortable" : "true"),
      ]),
    ),
  );
  async function exit() {
    setBusy(true);
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  if (section === "preferences")
    return (
      <>
        <PageTitle
          title="界面偏好"
          description="此设备的显示偏好，仅保存在本地"
        />
        <Card>
          {prefs.map(([key, label]) => (
            <label key={key} className="preference-row">
              <span>{label}</span>
              {key === "density" ? (
                <select
                  value={preferences[key]}
                  aria-label={label}
                  onChange={(e) => {
                    setPreferences((p) => ({ ...p, [key]: e.target.value }));
                    localStorage.setItem(`zhicha-pref-${key}`, e.target.value);
                    document.documentElement.dataset.density = e.target.value;
                  }}
                >
                  <option value="comfortable">舒适</option>
                  <option value="compact">紧凑</option>
                </select>
              ) : (
                <input
                  type="checkbox"
                  checked={preferences[key] === "true"}
                  onChange={(e) => {
                    const value = String(e.target.checked);
                    setPreferences((p) => ({ ...p, [key]: value }));
                    localStorage.setItem(`zhicha-pref-${key}`, value);
                  }}
                />
              )}
            </label>
          ))}
        </Card>
      </>
    );
  if (section === "privacy")
    return (
      <>
        <PageTitle
          title="数据与隐私"
          description="数据来源、真实性与产品边界"
        />
        <Card title="来源真实性">
          <DataFields
            data={{
              "TEAM-COLLECTED PEN DATA": "团队采集点阵过程",
              "OPEN-DATA MODEL": "公开标注数据训练 / 评估模型",
              CStudentAct: "研究申请 / 授权数据来源",
              "DEMO CLASS SCENARIO": "仅用于前端流程演示",
              SYNTHETIC: "仿真数据，不能视为真实学生效果证据",
              REAL_PAIRED: "同一 Session、同一 Task Segment 的可靠真实配对",
            }}
          />
        </Card>
        <Card title="隐私与决策边界">
          <p>
            不做人脸识别，不做心理标签，不做专注度排名，不自动代替教师决策。
          </p>
          <p>只展示授权范围内的匿名过程与 Evidence。权限由后端决定。</p>
        </Card>
      </>
    );
  if (section === "system")
    return (
      <>
        <PageTitle title="系统信息" description="当前版本与接口状态（只读）" />
        <Card>
          <DataFields
            data={{
              "Frontend Version": "0.1.0",
              "API Version": bootstrap?.api_version ?? null,
              "当前 API Mode": apiMode,
              "Fusion Status": bootstrap?.fusion_status ?? null,
              "Build Info": import.meta.env.MODE,
            }}
          />
          <p className="section-caption">
            Fusion 当前为接口 / 原型状态，未提供正式训练指标。
          </p>
        </Card>
      </>
    );
  if (section !== "account")
    return <ErrorState error={new Error("未知设置页面")} />;
  return (
    <>
      <PageTitle title="账户与身份" description="查看当前登录身份与授权范围" />
      <div className="account-grid">
        <Card title="账户信息">
          <div className="account-avatar">
            <UserRound size={52} fill="#bdc9cf" />
          </div>
          <DataFields
            data={{
              显示名称: user?.display_name ?? null,
              "用户 ID": user?.user_id ?? null,
              当前角色: user
                ? {
                    TEACHER: "教师",
                    STUDENT: "学生",
                    RESEARCHER: "研究员",
                    ADMIN: "管理员",
                  }[user.role]
                : null,
            }}
          />
        </Card>
        <Card
          title={
            <>
              <ShieldCheck size={21} />
              当前权限
            </>
          }
        >
          <p className="section-caption">根据当前身份、系统配置及后端权限</p>
          <div className="permissions-grid">
            <div className="allowed">
              <h3>
                <CheckCircle2 size={17} />
                可访问
              </h3>
              {(user?.role === "TEACHER"
                ? [
                    "授权课堂聚合",
                    "相关匿名学生过程",
                    "Evidence",
                    ...(bootstrap?.features.teacher_agent ? ["AI 复盘"] : []),
                  ]
                : user?.role === "RESEARCHER"
                  ? ["脱敏 Research 数据", "证据追溯"]
                  : ["自己的课堂 / 过程 / 反馈"]
              ).map((item) => (
                <p key={item}>{item}</p>
              ))}
            </div>
            <div className="denied">
              <h3>
                <LockKeyhole size={17} />
                不可访问
              </h3>
              {["未授权班级", "身份映射表", "原始敏感视频", "其他受限数据"].map(
                (item) => (
                  <p key={item}>{item}</p>
                ),
              )}
            </div>
          </div>
        </Card>
      </div>
      <Card className="account-actions">
        <ResetDemo />
        <div>
          <h3>
            账户操作 <small>退出登录后将返回登录页面</small>
          </h3>
          <button className="logout-button" disabled={busy} onClick={exit}>
            <LogOut size={20} />
            退出登录
          </button>
        </div>
        <aside>
          <Info size={16} />
          <div>
            提示<p>为确保数据安全，建议在使用完毕后及时退出登录。</p>
          </div>
        </aside>
      </Card>
      {error && <ErrorState error={error} />}
    </>
  );
}
