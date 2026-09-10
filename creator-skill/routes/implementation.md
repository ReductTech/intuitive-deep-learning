# React 实现

工程约束以仓库 AGENTS.md 为准。检查当前相关模块、modules/shared/react/index.ts 及所需组件实现，按现有注册和路由接入，不根据旧文档猜 API。

Shared 已有能力优先复用；组合方式服务设计，不因组件存在而固定构图。独立文本使用 Shared Typography；其字体样式与 PPT 可收缩布局遵守 AGENTS.md。图表内标签、SVG、Canvas 和公式使用适合的专用渲染方式并保持语义一致。

课程单元的标题、顺序、描述和领域计算尽量保持单一事实源，Guide、PPT 与预览消费同一语义定义，各自提供渲染器。不要为共享强行统一 DOM。

模块专有实现与资源位于 modules/<ModuleName>/，真正共享的能力放 modules/shared/。按需要建立 blocks、components、data、model、assets 或 services，不创建空结构。

跨单元领域状态放模块级 Provider 或已有状态层；局部状态留在组件。LessonFlow 管理流程时，block 只报告完成状态。按功能处理加载、失败、重置和重访，不为不存在的异步流程增加状态。

完成代码后运行与修改相关的构建或检查，实际操作受影响状态；页面呈现验证到 [review](review.md) 阶段执行。
