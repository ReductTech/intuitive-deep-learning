# tldraw 可编辑画布 · 接入演示

<!-- module-structure:start -->
## 模块入口与目录约定

- 课程 ID：`tldraw-demo`；连续阅读入口：`/modules/tldraw-demo` → `TldrawDemoPage.tsx`。
- 已实现页面索引：`outlines.json` 的 `pages`（1 页）。
- 此模块目前提供单一入口；不注册尚未实现的 PPT。
- 页面布局与页面样式放在 `pages/`；模块内复用交互放在 `components/`；数据、模型和服务按需分目录。
- 专属素材归当前模块 `assets/`；共享能力只引用 `modules/shared/`，不依赖其他课程或 `modules-legacy/`。
- 教学画布为 1600×900；独立文字使用 Shared Typography；入口不复制播放器。
- 从仓库根目录运行 `npm run dev`，检查运行 `node modules/check-module-structure.mjs` 与 `npm run typecheck`。
<!-- module-structure:end -->

