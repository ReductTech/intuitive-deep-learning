import type { SpeakerNote } from '../shared/react/presentation/types';

/** Presenter narration lives beside the deck; teaching pages do not depend on it. */
export const regressionSpeakerNotes: Record<string, SpeakerNote[]> = {
  '01': [
    { text: '曹冲称象的关键，是把难以直接称量的大象，换成可以逐块称量的石头。只要前后达到同一水位，就可以比较它们的总重量。我们先用一个模拟实验观察这个过程。', selectors: ['.rl-cao-hero'] },
    { text: '点击称重，让大象上船。船会下沉并逐渐稳定，我们记下大象留下的水位刻痕。这里要记录的是下沉深度，还没有得到大象的重量。', selectors: ['.rl-cao-stone-control'] },
    { text: '大象下船后，再把石头放上船。注意船会晃动，观测深度也会有波动。每次加入石头，都要记录累计石重和对应的下沉深度，而不是只看这一块石头有多重。', selectors: ['.rl-cao-scene'] },
    { text: '看右侧投石手记。每个点对应一条观测：横轴是累计石重，纵轴是观测下沉深度。随着石头增加，点会逐渐向右上方延伸，这些记录将贯穿后面的课程。', selectors: ['.rl-cao-notebook'] },
    { text: '如果石头能把船压到大象的刻痕，直接把石重相加就够了。但是这里准备的石头总共只有一千五百千克，用完仍然没有达到刻痕。原来的称量办法遇到了一个限制。', selectors: ['.rl-cao-stone-control'] },
    { text: '我们已经知道一部分载重和下沉深度的对应关系。即使没有足够的石头，能不能利用这些记录，推测大象的重量？接下来把实验记录画成图。', selectors: ['.rl-cao-notebook'] },
  ],
  '02': [
    { text: '左边的散点来自刚才的投石记录。我们已经测到的载重范围有限，而大象留下的水位更高。现在需要根据已知范围内的关系，估计尚未测到的重量。', selectors: ['.rl-estimate-plot', '.edu-content-block'] },
    { text: '试着拖动直线端点，让直线贴近散点的整体趋势。这里先使用通过原点的直线：载重增加时，预测下沉深度也随之增加。不同的倾斜程度，会给出不同的估计。', selectors: ['.rl-estimate-handle', '.edu-content-block'] },
    { text: '沿着大象水位的水平线找到它与直线的交点，再读出对应的重量。右边会同步显示估计结果。实线对应已有观测的范围，虚线延伸到尚未观测的位置，这一步叫外推。', selectors: ['.rl-estimate-estimation', '.edu-content-block'] },
    { text: '但大象的真实重量还不知道，不能只凭一个估计数值就判断它是否可靠。我们可以先问一个更容易检验的问题：这条直线对已有石重记录的预测，和实际观测相差多少？', selectors: ['.rl-estimate-question', '.edu-content-block'] },
  ],
  '03': [
    { text: '先固定同一条载重记录。图上的观测点来自实验，直线上的预测点来自模型。比较它们时，输入载重相同，所以要看竖直方向的差距，而不是点到直线的最短距离。', selectors: ['.rl-error-plot', '.edu-content-block'] },
    { text: '用观测值减去预测值，得到这里的误差。右边列出了当前观测、预测和计算结果。差距的大小告诉我们偏离了多少，单位仍然是厘米。', selectors: ['.rl-error-sample', '.edu-content-block'] },
    { text: '切换高估或低估示例，观察误差的正负号。观测大于预测时，误差为正，说明预测偏小；观测小于预测时，误差为负，说明预测偏大。换的是模型，实验观测并没有改变。', selectors: ['.rl-error-direction', '.edu-content-block'] },
    { text: '严格来说，观测值减去模型预测值叫残差，它和相对于未知真实规律的统计误差不同。本页先用误差帮助建立直觉。接下来，要把多条残差汇总起来，评价整条直线。', selectors: ['.rl-error-takeaway', '.edu-content-block'] },
  ],
  '04': [
    { text: '一条直线需要同时解释多条观测。左边每条竖直虚线都是一条残差：有的观测在预测线上方，有的在下方。这些差距都应该进入整体评价。', selectors: ['.rl-cancel-observations', '.edu-content-block'] },
    { text: '右边把残差画成柱状图。零线上方是正残差，说明预测偏小；零线下方是负残差，说明预测偏大。柱子的长度表示偏差大小，方向表示偏差方向。', selectors: ['.rl-cancel-summary .rl-cancel-chart', '.edu-content-block'] },
    { text: '如果直接相加，正负残差就会相互抵消。看下面的求和结果，再回看图中那些仍然存在的差距：总和接近零，甚至等于零，都不能说明每条预测准确。', selectors: ['.rl-cancel-total', '.edu-content-block'] },
    { text: '因此，评价整体预测时，不能只用残差的有符号总和。我们需要保留偏差的大小，同时避免正负抵消。下一页先尝试一个直观办法：对每条残差取绝对值。', selectors: ['.rl-cancel-takeaway', '.edu-content-block'] },
  ],
  '05': [
    { text: '平均绝对误差，简称 MAE，分三步计算：先用观测减预测得到残差，再对每条残差取绝对值，最后求平均。它回答的是：模型预测平均偏离观测多少。', selectors: ['.rl-mae-steps', '.edu-content-block'] },
    { text: '看左边的绝对值函数。拖动点经过零点，观察正负残差如何变成非负的偏差大小。相同大小的高估和低估，得到相同的代价；零残差对应零代价。', selectors: ['.rl-mae-function', '.edu-content-block'] },
    { text: '右侧使用本次实验记录和一条示例直线。切换原始残差与 MAE，观察原本在零线下方的柱子翻到上方。取绝对值以后，各条偏差都不会再与其他偏差相互抵消。', selectors: ['.rl-loss-mode-switch', '.edu-content-block'] },
    { text: '将这些绝对误差相加，再除以观测条数，就得到平均绝对误差。结果取决于当前实验数据和所用模型，不需要记住具体小数；重点是每条观测都贡献了自己的偏差大小。', selectors: ['.rl-mae-result', '.edu-content-block'] },
    { text: 'MAE 的单位与观测值相同，这里仍然是厘米。它不区分高估和低估，只衡量平均偏差大小。还有一种常用办法，是把残差平方后求平均，这就是下一页的均方误差。', selectors: ['.rl-mae-takeaway', '.edu-content-block'] },
  ],
};

export function notesForScene(sceneId: string): SpeakerNote[] {
  return regressionSpeakerNotes[sceneId] ?? [];
}
