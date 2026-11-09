import type { SpeakerNote } from "@shuku/course-runtime/react/presentation/types";
export type { SpeakerNote } from "@shuku/course-runtime/react/presentation/types";

/** Runtime-only narration layer. Pages do not import or reference this file. */
export const neuronSpeakerNotes: Record<string, SpeakerNote[]> = {
  'fea52098-c5d3-4984-a0d9-f5fc33afc04c': [
    { text: '先看左侧显微镜影像：这是一只只有 302 个神经元的秀丽隐杆线虫。', selectors: ['.ngtw-nematode-intro__video'] },
    { text: '右侧的连接组信息说明，我们可以沿着完整线路图追踪感觉如何转化为行为。', selectors: ['.ngtw-nematode-intro__connectome'] },
    { text: '最后观察九个能力泡泡：感知、行动和行为，都是神经回路协同的结果。', selectors: ['.ngtw-nematode-intro__abilities'] },
  ],
  '857354e3-f094-4f24-9a7f-60a26de0abd9': [
    { text: '先从神经元的真实结构开始：树突、突触、细胞体与轴突各自承担不同任务。', selectors: ['.ngtw-biological-model__figure'] },
    { text: '麦卡洛克与皮茨保留的不是细胞形状，而是多个信号整合后形成输出的规则。', selectors: ['.ngtw-biological-model__thesis'] },
    { text: '下方四张卡把生物结构逐一翻译成输入、权重、加权和与输出。', selectors: ['.ngtw-biological-model__steps'] },
  ],
  'c9cf20c1-c6b7-4557-ad62-95744bb2e4f1': [
    { text: '把镜头从单个细胞拉远：一个神经元只给出简单状态，复杂判断来自大量单元的组合。', selectors: ['.ngtw-neuron-decision-bridge__network'] },
    { text: '右侧状态选择器展示，同一个系统可以出现多种不同的响应状态。', selectors: ['.ngtw-neuron-decision-bridge__states'] },
  ],
  '79ba5443-37f6-4078-bcdc-ec46a6c760be': [
    { text: '先输入一个你正在权衡的真实问题，模型会把它拆成三个主要影响因素。', selectors: ['.ngtw-decision-composer'] },
    { text: '提交后，结果区把自然语言判断变成可以继续衡量的因素。', selectors: ['.ngtw-decision-result'] },
  ],
  'c8d01bb6-58b6-49a8-af2c-a8f3869bcddb': [
    { text: '选择一个因素并规定衡量方式，这一步把叙述变成统一尺度上的输入。', selectors: ['.ngtw-signal-quantization'] },
    { text: '改变取值，观察同一个因素如何映射成神经元能够处理的数值。', selectors: ['.ngtw-signal-quantization__result'] },
  ],
  '9f6c7e39-a468-49e5-bb6e-8e12ae579c0a': [
    { text: '现在把第二、第三个因素也加入进来，三个输入共同描述一次判断。', selectors: ['.ngtw-extra-factor-grid'] },
    { text: '每个输入都有自己的权重，重要程度会改变它对总分的影响。', selectors: ['.ngtw-theory-panel'] },
  ],
  '8356ddee-4759-4942-97c4-4c8f635cf478': [
    { text: '先把一长串加权求和写成输入向量与权重向量。', selectors: ['.ngtw-matrix-definition-ppt__vectors'] },
    { text: '再把同一条关系展开成矩阵乘法，注意每个维度如何对应。', selectors: ['.ngtw-matrix-definition-ppt__expanded'] },
  ],
  'bd19901c-3eee-460a-b5c0-e018632da031': [
    { text: '矩阵计算得到的是一个连续数值。先看左侧：0 将负数和非负数分开，因此正负号可以承担一次二分类。', selectors: ['.ngtw-bias-concept--natural .ngtw-bias-axis'] },
    { text: '再看右侧：本例所有加权和都落在 0–3，0 的左侧没有任何可能结果。因此没有 bias 时，当前结果无法形成有效分类。', selectors: ['.ngtw-bias-concept--problem .ngtw-bias-axis'] },
  ],
  'cf503bad-5f03-4900-b771-d7200f06cfa9': [
    { text: '请学习者先根据 0–3 的范围选择分类阈值；若两类区间长度相同，分界点应位于范围中点。', selectors: ['.ngtw-bias-question-pane'] },
    { text: '答对后看右侧：1.50 平分 0–3，当前结果 1.33 因而输出 0。再将分界点写成 −b，得到 b = −1.50。', selectors: ['.ngtw-bias-answer-pane'] },
  ],
  'effd7148-7faa-40cc-9b94-2b75724edec3': [
    { text: '将单个神经元扩展成一层，多个节点并行计算各自的线性结果。', selectors: ['.ngtw-activation-network-stage'] },
    { text: '输出节点再将这些结果加权汇总。由于线性函数的加权和仍然是线性的，总输出仍然是一条直线。', selectors: ['.ngtw-output-matrix'] },
  ],
  '52a2580d-1e72-4070-bec2-1a88fc0ef63c': [
    { text: '上一页说明多个线性神经元组合后仍然保持线性。现在将这个结论放回秀丽隐杆线虫的双侧刺激场景中进行检验。', selectors: ['.edu-content-head', '.ngtw-nematode-xor__rule-note'] },
    { text: '先观察四种行为结果，再调整右侧分类直线的位置和方向，使两个转向状态位于同一侧。', selectors: ['.ngtw-nematode-xor__case-grid', '.ngtw-nematode-xor__line-panel'] },
    { text: '两个转向状态位于对角位置，一条直线最多判断对三种情况。这个无法被线性边界完全分开的关系称为 XOR，下一步需要引入非线性。', selectors: ['.ngtw-nematode-xor__map', '.ngtw-nematode-xor__line-panel'] },
  ],
  '51f235bd-337d-43ea-bb0b-bc4636a6ceee': [
    { text: '拖动输入值，观察 ReLU 对负值和正值的两种处理方式。', selectors: ['.ngtw-response-lab__single-control'] },
    { text: '负值被压到零，正值保持原样，这个折点就是非线性的来源。', selectors: ['.ngtw-response-lab__neuron-demo'] },
  ],
  'e8439e2b-a75c-4052-a47d-1e7ecbf82964': [
    { text: '把刚才的交互写成分段函数：零左侧被抑制，右侧保持线性。', selectors: ['.ngtw-relu-explanation__definition'] },
    { text: '图上的折点标记了激活函数改变规则的位置。', selectors: ['.ngtw-relu-explanation__figure'] },
  ],
  '32a39382-9916-41c7-9da1-056d60ef9b33': [
    { text: '一个 ReLU 神经元贡献一个折点，多个神经元可以把折点叠加起来。', selectors: ['.ngtw-activation-network-stage'] },
    { text: '网络输出因此变成多段线性曲线，结构越丰富，曲线越能弯折。', selectors: ['.ngtw-output-matrix'] },
  ],
  '1cc8cb8c-9a3a-400e-86b9-ceea46656e5e': [
    { text: '先在画布上画出一条你想逼近的目标曲线。', selectors: ['.ngtw-relu-drawing-board'] },
    { text: '增加 ReLU 神经元数量，观察预测曲线如何逐步贴近目标。', selectors: ['.ngtw-relu-drawing-panel__controls'] },
  ],
  '39d430a6-7a61-49cb-ab59-be18601f14b2': [
    { text: '这里把常见激活函数放在同一张索引里比较。', selectors: ['.ngtw-activation-catalog__grid'] },
    { text: '重点观察它们在负值、零点和正值区域的形状差异。', selectors: ['.ngtw-activation-catalog'] },
  ],
  'e378a0e9-3c01-43ed-8de9-3d51fe3d9355': [
    { text: '回看整条链路：输入、权重、加权和、偏置，最后经过激活函数。', selectors: ['.ngtw-completion-stage'] },
    { text: '你已经把一个生物神经元的处理规则搭成了可计算的人工神经元。', selectors: ['.edu-lesson-footer'] },
  ],
  '0ae5732b-f7a1-4bb7-a09c-8fbf1ad80599': [
    { text: '课程到这里结束；这些资源可以帮助你继续深入神经元与神经网络。', selectors: ['.edu-lesson-footer'] },
  ],
};

export function notesForScene(sceneId: string): SpeakerNote[] {
  return neuronSpeakerNotes[sceneId] ?? [{ text: '这一页把当前概念放进完整的人工神经元计算链中。', selectors: ['.edu-content-block'] }];
}


