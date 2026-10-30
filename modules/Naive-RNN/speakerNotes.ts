import type { SpeakerNote } from '../shared/react/presentation/types';
export type { SpeakerNote } from '../shared/react/presentation/types';

export const naiveRnnSpeakerNotes: Record<string, SpeakerNote[]> = {
  'rnn-memory': [
    { text: '先只读固定句子“好想要256g的苹果”，注意此时右侧还没有形成代表。', selectors: ['.nrnn-memory__message-row.is-target', '.nrnn-memory__visual-panel'] },
    { text: '发送一条前文：手机相关语境会让“苹果”以手机为代表，饮食语境则以水果为代表。', selectors: ['.nrnn-memory__composer', '.nrnn-memory__visual-label'] },
    { text: 'RNN 用持续更新的状态，把过去带到当前计算。', selectors: ['.nrnn-memory__takeaway'] },
  ],
  'rnn-prediction': [
    { text: '观察前文逐字出现；读到“学”后，等待位把注意力落在下一个字符。', selectors: ['.nrnn-prediction__prompt'] },
    { text: '选择最可能的字符，同时比较模型给四个候选字符的下一步可能性。', selectors: ['.nrnn-prediction__question', '.nrnn-prediction__answer'] },
  ],
  'rnn-text-to-numbers': [
    { text: '机器看不见文字。先让学生点开字与字之间的缝，把句子切成最小的词元。', selectors: ['.nrnn-text-to-numbers__cells'] },
    { text: '如果留下“打开”这样的多字词元就送入词表，词表会提示未收录：这一页用的是字级词表。', selectors: ['.nrnn-text-to-numbers__status', '.nrnn-text-to-numbers__cells'] },
    { text: '送入词表后每个词元换成编号，句带就地变成 1 2 3 4 3 5 6 7，两次“开”都是 3。', selectors: ['.nrnn-text-to-numbers__vocabulary', '.nrnn-text-to-numbers__cells'] },
  ],
  'rnn-why-sequences': [
    { text: '文本按阅读顺序一个一个字到来：深蓝表示已经读进记忆，橙色是刚刚到达的这一个。', selectors: ['.nrnn-sequence__cards', '.nrnn-sequence__memory'] },
    { text: '切到图像：让学生在 7 与 +、+ 与 3 之间各切一刀，切好后三段从左到右进入同一个网络单元。', selectors: ['.nrnn-image-slices__track', '.nrnn-image-slices__slots'] },
    { text: '最后切到事件预测：苹果派和牛排按昨天、今天依次滑入，明天先保持未知。', selectors: ['.nrnn-sequence__event-line'] },
    { text: '三个答案只显示菜品卡片。答对汉堡后，它滑入明天的位置，形成苹果派 → 牛排 → 汉堡的事件序列。', selectors: ['.nrnn-sequence__event-choices', '.nrnn-sequence__event-line'] },
    { text: '用问题收束：如果只知道今天发生了什么，还能一直预测准确吗？由此进入只看最近状态的马尔可夫方法。', selectors: ['.nrnn-sequence__status'] },
  ],
  'rnn-markov-formula': [
    { text: '整页只有一个公式：一阶马尔可夫模型——每一步只看前一个状态，整条序列的概率就是一步步连乘。', selectors: ['.nrnn-markov-formula__formula'] },
    { text: '例子用三道菜的图标表示：今天做哪道，明天就做下一道，九种转移全部列在表里，概率只有 0 和 100%。', selectors: ['.nrnn-markov-formula__table'] },
    { text: '两道填空依次出现：先答一步转移概率，答对后原地换成连乘那一题。', selectors: ['.nrnn-markov-formula__slot'] },
    { text: '答案按数值判定，填 100% 或 1 都算对；第二题答对后，重点讲一句：概率是 1 表示这条链只有这一种走法。', selectors: ['.nrnn-inline-answer__feedback'] },
  ],
  'rnn-markov-limit': [
    { text: '要求升级：明天做什么，要看前两天的菜。规则就是上面那两个关系式。', selectors: ['.nrnn-markov__rules'] },
    { text: '两处情形：今天都是牛排，昨天一个是苹果派、一个是牛排，但明天不一样。先让学生猜只看得到今天的模型会怎么答。', selectors: ['.nrnn-markov__cases'] },
    { text: '它只能给出同一个答案，所以总有一处是错的——这就是一阶马尔可夫链的局限：只记得上一步。', selectors: ['.nrnn-markov__question'] },
    { text: '再问看得到两天的模型：它给出的是一处牛排、一处汉堡，两种情形分得开。', selectors: ['.nrnn-markov__tomorrow'] },
    { text: '结尾这句要讲透：换成二阶、三阶，也只是把遗忘往后推——固定窗口总会丢掉更早的输入，这正是下一页 RNN 的起点。', selectors: ['.nrnn-markov__status'] },
  ],
  'rnn-unfolding': [
    { text: '复杂网络已经被压缩为二维时间展开图：每一列依次是输入（天气）、隐状态（记忆里那道菜）和输出（这一步做的菜）。天气是给定的输入，一开始就全部摆好。', selectors: ['.nrnn-unfolding__diagram'] },
    { text: '每一步先定输出：晴天照做上一天那道菜，雨天换下一道（苹果派 → 牛排 → 汉堡）。学生用菜品卡片作答，答对后左侧对应卡片点亮。', selectors: ['.nrnn-unfolding__timeline', '.nrnn-unfolding__quiz-box'] },
    { text: '再把这一步的输出送进下一个时刻的隐状态：上一个的输出成了下一步的输入之一，橙色箭头就是这样一条一条连起来的——这就是 RNN 的循环。', selectors: ['.nrnn-unfolding__timeline', '.nrnn-unfolding__summary-card'] },
  ],
  'rnn-prediction-process': [
    { text: '这就是上一页矩阵运算放进 RNN 后的样子：雨天天气卡片直接与 W_weather 相乘；上一时刻的食物卡片直接与 W_food 相乘，两路进入 SUM。', selectors: ['.nrnn-prediction-process__cell'] },
    { text: '底部食物隐状态的下标会随时间变化：在 t−1 时还没有上一状态，所以显示问号；到 t 时显示 hₜ₋₁，到 t+1 时变成 hₜ。', selectors: ['.nrnn-prediction-process__memory-card'] },
    { text: '点击一次开始预测，让同一个雨天输入连续流过这个单元；时间步标签会从 t−1 自动推进到 t+3。', selectors: ['.nrnn-prediction-process__control'] },
    { text: '每一步故意放慢为三段：W₃ 里的食物卡片先沿箭头滑入下一步的食物隐状态，再经过 W_food 处理，最后向上汇入 SUM。', selectors: ['.nrnn-prediction-process__carry-path', '.nrnn-prediction-process__food-matrix', '.nrnn-prediction-process__return-path'] },
    { text: '动画停在 t+3：时间步、隐状态和输出已经变化，但天气矩阵、食物矩阵、SUM、偏置和 ReLU 的计算顺序没有变化。', selectors: ['.nrnn-prediction-process__control', '.nrnn-prediction-process__cell'] },
  ],
  'rnn-matrix-computation': [
    { text: '先把图标变成向量：三种食物是三维 one-hot 向量，晴天和雨天是二维 one-hot 向量。大括号里的每一行都是真正参与运算的数字。', selectors: ['.nrnn-matrix-computation__encoding'] },
    { text: '完整食物矩阵分成两块：上三行保留 Same，下三行把当前菜映射到循环里的 Next day。', selectors: ['.nrnn-matrix-computation__operation'] },
    { text: '第一次填空把苹果派滚到牛排，第二次填空把牛排滚到汉堡；Same 菜品卡片始终放在 Same 向量下方，答对后 Next day 卡片再出现。', selectors: ['.nrnn-matrix-computation__result-group', '.nrnn-matrix-computation__route-card'] },
    { text: '食物和天气题使用同一种双列结构；输入 0 或 1 会自动进入下一格。检查后先停留看反馈和卡片，答对后再点击“下一道题”。', selectors: ['.nrnn-matrix-computation__answer-grid', '.nrnn-matrix-computation__quiz-feedback'] },
    { text: '天气两路在作答前都只显示问号，答对后才揭示 Same / Next day 向量和对应天气卡片。', selectors: ['.nrnn-matrix-computation__operation--weather', '.nrnn-matrix-computation__route-card'] },
    { text: 'Merge 先展示 Add：两组六维结果相加，在 2 处高亮；点击后替换为 Add 结果、non-linear 门、激活结果和汉堡四段横向流程。', selectors: ['.nrnn-matrix-computation__merge-scene', '.nrnn-matrix-computation__merge-activate-row'] },
  ],
  'rnn-gradient': [
    { text: '先把最近一页的 RNN 计算图展开成两个时间步：天气卡片经过 W₁、SUM、ReLU、W₃，输出 Predicted；上一个 W₃ 的食物隐状态沿折线经过 W₂，最后进入下一行的 x₂。', selectors: ['.nrnn-gradient__unfold'] },
    { text: 'SSR 是 Sum of Squared Residuals，也就是残差平方和：每个真实值与 Predicted 的差平方后再求和。', selectors: ['.nrnn-gradient__status'] },
    { text: '红圈先指出两个 Predicted，再圈住整体分式：链式法则把一条变化路径拆成四个局部变化率。', selectors: ['.nrnn-gradient__graph-node.is-output', '.nrnn-gradient__formula'] },
    { text: 'x₁ 是进入 y₁ 之前的 SUM 结果，x₂ 同理；天气、W₁、上一时刻的食物隐状态共同决定它们。', selectors: ['.nrnn-gradient__graph-path.is-ringed'] },
    { text: '接下来逐段看分子和分母：dSSR/dPredicted、dPredicted/dy₁、dy₁/dx₁、dx₁/dW₁。', selectors: ['.nrnn-gradient__factor'] },
    { text: '收束到循环：W₂ 是每个时间步都会经过的必经路径，迭代次数增加只会让路径变长，W₂ 这个参数本身不会改变。', selectors: ['.nrnn-gradient__carry-wire', '.nrnn-gradient__status'] },
  ],
  'rnn-gradient-limits': [
    { text: '上一页公式要一路算到 x₁…xₙ。这一页把完整 RNN 简化成一条隐状态传递路径，只保留反复出现的 W₂。', selectors: ['.nrnn-gradient-limits__rnn-map'] },
    { text: '第一幕先看 W₂ = 2：点击开始循环后，时间步从 t 缓慢推进到 t+3，每个时间步都把上一步的结果乘以 2。', selectors: ['.nrnn-gradient-limits__iteration', '.nrnn-gradient-limits__map-row'] },
    { text: '继续到 50 个时间步，x₅₀ = 2⁵⁰，梯度计算会非常大，更新步长难以控制，这就是梯度爆炸。', selectors: ['.nrnn-gradient-limits__far-result'] },
    { text: '现在才进入第二幕，点击开始循环，把同一条简化路径换成 W₂ = 0.5，时间步再次缓慢推进，每个时间步都让数值缩小。', selectors: ['.nrnn-gradient-limits__iteration', '.nrnn-gradient-limits__map-row'] },
    { text: '继续到 50 个时间步，x₅₀ = 0.5⁵⁰，梯度接近于零，参数几乎无法更新，这就是梯度消失。', selectors: ['.nrnn-gradient-limits__far-result'] },
    { text: '最后收束：xₙ = W₂ⁿ × x₀。W₂ 大于 1，反复相乘会爆炸；W₂ 小于 1，反复相乘会消失。', selectors: ['.nrnn-gradient-limits__summary'] },
  ],
  'rnn-weather-rule': [
    { text: '先讲规则：前一天晴天就还做上一天那道菜；前一天雨天就换下一道，换的顺序是苹果派 → 牛排 → 汉堡。', selectors: ['.nrnn-weather-rule__rules'] },
    { text: '五天推演板：第一天给出天气和菜，之后每天只给天气，让学生按规则推出这一天做什么。', selectors: ['.nrnn-weather-rule__board'] },
    { text: '学生在下面点菜作答：点对就填进那一天的格子并高亮下一天；点错会给一句用图标说明的反馈。', selectors: ['.nrnn-weather-rule__ask'] },
    { text: '收尾点题：要说出明天做什么，得记住昨天是什么天气——只看今天这道菜不够。', selectors: ['.nrnn-weather-rule__feedback'] },
  ],
  'rnn-memory-evolution': [
    { text: '左边两个三维模型就是这一步的输入：太阳是新读进来的天气，苹果派是记忆里上一步做的那道菜。暖色脉冲依次穿过输入层、隐藏层和输出层；拖动场景时这两个模型会跟着网络一起转，可以从不同角度观察。', selectors: ['.nrnn-memory-evolution__stage'] },
    { text: '点击“沿时间复制”，同一个网络单元沿竖直时间轴出现在 t1、t2、t3；并不是三套不同参数，每一步都重新读一次输入。', selectors: ['.nrnn-memory-evolution__phase-list'] },
    { text: 'h1 → h2 → h3 的连线把上一步读到的内容交给下一步：苹果派离开左边的输入位，飞到 h 连线的旁边并顺着 h1 → h2 → h3 往下走，说明这道菜已经进入隐状态。', selectors: ['.nrnn-memory-evolution__stage'] },
    { text: '三层左边各站一个天气：前两层晴天、第三层雨天；右侧按规则推出这一层该做的菜——晴天照做上一天，所以前两层输出苹果派，第三层雨天换成下一道，输出牛排。', selectors: ['.nrnn-memory-evolution__stage'] },
    { text: '复杂网络收拢并合并成三行 x → h → o，保留输入、隐状态和输出的时间关系。', selectors: ['.nrnn-memory-evolution__stage'] },
    { text: '最后让同一组单元旋转 90 度，变成经典 RNN 的纵向 o → h → x 结构。', selectors: ['.nrnn-memory-evolution__stage'] },
  ],
};

export function notesForScene(sceneId: string): SpeakerNote[] {
  return naiveRnnSpeakerNotes[sceneId] ?? [{ text: '这一页从序列任务出发，建立朴素 RNN 的核心直觉。', selectors: ['.edu-content-block', '.edu-stage'] }];
}
