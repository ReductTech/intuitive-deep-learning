# 视觉 Transformer 与视觉语言模型

<!-- module-structure:start -->
## 模块入口与目录约定

- 课程 ID：`vision-language-models`；连续阅读入口：`/modules/vision-language-models` → `GuidePage.tsx`。
- 已实现页面索引：`outlines.json` 的 `pages`（27 页）。
- PPT：`/scenedeck/?deck=vision-language-models` → `VisionLanguagePpt.tsx`；复用共享 SceneDeck。
- 页面布局与页面样式放在 `pages/`；模块内复用交互放在 `components/`；数据、模型和服务按需分目录。
- 专属素材归当前模块 `assets/`；共享能力只引用 `modules/shared/`，不依赖其他课程或 `modules-legacy/`。
- 教学画布为 1600×900；独立文字使用 Shared Typography；入口不复制播放器。
- 从仓库根目录运行 `npm run dev`，检查运行 `node modules/check-module-structure.mjs` 与 `npm run typecheck`。
<!-- module-structure:end -->

27页 React 教学模块，Guide 与 SceneDeck 共用课程定义。页面、图片和缩略图都包含在本文件夹中。

## 导入

将整个 Vision-Language-Models 文件夹复制到兼容的 intuitive-deep-learning 仓库的 modules/ 下。无需复制或合并根目录 assets，不需要改 Shared 和路由。运行 npm install 与 npm run dev，入口会通过 outlines.json 自动注册。

- Guide：/modules/vision-language-models
- 演示：/scenedeck/?deck=vision-language-models

这是依赖课程框架 Shared 的模块源码，不是独立网页。若已有同 ID 模块，请先备份原模块再替换，避免重复注册。

## 资源与身份

- 图片：assets/images/
- 缩略图：assets/scenedeck-thumbnails/
- 图片 URL 由 media.ts 中的模块相对路径生成，生产构建由 Vite 打包。
- 缩略图通过 portable-thumbnails.css 在本模块的播放器范围内引用。
- 保留 outlines.json 的 UUID 和签名，不要重新生成身份。

## 教学与操作

15–16页为静态连续图解；第24页可点击预测、算损失、更新参数、再预测，并切换训练阶段。其余自动过程可暂停或重播。所有模型分数、特征与回答为教学示意，无 API 或 GPU 推理。

验证：npm run typecheck 与 npm run build。
