# 独立静态部署与本地运行

## 两种构建

```sh
npm ci
npm run build
npm run build:showcase
```

生产 `build` 仍使用原配置、输出 `dist`。比赛 `build:showcase` 使用独立 vite.showcase.config.ts，明确固定 Mock、/mock-api/v1、demo_happy_path，输出 `dist-showcase`；继承的环境变量不能切换为 Real API。没有后台、数据库、外部 LLM 或核心 CDN 依赖。构建前需已安装项目依赖；离线运行不等于离线安装依赖。

## 本地静态服务

在仓库根目录运行：

```sh
npm run preview:showcase
```

访问 `http://127.0.0.1:4186/home`，账号 teacher_demo、密码 mock-password。退出服务器使用 Ctrl+C。PORT 可指定其他端口。服务器绑定回环地址，不自动公开网站。

Node 静态服务对不存在且没有扩展名的路径返回 index.html，支持课堂、AI、学生和研究深层路由刷新；真正缺失的静态资产返回 404。标准 HTML/JS/CSS MIME 已设置。不要双击 file:// index.html；ES 模块和路由需要 HTTP 服务。

## 静态托管

发布目录为 `dist-showcase`，部署到域名根路径。本轮没有实际发布。比赛产物包含：

- `_redirects`：支持此规则的平台将 `/*` 回退 `/index.html 200`，例如发布目录规则方式的托管服务。
- `vercel.json`：可在以产物目录为项目根的部署中使用其 rewrites；仓库集成部署时须在托管平台项目根配置相同回退，并设置输出目录为 dist-showcase。
- 其他平台：开启 SPA fallback；Nginx 可用 `try_files $uri $uri/ /index.html;`。不要把缺失 JS 也当成 HTML 返回。

子路径托管不是本轮默认配置；需要另行调整 base 与路由 basename 后验收。不要混发 dist 和 dist-showcase。

## 离线比赛

提前准备 Node、仓库静态服务脚本和完整 dist-showcase，确认在线构建成功。现场保持本地服务器运行，关闭外网后仍以 localhost HTTP 打开。所有核心图片、脚本、样式和 Mock 数据在本地；审核只存当前浏览器，不跨设备同步。

额外网络隔离模拟（PowerShell，新终端）：

```powershell
$env:PORT='4187'
$env:SHOWCASE_OFFLINE_CHECK='1'
npm run preview:showcase
```

该开关施加 CSP：只允许本地来源资源，connect-src none 禁止网络连接；用于验证演示不需要真实 API/外部服务。它不是操作系统物理断网。本轮此模式完整走通，实际断网设备彩排仍须执行。关闭该终端后不影响其他终端的环境。

本地服务打印请求路径，验收可检查有无 /api、远端依赖或资源失败。构建产物 Mock 登录和权限仅为演示；不用于生产鉴权。
