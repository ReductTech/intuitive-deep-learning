# Gradient-Descent-Module 现状冻结与 React 迁移分析

冻结日期：2026-07-24  
分析对象：`modules/Gradient-Descent-Module`  
迁移期目标名称：`modules/Gradient-Descent-Module-React`  
本次范围：只读分析与文档冻结；未迁移业务代码，未修改 `modules/shared`。

## 冻结结论

1. **当前 develop 工作副本不能走通旧页面。** 实际通过独立本地端口加载当前目录时，`window.DLModuleUI` 为 `undefined`，`script.js:826` 在第一次调用 `mountQuestion` 时中断。浏览器中两道题的挂载节点均为空，`v₁/v₂` 滑块保持禁用，自动更新与完整网络阶段保持隐藏。
2. **源码表达的教学能力远多于 `info.json` 的摘要。** 除“冻结隐藏层、调整输出层权重”外，页面还包含偏导推导、L1 单步更新、震荡解释、学习率实验、六个参数共同训练、Loss 曲线和推荐资源。
3. **当前状态全部是页面内存状态。** `state`、`autoDemo`、`fullState` 和滚动解锁标记没有从 Telemetry SQLite 恢复；刷新会丢失步骤、控件值、答案、曲线、AI 反馈和完成状态。
4. **当前没有统一的模块完成事件。** 页面在第一次完整网络更新后就展示总结和资源，而“训练完成”按钮需要 `Loss < 0.5`。这只能冻结为 `hasTrained` 与 `converged` 两个不同事实，不能直接替用户决定哪个事实等于 `module_complete`。
5. **本模块的算法和复杂网络可视化适合保留为模块私有实现。** 页面壳、流程、问题、控件、反馈、公式、图表和页尾应直接接入现有 React shared。
6. **本次没有修改 shared。** 已发现的旧 `DLModuleUI` 缺口是跨多个旧模块的兼容运行时问题，但它不等于 React shared 缺少某个组件；应作为独立兼容任务处理，不能在本次冻结分析中临时向 React shared 塞入旧全局实现。

证据口径：

- “运行实测”指当前 `intuitive-deep-learning-develop` 工作副本在隔离端口中的浏览器结果。
- “源码冻结”指依据当前 `index.html`、`script.js`、`style.css` 和后端实现能够确定的原设计行为；受初始化错误影响，后续交互无法在当前副本中端到端执行。
- “shared 复用”同时对照了 `modules/Loss-Guide-React`、`modules/shared/react` 源码和实际运行的 `http://127.0.0.1:5173/shared/ui-kit`。
- 当前目录不是 Git 工作树，无法记录 commit SHA；以下 SHA-256 用于识别本次分析的文件快照。

```text
index.html          73340DDEE364767F9348CF880BC97B6672BED021DC89BC6AB6870192E884987A
script.js           3AC703D336EF69EC57D4206091FB2871AB728BCE8BD067275045E7703A36B959
style.css           6A24CF13EC60910EB64AD18232DC3884F9EF8E193DEF0048EBD691E5EF713CBF
info.json           00825439A4C7BF820D9CE44DD234E5815615E4F6E2000A8620CA568690C9B2C3
tutorial_code.json  175203BDEB32E1EBAF1071E4D6E6AB2ADDED1824F29E11087579821DE3A47DFD
tutorial_code.py    201753D4E99F6D053DB5B9A89D88B51ADCB968CD9935E27460CA762BFE69D2E3
```

## 表一：功能与交互冻结

| 顺序 / 区域 | 教学内容与真实输入 | 当前反馈和状态变化 | 实际解锁 / 完成条件 | 冻结证据与迁移注意 |
|---|---|---|---|---|
| 0. 页面初始化 | 加载标题、手动调参区、Plotly、`plot-utils.js` 和模块脚本 | 当前运行时在挂载第一道题时抛出 `DLModuleUI.mountQuestion` 相关错误；只剩静态网络可见 | 无法进入正常教学流程 | 运行实测；`index.html:7,245-247` 未加载 `base.css`、`module-components.css/js`，而 `script.js:826-923` 立即依赖 `DLModuleUI` |
| 1. 页面头部 | “亲手缩小预测误差，再把规律变成自动更新步骤” | 仅说明课程目标 | 页面加载即显示 | `index.html:10-17` |
| 2. 更新方向题 | 在初始 `y=-4`、`GT=10`、L1 Loss=`14` 时选择权重应“变大”还是“变小” | 正确答案 `up`；正确后题目锁定并开放两个输出层权重滑块 | 选择“变大” | `script.js:8-18,180-186,826-844`；当前运行时题目未挂载 |
| 3. 手动调 `v₁/v₂` | 两个 range 均为 `-1~3`、步长 `0.1`；`y=3v₁+v₂`，`L1=abs(y-10)` | 实时更新权重文本、边宽/透明度、预测节点、比较符号和 Loss | `Loss < 0.5` 后显示影响大小题 | `index.html:42-77`；`script.js:188-207,236-275`。标题写“Loss 变成 0”，卡片写“小于 0.5”，以代码阈值为冻结事实 |
| 4. 手动阶段重置 | 点击“重置” | 只把 `v₁/v₂` 和对应 DOM 值恢复到 `-1` | 不会重新锁滑块，也不会收起已展开内容 | `script.js:940-946`；这是现有局部重置语义，不是完整课程重置 |
| 5. 权重影响题 | 选择 `v₁` 或 `v₂` 哪个对输出影响更大 | 正确答案 `v₁`，因为 `h₁=3 > h₂=1` | 答对后显示自动更新阶段，并重置自动演示 | `script.js:846-865` |
| 6. 三道偏导填空 | 依次填写 `∂L/∂y`、`∂y/∂v₁`、`∂y/∂v₂` | 使用误差 `<0.001` 校验；答对一题后锁定并显示下一题 | 必须依次答对 `-1 → 3 → 1` | `script.js:480-516,776-794,867-911` |
| 7. 单步自动更新 | 点击“执行一次参数更新” | 按钮禁用约 550ms；按 L1 符号梯度更新两个权重，记录更新前后完整快照并重绘网络和 Loss 曲线 | 第 3 步开始提示震荡；第 5 步后隐藏按钮并显示开放题 | `script.js:350-478,549-563` |
| 8. 自动 Loss 曲线 | 随每次更新增加一个 Loss 点 | 通过 `DLPlot.mountTrainingHistory` 重绘，横轴为更新次数 | 无独立完成条件 | `script.js:316-340`；迁移时转用 React `PlotlyChart`，不重写坐标轴基础能力 |
| 9. 震荡开放题 | 输入任意非空回答，解释如何让更新稳定 | POST 到 AI 评阅服务；成功显示结构化评语，失败显示友好错误 | **无论评阅成功、答案质量或服务失败，都会开放“去试试吧”** | `script.js:796-824,913-923`；这是当前放行语义，若迁移后改为必须答对需单独确认 |
| 10. 学习率实验 | 点击“去试试吧”后使用步长比例；滑块范围 `0~1`、步长 `0.05` | 逻辑初值直接设为 `0.1`，但 UI 初始显示“尚未选择”；滑块可设为 `0` | 自动演示 `Loss < 0.005` 后显示学习率总结 | `index.html:132-150`；`script.js:350-358,518-547,925-930`。按钮文案“Loss 已到 0”并非数学上的严格等于 0 |
| 11. 下方内容提示 | 点击底部浮层，或满足自动阶段后向下滚轮 | 展开完整网络区并平滑滚动 | 自动阶段先达到 `Loss < 0.005` | `script.js:74,89-107,956-959`；全局 `wheel` 监听没有卸载逻辑 |
| 12. 完整网络目标值 | 输入有限数字 GT | 每次 `input` 都重置六个参数、历史和初始 Loss，并网格搜索 rate/decay | 输入有效且初始 `abs(4-GT) >= 0.5` 时允许训练 | `script.js:565-631,701-736`。若 `abs(4-GT) < 0.5`，训练按钮禁用而总结仍隐藏，形成现有死路 |
| 13. 完整网络训练 | 点击训练按钮 | 约 520ms 动画后更新 `w₁₁,w₂₁,w₁₂,w₂₂,v₁,v₂`，学习率乘衰减率并追加 Loss | 第一次成功更新即显示总结；`Loss < 0.5` 时按钮显示“训练完成” | `script.js:738-774`；应分别保存 `hasTrained` 与 `converged`，不能混成一个状态 |
| 14. 最终 Loss 曲线 | 随完整网络每次训练追加 Loss | 共享 Plotly 历史曲线 | 无独立完成条件 | `script.js:643-666` |
| 15. 总结、视频与导航 | 展示“前馈 → Loss → 反向传播 → 梯度下降”、4 个 Bilibili 视频、课程目录和下一课 | 第一次完整网络更新后出现 | 现有页面没有 `module_complete` | `index.html:221-239`；`script.js:45-62,171-178,756-772`。旧相对地址必须改为 React 路由 |
| 16. 附带教程代码 | `tutorial_code.py/json` 是“手算一次梯度下降更新”的 Python 练习 | 当前页面和 `script.js` 均未引用 | 不参与当前页面完成 | 保留资产，但必须标记“尚未接入”，不能在迁移说明中冒充已使用功能 |
| 17. 响应式与减少动画 | 小屏继续保留网络图可读尺寸；系统要求减少动画时关闭闪烁和位移动画 | `<=760px` 时 SVG 约 940px 并横向滚动；`<=640px` 时问题、公式和最终控制区改单列；`prefers-reduced-motion` 关闭提示、揭示、更新和反传动画 | 不参与流程门槛 | `style.css:669-723`；React 私有网络图不能默认缩小到标签和内嵌控件不可用 |

## 表二：状态—事件—恢复冻结

| 状态域 | 当前内存状态 / 变化 | 当前 Telemetry 事件 | 当前刷新恢复 | React 目标状态键与幂等要求 |
|---|---|---|---|---|
| Lesson Flow 展开 | 初始只显示手动区；影响题、自动收敛、滚动提示逐段展开 | 普通按钮最多记录 `ui_click`；滚轮展开没有业务状态事件 | 无，刷新回第一阶段 | `lesson-flow:gradient-descent-module-react`；保存 `completedIds/visibleCount/completed`，hydrate 只设置状态，不触发滚动、动画或完成回调 |
| 方向题 | 选择 `up` 后 `slidersUnlocked=true` | 旧自动捕获可生成 `answer_select`，无显式稳定 key | 无 | `question:gd-direction`；直接复用 `Question` 持久化，并由恢复结果派生滑块是否解锁 |
| 手动调参 | `v1/v2=-1`；另有 `slidersUnlocked`、提示关闭、影响题显示标记 | range 的 `change` 会产生 `control_commit`，失焦还可能再产生一次；重置仅有 `ui_click` | 页面不读取 SQLite；重置后 SQLite 甚至可能仍以旧值为最新状态 | `activity:gd-manual`；一个快照保存两个值和所有派生门槛。拖动中只更新 UI，释放/键盘提交时写一个事件；重置写同一 key 的单一语义事件 |
| 权重影响题 | `v1` 正确后展开自动阶段 | `answer_select` | 无 | `question:gd-impact`；React `Question` 恢复时会回放 `onCheck`。回调可派生完成并调用幂等的 `complete()`，但不得再次发业务事件、请求服务或播放动画；流程重复推进由 `LessonFlow` 的 hydration/completedIds guard 拦截 |
| 三道偏导题 | 依次 `-1/3/1`；当前题正确后显示下一题 | 各题提交可产生 `answer_submit` | 无，刷新清空并回第一题 | `question:gd-dl-dy`、`question:gd-dy-dv1`、`question:gd-dy-dv2`；分别保存输入、结果、反馈，用结果派生当前子步骤 |
| 自动更新模拟 | `step/v1/v2/stepRatio/questionSolved/history[]` | 执行按钮只有 `ui_click`；550ms 后的真实业务结果没有状态事件 | 无 | `activity:gd-auto`；每次动画完成后写一份完整快照。hydrate 不重放点击、定时器或历史动画 |
| 震荡简答与 AI 评语 | 第 5 步后出现；保存用户文本、请求状态、评语和是否已放行 | 旧 `answer_submit` 发生在异步结果前，状态不含最终 AI 反馈 | 回答、评语、题目锁定和放行状态不能完整恢复，刷新可能再次请求 | `question:gd-oscillation`；使用 React `Question.review` 保存最终 `result.message`。正常新状态恢复时禁止重复请求；旧记录修复必须使用明确的 `question_state_restore`，不能冒充用户提交 |
| AI 失败后的放行 | 成功或失败最终都会显示“去试试吧” | 继续按钮仅 `ui_click` | 无 | 在模块私有状态保存 `feedbackResolved=true` 与最终反馈；迁移若保留旧语义，网络失败也允许继续，但不得伪造“答案正确” |
| 学习率控件 | 点击继续后 `stepRatio=0.1`，随后可改为 `0~1` | 按钮 `ui_click`；range 可能重复 `control_commit` | 无 | 合并到 `activity:gd-auto`；同时保存“尚未选择”视觉标记，解决逻辑值与 UI 标记分离问题 |
| 自动阶段完成 | `Loss < 0.005` 时显示学习率总结并允许进入最终阶段 | 没有阶段完成事件 | 无 | 由 auto 快照纯函数派生；只允许幂等调用一次当前 Lesson Flow 步骤的 `complete()` |
| 完整网络目标与计划 | `target/rate/decay`；输入时重置参数并搜索计划 | number 的 `change` 和 `focusout` 可能各发一次 `control_commit` | 无 | `activity:gd-full-network`；一个快照包含目标、rate/decay、六个参数、历史、`hasTrained/converged`；输入提交去重 |
| 完整网络训练 | 每次更新六个参数、rate 和 `lossHistory[]` | 训练按钮只有 `ui_click`，异步结果无状态事件 | 无 | 每轮更新完成后写一份完整快照；恢复直接绘制最终状态，不重放 520ms 反传动画 |
| 最终总结与资源 | `fullConclusion.hidden=false` 在第一次训练后设置 | 没有独立状态事件 | 更换目标后旧总结可能仍显示；刷新则全部消失 | 由 `hasTrained` 派生；目标变化时按明确定义重置，避免总结与当前参数不一致 |
| 模块完成 | 当前没有正式完成状态；只存在“已训练一次”和“Loss 已收敛”两个可观察事实 | 没有 `module_complete` | SQLite 中 `completed=false` | `module:gradient-descent-module-react`；先分别持久化 `hasTrained/converged`，待产品确认 gate 后再设置 `completesLesson`。完成调用本身必须幂等 |

Telemetry 的现有状态接口会对同一 `state_key` 只取最新事件（`scripts/module_http_service.py:270-308`）。因此重置、调整和训练必须继续写同一个业务 key，不能另建“reset key”。模块私有交互根节点应使用 `data-telemetry-manual`，避免显式业务事件与旧自动观察的 `change/focusout/ui_click` 重复记录。

## 表三：后端接口与外部依赖冻结

| 类型 / 接口 | 当前请求或加载方式 | 响应 / 能力契约 | 当前风险与 React 迁移边界 |
|---|---|---|---|
| AI 评阅：`POST http://127.0.0.1:59414/gradient/oscillation-feedback` | JSON `{ "answer": string }`；模块唯一显式业务 `fetch`（`script.js:4,796-824`） | 200 结构化成功：`{ok:true,status:"success",structured:true,result:{verdict,level,is_correct,explanation,task_id},durationMs}`；`task_id="gradient.oscillation"` | URL、请求和响应解析收口到 `Gradient-Descent-Module-React/services/oscillationFeedback.ts`；组件内不硬编码。保留当前“服务失败也允许继续”的流程语义，反馈状态必须落库 |
| AI 非结构化成功 | 后端首次解析模型 JSON 失败后自动修复一次 | 修复仍失败时仍可能 HTTP 200：`structured:false,result:null,rawText,warning` | 继续复用既有服务结果解释规则或在模块 service 中做小型兼容适配；不把响应协议塞进 shared 组件 |
| AI 请求校验与错误 | 请求必须为 JSON 对象，`answer` 为非空字符串；最大请求约 256 KiB，后端默认上游超时 120 秒 | 422 参数错误、503 服务不可用、500 内部错误、404 路由不存在；安全字段为 `errorCode/error` | 旧前端没有 `AbortController`、请求 ID 和过期响应保护；React 私有 service 要支持卸载取消或忽略过期响应 |
| AI 跨源与上游 | 5173/59411 页面跨源访问 59414；59414 再访问 59413 `/chat` | 服务允许 `GET, POST, OPTIONS`，默认 `Access-Control-Allow-Origin: *`；题库参考是“保持方向、缩小步长” | 当前开发端口可调用；正式启动链路需确认 59414 由谁启动和健康检查。该部署契约不是 UI shared 的职责 |
| Telemetry：`GET /__telemetry/bootstrap`、`POST /__telemetry/events` | `modules/shared/telemetry.js` 由 Python 静态服务动态注入；Vite 将 `/__telemetry` 代理到 59411 | 批量写 SQLite，发送失败时队列退避重试 | React 模块继续使用现有 Telemetry，不新增 localStorage；自定义业务状态通过 `emitTelemetry` 显式提交 |
| 状态恢复：`GET /__telemetry/state?module_id=...` | React helper `getTelemetryState()` 已封装 | 返回 `{ok,module_id,completed,states}`，每个 key 为最新状态快照 | 当前旧模块从未调用，这是刷新不可恢复的直接原因；迁移路由的 module ID 应稳定为 `gradient-descent-module-react` |
| Plotly 静态资源 | 当前 HTML 直接加载 `../shared/vendor/plotly/3.6.0/plotly.min.js`，再调用 `DLPlot` | 两张训练历史图 | React 直接使用 `modules/shared/react/visuals/PlotlyChart.tsx`，由其加载同一 vendored Plotly、响应式配置并在卸载时 purge；不保留第二套基础图表生命周期 |
| 旧 UI 全局 | `script.js` 使用 `DLModuleUI` 的问题、提示、range、视频和错误辅助函数 | 当前 develop 快照不存在提供该全局的 `module-components.js` | React 迁移以 shared 组件和模块 service 取代，不把旧全局重新包装进 React shared。未迁移旧模块的兼容问题另立任务 |
| Bilibili 视频 | 最终阶段渲染 4 个 iframe 视频 | 延伸学习资源，不影响完成条件 | 视频清单作为模块内容数据保留，交给 `LessonFooter/RelatedVideos`；外部加载失败不能阻断模块完成 |
| 课程导航 | 旧链接为 `../CourseMap/`、`../Activation-Func-Module/` | 返回目录和下一课 | 改成 React 路由或明确的兼容跳转，不能在 `/modules/...` 下照搬相对地址 |
| `tutorial_code.py/json` | 页面没有加载，也没有网络请求 | 独立 Python 教程资产 | 原样保留并登记为“当前未接入”；是否接入代码练习应作为后续需求，不在迁移中自行扩展 |

后端证据位置：`scripts/langchain_app/registry.py:44`、`tasks/short_answer.py:102-117`、`tasks/common.py:6-15`、`structured.py:224-269`、`http_server.py:25-259`、`data/short_answer_questions.json:114-120`。

## 表四：React / shared 复用关系

| 原能力 | 目标实现 | 复用方式 | 保留在模块内的部分 | 是否需要修改 shared |
|---|---|---|---|---|
| 页面标题、统一宽度与响应式外壳 | `ModuleShell` | 直接复用 | 仅传标题、副标题和模块 class | 否 |
| 三段教学主流程 | `LessonFlow` | 直接复用；建议步骤为 `manual-tuning → auto-update → full-network-training → resources` | 每个 block 只报告自己的完成条件 | 否 |
| 每段标题、说明和布局 | `ContentBlock`，必要时 `LessonStage` | 直接组合 | 课程文本和局部网格 class | 否 |
| 方向、权重影响题 | `Question` + 模块私有完成态包装 | 复用 choice 外观、反馈、Telemetry 和稳定 `persistenceKey` | 旧题答对后会锁定；shared `Question` 没有 disabled/controlled answer，因此由本地 wrapper 在正确后切换为不可编辑完成态 | 否；单模块锁题需求先本地适配 |
| 三道偏导题 | 模块私有 `NumericFillQuestion`，组合 `TextInput/Feedback` 或复用 Question 外观 token | 保留 shared 排版和反馈语义 | 旧校验是 `Number(value)` 后误差 `<0.001`，所以 `3`、`3.0`、`+3` 等都应通过；shared `Question` 当前只做规范化字符串精确比较，不能直接配置等价实现 | 否；不能为本模块立即扩大 shared validator API |
| 震荡开放题 | `Question type="short"` + `review` | 复用通用题目 UI 和 SQLite 结果恢复 | 模块私有 `oscillationFeedback.ts` 负责请求/响应适配；模块决定“失败也放行” | 否 |
| `v₁/v₂` 和学习率滑块 | `RangeControl` | 复用外观、数值格式、提示和无障碍语义 | 值、提交时机、完整快照和门槛由模块 state/reducer 管理 | 否 |
| Loss、预测值、目标值展示 | `ValueTile` | 直接复用 | 计算公式和接近目标时的 tone 映射 | 否 |
| 更新公式和偏导说明 | `FormulaBlock/FormulaTerm` | 直接复用 | 公式内容、当前参数代入和梯度结果 | 否 |
| 正误、提示、总结说明 | `Feedback`、`Callout`、`NoticeStrip`、`AttentionHint` | 按语义组合 | 动画阶段和业务文案 | 否 |
| 重置、执行更新、训练、继续 | `Button` | 直接复用 | 防重复执行、定时器清理、禁用条件和语义事件 | 否 |
| GT 输入 | `TextInput` 或原生 numeric input 的本地薄封装 | 优先组合现有控件 | 数值解析、提交去重和计划搜索 | 否 |
| 两张 Loss 历史图 | `PlotlyChart` | 直接复用 shared Plotly 生命周期 | trace 数据、坐标标题和历史序列由模块提供 | 否 |
| 滚动 / 提示解锁 | `LessonFlow` 的 `revealMode="cue"` 或 `"scroll"`，内部使用 `ScrollCue` | 直接复用 | 不再保留全局 `window.wheel` 监听 | 否 |
| 总结、4 个视频、前后导航 | `LessonFooter/RelatedVideos` | 直接复用，视频作为内容数据 | 课程链接适配 | 否 |
| 内容块单独预览 | 现有 `src/app/BlockPreview.tsx` | 完整页和预览路由渲染同一个 block 实现 | 只在 `src/app/routes.tsx` 添加开发路由 | 否 |
| 手动网络 SVG 和动态边权 | `GradientNetworkDiagram.tsx`（模块私有） | 保留 SVG 结构、连线粗细/透明度、节点与比较符号编码，改为 props 驱动；小屏保持约 940px 可读宽度并横向滚动 | 全部为本模块特有的教学可视化 | 否；不抽象到 shared |
| 自动更新演示 | `AutoUpdateBlock.tsx` + 模块私有 reducer / 纯函数 | 保留 L1 符号梯度、公式预览和 rich history；React 中复用同一个网络组件，不再克隆 DOM/ID | `computeManualForward`、`applyOutputWeightStep`、history 类型 | 否 |
| 完整网络训练 | `FullNetworkTrainingBlock.tsx` + 私有训练模型 | 保留六权重前向/反向更新及 rate/decay 网格搜索 | `forwardFullNetwork`、`searchLearningSchedule`、`trainOneStep` | 否 |
| 状态与事件 | shared `emitTelemetry/getTelemetryState` + 模块私有 hydration hook/reducer | 复用 SQLite 通道；每个业务域一个稳定 key | 业务快照 schema、版本兼容、hydrate guard、定时器与请求取消 | 否；单模块需求留在模块内 |
| 减少动画偏好 | 现有 shared 动画规范 + 模块 CSS `prefers-reduced-motion` | 沿用 UI Kit 的可访问性方向 | 关闭网络更新、反传、揭示和提示动画，数值结果仍同步完成 | 否 |

建议的内容块和预览路径：

```text
modules/Gradient-Descent-Module-React/
  GradientDescentPage.tsx
  gradient-descent-module-react.css
  blocks/
    ManualTuningBlock.tsx
    AutoUpdateBlock.tsx
    FullNetworkTrainingBlock.tsx
    ResourcesBlock.tsx
  components/
    GradientNetworkDiagram.tsx
  model/
    gradientMath.ts
    gradientState.ts
  services/
    oscillationFeedback.ts

/dev/blocks/gradient-descent-module-react/manual-tuning
/dev/blocks/gradient-descent-module-react/auto-update
/dev/blocks/gradient-descent-module-react/full-network
/dev/blocks/gradient-descent-module-react/resources
```

## React 正式启动链路契约：当前缺口与待实现要求

“React 正式启动链路”不能只指 React 的 import/render 链。它还必须让技能的 `openModule` 动作能启动所需服务、返回 React 页面 URL，并在刷新深链后继续工作。

当前真正生效的技能链路是：

```text
skill.manifest.json 的 openModule
  → scripts/run-lesson-page.sh --open-module
  → scripts/lab_launcher.py --open-module --module-id <精确目录名>
  → _module_exists() 要求 modules/<module-id>/index.html 存在
  → 启动/检查 59411、59413、59414、59415
  → 返回 http://127.0.0.1:59411/<module-id>/
```

当前 React 开发链路是另一条尚未接入技能动作的链：

```text
手工运行 npm run dev
  → Vite 5173
  → 根 index.html 先加载 /modules/shared/telemetry.js
  → src/main.tsx
  → src/App.tsx
  → src/app/routes.tsx
  → src/app/modules.tsx 中的 migratedModules
  → GradientDescentPage
  → LessonFlow
  → 四个可单独预览的内容块
```

因此当前存在以下启动缺口：

- `lab_launcher.py` 只认可带 `index.html` 的静态模块目录；拟建的 React 模块目录不会有自己的静态入口。
- `skill.manifest.json` 没有 Node/Vite 要求或 5173 端口，`run-lesson-page.sh` 与 `start-all-services.sh` 也不启动、不检查、不停止 Vite。
- `openModule` 不知道 `Gradient-Descent-Module-React` 应映射到 `/modules/gradient-descent-module-react`。
- Vite 目前只把 `/__telemetry` 代理到 59411；AI 评阅仍直接访问 59414。开发环境可用不等于技能启动契约已经成立。
- React 深链在开发服务器刷新、生产构建部署和技能打包后的回退策略尚未声明。

迁移期命名冻结为两类 ID，不能混用：

```text
文件系统目录 / 迁移模块 ID：Gradient-Descent-Module-React
app registry ID / 路由键：gradient-descent-module-react
拟议正式页面：/modules/gradient-descent-module-react
LessonFlow persistenceKey：gradient-descent-module-react
旧页面：/Gradient-Descent-Module/（只作对照）
```

在宣布 React 模块“正式可启动”前，必须补齐并验证：

1. `openModule --module-id Gradient-Descent-Module-React` 能识别 React registry 条目，而不是要求该目录自带 `index.html`。
2. 统一入口负责启动并健康检查 React 前端以及 59411/59413/59414/59415；`--status` 和 `--stop` 覆盖同一批由技能拥有的进程。
3. 返回的 `pageUrl` 是 `/modules/gradient-descent-module-react`，Electron 内置浏览器可直接打开。
4. 直接刷新该深链仍返回根 React `index.html`，并且 `/modules/shared/telemetry.js` 在 `src/main.tsx` 前加载。
5. `/__telemetry/state` 和事件写入继续落到现有 SQLite；震荡评阅继续到 59414。
6. 旧静态模块的 59411 地址保持兼容。
7. 开发态可由 Vite 5173 提供页面；技能发布态必须明确采用“现有 59411 服务托管构建产物并做 SPA fallback”或“由统一启动器管理独立 React 服务”之一。该选择尚未在当前代码中完成。

注册点仍应是 `src/app/modules.tsx`，开发块预览路由应在 `src/app/routes.tsx`。完整页与预览页必须 import 同一份 block，不维护第二套演示实现。

## 已冻结的私有实现

- 手动最小网络：`y=3v₁+v₂`、`L1=|y-10|`。
- 权重绝对值到连线宽度/透明度的视觉编码。
- L1 符号梯度单步更新和更新前后 rich history。
- 完整网络的前向计算、六权重反向更新。
- 针对任意 GT 的 rate/decay 网格搜索。
- 当前视频清单、课程说明、题目和反馈文案。
- 520ms/550ms 的阶段动画可以保留，但必须在 React 卸载或重置时取消。

不应保留为架构依赖的旧实现：

- `window.DLModuleUI` 全局。
- 通过克隆 DOM/SVG 制造自动演示副本。
- 全局且不清理的 `wheel` 监听。
- 裸 `setTimeout`、不可取消 fetch 和不 purge 的图表实例。
- `updateProgress()`、`modelFeedback` 等没有对应 DOM 的遗留分支。

## 跨模块共性问题

当前快照中以下 11 个旧模块的 `script.js` 使用 `DLModuleUI`：

```text
Activation-Func-Module
LeNet5-CNN-Lab
Manual-Feature-Classification
Convolution-Kernel-Intro
Digital-Image-Module
MLP_playground
Loss-Guide
Loss-Guide-2
Face-Recog-Lab
Gradient-Descent-Module
Neuron-Guide
```

但当前 `modules/shared` 不含 `module-components.js/css` 或 `base.css`，而扫描到的旧模块 `index.html` 也没有任何一个加载 `module-components.js`。这说明问题具有跨模块共性，但它属于**旧静态模块兼容运行时/打包缺口**，不是 React shared API 的单一特殊需求。

本次处理决定：

- 不修改 `modules/shared/react`。
- 不把旧 `DLModuleUI` 重新包装进 React shared。
- `Gradient-Descent-Module-React` 迁移时直接替换为现有 React 组件。
- 对尚未迁移的 10 个旧模块，如必须维持可运行，应另开兼容任务，先确认旧资源的权威版本、注入责任和 UI Kit 之外的回归范围。

## 待确认但不阻塞开始迁移的行为差异

- 手动阶段文案要求 Loss 为 0，代码门槛是 `<0.5`；默认保留代码门槛并修正文案一致性。
- 自动阶段按钮写“Loss 已到 0”，代码门槛是 `<0.005`；默认保留阈值并把文案改成“已接近 0”。
- AI 评阅失败当前仍允许继续；默认保留放行，但明确显示“服务不可用”，不能显示为答对。
- 首次完整网络更新即出现总结，收敛仅改变按钮；应先保存 `hasTrained/converged` 两个事实，再由产品确认哪一个触发 `module_complete`。
- 如果最终选择 `converged` 触发 `module_complete`，资源仍按旧行为在 `hasTrained` 时揭示，则必须把“资源揭示”和“课程完成”设为两个门槛；不能对同一个已完成的 Lesson Flow step 重复调用 `complete()`。
- GT 接近初始输出 4 时存在无法训练、无法展示总结的死路；这是原模块缺陷。实现前应选择“直接视为已收敛并允许完成”或“允许执行一次零/极小更新”，不能静默照搬死路。
- 学习率允许为 0 会永久停滞；默认保留可探索范围，但应给出停滞反馈，而不是伪造更新。

## 本次未迁移

本次没有创建 `Gradient-Descent-Module-React`，没有注册路由，没有改写任何交互或状态，也没有修改 shared。下一阶段应先按表二定义状态 schema 和完成条件，再小步实现四个 block；每完成一个 block，就同时加入独立预览路由、Telemetry 恢复验证和刷新回归。
