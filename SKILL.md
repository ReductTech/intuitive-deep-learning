---
name: intuitive-deep-learning
description: 在 Electron 内置浏览器中启动并使用本地深度学习互动课程。用于学习或讲解神经元、MLP、激活函数、损失函数、梯度下降、数字图像、卷积、CNN、LeNet 和人脸识别等主题，也用于浏览课程图谱、选择学习路径和完成互动练习。
---

# 深度学习互动实验室

## 启动课程

从 workspace 根目录运行统一入口。该入口负责启动页面服务及课程需要的全部后台服务；不要分别启动 Python 服务，也不要使用通用静态服务器替代它。

用户没有指定主题时，准备课程图谱：

```bash
bash .claude/skills/intuitive-deep-learning/scripts/run-lesson-page.sh --init
```

用户指定主题时，先读取 `.claude/skills/intuitive-deep-learning/modules/index.json`，根据 `title`、`use_when`、`summary` 和 `prerequisites` 选择最匹配的模块，再运行：

```bash
bash .claude/skills/intuitive-deep-learning/scripts/run-lesson-page.sh \
  --open-module --module-id <module-id>
```

确认命令返回 `ok: true`，读取输出中的 `pageUrl`，然后直接调用：

```text
browser_navigate(<pageUrl>)
```

必须在 Electron 内置浏览器中打开页面，不要改用系统外部浏览器。启动命令只负责准备课程和返回 URL，浏览器导航由智能体完成。

## 引导学习

把互动页面作为主要学习场景，并围绕用户正在操作的内容讲解：

1. 先判断用户的目标和已有基础。主题不明确时打开 `CourseMap`，不要替用户武断选择课程。
2. 对照模块的 `prerequisites` 检查前置知识。缺少关键基础时，先用简短解释补齐，或建议并打开更合适的前置模块。
3. 一次只推进一个核心概念。优先让用户观察、预测、拖动参数、训练模型或回答页面问题，再解释现象。
4. 把公式连接到页面中的可视化结果、参数变化和实验数据；避免脱离当前实验连续堆砌定义。
5. 根据用户回答调整深度。回答含糊时追问思路或给一个小提示；回答正确时说明关键原因并推进下一步。
6. 用户提出课程外的深度学习问题时，先直接回答，再判断是否有匹配模块可用于验证或进一步探索。

不要在正常学习过程中修改模块文件。不要把服务端口、进程、日志或内部接口等实现细节展示给用户，除非正在排查启动故障。

## 故障处理

若入口返回 `ok: false`，优先依据输出中的 `stage`、`error`、`detail` 和 `nextStep` 排查，并按需查看 `.claude/skills/intuitive-deep-learning/runtime_logs/`。不要绕过统一入口另建服务。

需要检查或停止后台服务时使用：

```bash
bash .claude/skills/intuitive-deep-learning/scripts/start-all-services.sh --status
bash .claude/skills/intuitive-deep-learning/scripts/start-all-services.sh --stop
```

## 完成标准

只有启动结果为 `ok: true`，且匹配用户目标的课程已通过 `browser_navigate` 在 Electron 内置浏览器中打开，才算完成启动。随后继续围绕该课程引导学习，而不是只报告服务已经运行。
