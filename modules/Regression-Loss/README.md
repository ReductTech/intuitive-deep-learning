# 回归与损失：模型怎样变准

18-page course available in Guide and PPT. The Titanic and logistic regression pages (former 16–20) have moved to the independent Multilayer-Perceptron module. The former final pages 21 and 22 remain here as pages 16 and 17, with their contents unchanged. Existing signed module identity is preserved.

- Guide: `/modules/regression-loss`
- PPT: `/scenedeck/?deck=regression-loss&slide=01`
- Isolated 1600×900 verification canvas: append `&scenedeckCapture=1`.

The opening retells Cao Chong’s story in two selectable sentences. One click on 点击称重 starts elephant boarding → recording 44 cm → a short hold → automatic departure, taking 3.9 seconds altogether. The control stays disabled while weighing and then becomes 点击投石. Each known 250 kg stone falls, the boat settles, and one observation appears. At 1500 kg the stones run out while the waterline remains below the elephant mark; enlarged prompts show 石头用完了 and the estimation question. Page 01 does not reveal the elephant’s weight. Reset cancels pending animation timers. Page 02 begins with the known 44 cm mark and the same six records, then estimates weight along the trend. The shortage is a teaching modification of the story, identified on the page as 故事改编.

This opening is explicitly exempt from ContentBlock by the user. It fills the entire 1600×900 canvas with the supplied 1280×720, 24 fps, five-second looping video. The custom calligraphic title and story overlay the scenery. Regular course pages continue to follow Shared ContentBlock conventions.

The boat and four alternating stone variants are transparent generated assets. Rear boat, cargo, front hull and foreground water are separate layers. A foreground canvas samples the same video via requestVideoFrameCallback, using identical world coordinates; there is only one playback clock. The fixed foreground water edge masks the sinking hull. The target mark moves with the hull. Reduced-motion preferences pause the background video. A first-frame poster provides a loading fallback.

The floating notebook uses Shared ECharts and displays shared calibration observations with small measurement offsets, plus the known 44 cm horizontal reference, without a fitted line. Its central area is devoted to a large chart, with 28 px axis titles and 22 px tick labels. Duplicate numeric readings and operating instructions are removed; the shortage and estimation question appear over the water beside the stone control. Shared Typography and Button provide semantic text and controls. The video's original bytes are copied into the signed module asset directory without transcoding.

Images are teaching illustrations from the built-in ImageGen tool. Prompts and simulation provenance are in `asset-sources.json`. Asset files live under the stable UUID in repository-root `assets/`. No Shared files are modified.

## 教学大纲与历史制作记录

`outlines.json` 按本次调整后的五部分组织，每页包含教学目标、核心内容、交互、衔接与讲解稿。

| 部分 | 页码 |
| --- | --- |
| 建立线性模型 | 01—04 |
| 如何评价模型 | 05—09 |
| 不同损失的取舍 | 10—13 |
| 如何寻找最优参数 | 14—19 |
| 拟合、预测与神经网络 | 20—22 |

教学约定：x 是载重（kg），y 是测得下沉深度（cm），残差统一为 e=y−ŷ。称象估重采用预测深度模型的逆向读图，不另行混换 x、y。MAE 与 MSE 单位不同，比较各自对误差的贡献和模型排名。异常点实验切换损失时重新拟合；固定 b 的损失曲线最低点只代表该切片最优。Huber 的阈值与残差单位相同；最小二乘解析解要求输入不全相同。

当前第 01—03 页已实现，第三页已重新制作；第四页保留为待制作规划。

## 第二页：估计象重

全页使用淡化的称象背景，左侧为六条观测和学生选择的直线，右侧仅保留正式引导与估重读数。固定原点，用指针位置相对原点的方向确定斜率，端点自动落在上边缘或右边缘，支持跨角点连续拖动和方向键操作。斜率范围 0.008—0.04 cm/kg；根据当前直线计算 44 cm 对应载重，不自动拟合或评判正确性。超出横轴范围时提示交点在图示范围之外。

局部放大图显示 1250 kg 附近同一条 19.6 cm 观测及当前直线，轴标保留真实数值，不修改观测、不人为扩大残差。主图始终保留全部六点与 44 cm 参考。删除底部重复说明和重置按钮，将可靠性问题放在右上方。

## 船体与线性假设

第 01—02 页改用 boat-rectangular.png：直壁、平底、恒定水平截面积的长方体船体。固定水的密度、其他载荷与船体姿态，且水面仍在竖直侧壁范围内，新增排水体积 ΔV=AΔh，新增载重 m=ρAΔh，因此下沉深度随新增载重线性增加。本模拟 A=6.25 m²、ρ=1000 kg/m³，得到 0.016 cm/kg。船体是教学简化，并非历史船形复原。

故事依据：《三国志·魏书·武文世王公传》的水痕与称物法，核对节选 https://m.gushiwen.cn/shiwenv_31b814913b16.aspx 。正文是概述；六块石头不足与具体读数为教学改编。

标题区原本 pointer-events:none 阻断鼠标选字，现改为 pointer-events:auto 与 user-select:text；实际浏览器验证可选中故事文字。

## 第三页：线性回归模型（双滑杆版）

已替换此前的第三页。左侧显示六条原始观测和可调预测线；右侧保留预测公式、变量含义，以及 Shared RangeControl 提供的斜率、截距滑杆。取消载重选择按钮，固定 1250 kg 作为预测示例。参数调整同步改变预测线和固定输入的预测深度，观测值保持不变。固定坐标轴覆盖参数组合：w=0.008—0.024 cm/kg、b=0—6 cm、x≤1750 kg，预测上限为 48 cm。标题下用正式表述保留对参数线性及条件均值的概念；不将截距解释为船重，不提供两个静态参数小图。

## 第四页：预测误差

按用户新参考制作，替代原第四页参数规划。固定原始 1250 kg、19.6 cm 观测，以候选模型 w=0.010/0.020、b=2 显示低估、高估，预测为 14.5/27.0 cm、残差为 +5.1/−7.4 cm。同一数据集，竖直残差箭头不夸大尺度。无样本选择滑杆。

第四页样式按新参考统一：蓝色公式卡、暖色样本卡、橙色观测与青色预测、竖直差的误差徽标、方向小示意图和底部提示条；保持全部数据及坐标精确。

## 第五页：误差不能直接相加

使用参考图给出的十个教学残差，精确总和为 0.5 cm，不将其写成精确零。预测模型为 0.012x+8，输入为 150—1500 kg 的十个等间隔教学样本，观测由预测加残差得到。零和切换仅将第十个残差由 −4.9 改为 −5.4，明确这是构造的反例。散点残差、正负柱与总和同步更新。

### 第 06 页：平均绝对误差（MAE）
左侧绝对值函数与残差滑杆；右侧沿用第05页原始十个教学残差，展示取绝对值后的柱状图。绝对误差总和32.7厘米，MAE为3.27厘米。步骤放在顶部，统一Shared标题。

### 第07页：均方误差（MSE）
沿用第06页双面板与Plotly交互，平方函数支持平移、缩放和残差点拖动。十个残差的平方和125.85，均方误差12.585平方厘米。

### 贯穿案例的数据源
后续页面统一通过useRecordedData读取共享数据。有第01页的实际投石记录时优先使用，浏览器本地保存；无记录时自动生成一组13条随机示范样本，累计石重为1500千克，深度遵循称象模拟的线性关系并加入随机测量偏差。同一次加载中各页面沿用同一组示范数据，不要求先完成实验，也不将示范数据保存为实际记录。重启称象时清空历史记录并恢复示范数据，新的实际记录产生后自动替换。残差按同一示范模型计算，MAE/MSE及样本数实时计算，统一显示一位小数。第05页零和演示通过调整预测截距完成，保持观测数据不变。之前的固定六点/十残差算例说明已由本条更新替代。

投石记录采用加速测量：画面保持五块快速连续落船与原有船体波动；各记录的深度独立模拟单块加入后0.8秒的衰减振动，以对应其累计重量。记录生成后保存，后续页面复用。

单块测量模拟更新：采样时刻每块独立随机取0.5—1.0秒，频率独立随机取8—10弧度/秒，瞬态幅度3.8—4.6厘米。取消按石头编号递增的测量频率，观测按累计重量排序保存，整组测量完成后解锁投放。可见船体动画保持原有参数。

前三次单块投放的观测改为延迟到下一次投石点击：先读取当前船体实际下沉深度，再启动下一次投放。等待越久，瞬态衰减越充分。第三块在首次点击五块连投时记录。五块连投的独立随机模拟采样逻辑保持不变。


## 模块拆分（2026-10-12）

当前共17页：前15页保留，最后两页为“最小二乘的几何意义”和“离开最优解，损失怎样变化？”。泰坦尼克号与逻辑回归5页已迁到Multilayer-Perceptron，连同其数据、图片和资源来源。新课程：`/modules/multilayer-perceptron`。

## 术库 智能讲稿

前5页的23段讲稿保存在`speakerNotes.ts`，每段包含正文和对应页面区域的CSS选择器。`RegressionLossPpt.tsx`通过`getNotes`接入共享课程播放器，同时导出`getPptNotes`供统一课件路由调用，与Neuron Guide的接入方式一致。

点击术库工具栏的“智能讲稿”（快捷键N），可逐段切换并聚焦对应区域；朗读复用浏览器语音能力。第6页起暂未添加分段讲稿。

## 第16页：概率视角下的最小二乘

左右图均使用UI Kit提供的Shared PlotlyChart，采用共享坐标图的轴线、网格与配色；右侧支持平移、滚轮缩放和双击复位。选点高亮与候选直线端点拖动继续保留。

采用参考图的两栏结构：左侧单点残差与密度贡献，右侧全部残差及单点贡献/总似然曲线。截距固定为当前数据的最小二乘截距，σ固定为2厘米，下图是斜率参数的一维截面；单点贡献和总似然各按自身峰值归一化。拖动端点仅移动当前位置，曲线与轴范围保持固定。更换示范点不改变联合似然；回到最大似然时相对总似然为1。总似然使用所有观测，不相加单点贡献。已验证13条记录、默认和拖动状态的画布边界与解析数值。

第16页优化：删除右侧重复散点图及橙色高亮曲线。观测点提供直接点击和键盘选择入口；选中点与右侧深色虚线贡献曲线联动，其他贡献淡化。总似然曲线保持蓝色粗线，选择观测不会改变总似然。已逐一验证13个观测点的映射。

## 第17页：解析求解的全局最优保证

无约束可微凸问题：给出凸函数连线定义、一阶下界，以及梯度为零时目标值全局不更低的推论。保留碗状曲面、局部与全局关系和严格凸唯一性；明确凸性不保证解析解存在。线性回归MSE为凸二次目标，可解正规方程。

## 第18页：非凸问题中的驻点

函数采样生成可旋转、缩放的真实三维非凸曲面，替换原地形图片。点击标记或分类按钮选择全局极小、局部极小和鞍点；“换一组曲面”随机选择12组预计算函数之一，不涉及梯度下降。右侧保留g(u,v)=u²−v²示意。

17、18页共享模块内的三维正交投影绘制器，包含深度排序、曲面网格、底面等高线及复位视角。17页使用归一化参数坐标下的凸性示意，不是实验数据的数值MSE图。

非凸数据位于`pages/LossLandscape/landscapes.json`。运行`python modules/Regression-Loss/pages/LossLandscape/generate_catalog.py`可重建并校验：完整求解四次函数的两个三次驻点方程，用Hessian特征值分类，再比较所有极小值。函数具有强制性，因此最低的极小值是整个参数空间中的全局最优；每组含1个全局极小、3个其他局部极小、4个鞍点及1个极大点。曲面展示前8个点，数值细节不显示在教学页上。


## 第7页视觉精修（2026-10-27）

按确认的示意图重排“调整直线，估计象重”：左侧大图展示观测、预测和竖直误差线，右侧依次显示拟合损失、实时估重和挑战反馈。背景以白色为主，仅保留底部淡景；补充图例与外推提示。MAE、MSE、估重继续随端点拖动或方向键调整实时计算，保留揭晓与重新挑战；第二页保留原有布局。图表与拖动手柄共用局部坐标容器，避免新增标题和图例影响拖动映射。


## 第8页自动搜索视觉精修（2026-10-27）

按确认的设计示意图，将自动找线拆为顶部三步流程、左侧观测与候选图、右侧候选/最佳对比及四行最近尝试、底部独立搜索控制。候选与最佳直线采用蓝色虚线/青色实线并标注编号；MSE、最佳候选和进度仍由共享观测实时计算。搜索开始、暂停、继续、完成及重新开始均保留；空状态预留四行高度，表格与按钮不再共用拥挤区域。样式以rl-auto前缀限制在第8页，第9页保留原有布局。


## 第9页：参数空间的遍历搜索（2026-10-28）

以可切换的一维、二维、三维参数点阵替换原有精度表和MSE曲线，集中解释组合数增长。每维5个值，共5/25/125个候选，固定每0.4秒评估一组；按w₁优先、再w₂、再w₃的顺序遍历。点初始灰色，评估后按固定示意损失变蓝或变红，当前点用外圈标记。示意损失为各参数到中心3的归一化平方距离的平均值，≤0.4为蓝色，其他为红色，并非数据分类。三维用斜投影分层展示125个互不重合的候选。支持开始、暂停、继续、完成和重新开始，切换维度时清空进度；示意目标与投石记录独立。


### 第9页交互与速度更新

所有维度支持拖动旋转、Shift/鼠标中键拖动平移、滚轮或按钮缩放、双击/按钮复位视角；键盘方向键旋转，+/-缩放，Home复位。三维使用真实坐标旋转和按深度排序的投影。一、二维用候选格连续热力色填充，三维候选点按相同连续色阶呈现损失，未评估点仍为灰色。移除二值好坏阈值，使用蓝—浅蓝—浅黄—橙—红连续损失色阶。搜索改为requestAnimationFrame按已用时间推进，每组10毫秒，5/25/125组的目标时长分别为0.05/0.25/1.25秒；暂停后按剩余组数继续。按用户要求，本轮未运行检查或浏览器验证。


### 第9页布局收拢

移除工作区下方的组合数横栏、5ᵈ公式和重复结论，主图工作区扩展至可用高度。右侧只保留搜索进度、并排操作按钮、一维5/二维25/三维125三行组合数及“多一个参数，搜索量就乘以5”的一句结论。主图内部底部以两行工具栏组织交互提示、缩放复位和连续热力色阶，清理三维点阵中重叠的层标签。保留一二维拖动平移、三维拖动旋转、连续热力着色和快速搜索。按用户此前要求未运行浏览器检查。


## 第10页线性回归模型视觉精修（2026-10-28）

按确认示意图重排为左侧观测/预测图表、右侧统一模型控制面板，移除山水背景。图表底部集中显示同一输入对应的观测与预测，替代散点周围的大号标签；输入和读数仍来自共享实验数据，不使用示意图中的固定600千克样本。右侧合并公式、变量简释及斜率/截距滑杆，保留原参数范围、实时联动和固定坐标轴。使用共享ContentBlock、MathFormula及RangeControl，样式仅作用于本页。按用户要求未运行检查。


## 第11页最小二乘视觉精修（2026-10-28）

按确认的精简示意图，左侧展示共享观测、最小二乘拟合线及每条竖直误差，选取中部样本突出观测与预测的距离。右侧只保留一个平方误差和最小化目标、一行线性模型定义和平方/求和两句说明，移除固定观测集合、argmin重复公式、分步编号和色块。按用户要求不添加“接下来……”等底部过渡文案。拟合及样本提示继续从共享记录实时计算；本轮未运行检查。


## 第4页误差抵消视觉精修（2026-10-28）

左侧保留所有竖直残差，仅标注最大正误差与最大负误差；右侧保留正负柱状图并以“正误差总量＋负误差总量→相加结果”直观展示抵消，移除大面积暖色色块和重复求和公式。预测、残差及两组总量全部由共享数据计算，各残差以0.1厘米计量，并用整数十分位求和避免浮点累加造成假符号。示意图的固定数字未写入页面。底部以一行说明强调总和接近零不代表每次预测准确。本轮按用户要求未运行检查。


## 第5页MAE合并图与阶段动画（2026-10-28）

沿用原模板的标题、浅蓝步骤卡和底部提示条；将原始/MAE开关移入左侧图头，三步骤移至右侧纵向可点击卡片。单一坐标系以原始残差e为横轴，柱顶与当前函数曲线一致：阶段1先显示y=e直线，再长出有向残差柱；阶段2连续过渡到y=|e|并将负柱翻到上方；阶段3显示由全部真实残差计算的MAE水平线及均值公式。每次阶段过渡1.1秒，可点击当前卡片重播。默认每5秒自动切换阶段，手动切换/点击步骤/拖动函数点后暂停自动演示，可显式重新开启。所有柱子及汇总沿用共享观测和示范模型；拖动示例点仅解释函数，不改变观测或MAE。柱子悬浮提示使用共享Typography，支持键盘选样本和左右键调整示例点。新增样式限定在MAE合并页，MSE页面保留原样；本轮按用户要求未运行检查。


### MAE左右顺序与Typography统一

步骤卡片与汇总移至左侧，合并函数图移至右侧，并同步调整DOM阅读顺序和操作提示。SVG坐标刻度、轴名、均值标签均使用Typography as=text；播放符号使用Typography，移除合并页自行指定的固定文字字号及Typography变量覆盖，数学字号改为共享公式/标题token。悬浮提示、示例读数与说明沿用共享Typography。


## 删除概率视角页（2026-10-28）

按用户要求移除原第16页“概率视角下的最小二乘”，同步移除演示、连续阅读入口、大纲条目与页面源码。原17、18页顺延为16、17页，总页数更新为17页。


## 损失选择实验页（2026-10-29）

在矩阵最小二乘页后插入新第16页，原16、17页顺延为17、18页。沿用ContentBlock、Typography、Button和图标库，不加入设计方案标注。拖动独立观测副本中的一个点，分别按平方误差和绝对误差目标重新拟合两条直线；最小二乘使用中心化输入计算，绝对误差拟合枚举观测对确定的斜率并以中位数求条件最优截距。原始称象数据不受影响，复原按钮恢复该点的原始深度。连续阅读与演示入口、大纲同步更新。按用户此前要求未运行测试或浏览器检查。


## 损失选择页前移（2026-10-29）

将原第16页移至MAE、MSE之后，作为新第7页，标题改为“损失函数，体现任务的取舍”。采用上方全宽拖动实验、下方MAE/MSE两列任务说明的布局。原第7—15页顺延一页，第17—18页不变；连续阅读、课件目录、大纲和页内编号引用同步调整。
