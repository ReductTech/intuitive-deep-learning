# 多层感知机

<!-- module-structure:start -->
## 模块入口与目录约定

- 课程 ID：`multilayer-perceptron`；连续阅读入口：`/modules/multilayer-perceptron` → `GuidePage.tsx`。
- 已实现页面索引：`outlines.json` 的 `pages`（5 页）。
- PPT：`/scenedeck/?deck=multilayer-perceptron` → `MultilayerPerceptronPpt.tsx`；复用共享 SceneDeck。
- 页面布局与页面样式放在 `pages/`；模块内复用交互放在 `components/`；数据、模型和服务按需分目录。
- 专属素材归当前模块 `assets/`；共享能力只引用 `modules/shared/`，不依赖其他课程或 `modules-legacy/`。
- 教学画布为 1600×900；独立文字使用 Shared Typography；入口不复制播放器。
- 从仓库根目录运行 `npm run dev`，检查运行 `node modules/check-module-structure.mjs` 与 `npm run typecheck`。
<!-- module-structure:end -->

已初始化独立模块身份、Guide 与 PPT 入口。当前迁入原 Regression-Loss 第16—20页，共5页；页面内容与交互保留。后续多层感知机内容待设计。

- Guide：`/modules/multilayer-perceptron`
- PPT：`/scenedeck/?deck=multilayer-perceptron&slide=01`
- 独立验收画布：追加 `&scenedeckCapture=1`

| 页码 | 标题 |
| --- | --- |
| 01 | 从数值预测到类别预测 |
| 02 | 从线性分数到类别概率 |
| 03 | 从概率到线性分数 |
| 04 | 逻辑回归的概率预测与类别判定 |
| 05 | 逻辑回归的参数估计 |

泰坦尼克号完整891条训练记录与插图由本模块独立持有。参数估计使用714条年龄完整记录；性别女0男1、舱位1/2/3、年龄除80、票价除100。全批量梯度下降最小化平均负对数似然，MAE仅用于监控。推理时固定参数并隐藏假想输入的实际标签。数据与图片来源见asset-sources.json。

课程页面内的rl-*样式前缀保留，以避免在纯迁移中改动视觉；不依赖原模块页面或资源。
