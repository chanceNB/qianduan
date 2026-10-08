# TASK-ZC-SHOWCASE-S2 交付报告

日期：2026-10-08（Asia/Shanghai）

`STAGE_REACHED = S2_IMPLEMENTED_PENDING_REVIEW`

## 范围与基线

- 仓库：chanceNB/qianduan；分支：`codex/zhicha-showcase-v0.1`。
- 已验收 S1 保存为独立基线提交 `230f3fb`。S2 未修改 S1 fixture、计算逻辑或生产 contracts。main 仍为 `ab63c0878aea6201a2fe8e8102dd8212718b70f8`。
- 本次仅开发 S2 课堂核心演示页；未启动 S3/S4，未合并或推送 main。现有 React + TypeScript + Vite、路由与权限保留，没有新增依赖、后端、数据库或训练。
- `docs/reference/Q5_showcase_visual_reference.png` 不存在。本次按冻结的白底、浅绿选中态、圆角、细边框和大留白设计，没有以参考图数字替换数据。
- 本报告、代码、测试和截图包含在 S2 本地交付提交中；最终回复提供该提交的完整 SHA。

## 实现与文件清单

| 文件 | 功能 |
| --- | --- |
| `src/demo/showcase.ts`（新增） | Mock 专用只读展示 DTO/API，Zod 校验非空题目/学生、DEMO/SYNTHETIC 和非科研证据标签 |
| `src/mocks/handlers/index.ts` | 增加 showcase 只读接口，从现有 S1 事件、结果、班级态势与节点投影；保持鉴权、课堂范围与异常行为 |
| `src/pages/Classroom.tsx` | 保留 SessionWorkspace，Mock 演示场景接入 Q5 页，正常模式保留原工作区 |
| `src/components/showcase/Q5Showcase.tsx`（新增） | 课堂概览、关键节点、班级态势、学生对照和过程联动；URL 保留 question/student |
| `src/components/showcase/ClassStateCharts.tsx`（新增） | QuestionDistributionChart、ReturnRatioChart、RevisionCandidateChart、ProgressDivergencePanel；CSS 轻量图表、统计定义、缺失状态 |
| `src/components/showcase/StudentProcessComparison.tsx`（新增） | A/B/C 统一卡片、匿名 ID、结果、事件路径、返回次数、修改候选、完整过程选择 |
| `src/components/showcase/EventTimeline.tsx`（新增） | 实际事件排序、播放/暂停/重新播放、10 倍速、时间滑块、事件定位与 Evidence 引用 |
| `src/components/showcase/eventLabels.ts`（新增） | 事件显示名称；合成提交与 R1 事件明确区分 |
| `src/components/ReplayCanvas.tsx` | 保留轨迹回放，增加外部时间同步；无笔迹显示“暂无可回放笔迹” |
| `src/components/EvidenceDrawer.tsx` | 来源、质量、窗口、事件 ID、真实性、原始结构和追溯展示；焦点循环包含 disclosure summary |
| `src/layouts/AppShell.tsx` | Demo 默认收起空的最近动态，正常模式保持原行为 |
| `src/styles/showcase.css`（新增）、`src/styles/app.css` | 竞赛页面字号、卡片、留白与桌面/窄屏布局 |
| `tests/showcase-s2.test.tsx`（新增） | 页面统计、学生切换、Evidence、刷新 URL、六题筛选和焦点循环，6 项 |
| `tests/showcase-s2-api.test.ts`（新增） | 投影、权限/范围/异常、非空列表与真实性校验，5 项 |
| `tests/showcase-playback.test.tsx`（新增） | 播放、暂停、定位、重新播放与无伪造笔迹，2 项 |
| `tests/showcase-charts.test.tsx`（新增） | 缺失指标显示，1 项 |
| `SHOWCASE-S2-PLAN.md`、本报告、`showcase-s2-screenshots/`（新增） | 实施计划、交付记录与浏览器截图 |

业务页面通过展示 API 读取数据，没有直接导入 fixture。学生过程与笔迹继续使用原有接口。正式 API/DTO 未扩展；新投影只对 Mock 演示场景启用。

## 数据与真实性核对

- 12 名学生、Q1～Q6；核心题目 Q05（界面 Q5），窗口 `[840000,900000)` ms，即课堂开始后 14:00～15:00，左闭右开。
- RETURN 为窗口内 Q5 返回的去重人数：4/12 = 33.3%；REVISION_CANDIDATE 为 3/12 = 25%。分母是窗口终点前有题目访问记录的有效参与者，不能替换成 Q5 位置的 8 人。
- 终点题目位置 Q4=2、Q5=8、Q6=2；Q1～Q3=0。题目位置方差显示 0.333，归一化分布熵 0.484；不是完成耗时。
- completion_ratio 保持 null，显示“不可计算”。缺失比例显示“数据缺失”，不显示伪造的 0%。
- A/anon_p017：Q5 正确、0 次 RETURN；B/anon_p018：正确、2 次 RETURN；C/anon_p019：错误、1 次 RETURN、1 次修改候选。全部根据实际结果/过程生成。
- Evidence `ev_sess001_q05_0003` 引用实际存在的 36 个 Q5 事件 ID。没有新增 stroke_ref、video_ref、Sensor Fact，也没有心理、情绪、专注度或身份识别推断。
- 页面始终保留 DEMO/SYNTHETIC，所有结果标为非科研证据。

根据 `docs/contract-source.txt` 指向的 R1 数据契约文档核对：R1 枚举包含 WRITING、QUESTION_VISIT、QUESTION_LEAVE、RETURN、REVISION_CANDIDATE、PROCESS_END，不包含 ANSWER_SUBMIT。时间轴将 S1 ANSWER_SUBMIT 标为合成结果记录，不冒充传感器事件，也不转换成 PROCESS_END。没有实际 PROCESS_END 或坐标轨迹时，不补造事件或笔迹。

核对文档为 `智察课堂2.0_数据格式与数据契约文档_v1.0(1).docx`，SHA256：`C9EED7D25D9CC382668116DE0D42BBDED4AF7B691DD502331E847815EA240459`。

## 自动化验收结果

最终代码执行结果：

| 命令 | 结果 |
| --- | --- |
| `npm test` | 退出 0；14 个测试文件，68/68 通过（原 S1 54 项保留，新增 14 项） |
| `npm run typecheck` | 退出 0 |
| `npm run lint` | 退出 0 |
| `npm run build` | 退出 0；2058 modules |
| `npx vite build --mode demo` | 退出 0；2058 modules |
| `git diff --check` | 退出 0 |

构建仍有两处既有 Zod PURE 注释位置警告，不阻止构建。Windows Git 有 LF→CRLF 规范化提示。早期新增测试查询参数错误曾导致类型检查失败，修复后全套检查重新通过；没有隐藏失败结果。

独立代码审查发现 Evidence 焦点循环遗漏 summary、空列表缺少验证及非 Q5 结果投影不足；均修复并增加回归覆盖，复查未发现剩余实质问题。

## 浏览器视觉与交互验收

在静态 Demo 构建预览 `http://127.0.0.1:4185` 验证，使用教师演示账号。直接地址：`/classroom/demo_session_001/overview?question=Q05&student=anon_p019`。

实际 CSS viewport：1366×768、1440×900、1920×1080、390×844。四种宽度的 scrollWidth 均未超过 viewport；桌面卡片、按钮与窄屏纵向布局已检查。页面较长，桌面需要滚动查看过程对照与回放。

实际操作覆盖：登录与直接路由、A/B/C 选择、B 的两次返回、播放/暂停/重新播放、事件定位（B 的 14:30 RETURN）、Evidence 来源/窗口/事件 ID/追溯、关闭保持 C 选择、刷新保留题目与学生，以及窄屏 Evidence 操作。静态预览控制台 error/warn 为 `[]`。详见 [browser-qa.json](showcase-s2-screenshots/browser-qa.json)。

截图为真实浏览器捕获，dashboard/comparison 是全页截图裁剪，不是生成的视觉稿。导出图宽略小于 viewport，包含滚动条和浏览器截图尺寸差异：

- [Q5 课堂概览](showcase-s2-screenshots/q5-dashboard.jpg)：1904×1060。
- [A/B/C 过程对照](showcase-s2-screenshots/abc-comparison.jpg)：1194×1007。
- [Evidence 展开与事件 ID](showcase-s2-screenshots/evidence-events-1440.jpg)：1425×881。
- [Evidence 详情](showcase-s2-screenshots/evidence-1440.jpg)、[追溯](showcase-s2-screenshots/evidence-trace-1440.jpg)。
- 全页桌面：[1366](showcase-s2-screenshots/q5-1366.jpg)（1350×2332）、[1440](showcase-s2-screenshots/q5-1440.jpg)（1424×2334）、[1920](showcase-s2-screenshots/q5-1920.jpg)（1904×2060）。
- [A/B/C 全页](showcase-s2-screenshots/abc-1440.jpg)（1424×2334）、[390 窄屏](showcase-s2-screenshots/q5-390.jpg)（374×4804）。

## 已知问题与范围外事项

- 所有展示数据是 Synthetic；没有真实点阵笔迹、视频或验证科研成果。
- 开发阶段 HMR 曾间歇出现 `AuthProvider required`，冷刷新恢复；最终静态构建预览没有此错误。未将历史开发控制台描述为始终无错误。
- 静态部署须配置 SPA fallback，才能直接刷新课堂深层路由。
- 独立强制 Mock 构建脚本仍属于后续任务；本次验证现有 `--mode demo`。没有修改 package.json。
- 教师 Research 403、正式学生个人反馈接口缺失保持原状。演示账号不代表生产安全鉴权。
- AI 教学复盘、教师审核、学生个人反馈及 Research 不在本次开发范围，尚未进行 S3/S4 页面改造。

## 下一阶段建议

先由技术总控验收 S2。通过后进入 S3 Evidence/AI 复盘链：复用有效 Evidence ID 构建报告，覆盖完整证据与证据不足两类场景，证据不足拒绝确定性教学判断，再衔接教师审核。当前停在待验收状态，不启动该工作。
