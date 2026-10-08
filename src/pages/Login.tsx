import { useState, type FormEvent } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import {
  UserRound,
  LockKeyhole,
  Eye,
  EyeOff,
  GraduationCap,
  Brain,
  FlaskConical,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "../components/AuthProvider";
import { ErrorState } from "../components/ui";
export function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [notice, setNotice] = useState("");
  if (user) return <Navigate to="/home" replace />;
  async function submit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(username, password, remember);
      navigate("/home", { replace: true });
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="login-page">
      <div className="login-story">
        <div className="login-brand">
          <img src="/assets/logo.png" alt="智察课堂标志" />
          <div>
            <h1>智察课堂 2.0</h1>
            <p>用数据看见真实的课堂</p>
          </div>
        </div>
        <p className="login-motto">让每一次教学都有证据可循</p>
        <div className="login-values">
          <div>
            <Brain />
            <span>真实数据</span>
          </div>
          <div>
            <FlaskConical />
            <span>过程追踪</span>
          </div>
          <div>
            <ShieldCheck />
            <span>教学改进</span>
          </div>
        </div>
      </div>
      <section className="login-card">
        <h2>欢迎登录</h2>
        <p>智察课堂 2.0 教师端</p>
        <form onSubmit={submit}>
          <label className="login-input">
            <UserRound size={20} />
            <input
              autoComplete="username"
              required
              placeholder="请输入账号"
              aria-label="账号"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </label>
          <label className="login-input">
            <LockKeyhole size={20} />
            <input
              type={visible ? "text" : "password"}
              autoComplete="current-password"
              required
              placeholder="请输入密码"
              aria-label="密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              aria-label={visible ? "隐藏密码" : "显示密码"}
              onClick={() => setVisible((x) => !x)}
            >
              {visible ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </label>
          <div className="login-options">
            <label>
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              记住我
            </label>
            <button
              className="text-button"
              type="button"
              onClick={() =>
                setNotice("请联系学校管理员。当前版本未提供密码重置接口。")
              }
            >
              忘记密码？
            </button>
          </div>
          <button className="primary-button login-submit" disabled={loading}>
            {loading ? "登录中…" : "登录"}
          </button>
        </form>
        {error !== null && <ErrorState error={error} />}
        <div className="login-divider">
          <span>或使用以下方式登录</span>
        </div>
        <button
          className="soft-button school-login"
          onClick={() =>
            setNotice("学校统一身份认证尚未接入，请使用账号密码登录。")
          }
        >
          <GraduationCap size={26} />
          学校统一身份认证
        </button>
        {notice && (
          <p role="status" className="login-notice">
            {notice}
          </p>
        )}
        <small className="login-version">智察课堂 2.0 v0.1</small>
      </section>
    </div>
  );
}
