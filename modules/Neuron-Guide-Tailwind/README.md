# Neuron Guide · Tailwind 试验版

这是 `../Neuron-Guide/` 的独立对照模块，路由为 `/modules/neuron-guide-tailwind`。原模块保持原样。

全课程的常规布局已迁移到 Tailwind utilities。首批手工迁移的两页是：

- `WeightedSumPage`：单个现实因素转成 0～1 输入。
- `ExtraInputsPage`：三个因素的输入、权重、贡献和求和。

其余页面也将常规布局规则移入 TSX 类名。需要伪元素、滑杆浏览器伪类、动画、状态关系、复杂图示或 Shared 组件内部选择器的规则仍保留在同名 CSS 中。试验版使用独立的课程 ID、路由和进度键；不使用 Tailwind 的视口断点，也不加载 Preflight。
