# 数据标注与数据增广

<!-- module-structure:start -->
## 模块入口与目录约定

- 课程 ID：`data-annotation-augmentation`；连续阅读入口：`/modules/data-annotation-augmentation` → `GuidePage.tsx`。
- 已实现页面索引：`outlines.json` 的 `pages`（24 页）。
- PPT：`/scenedeck/?deck=data-annotation-augmentation` → `DataAnnotationPpt.tsx`；复用共享 SceneDeck。
- 页面布局与页面样式放在 `pages/`；模块内复用交互放在 `components/`；数据、模型和服务按需分目录。
- 专属素材归当前模块 `assets/`；共享能力只引用 `modules/shared/`，不依赖其他课程或 `modules-legacy/`。
- 教学画布为 1600×900；独立文字使用 Shared Typography；入口不复制播放器。
- 从仓库根目录运行 `npm run dev`，检查运行 `node modules/check-module-structure.mjs` 与 `npm run typecheck`。
<!-- module-structure:end -->

完整 24 页互动教程，面向初学者。先给水果照片标类别，再依次探索任务定义、标签编码、标注规范、分歧复核、目标框与掩膜、质检、增广的动机与目的、任务语义与增广、标签同步、Cutout / Mixup / CutMix、来源分组切分与条件覆盖、随机策略和能力边界。最后迁移到左转与右转标志任务。

## 使用

在仓库根目录启动：

```sh
pnpm exec vite --config modules/Data-Annotation-Augmentation/preview/vite.config.ts
```

- 连续阅读：`http://127.0.0.1:5184/modules/Data-Annotation-Augmentation/preview.html`
- PPT 演示：同一地址添加 `?view=ppt`，使用 Shared SceneDeck 的导航、缩略图和讲稿。
- 单页审查：添加 `?view=page&slide=01`，页码范围 01–24。

两种呈现复用相同的独立页面和交互。所有逻辑画布固定为 1600×900，外层等比例缩放。选择题使用本地反馈，不需要模型评价服务。

可拖动框边、绘制简化掩膜、拖动裁剪窗口、同步翻转框、调整亮度与实际像素噪声/模糊、重放随机种子、比较在线重采样和离线固定副本、修正流程顺序。操作提供教学反馈，不伪造模型训练结果或准确率。

## 素材与边界

12 幅水果示例与 2 幅情景背景由内置 image_gen 生成，采用写实摄影风格，包含不同外观的苹果和梨，以及切开、遮挡、双水果、户外和低照度场景。它们是合成教学样本，不是实测数据，不用于品种鉴定。提示词及原始生成文件路径保存在 `preview/generated-assets.json`。目标框与掩膜均为人工教学示意，掩膜编辑器是简化交互，不作为精确分割标注工具。裁剪保留比例采用框面积；示例的 25% 阈值不是通用标准。

课程大纲与逐页讲稿在 `outlines.json`；`course.tsx` 保持 Guide 与 PPT 的相同顺序。页面和专属组件均在本模块，未修改 Shared。

## 构建与正式注册

```sh
pnpm typecheck
pnpm exec vite build --config modules/Data-Annotation-Augmentation/preview/vite.config.ts --outDir output/Data-Annotation-Augmentation
```

本模块已使用仓库现有身份工具生成稳定 UUID，并注册主工程入口。图片与缩略图保存在本模块 `assets/`，通过 Shared `moduleAssetUrl(moduleIdentity.id, relativePath)` 引用。无需修改主工程资源解析脚本。后续内容更新保持 UUID 不变。

## 课程参考

- [Torchvision transforms](https://docs.pytorch.org/vision/stable/transforms.html)：图像、框、掩膜共享几何变换参数。
- [Scikit-learn grouped cross-validation](https://scikit-learn.org/stable/modules/cross_validation.html#cross-validation-iterators-for-grouped-data)：同一来源组的独立切分。
- [Scikit-learn data leakage](https://scikit-learn.org/stable/common_pitfalls.html#data-leakage)：划分数据后才拟合训练阶段的数据处理。

- [TensorFlow data augmentation tutorial](https://www.tensorflow.org/tutorials/images/data_augmentation)：训练视图变化、过拟合与泛化的目的。

课程按照“明确任务 → 可靠标注 → 有效增广 → 独立数据 → 训练策略 → 验证迁移”组织。每页副标题显示当前环节及本页重点，目录与讲稿遵循相同结构。

新增分类标签的整数与独热编码，以及 Cutout、Mixup、CutMix 三页进阶增广；混合示例采用分类软目标，不直接套用于检测或分割。软目标数值不是模型预测。

- [PyTorch CrossEntropyLoss](https://docs.pytorch.org/docs/stable/generated/torch.nn.CrossEntropyLoss.html)：整数类别与概率目标接口。
- [Cutout 原论文](https://arxiv.org/abs/1708.04552)
- [Mixup 原论文](https://arxiv.org/abs/1710.09412)
- [CutMix 原论文](https://arxiv.org/abs/1905.04899)

修订：合并复核与规范、合并目标框与坐标、整合数据泄露与训练分支说明；围绕颜色和形状捷径展开增广。CutMix 直接拖动裁出的梨图区域，无模式切换；允许部分越界，并按图内实际替换面积计算权重。随机视图为实际计算的图像，最多 20 张。

CutMix 对照：[作者官方实现](https://github.com/clovaai/CutMix-PyTorch/blob/master/train.py)，原实现采用同坐标矩形替换；本页使用可移动裁片的教学交互，保留实际替换面积权重。

## 全课程复查（2026-10-12）

已逐页核对 24 页的教学顺序、默认画面和主要交互。同步修正合并、删页后的大纲与讲稿；明确多标签与单标签分类的过渡、训练/验证/测试集的用途，以及选择题和流程排序的具体错误反馈。

验证包括：类型检查与独立构建、全部页面的布局边界与图片加载、Guide 导航和窄窗口等比例缩放、PPT 24 页导航、画笔重叠像素与擦除、裁剪双边拖动、图像/标签几何同步、Mixup 实际像素混合与目标权重、CutMix 越界实际面积、随机种子重放、在线/离线视图，以及最多 20 张不同随机增广视图与错标签继承。上述检查均通过；模块身份现已按当前仓库 UUID 规范补齐。

第一页采用独立的情景式全画布布局：两位分拣员各有两个麻袋，左边分苹果/梨，右边分圆/长，重点标出两袋中的圆梨；先判断两种分法，再揭晓任务并进入分类标注。两幅背景的生成提示词分别在 `preview/sacks-scene.json` 与 `preview/opening-scene.json`，其余教学页保持既有版式。
