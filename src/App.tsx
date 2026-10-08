import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./components/AuthProvider";
import { EvidenceProvider } from "./components/EvidenceDrawer";
import { AppShell } from "./layouts/AppShell";
import { Login } from "./pages/Login";
import { Home } from "./pages/Home";
import { Classroom, SessionWorkspace } from "./pages/Classroom";
import { Students } from "./pages/Students";
import { AI } from "./pages/AI";
import { Research } from "./pages/Research";
import { Settings } from "./pages/Settings";
import { Skeleton, ErrorState } from "./components/ui";
import { ApiError } from "./api/client";
import { canAccess } from "./routes/permissions";
import {
  DemoStudent,
  ResearchShowcase,
} from "./components/showcase/DemoStudentResearch";
function Protected({
  area = "home",
}: {
  area?: Parameters<typeof canAccess>[1];
}) {
  const { user, bootstrap, loading, error } = useAuth();
  if (loading) return <Skeleton />;
  if (error) return <ErrorState error={error} />;
  if (!user || !bootstrap) return <Navigate to="/login" replace />;
  if (!canAccess(user.role, area, bootstrap.features))
    return (
      <ErrorState
        error={
          new ApiError(
            "FORBIDDEN",
            "当前身份或功能开关不允许访问该工作区",
            403,
            "route-guard",
          )
        }
      />
    );
  return <Outlet />;
}
export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <EvidenceProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<Protected />}>
              <Route element={<AppShell />}>
                <Route path="/" element={<Navigate to="/home" replace />} />
                <Route path="/home" element={<Home />} />
                <Route path="/home/recent" element={<Home />} />
                <Route element={<Protected area="teacher" />}>
                  <Route path="/classroom" element={<Classroom />} />
                  <Route path="/classroom/recent" element={<Classroom />} />
                  <Route
                    path="/classroom/:sessionId/:tab"
                    element={<SessionWorkspace />}
                  />
                  <Route path="/students" element={<Students />} />
                  <Route path="/demo/student" element={<DemoStudent />} />
                  <Route
                    path="/demo/research/:section"
                    element={<ResearchShowcase />}
                  />
                </Route>
                <Route element={<Protected area="ai" />}>
                  <Route path="/ai" element={<AI />} />
                </Route>
                <Route element={<Protected area="research" />}>
                  <Route
                    path="/research"
                    element={<Navigate to="/research/datasets" replace />}
                  />
                  <Route path="/research/:section" element={<Research />} />
                </Route>
                <Route
                  path="/settings"
                  element={<Navigate to="/settings/account" replace />}
                />
                <Route path="/settings/:section" element={<Settings />} />
                <Route
                  path="*"
                  element={
                    <ErrorState
                      error={
                        new ApiError("NOT_FOUND", "页面不存在", 404, "route")
                      }
                    />
                  }
                />
              </Route>
            </Route>
          </Routes>
        </EvidenceProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
