# Convolution-Kernel-Intro 迁移冻结

> 迁移目标：`Convolution-Kernel-Intro-React`。本文件只记录迁移前事实与复用关系，不改变旧模块运行逻辑。正式课程链路已核实为 `Manual-Feature-Classification(-React) → Convolution-Kernel-Intro(-React) → LeNet5-CNN-Lab`。

## 页面与步骤表

| 顺序 | 旧页面内容 | 精确完成条件 | React 迁移归属 |
| --- | --- | --- | --- |
| 1 | 15×15 五子棋：玩家黑先、AI 白后；回合、步数、局面、轮播攻略、重新开局、悔一步、示例棋局；终局后显示胜负总结与简答题 | 必须出现非平局胜者；简答非空并成功调用 `POST /kernel/gomoku-win-feedback`，服务结果被接受后置 `answerPassed=true`；评语完成后才展开下一幕。平局只提示重开 | `GomokuGameBlock` |
| 2 | 棋盘拆为赢家/输家 0/1 图；拖动 5×5 窗口；查看按位相乘过程；寻找原方向最大激活；旋转或翻转图像；逐格设计反向算子；再次扫描；最后单选题 | `scanOriginal` 找到全局最大且 `max>0` → 点击“换一种模式” → 设计矩阵与目标矩阵完全相等 → `scanOpposite` 再找到全局最大 → `kernelPhase=complete` → 单选 `spatial-pattern` 正确 | `KernelOperatorBlock` |
| 3 | 随机本地 MNIST 图；使用用户 5×5 核自动逐像素扫描；生成特征图；第一次完成后解锁用户核、竖线、横线、边缘、自定义核；自定义支持 3×3/5×5；可换图、重放、点击特征图查看响应 | 当前核的所有输出位置扫描完成；第一次完成解锁核选项并显示推荐资源。换图、换核或重放会重新计算，完成后仍保持资源可见 | `MnistConvolutionBlock` |
| 4 | 三个 Bilibili 推荐视频、课程目录、下一课 | 展示即完成；模块完成在首次 MNIST 扫描完成时幂等记录一次 | `ResourcesBlock` |

源码依据：页面区段 `index.html:19-220`；棋局与终局 `script.js:230-590`；LLM 问答 `script.js:720-789`；算子状态机 `script.js:791-1230`；滚动解锁与 MNIST `script.js:1239-1515`；资源 `script.js:1542-1579`。

## 交互与状态表

| 状态 | 旧实现 | 迁移要求 |
| --- | --- | --- |
| 棋盘、当前执子方、AI 思考、赢家、胜线、最后落子、历史、悬停 | 浏览器内存；AI 使用 420ms 定时器；重开、悔棋和示例棋局会清理后续阶段 | Telemetry SQLite 恢复棋局和展开状态；恢复不伪装成落子；AI 自动落子不覆盖最后一次用户操作语义；悬停与攻略轮播不持久化 |
| 简答正文、提交结果、LLM 评语 | `DLModuleUI.mountQuestion` + 59414 接口；只有接口成功才继续 | 保存正文、结果、完整评语和 `answerPassed`；恢复直接显示评语，不重新逐字播放或请求；服务失败不得假反馈、假成功 |
| 原方向/反向算子实验 | `activeLayer/baseKernel/currentKernel/designKernel/scanPosition/bestActivation/foundMaxActivation/kernelPhase/imageTransform` | 恢复扫描位置、设计矩阵、阶段和题目结果；pointermove 只更新草稿，pointerup 或阶段完成只产生一次语义事件；完成幂等 |
| 算子单选题 | 正确后禁用选项并解锁下一幕 | 保存选项、反馈、`kernelQuestionPassed` 与解锁状态；恢复不重复延时提示或滚动 |
| MNIST | 样本路径、像素、核类型、自定义核、解锁状态、扫描步、特征值 | 保存用户选择、自定义数值和完成状态；扫描帧属于观察状态，不逐帧发事件；刷新后已完成状态直接重建特征图 |
| 模块完成 | 旧版只以资源显示表现，无持久化 | 用 Lesson Flow + Telemetry SQLite 保存步骤、展开、控件、题目、评语与完成；一次完成操作一个事件；不新增 localStorage |

旧脚本未使用 localStorage、sessionStorage 或 Telemetry；刷新会从 `resetGame()` 重置。React 版补齐 SQLite 恢复，但 Telemetry 不可用时只使用本次内存状态继续，不锁页面。

## 资源与接口表

| 资源/接口 | 位置与契约 | 迁移策略 |
| --- | --- | --- |
| 五子棋私有算法 | `script.js:4-61,335-521`：15×15、四方向判胜、本地模式评分 AI | 等价移入模块私有 TypeScript；不抽入 shared，不以假棋局替代 |
| 五子棋评语 API | `POST http://127.0.0.1:59414/kernel/gomoku-win-feedback`；body `{answer,board_size,winner,win_direction,win_line,ground_truth}`；后端注册于 `scripts/langchain_app/registry.py` | 模块私有 service 保留真实接口与错误；shared `Question` 负责标准题目与反馈 |
| 0/1 棋盘及 5×5 算子 | `script.js:857-1130` | 私有 TypeScript 等价迁移；保留补零、方向变换、点积、全局最大判断与悬浮预览 |
| MNIST 图片 | 脚本每类列出 5 张，共 50 张；文件位于 `dataset/mnist/0..9/*.png` | Vite URL 复用原资源，不复制、不生成假数据；随机换图避免连续相同 |
| MNIST 卷积 | 用户 5×5 核、预设 3×3 竖线/横线/边缘核、自定义 3×3/5×5 | 私有模型和 Canvas/格子可视化保留；该能力不属于通用 Plotly 图表 |
| 推荐视频 | `BV1VV411478E`、`BV1Vd4y1e7pj`、`BV16N411y7cV` | 交给 shared `LessonFooter` / `RelatedVideos` 排版 |
| 导航链路 | 返回 CourseMap；下一课旧入口为 `LeNet5-CNN-Lab` | 上一课验收后改为 React 路由；本课下一课暂保留旧 LeNet-5 地址，待其迁移后再切换 |

## 复用关系表

| 能力 | 直接复用 shared | 模块私有保留 |
| --- | --- | --- |
| 页面外壳和标准内容 | `ModuleShell`、`LessonStage`、`ContentBlock` | 游戏、算子与 MNIST 的双栏和响应式细节 |
| 教学流程 | `LessonFlow`、现有 Scroll Cue | `game → operator → mnist` 内部状态机 |
| 标准控件和反馈 | `Button`、`Question`、`Callout`、`NoticeStrip`、`ValueTile`、`ExplainPanelButton` | 五子棋画布、拖动扫描、可编辑核、计算弹层、特征图点击与核预览 |
| 状态存储 | shared Telemetry API | 模块私有 typed `usePersistedActivity` 与恢复去重 |
| 课程结尾 | `RelatedVideos`、`LessonFooter` | 视频数据和下一课配置 |

## Lesson Flow 冻结

1. `gomoku`：非平局终局且真实简答评阅成功。
2. `operator`：两轮最大激活、反向核设计和单选题全部完成。
3. `mnist`：首次完整卷积扫描完成；该步骤标记整个模块完成。
4. `resources`：立即显示课程总结、推荐视频和导航。

完整页面与单内容块预览必须引用同一份 React 实现。算子单块预览使用模块私有的旧版示例胜局作为先决快照，不复制另一套实现。

## 拟议目录与调试路由

```text
modules/Convolution-Kernel-Intro-React/
  ConvolutionKernelIntroPage.tsx
  convolution-kernel-intro-react.css
  blocks/
    GomokuGameBlock.tsx
    KernelOperatorBlock.tsx
    MnistConvolutionBlock.tsx
    ResourcesBlock.tsx
  components/
    GomokuCanvas.tsx
    KernelGrid.tsx
    MnistConvolutionCanvas.tsx
    usePersistedActivity.ts
  model/
    gomokuEngine.ts
    kernelMath.ts
    mnistMath.ts
  services/
    gomokuFeedback.ts
```

```text
/dev/blocks/convolution-kernel-intro-react/gomoku
/dev/blocks/convolution-kernel-intro-react/operator
/dev/blocks/convolution-kernel-intro-react/mnist
/dev/blocks/convolution-kernel-intro-react/resources
```

## 跨模块共性问题与 shared 决策

旧静态源码页缺少由成长助手完整 Skill 包补入的 shared CSS/脚本，不能把缺少注入后的退化页面作为视觉基线。该问题属于旧静态打包兼容链路，不代表 React shared 缺少组件。

本轮所有特殊需求均可通过现有 shared 组合与模块私有适配完成：

- 不修改 `modules/shared`；
- 不把五子棋、二值棋盘、卷积核编辑器或 MNIST 动画抽入 shared；
- 不恢复 `DLCanvas`、`DLModuleUI` 全局作为 React 依赖；
- 若后续多个模块出现完全相同的卷积核编辑/特征图交互，再另行评估共享能力。
