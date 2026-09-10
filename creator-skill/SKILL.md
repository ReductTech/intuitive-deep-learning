---
name: creator-skill
description: 规划、设计、实现或验收本仓库中的 React 课程模块与 1600×900 Web PPT。用于把教师材料发展为课程认知路径、单页教学界面和 Guide/PPT；普通 React 页面开发不应触发。
---

# 课程创作

把主题、笔记、截图、教材、数据、论文或案例发展成帮助学习者形成理解的 React 课程模块。交付可以包含课堂投影用的 Web PPT 与课后探索用的 Guide；二者共享知识结构、认知旅程和核心状态，但版式与信息密度可以不同。

## 使用方式

先完整读取 [references/common.md](references/common.md)，它适用于所有课程创作任务。然后只读取当前阶段需要的文件：

- 分析材料、建立教学 Brief、认知地图或页面大纲：读取 [references/course-planning.md](references/course-planning.md)。
- 设计、修改或精修某一页：读取 [references/page-design.md](references/page-design.md)。
- 已确定当前页的教学功能、需要读取该类型的目标与判断边界：先读取 [styles/index.md](styles/index.md)，再只读取它指向的一种页面类型。
- 编写或调整 React 代码、课程结构、共享状态、路由或素材：读取 [references/implementation.md](references/implementation.md)。
- 验证单页、整套课程或交付质量：读取 [references/validation.md](references/validation.md)。

只处理一个阶段时不要预读其他阶段。完整创作任务也应随阶段推进再加载对应文件，不要一开始全部读入。

## 三层决策

课程创作必须依次解决三个不同层次的问题：

1. **教学结构**：学习者要理解什么，哪条证据促成理解变化；
2. **视觉结构**：知识对象以怎样的空间关系被看见，注意力如何移动；
3. **React 实现**：用哪些组件、数据、素材与状态实现该视觉结构。

不得从组件、卡片、分栏或现成页面结构直接开始。实现便利不能反过来决定知识如何呈现。

## 默认工作节奏

```text
理解材料 → 教学 Brief → 认知地图 → 课程视觉系统 → 页面大纲
→ 单页 Visual Plan → 素材获取 → React 实现
→ 1600×900 截图 → Visual Critic → 重构 → 教学复盘
```

默认一次只设计和实现一页。老师明确要求整套完成，或多页存在必须同时处理的强依赖时，可以连续推进，但仍逐页构图和验证。

单页构图时同时读取 [references/ppt-composition.md](references/ppt-composition.md)。完成可运行页面后必须读取 [references/visual-critic.md](references/visual-critic.md)，查看真实截图并据此决定是否重构；代码审查、DOM 边界检查和截图审查不能互相替代。
