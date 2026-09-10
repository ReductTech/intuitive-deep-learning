# 工程实现

编写或调整 React 课程模块、课程结构、状态、路由、Shared UI 或素材时读取本文件。先遵守 [common.md](common.md)；实现具体页面时同时读取 [page-design.md](page-design.md)。

## 1. 实现前检查

先检查：

```text
AGENTS.md
modules/shared/react/index.ts
相关 Shared UI 实现
相关 active module
当前路由与注册方式
```

以代码而不是旧文档猜测当前 API。不得注册实现不在 `modules/` 中的模块，不得让 active code 依赖 `modules-legacy/`。

## 2. 课程单元的单一事实源

Guide、PPT 与开发预览尽量来自同一组课程单元定义，不分别维护标题、顺序和 description。共享的是课程语义，不是页面 DOM。

推荐关系：

```text
lesson unit definitions
        ↓
Guide LessonFlow
        ↓
PPT slide definitions
        ↓
block preview / route metadata
```

课程单元可按项目需要分别提供形态渲染器：

```ts
id
title
section
description
revealMode
guide: () => <ConceptGuide />
ppt: () => <ConceptPpt />
```

这不是强制接口。核心要求是课程结构变化能在一个主要位置完成，Guide、PPT 和 preview 不悄悄漂移。二者可复用领域可视化、数据、公式、状态、tokens 和 Typography；不要把 PPT 仅实现为“Guide 减去按钮和交互”。当信息密度、注意路径或空间关系不同，应使用不同页面组件。

## 3. Shared UI Kit

`modules/shared/react/index.ts` 是当前公共能力的入口。实际导出持续演进，以下只是能力类别和常见示例：

- 控件：`Button`、`TextInput`、`RangeControl`、`Switch`、`Select`、`ExplainPanelButton`；
- 布局：`ModuleShell`、`LessonStage`、`ContentBlock`、`CatalogItem`；
- 反馈：`Callout`、`NoticeStrip`、`Feedback`、`ReplayableCallouts`、`AttentionHint`；
- 学习组件：`Question`、`ValueTile`、`FormulaBlock`、`MathFormulaBlock`、`RelatedVideos`、`LessonFooter`、`PageRating`、`ProgressiveReveal`、`ScrollCue`、`PanelChoiceQuestion`、`CodeCompletionBlock`、`LessonFlow`；
- 可视化：`FunctionPlot`、`EChartsChart`、`PlotlyChart`。

凡 Shared 已提供的能力，优先直接使用。不要重写 Shared Button、RangeControl、基础表单、普通提示框或 Typography。

Shared 布局组件是 primitives，不是构图模板。`ContentBlock` 可以表达语义 section，但模块 CSS 不得仅因使用它就统一添加 Card 外观。若当前 Shared 没有裸内容舞台，可在实际复用需求成立时增加 `PptStage` 或 `ContentBlock` 的 bare 能力；应提供 `PptStage`、`MediaFrame`、`PlotArea`、`MappingBand`、`Annotation`、`SourceLine`、`Callout` 这类可组合职责，不创建 `HistoricalSlide`、`ConceptSlide`、`ComparisonSlide` 等页面模板。

## 4. 新组件边界

创建模块组件前依次判断：

1. Shared 是否已有等价能力；
2. Shared primitives 能否组合实现；
3. 它是否承载本课程特有的知识关系；
4. 是否会在多个 block 中复用；
5. 是否有清晰独立职责。

只为按钮、卡片、标题或普通表单换外观时，不创建模块专属组件。避免没有领域职责的 `FancyButton`、`InfoCard`、`ConceptCard`、`LessonCard`、`PrettyPanel` 或 `CustomSlider`。

## 5. 模块目录

每门 active 课程直接位于 `modules/<ModuleName>/`，不得挂在另一课程目录内。按实际需要组织，不为空目录而建目录：

```text
modules/<ModuleName>/
├─ <ModuleName>Page.tsx
├─ <ModuleName>PptSlidePage.tsx
├─ <ModuleName>.css
├─ blocks/
├─ components/
├─ assets/
├─ data/
├─ model/
├─ services/
└─ README.md / sources.md
```

- `blocks/` 服务教学流程；一个 block 通常表达一个主问题或认知阶段。不要把整门课程塞进一个巨大页面文件。
- `components/` 服务视觉或交互复用，不维护课程顺序，不单独持有跨 block 学习进度。
- `data/` 保存可审阅的事实、静态样本、示例数据和常量，并明确真实数据与教学示意数据。
- `model/` 保存公式、参数、派生指标、reducer、Context、Provider 和状态类型；页面不得重复实现同一公式。
- `services/` 只保存异步加载、本地缓存、API、LLM 评估和数据请求等副作用；没有副作用时不创建。
- `assets/` 保存模块运行时资源；只有真正跨课程共享的资源才放 `modules/shared/`。

## 6. 状态与课程流程

多个课程单元共享领域状态时优先使用模块 Provider。考虑初始状态、hydrate、用户操作后状态、error、loading、reset、revisit 与 persistence。

不要让每个 block 独立维护同一领域状态。LessonFlow 负责课程流程时，block 只报告完成状态，不自行管理整套课程可见性。Shared 已有流程能力时，不重复实现 wheel、touch 或 keyboard 推进逻辑。

## 7. 实现当前单页

默认一次实现一页，并同时完成：

- 页面构图与核心视觉证据；
- 文字、图表和公式之间的对应；
- 必要素材及来源记录；
- 交互或动效必要性判断；
- Shared 组件、Typography 与可访问性；
- 1600×900 画布验证。

开始 JSX 前必须先完成 [page-design.md](page-design.md) 中的 Visual Plan。实现顺序服从“教学结构 → 视觉结构 → React 实现”，不得因某个现成组件方便而改变核心空间关系。

多页共享强依赖或老师明确要求时可以批量调整，但不得用批量生成牺牲逐页设计质量。

## 8. 实际运行验证

运行课程并实际操作，覆盖适用状态：

```text
initial
hydrate
interaction
error
loading
complete
reset
revisit
PPT
```

验证 observable behavior，而不是只检查代码存在。PPT 必须执行实际边界框检查；不要仅凭截图或 CSS 推断没有溢出。随后在真实 `1600×900` viewport 截图并按 [visual-critic.md](visual-critic.md) 进行视觉审查；边界框检查与截图审查缺一不可。

## 9. 工程失败清单

不得出现：

- 从 `modules-legacy/` 导入代码或运行时资源；
- 原生基础控件替代已有 Shared 控件；
- 模块 CSS 修改 Shared Typography 基础字号、字重、字体或行高；
- Guide 与 PPT 分别维护课程顺序；
- 多个 block 重复领域计算；
- 为目录完整制造空 services/assets；
- 一个巨大组件包含整门课程；
- 为简单视觉效果创建大量无意义组件；
- 自行重写已有课程推进逻辑；
- 未处理交互的 reset、revisit、loading 或 error（在这些状态适用时）。
