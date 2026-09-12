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
  'bias-threshold': [
    { text: '先看阈值形式：加权总分达到门槛，神经元才输出。', selectors: ['.ng-bias-theory__stage'] },
    { text: '移项以后，门槛就变成了偏置；两种写法描述的是同一次判断。', selectors: ['.ng-bias-theory__equivalence'] },
  ],
  'linear-shallow': [
    { text: '一个神经元扩展成一层，多个节点并行计算各自的加权和。', selectors: ['.activation-network-stage'] },
    { text: '输出矩阵把这些并行结果收拢起来，维度必须彼此对齐。', selectors: ['.ng-output-matrix'] },
  ],
  'linear-deep': [
    { text: '再增加一层，线性计算可以组合，但它仍然没有产生新的非线性形状。', selectors: ['.activation-network-stage'] },
    { text: '输入空间里的分界从直线扩展为平面，仍然属于线性关系。', selectors: ['.ng-deep-linear-conclusion'] },
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
    { text: '一个 ReLU 神经元贡献一个折点，多个神经元可以把折点叠加起来。', selectors: ['.activation-network-stage'] },
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
