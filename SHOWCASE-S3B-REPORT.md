# TASK-ZC-SHOWCASE-S3B 交付报告

日期：2026-10-08（Asia/Shanghai）

`STAGE_REACHED = S3B_IMPLEMENTED_PENDING_REVIEW`

## 基线与 Git

- 已验收 S3-A 基线：`84d6305a01a21a46550687f51b59acc34a66881f`。
- 分支：`codex/zhicha-showcase-v0.1`。
- S3-B 实现、测试与截图提交：`637818a5ebfec68f70fb7ca2d5078e65f38ae6d9`。本报告在其后文档提交中交付；最终回复提供包含报告的 HEAD SHA。
- main 仍为 `ab63c0878aea6201a2fe8e8102dd8212718b70f8`；没有推送或合并，未启动 S4、R4-PREP-04、生产后端、数据库或模型训练。
- 对照基线，`src/contracts/`、`src/mocks/fixtures/demo.ts`、`src/mocks/calculations.ts` 均无改动。未新增依赖；保留原 Students、Research、权限、课堂和 AI 报告引擎。

## 学生闭环

课堂和 AI 提供“演示学生反馈”入口。新路由 `/demo/student` 位于原教师权限守卫下，是教师授权的比赛演示视角，不改变登录角色，不宣称生产安全鉴权，也不提供正式学生接口。

页面提供课堂名称、六题 Synthetic 结果、A/B/C 选择、题目选择、客观个人过程回顾、可播放/暂停/定位的事件时间轴及个人证据投影。复用 S2 EventTimeline，按实际事件显示，不补造 WRITING、LEAVE、PROCESS_END 或笔迹；ANSWER_SUBMIT 仍明确为合成结果记录。无坐标时显示“暂无可回放笔迹”。

| 演示学生 | Q5 结果 | RETURN | 修改候选 |
| --- | --- | --- | --- |
| A / anon_p017 | 正确 | 0 | 0 |
| B / anon_p018 | 正确 | 2 | 0 |
| C / anon_p019 | 错误 | 1 | 1 |

数据来自 S1 原结果与事件，未改动班级 4/12、3/12 或窗口分布。次数仅作客观回顾，不用于能力、心理或错误原因判断。

## 个人 Evidence 与审核联动

新增 Mock 专用 GET `/teacher/sessions/:session_id/demo-students/:participant_id`。只接受冻结课堂和 A/B/C，保持教师鉴权、版本错误与空数据处理；其他课堂/学生返回 404，非教师 403，写入方法 404。

投影只包含所选学生的事件与答案。事件不携带可打开完整班级包的引用；个人 Evidence 使用实际包 ID `ev_sess001_q05_0003` 加个人范围，过滤为该学生 Q5 事件 ID，保留原包 PARTIAL/VALID 质量、窗口和 Synthetic 来源。独立个人抽屉只读取此投影，不调用班级 Evidence API，不返回 student_set、其他学生答案/事件或虚构 Sensor Fact。支持关闭、Escape、焦点恢复和 Tab 范围约束。其他题目没有 Evidence 包时明确显示缺失。

个人反馈读取 S3-A 原 localStorage 键：`zhicha-showcase-v0.1:${scenario}:teacher_001:demo_session_001:review_0001`，使用原 feedbackSchema，不建立第二套审核存储。通过原 Demo Report Engine 验证有效报告后才展示采纳内容。

- ACCEPT：显示原模板经教师认可的全班 Q5 关注项。
- EDIT_AND_ACCEPT：显示教师实际修改并采纳的文本，来源标为教师。
- REJECT：不返回、不展示被驳回建议。
- 未审核：只显示个人过程事实。
- INSUFFICIENT_EVIDENCE：事实可见、引用为空、无教学建议，显示“证据不足 · 已拒绝生成”。

页面明确“全班备课建议不等价于个人诊断”。刷新页面或点击刷新审核结果可恢复原记录。读取失败/损坏显示警告，不假装已采纳；保存继续由 S3-A 原接口承担，原失败行为和测试保留。

## Research Lab 与资料边界

独立路由 `/demo/research/:section`、Mock GET `/teacher/sessions/:session_id/research-showcase` 提供教师授权只读展示。教师 Demo 的主导航 Research 指向此入口；非 Demo 和研究员仍保留原 Research 导航。正式 `/research/*` Mock API 的教师 403 语义不变，生产角色守卫没有删除。

五分区 Dataset、Models、Experiments、Failure Cases、Evidence Trace 可以切换。课堂/AI/学生页进入后可返回原流程；课堂的题目、学生、完整回放模式与时间保存。Failure Cases 能进入 AI 进行证据不足验证，再返回原研究分区。Evidence Trace 沿用原 EvidenceProvider/Drawer 展示 Synthetic 班级证据链，和个人投影视图区分。

本轮核对三阶段报告、仓库 docs/contract-source.txt、源代码、测试以及仓库文件清单。未发现可支持模型指标的真实推理产物、数据 manifest、实验日志或授权文件；这是当前仓库材料范围内的判断，不代表项目团队在其他位置没有研发成果。

- **软件行为已核验**：R3/R4 事件聚合、Evidence 验证、模板报告和审核由网站测试核验，明确不是 R1/R2 模型成绩。
- **Synthetic 演示**：12 人六题、Q5 事件统计及证据链，标注非科研证据。
- **正在研发**：R1 接口/事件展示已有代码，但真实点阵提取和模型评测无可核验产物。
- **尚未验证**：R2 缺少真实推理、来源及授权；不展示视频、检测框或模型指标。真实模型实验指标留空。
- **Fusion**：始终为 `Prototype / Not Validated`，不宣称多模态性能增益。

没有将 94 或本轮 111 项网站测试解释为模型准确率，没有伪造真实研发结果。Research 卡片列出资料依据及状态；原 Research 正式页面与 API 保留。

## 修改文件

| 文件 | 实现 |
| --- | --- |
| `src/demo/studentResearchContract.ts`（新增） | 独立 Zod 只读 DTO；个人范围、来源、审核和无模型指标约束 |
| `src/demo/studentResearch.ts`（新增） | Mock 展示 API 适配器，页面不导入 fixture |
| `src/mocks/studentResearch.ts`（新增） | 从冻结数据产生个人投影，读取共享审核记录；研究展示材料/状态 |
| `src/mocks/handlers/index.ts` | 增加两个只读路径，沿用正式鉴权与课堂范围检查 |
| `src/components/showcase/DemoStudentResearch.tsx`（新增） | DemoStudent、个人证据抽屉、ResearchShowcase 和五分区交互 |
| `src/App.tsx` | 独立 Demo 路由，置于原教师权限守卫 |
| `src/components/showcase/DemoAI.tsx` | 学生/Research 入口，拒绝状态文字，验证 Demo 返回路径 |
| `src/components/showcase/Q5Showcase.tsx` | 学生/Research 入口，保存课堂回放上下文 |
| `src/layouts/AppShell.tsx` | 仅教师 Demo 的 Research 导航分流 |
| `src/styles/showcase.css` | 个人过程与反馈双栏、研究卡片、响应式、个人抽屉 |
| `tests/showcase-s3b-api.test.ts`（新增） | 9 项：冻结事实、范围、共享审核、拒绝、角色/课堂/只读、Research 真实性 |
| `tests/showcase-s3b.test.tsx`（新增） | 8 项：学生切换、题目/抽屉、审核来源、Research 导航/追溯、无证据、角色守卫、回放返回 |
| `showcase-s3b-screenshots/`（新增） | 17 张真实浏览器 JPG 与 browser-qa.json |
| 本报告 | 交付与真实验证记录 |

## 自动化检查

最终代码执行结果（全部 exit 0）：

| 命令 | 结果 |
| --- | --- |
| `npm test` | 19 文件，111/111 通过；原有 94 项完整保留，新增 17 项 |
| `npm run typecheck` | 通过 |
| `npm run lint` | 通过 |
| `npm run build` | 通过，2066 modules |
| `npx vite build --mode demo` | 通过，2066 modules |
| `git diff --check` | 通过；仅 Windows LF→CRLF 提示 |

两个构建仍有 node_modules/zod 的两条既有 Rollup PURE 注释警告，不是新增构建失败。开发中测试先失败再实现；曾发现个人 Evidence quality 指向普通数据质量，回归测试复现后改为原包 PARTIAL。最终上述检查是在修复后执行。

独立只读 code review 发现两处返回导航缺陷；已用回归测试修复 Research → AI → Research 的分区丢失与课堂 → Research 的 full/time 丢失。复查未发现剩余实质问题；审查员没有自行运行测试，测试结果来自本轮实际执行。

## 浏览器验收与截图

实际使用最终静态 Demo 构建，Vite preview `http://127.0.0.1:4185`；沿用 teacher_demo 会话。不是静态设计稿。

| CSS 视口 | 学生 scrollWidth | Research scrollWidth |
| --- | --- | --- |
| 1440×900 | 1425 | 1440 |
| 1920×1080 | 1905 | 1920 |
| 390×844 | 375 | 375 |

以上均不超过视口宽度。截图导出像素受滚动条影响，与 CSS 视口略有差异；fullPage 图包含纵向内容。已实际查看桌面和窄屏截图，按钮可操作、卡片纵排且没有严重图表/文字横向溢出。

实际交互验证：A/B/C 结果/RETURN 切换；B 播放暂停；C 个人抽屉只有本人事件且质量 PARTIAL；教师修改文本刷新恢复；认可与驳回的学生建议联动；证据不足 AI/学生拒绝且正常场景可恢复；五研究分区与原 Drawer 追溯；窄屏个人抽屉；最终构建 Research → AI → Research → 课堂保持完整模式及 20:00 回放位置。本轮浏览器 warn/error 日志为空，见 [browser-qa.json](showcase-s3b-screenshots/browser-qa.json)。

主要截图：

- [学生 C 与教师修改联动 · 1440](showcase-s3b-screenshots/student-c-review-1440.jpg)
- [学生 C · 1920](showcase-s3b-screenshots/student-c-1920.jpg)、[390](showcase-s3b-screenshots/student-c-390.jpg)
- [个人 Evidence · 1440](showcase-s3b-screenshots/personal-evidence-1440.jpg)、[390](showcase-s3b-screenshots/personal-evidence-390.jpg)
- [教师修改并采纳](showcase-s3b-screenshots/teacher-edit-1440.jpg)
- [认可](showcase-s3b-screenshots/student-accepted-1440.jpg)、[驳回](showcase-s3b-screenshots/student-rejected-1440.jpg)
- [学生证据不足](showcase-s3b-screenshots/student-insufficient-1440.jpg)、[AI 拒绝](showcase-s3b-screenshots/ai-insufficient-1440.jpg)
- [Research Models · 1440](showcase-s3b-screenshots/research-models-1440.jpg)、[1920](showcase-s3b-screenshots/research-models-1920.jpg)
- [Dataset](showcase-s3b-screenshots/research-dataset-1920.jpg)、[Experiments](showcase-s3b-screenshots/research-experiments-1440.jpg)、[窄屏 Research](showcase-s3b-screenshots/research-390.jpg)
- [Research Evidence Trace](showcase-s3b-screenshots/research-trace-1440.jpg)

## 剩余问题与停止点

没有正式学生个人反馈接口，当前是教师权限下的只读 Demo 投影。没有真实模型实验、点阵笔迹、视觉推理和配对视频材料，因此相关研发成绩未展示。审核存储仅在当前浏览器本地，不能跨设备同步；不能将静态 Demo 视角当作生产身份边界。静态托管仍需要 SPA 回退以支持路由刷新。

本轮完成 S3-B，状态仅为待总控验收。未宣布 S3B_ACCEPTED，也未启动 S4。后续如需展示真实科研成果，应先提供可核验的产物、来源/授权及实验日志，再经总控确定范围。
