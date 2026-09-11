# React 实现

工程约束以仓库 AGENTS.md 为准。检查当前相关模块、modules/shared/react/index.ts 及所需组件实现，按现有注册和路由接入，不根据旧文档猜 API。

Shared 已有能力优先复用，但组件不是教学答案；组合方式服务当前证据关系，不因组件存在而固定构图。独立文本使用 Shared Typography；其字体样式与 PPT 可收缩布局遵守 AGENTS.md。图表内标签、SVG、Canvas 和公式使用适合的专用渲染方式并保持语义一致。

课程单元的标题、顺序、描述、领域计算、页间问题和交互语义必须保持单一事实源。先实现 PPT 渲染器，再由同一语义定义转换出 blog/Guide 渲染器；转换只把空间关系改成阅读时间流，不得增删或改写知识。PPT 根画布固定为 1600×900 px。不得越过 UI Kit 的语义边界：Select 只做选择，ExplainPanelButton 只做邻近解释，Feedback 做原位结果/错误/提示；不得从 modules-legacy 引入运行时代码或资源，也不得为共享强行统一 DOM。

模块专有实现与资源位于 modules/<ModuleName>/，真正共享的能力放 modules/shared/。按需要建立 blocks、components、data、model、assets 或 services，不创建空结构。

跨单元领域状态放模块级 Provider 或已有状态层；局部状态留在组件。LessonFlow 管理流程时，block 只报告完成状态。按功能处理加载、失败、重置和重访，不为不存在的异步流程增加状态。

完成代码后运行与修改相关的构建或检查，实际操作受影响状态；页面呈现验证到 [review](review.md) 阶段执行。
