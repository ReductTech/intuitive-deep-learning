# Face-Recog-Lab 迁移冻结

> 迁移目标：`Face-Recog-Lab-React`。本文件只记录迁移前页面的事实、复用关系和验收边界；真实运行页面 `index.html + script.js + style.css + act3-disguise-game.js + game/**` 是基线。`module.json` 中“前两幕已实现”的描述已经落后于真实页面，不能替代页面事实。

## 页面与教学步骤表

| 顺序 | 旧页面内容 | 精确完成条件 | React 迁移归属 |
| --- | --- | --- | --- |
| 1 | 第一幕“固定扫描器识别人脸身份”：六种固定卷积核、LFW 彩色人脸样本、4×4 特征图相片浏览、flatten、分类器连接图、Top 身份概率和 MLP 训练 | 当前所选固定卷积核的真实 MLP 训练请求成功并得到训练/验证结果；成功后旧页面显示进入第二幕的滚动提示 | `FixedKernelFaceBlock` |
| 2 | 第二幕训练区：Conv/Pool 结构编辑、通道数、拖动排序、Three.js 3D 网络结构、CNN 异步训练和 ECharts 训练曲线 | 使用当前结构启动真实 CNN 训练任务，轮询到训练成功并显示训练集/验证集指标及历史曲线 | `LearnableCnnBlock` |
| 3 | 第二幕理解练习：卷积核深度、RGB 深度、输出通道、验证准确率和人脸验证简答共五题，按顺序展开 | 前四题依次答对；第五题提交真实简答评阅。旧页面在评阅请求结束后进入第三幕，React 版必须分别保存提交内容、真实评语或真实错误，不得伪造评语 | `CnnUnderstandingBlock` |
| 4 | 第三幕“雨花弄：变脸”：开始视频、Phaser 场景、移动与碰撞、对话、乔装编辑、相似度检测、剧情和结算 | 现有游戏运行时派发 `face-recog:act3-complete`；完成操作必须幂等并标记模块完成 | `DisguiseGameBlock` |
| 5 | 原有四个 Bilibili 推荐视频和返回课程目录 | 第三幕完成后展开；资源块本身立即完成。Face 是当前课程最后一课，不配置下一课 | `ResourcesBlock` |

## 交互与状态表

| 交互/状态 | 迁移前行为 | React 与恢复要求 |
| --- | --- | --- |
| 固定核选择 | 默认启用 edge、vertical、horizontal、diag_down、diag_up、center；可增删、重置并切换当前特征核 | SQLite 恢复核列表、顺序和当前特征核；改变核配置使旧预览和训练结果失效；一次点击只记录一个语义事件 |
| 人脸样本 | 上一张/下一张切换 LFW 样本；页面启动时请求演示图和固定核预览 | 恢复样本编号和最后一次稳定预览；初始化及恢复不得伪装成用户切换，也不得重复记录观察事件 |
| 特征图浏览 | 特征图 deck 支持点击、滚轮、上下拖动、方向键、PageUp/PageDown、Home/End | 保留为模块私有交互；只保存稳定的当前特征图索引，不持久化 hover、pointermove、拖动中间帧 |
| 固定核训练 | 调用真实训练服务，成功后展示指标、分类结果并出现第二幕提示 | 保存训练输入签名、结果和指标；恢复完成态不重新训练、不重复展开或滚动；失败不得伪造成功 |
| CNN 架构 | 默认 Conv8 → Pool → Conv16 → Pool → Conv32 → Pool → Conv64；可添加 Conv/Pool、选择最大/平均池化、调整通道、删除、重置和拖动排序 | 恢复完整结构、选中项及稳定视角配置；结构变化使旧 CNN 任务、曲线和后续答题状态按依赖关系失效 |
| Three.js 舞台 | 鼠标旋转、滚轮缩放、空格加鼠标平移，显示当前主干结构 | 保留模块私有 Three.js 实现；相机连续移动属于瞬态观察，不逐帧写 Telemetry |
| CNN 训练 | 提交异步任务，约每 420ms 轮询状态；完成后显示指标、历史曲线并展开练习 | 保存任务 ID、阶段、结构签名、最终指标和曲线；刷新后继续轮询同一任务，不能重复创建训练任务 |
| 五道练习 | 前四题正确后逐题展开；第五题把答案发送给真实人脸验证评语服务 | 每题使用稳定 persistence key；恢复题目、答案、结果、反馈和当前序号；恢复不触发自动提交或重复展开 |
| 第三幕游戏 | Phaser 管理场景、剧情、人物、碰撞、乔装画笔、相似度和结算 | React 只负责安全挂载/卸载、有限检查点和完成事件适配；不得为了 React 化重写稳定游戏运行时；重复挂载不得创建多个游戏实例 |
| Lesson Flow | 第一幕 → 第二幕训练 → 连续练习 → 第三幕 → 推荐资源 | 使用现有 `LessonFlow`；完成操作幂等，恢复不重复提示、滚动、展开、记录或播放完成动画 |
| Telemetry 不可用 | 旧静态页面刷新后全部重置，没有课程状态恢复 | React 版本次会话使用内存初始状态继续，不锁页面、不使用 localStorage、不新增错误横幅；刷新后重新开始 |

## 资源与接口表

| 资源/接口 | 冻结契约 | 迁移策略 |
| --- | --- | --- |
| 固定核训练 | `POST http://127.0.0.1:59415/face-recog/fixed-kernel-train` | 保留真实请求、输入签名、响应解析和错误语义，不以写死准确率替代 |
| 固定核预览 | `POST http://127.0.0.1:59415/face-recog/fixed-kernel-preview` | 用于真实样本与特征图预览；观察响应不得覆盖用户控制状态 |
| 可学习 CNN 训练 | `POST http://127.0.0.1:59415/face-recog/lenet-train`，并轮询 `/face-recog/lenet-train-status` | 保留异步任务和真实训练历史；刷新后按已保存任务 ID 恢复轮询 |
| 人脸验证评语 | `POST http://127.0.0.1:59414/face/verification-feedback` | 简答题必须调用真实服务；失败显示真实错误，不提供假评语 |
| 演示图 | `http://127.0.0.1:59415/face-recog/demo-image`，本地回退 `../../dataset/face_demo.png` | 保留现有服务和资源回退，不复制或伪造人脸数据 |
| 游戏相似度 | `http://127.0.0.1:59415/face-recog/embedding-similarity` | 保留现有乔装前后人脸相似度协议和错误处理 |
| 图形运行时 | shared vendor 中的 Three.js 0.148.0、Phaser 3.90.0、ECharts 5.6.0；旧页还加载 Plotly，但本页可见训练历史使用 ECharts | ECharts 图表直接接入 shared `EChartsChart`；Three.js 和 Phaser 由 Face 私有适配器管理，不抽入 shared |
| 游戏实现和素材 | `act3-disguise-game.js`、`game/config`、`game/assets`、`game/systems`、`game/actors`、`game/ui`、`game/disguise`、`game/cutscene`、`game/scene`、`game_assets/**` | 原样保留稳定私有实现和素材；React 通过宿主节点、生命周期和完成事件局部适配 |
| 推荐视频 | `BV1UN4y1h71g`、`BV1mW421A7Wx`、`BV1TH4y1L7PV`、`BV1TWWhzrEKv` | 只将这四个旧页面已有视频交给 shared `LessonFooter`，不新增、不替换；游戏完成后才显示 |
| 课程导航 | 旧页面仅返回 `../CourseMap/`，没有下一课 | React 资源块只配置“返回课程目录”，不配置 `next` |

## 复用关系与验收表

| 能力 | 直接复用 shared | 模块私有保留 / 验收重点 |
| --- | --- | --- |
| 页面和流程 | `ModuleShell`、`ContentBlock`、`LessonFlow` | 三幕顺序、旧页面关键布局、响应式宽度和滚动解锁关系 |
| 标准控件 | `Button`、`Select`、`RangeControl`、`NoticeStrip`、`Callout`、`Feedback` | 卷积核卡、特征图 deck、Canvas、Three.js 架构编辑器和游戏控件 |
| 标准题目 | `Question` | 五题固定顺序和内部解锁状态；若 shared 简答无法满足写入与真实评阅顺序，只在 Face 模块内做兼容适配 |
| 训练曲线 | `EChartsChart` | Face 服务响应解析、任务轮询和曲线数据变换保持私有 |
| 状态 | shared Telemetry API 和 `LessonFlow` 恢复 | 模块私有 typed persistence adapter；任务恢复、依赖失效、StrictMode 去重和游戏有限检查点 |
| 游戏 | 无通用 shared 游戏组件 | 保留完整 Phaser 子系统；React 负责幂等加载、卸载和 `face-recog:act3-complete` 桥接 |
| 课程结尾 | `LessonFooter`、`RelatedVideos`、`PageRating` | 只使用原四个视频；仅返回课程目录；不设置下一课 |
| 共享修改 | 无 | 现有 shared 能通过组合和模块私有适配满足需求；本次不得修改 `modules/shared`，也不需要更新 UI Kit |
| 开发工具 | 无 | `level-editor.html/css/js`、`game-debug.html`、`extract_sprite_bounds.py` 和 `disguise-config - 副本.js` 未挂载到正式学习页，不属于学习功能迁移范围 |
| 服务异常 | shared 错误展示能力 | 59414/59415 不可用时不得假训练、假预览或假评语；仅 Telemetry 不可用时允许非持久化继续 |

## Lesson Flow 定义

1. `fixed-kernel-face`：当前固定核配置的真实 MLP 训练成功后完成，并以 cue 方式进入下一步。
2. `learnable-cnn`：当前 CNN 结构的真实训练任务成功后完成。
3. `cnn-understanding`：前四题答对并完成第五题真实简答提交与评阅状态保存后完成，以 cue 方式进入第三幕。
4. `disguise-game`：收到一次 `face-recog:act3-complete` 后幂等完成，并标记模块完成。
5. `resources`：立即显示 UI Kit 课程结尾、原有四个视频和返回课程目录入口。

## 单内容块调试路由

```text
/dev/blocks/face-recog-lab-react/fixed-kernel
/dev/blocks/face-recog-lab-react/learnable-cnn
/dev/blocks/face-recog-lab-react/cnn-understanding
/dev/blocks/face-recog-lab-react/disguise-game
/dev/blocks/face-recog-lab-react/resources
```

需要训练结果的单块预览必须通过 Face 私有 Preview Gate 获取或恢复真实训练会话，不能注入假模型、假准确率或写死评语。游戏预览直接挂载与完整课程相同的 Phaser 实现。完整页面和所有调试路由必须引用同一份内容块实现。

## 冻结结论

- 旧正式学习页没有 localStorage、sessionStorage 或 Telemetry 恢复；React 迁移必须使用现有 Telemetry SQLite 补齐刷新恢复。
- `level-editor.js` 中的 localStorage 只属于独立关卡编辑工具，不能成为课程状态存储。
- `module.json` 只描述前两幕，但真实 `index.html` 已挂载第三幕、游戏脚本、完成事件和资源区；验收必须覆盖全部三幕。
- 现有 shared 已覆盖外壳、流程、控件、题目、训练图表和课程结尾，不存在修改 shared 的必要性。
- 三维结构和 Phaser 游戏属于本模块稳定私有能力；保留并局部适配比整体重写风险更低。
