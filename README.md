# 智察课堂 2.0

教师端 UI 与版本化 API 前端。默认开发模式为空数据，演示数据只通过专门的 Mock 场景启用。

```powershell
npm ci
npm run dev -- --port 4173 --strictPort
```

打开 http://127.0.0.1:4173 。Mock 登录账号：`teacher_demo`，密码：`mock-password`。科研工作区使用 `researcher_demo`，密码相同。`student_demo` 用于验证教师工作区的 403。

## 演示场景

```powershell
npm run dev:demo
```

打开 http://127.0.0.1:4174 ，相同 Mock 账号；显示带 DEMO 标签的课堂、学生、Evidence 与复盘结果。

`.env.development` 默认 `VITE_MOCK_SCENARIO=empty`。其他可选值：`demo_happy_path`、`demo_missing_vision`、`demo_not_computable`、`demo_insufficient_evidence`、`demo_version_mismatch`。修改环境文件后重启 Vite。

## Real 模式

`.env.production` 使用 `VITE_API_MODE=real`、`VITE_API_BASE_URL=/api/v1`。后端需提供同构 envelope/DTO、Bearer 鉴权及对应 CORS 或同域反向代理。部署宿主需将前端路由回退到 index.html。

```powershell
npm run build
```

产物位于 `dist/`。页面只调用 `src/api`，Mock 位于 transport 层；真实后端尚未联调。契约缺口集中标注 `CONTRACT_GAP`，可能需要 adapter 配合最终 R3 格式。

## 验证

```powershell
npm test
npm run lint
npm run typecheck
npm run build
```

本次 44 项测试通过。接口结构以 `src/contracts/` 为准；交付验收报告和视觉对照保存在本地 `docs/` 目录，不纳入源码推送。
