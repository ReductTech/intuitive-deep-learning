# Intuitive Deep Learning

一组可直接运行的深度学习互动课程模块，帮助学习者通过操作和观察理解神经元、MLP、激活函数、损失函数、梯度下降、数字图像、卷积、CNN、LeNet 与人脸识别等主题。

## 快速开始

在 Linux shell 或 WSL 中，从仓库根目录启动课程页：

```bash
bash scripts/run-lesson-page.sh --init
```

打开指定模块：

```bash
bash scripts/run-lesson-page.sh --open-module --module-id <module-id>
```

检查服务状态或停止服务：

```bash
bash scripts/run-lesson-page.sh --status
bash scripts/run-lesson-page.sh --stop
```

## 目录说明

- `modules/`：互动课程模块及公共前端资源；模块规范见 [modules/README.md](modules/README.md)。
- `scripts/`：课程启动、模块索引与后台服务脚本。
- `dataset/`：课程示例数据与数据集挂载配置。
- `references/`：模块设计和维护参考资料。
- `history/`：本地学习行为记录；不应作为课程内容手工修改。

## 开发校验

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

## 贡献约定

页面与交互改动应优先复用 `modules/shared/` 的公共组件。提交前至少执行相关测试与 `git diff --check`，避免引入无关格式变更。
