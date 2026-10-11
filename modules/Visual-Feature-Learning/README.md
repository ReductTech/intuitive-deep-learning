# 视觉特征学习课件

`visualFeatureLearningPpt.tsx` 注册实际的 25 个场景；`outlines.json` 按同一顺序记录每页标题、目标、交互与讲稿。PPT 导航标题直接读取大纲。修改页面行为后，应同步大纲描述和对应缩略图。

## 缩略图

缩略图不是浏览器运行时自动生成的。生成脚本启动 Vite，用 Playwright 访问 `/scenedeck/?scenedeckCapture=1&deck=visual-feature-learning&slide=<场景 ID>`，截图实际的 1600×900 画布，缩小为 400×225 PNG。SceneDeck 从 `assets/80396753-7fc8-4f55-9188-bddbdb828169/scenedeck-thumbnails/<场景 ID>.png` 读取；图片缺失时只显示章节文字。

在仓库根目录的 PowerShell 中运行：

```powershell
$env:PYTHONPATH = 'backend/src'
python -m idl_backend.tools.content.generate_scenedeck_thumbnails --module visual-feature-learning --digit-tsne-record datasets/artifacts/80396753-7fc8-4f55-9188-bddbdb828169/digit-tsne/mnist-full-v1/lr-0.002-batch-128/record.json
```

用 `--slide <场景 ID>` 只更新一张。依赖见根目录 `requirements-thumbnails.txt`；Vite 使用相邻 Cloud 仓库的运行时。

t-SNE 页读取 Cloud API 中的真实训练记录。未运行本地 API 时，`--digit-tsne-record` 可在截图浏览器内响应该请求，使用本地保存的完整 MNIST 记录。它检查版本、训练轮数、种子、数据集数量与请求参数，不改变正常页面的数据来源，也不会把记录复制到公开资源目录。默认截图参数为学习率 0.002、批大小 128。
