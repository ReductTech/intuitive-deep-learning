---
name: create-interactive-learning-module
description: 为 Intuitive Deep Learning 设计、实现并验收 React + TypeScript 交互式教学模块；同一套教学内容、业务模型和状态同时服务网页课程与 Web PPT 演示（一鱼两吃）。
---

# 交互式教学模块 Meta-Skill

## 使命：一条教学链，两种承载方式

本仓库的模块不是静态课件、文章或网页截图。模块要让学习者先亲手经历一个现象，再发现旧直觉的边界，最后用一个可以迁移的概念解释、预测或操作它。

“一鱼两吃”不是把网页压缩成 PPT，也不是为 PPT 复制一套 JSX。它是一个单一教学源的两种宿主：

```text
教学契约 + LessonModel/Context/Service
                    │
             共享的 React Block
              ┌─────┴─────┐
              │           │
      Web Lesson Host   PPT Slide Host
      ModuleShell       1600×900 舞台
      LessonFlow        逐页导航/适配
```

四层职责必须保持清楚：

| 层 | 负责什么 | 不负责什么 |
| --- | --- | --- |
| 教学模型（model/context/service） | 领域计算、默认场景、判题、完成条件、跨幕语义状态 | 具体排版、网页滚动或 PPT 缩放 |
| Block | 一次教学体验：输入、操作、现象、反馈和结论 | 为另一端复制一份业务逻辑或文案 |
| Web 宿主 | `ModuleShell`、`LessonFlow`、滚动/解锁、完整课程流程 | 改写 Block 的计算和状态含义 |
| PPT 宿主 | 每页标题/分区、1600 × 900 舞台、尺寸和留白适配 | 把 Block 改成静态图片、重写判题或重置结果 |

PPT 可以改变区域比例、留白、展示密度和导航方式；不能改变概念顺序、公式含义、反馈结论或用户结果。网页与 PPT 是同一条鱼的两种吃法，鱼肉（内容、模型、状态）只能有一份。

## 0. 开工前：以当前工作树为准

开始设计或修改前，先读代码，不凭记忆套模板：

1. `modules/` 是唯一 active 模块树。至少阅读两个现有 React 模块（优先 `modules/Neuron-Guide/`、`modules/Loss-Guide/`）的 Page、Block、model/service、CSS 和资源组织。
2. `modules/Neuron-Guide/` 是“一鱼两吃”的主要参考：阅读 `ExpandedNeuronGuidePage.tsx`、`NeuronPptSlidePage.tsx`、`model/NeuronLessonContext.tsx` 以及代表性交互 Block。实际路径就是 `modules/Neuron-Guide/`，不要再引用不存在的 `modules/Neuron-Guide-React/`。
3. `modules-legacy/` 只用于考古内容、素材来源和旧流程对照。它是 archival，禁止 active 代码 import、fetch、link 或运行时加载其中任何代码和资源；不要复制 legacy 的命令式 DOM、全局脚本或旧样式。
4. 阅读 `modules/shared/react/index.ts`、`modules/shared/react/routing/UiKitPage.tsx` 及实际组件实现，确认公共 API，而不是猜 class 或 props。
5. 阅读 `src/app/modules.tsx`、`src/app/routes.tsx`、`web_ppt/`，确认当前模块注册、Block 预览和 PPT 装载方式。
6. 同时检查 `AGENTS.md`；它对 active/legacy 边界、Typography、PPT 容器和布局有硬约束。

先记录一份“现状差异表”：可复用的内容、需要迁移的 legacy 内容、已有 shared 能力、尚缺的 model/state、网页与 PPT 当前是否已经发生漂移。发现代码与旧文档冲突时，以代码和 `AGENTS.md` 为准，并在实现计划中写明迁移决定。

`Neuron-Guide` 提供了一个重要判断：legacy 中有价值的是认知门槛，而不是实现形式。它把“一个现实决定 → 一个因素 → 接受权重并调整输入 → 解锁更多因素 → 加权总分 → 偏置门槛”逐层展开；active React 再把同一条机制延伸到线性边界和 ReLU 非线性。迁移时保留这种因果链、失败反馈和解锁理由，重写为共享 React Block/model；不要搬运 legacy 的 imperative DOM、Canvas 全局函数或固定默认值。网页短路径、Expanded 课程和 PPT 逐页路径可以是同一内容图的不同子集或节奏，但节点本身只能有一个实现。

## 1. 先写教学契约，不先写页面

一个顶层模块围绕一个主要理解障碍，而不是罗列一个章节的所有知识点。开始实现前形成下面的短契约：

```text
模块主题：
核心难点：学习者原有的什么直觉会在什么现象前失效？
完成能力：学完后，学习者能做出什么新的判断、预测、解释或操作？
学习动机：这个概念解决了什么实际问题？
前置知识：默认只有高中数学与基础计算机常识，额外前置必须显式说明。
不包含：本模块刻意不处理哪些相邻概念？
认知路径：现象 → 旧规则的边界 → 新概念 → 领域验证/迁移。
```

把路径压成 2–4 个核心教学阶段；资源页、被动总结页不计入阶段数量。若存在超过四个互相独立的学习目标、明显切换前置知识，或一道迁移任务无法覆盖全部目标，先拆成多个顶层模块并说明依赖关系。

每个阶段只打开一个主要概念或变量，使用下面的闭环设计：

```text
要回答的问题 → 学习者的预测/操作 → 唯一主要变量
→ 可见现象与即时反馈 → 得出的结论 → 换情境检查
```

术语和公式在现象之后出现，作为对经验的压缩表达，而不是第一屏标题。交互只有在改变学习者的判断能力时才值得加入；动画、三维、滑杆或按钮本身不是教学目标。

## 2. 先定单一内容编排，再派生两端

为每个 Block 写稳定的定义（可以是 `LessonManifest`/`BlockDefinition[]`，也可以是等价的集中式常量）：

```ts
type CompletionMode = 'check' | 'cue' | 'passive';

interface BlockDefinition {
  id: string;                 // 模块内稳定、带语义、不可随意改名
  title: string;
  section: string;
  completionMode: CompletionMode;
  usesSharedState: boolean;
  stateInputs?: string[];
  stateOutputs?: string[];
  render: (args: { complete: () => void; isComplete: boolean }) => ReactNode;
}
```

同一份定义派生：

- 网页 `LessonFlowStep[]`（顺序、`revealMode`、`completesLesson`）；
- PPT slide registry（`id/title/section`，按页渲染同一 Block）；
- `/dev/blocks/<module>/<block>` 预览元数据和路由。

这样可避免网页数组、PPT 数组和预览路由各写一遍后逐渐漂移。若当前框架暂时需要三份数组，也必须由同一份 Block 元数据生成，或在注释中明确它们的差异和测试方式。

### 三类 Block 契约

1. **理解检查型（`check`）**：有真实操作、预测、答题或实验目标；只有达到有意义的完成条件才调用宿主传入的 `complete()`。点击过按钮、拖过滑块或任意非空回答都不算完成。
2. **讲解/观察型（`cue`）**：用于生物结构、公式解释、概念过渡等。Block 负责展示和观察，不为了凑完成度硬塞按钮；网页由 `LectureAdvanceCue`/`ScrollCue` 等统一宿主包装，PPT 由导航推进。
3. **总结/资源型（`passive`）**：课程结尾、延伸视频和资源导航不推进主课程完成，不伪造 `onComplete`。

Block 内部应明确：学习者进入时知道什么、希望产生的理解变化、关键现象、反馈文案、检查方式和卸载清理。保留错误输入并提供可重试路径；正确动作要解锁下一层解释、控制或场景，而不是只改变按钮颜色。

## 3. 共享教学模型与状态协议

### 状态分层

先画状态表，再实现组件：

| 状态类别 | 例子 | 所有权 |
| --- | --- | --- |
| 领域语义状态 | 用户决定、因素、输入值、权重、偏置、网络参数、已验证结论 | 共享 `Context`/model；跨 Block、网页和 PPT 必须连续 |
| 流程状态 | 某个 step 是否完成、当前阶段、完成度 | Web `LessonFlow` 或共享流程状态，按宿主需要恢复 |
| 展示/瞬时状态 | hover、动画帧、面板展开、画布尺寸、PPT 缩放 | Block 本地；不可成为下一页教学前提 |

凡是后一页要解释、计算或继续操作的结果，都必须进入共享 Provider/model/service。不要依赖组件内存“自然保留”，因为 PPT 翻页可能是 iframe 或独立路由重新挂载。PPT-only 的理论讲解可以没有新状态，但若它读取前页结果，必须从同一 Context 读取。

### 持久化、恢复与版本

- 为模块和每类活动使用稳定、带语义的 state key；只有结构或判题语义不兼容才升级版本。
- 持久化前做 schema 校验、范围约束和 `normalize`；无效或旧结构安全回到初始状态。
- 跨 iframe/逐页导航优先使用同源 `localStorage` 等同步恢复；telemetry 可作长期或远端恢复，但不能用较旧结果覆盖刚完成的本地选择。
- 恢复时记录版本和来源，先读最新本地状态，再考虑远端状态；禁止在异步 hydration 尚未完成时自动触发课程完成或覆盖输入。
- 用户原文与服务规范化结果可以分离保存：若界面要求保留原文，不要让后端改写反向覆盖输入框；下游计算使用规范化结果即可。
- telemetry 事件必须幂等，使用稳定 event/state key，避免同一动作因重渲染或翻页重复上报。

外部服务（例如把用户的现实决定拆解成因素）只能增强个性化，不能成为概念或本地完成条件的黑箱。要提供加载、错误、拒绝、无服务和重试状态，并准备确定性的默认场景或降级路径。

## 4. Web Host：完整课程的连续体验

Page 只负责编排，不堆计算、请求和复杂可视化生命周期：

```tsx
<ModuleShell title="..." subtitle="...">
  <LessonFlow steps={lessonSteps} persistenceKey="<module>-<version>" />
</ModuleShell>
```

- 用 `ModuleShell`、`LessonFlow`、`LessonStage`、`LessonFooter` 组织课程；step 和题目使用稳定唯一 key。
- 每个 Block 独立接收 `complete`；最后一个真实考核 Block 才设置 `completesLesson: true` 并调用 `complete()`，随后才显示被动 Footer。
- `revealMode` 服务于认知门槛：继续/滚动必须有下一步理由，不能只是装饰性翻页。
- 完整课程、单 Block 预览和恢复后的深链接都要能独立渲染；预览若没有共享状态，使用明确的默认场景，不修改业务含义。
- 所有 timer、listener、RAF、ResizeObserver、MutationObserver 和第三方图表/3D 实例在卸载时清理。

## 5. PPT Host：舞台适配，不另做课件

PPT 每页对应一个 Block；只有用户明确要求同页组合时才组合多个 Block，并保持一个主旨和清晰阅读顺序。PPT 外壳通常只提供：

- slide `id/title/section` 和 query/导航解析；
- `NeuronLessonProvider` 等同一共享 Provider；
- 固定 1600 × 900 逻辑画布、视口缩放和最小必要的舞台适配类。

硬约束：

- `.ng-ppt-slide-surface`（或对应模块根）及其所有后代必须在 1600 × 900 内；不得靠裁切、横向滚动或整体缩小字体解决溢出。
- Grid/Flex 子项设置 `min-width: 0`、参与布局的内容设置 `max-width: 100%`；列使用百分比或 `minmax(0, <fr>)`，总和连同 gap/padding 必须适合父容器。
- 公式、媒体、SVG、Canvas、图表、3D 容器都要 `max-width: 100%`，并有合理的最小可操作区域。
- PPT 端控件仍是真实控件：滑杆、选择、提交、重置和反馈不能被静态占位图替换。对纯讲解 Block 不传无意义的完成回调。
- 不要让重复页头、厚重边框或嵌套卡片挤占教学内容；PPT-only 的额外展开页可以存在，但必须渲染共享 Block、共享文案或共享 model，不得复制 `PptXxxBlock`。

逐页检查网页与 PPT：内容、公式、默认值、交互结果和状态恢复是否一致；在浏览器中测量 `.ng-ppt-slide-surface` 全部后代的 `getBoundingClientRect()`，确认无任何边界超出画布。

## 6. Shared、Typography 与模块边界

写新组件前按语义搜索 `modules/shared/react` 和 `/shared/ui-kit`：

- 布局/流程：`ModuleShell`、`LessonFlow`、`ContentBlock`、`LessonStage`、`LessonFooter`；
- 控件：`Button`、`RangeControl`、`Select`、`TextInput`、`Switch`；
- 教学反馈：`Question`、`FormulaBlock`、`ValueTile`、`Callout`、`NoticeStrip`、`Feedback`、`AttentionHint`；
- 图表：`FunctionPlot`、`PlotlyChart`、`EChartsChart` 及其 wrapper。

缺失且第二个模块可能复用的能力应扩展 shared，并同步公共出口和 UI Kit；领域专属棋盘、网络图、Canvas/SVG 舞台才留在模块目录。active 模块的资产必须放在自己的目录或 `modules/shared/`；不引用 `modules-legacy/`。

### Typography 是硬约束

模块所有独立文字（标题、正文、标签、按钮旁注、图例、节点名、数值标题、公式说明、空状态）使用 shared `Typography`，只能从 `display`、`h1`、`h2`、`h3`、`subtitle`、`body`、`bodySmall` 按语义选择，颜色用 tone/token。

模块 CSS 不得覆盖 Typography 的 `font-size`、`font-weight`、`line-height`，不得用 px/rem/clamp、transform 或局部变量绕过文字系统；文字放不下时先精炼文案、改布局或降低信息密度。第三方 Canvas/SVG 若无法渲染 Typography，只能使用与对应 token 完全一致的字体属性，外围说明仍用 Typography。数学上下标使用 `<sub>`/`<sup>` 或 shared 公式组件。

私有 CSS 必须以唯一模块根类限定；私有类、变量和 keyframes 使用同一模块前缀。禁止未限定的 `:root`、`html`、`body`、`*`、裸 `.card`/`.button` 等全局选择器，也不要猜测或重定义 `.edu-*`、`.dl-*`。补齐窄屏、键盘焦点、对比度和 `prefers-reduced-motion`。

## 7. 实施顺序：一次完成一个 Block，双端立即验证

按下面循环推进，不要先生成一张无法验收的大页面：

1. **盘点**：完成现状差异表，确认 active 路径、shared API、legacy 可借鉴内容和双端入口。
2. **契约**：写教学目标、误解、认知路径、Block manifest 和状态表；决定哪些阶段是 `check`、`cue`、`passive`。
3. **模型**：先实现纯计算、schema、normalize、判题和确定性默认场景，再接 UI；定义需要跨页的 state key。
4. **首个 Block**：实现一个真实现象和真实完成条件，先在独立预览路由验证。
5. **接入 Web**：把同一个 Block 放入完整 `LessonFlow`，确认解锁、恢复和完成状态。
6. **接入 PPT**：把同一个 Block 放入 slide registry 和 1600 × 900 舞台，确认控件、状态和布局。
7. **验收后再继续**：当前 Block 的网页、PPT、预览和清理行为通过检查后，才开始下一个 Block；不要让多个智能体同时编辑同一模块。
8. **收尾**：最后一个真实检查 Block 调用 `complete()`，再接总结/资源页；完成所有注册和双端验收。

推荐目录（按需要增减，不预建空文件）：

```text
modules/<ModuleName>/
├── <ModuleName>Page.tsx          # Web Host
├── <ModuleName>PptSlidePage.tsx  # PPT Host（若需要）
├── blocks/                       # 每个 Block 只实现一次
├── model/ 或 domain/             # 纯计算、类型、状态机
├── services/                     # 确有请求时才建立
├── components/                   # 可复用但模块专属的图表/舞台
├── assets/                       # 模块专属资源
└── <module-prefix>.css
```

## 8. 注册与交付

完整模块在 `src/app/modules.tsx` 注册唯一 `id/title/description/path/badge/element`（以及适用的类型、难度和受众）；路径使用稳定小写短横线。`src/app/routes.tsx` 会展开完整模块路由，不要重复手写同一路由。

每个 Block 都要在 `src/app/routes.tsx` 注册：

1. 导入 Block；
2. 向 `blockPreviews` 添加唯一元数据和 `/dev/blocks/<module>/<block>`；
3. 创建 `BlockPreview` 包装；有真实完成条件的 Block 才传入预览上下文的 `complete`；
4. 向 `appRoutes` 添加对应预览路由。

需要 PPT 时，同时注册稳定的 PPT 入口（例如 `/web-ppt/<module>`）和 slide id；不要让 PPT 入口绕过共享 Provider。除非用户明确要求，不要顺手修改 `intro.html`、CourseMap、旧模块元数据或 archival 文件。

## 9. 质量门槛与反模式

交付前必须能给出证据回答：

- 第一屏是否能让学习者做一件有意义的事？概念是否先以现象出现，再被命名？
- 每幕是否只有一个主要变量，且预测 → 操作 → 观察 → 反馈 → 判断闭环完整？错误、加载、拒绝、不可用、成功和重试状态是否清楚？
- 删除长段解释后，核心现象是否仍可观察？交互是否真的改变理解，而不是增加动效或操作量？
- Web 与 PPT 是否渲染同一个 Block、同一套计算/文案/状态？PPT 翻页或 iframe 重挂载后，前页结果是否仍是后页输入？
- 共享状态是否经过版本化 normalize，且本地新结果不会被旧 telemetry 覆盖？完成条件是否由真实理解检查触发？
- 是否只依赖 `modules/` 和 shared 资产？Typography、CSS 前缀、键盘、窄屏、减动效和清理副作用是否符合规范？
- PPT 是否在 1600 × 900 内，所有 Grid/Flex 子项可收缩，公式/媒体/Canvas 不溢出？
- 模块、每个 Block、PPT slide 和预览路由是否都能独立打开并继续？

明确禁止以下做法：

- 引用不存在的 `modules/Neuron-Guide-React`，或从 `modules-legacy/` 加载运行时代码/资源；
- 为 PPT 新建 `PptXxxBlock`、复制一份 JSX/文案/判题逻辑，或用网页截图冒充演示；
- 用组件 mount、状态恢复完成、渲染 step、任意非空文本或“点击继续”自动标记理解完成；
- 把需要跨页的结果留在 Block `useState`，用每页默认值覆盖用户刚完成的选择，或让旧远端状态覆盖本地新状态；
- 为了塞进 PPT 而裁切、横向滚动、整体缩小字体、叠加固定 `min-width`，或让页面依赖 overflow 隐藏错误；
- 用第三方全局脚本、裸 SVG/CSS 文字或自造控件绕过 shared API；
- 把高风险领域的教学模型伪装成个人诊断、治疗、投资、法律或其他现实决策建议。必须说明条件依赖、不确定性和证据边界。

最高原则：不要问“这个主题要讲哪些知识点”，而要问“学习者必须亲手经历什么，才会觉得这个概念是必要的？这次经历能否由同一个 Block 在网页和 PPT 中保持一致？”
