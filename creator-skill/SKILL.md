---
name: creator-skill
description: 在当前仓库中规划、设计、实现、修改和评估 React PPT 演示。用于从主题或材料创作演示、将既有 PPT/PDF/截图改编为 React 演示，以及继续开发或修复已有模块。支持教学、科研和商业汇报；不用于普通网站开发或一般文档编辑。
---

# React PPT 创作

## 开始任务

1. 确定目标模块、用户要求和已有成果。
2. 判断任务模式，读取对应 Workflow。
3. 确定当前阶段，从该阶段继续；复用已有大纲、设计、代码和确认结果。
4. 按当前动作读取必要资料，不预读整个参考目录。

| 任务模式 | 适用情况 | Workflow |
|---|---|---|
| 从零创作 | 从主题、文字、论文或其他材料组织演示 | [从零创作](references/workflow/from-scratch.md) |
| 参考改编 | 以既有 PPT、PDF 或逐页截图作为创作依据 | [参考改编](references/workflow/reference-adaptation.md) |
| 现有项目续作 | 继续制作、修改、重设计或修复已有模块 | [现有项目续作](references/workflow/existing-project.md) |

修改已有模块时，以现有项目续作为主流程；同时涉及原稿改编时，补读参考改编要求。

## 执行原则

- 每页明确主要信息或核心问题，内容与整份演示的目标一致。
- 图形、图片、动画和交互应承担表达或解释功能。
- 根据用户要求和当前 Workflow 决定大纲确认、设计预览及制作批次。
- 沿用已有确认与授权；局部修改只处理受影响内容及必要依赖。
- 仅在缺失信息会实质改变方向且无法合理推断时询问用户。
- 教学方法、习题、Guide 和讲稿按任务需要采用，不作为所有演示的必备内容。

完整执行与确认规则见[流程共用说明](references/workflow/common.md)。

## 工程约束

- 使用 React，沿用当前仓库的技术栈和模块入口，默认复用 modules\shared 下的工程脚手架。
- 页面使用 1600×900 固定画布，由外层等比例缩放。
- 独立文字使用 Shared `Typography` 或已封装它的组件。
- 模块大纲位于 `modules/<模块目录名>/outlines.json`。
- 遵守模块身份、静态资源和公共组件边界。

## 按动作读取

执行相应动作前，读取对应资料。

| 动作 | 资料 |
|---|---|
| 规划或修改大纲 | [大纲](references/design/course-outline.md) |
| 分析原稿及转换范围 | [参考与转换](references/workflow/reference-adaptation.md) |
| 编写或修改 React 页面 | [工程实现](references/engineering/implementation.md) |
| 创建或调整模块身份、资源 | [模块身份](references/engineering/module-identity.md)、[模块资源](references/engineering/module-assets.md) |
| 检查实现并交付 | [评估与验收](references/eval/evaluation.md) |

## 按问题选读

仅加载与当前问题有关的资料。

| 问题 | 资料 |
|---|---|
| 信息结构与页面构图 | [设计](references/design/design.md) |
| 视觉层级、留白与色彩 | [美学](references/design/aesthetics.md) |
| 操作方式与反馈 | [交互设计](references/design/interaction-design.md) |
| 教学目标与学习过程 | [教育学](references/design/pedagogy.md) |
| 习题与答案反馈 | [习题设计](references/design/quiz.md) |
| 页面质量评分 | [Rubric](references/eval/rubric.md) |
| 工具、依赖与命令 | [工具索引](references/tools.md) |
| 大模型调用 | [大模型调用](references/computing/llm.md) |
| 模型与较重计算 | [模型计算](references/computing/gpu.md) |
| 用户明确要求采用个人偏好 | [个人偏好](references/preferences.md) |

## 完成与交付

- 按改动范围检查内容、实际渲染和相关交互。
- 实现后的视觉检查使用真实页面，设计示意图不能替代运行结果。
- 修复已发现的重大内容、布局和交互问题，并复验。
- 简要说明完成内容、实际验证结果及尚未解决的限制。
- 未执行或受阻的检查如实标记，不声称通过。
