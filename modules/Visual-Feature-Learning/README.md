# 视觉特征学习课件

<!-- module-structure:start -->
## 模块入口与目录约定

- 课程 ID：`visual-feature-learning`；连续阅读入口：`/modules/visual-feature-learning` → `GuidePage.tsx`。
- 已实现页面索引：`outlines.json` 的 `pages`（25 页）。
- PPT：`/scenedeck/?deck=visual-feature-learning` → `visualFeatureLearningPpt.tsx`；复用共享 SceneDeck。
- 页面布局与页面样式放在 `pages/`；模块内复用交互放在 `components/`；数据、模型和服务按需分目录。
- 专属素材归当前模块 `assets/`；共享能力只引用 `modules/shared/`，不依赖其他课程或 `modules-legacy/`。
- 教学画布为 1600×900；独立文字使用 Shared Typography；入口不复制播放器。
- 从仓库根目录运行 `npm run dev`，检查运行 `node modules/check-module-structure.mjs` 与 `npm run typecheck`。
<!-- module-structure:end -->

`visualFeatureLearningPpt.tsx` 注册实际的 25 个场景；`outlines.json` 按同一顺序记录每页标题、目标、交互与讲稿。PPT 导航标题直接读取大纲。修改页面行为后，应同步大纲描述和对应缩略图。

## 缩略图

缩略图不是浏览器运行时自动生成的。生成脚本启动 Vite，用 Playwright 访问 `/scenedeck/?scenedeckCapture=1&deck=visual-feature-learning&slide=<场景 ID>`，截图实际的 1600×900 画布，缩小为 400×225 PNG。术库 从 `assets/80396753-7fc8-4f55-9188-bddbdb828169/scenedeck-thumbnails/<场景 ID>.png` 读取；图片缺失时只显示章节文字。

在仓库根目录的 PowerShell 中运行：

```powershell
$env:PYTHONPATH = 'backend/src'
python -m idl_backend.tools.content.generate_scenedeck_thumbnails --module visual-feature-learning --digit-tsne-record datasets/artifacts/80396753-7fc8-4f55-9188-bddbdb828169/digit-tsne/mnist-full-v1/lr-0.002-batch-128/record.json
```

用 `--slide <场景 ID>` 只更新一张。依赖见根目录 `requirements-thumbnails.txt`；Vite 使用相邻 Cloud 仓库的运行时。

t-SNE 页读取 Cloud API 中的真实训练记录。未运行本地 API 时，`--digit-tsne-record` 可在截图浏览器内响应该请求，使用本地保存的完整 MNIST 记录。它检查版本、训练轮数、种子、数据集数量与请求参数，不改变正常页面的数据来源，也不会把记录复制到公开资源目录。默认截图参数为学习率 0.002、批大小 128。
