# S4 实施计划

基线 a21d648；仅在 Mock Demo 下增加六步导航面板，不代替原页面或教师决策。

1. 先测试引导和范围隔离重置，再接入首页、设置与 AppShell。
2. 引导使用独立 sessionStorage 状态，保存步骤与课堂题目/学生/时间；刷新可恢复。Evidence 打开由用户操作，引导控件置于抽屉之上。
3. 新增 build:showcase，通过独立 Vite 配置常量强制 Mock 与演示场景；输出独立 dist-showcase。生产 build 保留。
4. 本地 Node 静态服务含 SPA fallback；提供静态托管规则和离线说明。
5. 全量检查、两遍完整浏览器流程、指定尺寸、网络/控制台验证、报告和本地提交。
