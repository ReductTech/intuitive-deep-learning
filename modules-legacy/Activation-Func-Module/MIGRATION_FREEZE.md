# Activation-Func-Module 现状冻结与 React 迁移分析

冻结日期：2026-07-26  
分析对象：`modules/Activation-Func-Module`  
迁移期目标名称：`modules/Activation-Func-Module-React`  
本次范围：现状冻结、运行核验与四张分析表；未创建 React 模块，未修改 `modules/shared`。

## 冻结结论

1. **当前 develop 工作副本不能完整走通旧页面。** 使用当前工作区在隔离端口加载时，二维图表均为空。`index.html` 没有加载提供 `window.DLCanvas` 的资源，而 `script.js` 在初始化阶段先调用 `window.DLCanvas.observe(...)`，随后才安排首次 `drawAll()`；因此初始化在画图前中断。点击二维正确答案仍会改变反馈并解除三维区域的 CSS 锁定，但图表和后续 Canvas 实验无法正常工作。
2. **源码表达的教学流程远多于元数据摘要。** 完整流程包括线性定义、二维判断、三维判断、浅层线性网络、深层线性网络、单神经元 ReLU、多神经元 ReLU、曲线逼近、常见激活函数和推荐资源。
3. **当前业务状态全部位于页面内存。** 宿主会注入通用 Telemetry，但旧页面只留下通用点击和控件观察事件，没有可恢复的业务快照，也不读取 SQLite。刷新后会丢失答案、展开步骤、随机参数、控件值、图表视角、完成门槛和最终面板。
4. **随机状态是迁移中的高风险项。** 浅层神经元、输出偏置以及深层网络的全部 `W/B` 都由 `Math.random()` 生成；恢复时如果重新初始化或重新建模，等价直线、等价平面、公式和 Canvas 会与保存前不同。
5. **当前没有正式模块完成事件。** 源码中最远的可观察状态是逼近实验达到 12 个折点后展开最终激活函数与资源区。React 迁移可将“第一次达到 12 个折点”明确设为课程完成条件，但必须作为迁移定义记录，不能声称旧页面已经发出 `module_complete`。
6. **曲线逼近的页面解释与实际算法存在偏差。** 页面声称橙色曲线来自“隐藏层神经元经过 ReLU 后形成的网络输出”，实际代码只是对目标函数的等距采样点做分段线性插值，并没有使用前一实验的 ReLU 神经元。未加载的 `guide.js` 中反而存在另一套 ReLU 网络逼近实现。迁移时必须显式选择忠实保留当前启动页算法，不能无意切换到 `guide.js`。
7. **复杂网络图适合保留为模块私有实现。** 三套 Canvas 拓扑、边权视觉编码、节点命中与悬浮 inspector、随机网络计算和 ReLU 信号流都高度绑定本课程；基础外壳、流程、按钮、反馈、公式、滑块、Plotly 和资源区应接入 React shared。
8. **本模块没有业务后端接口。** 未发现 `fetch`、XHR、AI 评阅或其他业务 API；主要外部依赖只有 Bilibili iframe。迁移不应新增假接口、假反馈或写死的“服务结果”。
9. **本次没有修改 shared，也没有发现必须立即修改 shared 的证据。** `PanelChoiceQuestion` 暂时不能同时满足可旋转 Plotly 媒体、答对锁定、持久化和完成回调，但目前可以在模块内做薄适配；尚不满足“多个模块出现同一共性问题”的 shared 修改条件。

证据口径：

- “当前工作副本运行实测”指从本目录启动隔离的模块服务并打开当前 `modules/Activation-Func-Module`。当前已占用的 59411 端口提供的是另一份旧快照，其 HTML、脚本路径和当前文件不同，因此没有作为本次冻结证据。
- “源码设计行为”指依据当前 `index.html`、`script.js`、`style.css`、元数据和未接入资产可以确定的原设计；受初始化缺口影响，后续流程主要按源码冻结。
- “shared 复用”同时对照了 `modules/Loss-Guide-React`、`modules/Gradient-Descent-Module-React`、`modules/shared/react` 和 UI Kit 源码；本次检查时 5173 未运行，因此没有把旧的 UI Kit 页面缓存当作当前证据。
- 当前目录不是 Git 工作树，无法记录 commit SHA；以下 SHA-256 用于识别本次分析的文件快照。

```text
index.html          7B660FFEB01DC9984DEED3C065865B5A92B4094506A0722235B9A65E945532DD
script.js           C1219E8FF41FBF286BE6C59C7028CE498DF08EC7C392844A70961ACFFC2B21F7
style.css           CD1806920A5C140EA4211348C5B5832F3B3AF58B17096A0F30A1C6E5AE0540E7
guide.js            E78352057094443B9EBBBCA89010E36CEF6D79158E72E10A63FB079954A14147
info.json           0D0FF89CD28EDF798BE4B3E397F1F1150BBC7D2DD0E9713C7AC19D9C9857A862
module.json         29446468CFC0CF3984AF06B396E4C5458AFE9654A78F583B93FE62A9D0B61102
tutorial_code.json  A9599140CAF0F3EC261D629422FD59CF71B8C015883F973AB938608769D5B353
tutorial_code.py    7D2DFD761101FC14D2E3CBC779BDAE95CA5C9AE46E75CDF6E5F4EE82D38D255C
```

## 表一：功能与交互冻结

| 顺序 / 区域 | 教学内容与真实输入 | 当前反馈和状态变化 | 实际解锁 / 完成条件 | 冻结证据与迁移注意 |
|---|---|---|---|---|
| 0. 页面初始化 | 加载模块样式、vendored Plotly、`plot-utils.js` 和模块脚本 | 当前工作副本的初始二维图表为空；模块样式还依赖没有显式加载的 `--ui-*`、`.edu-*`、`.dl-*` 和滚动提示样式 | 初始化无法完整完成 | `index.html:7,368-370`；`script.js:152-158,1516-1529`。当前 `modules/shared` 也不存在旧页面期待的 `canvas-utils.js`，不能把其他副本的注入结果视为本工作区能力 |
| 1. 标题与线性定义 | 标题“激活函数如何带来非线性”；解释固定变化率在二维中表现为直线 | 纯教学说明 | 页面加载即显示 | `index.html:10-29`。页面把带截距的仿射函数也称为“线性”，这是现有教学口径，应保留或另行审校，不能在迁移中静默改写 |
| 2. 二维判断 | A：`y=0.72x-0.18`；B：抛物线；C：ReLU 折线 | A 正确；错误选项标红并提示“弯了或折了”；正确后整组锁定，650ms 后解除三维区域锁定并滚动 | 必须选 A | `index.html:31-71`；`script.js:160-176,220-237,1138-1157,1317-1359`。点击图表交互区域不应触发答题 |
| 3. 三维判断 | A：碗形曲面；B：平面；C：折面；三个图均应可旋转 | B 正确；正确后锁定，500ms 后展开浅层网络实验 | 必须选 B | `index.html:73-113`；`script.js:178-194,239-261,1317-1349`。范围为 `x/y∈[-1,1]`、`z∈[-1.05,1.05]`、每轴 28 个采样点；旧 `state.view3d` 没有实际接入 Plotly |
| 4. 浅层无激活网络 | 初始 1 个随机线性神经元；点击“添加神经元”增加到 3 个；左侧显示等价直线，右侧 Canvas 显示拓扑，节点 hover 显示 `w/b/v` | 每次加入一组随机参数并更新等价方程、数量、曲线、边宽和 inspector；到 3 个后按钮禁用 | 数量达到 3 后出现下方内容提示；点击提示或向下滚轮后展开深层实验 | `index.html:115-152`；`script.js:98-101,264-297,346-369,485-690,1173-1201,1368-1376,1408-1425`。随机范围：`abs(w)∈[0.35,1.35]`、`abs(b)∈[0.08,0.65]`、`abs(v)∈[0.45,1.2]`、`abs(outputBias)∈[0.05,0.3]`；没有浅层重置按钮 |
| 5. 深层无激活网络 | 二维输入、每隐藏层 3 个神经元、一个输出；可添加一层、删除一层、随机参数 | 拓扑为 `[2, 3×层数, 1]`；添加、删除和随机参数都会重建并重新随机整张网络，左侧仍显示平面；层数范围 1～5 | 达到 5 层后 520ms 显示线性结论 | `index.html:154-191`；`script.js:299-464,692-705,1187-1213,1379-1405`。第一层 `abs(w)∈[0.12,0.8]`，后续 `abs(w)∈[0.12,0.62]`，`abs(b)∈[0.02,0.22]`。达到 5 层后再删除层，结论不会收回 |
| 6. 线性结论 | 总结“线性运算的线性叠加，永远还是线性的”；按钮“给神经元加上 ReLU” | 结论面板保持显示 | 深层网络曾达到 5 层；点击按钮进入 ReLU 单神经元实验 | `index.html:193-198`；`script.js:1203-1213,1439-1441`。应保存“曾达到 5 层”这一单调事实，不能只由当前层数推导 |
| 7. 单神经元 ReLU | range：`-3~3`、步长 `0.01`；固定 `w=2`；展示 `z=2x`、`ReLU(z)`、信号流和观察说明 | 初始逻辑值为 0，但 `touched=false`，界面显示“--/尚未输入”；首次拖动后显示实时公式。负数被截为 0，0 是折点，正数直接通过 | 必须实际拖到任意 `x<0`，才显示继续按钮 | `index.html:200-264`；`script.js:62-66,1215-1259,1443-1456`。`exploredNegative` 一旦为真不会回退；恢复时必须同时保存 `value/touched/exploredNegative` |
| 8. 多神经元 ReLU | 初始使用 1 个固定神经元，可增加到 5 个或重置；左侧为分段线性曲线，右侧为 Canvas 拓扑与 hover inspector | 每个神经元增加一个折点；到 5 个后按钮禁用并出现下方提示 | 数量达到 5，确认提示后展开逼近实验 | `index.html:266-304`；`script.js:46-61,738-986,1261-1275,1458-1494`。固定五组 `{w,b,v}`、`outputBias=-0.28`、`baseSlope=0.18` 都是课程内容，不应重新随机 |
| 9. 曲线逼近 | 初始 2 个折点；点击一次增加 2 个，最大 12；可重置 | 灰色虚线是目标函数，橙色实线是当前分段线性插值；达到 12 后按钮禁用 | 第一次达到 12 后 620ms 展开最终激活函数区 | `index.html:306-322`；`script.js:988-1065,1278-1293,1497-1512`。目标函数为 `0.48sin(3.15x)+0.2cos(6.1x)-0.13x`；实际算法不是对 ReLU 网络训练 |
| 10. 常见激活函数与资源 | ReLU、Sigmoid、SiLU/Swish 三张曲线卡；3 个 Bilibili 视频；返回课程目录和下一课 MLP | 最终面板显示后不再收回；没有显式“完成课程”按钮或事件 | 由逼近折点数达到 12 展开 | `index.html:324-364`；`script.js:69-82,742-746,1067-1091,1295-1315`。下一课旧地址为 `../MLP_playground/`，React 迁移需改成注册路由 |
| 11. 未接入资产 | `guide.js` 包含另一套 landing、Canvas 和 ReLU 逼近；`tutorial_code.py/json` 是 Python ReLU 折点练习 | 当前启动页、`script.js` 和 `module.json.assets` 均未接入它们 | 不参与现有页面解锁和完成 | 首轮迁移应保留文件但标记“未接入”，不能把这些能力冒充为原页面已有功能 |
| 12. 响应式与动画 | 网络双栏、ReLU 信号流、图表和 Canvas 在多个断点重排 | `<=1120px` 双栏变单栏；`<=760px` 降低面板高度；`<=520px` ReLU 信号流纵向排列 | 不参与流程门槛 | `style.css:117-193,259-493,594-737`。源码没有 `prefers-reduced-motion`；React 迁移应避免同时叠加旧 `af-rise` 和 Lesson Flow reveal 动画 |

补充冻结事实：

- `updateBadge()` 会查找 `[data-step-badge]`，但 `index.html` 没有对应元素，因此当前调用没有可见结果（`script.js:1131-1136`）。
- `linearLab.mode` 始终保持 `shallow`；深层实验通过另一组独立 DOM 和绘图函数运行，旧 `mode === "deep"` 分支不应照搬成正式状态。
- 同一时间只允许一个全局滚动提示；页面任意位置的向下 `wheel` 都会确认当前提示（`script.js:112-150`）。React 中应由 Lesson Flow/ScrollCue 管理，不保留全局监听。
- 多 ReLU 实验重置会把 `approxRevealed=false`，但不会隐藏已经展开的 `approxPanel`；之后又可能出现重复提示。这与“完成操作幂等”冲突，迁移时应将 `approximationUnlocked` 设为单调状态，在模块内部修复，不需要改 shared。

## 表二：状态—事件—恢复冻结

| 状态域 | 当前内存状态 / 变化 | 当前 Telemetry 与刷新恢复 | React 目标状态键与幂等要求 |
|---|---|---|---|
| Lesson Flow 展开 | 初始只显示定义和二维题；后续通过 `hidden`、CSS class、定时器、滚动提示逐段展开 | 宿主只会记录 `module_enter/page_leave` 和部分通用点击；旧页面不读取 SQLite。刷新后全部回到第一段 | `lesson-flow:activation-func-module-react`；建议步骤 ID：`linear-2d → linear-3d → linear-shallow → linear-deep → linear-conclusion → relu-intro → relu-network → relu-approximation → activation-summary`。hydrate 直接设置 `completedIds/visibleCount`，不滚动、不播放动画、不重新完成 |
| 二维判断 | 当前选择、错误样式、正确锁定、`passed2d` 和反馈 | 自定义卡片不在 `.dl-question` 中，旧自动观察只把按钮记成 `ui_click`，没有答案快照；刷新清空 | `question:activation-linear-2d`；模块私有 `PersistedPanelChoice` 保存 `selected/result/locked`，一次点击只显式写一个 `answer_select`。恢复正确状态时不重放 650ms 定时器，不再次写事件 |
| 三维判断 | 当前选择、锁定、`passed3d`；三个 Plotly 相机由图表内部维护 | 同样只有通用点击；相机不记录；刷新清空并重新锁定 | `question:activation-linear-3d`；题目状态与相机状态分开。恢复错误答案后仍允许继续选择，恢复正确答案后直接锁定 |
| Plotly 视角 | 三个 3D 选项、深层等价平面以及 2D 图的平移/缩放 | `state.view3d` 是死状态，`plotly_relayout` 没有接入 Telemetry | `view:activation-plots`；按稳定图表 ID 保存 `scene.camera` 或坐标范围。仅在用户手势结束后防抖提交一次 `activation_plot_view_commit`；重绘、ResizeObserver 和恢复不写事件 |
| 浅层随机网络 | `neurons[]`、`outputBias`、数量和等价直线 | 初始加载和每次添加都会产生新随机值；旧按钮只有 `ui_click`，无法恢复精确网络 | `activity:activation-linear-network`；保存完整 `shallow.neurons/outputBias`。先等待 SQLite hydrate，确认无记录后才生成初始随机快照；恢复禁止调用 `makeShallowNeuron()`。每次添加用一个 `activation_linear_neuron_add` 保存最终完整状态 |
| 深层随机网络 | `deepRevealed/layerCount/sizes/W/B`；展开、加层、减层、随机参数都会重建模型 | 旧页面没有语义事件和恢复；刷新或错误 hydrate 会得到另一张随机网络 | 继续使用 `activity:activation-linear-network`；事件分别为 `activation_linear_deep_reveal/layer_add/layer_remove/reroll`，每次只保存一份最终完整快照。恢复不调用 `buildDeepModel()` |
| 线性结论 | 达到 5 层后显示，随后减层也保持显示 | 没有独立状态事件；刷新消失 | 在同一 activity 快照保存单调字段 `hasReachedFiveLayers/conclusionRevealed`。达到 5 层的那次加层操作同时保存，不另开一个重复“完成”业务事件 |
| ReLU 单神经元 | `value=0/touched=false/exploredNegative=false`；拖动中实时更新，曾到负区后永久开放继续 | 旧 range 的 `change` 与失焦观察可能产生重复 `control_commit`，但没有 `touched/exploredNegative`；刷新回未操作状态 | `activity:activation-relu-intro`；保存 `value/touched/exploredNegative`。拖动中只更新 UI，在释放、键盘提交或短防抖后写一个 `activation_relu_input_commit`；根节点使用 `data-telemetry-manual` 避免自动观察重复记录 |
| 多 ReLU 网络 | `count=1..5`、`selectedNode`、`approxRevealed` | 添加和重置按钮只有 `ui_click`；刷新回 1 | `activity:activation-relu-network`；保存 `count/approximationUnlocked`。固定神经元参数作为内容常量，不必重复入库。添加、重置各写一次完整快照；达到 5 后 Lesson Flow 完成调用保持幂等 |
| 曲线逼近与最终面板 | `approxCount=2..12`、`activationPanel` 是否展开 | 添加和重置只有通用点击；达到 12 没有完成事件；刷新回 2 并隐藏最终面板 | 可继续使用 `activity:activation-relu-network`，保存 `approxCount/activationPanelRevealed/completed`。第一次达到 12 的“增加”事件同时保存终态，并由 Lesson Flow 的 `relu-approximation` 步骤幂等触发 `module_complete`；恢复不等待 620ms |
| 滚动提示 | 临时全局 `activeScrollCue` 和回调对象 | 不持久化；刷新消失 | 不保存 DOM 或回调，根据已保存业务门槛派生；交给 `LessonFlow revealMode="cue"`，不保留全局 `wheel` |
| Canvas hover 与布局缓存 | `modelNodes/selectedNode`、节点坐标和 pointer 命中 | 不记录，刷新清空 | 不持久化，这是瞬时观察状态；恢复后按当前容器重新布局，不得用 hover 事件覆盖业务快照 |
| 模块完成 | 旧页面没有正式完成状态 | SQLite 中不会出现本模块的 `module_complete` | `module:activation-func-module-react`；迁移定义为第一次达到 12 个逼近折点。`LessonFlow.complete()` 已有重复完成 guard，模块内不得再发第二个 `module_complete` |

Telemetry 的现有状态接口会按同一 `state_key` 读取最新业务快照。重置、添加、删除、随机和拖动提交应继续覆盖各自所属的稳定业务 key，不能为“reset”另建孤立状态 key。模块私有实验根节点应使用 `data-telemetry-manual`，确保一次用户操作只有一个显式业务事件；Lesson Flow 只在真正跨越步骤时额外记录自己的流程进度，不把观察事件当成用户操作。

初始化随机状态可以使用明确的非用户事件 `activation_linear_state_initialized`，但只能在“hydrate 已完成且 SQLite 确认无记录”后产生一次。恢复过程本身不得发初始化、添加、随机参数或答题事件。

## 表三：后端接口与外部依赖冻结

| 类型 / 接口 | 当前请求或加载方式 | 当前能力契约 | 风险与 React 迁移边界 |
|---|---|---|---|
| 业务后端 | 整个模块没有 `fetch`、XHR、WebSocket 或业务 URL | 无 AI 评阅、无训练后端、无远程数据接口 | 不新增假服务或假反馈；本模块的函数、网络与曲线计算继续在前端完成 |
| 旧静态启动链 | 原始 `index.html` 只显式加载 `style.css`、vendored Plotly、`plot-utils.js` 和 `script.js` | 模块脚本同时依赖 `DLCanvas`、`DLPlot`、`DLModuleUI` 和 shared CSS 类 | 当前工作副本缺少 `DLCanvas` 提供方，初始化不能完成；React 迁移直接使用 React shared 和私有 Canvas 组件，不把旧全局补回 React shared |
| Telemetry：`POST /__telemetry/events` | 模块 HTTP 服务向 HTML 注入 `/shared/telemetry.js`；Vite 把 `/__telemetry` 代理到 59411 | 批量写入现有 SQLite，并自动记录页面和通用交互 | React 私有状态用 `emitTelemetry` 显式写稳定 key；交互根节点关闭旧自动观察，避免 `ui_click/control_commit` 与业务事件重复 |
| 状态恢复：`GET /__telemetry/state?module_id=...` | React helper `getTelemetryState()` 已封装 | 返回该模块各 `state_key` 最新快照以及 completed 状态 | 旧页面从未调用；React route 的 module ID 固定为 `activation-func-module-react`，不得混用 `M20-activation-func` 或目录大小写 ID |
| Plotly 本地资源 | 旧页加载 `modules/shared/vendor/plotly/3.6.0/plotly.min.js`，再调用 `window.DLPlot` | 2D 曲线、3D 曲面、网络输出、逼近和三张激活函数图 | React 使用 `PlotlyChart` 统一加载同一 vendored Plotly、响应式配置和卸载 purge；trace、范围、采样和相机参数由模块提供 |
| 旧 Canvas 全局 | `window.DLCanvas.resize/context/observe` | 三套网络拓扑的高清缩放、context 和 ResizeObserver | 当前工作副本没有提供该全局的文件。迁移时把绘图算法放进模块私有 React Canvas 组件，以 `ref/useEffect/ResizeObserver cleanup` 取代，不修改 shared |
| 旧 UI 全局 | `window.DLModuleUI.renderRelatedVideos` 仅在最终资源区使用且有存在性守卫 | 渲染 3 个推荐视频 | React 直接复用 `RelatedVideos`；缺少视频加载不能阻断课程完成 |
| Bilibili iframe | 三个 `//player.bilibili.com/...` iframe | 延伸资源，不参与任何解锁门槛 | 保留视频清单；外部网络失败仅影响视频播放 |
| 课程导航 | 旧相对地址 `../CourseMap/`、`../MLP_playground/` | 返回课程目录、进入下一课 | 改成 React 注册路由或明确兼容跳转；不要把旧相对路径直接复制到 `/modules/...` |
| `guide.js` | 当前入口、`module.json.assets` 和 `script.js` 均未加载 | 另一套 landing、Canvas 和 ReLU 近似实验 | 作为遗留参考保留，不进入首轮 React 正式链路；若未来采用其中算法，必须作为功能变更另行评审 |
| `tutorial_code.py/json` | 独立 Python 教程资产，`autoInsert=false`，页面未引用 | 展示多个 ReLU 单元怎样形成分段线性函数 | 保留资产并登记为“尚未接入”；是否增加代码练习是后续需求，不在迁移中擅自扩展 |
| 元数据 ID | `module.json.id="M20-activation-func"`；`info.json.id="Activation-Func-Module"` | 当前存在两个旧 ID | React 迁移另冻结目录 ID、registry ID、route 和 persistenceKey；Telemetry 只使用 route ID，避免状态分裂 |

## 表四：React / shared 复用关系

| 原能力 | 目标实现 | 复用方式 | 保留在模块内的部分 | 是否需要修改 shared |
|---|---|---|---|---|
| 页面标题、统一宽度和响应式外壳 | `ModuleShell` | 直接复用 | 只传标题、副标题和模块 class | 否 |
| 教学推进与逐段展开 | `LessonFlow` + `ScrollCue` | 直接复用，按真实交互门槛拆 9 个稳定步骤 | 每个实验只报告自己的完成事实；首次操作可保留一个可清理的短延时 | 否 |
| 标准标题、说明、线性结论 | `ContentBlock`、`LessonStage`、`Callout` | 通过内容配置和组合表达 | 课程文案、公式和局部网格 | 否；不创建绑定死的 `IntroBlock/SummaryBlock` |
| 二维 / 三维面板题 | 模块私有 `PersistedPanelChoice`，复用 shared 视觉 class、`Feedback` 和 Plotly | 保留 Panel Choice 外观 | 可交互媒体与答题按钮分离、正确后锁定、Telemetry 恢复、完成回调 | 否；当前 `PanelChoiceQuestion` 把整卡做成 button，Plotly 拖动可能误答，且没有 persistence/lock/onComplete |
| 2D 函数、网络输出、ReLU、逼近和激活函数图 | `PlotlyChart` + `sampleFunction2D` | 直接复用 Plotly 生命周期、坐标轴基础能力和采样工具 | 函数、trace、颜色、折点、图例和固定范围 | 否 |
| 3D 选择曲面和深层等价平面 | `PlotlyChart` + `sampleSurface3D` | 直接复用，保留 Plotly 旋转/缩放 | 曲面函数、colorscale、camera、视角持久化适配 | 否 |
| 浅层和深层网络操作按钮 | `Button` | 直接复用 | 上限、随机模型、禁用条件、事件快照和定时器清理 | 否 |
| 浅层 / 深层网络说明 | `NoticeStrip`、`Feedback` | 直接复用 | 等价直线/平面计算和动态文案 | 否 |
| 单神经元 ReLU 滑块 | `RangeControl` | 复用外观、标签、数值和无障碍语义 | `unset/touched` 视觉、实时公式、提交去重和负区间门槛 | 否 |
| ReLU 公式 | `FormulaBlock/FormulaTerm` | 直接复用 | 当前 `x/z/y` 代入值和 tooltip 内容 | 否 |
| ReLU 信号流 | 模块私有 `ReluSignalDiagram.tsx` | 按 shared token 保持配色和字体 | 五节点布局、连线、负数抑制状态和 1120/760/520 断点 | 否；这是本模块特殊教学图 |
| 三套网络 Canvas | 模块私有 `LinearNetworkCanvas.tsx`、`DeepLinearNetworkCanvas.tsx`、`ReluNetworkCanvas.tsx` | 只复用 shared 容器、按钮和反馈 | 拓扑布局、边权颜色/粗细、节点标签、命中、hover inspector 和 DPR 绘制 | 否；不把私有网络语义塞进 shared |
| 随机网络和数学 | 模块私有纯函数 / reducer | 无 UI 重复实现 | `makeShallowNeuron`、`buildDeepModel`、forward、等价直线/平面、ReLU 输出和逼近算法 | 否 |
| 推荐视频 | `RelatedVideos` | 直接复用视频卡和响应式布局 | 原 3 个视频数据 | 否 |
| 最终导航 | `Button` + 标准 `nav` 组合 | 复用按钮和 shared 排版 | React 路由地址 | 否；完整 `LessonFooter` 会额外加入原页面没有的 `PageRating`，为保持迁移一致性先不直接套用 |
| 状态与事件 | `emitTelemetry/getTelemetryState` + 模块私有 hydration reducer | 复用现有 SQLite 通道 | 快照 schema、随机状态恢复、Plotly camera、hydrate guard 和事件去重 | 否 |
| 内容块单独预览 | 现有 `src/app/BlockPreview.tsx` | 完整页和预览页 import 同一份实验组件 | 仅在 `src/app/routes.tsx` 注册开发路由；随机实验通过同一 Provider 初始化 | 否 |
| 减少动画偏好 | shared reveal 规范 + 模块 CSS `prefers-reduced-motion` | 沿用 UI Kit 方向 | 禁用短延时后的平滑滚动和 Canvas/揭示动画，但同步完成状态 | 否 |

建议的目录和调试路由：

```text
modules/Activation-Func-Module-React/
  ActivationFuncPage.tsx
  activation-func-module-react.css
  blocks/
    LinearChoiceBlock.tsx
    ShallowLinearNetworkBlock.tsx
    DeepLinearNetworkBlock.tsx
    ReluSignalBlock.tsx
    ReluNetworkBlock.tsx
    ApproximationBlock.tsx
    ActivationCatalogBlock.tsx
  components/
    PersistedPanelChoice.tsx
    LinearNetworkCanvas.tsx
    DeepLinearNetworkCanvas.tsx
    ReluNetworkCanvas.tsx
    ReluSignalDiagram.tsx
  model/
    activationMath.ts
    activationState.ts

/dev/blocks/activation-func-module-react/linear-2d
/dev/blocks/activation-func-module-react/linear-3d
/dev/blocks/activation-func-module-react/linear-shallow
/dev/blocks/activation-func-module-react/linear-deep
/dev/blocks/activation-func-module-react/relu-intro
/dev/blocks/activation-func-module-react/relu-network
/dev/blocks/activation-func-module-react/approximation
/dev/blocks/activation-func-module-react/activation-catalog
```

`LinearChoiceBlock` 应通过 `dimension/config` 复用同一实现，而不是分别创建绑定章节名称的两个组件。线性定义和线性结论属于标准内容，应由相邻 block 中的 `ContentBlock/Callout` 配置表达，不创建私有 `IntroBlock` 或 `SummaryBlock`。

## React 正式启动链路契约：当前缺口与待实现要求

迁移期命名冻结为：

```text
文件系统目录 / 迁移模块 ID：Activation-Func-Module-React
app registry ID / 路由键：activation-func-module-react
拟议正式页面：/modules/activation-func-module-react
LessonFlow persistenceKey：activation-func-module-react
旧页面：/Activation-Func-Module/（只作对照）
```

当前技能正式入口仍只识别带独立 `index.html` 的静态模块：

```text
skill.manifest.json 的 openModule
  → scripts/run-lesson-page.sh --open-module
  → scripts/lab_launcher.py --open-module --module-id <目录名>
  → _module_exists() 要求 modules/<module-id>/index.html
  → scripts/service_runtime.py 返回 59411 静态页面 URL
```

当前 React 开发链路则是：

```text
npm run dev
  → Vite 5173
  → 根 index.html 先加载 /modules/shared/telemetry.js
  → src/main.tsx
  → src/app/routes.tsx
  → src/app/modules.tsx 的 migratedModules
  → ActivationFuncPage
  → LessonFlow
  → 可单独预览的同源内容块
```

因此在宣布本模块“正式可启动”前仍需补齐：

1. `src/app/modules.tsx` 注册 `activation-func-module-react` 与正式路由。
2. `src/app/routes.tsx` 注册所有 block preview，完整页和预览页必须引用同一实现。
3. `openModule --module-id Activation-Func-Module-React` 能识别 React registry，不再要求目标目录自带静态 `index.html`。
4. 统一入口负责启动、健康检查、状态查询和停止 React 前端；返回 URL 为 `/modules/activation-func-module-react`。
5. 刷新 React 深链仍返回根 `index.html`，并保证 Telemetry 脚本先于 `src/main.tsx` 加载。
6. `/__telemetry/state` 和事件写入继续落到现有 SQLite，module ID 固定为 `activation-func-module-react`。
7. 旧静态模块的 59411 地址保持兼容；不能为了 React 模块破坏尚未迁移课程。
8. 发布态明确采用“59411 托管 Vite 构建产物并提供 SPA fallback”或“统一启动器管理独立 React 服务”之一；当前代码尚未完成这一选择。

## 已冻结的私有实现

- 二维三选一和三维三选一的题目、正确答案、反馈和范围配置。
- 浅层随机神经元、输出偏置、等价直线计算及参数范围。
- 深层网络矩阵生成、前向计算、等价平面推导和 1～5 层门槛。
- 线性与 ReLU 网络的 Canvas 拓扑、边权正负颜色与粗细编码。
- 两套节点命中、hover inspector、参数说明和浮层边界钳制。
- 单神经元 `w=2` 的 ReLU 信号流、动态公式和负数探索门槛。
- 五组固定 ReLU 神经元参数、输出偏置、基础斜率与折点计算。
- 当前启动页使用的目标函数和分段线性插值算法。
- 三张常见激活函数卡、三个视频和课程导航文案。

不应保留为 React 架构依赖的旧实现：

- `window.DLCanvas`、`window.DLPlot`、`window.DLModuleUI` 全局。
- 直接修改 `hidden/classList/innerHTML` 的流程控制。
- 全局且不清理的 `click/wheel` 监听。
- 恢复时重新运行 `Math.random()`、`buildDeepModel()` 或短延时动画。
- 没有 DOM 对应物的 `updateBadge()` 和未使用的 `view3d/graphDragging/linearLab.mode` 状态。
- 同时叠加旧 `af-rise` 与 Lesson Flow reveal 的双重动画。

## 跨模块共性问题与 shared 决策

已知多个旧模块依赖 `DLModuleUI` 或旧共享资源，但这属于旧静态模块的兼容运行时 / 打包问题，不等于 React shared 缺少一个应当立即新增的组件。Activation 当前还暴露出 `DLCanvas` 缺口，但仓库中没有权威旧资源可供小范围、兼容地恢复。

本模块唯一明显的 React shared 能力缺口是 `PanelChoiceQuestion`：

- 整张卡是 button，无法安全承载可拖动、可缩放、可旋转的 Plotly；
- 没有 `persistenceKey`；
- 没有答对后锁定；
- 没有 `onComplete`。

目前这组需求只由本模块得到完整证实，且能通过模块内薄适配解决。因此本次结论是：

- 不修改 `modules/shared/react`；
- 不向 shared 加回旧全局；
- 先在 `Activation-Func-Module-React` 内实现 `PersistedPanelChoice`；
- 后续只有第二个迁移模块出现相同的“交互媒体面板题 + 持久化 + 锁定”需求时，再列出受影响模块、提出兼容的最小 shared API，并补 UI Kit 示例。

## 待确认但不阻塞开始迁移的行为差异

- 页面把仿射函数统称为线性；默认保留教学文案，不在技术迁移中改课。
- 曲线逼近当前是分段插值而非真实 ReLU 网络。默认忠实迁移当前启动页算法；若要切换 `guide.js` 算法，必须另立教学正确性改动。
- 深层网络达到 5 层后再减层，结论仍显示。React 应保存单调的 `hasReachedFiveLayers`，保持可见结果一致。
- 多 ReLU 重置后已展开的逼近区不会收回，但旧标志会允许重复提示。React 应保留“已展开不收回”，同时让 unlock 幂等，不重复提示。
- 逼近达到 12 后重置，最终资源区不会收回。React 应保存 `activationPanelRevealed/completed` 为单调事实。
- `LessonFooter` 会新增原页面没有的 PageRating。为避免迁移偏差，首轮使用 `RelatedVideos + Button + nav` 组合；这不是 shared 缺陷。
- 原页面没有 `module_complete`。React 迁移建议以第一次达到 12 个折点为正式完成门槛，并在完成说明中明确这是对原可观察终点的正式化。

## 本次未迁移

本次没有创建 `Activation-Func-Module-React`，没有注册正式路由或 block preview，没有实现 Telemetry schema，没有修复旧静态入口，也没有修改 shared。下一阶段应先实现状态模型与 hydration guard，再按表四小步迁移；每完成一个实验 block，就同时完成独立预览、刷新恢复、随机参数一致性和原页面视觉 / 交互对照。
