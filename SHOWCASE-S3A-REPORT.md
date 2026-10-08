# TASK-ZC-SHOWCASE-S3A 交付报告

日期：2026-10-08（Asia/Shanghai）

`STAGE_REACHED = S3A_IMPLEMENTED_PENDING_REVIEW`

## 基线与 Git

- 仓库：chanceNB/qianduan；分支：`codex/zhicha-showcase-v0.1`。
- 已验收 S2 基线：`19f2b3fa0ae01b25c8d6ced7b9a6212f0dc071a7`。
- S3-A 实现、测试与截图提交：`39a481f85f09a5c06444a4dec698c2b13999eeae`。本报告在其后的文档提交中交付；最终回复提供含报告的 HEAD SHA。
- main 保持 `ab63c0878aea6201a2fe8e8102dd8212718b70f8`。没有推送、合并 main，未启动 S3-B/S4 或 R4-PREP-04。
- 对照 S2 基线，`src/contracts/`、S1 `fixtures/demo.ts` 和 `calculations.ts` 均无改动；没有新增依赖、真实后端、数据库、模型训练或外部 LLM 调用。

## 已实现流程

Q5 关键节点的“AI 复盘”按钮携带 Session、Q05、node_0003、有效 Evidence ID 与返回路径。返回路径保存原题目、学生、事件时间及完整课堂回放模式；从 AI 返回后恢复这些选择。时间轴接收初始时间并按实际事件边界定位。

Demo AI 沿用现有页面标题、课堂筛选、双栏工作区、EvidenceProvider/Drawer 与教师反馈接口。左侧显示课堂、题目、节点、可选 Evidence 和任务；右侧显示原始复盘、引用、下一课建议及审核。非 Demo 模式保留原 AI 实现，正式权限约束不变。

醒目标识为“Evidence 驱动模板 · Demo”，持续保留 DEMO/SYNTHETIC，明确不调用实时 LLM。三项任务共享一份规范报告，只切换阅读重点及对应标题高亮；界面明确说明其不改变事实和审核版本。

## Demo Report Engine 与真实性

Mock 专用引擎独立于页面。通过 Zod 验证 Evidence 和节点，核对课堂归属、Q05、节点 ID、所选 Evidence ID、质量、DEMO/SYNTHETIC 标签及非科研性质。还核对全部 Q5 事件引用是否存在且完整、观察窗口是否匹配，再调用冻结的 S1 聚合算法计算事实。

有效报告包含 summary、concerned_questions、knowledge_points、evidence_ids、suggested_focus、requires_teacher_review=true 与 READY。报告保留 confidence=null，UI 不显示模型置信度。引擎不推断心理、情绪、专注度、因果原因或科研发现。

Q5 事实为 Synthetic 合成演示统计：14:00–15:00 的 `[840000,900000)` 窗口，12 名有效参与者中有 4 名出现 RETURN、3 名出现 REVISION_CANDIDATE。分子按参与者去重；分母为窗口终点前有题目访问记录的参与者。知识点来自 Evidence 的已知关联字段。建议核对关键解题步骤明确标为教学建议，必须人工审核。

引用为 `ev_sess001_q05_0003`，可以打开原 Drawer，查看来源、Q5 的 36 个事件、时间窗口、质量、真实性及追溯。未新增笔迹、配对视频或 Sensor Fact 引用。

未选证据、无效 ID、跨课堂 Evidence/节点、无效质量、缺失/伪造事件引用或证据不足场景均返回 INSUFFICIENT_EVIDENCE：说明拒绝原因、evidence_ids=[]、suggested_focus=[]，不产生确定性教学结论。UI 不提供采纳操作；活动 Mock transport 在验证失败后也拒绝反馈，重新验证有效证据后允许重试。

## 教师审核与持久化

复用 S1 `POST /teacher/agent/reviews/:review_id/feedback` 和 localStorage 键：版本、场景、教师、课堂、review_id。支持 ACCEPT、EDIT_AND_ACCEPT、REJECT，刷新后读取并恢复。

- ACCEPT：显示“已采纳 · 原始模板”，来源为模板经教师认可。
- EDIT_AND_ACCEPT：显示“已采纳 · 教师修改”，原始模板保持可见；教师采用文本单独展示，编辑框刷新后也恢复该文本。
- REJECT：显示“已驳回 · 未采纳”，不展示已采用文本。
- 保存失败返回 LOCAL_STORAGE_UNAVAILABLE，页面显示错误，不更新为成功状态。读取失败或损坏的记录会提示无法恢复，不假装已经审核。

新增 Demo 只读恢复接口与生成接口，未改动正式 Review/Feedback DTO。原 S1 review 接口兼容行为保留；Demo 新投影分别返回原始报告和审核动作，避免将教师文本伪装成原模板。

场景切换仅在 Mock Demo 中启用：正常证据与 `demo_insufficient_evidence` 可互相切换，选项在 sessionStorage 中保留以支持刷新。切换时关闭旧 Evidence 并重建报告工作区，不改变身份或权限。课堂、题目、节点、Evidence 或场景变化均隔离报告状态，卸载后忽略迟到响应。

## 修改文件

| 文件 | 内容 |
| --- | --- |
| `src/demo/reportContract.ts`（新增） | Demo 输入、报告及审核投影的 Zod schema；不依赖运行时，避免循环加载 |
| `src/demo/reportEngine.ts`（新增） | Evidence 验证、S1 聚合、模板报告与拒绝生成 |
| `src/demo/report.ts`（新增） | Demo 生成/恢复 API 适配器 |
| `src/components/showcase/DemoAI.tsx`（新增） | 双栏复盘、证据选择、阅读任务、审核、恢复和场景切换 |
| `src/pages/AI.tsx` | Demo 分流；原 AI 页保留 |
| `src/components/showcase/Q5Showcase.tsx` | AI 入口与返回上下文 |
| `src/components/showcase/EventTimeline.tsx` | 初始时间恢复 |
| `src/api/runtime.ts` | 仅限 Demo 的场景切换与运行时 transport 包装 |
| `src/mocks/handlers/index.ts` | Demo 报告生成/恢复、读取反馈、证据不足反馈保护 |
| `src/styles/showcase.css` | 双栏布局、模板标识、阅读重点、教师文本和响应式样式 |
| `tests/showcase-report-engine.test.ts`（新增） | 9 项：来源/质量/事件/节点校验及事件改变后的重新计算 |
| `tests/showcase-s3a-api.test.ts`（新增） | 10 项：生成、无效证据、审核恢复、存储错误、权限/范围、无效报告反馈阻断 |
| `tests/showcase-s3a.test.tsx`（新增） | 7 项：上下文、全程回放恢复、引用、编辑恢复、场景切换、课堂清理、StrictMode 与保存失败 |
| `showcase-s3a-screenshots/`（新增） | 真实浏览器截图和 browser-qa.json |
| 本报告（新增） | 实施、检查、限制与交付状态 |

## 自动化验收

最终代码的实际执行结果：

| 命令 | 结果 |
| --- | --- |
| `npm test` | 退出 0；17 个测试文件，94/94 通过（S2 原 68 项与新增 26 项） |
| `npm run typecheck` | 退出 0 |
| `npm run lint` | 退出 0 |
| `npm run build` | 退出 0；2062 modules |
| `npx vite build --mode demo` | 退出 0；2062 modules |
| `git diff --check`、提交前 staged diff 检查 | 退出 0 |

两处既有 Zod PURE 注释警告仍存在，构建成功。Windows Git 有 LF→CRLF 规范化提示。

TDD 首轮 13 项因接口/页面功能缺失失败。实现后修正测试参数展开、异步加载等待及类型问题。新增 StrictMode 测试捕获异步状态失效，修复后通过。独立审查发现全程模式返回丢失和节点跨课堂校验遗漏，均先以失败测试复现、再修复；还补充无效报告直接反馈阻断及编辑框刷新恢复。最终全套检查重新执行，未将早期失败隐藏为通过。

独立只读复查确认上述修复，未发现剩余重要问题。S2 图表、A/B/C、回放、Evidence、异常和权限测试全部保留且通过。

## 浏览器验收与截图

使用最终静态 Demo 构建预览 `http://127.0.0.1:4185`，复用教师 Demo 登录。实际验证：Q5→AI 上下文、报告生成、有效 Evidence Drawer、三类审核及各自刷新恢复、教师文本可继续编辑、证据不足拒绝与正常场景恢复、课堂清空不残留报告、任务阅读重点。

返回课堂验证 B/Q05/14:30 保持；完整课堂回放定位到 B 的 01:51 后跳转 AI 并返回，时间与 full=1 保持。另验证 C 的时间轴切换、播放/暂停及无可回放笔迹。未加入第二节虚构课堂；当前数据仅有一节演示课，课堂切换验证使用清空/重选，其他课堂 ID 由接口测试确认 404。

四种实际 CSS viewport 为 1366×768、1440×900、1920×1080、390×844；scrollWidth 分别为 1351、1425、1905、375，均未横向溢出。真实截图已检查，窄屏双栏纵向排列。截图导出尺寸略小于 viewport，受滚动条/浏览器捕获影响。

浏览器实际导出格式为 JPEG，文件使用 `.jpg`；审核图为 1424×1511，Evidence 为 1425×882，证据不足为 1424×1131，驳回为 1424×1457，窄屏为 374×2974，课堂为 1424×2334。

- [AI 报告与教师修改采用](showcase-s3a-screenshots/ai-reviewed-1440.jpg)
- [Evidence 展开及 Q5 事件引用](showcase-s3a-screenshots/ai-evidence-1440.jpg)
- [驳回且未采纳](showcase-s3a-screenshots/ai-rejected-1440.jpg)
- [证据不足拒绝生成](showcase-s3a-screenshots/ai-insufficient-1440.jpg)
- [窄屏页面](showcase-s3a-screenshots/ai-narrow-390.jpg)
- [返回课堂与 C 过程回放](showcase-s3a-screenshots/q5-return-1440.jpg)
- [浏览器验收日志](showcase-s3a-screenshots/browser-qa.json)

最终静态验收控制台 error/warn 为 `[]`。中间遇到预览服务器尚未启动的连接失败，以及生产构建替换 dist 时刷新出现契约/JSON 错误；启动服务、完成最终 Demo 构建后重新执行验收。range fill 未触发 React 时间更新，改用真实键盘 Home 操作并核对 UI 时间。上述均记录在日志，没有将尝试当成成功。

## 已知限制与停止点

- 仅 Q5 的已验证 Synthetic Evidence 支持 READY；其他题目或缺失证据必须拒绝。不是实时大模型、真实科研结果或生产鉴权服务。
- localStorage 是本机演示持久化，没有服务端审计、跨设备同步或不可篡改保证；sessionStorage 场景设置仅供重复演示。反馈保护不宣称生产安全能力。
- 未审核的新报告不单独持久化；刷新可重新生成。已保存审核会恢复其规范原报告与审核动作。
- 当前只有一节演示课堂；没有为跨课测试改写已验收的数据。
- 静态部署需 SPA fallback。独立强制 Mock 构建脚本仍未在本阶段开发，使用现有 `--mode demo` 构建。
- 正式学生反馈接口缺失、教师 Research 403 保持原状。无新增学生接口、Research 权限改造或 R4-PREP-04。

S3-A 完成后停止，等待技术总控验收。未自行宣布 S3A_ACCEPTED，未执行 S3-B/S4。
