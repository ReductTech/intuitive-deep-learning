# MLP_playground React 迁移现状冻结

## 基线与范围

- 迁移来源模块：`modules/MLP_playground`
- React 目标模块：`modules/MLP_playground-React`
- 正式路由目标：`/modules/mlp-playground-react`
- 权威迁移前运行基线：
  `C:\Users\zoro-\AppData\Roaming\jianlun_growagent\reduct_data\.claude\skills\intuitive-deep-learning\modules\MLP_playground`
- 正式工作树中的旧入口缺少 `base.css`、`module-components.css`、
  `canvas-utils.js` 和 `module-components.js`，会令旧页面样式退化并使
  `DLCanvas`、`DLModuleUI` 不可用。因此它只作为私有业务源码参考，
  不能把其残缺运行结果当作验收目标。
- 两份旧模块除 `index.html` 外，其余私有文件哈希一致。
- 迁移以 `guide.js`、`script.js` 的真实运行行为为准。`module.json`
  中的默认 `blobs`、`[6]` 与实际脚本默认值不一致。
- 本次未发现必须修改 `modules/shared` 的理由。复杂 Canvas、训练器、
  情境服务与状态适配均留在模块内部。

## 表一：页面、功能与交互冻结

| 顺序 | 区域 | 迁移前真实能力 | 完成、解锁与迁移约束 |
| --- | --- | --- | --- |
| 1 | 页头与情境输入 | 标题“多层感知机与分类边界”；输入熟悉的分类主题；空闲时轮换示例占位词 | 提交期间锁定输入和按钮；不能以写死场景冒充接口成功 |
| 2 | 个性化情境 | `POST http://127.0.0.1:59414/classification/scenario`，请求体 `{ subject }`；返回任务、正负类、坐标轴、关卡文案与提示 | 成功后逐行显示四条说明并揭示手绘挑战；失败重新开放输入并显示真实错误 |
| 3 | 手绘第 1 关 | easy：两类高斯簇，共 140 点，并含约 8% 的位置异常点 | 路径至少 8 点，且横跨或纵跨画布；自动选择标签朝向；准确率至少 85% |
| 4 | 手绘第 2 关 | woven：保留第一关基础点，再叠加 42 个沿两条噪声趋势排列的点 | “换组散点”只更新噪声层；准确率至少 80% |
| 5 | 手绘第 3 关 | xor：四个中心、每中心 38 点，共 152 点 | 准确率至少 75%；评分后显示预测区域和错误点标记 |
| 6 | 手绘操作 | Canvas 按下并拖动绘制分界线；可重新画线、换组散点 | 绘制过程中仅更新草稿，抬起时形成一次答题；通过后不可重复推进或重复记录 |
| 7 | MLP 过渡 | 三关完成后显示“一条直线不够”的结论及“打开 MLP 实验台”按钮 | 只有点击按钮才展开实验；重复点击不得重复创建实验内容 |
| 8 | 1D 实验 | linear/circle 两种数据；固定 140 样本、0.10 噪声、隐藏层 `[3]`；真实全批量训练 | 达到原终止条件即完成并解锁 2D；没有额外最低准确率门槛 |
| 9 | 2D 阶段 0 | 初始 linear，数据和结构控制均暂时锁定 | 一次训练结束后原子切换到 circle、`[3]` 和阶段 1 |
| 10 | 2D 阶段 1 | circle；开放网络结构，数据设置仍锁定 | 准确率至少 90% 才进入 xor 阶段，否则保留结果并提示继续调整 |
| 11 | 2D 阶段 2/3 | xor 阶段继续只调网络；阶段 3 才开放完整数据控制 | xor 准确率至少 95% 才进入阶段 3，并将 2D 标记完成 |
| 12 | 3D 实验 | blobs、linear、circle、xor、spiral3d、slabs3d、shell3d；样本、噪声、bias、激活函数和网络结构可调 | 实际默认 spiral3d、140、0.12、`[6]`；达到原训练终止条件即完成 |
| 13 | 网络结构 | 2D/3D 可添加最多 4 个隐藏层、删除到 0 层、将当前隐藏层调为 2–12 个单元 | 结构改变即重建模型并清除旧训练结果；不能让旧 checkpoint 覆盖新结构 |
| 14 | 训练算法 | 随机初始化；隐藏层 tanh 或恒等；输出 sigmoid；BCE 与 full-batch backprop；学习步长 `.07/N`；旧实现每帧 6 epoch | 终止条件保持为 epoch ≥ 1500，或 accuracy > 98.5% 且 epoch > 60；不能写死 loss/accuracy |
| 15 | 实验可视化 | 模块私有 Canvas：1D 概率色带与切点、2D 概率场与 marching squares、3D 近似等值面；网络拓扑按权重正负和绝对值绘制 | 1D/2D 可平移缩放，3D 可旋转缩放；点击样本显示置信度，悬停节点显示逐层计算 |
| 16 | 课程结尾 | 4 个 Bilibili 视频、返回课程目录、下一课导航 | 3D 完成后才揭示；视频加载失败不能阻断课程完成 |
| 17 | 未接入资产 | `tutorial_code.py/json` 是独立 NumPy 两层 MLP 前向传播示例，`autoInsert:false` | 旧页面未引用，本轮不擅自新增为教学步骤 |

## 表二：状态、事件与 SQLite 恢复

| 状态域 | SQLite `state_key` | 必须保存的稳定快照 | 事件与恢复要求 |
| --- | --- | --- | --- |
| 情境引导 | `activity:mlp-intro` | 输入草稿、已提交主题、请求状态、完整 scenario、四行输出、完成与错误状态 | 提交一次；接口成功/失败各形成一次系统结果；刷新后直接显示已保存内容，不重播逐字动画、不重新请求 |
| 手绘挑战 | `activity:mlp-boundary` | 当前关、已完成关卡、每关 points/baseSurvey、归一化 path、score、flip、反馈、transitionReady | pointerup 只提交一次 `mlp_boundary_attempt`；clear/regenerate 各一次；关卡推进与下一关数据同一快照落盘 |
| MLP 展开 | `lesson-flow:mlp-playground-react` | `mlp-transition` 步骤完成状态 | 点击只记录一次并完成步骤；恢复时直接展开，不重新滚动或播放动画 |
| 1D 实验 | `activity:mlp-lab-1d` | settings、data、hidden、W/B/sizes、epoch/loss/accuracy、训练状态、视图、样本选择、trained/completed、revision/runId | 恢复不得重新生成数据或模型；训练结果只在结束时提交完整稳定状态 |
| 2D 实验 | `activity:mlp-lab-2d` | 1D 的全部字段，以及单调的 `twoDimensionalStage` | 阶段切换、新数据、新模型和指标必须原子保存；恢复不得再次推进阶段 |
| 3D 实验 | `activity:mlp-lab-3d` | 1D 的全部字段，以及 bias/activation 开关 | 更改配置生成新 revision/runId，使旧训练态失效 |
| 训练过程 | 模块 activity 快照中的 training/runId；如采用增量恢复，可另用 `checkpoint:mlp-lab-*` | 当前 W/B、epoch、loss、accuracy、runId、configRevision | 运行中的界面更新不得逐 epoch 产生事件；最终结果强制保存；只接受 runId/revision 匹配的 checkpoint |
| 视图与选择 | 可并入对应 activity，或使用 `view:mlp-lab-*` | zoom、panX、panY、rotX、rotY、selectedSampleIndex | 手势结束时只提交一次；hover node、指针位置、拖动态和屏幕坐标不持久化 |
| 教学流程 | `lesson-flow:mlp-playground-react` | completedIds、visibleCount、completed | 直接复用 Lesson Flow；恢复不伪装成用户重新完成 |
| 模块完成 | `module:mlp-playground-react` | completed、completedIds | 只由最终 Lesson Flow 步骤产生幂等 `module_complete` |

不写入 SQLite 的瞬态包括：RAF/timer ID、打字游标、`drawing`、
`selectedNode`、指针位置、Canvas 屏幕投影坐标、ResizeObserver 和滚动
提示 DOM。所有随机点、训练数据和模型权重必须直接持久化，或使用
带版本的稳定 seed；恢复时禁止重新调用 `Math.random()` 代替原状态。

建议语义事件：

- `mlp_intro_submit`、`mlp_intro_resolved`、`mlp_intro_failed`
- `mlp_boundary_attempt`、`mlp_boundary_clear`、`mlp_boundary_regenerate`
- `mlp_experiment_open`
- `mlp_lab_data_commit`、`mlp_lab_architecture_commit`、
  `mlp_lab_option_commit`
- `mlp_lab_sample_select`、`mlp_lab_view_commit`
- `mlp_training_finish`

模块私有手动 telemetry 区域需避免被通用监听重复记录。hydration 不发
事件。Lesson Flow 已负责 `lesson_progress` 和 `module_complete`，模块
不得再写一套重复完成事件。

## 表三：后端与外部依赖

| 依赖 | 迁移前契约 | React 迁移边界 |
| --- | --- | --- |
| 分类情境 API | `POST http://127.0.0.1:59414/classification/scenario`，body `{subject}`；成功响应包含 `ok:true` 和结构化 result | 保留真实接口与错误语义；模块私有 service 校验响应；不得假成功；成功结果完整入 SQLite |
| LangChain 服务 | 默认端口 59414，继续调用本机 LLM 代理；服务不可用时返回真实错误 | 前端不持有上游密钥；把启动依赖写入交付说明；服务未启动不是删除功能的理由 |
| Telemetry SQLite | shared React 已提供 `emitTelemetry`、`getModuleState/getTelemetryState`，Vite 代理 `/__telemetry` 到 59411 | 直接复用；禁止新增 localStorage；读取完成前锁交互；读取失败显示模块内错误，不改 shared |
| 客户端训练 | 数据生成、forward/backprop、梯度下降均在旧私有 JS 中 | 迁入模块私有 TS，保留真实算法；无训练后端，也不新增假接口 |
| Canvas 工具 | 旧页面通过 `DLCanvas`、`DLPlot` 完成 resize、投影、平移缩放和旋转 | 在模块内部做 React Canvas 适配；不把单模块复杂可视化提前抽象进 shared |
| Bilibili | 4 个播放器 iframe | 用 shared `LessonFooter` / `RelatedVideos` 组合表达 |
| 导航 | 返回 CourseMap；下一课是旧 `Loss-Guide-2` | 先保留真实下一课目标；相邻 React 模块验收后再切 React 路由 |

## 表四：React 与 shared 复用关系

| 迁移内容 | 直接复用 shared | 模块私有保留/适配 | 原因 |
| --- | --- | --- | --- |
| 页面外壳 | `ModuleShell` | 仅模块级 class | 与现有 React 教学框架一致 |
| 教学顺序 | `LessonFlow`、`ScrollCue` | 各步骤内容和完成条件 | 通用流程负责揭示与幂等完成，课程只提供顺序 |
| 标准内容 | `ContentBlock`、`LessonStage`、`Callout`、`NoticeStrip` | 场景和关卡文案配置 | 避免按章节创建无意义的 shared 组件 |
| 输入与按钮 | `TextInput`、`Button` | 真实 API 请求与状态机 | shared 负责视觉，模块负责业务 |
| 实验控制 | `Select`、`RangeControl`、`Switch`、`Button` | preset、网络结构、训练规则 | UI Kit 已覆盖标准控件 |
| 指标 | `ValueTile` 或现有 shared 排版 | epoch/loss/accuracy 数据 | 不重复造通用指标卡 |
| 手绘边界 | 无合适的 shared 通用组件 | 私有 Canvas、几何判断、随机点和关卡状态 | 仅此模块存在，且高度封装 |
| MLP 空间与网络 | 无合适的 shared 通用组件 | 私有 Canvas、投影、marching squares、网络 inspector | 是复杂模块专属交互；不能为了一个模块修改 shared |
| 图表 | 不使用 Plotly | 保留 Canvas | 原模块不是 Plotly，转换会改变关键交互 |
| 状态恢复 | shared telemetry API | 模块私有 typed SQLite adapter | 现有 shared API 足够组合，无需改变调用方式 |
| 课程结尾 | `LessonFooter`、`RelatedVideos` | MLP 视频数据与下一课地址 | 标准结尾能力直接复用 |

## Lesson Flow 冻结

1. `personalized-scenario`：真实情境接口成功。
2. `manual-boundary`：三关手绘边界全部通过。
3. `mlp-transition`：用户点击“打开 MLP 实验台”。
4. `mlp-1d`：1D 真实训练达到原终止条件。
5. `mlp-2d`：依次完成 linear、circle ≥ 90%、xor ≥ 95%。
6. `mlp-3d`：3D 真实训练达到原终止条件，并标记模块完成。
7. `resources`：立即展示推荐资源和导航。

以上步骤的完整页面和单内容块预览必须引用同一份 React 实现。
