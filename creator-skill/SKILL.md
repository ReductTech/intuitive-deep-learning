---
name: creator-skill
description: 在当前仓库中规划、设计、实现、修改和评估 React PPT 演示。用于从主题或材料创作演示、将既有 PPT/PDF/截图改编为 React 演示，以及继续开发或修复已有模块。支持教学、科研和商业汇报；不用于普通网站开发或一般文档编辑。
---

# React PPT 创作

## 开始任务

1. 确定目标模块、用户要求和已有成果。
2. 必须读取[流程共用说明](references/workflow/common.md)，再判断任务模式，读取对应 Workflow。
3. 确定当前阶段，从该阶段继续；复用已有大纲、设计、代码和确认结果。
4. 按当前动作读取必要资料，不预读整个参考目录。

| 任务模式 | 适用情况 | Workflow |
|---|---|---|
| 从零创作 | 从主题、文字、论文或其他材料组织演示 | [从零创作](references/workflow/from-scratch.md) |
| 参考改编 | 以既有 PPT、PDF 或逐页截图作为创作依据 | [参考改编](references/workflow/reference-adaptation.md) |

任务只分为上述两种模式。继续制作、修改或修复已有模块时，沿用原 Workflow 的制作与确认流程，从当前阶段接续，不因模块或 React 文件已经存在而切换模式。

## 执行原则

- 每页明确主要信息或核心问题，内容与整份演示的目标一致。
- 图形、图片、动画和交互应承担表达或解释功能。
- 根据用户要求和当前 Workflow 决定大纲确认、设计预览及制作批次。
- 沿用已有确认与授权；局部修改只处理受影响内容及必要依赖。
- 仅在缺失信息会实质改变方向且无法合理推断时询问用户。
- 教学方法、习题、Guide 和讲稿按任务需要采用，不作为所有演示的必备内容。
- 页面制作与修改后执行基础检查；仅在用户明确要求打分、评分或执行 Rubric 时加载评分说明。“检查”“看看问题”“优化”不自动触发评分，评分不替代基础检查或用户验收。

完整执行与确认规则见[流程共用说明](references/workflow/common.md)。

## 工程约束

- 使用 React，沿用当前仓库的技术栈和模块入口，默认复用 modules\shared 下的工程脚手架。
- 页面使用 1600×900 固定画布，由外层等比例缩放。
- 独立文字使用 Shared `Typography` 或已封装它的组件。
- 模块大纲位于 `modules/<模块目录名>/outlines.json`。
- 创作过程的所有中间产物统一保存在 `modules/<模块目录名>/_scratchpad/`，该目录由 Git 忽略。生成前先确定目标模块；原稿提取、设计图、评估截图、报告、快照和临时脚本均遵守此约定。正式大纲、实现代码与页面资源按各自工程约定保存。
- 遵守模块身份、静态资源和公共组件边界。

## 按动作读取

执行相应动作前，读取对应资料。

| 动作 | 资料 |
|---|---|
| 规划或修改大纲 | [大纲](references/design/course-outline.md) |
| 设计或调整页面内容、构图与交互 | [页面设计指导](references/design/design.md) |
| 分析原稿及转换范围 | [参考与转换](references/workflow/reference-adaptation.md) |
| 编写或修改 React 页面 | [工程实现](references/engineering/implementation.md) |
| 创建或调整模块身份、资源 | [模块身份与资源](references/engineering/module-assets.md) |
| 检查实现并交付 | [基础检查与验收](references/eval/checks.md) |

## 按问题选读

仅加载与当前问题有关的资料。

| 问题 | 资料 |
|---|---|
| 习题与答案反馈 | [习题设计](references/design/quiz.md) |
| 用户明确要求页面质量评分 | [Rubric Evaluation](references/eval/rubric-evaluation.md) |
| 准备执行创作工具命令（含大纲初始化），或查询工具、依赖与命令 | [工具索引](references/tools.md)，执行前必读 |
| 大模型调用 | [大模型调用](references/computing/llm.md) |
| 模型与较重计算 | [模型计算](references/computing/gpu.md) |
| 用户明确要求采用个人偏好 | [个人偏好](references/preferences.md) |

## 完成与交付

- 按改动范围检查内容、实际渲染和相关交互。
- 实现后的视觉检查使用真实页面，设计示意图不能替代运行结果。
- 修复已发现的重大内容、布局和交互问题，并复验。
- 简要说明完成内容、实际验证结果及尚未解决的限制。
- 未执行或受阻的检查如实标记，不声称通过。
