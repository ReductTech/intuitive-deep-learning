# Manual-Feature-Classification 迁移冻结

> 迁移目标：`Manual-Feature-Classification-React`。本文件只记录迁移前事实与复用关系，不改变旧模块运行逻辑。

## 页面与步骤表

| 顺序 | 旧页面内容 | 完成条件 | React 迁移归属 |
| --- | --- | --- | --- |
| 1 | MNIST 九宫格自动扫描、手动计数、特征向量顺序题 | 正确计数并确认统一顺序 | `ManualCountBlock` |
| 2 | 160 张真实 MNIST 图片的 0–9 平均九宫格热力图和识别小游戏 | 依次找出 1、0、8 | `DistributionBlock` |
| 3 | 9→18→10 双层 MLP、900 轮训练、Softmax 概率和手写测试 | 训练完成并在画板留下笔画 | `MlpTrainingBlock` |
| 4 | 特征工程视频、课程目录、下一课 | 展示即完成 | `ResourcesBlock` |

## 交互与状态表

| 状态 | 旧实现 | 迁移要求 |
| --- | --- | --- |
| 当前样本、九宫格计数、目标格 | 浏览器内存 | Telemetry SQLite 恢复；服务不可用时仅内存继续 |
| 特征向量选择、顺序解释与评语 | 59414 `/digit/vector-order-feedback` | 保留真实接口；失败后显示真实错误但不锁课 |
| 热力图小游戏顺序、进度、标记 | 浏览器内存 | 恢复已完成进度，不把恢复伪装成点击 |
| MLP 权重、准确率、手写像素 | 浏览器内存 | SQLite 恢复；自动轮播只属于观察状态，不产生用户事件 |
| 课程步骤与模块完成 | 旧滚动提示 | 现有 `LessonFlow`；完成操作幂等 |

## 资源与接口表

| 资源/接口 | 位置 | 迁移策略 |
| --- | --- | --- |
| 160 张 MNIST 图片 | `dataset/mnist/0..9/*.png` | Vite `import.meta.glob` 引用原资源，不复制、不伪造 |
| 九宫格算法 | `script.js` 的 `imageToPixels`、`computeNineGrid` | 模块私有 TypeScript 等价迁移 |
| 双层 MLP | `script.js` 的 LCG、标准化、tanh、softmax、SGD | 模块私有 TypeScript 等价迁移 |
| 顺序评语 | `http://127.0.0.1:59414/digit/vector-order-feedback` | 模块私有 service 保留 |
| 推荐视频 | 旧资源区 | 交给 shared `LessonFooter`/`RelatedVideos` 排版 |

## 复用关系表

| 能力 | 直接复用 | 模块私有保留 |
| --- | --- | --- |
| 页面外壳、标准阶段与内容卡片 | `ModuleShell`、`LessonStage`、`ContentBlock` | 旧模块响应式网格与画布细节 |
| 教学流程与课程完成 | `LessonFlow` | 三段活动内部状态机 |
| 标准按钮、题目、反馈、结尾 | `Button`、`Question`、`Callout`、`LessonFooter` | 悬停路径预览、画布点击游戏 |
| 状态存储 | shared Telemetry API | 模块私有 `usePersistedActivity` 适配 |
| 可视化 | 原模块 Canvas | 九宫格、热力图、MLP 网络均属本模块特有交互，不重复抽象到 shared |

## 冻结结论

- 旧页面没有 localStorage/SQLite；React 迁移通过现有 Telemetry SQLite 补齐刷新恢复。
- `features-feedback`、`featureReflection` 等脚本分支在旧 `index.html` 中没有挂载点，属于遗留死分支，不作为可见功能迁移。
- 当前未发现必须修改 `modules/shared` 才能解决的问题；本模块的画布和状态一致性均在模块内部适配。
