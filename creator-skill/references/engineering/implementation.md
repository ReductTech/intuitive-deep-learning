# 工程实现

实现前先读目标页面与 `modules/shared/react/` 中相关能力。复用现有按钮、输入、滑杆、提示、题目、公式、渐进展示、课程流程和图表容器；不复制一套近似 Shared 组件。课程特有的知识图形与交互留在模块内，不修改 Shared 公共行为。

## 页面与视觉组件

- 第一页不使用 `ContentBlock`，单独实现封面。其余页面默认使用 Shared `ContentBlock` 的 `title`、`subtitle` 和标准标题区，不用模块 CSS 覆盖标题区；只有用户明确要求其他版式时，才在指定范围内更换。视觉样例默认只指导标题区以下内容，不复制其中的页码、分隔线和特殊标题样式。
- Typography 的使用遵循根入口约束；不在模块 CSS 中覆盖其 `font-size`、`font-weight`、`line-height`。
- 数学表达、尺寸关系、参数量与卷积等公式使用 `MathFormulaBlock`；不以普通文本拼接上下标、矩阵或近似公式，也不把普通说明塞入公式框。
- 颜色、字体、圆角、边框、阴影与状态优先使用现有语义化 CSS Token；模块 CSS 负责布局和课程专属视觉，不另建基础视觉体系。

## 固定画布

画布尺寸与缩放方式遵循根入口约束。禁止视口断点重排列数、控件换行或另做窄屏版式。

Grid/Flex 布局子项使用 `min-width: 0` 和 `max-width: 100%`；列轨道优先 `minmax(0, <fraction>fr)` 或百分比。列宽、间隔与内边距之和必须容纳在内容区域内，不堆固定像素最小宽度。

图片、SVG、Canvas、公式、媒体和交互组件使用 `max-width: 100%`，限制在父容器内。溢出应调整布局，不依赖裁切或 `overflow-x: auto`。样式可用模块 CSS 或已有 Tailwind 配置。

完成布局修改后，检查画布外越界与容器内部溢出，并实际查看截图。有意内部视口需明确标记用途且自身不越出画布，不用裁切掩盖本应完整展示的内容。当前 术库 容器为 `.ppt-slide-surface`；检查方法见[基础检查与验收](../eval/checks.md)。

## 活跃模块与依赖边界

- `modules/` 是唯一活跃模块目录。`src/`、`web_ppt/` 和活跃模块的运行时代码只依赖 `modules/` 内代码与正常项目依赖。
- `modules-legacy/` 是可随时移除的归档，不从中导入、请求、链接或加载运行时代码和资源。
- 模块 UUID、专属静态资源目录与引用方式统一见[模块身份与资源](module-assets.md)；真正共用的运行时代码和资源放在 `modules/shared/`。
- 只有实现已存在于 `modules/` 的模块才可注册到活跃应用，入口文件必须实际存在。

## 模块组织

- 模块根目录放入口、大纲及课程共用的数据、状态和组件。`pages/` 下每页对应一个有语义名称的目录，例如 `pages/OpeningPage/OpeningPage.tsx` 与 `pages/OpeningPage/OpeningPage.css`，不将逐页 TSX、CSS 平铺在 `pages/` 下。
- 开始设计或实现当前页时，才创建该页的语义目录；有临时产物时再创建页内 `_scratchpad/`。不按大纲批量建立未开始页面的空目录、`.gitkeep` 或占位实现。模块级 `_scratchpad/` 仅保存课程整体原稿、大纲备份和汇总记录。
- 页面专属组件与样式留在对应页目录；模块内组件样式与组件同名。类名使用模块前缀，避免跨模块选择器和样式污染。
- Shared 的候选抽取需已有两个及以上模块的真实复用需求，且不反向依赖课程实现，不出现模块名、ID 或模块 CSS 前缀。未经明确要求不修改 Shared，拿不准先留模块内。
- 不为 CSS 调整重命名稳定的课程、状态或数据 ID。删除不再使用的类名时同步清理引用。

## PPT 适配

复用 `modules/shared/react/presentation` 的 `SceneDeck`，模块仅提供 deck、稳定的 `moduleId` / `progressKey`、页面与讲稿，不复制播放器。`assetId` 使用本模块的 UUID；素材本体位于 `modules/<模块目录名>/assets/`，通过 UUID 解析，不以 UUID 命名本地目录。

简答题复用 Shared `Question` 的 Guide 提交与 PPT 揭示行为，不在页面读取 URL、DOM 类名或手写 `isPpt` 分支。具体接入示例位于主入口直接列出的“大模型调用”说明。
