# DL UI 开发规范

本规范适用于 `modules/` 下的深度学习互动教学模块。`CourseMap` 是沉浸式课程导航页，可以使用独立场景布局；它的按钮、表单、弹层和文字状态仍应尽量遵循 DL UI 的基础视觉语言。

## 开始之前

创建或修改模块 UI 前，必须依次阅读：

1. `modules/shared/UI-GUIDE.md`
2. `modules/shared/ui-kit.html`
3. `modules/shared/module-starter.html`

视觉决策优先级：

1. `ui-kit.html` 中已经展示的组件和状态
2. `base.css` 与 `module-components.css` 中的共享实现
3. `module-starter.html` 中的标准页面结构
4. 模块自己的业务需求

不要从旧模块复制通用 UI。旧模块可能尚未完成 DL UI 迁移。

## 必须引用

所有教学模块至少引用：

```html
<link rel="stylesheet" href="../shared/base.css">
<link rel="stylesheet" href="../shared/module-components.css">
```

需要题目、继续提示、网络图或其它共享行为时引用：

```html
<script src="../shared/module-components.js"></script>
```

使用 Canvas 或坐标图时，优先复用：

```html
<script src="../shared/plotly-3.6.0.min.js"></script>
<script src="../shared/canvas-utils.js"></script>
<script src="../shared/plot-utils.js"></script>
```

## 标准页面结构

模块页面默认使用：

```html
<main class="edu-root">
  <section class="edu-shell">
    <header class="edu-header">
      <div>
        <h1 class="edu-title"><span data-i18n="module.header.title">模块标题</span></h1>
        <p class="edu-subtitle"><span data-i18n="module.header.subtitle">一句话学习目标。</span></p>
      </div>
      <span class="edu-badge" data-i18n="module.header.badge">M00 · 交互实验</span>
    </header>

    <nav class="edu-progress" aria-label="模块进度">...</nav>
    <section class="edu-stage edu-content-block" data-i18n-scope="module.concept">
      <header class="edu-content-head">
        <h2 class="edu-content-title"><span data-i18n="module.concept.title">概念标题</span></h2>
        <p class="edu-content-subtitle"><span data-i18n="module.concept.subtitle">一句话说明本块目标。</span></p>
      </header>
      <div class="edu-content-body">...</div>
    </section>
  </section>
</main>
```

页面标题、页面背景、内容外壳、徽标、进度和阶段容器不得在模块 CSS 中重新设计。

## 共享组件

优先使用以下类：

| 场景 | 标准类 |
| --- | --- |
| 页面根节点 | `edu-root` |
| 内容外壳 | `edu-shell` |
| 页面标题区 | `edu-header`、`edu-title`、`edu-subtitle`、`edu-badge` |
| 模块进度 | `edu-progress`、`edu-progress-item` |
| 教学阶段 | `edu-stage`、`edu-stage-head`、`edu-stage-copy` |
| 阶段文字 | `edu-kicker`、`edu-stage-title`、`edu-stage-description` |
| 基础内容块 | `edu-content-block`、`edu-content-head`、`edu-content-title`、`edu-content-subtitle`、`edu-content-body` |
| 教学提示 | `edu-callout` 及 `--orange`、`--blue`、`--green`、`--red`、`--stream` |
| 紧凑状态提示 | `edu-notice-strip` 及 `--orange`、`--blue`、`--green`、`--red` |
| 小型指标 | `edu-value-tile` 及 `--orange`、`--blue`、`--success`、`--danger` |
| 公式展示 | `edu-formula-block`、`edu-formula`、`edu-formula-term`、`edu-formula--fraction`、`edu-fraction` |
| 代码运行 | `edu-code-block`、`edu-code-toolbar`、`edu-code-source`、`edu-code-blank` |
| 神经元结构 | `DLModuleUI.renderNetworkGraph(...)` |
| 通用二维/三维坐标图 | `plotly-3.6.0.min.js`、`plot-utils.js`、`DLPlot.mount2D(...)`、`DLPlot.mount3D(...)` |
| 训练指标历史 | `DLPlot.mountTrainingHistory(...)` |
| 教学专属 Canvas | `canvas-utils.js`、`plot-utils.js`、`DLCanvas`、`DLPlot` |
| 实验工具栏 | `edu-toolbar`、`edu-toolbar-actions` |
| 实时指标 | `edu-metrics`、`edu-metric` |
| 主实验布局 | `edu-workspace` |
| 面板和卡片 | `edu-panel`、`edu-card` |
| 面板文字 | `edu-panel-title`、`edu-panel-description` |
| 通用文字 | `edu-body`、`edu-helper`、`edu-emphasis`、`edu-code` |
| 当前任务 | `edu-task` |
| 状态反馈 | `edu-status` |
| 可视化边框 | `edu-canvas-frame` |
| 选择卡片 | `edu-choice-grid`、`edu-choice-card` |
| 按钮 | `edu-btn` 及其修饰类；解释概念使用 `edu-btn--explain` 和 `data-dl-explain` |
| 参数与选项 | `edu-selectbox`、`edu-check`、`edu-check--option`、`edu-radio-group`、`edu-switch`、`edu-range` |
| 文本表单 | `edu-input`、`edu-textarea` |
| 标准题型 | `DLModuleUI.mountQuestion(...)` |
| 媒体面板单选题 | `dl-panel-choice-grid`、`dl-panel-choice`、`dl-panel-choice-media` |
| 继续提示 | `DLModuleUI.createContinueCue(...)` |
| 推荐视频 | `DLModuleUI.renderRelatedVideos(...)` |
| 学习导航 | `edu-resource-actions` |

状态类统一使用：

```text
is-current
is-done
is-selected
is-success
is-warning
is-danger
is-locked
is-unset
is-loading
is-revealing
```

不要为相同语义创建 `active-now`、`passed`、`error-state` 等另一套命名。

文字层级必须按职责复用，不得在模块 CSS 中临时创造同义字号：

- 页面唯一主标题使用 `edu-title`，标题下的一句话学习目标使用 `edu-subtitle`。
- 完整教学阶段使用 `edu-stage-title`，卡片或控制面板使用 `edu-panel-title`。
- 概念解释和步骤说明使用 `edu-body`，非必要的补充提示使用 `edu-helper`。
- 正文中的短关键结论使用 `edu-emphasis`，短代码、参数名和等宽数值使用 `edu-code`。
- `edu-emphasis` 只强调短语；`edu-helper` 不得承载必须阅读的主要信息。

## 基础展示与 i18n

普通教学内容优先组织成一个 `edu-content-block`。每个内容块只能包含一个大标题、一个副标题和一个正文区：

```html
<section class="edu-content-block" data-i18n-scope="module.concept">
  <header class="edu-content-head">
    <h2 class="edu-content-title"><span data-i18n="module.concept.title">概念标题</span></h2>
    <p class="edu-content-subtitle"><span data-i18n="module.concept.subtitle">一句话说明本块目标。</span></p>
  </header>
  <div class="edu-content-body">
    <p class="edu-body"><span data-i18n="module.concept.body.intro">正文内容。</span></p>
  </div>
</section>
```

- 正文出现第二个主题时，拆成新的 `edu-content-block`，不要继续增加同级标题。
- `edu-content-block` 与独立 `edu-formula-block` 必须水平居中；需要限制宽度时设置 `width` 或 `max-width`，不得靠左悬置。
- 每段可见自然语言必须由带 `data-i18n="稳定键"` 的元素包裹，不得把文字直接散落在无标记容器中。
- i18n 键使用 `模块.内容块.字段` 结构；同一句文本不要复用含义不明确的 `text1`、`label2`。
- 代码、公式、语言名和动态数值不翻译，但必须标记 `data-i18n-ignore="true"`，不能不加说明地裸放。
- 行为追踪由模块服务器自动注入 `shared/telemetry.js` 完成。模块不得添加行为追踪属性或通用控件追踪监听。
- `button`、`a`、输入框、选择控件、滑杆和标准考试题会被顶层自动监听。模块只实现真实业务交互，不负责发送行为记录。
- 文本输入默认只记录长度、是否为空和操作时长，不记录原文；不得绕过全局策略上传用户输入内容。

正文中的标准展示组件：

- 提示框颜色和播放方式必须分开选择。颜色使用 `edu-callout--orange`、`--blue`、`--green` 或 `--red`；需要逐字显示时再独立增加 `edu-callout--stream` 并调用 `DLModuleUI.streamText`。
- 四种颜色都必须允许直接显示与逐字显示。不得用颜色判断播放方式，也不要手写另一套打字定时器。
- 橙色用于任务和重点提示，蓝色用于观察和解释，绿色用于成功和完成，红色用于错误和风险。红绿不能只作为装饰色使用。
- 紧跟图表、模型或控制区的一句话状态使用 `edu-notice-strip`。蓝色用于普通观察，橙色用于待操作提醒，绿色用于完成，红色用于异常；长解释、任务说明和答题反馈仍使用 `edu-callout`，不得用紧凑提示条承载多段内容。
- 单个重要数值使用 `edu-value-tile`；多个指标可以并列，但每块只包含一个标签和一个值。重点结果用 `--orange`，普通指标用 `--blue`，成功状态用 `--success`，错误或风险用 `--danger`。
- 滑杆必须使用 `edu-range` 和 `data-dl-range`，并加载 `module-components.js`。共享脚本自动更新数值；模块不得重复编写移除 `is-unset` 或更新 `output` 的通用监听。
- 已有默认值时使用固定样式：不要添加 `is-unset`，初始 `output` 直接显示当前值。必须由学习者亲自选择时才使用提示样式：在 `edu-control` 与 `edu-range` 上同时添加 `is-unset`，将滑块暂放在中点且不显示数值；首次输入后共享脚本自动切为固定样式。不得把中点占位写入业务状态。
- 连续或分段由 `step` 决定，与固定或提示样式无关。显示精度使用 `data-range-digits`，单位使用 `data-range-suffix`，不要为格式化数值另写监听。

固定样式滑杆：

```html
<label class="edu-control" for="learningRateRange">
  <span class="edu-control-head">
    <span class="edu-label" data-i18n="module.controls.learningRate">学习率</span>
    <output class="edu-control-value" for="learningRateRange" data-i18n-ignore="true">0.50</output>
  </span>
  <input class="edu-range" id="learningRateRange" type="range" min="0" max="1" step="0.01" value="0.5" data-dl-range data-range-digits="2">
</label>
```

提示操作后自动转为固定样式：

```html
<label class="edu-control is-unset" for="layerRange">
  <span class="edu-control-head">
    <span class="edu-label" data-i18n="module.controls.layers">隐藏层数</span>
    <output class="edu-control-value" for="layerRange" data-i18n-ignore="true"></output>
  </span>
  <input class="edu-range is-unset" id="layerRange" type="range" min="1" max="5" step="1" value="3" data-dl-range data-range-digits="0" data-range-suffix=" 层" aria-valuetext="尚未输入">
</label>
```
- 需要吸引学习者执行下一步时，按钮同时添加 `dl-button-hint` 和 `data-dl-button-hint`。共享脚本会在首次鼠标移入、键盘聚焦或点击时永久移除当前页面中的闪烁状态；模块不得为此单独绑定 `pointerenter`、`focus` 或 `click` 监听。

```html
<button class="edu-btn edu-btn--primary dl-button-hint" type="button" data-dl-button-hint>
  <span data-i18n="module.actions.continue">点击继续</span>
</button>
```

- 需要就近解释概念、参数或操作含义时，使用 `edu-btn edu-btn--explain`，并把纯文本解释写入 `data-dl-explain`。共享脚本会在悬浮、键盘聚焦或触屏点击时把解释框放入浏览器最高显示层；模块不得手写 tooltip、z-index 或定位监听。

```html
<button class="edu-btn edu-btn--explain" type="button"
  data-dl-explain="学习率决定每次参数更新的步幅。"
  aria-expanded="false">
  <span data-i18n="module.actions.explain">询问</span>
</button>
```

- 需要提示学习者填写文本时，输入框使用 `edu-input` 和 `data-dl-input-hint`，并在页面初始化时调用一次 `DLModuleUI.bindInputHints(document)`。共享脚本会在首次鼠标移入、键盘聚焦、点击或输入时永久移除闪烁；模块不得重复实现效果消失监听。单个动态输入框可调用 `DLModuleUI.bindInputHint(input)`。

```html
<label class="edu-control" for="answerInput">
  <span class="edu-label" data-i18n="module.controls.answer">输入答案</span>
  <input class="edu-input" id="answerInput" type="text" data-dl-input-hint>
</label>
<script>
  DLModuleUI.bindInputHints(document);
</script>
```

- 已经发起异步操作、正在等待结果的按钮使用 `edu-btn is-loading`，同时设置 `disabled` 与 `aria-busy="true"`，防止重复提交并显示旋转边缘。仅因前置条件不满足而禁用的按钮不得使用 `is-loading`。
- 前置条件尚未满足时使用普通 `disabled` 按钮，并在附近说明解锁条件。静态禁用按钮不得添加 `is-loading` 或旋转动画，也不得使用“等待中”等会暗示后台仍在处理的文字。
- 只有用户明确要求“下拉提示”时才使用流程模式 2。提示等待期间只显示固定在视口底部的 `flow-scroll-indicator`；不得添加 `flow-scroll-runway`、spacer、空容器、额外 `min-height` 或其它为了制造滚动距离而产生的留白。确认后直接展开真实的下一阶段内容。
- 独立公式使用 `edu-formula-block`，块内只显示公式本体。变量含义只能通过悬浮或键盘聚焦解释。
- 带分母的公式使用 `edu-formula--fraction`、`edu-formula-prefix`、`edu-fraction`、`edu-fraction-numerator` 和 `edu-fraction-denominator` 的完整结构。不得在模块中依赖行内基线手写分式。
- 公式中的每个变量使用可聚焦的 `edu-formula-term`，同时提供 `data-tooltip`、`data-i18n-tooltip`、`aria-label` 和 `data-i18n-aria-label`。鼠标悬浮和键盘聚焦都必须显示文字解释。
- `edu-formula-term` 默认和悬浮时必须保持普通公式外观，不添加下划线、边框、底色或文字变色；交互只通过弹出的解释体现。键盘聚焦可以保留焦点轮廓。
- 公式下方不得添加说明文字、分隔线、变量图例或重复解释。
- 运算符和公式符号标记 `data-i18n-ignore="true"`；变量的自然语言解释使用稳定的 i18n 键。
- 可运行代码使用 `edu-code-block`，必须同时展示编程语言、运行状态、启动、停止、运行时间和请求帮助。
- 代码主体是带语法颜色的只读教学材料，不得做成完整编辑器，也不得使用 textarea 或 `contenteditable`。
- 需要学习者补全代码时，只能在目标代码行中嵌入 `input.edu-code-blank`。输入框始终为单行；不要让学习者修改整段代码或填写多行代码。
- 只读代码行使用 `data-i18n-ignore="true"`；代码填空的无障碍名称使用 `data-i18n-aria-label` 标记。
- 输入、权重、神经元和输出关系使用 `DLModuleUI.renderNetworkGraph(...)`，不要在模块中复制另一套网络节点与连线样式。
- 通用二维函数图、散点图和三维曲面必须依次加载 `plotly-3.6.0.min.js`、`canvas-utils.js`、`plot-utils.js`，再调用 `DLPlot.mount2D(...)` 或 `DLPlot.mount3D(...)`。模块不得直接调用 `Plotly.newPlot`，也不得重复手写坐标投影、拖动、缩放或旋转。
- 训练过程中按轮次记录的 Loss 与 Accuracy 使用 `DLPlot.mountTrainingHistory(...)`。Loss 传入原始非负数值，Accuracy 传入 `0` 到 `1` 的小数；不要在模块中手写双坐标轴、百分比格式和悬浮比较。
- 可拖动数轴、像素矩阵、手写板及其它教学专属交互继续使用 `DLCanvas` 与对应的 `DLPlot` Canvas API。不要为了统一坐标图而把所有 Canvas 强行迁移到 Plotly。
- Plotly 容器和教学 Canvas 都必须设置稳定宽高或 `aspect-ratio`。Canvas 通过 `DLCanvas.observe(...)` 响应尺寸变化；Plotly 统一开启 `responsive`，由 shared 封装负责响应式。可复用示例以 `ui-kit.html` 的“神经元与坐标”为准。

## 模块 CSS 的边界

模块 `style.css` 可以负责：

- Canvas、SVG、ECharts、Three.js 和 Phaser 的尺寸与布局
- 神经网络、像素矩阵、棋盘、分类边界等领域可视化
- 模块专属的多栏工作区
- 业务状态控制，例如训练中、阶段解锁和动画时序
- 共享组件无法表达的真实领域语义

模块 `style.css` 不得重新定义：

- 页面背景、字体和全局颜色
- `edu-shell` 的宽度、背景和阴影
- 标题、徽标和模块级进度的视觉样式
- 通用按钮、输入框、卡片、状态反馈和题目选项
- 与 shared 重复的圆角、阴影和响应式规则
- 新的一套 `--module-blue`、`--module-orange` 等同义颜色变量

需要附加业务类时使用双类名：

```html
<section class="edu-stage face-stage">
  ...
</section>
```

其中 `edu-stage` 负责视觉，`face-stage` 只能负责该实验特有的布局和状态。

## 视觉语言

DL UI 的默认视觉来自 MLP Playground、Activation Function 和 Face Recognition 的共同部分：

- 浅灰蓝页面背景与白色内容外壳
- 深蓝主色、橙色教学提示、绿色成功、红色错误
- 页面外壳使用较大圆角，内容卡片使用 8px 至 12px 圆角
- 标题紧凑、正文清晰，不使用营销页式超大标题
- 胶囊只用于徽标、进度和短状态，不用于大段命令
- 阶段内容以“目标、操作、反馈、下一步”组织
- 主可视化拥有更大空间，控制面板保持克制

不要引入 Bootstrap、Tailwind 或另一套 CSS 框架来覆盖 DL UI。确有必要引入第三方库时，只用于图表、3D、游戏或明确的领域能力。

## 教学交互

每个阶段应尽量回答四个问题：

1. 学习者现在要观察或完成什么？
2. 哪个控件是当前主要操作？
3. 操作后在哪里得到明确反馈？
4. 完成后如何进入下一阶段？

主操作使用 `edu-btn--primary`，同一区域通常只保留一个主操作。成功、接近、错误和加载状态必须通过文本表达，不能只依赖颜色。

标准选择题、判断题、填空题和简答题优先使用 `DLModuleUI.mountQuestion`。不要在模块中重新实现通用答题卡。

考试题型必须遵循：

- 所有题型单栏纵向展示，不得把不同题目排成左右两栏。
- 所有题型只显示题干，不显示题目副标题或补充 prompt；不要向 `DLModuleUI.mountQuestion` 传入 `prompt`。
- 单选题和判断题点击选项后立即判断正误，不显示提交按钮。
- 多选题、填空题和简答题完成作答后再点击提交；提交或“检查答案”按钮必须放在题干同一标题行，紧跟题干，不得放在选项或输入框下方。
- 所有题型都不显示“重做”或重置按钮。需要切换题目时可以由模块逻辑调用 `resetQuestion()`，但不能把它暴露成题目内操作。
- 多选题使用方形选择标记，单选题和判断题使用圆形标记。
- 需要比较坐标图、图片、视频或其它大型可视化时，使用媒体面板单选题。选项网格使用 `dl-panel-choice-grid`，面板使用 `dl-panel-choice`，媒体使用 `dl-panel-choice-media`；标题与补充标签分别使用 `dl-panel-choice-title`、`dl-panel-choice-caption`。
- 纯展示媒体可以使用 `button.dl-panel-choice` 让整张面板参与选择。只要选项包含可缩放 Canvas、视频控制器或 iframe，就必须改用非按钮的 `dl-panel-choice` 容器，在媒体上添加 `data-panel-interactive`，并用独立的 `button.dl-panel-choice-answer` 包裹编号、标题和说明。媒体区域只处理缩放、旋转或播放；点击选择按钮、普通图片与卡片空白区才选择答案。禁止把带控制器的视频或 iframe 放进 `button`。
- 媒体面板单选题仍然点击即判断，不显示提交按钮。正误状态使用 `is-correct`、`is-wrong`，反馈复用 `edu-callout`，不得在模块中复制面板视觉样式。
- 检查答案后的反馈必须复用 `edu-callout`：未作答提示使用橙色，正确反馈使用绿色，错误反馈使用红色。不得为题目另写一套反馈框视觉。
- 简答题初始界面只显示题目标题、空白输入框和提交操作；不显示题型徽标、补充说明、可见字段标签或 placeholder 提示。
- 简答题提交后的参考方向或 LLM 返回文本必须逐字显示。`DLModuleUI.mountQuestion` 默认流式显示同步反馈；异步后端返回后调用 `DLModuleUI.streamQuestionFeedback(question, tone, text)` 或挂载结果的 `streamFeedback(...)`。
- 不要对简答题反馈框直接设置 `textContent` 来一次性显示完整的 LLM 回答。加载提示和请求错误可以直接显示，最终模型回答必须使用流式反馈 API。

推荐视频统一使用 `DLModuleUI.renderRelatedVideos(...)`，并放进模块底部的标准 `edu-content-block` 正文区。内容块占据完整单栏宽度并水平居中，不得与考试题、控制面板或正文区组成左右两栏；内容块已经提供标题和副标题时传入 `showHeader: false`，避免视频组件重复生成标题。视频卡片只负责选择，不直接操作第三方 iframe；点击后在列表下方打开 16:9 大播放器。共享组件会限制 iframe 的弹窗和顶层跳转，模块不得移除该 sandbox。没有 iframe 时保留共享占位状态。

推荐资源内容块必须以 `edu-resource-actions` 学习导航收尾：左侧放次要样式的“返回课程目录”链接，右侧放主操作样式的“学习下一个”链接。正式模块必须把下一课链接替换为课程顺序中的真实模块地址；移动端由共享样式自动改为上下排列，不得另写布局。

流程控制统一使用 `ui-kit.html` 中的两种模式：

- 直接弹出：新内容出现后，页面快速缓入缓出移动到新内容顶部。
- 滚动提示：完成当前步骤后只显示视口底部的闪烁指示标，新内容保持隐藏。无论触发位置是否已经处于视口内，都必须等学习者主动向下滚动鼠标滚轮或点击指示标后，指示标才消失，新内容才出现并移动到顶部。禁止使用 `IntersectionObserver` 或元素可见性自动完成这次确认。
- 两种模式必须纵向排列并水平居中，不得设计成左右两栏，以免被理解为并列内容。

## 响应式和可访问性

- 桌面优先保证可视化可读，移动端必须能完成核心流程。
- 共享断点优先使用 `820px` 和 `640px`；只有可视化确有尺寸要求时才增加模块断点。
- 长标题、按钮文本和指标值不得溢出容器。
- 所有按钮显式设置 `type="button"` 或 `type="submit"`。
- Canvas、SVG、导航和进度提供可理解的 `aria-label`。
- 动态反馈区域使用 `aria-live="polite"`。
- 当前进度使用 `aria-current="step"`。
- 隐藏阶段同时维护 `hidden` 或正确的 `aria-hidden`。
- 动画必须兼容 `prefers-reduced-motion`。

## 新模块流程

1. 复制 `module-starter.html` 到 `modules/<module-id>/index.html`。
2. 替换标题、徽标、进度和阶段内容。
3. 先用 shared 组件完成页面，不创建模块 CSS。
4. 仅为领域可视化和必要布局新增 `style.css`。
5. 需要共享行为时使用 `DLModuleUI`、`DLCanvas` 和 `DLPlot`。
6. 在桌面和移动端检查完整学习流程。
7. 将真正通用的新模式先加入 shared 和 `ui-kit.html`，再在模块中使用。

## 修改现有模块

采用渐进迁移，不一次重写业务逻辑：

1. 给现有元素添加标准 `edu-*` 类。
2. 保留模块业务类和 JS 选择器。
3. 删除模块 CSS 中与 shared 重复的视觉声明。
4. 验证交互无回归后，再清理失效的旧样式。

不要为了统一 UI 修改训练算法、数据协议、后端接口或 Canvas 绘制逻辑。

## 完成检查

- [ ] 引用了 `base.css` 和 `module-components.css`
- [ ] 页面使用 `edu-root`、`edu-shell` 和标准标题区
- [ ] 多阶段模块使用标准进度和阶段组件
- [ ] 通用按钮、表单、卡片、反馈没有在模块 CSS 中重写
- [ ] 标准题型复用了 `DLModuleUI`
- [ ] 模块 CSS 只包含业务布局、可视化和状态逻辑
- [ ] 桌面与移动端文字、按钮、图表没有重叠或溢出
- [ ] 键盘焦点、ARIA 标签和动态反馈可用
- [ ] 新增的通用模式已经同步到 `ui-kit.html`
