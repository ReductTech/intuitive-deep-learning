# 🧠 Intuitive Deep Learning

> 用可视化和动手实验建立深度学习直觉。

Intuitive Deep Learning 是一组可本地运行的深度学习互动课程。课程从神经元出发，通过参数调整、动画演示和模型训练，逐步覆盖 MLP、损失函数、梯度下降、数字图像、卷积网络、LeNet-5 与人脸识别。

![深度学习互动课程地图](./assets/course_map.png)

## 🗺️ 课程路线

课程共分为 4 章、11 节互动课，可以按顺序学习，也可以从课程地图中直接选择感兴趣的主题。

| 章节 | 主题 | 课程数 |
| --- | --- | ---: |
| 第一章 | 神经网络入门：神经元、损失函数与梯度下降 | 3 |
| 第二章 | 多层感知机与分类输出：激活函数、MLP 与分类损失 | 3 |
| 第三章 | 数字图像与人工特征：RGB 矩阵与手写数字分类 | 2 |
| 第四章 | 卷积神经网络与人脸识别：卷积核、LeNet-5 与端到端训练 | 3 |

## ⚙️ 运行环境
安装基础依赖：

```bash
python3 -m pip install -r requirements.txt
```

如需运行 LeNet-5 和端到端 CNN 训练实验，还需要安装 PyTorch 相关依赖：

```bash
python3 -m pip install -r requirements-torch.txt
```

## 🚀 快速开始

在仓库根目录启动课程地图：

```bash
bash scripts/run-lesson-page.sh --init
```

打开指定课程模块：

```bash
bash scripts/run-lesson-page.sh --open-module --module-id <module-id>
```

查看服务状态或停止服务：

```bash
bash scripts/run-lesson-page.sh --status
bash scripts/run-lesson-page.sh --stop
```

## 📦 项目结构

- `modules/`：互动课程模块及公共前端资源；模块规范见 [modules/README.md](modules/README.md)。
- `scripts/`：课程启动、模块索引与后台服务脚本。
- `dataset/`：课程示例数据与数据集挂载配置。
- `assets/`：项目文档使用的图片资源。
- `references/`：模块设计和维护参考资料。
- `history/`：本地学习行为记录，不应作为课程内容手工修改。

## 🛠️ 开发与校验

修改模块元数据后，重新生成并校验模块索引：

```bash
cd modules
python3 build_module_index.py
python3 build_module_index.py --check
```

运行现有运行时测试：

```bash
python3 -m unittest scripts.tests.test_lab_runtime_layout
```

页面与交互改动应优先复用 `modules/shared/` 中的公共组件。提交前至少执行相关测试与 `git diff --check`，避免引入无关的格式变更。
