# 原始反馈逐项核对

核对日期：2026-10-15。依据[人工反馈](/Users/hsy/Desktop/reduct/视觉transformer人工Markdown/视觉Transformer.md)与[教材评价](/Users/hsy/Desktop/reduct/student-package/report.md)，逐项核对实际注册组件，并在1600×900浏览器画布中检查页面和交互。

采用用户最新约定：保留27页，手动“上一步／下一步”覆盖原报告的“保留自动播放”。状态数包含初始状态，不能当成点击次数。未新增页面。

## 页序与状态数

[课程注册](/Users/hsy/Desktop/reduct/intuitive-deep-learning/modules/Vision-Language-Models/course.tsx:10)与[元数据](/Users/hsy/Desktop/reduct/intuitive-deep-learning/modules/Vision-Language-Models/outlines.json:16)均为27页。当前23=`connector-comparison`（原25），24=`multimodal-context`（原23），25=`training`（原24）；`sourceSlide`保留原稿编号，不应改成当前页码。人工反馈“第十一页”的图文配对按内容对应当前12页，当前11页仍是固定类别限制。

| 当前页 | 实际状态数 | 状态解释 |
| --- | --- | --- |
| 1 | 7 | 文本、Embedding、文本向量、原图、切块、视觉向量、Transformer |
| 7 | 3 | 三列点积 |
| 9 | 5 | 投影、分数、Softmax、V加权、转置维度 |
| 12 | 4 | 图文、编码、投影归一化、I/T点 |
| 13 | 6；小例另3 | 输入、编码、比较、损失、更新、重算；小例为损失、梯度、更新 |
| 14 | 3 | 前文、预测、追加后预测 |
| 15 / 16 | 各3 | 候选编码延续；匹配与理解检查 |
| 18 / 19 / 20 | 3 / 4 / 6 | 输出对照；数据流；每个任务各问题与证据两状态 |
| 21 / 22 | 2 / 5 | 位置特征；两层映射 |
| 23 | 静态 | 两种Connector实现 |
| 24 / 25 / 26 | 6 / 9 / 6 | 五次片段追加；初始加两阶段各四步；提问至修正及变式作答 |
| 27 | 2个任务 | 切换任务清空答案，各自有理由反馈 |

## 代码证据索引

下表使用这些代码简称与函数名定位。

- A：[InputBridgePage](/Users/hsy/Desktop/reduct/intuitive-deep-learning/modules/Vision-Language-Models/pages/InputBridgePage.tsx:25)；[LongRangePage](/Users/hsy/Desktop/reduct/intuitive-deep-learning/modules/Vision-Language-Models/pages/LongRangePage.tsx:38)。
- B：[VitPages](/Users/hsy/Desktop/reduct/intuitive-deep-learning/modules/Vision-Language-Models/pages/VitPages.tsx:11)。
- C：[VitExperiments](/Users/hsy/Desktop/reduct/intuitive-deep-learning/modules/Vision-Language-Models/pages/VitExperiments.tsx:8)。
- D：[SourceAlignment](/Users/hsy/Desktop/reduct/intuitive-deep-learning/modules/Vision-Language-Models/pages/SourceAlignment.tsx:14)。
- E：[ClipExperiments](/Users/hsy/Desktop/reduct/intuitive-deep-learning/modules/Vision-Language-Models/pages/ClipExperiments.tsx:26)。
- F：[SourceComparisons](/Users/hsy/Desktop/reduct/intuitive-deep-learning/modules/Vision-Language-Models/pages/SourceComparisons.tsx:83)；[ClipPages](/Users/hsy/Desktop/reduct/intuitive-deep-learning/modules/Vision-Language-Models/pages/ClipPages.tsx:39)。
- G：[VlmPages](/Users/hsy/Desktop/reduct/intuitive-deep-learning/modules/Vision-Language-Models/pages/VlmPages.tsx:13)。
- H：[VlmExperiments](/Users/hsy/Desktop/reduct/intuitive-deep-learning/modules/Vision-Language-Models/pages/VlmExperiments.tsx:9)。
- I：[SourceTasks](/Users/hsy/Desktop/reduct/intuitive-deep-learning/modules/Vision-Language-Models/pages/SourceTasks.tsx:29)；[VlmEvidence](/Users/hsy/Desktop/reduct/intuitive-deep-learning/modules/Vision-Language-Models/pages/VlmEvidence.tsx:15)。
- J：[LessonVisuals](/Users/hsy/Desktop/reduct/intuitive-deep-learning/modules/Vision-Language-Models/components/LessonVisuals.tsx:13)；[SceneDeck完成回调](/Users/hsy/Desktop/reduct/intuitive-deep-learning/modules/shared/react/presentation/SceneDeck.tsx:172)。

## 逐项验收矩阵

以下要求均已有实现与浏览器证据。自动扫描检查越界及文字/公式相交，截图人工检查补充识别遮挡。浏览器验证能确认呈现与操作，不能替代真实学习者的教学效果评估。

| 原始要求（来源及原页） | 当前页 | 当前代码证据与结论 | 已检查的浏览器验收点 |
| --- | --- | --- | --- |
| 人工总评／报告全章：降低密度、精简小字、加强过程引导 | 全章 | J `useStepSequence`无定时推进，控件边界禁用；各页使用共享Typography。 | 1600×900所有手动状态无检出越界或重叠，并检查截图 |
| 人工1／报告1–3：文本Token→Embedding→向量，随后同样展开图像 | 1 | A `useStepSequence(7)`；图像依次显示原图、切块、视觉向量及Transformer，保留之前内容。 | 7状态、首末边界、回退与静止；末态完整对照 |
| 报告1–3：首次解释Transformer、CNN | 1–3 | A写明“用注意力让Token交换信息”；LongRange写明CNN全称及局部滤波作用。 | 首次术语可读、无需依赖备注 |
| 报告5：N²计算动机及边界 | 5 | B `PatchSizeBody`展示196²=38416、49²=2401，1/4、1/16及不等于快16倍。 | 公式完整、不裁切 |
| 报告7/9/13：逐步定位 | 7/9/13 | C/E均使用J手动回退；7有3列、9有5态、13有6态。自动播放被最新用户约定覆盖。 | 往返状态正确、末态停留、局部按钮不触发翻页 |
| 人工8／报告8：精简位置说明，保留两组c+e | 8 | B `PositionBody`保留c=[1.5,3.5,2.5]及位置1/4的e、z，主句与短教学标签。 | 首眼可分辨c/e/z，图与公式无拥挤 |
| 人工9／报告9：公式和图示同步突出，补Softmax，最后替换转置公式 | 9 | C `AttentionExperiment`用红色文字高亮公式分段；指数、归一化、和为1及输出[.804,.196]；`step===4`替换主公式。 | 高亮与图中当前对象对应；公式位置与可读性 |
| 人工9：删除冗长免责；报告9：保留必要边界 | 9 | C只留短标签“教学示例·权重是读取份额，不是分类概率”；完整机制说明在讲稿。 | 标签不抢主体 |
| 人工10／报告10：CLS来源、196→197、MLP作用 | 10 | B `VitPipelineBody`额外可学习起始向量、非图块；最终CLS汇入信息后读出；MLP逐Token前馈说明；保留省略范围。 | 初始/最终CLS能区分，文字无重叠 |
| 人工11（按内容）／报告12：配对与向量进入共同空间 | 12 | D `PairedSupervision`选择图片/描述即时反馈；3→2投影、除以长度、坐标由归一化向量生成。默认正确配对可直接推进；不是打乱连线题。 | 配对反馈、两路径追踪、投影与点可读 |
| 人工13／报告13：分步训练、损失/梯度小例、非配对值 | 13 | E `ContrastiveExperiment`六态；更新用新参数但旧输出，下一态重编码；展开三态小例；`ScorePicture`所有格都有数值。 | 主流程及小例全状态；旧/新清楚；展开收起不溢出 |
| 人工14／报告14：前文预测；矩阵对应真实图文、正负配对 | 14 | F `TrainingObjectiveComparison`三态预测；行缩略图、列描述、点击格联动；训练正确前文与推理追加有短提示。 | 九格可操作；3正6负；非选择题的生成演示 |
| 人工15／报告15–16：减少重复，可合并或连续布局 | 15–16 | F `DynamicClassifierBody`与D `ZeroShotPipeline`共用`ClipCandidateComparison`；按27页偏好保留两页。 | 候选文字/向量位置是否稳定，过渡是否连贯 |
| 报告16/27：少量理由反馈与迁移检查 | 16/27 | D换候选是否重训，有理由及重试；G `RecapBody`检索/发票两任务，正确选项不同，错误可重答。 | 对错分支、重试、任务切换清空答案 |
| 人工17／报告17：同类提示、突出“不保证更好” | 17 | E `EnsembleExperiment`同类三说法；结果旁body级accent明确优于T1、不保证优于T3/每张图。 | 边界是否显眼、方向图标签不重叠 |
| 人工18／报告18：先匹配再开放回答 | 18 | G `BridgeBody`三态，分别解释输入、匹配、生成及图像依据。 | 已见内容保留，未见部分不提前显示 |
| 人工19／报告19：沿图像→编码器→Connector→LLM | 19 | G `DataflowBody`四态，逐段数据流与阶段解释。 | 箭头、向量、阶段揭示对应 |
| 人工20／报告20：逐任务展示证据、精简免责 | 20 | I `SourceTasks`六态，每任务问题→证据/回答；收件80202与寄件80301区分；四个并列最大年份由数据求出；短示例标签。 | 收件地址定位准确、图表数据完整、问题态隐藏答案 |
| 报告22：两层映射及非线性作用 | 22 | H `ConnectorExperiment`五态追踪295；解释仅线性可合并、GELU增加表达；576不变，1024→4096。 | 同一位置贯穿、五态无溢出 |
| 人工25／报告25：接口层级、前移到22之后、8→8与8→3为示意 | 23（原25） | G `ConnectorCompareBody`上游编码器、Connector分支、MLP/Q-Former；课程已前移；页尾说明位置数非固定配置。 | 分支从Connector正确指向两实现，不误指编码器 |
| 报告22–24：宽度不等于对齐、两训练阶段各学什么 | 22/25 | H说明接口宽度条件；`TrainingExperiment`阶段目标、可训练/冻结对象与描述/问答样本。 | 阶段1/2目标与冻结范围可辨 |
| 顺序调整：接口比较后回到混合上下文 | 24（原23） | H `ContextExperiment`六态，视觉+问题+已生成回答，五段追加并最终停止。 | 上下文回送、回退与末态；片段不冒充真实tokenizer |
| 人工24／报告24：预测→损失→参数更新→再预测，不泄露旧/新结果 | 25（原24） | H九态；`beat>=1/2/3/4`分层显示；初始beat=0隐藏概率损失，第三步保留旧预测提示；上一步可回初始。无独立重置按钮。 | 首轮55.0%/0.598；w约.425仍旧预测；再预测60.5%；第二阶段和回退 |
| 人工26／报告26：自然问答、两处证据、修正、可能原因和核对法 | 26 | I `VlmEvidence`六态；明确模拟非实测。新增“静态图能否证明完全防水”变式，反馈强调证据不足时保留不确定，答错可重试。 | 对话、证据裁切、颜色数量区分、正误反馈、重试、回看后清空答案 |
| 人工继续学习／报告全章：完成并下一页，末页结束 | 全章 | J `complete`保存localStorage/遥测后`navigate(sceneIndex+1)`，仅非末页导航；Page第27页文案“完成课程”。本轮仅只读共享实现。 | 首次点击前进、刷新保留进度、末页不越界；已完成页按钮禁用行为 |
| 报告“值得保留”：雨景主线、2×2投影、同内容位置、证据核对 | 1–26 | A/B/C/E/G/H/I仍保留对应示例；27改为新任务检查，不再声称末页有红伞图像布局。 | 原图资产可加载、示例关系清晰 |

## 元数据与讲稿对齐

已同步[元数据](/Users/hsy/Desktop/reduct/intuitive-deep-learning/modules/Vision-Language-Models/outlines.json)和[PPT讲稿入口](/Users/hsy/Desktop/reduct/intuitive-deep-learning/modules/Vision-Language-Models/VisionLanguagePpt.tsx)：纠正状态数、23–25页引用、13页展开小例、16页图像向量初始可见、26页六态、27页迁移任务布局。

PPT入口用`currentNoteText`替换旧讲稿中自动/循环/阶段按钮/旧页序描述，保留未变的数学说明与参考资料。[原讲稿源](/Users/hsy/Desktop/reduct/intuitive-deep-learning/modules/Vision-Language-Models/speakerNotes.ts)不在本轮文件所有权内，未编辑；模块内检索到其唯一消费者为本PPT入口，因此当前PPT使用修正后的讲稿。若主代理后续让其他入口直接消费原讲稿，需同步清理旧文本。

## 验证证据与边界

- 主回归：`runtime_logs/review-acceptance/raw/`保存27页各手动状态的文字/公式相交检查、画布边界、浏览器错误和截图路径。
- CLIP额外交互：`runtime_logs/clip-final/after/clip-final-测试报告.html`，57个截图状态，含9种图文组合、9个矩阵格、3步展开计算及答题重试。
- 手动控制：`runtime_logs/review-acceptance/raw/manual-controls.json`，19页静止、前进、回退及首末边界检查。
- 学习进度：`runtime_logs/review-acceptance/raw/navigation.json`，27页逐页推进、末页停留、重新打开保留完成状态及Guide展开滚动通过。
- 变式题：`evidence-interactions.json`与`recap-interactions.json`保存第26页证据题、第27页两种任务的正误反馈及重试结果。
- 数值核对：注意力权重约0.8044/0.1956；CLIP初始目标概率0.209021、批次损失1.565320、梯度−0.677247、参数0.300→0.469312；重新编码后损失约0.984624。VLM训练保留先更新参数、后重新预测的顺序。
- 最终编译：加载nvm环境后，`npm run typecheck`和`npm run build`通过（2026-10-15 18:18）；保留项目已有的遥测脚本打包及大chunk提示。
- 复审修正：第9页主公式块增加自身水平居中，1600×900截图复核中心对齐；第23页补充 BLIP-2 Q-Former 输出经过 FC 投影到冻结 LLM 词嵌入宽度后再作为视觉提示进入上下文，截图复核无越界或重叠，`typecheck/build`再次通过。
- 第9页第2/5“缩放点积分数”阶段移除主公式高亮项的 `\boxed` 黑框，改为红色文字高亮，避免边框与括号叠加；1600×900截图复核第2/5、第3/5和第4/5状态，`review-regression.mjs attention-cls`结果为5状态且无越界、重叠或浏览器错误。
- 本地遥测接口返回500；教学显示、交互和本地进度验证可完成，未宣称遥测上报成功。
- 验证范围为桌面1600×900和本机浏览器。学习者是否真正掌握知识需教学使用反馈，不以自动化通过替代。
