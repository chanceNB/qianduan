# TASK-ZC-SHOWCASE-S4 交付报告

日期：2026-10-08（Asia/Shanghai）

`STAGE_REACHED = S4_IMPLEMENTED_PENDING_REVIEW`

## Git、基线与边界

- 已验收 S3-B：`a21d648a85e170a8c485d647f2b10ebfd3dd80d2`。
- 分支：`codex/zhicha-showcase-v0.1`。
- S4 实现、测试、脚本和截图提交：`94df77d61c06a070bd39a9cebb6514449ac39682`。本报告由随后的文档提交交付，最终回复提供包含报告的 HEAD SHA。
- main 仍为 `ab63c0878aea6201a2fe8e8102dd8212718b70f8`。没有推送、合并或正式发布。
- 对照基线：生产 contracts、权限文件、S1 fixture/calculations、S3-A reportEngine 均无修改。没有新增依赖、后端、数据库、LLM、训练或 R4-PREP-04。

## 功能与实现文件

| 文件 | 功能 |
| --- | --- |
| `src/demo/guide.ts`（新增） | 六步状态/默认上下文、路由生成、持久化、隔离重置 |
| `src/components/showcase/Guide.tsx`（新增） | 首页开始入口、确认重置、当前步骤/说明、前进后退/退出、自由探索/继续 |
| `src/pages/Home.tsx` | 一句话定位与开始/重置入口，保留原导航卡片 |
| `src/pages/Settings.tsx` | 账户设置页重置入口，原偏好及退出行为保留 |
| `src/pages/Login.tsx` | Demo 下明确合成演示来源，正常登录文案保留 |
| `src/layouts/AppShell.tsx` | 仅教师 Demo 挂载引导；全 Demo 的持续来源标记 |
| `src/components/showcase/Q5Showcase.tsx` | 课堂专用上下文通知，当前 full/time/student 与引导及刷新 URL 同步 |
| `src/components/EvidenceDrawer.tsx` | 引导跳转时关闭旧证据；显式循环引导/抽屉的键盘焦点 |
| `src/styles/showcase.css` | 沿用白绿风格、引导面板、按钮、窄屏来源标记与抽屉避让 |
| `vite.showcase.config.ts`（新增） | 独立强制 Mock 构建、dist-showcase、SPA 托管规则产物 |
| `scripts/serve-showcase.mjs`（新增） | 回环 HTTP 静态服务、MIME、SPA fallback、请求日志、可选外部网络隔离 CSP |
| `package.json` | 新增 build:showcase、preview:showcase；原 build/dev:demo 保留 |
| `eslint.config.js`、`.gitignore` | 独立产物不参与 Lint/提交；静态服务 Node globals |
| `tsconfig.json` | 独立 Vite 配置加入类型检查 |
| `tests/setup.ts` | 兼容新增 Node 测试环境；浏览器测试清理行为保留 |
| `tests/showcase-s4.test.tsx`（新增） | 5 项引导、重置、刷新恢复、Evidence 跳转、full/time 与学生阶段隔离 |
| `tests/showcase-build.test.ts`（新增） | 强制 Mock 常量与独立输出目录检查 |
| `SHOWCASE-S4-PLAN.md`、四份比赛材料、本报告 | 计划、5:35 脚本、部署、状态矩阵、最终验收清单 |
| `showcase-s4-screenshots/`（新增） | 22 张真实 JPG、browser-qa.json、两份实际静态请求日志 |

首页开始后依次进入 Q5、学生对照、Evidence、AI、学生反馈与 Research。步骤 1～3复用课堂页；步骤 2由教师依次选择 A/B/C并播放实际 Synthetic 事件；步骤 3明确操作按钮打开有效证据。其余页面保留本来的真实交互和自由导航。引导不自动点击生成、认可、修改或驳回。

引导 sessionStorage 独立键为 `zhicha-showcase-guide-v1`。步骤、学生、课堂回放时间和完整模式可恢复；自由探索后可继续引导。课堂事件同步限定在 Q5 工作区，学生时间轴不会覆盖保留的课堂时间。引导面板按实际布局测量底部，抽屉在其下方显示标题、关闭和详情；窄屏可滚动阅读。

重置先确认，删除键仅匹配 `zhicha-showcase-v0.1:demo_*:teacher_001:demo_session_001:review_0001` 的演示审核，并恢复 Demo 场景/引导默认值。保留登录、非 Demo 数据和 zhicha-pref-* 偏好；失败显示错误，不宣称成功。默认是正常证据、Q05、学生 A和步骤 1。

## 构建与部署

`npm run build` 仍为原生产构建，默认 Real API，输出 dist。新增 `npm run build:showcase` 固定 Mock/base/scenario并输出 dist-showcase。实际以 VITE_API_MODE=real、VITE_API_BASE_URL=https://invalid.example/api、VITE_MOCK_SCENARIO=empty 的继承环境构建比赛产物，浏览器仍成功使用 Mock登录和演示，没有访问该远端地址。

产物包含本地模块、图片和样式，不依赖外部字体/CDN/模型服务；含 `_redirects` 与 `vercel.json` 回退规则，平台项目根/输出目录配置见 [部署说明](SHOWCASE-DEPLOY.md)。本地运行 `npm run preview:showcase`，访问 http://127.0.0.1:4186/home；当前验证 Node v24.15.0。深层路由刷新可返回 index.html，缺失有扩展名资源返回 404，服务不向外公开。

未执行正式平台部署。不能使用 file:// 双击运行，且默认部署到域名根路径。构建/安装依赖应提前完成，现场仅需静态产物与本地 Node 服务。

## 实际检查结果

最终检查均 exit 0：

| 命令 | 真实结果 |
| --- | --- |
| npm test | 21 文件，117/117 通过；原有 111 项无回归，新增 6 项 |
| npm run typecheck | 通过 |
| npm run lint | 通过 |
| npm run build | 通过，2068 modules，生产产物 |
| npm run build:showcase | 通过，2068 modules，强制 Mock比赛产物；包含继承 Real 环境变量验证 |
| git diff --check | 通过，仅 Windows LF→CRLF提示 |

两种构建仍有既有 Zod 的两条 Rollup PURE 注释警告，不影响成功结果。没有将测试数量解释为模型准确率。

本轮开发中出现过真实失败：构建测试在 jsdom 导入 Vite触发 esbuild环境不兼容，已改为 Node；独立产物曾被 Lint扫描，已排除生成目录并配置 Node脚本globals。新增回归测试曾复现时间/full丢失，修复后完整检查通过。独立代码审查指出四项问题（测试环境、完整回放、学生覆盖时间、焦点跨区），均已修复，复查未发现剩余实质问题。

## 浏览器验收与网络边界

实际使用静态产物：普通本地服务4186第一遍完整流程，网络隔离服务4187第二遍完整流程。第一遍手动 ACCEPT；第二遍手动 EDIT_AND_ACCEPT，刷新学生页恢复教师修改文本；均实际选择并播放 A/B/C、打开 Evidence、生成模板、查看学生反馈、浏览五 Research 分区。第二遍采用最终客户端产物；部分1440第一遍截图在最终来源标记/抽屉避让优化之前获取，1366及后续适配截图为优化后；step3-evidence-1440已更新为最终抽屉布局。

实际 CSS 视口读回与 scrollWidth：1366×768=1366，1440×900=1440，1920×1080=1920；390×844的Research=375、学生=390、课堂=375，均不超出视口。JPG导出宽度会受滚动条影响，fullPage包含纵向内容。已实际查看桌面与窄屏截图；引导和抽屉标题/关闭均可见。实际还验证自由探索到设置、确认重置恢复步骤1。

浏览器控制台普通/隔离两组 warn/error 均为空。已查看实际本地服务器请求日志，核心请求为本地HTML、JS、CSS、图片；没有真实 API请求。DOM资源来源均为 /assets/ 下本地文件。日志还记录浏览器自动 favicon.ico请求（非核心资源，当前没有单独favicon文件）。

浏览器工具只提供DOM资源与控制台，不提供完整网络HAR或断网开关，read-only环境也不支持Performance资源记录；不能把实际静态服务器请求日志说成完整浏览器HAR。网络验证依据保存于 [browser-qa.json](showcase-s4-screenshots/browser-qa.json)、[普通请求日志](showcase-s4-screenshots/server-requests.txt)、[隔离请求日志](showcase-s4-screenshots/offline-server-requests.txt)。

第二遍 CSP 为 default-src self、connect-src none，并限定脚本/字体/图片等来源，只允许本地静态资源，外部连接不可用时全流程仍完成。这是外部网络隔离模拟，**没有执行操作系统物理断网**；实际比赛设备的断网和投影彩排仍列为未验收项，见 [最终清单](SHOWCASE-ACCEPTANCE.md)。

## 截图与演示材料

- [首页](showcase-s4-screenshots/home-1366.jpg)
- [课堂](showcase-s4-screenshots/classroom-1366.jpg)、[1920课堂](showcase-s4-screenshots/classroom-1920.jpg)、[390课堂](showcase-s4-screenshots/classroom-390.jpg)
- [学生对照](showcase-s4-screenshots/step2-comparison-1440.jpg)
- [Evidence与引导](showcase-s4-screenshots/evidence-1366.jpg)、[390 Evidence](showcase-s4-screenshots/evidence-390.jpg)
- [AI与教师修改](showcase-s4-screenshots/ai-1366.jpg)
- [学生反馈](showcase-s4-screenshots/student-1366.jpg)、[390个人Evidence](showcase-s4-screenshots/personal-evidence-390.jpg)
- [Research](showcase-s4-screenshots/research-1920.jpg)、[390 Research](showcase-s4-screenshots/research-390.jpg)
- [重置确认](showcase-s4-screenshots/reset-confirm-1920.jpg)
- [5～6分钟脚本](SHOWCASE-DEMO-SCRIPT.md)、[数据状态矩阵](SHOWCASE-DATA-STATUS.md)、[部署说明](SHOWCASE-DEPLOY.md)、[最终验收清单](SHOWCASE-ACCEPTANCE.md)

## 仍缺少的材料、限制与停止点

真实研究数据manifest/授权、R1真实点阵提取与评测、R2真实推理与指标日志、配对多模态实验与Agent科研评测材料仍缺失。Research保持现有真实状态，不填造准确率、F1、mAP、视频或Fusion增益；没有启动补训。

审核仅在当前浏览器，不能跨设备同步。静态Demo视角不是生产身份鉴权。未实际验证外部平台上线和比赛设备物理断网，完整网络HAR不可得；这些限制明确保留在验收清单。原有驳回、无证据拒绝和个人范围测试全部保留通过。

当前为 `S4_IMPLEMENTED_PENDING_REVIEW`，不代表 S4_ACCEPTED。停止开发，等待 ChatGPT技术总控最终验收；未推送/合并 main或擅自发布网站。
