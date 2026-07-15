# Intuitive Deep Learning

> 用可视化、交互实验和小规模训练任务建立深度学习直觉。

Intuitive Deep Learning 是一套可本地运行的深度学习互动课程。项目把抽象概念拆成可以操作的学习模块：从“为什么需要神经元”开始，逐步进入损失函数、梯度下降、激活函数、MLP、数字图像、卷积核、LeNet-5 和人脸识别等主题。

课程适合用于课堂演示、自学实验和 AI 教学助手调用。学习者可以从课程地图按路线推进，也可以直接打开某个模块，在滑块、画布、动画和训练面板中观察参数变化如何影响模型行为。

![深度学习互动课程地图](./assets/course_map.png)

## 课程特色

- 直观优先：用图像、动画、拖拽和参数调节解释公式背后的变化过程。
- 模块化组织：每个课程模块都有独立入口和元数据，便于单独演示、维护和检索。
- 从浅到深：路线覆盖神经元、损失、优化、MLP、图像表示、卷积网络和端到端训练。
- 本地可运行：课程页面、示例数据和运行脚本都放在仓库内，适合离线教学准备。
- 面向扩展：`modules/shared/` 提供公共样式、组件和工具函数，新增模块时可以复用。

## 课程路线

课程共包含 4 个章节、11 个正式互动模块。推荐按章节顺序学习，也可以从 `CourseMap` 课程地图直接跳转到感兴趣的主题。

| 章节 | 学习重点 | 互动模块 |
| --- | --- | --- |
| 第一章：神经网络入门 | 神经元、损失函数、梯度下降 | `Neuron-Guide`、`Loss-Guide`、`Gradient-Descent-Module` |
| 第二章：MLP 与分类输出 | 激活函数、非线性分类、分类损失 | `Activation-Func-Module`、`MLP_playground`、`Loss-Guide-2` |
| 第三章：数字图像与人工特征 | RGB 矩阵、手写数字、人工特征分类 | `Digital-Image-Module`、`Manual-Feature-Classification` |
| 第四章：卷积网络与人脸识别 | 卷积核、LeNet-5、固定特征与端到端训练 | `Convolution-Kernel-Intro`、`LeNet5-CNN-Lab`、`Face-Recog-Lab` |

## 模块一览

| 模块 ID | 标题 | 适合解决的问题 |
| --- | --- | --- |
| `CourseMap` | 深度学习课程图谱 | 浏览课程结构、选择学习路径 |
| `Neuron-Guide` | 为什么需要神经元 | 从多因素决策理解输入信号和加权判断 |
| `Loss-Guide` | 为什么需要损失函数 | 理解预测值、真实值以及 L1/L2 误差度量 |
| `Gradient-Descent-Module` | 梯度下降如何让模型变好 | 观察参数、预测值和 Loss 之间的关系 |
| `Activation-Func-Module` | 激活函数如何带来非线性 | 比较线性网络与 ReLU、Sigmoid、SiLU 等激活函数 |
| `MLP_playground` | 从手绘分类边界到 MLP | 通过决策边界实验理解隐藏层和非线性表达能力 |
| `Loss-Guide-2` | 天气预测的两种输出 | 区分 Sigmoid + BCE 与 Softmax + Cross Entropy |
| `Digital-Image-Module` | 数字图像如何变成 RGB 矩阵 | 理解像素、RGB 通道和图像矩阵表示 |
| `Manual-Feature-Classification` | 人工特征的分类 | 用九宫格亮像素特征完成手写数字分类实验 |
| `Convolution-Kernel-Intro` | 卷积核入门：从五子棋棋形开始 | 从局部模式扫描理解卷积核和特征图 |
| `LeNet5-CNN-Lab` | 从人工卷积核到 LeNet-5 | 比较固定卷积核与可学习卷积核 |
| `Face-Recog-Lab` | 人脸识别：固定卷积核到参数全训 | 对比冻结特征提取器与小型 CNN 端到端训练 |

## 运行环境

建议使用 Python 3.10 或更新版本。先安装基础依赖：

```bash
python3 -m pip install -r requirements.txt
```

如需运行 LeNet-5、人脸识别或端到端 CNN 训练实验，再安装 PyTorch 相关依赖：

```bash
python3 -m pip install -r requirements-torch.txt
```

## 快速开始

在仓库根目录启动课程地图：

```bash
bash scripts/run-lesson-page.sh --init
```

打开指定课程模块：

```bash
bash scripts/run-lesson-page.sh --open-module --module-id <module-id>
```

示例：

```bash
bash scripts/run-lesson-page.sh --open-module --module-id MLP_playground
```

查看服务状态或停止服务：

```bash
bash scripts/run-lesson-page.sh --status
bash scripts/run-lesson-page.sh --stop
```

## 项目结构

```text
.
├── assets/                 # README 与课程文档使用的静态图片
├── dataset/                # 示例数据与数据集挂载配置
├── examples/               # 课程配套示例
├── modules/                # 互动课程模块与公共前端资源
├── references/             # 模块设计和维护参考资料
├── scripts/                # 课程启动、模块索引与运行时脚本
├── requirements.txt        # 基础运行依赖
└── requirements-torch.txt  # Torch 训练实验依赖
```

`history/` 和 `runtime_logs/` 用于本地运行记录，不应作为课程内容手工修改。

## 开发与校验

模块规范见 [modules/README.md](modules/README.md)。新增或修改模块元数据后，重新生成并校验模块索引：

```bash
cd modules
python3 build_module_index.py
python3 build_module_index.py --check
```

运行现有运行时测试：

```bash
python3 -m unittest scripts.tests.test_lab_runtime_layout
```

提交前建议执行：

```bash
git diff --check
```

页面与交互改动应优先复用 `modules/shared/` 中的公共组件，避免每个模块重复实现基础按钮、布局、绘图和遥测逻辑。
