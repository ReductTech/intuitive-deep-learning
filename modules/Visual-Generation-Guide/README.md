# Visual-Generation-Guide 本地资源

<!-- module-structure:start -->
## 模块入口与目录约定

- 课程 ID：`visual-generation-guide`；连续阅读入口：`/modules/visual-generation-guide` → `GuidePage.tsx`。
- 已实现页面索引：`outlines.json` 的 `pages`（31 页）。
- PPT：`/scenedeck/?deck=visual-generation-guide` → `visualGenerationPpt.tsx`；复用共享 SceneDeck。
- 页面布局与页面样式放在 `pages/`；模块内复用交互放在 `components/`；数据、模型和服务按需分目录。
- 专属素材归当前模块 `assets/`；共享能力只引用 `modules/shared/`，不依赖其他课程或 `modules-legacy/`。
- 教学画布为 1600×900；独立文字使用 Shared Typography；入口不复制播放器。
- 从仓库根目录运行 `npm run dev`，检查运行 `node modules/check-module-structure.mjs` 与 `npm run typecheck`。
<!-- module-structure:end -->

课程图片保存在本模块的 `assets/images/` 下，由 `assets.ts` 解析本地开发和构建后的资源 URL，不再依赖外部图片服务或仓库根目录的 UUID 资源目录。

- `assets/images/`：46 个原始图片及 SVG 文件，保留原目录和文件名。
- `assets/sources.json`：来源、大小和 SHA256 校验值，仅供记录，不参与运行时加载。
- `assets/scenedeck-thumbnails/`：已有页面截图。
- `components/useDiagramAsset.ts`：从本地加载交互 SVG，保留原有图形和动画。
- `scripts/regenerate-result-svgs.ps1`：结果图输出到 `assets/images/`。

本课程按用户要求采用模块内资源目录；通用 `check.module` 要求根目录 UUID 文件夹的检查不适用于这一约定。共享组件及其依赖仍由仓库统一提供。
