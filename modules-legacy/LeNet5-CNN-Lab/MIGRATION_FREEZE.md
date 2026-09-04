# LeNet5-CNN-Lab 迁移冻结

> 迁移目标：`LeNet5-CNN-Lab-React`。本文件只记录迁移前页面的事实、复用关系和验收边界；真实运行页面 `index.html + script.js + style.css` 是基线，过期的 `module.json` 不能替代页面事实。

## 页面与教学步骤表

| 顺序 | 旧页面内容 | 精确完成条件 | React 迁移归属 |
| --- | --- | --- | --- |
| 1 | 六种固定 3×3 卷积核、28×28 数字、卷积特征图、8×8 池化、flatten、分类概率与拒识、手写数字 | 当前核顺序签名与训练模型一致，验证准确率严格 `> 0.9`，且用户实际写入非空图像 | `FixedKernelClassifierBlock` |
| 2 | 随机五位数字、识别策略简答、逐帧扫描与 CTC 式合并 | 真实简答服务返回成功后允许扫描；扫描到末尾即完成，不要求解码结果等于真值 | `SequenceRecognitionBlock` |
| 3 | 256×256 场景中的 0、2、4、6、8；检测策略简答；400 个滑窗；按 P(6) 排名 | 真实简答服务返回成功后允许扫描；400 个窗口全部处理完成即完成模块，不要求框与真值完全一致 | `DetectionSearchBlock` |
| 4 | 四个原有 Bilibili 视频、返回课程目录、学习下一课 | 第三幕完成后展开；本块本身立即完成 | `ResourcesBlock` |

## 交互与状态表

| 交互/状态 | 迁移前行为 | React 与恢复要求 |
| --- | --- | --- |
| 核选择 | 默认 edge；可增删、重置，至少保留一个；选择顺序参与分类器签名 | SQLite 恢复核列表和顺序；改核使旧模型和下游状态失效；一次点击只记录一个语义操作 |
| 核说明与特征图 | 核卡悬停说明；特征图支持点击、滚轮、上下拖动和键盘切换 | 保留为模块私有交互；悬停、拖动、焦点等瞬态不持久化 |
| 训练 | 调用真实固定核训练服务；成功后展示训练/验证指标和模型；样本自动轮换 | 保存模型、指标、签名和最终预览；恢复不重播训练或轮换事件；失败不得伪成功 |
| 手写 | pointer 绘图、清屏、完成；非空墨迹才算真实书写 | 保存最终 28×28 像素和完成状态，不逐个 `pointermove` 记录事件 |
| 序列识别 | 随机五位数；真实简答成功后扫描；步长 1、约 5 秒；reject `_`、阈值 0.42、最小 run 2 | 保存数字、图像、题目/评语、最终帧、解码和完成状态；恢复完成态直接显示，不重播扫描 |
| 目标检测 | 场景可重置；0..228、步长 12，20×20 共 400 窗；每 40ms 处理 2 窗，每 6 窗更新排名 | 保存场景、题目/评语、最终窗口、最佳框和完成状态；动画帧不逐条持久化；恢复完成态不重播 |
| Lesson Flow | 固定核与手写 → 序列 → 检测 → 资源 | 完成幂等；恢复不重复展开、滚动、提示或记录；完整页面与单内容块使用同一份实现 |
| Telemetry 不可用 | 旧静态页刷新即重置 | React 版在本次内存继续学习，不锁页面、不新增横幅、不使用 localStorage；刷新后从初始状态开始 |

## 资源与接口表

| 资源/接口 | 冻结契约 | 迁移策略 |
| --- | --- | --- |
| 私有页面资源 | `index.html`、约 96KB 的 `script.js`、约 44KB 的 `style.css`、`random.svg` | 将稳定算法、Canvas 和视觉实现拆成模块私有 TS/TSX/CSS，不恢复旧全局 DOM 运行时 |
| 固定核预览 | `POST http://127.0.0.1:59415/lenet5/fixed-kernel-preview`，body `{kernels,sample_index,image}` | 保留真实接口和错误语义 |
| 固定核训练 | `POST http://127.0.0.1:59415/lenet5/fixed-kernel-train`，body `{kernels,train_ratio:0.9,image}` | 保留真实训练，不用写死指标或假模型 |
| 序列图像 | `POST http://127.0.0.1:59415/lenet5/sequence-sample`，body `{digits}` | 序列和检测场景复用真实图像服务 |
| 序列评语 | `POST http://127.0.0.1:59414/digit/sequence-strategy-feedback`，body `{answer,digits}` | 使用 shared `Question` 承载题目与恢复；服务失败不解锁 |
| 检测评语 | `POST http://127.0.0.1:59414/digit/detection-strategy-feedback`，body `{answer}` | 使用 shared `Question`；服务失败不解锁 |
| 固定核算法 | 六核；3×3 valid 卷积 → ReLU → 26×26 到 8×8 比例面积均值池化 → flatten → 标准化 → softmax；11 类含 reject | 等价迁移到模块私有 TypeScript，不抽入 shared |
| 序列算法 | reject/置信度阈值、相同符号 run 合并、短 run 过滤和目标长度修正 | 等价保留私有实现 |
| 检测算法 | 256 画布；数字 0/2/4/6/8；400 窗；P(6) 降序、top/left 升序 | 等价保留私有实现 |
| 推荐视频 | `BV1t44y1r7ct`、`BV1Gc26YtEfU`、`BV1ce4y1p7jF`、`BV1b7411T7DA` | 只将这四个原有视频交给 shared `LessonFooter`，不擅自新增 |

## 复用关系与验收表

| 能力 | 直接复用 shared | 模块私有保留 / 验收重点 |
| --- | --- | --- |
| 页面和流程 | `ModuleShell`、`LessonFlow`、`LessonStage`/内容容器 | 三幕的双栏布局、响应式尺寸和旧页面重要视觉 |
| 标准教学交互 | `Question`、`Button`、`Feedback`/`Callout`、`NoticeStrip`、`ValueTile`、`AttentionHint` | 核选择、手写板、特征图 deck、扫描动画、场景和排名 |
| 状态 | shared Telemetry API | 模块私有 typed persistence adapter；恢复去重与级联一致性 |
| 课程结尾 | `LessonFooter` / `RelatedVideos` | UI Kit 标题与说明、原四个视频、课程目录和下一课配置 |
| 图表 | 无需 Plotly | 本模块是像素、Canvas 和神经网络私有可视化，不重复实现通用图表 |
| 共享修改 | 无 | 现有 shared 已可通过组合满足需求；本轮不得修改 `modules/shared` |
| 元数据风险 | — | `module.json` 仅描述“第一幕”，但真实页面已有三幕；验收必须覆盖三幕和资源 |
| 死分支 | — | 旧脚本存在 drop 监听，但页面没有 draggable/dragstart 来源；不存在的 `#readout` 写入也不可达，不迁移这些死分支 |
| 服务异常 | shared 错误展示能力 | 59414/59415 不可用时不假反馈、不假训练；Telemetry 单独不可用时页面仍可操作 |

## Lesson Flow 定义

1. `fixed-kernel`：训练出的当前签名模型验证准确率严格大于 0.9，并完成一次真实非空手写。
2. `sequence`：真实简答评阅成功后完成整段扫描。
3. `detection`：真实简答评阅成功后完成全部 400 个窗口；该步幂等标记模块完成。
4. `resources`：立即显示 UI Kit 课程结尾、原有四个视频与导航。

## 单内容块调试路由

```text
/dev/blocks/lenet5-cnn-lab-react/fixed-kernel
/dev/blocks/lenet5-cnn-lab-react/sequence
/dev/blocks/lenet5-cnn-lab-react/detection
/dev/blocks/lenet5-cnn-lab-react/resources
```

序列和检测预览必须取得真实分类器会话，不以写死模型替代前置能力。完整课程与调试路由引用相同的块实现。
