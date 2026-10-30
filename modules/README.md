# 活跃课程模块

以 `Neuron-Guide` 为工程组织参考。`modules/` 只保存已实现且可注册的课程与 `shared/`；草稿和独立交付快照保存在仓库根目录 `module-drafts/`。

模块根目录保留薄入口、课程索引、课程数据和状态；`pages/<PageName>/` 放页面与同名样式，`components/` 放模块内复用组件，`assets/` 放模块专属资源；`data/`、`model/`、`services/`、`docs/`、`scripts/` 按实际需要建立，不创建空目录。

课程 ID、页面 ID 与进度键保持稳定。大纲中的 `pages` 只记录已实现页面，待实现部分放在 `plannedPages`。单入口的工具或联调模块不虚构另一种形态。Shared 文件本次保持原样。

运行 `npm run dev` 后访问模块路由或 `/scenedeck/?deck=<课程 ID>`。运行 `node modules/check-module-structure.mjs` 检查入口导出、页面索引、模块资源归属、缺失导入和依赖边界；运行 `npm run typecheck` 与 `npm run build` 检查工程兼容性。目录检查不代替逐页视觉与教学质量验收。

| 模块 | 课程 ID | 已实现索引 | 待实现大纲 | PPT |
|---|---|---:|---:|---|
| [AI-Learning-Exploration](./AI-Learning-Exploration/README.md) | `ai-learning-exploration` | 1 | 29 | 有 |
| [AI-Practice-Education](./AI-Practice-Education/README.md) | `ai-practice-education` | 39 | 0 | 有 |
| [Agent-Complex-Tasks](./Agent-Complex-Tasks/README.md) | `agent-complex-tasks` | 40 | 0 | 有 |
| [Agent-Guide](./Agent-Guide/README.md) | `agent-guide` | 16 | 0 | 有 |
| [Attention-Mechanism](./Attention-Mechanism/README.md) | `attention-mechanism` | 24 | 0 | 有 |
| [Basic-Example](./Basic-Example/README.md) | `basic-example` | 1 | 0 | 有 |
| [Convolution-Kernel-Intro](./Convolution-Kernel-Intro/README.md) | `convolution-kernel-intro` | 24 | 0 | 有 |
| [Creator-Guide](./Creator-Guide/README.md) | `creator-guide` | 21 | 0 | 有 |
| [Data-Annotation-Augmentation](./Data-Annotation-Augmentation/README.md) | `data-annotation-augmentation` | 24 | 0 | 有 |
| [Digital-Image-Intro](./Digital-Image-Intro/README.md) | `digital-image-intro` | 24 | 0 | 有 |
| [Gradient-Descent](./Gradient-Descent/README.md) | `gradient-descent` | 1 | 0 | 有 |
| [KV-Cache-Guide](./KV-Cache-Guide/README.md) | `kv-cache-guide` | 24 | 0 | 有 |
| [LLM-Practice-Education](./LLM-Practice-Education/README.md) | `llm-practice-education` | 8 | 34 | 有 |
| [Linear-Regression-Loss](./Linear-Regression-Loss/README.md) | `linear-regression-loss` | 10 | 0 | 有 |
| [Memory-Test](./Memory-Test/README.md) | `memory-test` | 4 | 0 | 单入口 |
| [Multilayer-Perceptron](./Multilayer-Perceptron/README.md) | `multilayer-perceptron` | 5 | 0 | 有 |
| [Naive-RNN](./Naive-RNN/README.md) | `naive-rnn` | 13 | 0 | 有 |
| [Neuron-Guide](./Neuron-Guide/README.md) | `neuron-guide` | 18 | 0 | 有 |
| [Newborn-Article-Impact](./Newborn-Article-Impact/README.md) | `newborn-article-impact` | 38 | 0 | 有 |
| [Policy-Gradient](./Policy-Gradient/README.md) | `policy-gradient` | 15 | 0 | 有 |
| [Pretrained-LM-Overview](./Pretrained-LM-Overview/README.md) | `pretrained-lm` | 27 | 0 | 有 |
| [Regression-Loss](./Regression-Loss/README.md) | `regression-loss` | 18 | 0 | 有 |
| [ResNet-Transfer-Guide](./ResNet-Transfer-Guide/README.md) | `resnet-transfer-guide` | 29 | 0 | 有 |
| [Research-Intelligence-Era](./Research-Intelligence-Era/README.md) | `research-intelligence-era` | 5 | 37 | 有 |
| [Tldraw-Demo](./Tldraw-Demo/README.md) | `tldraw-demo` | 1 | 0 | 单入口 |
| [Transformer](./Transformer/README.md) | `transformer` | 34 | 0 | 有 |
| [Value-Based-RL](./Value-Based-RL/README.md) | `value-based-rl` | 22 | 0 | 有 |
| [Vision-Language-Models](./Vision-Language-Models/README.md) | `vision-language-models` | 27 | 0 | 有 |
| [Visual-Feature-Learning](./Visual-Feature-Learning/README.md) | `visual-feature-learning` | 25 | 0 | 有 |
| [Visual-Generation-Architecture](./Visual-Generation-Architecture/README.md) | `visual-generation-architecture` | 15 | 0 | 有 |
| [Visual-Generation-Guide](./Visual-Generation-Guide/README.md) | `visual-generation-guide` | 31 | 0 | 有 |

## 本次整理与验证（2026-10-30）

- 31 个活跃模块均通过入口、页面 ID、资源归属和导入边界检查；保留原有已实现页面 ID。
- 平铺的 Agent 页面、交互组件与状态模型分目录；Transformer 拆分课程注册表、阅读入口和共享播放器适配器；预训练语言模型接入主工程的阅读与 PPT 两个入口。
- 32 个散落媒体文件归入所属模块的 assets；图片导入与 CSS 图片统一走模块资源命名空间。
- 只含设计的 RNN-Advanced、独立 Agent 交付副本和 Policy-Gradient 对照版本保存在 module-drafts/；活跃模块不加载这些副本。
- 未实现的课程大纲保留在 plannedPages；AI-Learning-Exploration、LLM-Practice-Education、Research-Intelligence-Era 的已实现索引分别为 1、8、5 页。
- node modules/check-module-structure.mjs、npm run typecheck、npm run build 均通过；预训练语言模型的课程与数值模型测试 32 项通过。
- 浏览器检查覆盖 31 个模块入口，并额外检查新整理的连续阅读入口、标注课程图片和注意力 C32。此范围不等于全部页面的交互与视觉验收。
- modules/shared/ 文件哈希核对一致，本次未修改。构建保留了部分 JavaScript 分包超过 500 kB 的提示。

## 仅上传 modules 的兼容修正

模块资源使用已有的 `moduleIdentity.id` UUID 与 Shared `moduleAssetUrl`；缺失身份通过仓库现有工具补齐，原有身份保持不变。CSS 背景图与光标由模块组件提供地址，不依赖额外的 Vite CSS 改写。Transformer 的 PCA 库及许可证包含在模块 vendor 目录内，不增加根目录依赖。

检查工具随模块保存在 `modules/check-module-structure.mjs`，从仓库根目录运行 `node modules/check-module-structure.mjs`。上传这些模块无需修改 `scripts/module-assets.mjs`、根目录依赖或 shared。使用 Git 原版应用源码、Vite 配置与脚本，仅替换模块树的独立验证构建已通过。
