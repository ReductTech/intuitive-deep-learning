# 策略梯度入门

15 张固定 1600×900 教学页；Guide 与 SceneDeck 共用内容。
包含实际 REINFORCE 与 Q 型 Actor-Critic 训练。顺序参考用户提供的 DRL.pdf：7.4 REINFORCE → 7.5 Actor-Critic。

## 课程顺序

1. 小狐狸怎样走，才能拿到最高分？
2. 刚才你选方向，现在让模型来选。
3. 用神经网络决定行动。
4. 策略决定怎么走，目标是平均得分更高。
5. 怎样让高分路线更常出现？
6. 目标确定了，网络权重怎样改？
7. 这次选择，怎样影响权重？
8. REINFORCE 第一步：采样一局。
9. 走完以后，倒着计算回报。
10. 更新网络，让行动概率改变。
11. 反复训练，看看策略是否学好了。
12. Actor-Critic：让另一个网络评价选择。
13. Critic 怎样学会预测回报？
14. Actor：用 Critic 的评分调整行动概率。
15. 真实训练：走一步，就学一步。

重复的案例预览、损失单讲和噪声页移出主线。算法概念页之后的四页分别产出轨迹、回报、新网络和训练结果。

直观案例与公式连接各自独立分页；不通过按钮替换整页内容。

## 统一环境与模型

4×4；起点在第4行第1列，终点在第1行第4列。
普通动作（包括撞墙和撞边界）奖励 -1；进终点奖励 +10。
每局到达终点或满30步结束；超时在本教学环境中定义为终局。
gamma=1，因此所有后续奖励直接相加。

网络无偏置：W1 为 8×16，W2 为 4×8，共160个权重。
前向：h=tanh(W1 x)，z=W2 h，probs=softmax(z)。
浏览器采用解析反向传播，等价于对单局损失 -sum(Gt log pi) 做SGD。
学习率0.0003，无baseline、回报归一化或预设最优路线。
训练使用概率采样；第二页的最大概率选择仅为比较模型输出。

## 演示与训练的区别

目标页的三条路线是人工选择的教学示例，不是训练结果。
六步案例：右、右、上、上、上、右；奖励[-1,-1,-1,-1,-1,10]，
回报[5,6,7,8,9,10]。固定随机数位于所选动作的真实概率区间，
用于复现一条成功样本；不能用该样本代表无偏的训练结果。
案例与真实训练使用同一模型结构和更新函数。

真实训练从随机权重开始（默认种子123），每局从更新后的网络采样。
采样期参数固定；终局后提交一次更新。最近三条记录保存各局旧新权重、
轨迹与采样状态，回看不再次训练。单局损失不是性能指标，训练效果看平均回报。
默认种子6000局后最近100局平均分约4.71；按最大概率检查能6步得5分。
这是可复现实验结果，不保证其他初始化或随机采样每次成功。

## 文件与验证

- course.ts、outlines.json：页面顺序与讲稿。
- pages/TrainingLessons.tsx：训练页面导出入口；各页已拆到同名 TSX，公共图形与回放工具在 trainingSupport.tsx。
- neuralPolicy.ts：实际两层网络、采样、反向传播与SGD。
- mazeModel.ts：环境和旧线性演示工具；旧教学页面未在课程中注册。
- 实际训练在浏览器本地完成；未注册的旧页面和版本快照保留在源码中。

验证：npm run build；node --test modules/Policy-Gradient/mazeModel.test.mjs modules/Policy-Gradient/neuralPolicy.test.mjs

## 理论校对

- [OpenAI Spinning Up：策略优化推导](https://github.com/openai/spinningup/blob/master/docs/spinningup/rl_intro3.rst)
- [动手学强化学习：策略梯度](https://hrl.boyuai.com/chapter/2/%E7%AD%96%E7%95%A5%E6%A2%AF%E5%BA%A6%E7%AE%97%E6%B3%95/)

## 第一页场景素材

场景底图原件：本模块 `assets/forest-clearing.png`；播放器经仓库根目录的资源链接读取。使用内置 imagegen 生成；文字、迷宫、路径、宝箱图标和控制按钮由 React/SVG 实时渲染。

生成提示词：Create a premium illustrated game environment background for an interactive educational slide, landscape 16:9, warm tactile handcrafted miniature woodland board game aesthetic, sophisticated editorial storybook 3D illustration. Bird's-eye view nearly orthographic. Sunlit cream parchment clearing fills the central 85 percent of the image, extremely calm pale beige open area with subtle paper grain and a few delicate grass tufts. Only the outermost edges have attractive miniature sage green trees, fern leaves, smooth river stones, tiny ivory daisies and warm ochre dirt, soft realistic shadows, a narrow tan wooden frame around the clearing. Top edge also pale and quiet. Bottom corners can have richer forest foliage. No animals, no characters, no grid, no maze, no obstacles in the central area, no paths, no text, no letters, no buttons, no UI, no borders inside. This is a background behind an actual interactive 4x4 maze on the left and actual directional controls on the right, so left center and right center must be blank and light. Colors: warm ivory, muted sage, honey wood, navy accents absent. Gentle afternoon light, polished and beautiful, visual richness confined to perimeter, clean uncluttered composition.


## Actor-Critic 实现与边界

actorCritic.ts 按 DRL.pdf §7.5 的Q型方法实现，非A2C：
- 两个独立16→8→4无偏置tanh网络；Actor softmax，Critic线性输出q。
- 每步按当前Actor采样并执行，再按同一旧Actor独立预抽下一动作（不执行）。
- y = r + q_old(next, preview)，gamma=1；终点与30步超时均取nextQ=0。
- Critic最小化0.5(q-y)^2，固定y，学习率0.02。
- Actor最小化-q_old log pi，固定旧q，学习率0.001。两个更新均从旧快照计算；Actor不使用TD误差。
- 不加baseline、目标网络、熵奖励或经验回放。未宣称学习到的q给出无偏策略梯度，也不宣称AC一定更快。
- 位置编码不包含剩余步数；有限时域的真实价值依赖时间，这个小网络只按位置近似。超时终局是本教学环境的定义。
- 初始随机种子123/42/7，各训练5000局的最近100局均分4.94/4.90/4.88；满分5。这是可复现测试结果，不是收敛保证。
- 第13页读取实际第1000局快照，回看不重新训练；第15页独立从随机网络开始，展示实际数据。

验证：node --test modules/Policy-Gradient/actorCritic.test.mjs


## Theory page versions

课程在第15页Actor-Critic真实训练结束；版本对照页已从Guide与SceneDeck移除。训练前铺垫收为两页：第6页GradientAscentLesson说明优化方向，第7页LearningSignal说明回报加权与单局梯度估计；第8页直接进入REINFORCE采样。

## 参数更新页精简

第10页UpdateOverview只保留权重更新总式、三阶段概率与训练表现。单权重详细版不再注册为课程页面。
第10页继续训练沿用同一个单局更新后的网络，随机种子223，额外训练10000局，学习率0.0003，不放大单次更新。
均分排除第一条固定教学轨迹；测试使用贪心动作，训练使用随机采样。


## 2026-10-15 整理与规范复核

### 目录与资源

- `assets/`：本课程图片原件和全部缩略图，包含旧版本素材。
- `pages/`：当前课程页面；训练目标、概率实验、模型、采样、回报与真实训练已分别拆成独立文件。
- `components/`：本课专用迷宫、公式及文字组合；基础组件继续引用 Shared。
- `versions/`：保留原有对照版本，以及本次清理前的页面和样式快照，不在课程中注册。
- `docs/review/current/`：当前15页截图与画布边界检查记录。
- `docs/review/references/`：实际查看过的成品课件参考截图。
- `scripts/link-assets.mjs`：为本模块创建或核对公共资源入口。

按本次用户要求，素材原件集中在模块内。仓库 `assets/policy-gradient` 是指向本模块 `assets` 的相对目录链接，没有第二份待维护原件。Vite 构建会沿链接将素材复制到 dist；场景图、狐狸和缩略图仍使用 Shared `moduleAssetUrl`。初次检出时可从仓库根目录运行 `node modules/Policy-Gradient/scripts/link-assets.mjs`。这一存储位置是用户明确要求对 creator-skill 根目录资源规则的例外。

### 已处理的规范问题

- 清理227处重复覆盖或手动文字字号、字重、行高声明。
- 将迷宫标签与问号改为 Shared Typography，在图形坐标中随迷宫缩放。
- 移除328条仅对应已停用界面的样式规则；清理前快照保留在 versions。
- 通用教学面板的背景、边线和强调色改用 Shared Theme Token。
- 场景背景经组件的 CSS 自定义属性传入。
- 活跃代码不依赖 modules-legacy 或其他课程实现；播放器继续复用 Shared SceneDeck。
- Guide与PPT共用course和相同页面组件；固定1600×900，只由外层等比缩放。

### 尚未完成的规范项

`outlines.json` 缺少签名模块身份。官方验证工具确认其他7个模块身份有效，本模块缺失。官方签发工具无法运行到签发阶段，因为当前环境没有 `.private/module-identity-ed25519.pem`。没有生成替代私钥，没有伪造UUID或签名。需恢复原签发私钥后，再使用仓库工具补齐身份，并同步资源入口和 assetId 至签名UUID。

### 从成品课件借鉴的设计

| 实际参考 | 借鉴点 | 在本课的适用位置 |
| --- | --- | --- |
| Neuron-Guide / ReluIntroPage | 控件贴近观察对象；单次操作只显化一个因果关系；简短反馈紧跟结果 | 策略概率与路径联动、采样区间命中反馈 |
| Convolution-Kernel-Intro / WeightSharingPage | 对比双方保持相同空间结构，差异由图形对象和对应数量表达 | Actor概率与Critic估计并排对应同一方向；价值/策略切换保持迷宫位置重置规则 |
| Visual-Feature-Learning / ConvolutionBackpropPage | 输入、参数、输出、目标持续可见；计算过程突出当前连接；公式与数值一一对应 | Critic固定预测与目标，分阶段校准；Actor沿用同一经验和旧评分 |

第3页已加入输出连线、分数、概率的联动追踪；第13页用真实比例的数轴展示预测靠近固定目标。后续如增加反向传播动效，仍围绕同一条经验保持输入、评分与更新对象的对应。

当前课程保留15页。训练计算未因整理而改变；现有15项测试通过，构建通过，全部默认页的slide和main边界检查通过，场景素材加载正常。


## 局部教学与交互完善

- 第3页：方向可点击或键盘聚焦，联动对应输出连接与分数；追踪只改变视觉标记，概率始终来自当前输入的真实前向计算。
- 第7页：给出G1=10-4=6的具体来源，并说明路线概率由逐步动作概率相乘得到。
- 第10页：尚未执行的阶段显示明确等待状态，不展示可被误认为训练结果的概率条。
- 第13页：实际旧预测4.688、新预测4.696、固定目标4.734在同一数轴中对应显示；误差与权重更新公式保持可见。
- 第14页：概率对照明确针对出发位置，提示单步变化很小；完成后才允许重播。
