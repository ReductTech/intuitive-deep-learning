---
name: creator-skill
description: 规划、设计、实现、修改和评估基于 React 的 PPT 演示内容，适用于教学课件、科研汇报、组会与商业汇报等场景。根据是否提供作为创作依据的既有 PPT，选择参考改编或从零创作流程；也用于继续开发、重设计和修复现有 React 演示项目。
---

# React PPT 创作 Skill

## 1. 三种任务模式

- **参考改编**：用户提供作为创作依据的既有 PPT，要求转换、借鉴、修改或重新设计。原稿可以是 PPTX、PDF 导出或逐页截图。
- **从零创作**：用户未提供作为创作依据的既有 PPT，从主题、目标、对话、文字、论文或其他材料开始组织演示。
- **现有项目续作**：用户指定已有的 React PPT 项目、页面或模块，要求继续制作、修改、修复或优化。

## 2. 共性硬约束

- **固定画布：1600×900。** 页面按固定画布设计，由外层整体等比例缩放；不按视口重排，不以裁切或横向滚动掩盖溢出。
- **React 实现。** 正式页面及其状态、交互使用 React，沿用当前项目的技术栈和入口契约。
- **文字使用 Typography。** 标题、正文、标签、提示等独立文字使用 Shared `Typography`，或使用内部已封装它的组件。其他 Shared 组件按需选用。
- **固定大纲位置。** 本项目模块的大纲为 `modules/<模块目录名>/outlines.json`。
- **工程边界。** 遵守仓库 `AGENTS.md` 和现有身份、资源契约；局部需求在当前模块内实现，禁止修改公共组件。

## 3. 路由

先选择任务模式，读取对应 Workflow；再按当前阶段选读方法、工程与评估说明，不预读整个目录。

| 当前需要 | 读取资料 |
|---|---|
| 参考改编模式 | [参考改编 Workflow](references/workflow/reference-adaptation.md) |
| 从零创作模式 | [从零创作 Workflow](references/workflow/from-scratch.md) |
| 现有项目续作模式 | [现有项目续作流程](references/workflow/existing-project.md) |
| 流程执行原则、确认方式与完成条件 | [流程共用说明](references/workflow/common.md) |
| 处理原稿的保留、转换与改编 | [参考与转换](references/reference-conversion.md) |
| 规划、维护模块大纲 | [大纲说明](references/design/course-outline.md) |
| 设计信息结构与页面构图 | [设计学](references/design/design.md) |
| 设计交互与操作反馈 | [交互设计](references/design/interaction-design.md) |
| 处理视觉层级、留白与色彩 | [美学](references/design/aesthetics.md) |
| 教学目标、学习过程与习题 | [教育学](references/design/pedagogy.md)、[习题设计](references/design/quiz.md)，仅教学场景选读 |
| React 页面与工程接入 | [工程实现](references/implementation.md) |
| 检查、截图、验收与评分 | [评估脚本与验收](references/eval/evaluation.md)、[现有 Rubric](references/eval/rubric.md)，按场景选择适用项 |
| 工具、依赖与命令参数 | [工具索引](references/tools.md)、[统一入口](scripts/tools.py)、[工具清单](scripts/catalog.json) |
| 模块身份与静态资源接入 | [模块身份](references/module-identity.md)、[模块资源](references/module-assets.md) |
| 模型调用与较重计算 | [大模型调用](references/computing/llm.md)、[模型计算](references/computing/gpu.md)，按任务需要选读 |
| 用户明确要求采用或维护个人偏好 | [个人偏好](references/preferences.md) |
