# 回归与损失：模型怎样变准

21-page course available in Guide and PPT. Page 18, “从概率到线性分数”, uses three panels to explain probability, odds and log-odds before stating the linear model assumption. Page 19 derives Sigmoid and retains its draggable curve and optional classification view. “最小二乘的几何意义” has moved from page 16 to page 20, directly after the probability prediction page; its content and styling are unchanged. Existing signed module identity is preserved.

- Guide: `/modules/regression-loss`
- PPT: `/scenedeck/?deck=regression-loss&slide=01`
- Isolated 1600×900 verification canvas: append `&scenedeckCapture=1`.

The opening retells Cao Chong’s story in two selectable sentences. One click on 点击称重 starts elephant boarding → recording 44 cm → a short hold → automatic departure, taking 3.9 seconds altogether. The control stays disabled while weighing and then becomes 点击投石. Each known 250 kg stone falls, the boat settles, and one observation appears. At 1500 kg the stones run out while the waterline remains below the elephant mark; enlarged prompts show 石头用完了 and the estimation question. Page 01 does not reveal the elephant’s weight. Reset cancels pending animation timers. Page 02 begins with the known 44 cm mark and the same six records, then estimates weight along the trend. The shortage is a teaching modification of the story, identified on the page as 故事改编.

This opening is explicitly exempt from ContentBlock by the user. It fills the entire 1600×900 canvas with the supplied 1280×720, 24 fps, five-second looping video. The custom calligraphic title and story overlay the scenery. Regular course pages continue to follow Shared ContentBlock conventions.

The boat and four alternating stone variants are transparent generated assets. Rear boat, cargo, front hull and foreground water are separate layers. A foreground canvas samples the same video via requestVideoFrameCallback, using identical world coordinates; there is only one playback clock. The fixed foreground water edge masks the sinking hull. The target mark moves with the hull. Reduced-motion preferences pause the background video. A first-frame poster provides a loading fallback.

The floating notebook uses Shared ECharts and displays shared calibration observations with small measurement offsets, plus the known 44 cm horizontal reference, without a fitted line. Its central area is devoted to a large chart, with 28 px axis titles and 22 px tick labels. Duplicate numeric readings and operating instructions are removed; the shortage and estimation question appear over the water beside the stone control. Shared Typography and Button provide semantic text and controls. The video's original bytes are copied into the signed module asset directory without transcoding.

Images are teaching illustrations from the built-in ImageGen tool. Prompts and simulation provenance are in `asset-sources.json`. Asset files live under the signed UUID in repository-root `assets/`. No Shared files are modified.

## 21 页教学大纲

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
第02—07页统一通过useRecordedData订阅第01页的实际投石记录，浏览器本地保存。重启称象时清空历史记录；无记录时提示先完成实验。残差按同一示范模型计算，MAE/MSE及样本数实时计算，统一显示一位小数。第05页零和演示通过调整预测截距完成，保持观测数据不变。之前的固定六点/十残差算例说明已由本条更新替代。

投石记录采用加速测量：画面保持五块快速连续落船与原有船体波动；各记录的深度独立模拟单块加入后0.8秒的衰减振动，以对应其累计重量。记录生成后保存，后续页面复用。

单块测量模拟更新：采样时刻每块独立随机取0.5—1.0秒，频率独立随机取8—10弧度/秒，瞬态幅度3.8—4.6厘米。取消按石头编号递增的测量频率，观测按累计重量排序保存，整组测量完成后解锁投放。可见船体动画保持原有参数。

前三次单块投放的观测改为延迟到下一次投石点击：先读取当前船体实际下沉深度，再启动下一次投放。等待越久，瞬态衰减越充分。第三块在首次点击五块连投时记录。五块连投的独立随机模拟采样逻辑保持不变。

## 第17—21页的教学顺序

依次引入二分类标签与正类概率、线性拟合0/1标签的局限、概率映射的要求、固定倍数假设与对数几率线性模型、概率预测及阈值判定。第17页不提前展示Sigmoid；第18页不提供阈值滑杆；第19页只保留有界、单调、平滑三个性质；第20页完整显示推导并以同一概率联动所有读数；第21页以一张曲线连接概率预测和类别判定。标题与正文使用正式书面表述。

第17页改为泰坦尼克号乘客场景，对照票价回归和存活分类。展示公开Titanic数据PassengerId 1、2的已知记录，票价仅在显示时舍入。场景插图为生成的教学插图。第18页仍为构造样本，横轴标为标准化票价（教学示例）；后续以存活为1类，未存活为0类。资料与生成来源见asset-sources.json。

第17页当前版本：完整891条Titanic训练记录支持纵向滚动，保留全部12个原始字段及缺失值。示例0.92（92%）用于说明概率语义，不对应实际训练结果。泰坦尼克号插图淡化后覆盖页面背景，取消票价回归对照卡。

当前第18页“线性回归用于分类的局限”已删除。Guide、PPT与大纲同步移除，原第19—22页依次前移为第18—21页，课程现为21页。第17页后直接进入“从线性分数到类别概率”。
