# Neuron Guide

<!-- module-structure:start -->
## 模块入口与目录约定

- 课程 ID：`neuron-guide`；连续阅读入口：`/modules/neuron-guide` → `GuidePage.tsx`。
- 已实现页面索引：`outlines.json` 的 `pages`（18 页）。
- PPT：`/scenedeck/?deck=neuron-guide` → `neuronPpt.tsx`；复用共享 SceneDeck。
- 页面布局与页面样式放在 `pages/`；模块内复用交互放在 `components/`；数据、模型和服务按需分目录。
- 专属素材归当前模块 `assets/`；共享能力只引用 `modules/shared/`，不依赖其他课程或 `modules-legacy/`。
- 教学画布为 1600×900；独立文字使用 Shared Typography；入口不复制播放器。
- 从仓库根目录运行 `npm run dev`，检查运行 `node modules/check-module-structure.mjs` 与 `npm run typecheck`。
<!-- module-structure:end -->

这是神经网络基础课程模块，路由为 `/modules/neuron-guide`。

全课程的常规布局已迁移到 Tailwind utilities。首批手工迁移的两页是：

- `WeightedSumPage`：单个现实因素转成 0～1 输入。
- `ExtraInputsPage`：三个因素的输入、权重、贡献和求和。

其余页面也将常规布局规则移入 TSX 类名。需要伪元素、滑杆浏览器伪类、动画、状态关系、复杂图示或 Shared 组件内部选择器的规则仍保留在同名 CSS 中。不使用 Tailwind 的视口断点，也不加载 Preflight。
