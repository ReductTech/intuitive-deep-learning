import type { SpeakerNote } from '../shared/react/presentation/types';
export type { SpeakerNote } from '../shared/react/presentation/types';

/** Runtime-only narration layer. Pages do not import or reference this file. */
export const neuronSpeakerNotes: Record<string, SpeakerNote[]> = {
  'nematode-response': [
    { text: '先看左侧显微镜影像：这是一只只有 302 个神经元的秀丽隐杆线虫。', selectors: ['.ng-nematode-intro__video'] },
    { text: '右侧的连接组信息说明，我们可以沿着完整线路图追踪感觉如何转化为行为。', selectors: ['.ng-nematode-intro__connectome'] },
    { text: '最后观察九个能力泡泡：感知、行动和行为，都是神经回路协同的结果。', selectors: ['.ng-nematode-intro__abilities'] },
  ],
  'biological-structure': [
    { text: '先从神经元的真实结构开始：树突、突触、细胞体与轴突各自承担不同任务。', selectors: ['.ng-biological-model__figure'] },
    { text: '麦卡洛克与皮茨保留的不是细胞形状，而是多个信号整合后形成输出的规则。', selectors: ['.ng-biological-model__thesis'] },
    { text: '下方四张卡把生物结构逐一翻译成输入、权重、加权和与输出。', selectors: ['.ng-biological-model__steps'] },
  ],
  'decision-bridge': [
    { text: '把镜头从单个细胞拉远：一个神经元只给出简单状态，复杂判断来自大量单元的组合。', selectors: ['.ng-neuron-decision-bridge__network'] },
    { text: '右侧状态选择器展示，同一个系统可以出现多种不同的响应状态。', selectors: ['.ng-neuron-decision-bridge__states'] },
  ],
  'signal-discovery': [
    { text: '先输入一个你正在权衡的真实问题，模型会把它拆成三个主要影响因素。', selectors: ['.ng-decision-composer'] },
    { text: '提交后，结果区把自然语言判断变成可以继续衡量的因素。', selectors: ['.ng-decision-result'] },
  ],
  'weighted-sum': [
    { text: '选择一个因素并规定衡量方式，这一步把叙述变成统一尺度上的输入。', selectors: ['.ng-signal-quantization'] },
    { text: '改变取值，观察同一个因素如何映射成神经元能够处理的数值。', selectors: ['.ng-signal-quantization__result'] },
  ],
  'extra-inputs': [
    { text: '现在把第二、第三个因素也加入进来，三个输入共同描述一次判断。', selectors: ['.ng-extra-factor-grid'] },
    { text: '每个输入都有自己的权重，重要程度会改变它对总分的影响。', selectors: ['.ng-theory-panel'] },
  ],
  'weighted-contribution': [
    { text: '先把一长串加权求和写成输入向量与权重向量。', selectors: ['.ng-matrix-definition-ppt__vectors'] },
    { text: '再把同一条关系展开成矩阵乘法，注意每个维度如何对应。', selectors: ['.ng-matrix-definition-ppt__expanded'] },
  ],
  'bias-natural-boundary': [
    { text: '矩阵计算得到的是一个连续数值。先看左侧：0 将负数和非负数分开，因此正负号可以承担一次二分类。', selectors: ['.ng-bias-concept--natural .ng-bias-axis'] },
    { text: '再看右侧：本例所有加权和都落在 0–3，0 的左侧没有任何可能结果。因此没有 bias 时，当前结果无法形成有效分类。', selectors: ['.ng-bias-concept--problem .ng-bias-axis'] },
  ],
  'bias-threshold': [
    { text: '请学习者先根据 0–3 的范围选择分类阈值；若两类区间长度相同，分界点应位于范围中点。', selectors: ['.ng-bias-question-pane'] },
    { text: '答对后看右侧：1.50 平分 0–3，当前结果 1.33 因而输出 0。再将分界点写成 −b，得到 b = −1.50。', selectors: ['.ng-bias-answer-pane'] },
  ],
  'linear-shallow': [
    { text: '将单个神经元扩展成一层，多个节点并行计算各自的线性结果。', selectors: ['.ng-activation-network-stage'] },
    { text: '输出节点再将这些结果加权汇总。由于线性函数的加权和仍然是线性的，总输出仍然是一条直线。', selectors: ['.ng-output-matrix'] },
  ],
  'nematode-xor': [
    { text: '上一页说明多个线性神经元组合后仍然保持线性。现在将这个结论放回秀丽隐杆线虫的双侧刺激场景中进行检验。', selectors: ['.edu-content-head', '.ng-nematode-xor__rule-note'] },
    { text: '先观察四种行为结果，再调整右侧分类直线的位置和方向，使两个转向状态位于同一侧。', selectors: ['.ng-nematode-xor__case-grid', '.ng-nematode-xor__line-panel'] },
    { text: '两个转向状态位于对角位置，一条直线最多判断对三种情况。这个无法被线性边界完全分开的关系称为 XOR，下一步需要引入非线性。', selectors: ['.ng-nematode-xor__map', '.ng-nematode-xor__line-panel'] },
  ],
  'relu-intro': [
    { text: '拖动输入值，观察 ReLU 对负值和正值的两种处理方式。', selectors: ['.ng-response-lab__single-control'] },
    { text: '负值被压到零，正值保持原样，这个折点就是非线性的来源。', selectors: ['.ng-response-lab__neuron-demo'] },
  ],
  'relu-explanation': [
    { text: '把刚才的交互写成分段函数：零左侧被抑制，右侧保持线性。', selectors: ['.ng-relu-explanation__definition'] },
    { text: '图上的折点标记了激活函数改变规则的位置。', selectors: ['.ng-relu-explanation__figure'] },
  ],
  'relu-network': [
    { text: '一个 ReLU 神经元贡献一个折点，多个神经元可以把折点叠加起来。', selectors: ['.ng-activation-network-stage'] },
    { text: '网络输出因此变成多段线性曲线，结构越丰富，曲线越能弯折。', selectors: ['.ng-output-matrix'] },
  ],
  'relu-approximation': [
    { text: '先在画布上画出一条你想逼近的目标曲线。', selectors: ['.ng-relu-drawing-board'] },
    { text: '增加 ReLU 神经元数量，观察预测曲线如何逐步贴近目标。', selectors: ['.ng-relu-drawing-panel__controls'] },
  ],
  'activation-catalog': [
    { text: '这里把常见激活函数放在同一张索引里比较。', selectors: ['.ng-activation-catalog__grid'] },
    { text: '重点观察它们在负值、零点和正值区域的形状差异。', selectors: ['.ng-activation-catalog'] },
  ],
  'ending': [
    { text: '回看整条链路：输入、权重、加权和、偏置，最后经过激活函数。', selectors: ['.ng-completion-stage'] },
    { text: '你已经把一个生物神经元的处理规则搭成了可计算的人工神经元。', selectors: ['.ng-guide-footer'] },
  ],
  'resources': [
    { text: '课程到这里结束；这些资源可以帮助你继续深入神经元与神经网络。', selectors: ['.ng-guide-footer'] },
  ],
};

export function notesForScene(sceneId: string): SpeakerNote[] {
  return neuronSpeakerNotes[sceneId] ?? [{ text: '这一页把当前概念放进完整的人工神经元计算链中。', selectors: ['.edu-content-block', '.edu-stage'] }];
}
