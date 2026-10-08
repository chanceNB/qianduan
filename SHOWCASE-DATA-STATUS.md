# 数据与研发状态矩阵

| 内容 | 状态 | 可核验依据 | 禁止推导 |
| --- | --- | --- | --- |
| 网站工作流与权限 | 软件行为已核验 | 本轮 117 项网站测试；src/routes/permissions.ts、Mock、浏览器日志 | 不等于 R1/R2 模型准确率 |
| 12 人、Q1～Q6、A/B/C | Synthetic 演示 | 冻结 fixtures/demo.ts 的事件/答案 | 不是采集数据或真实课堂研究发现 |
| Q5 班级态势 | Synthetic 派生统计 | calculations.ts：窗口 [840000,900000)，RETURN4/12、修改候选3/12、Q4=2/Q5=8/Q6=2 | 不解释心理、能力或因果原因 |
| 题目完成比例 | 不可计算 | 无可信 completion marker，null | 合成提交不能替代真实结束事件 |
| Evidence | Synthetic / PARTIAL | ev_sess001_q05_0003、实际事件 ID、窗口及来源 | 无 Sensor Fact、真实 stroke_ref 或配对 video_ref |
| 学生个人 Evidence | 范围隔离的只读投影 | 原包 ID + 当前匿名学生事件 | 不返回其他学生事件，不作为生产鉴权 |
| AI 复盘与审核 | Evidence 模板 Demo | reportEngine.ts + 共享教师反馈存储 | 未调用实时 LLM；建议不是事实或个人诊断 |
| R1 Pen Process Extraction | 研发接口/演示已有；真实评测材料缺失 | 冻结事件契约、时间轴代码 | 不填写真实点阵提取成绩 |
| R2 Macro Vision Perception | 未验证 | 当前仓库无真实推理产物、数据 manifest 和授权材料 | 不展示虚构视频、检测框、F1/mAP |
| R3/R4 Class State、Evidence、Agent Evaluation | 软件行为已核验；研究性能未验证 | 聚合、证据不足拒绝、审核测试 | 不把网站测试数当模型/Agent 研究指标 |
| Fusion | Prototype / Not Validated | 现有骨架、fusion=false | 不宣称多模态性能增益 |

材料审计范围为当前仓库与已交付三阶段报告，并非对团队其他位置的材料作不存在判断。当前缺少可核验的真实数据划分/授权、R1 点阵提取与评测日志、R2 推理产物和评测日志、配对多模态实验及 Agent 研究评测材料。提供并核验后才能更新展示；本轮未启动训练或 R4-PREP-04。
