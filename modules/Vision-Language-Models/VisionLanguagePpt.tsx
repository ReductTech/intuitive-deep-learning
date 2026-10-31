import { SceneDeck, type DeckDefinition, type SpeakerNote } from '../shared/react/presentation';
import { visionLanguageCourse } from './course';
import { lessonNotes } from './speakerNotes';
import { moduleAssetId } from './media';

export const deck: DeckDefinition = { id: 'vision-language-models', title: '视觉 Transformer 与视觉语言模型', subtitle: 'ViT · CLIP · VLM', scenes: visionLanguageCourse };
// Presentation-specific notes follow the current manual flow and displayed page order.
// Keep the source notes' mathematical qualifications unless explicitly replaced below.
const currentNoteText: Record<string, string[]> = {
  patchify: ['使用上一步、下一步按行查看前16块：大图标记、放大图与序列同步高亮。共有16个状态，终点停留，不自动推进或循环。'],
  embedding: [
    '使用上一步、下一步查看矩阵E的三列。2×2单通道图块展平为[1,2,3,4]，各列点积得到1.5、3.5、2.5；三个输出保持可见，共3个状态。',
    '4→3及系数为可验算教学示意，逐列高亮不代表真实计算串行。真实16×16×3图块展平为768维，共享可训练矩阵E投影到D维。参考：https://arxiv.org/abs/2010.11929',
  ],
  'attention-cls': ['第9页共5个手动状态：Q/K/V投影、缩放分数、Softmax、加权V、转置维度。分数1.414与0先取指数，再除以总和，得到约.804与.196；对应Value加权输出[.804,.196]。底部主公式突出当前部分，第5状态在同一位置替换为QKᵀ维度；上一步可回看。'],
  'dual-encoder': [
    '第12页共4个状态：选择图文、编码器数值、投影归一化、共同空间。默认选中雨景配对，也可选择非配对并阅读反馈；不要求完成所有配对才能推进。',
    '图像与文本使用人工三维数值，各自投影为二维并除以向量长度；I/T点坐标来自所示归一化向量。点代表向量，不是移动原图片；同维度不会自动对齐语义。参考：https://arxiv.org/abs/2103.00020',
  ],
  'contrastive-loss': ['第13页主流程共6个状态：配对输入、编码、相似度、损失、更新参数、重新编码。更新参数时输出仍为旧值；重新编码后才显示新分数。展开数值小例后另有3个手动状态：概率与损失、有限差分梯度、更新并重算；所有矩阵格均可读到数值。'],
  'batch-negatives': ['第14页左侧共3个状态：前文与待预测、预测“站在”、追加后预测“雨中”。右侧点击九个矩阵格可联动图文与正负配对说明；训练给正确前文，可并行算损失，推理追加生成片段。'],
  'dynamic-classifier': ['第15页共3个状态：开放候选、文本向量、保留候选进入下一页。第16页复用相同位置的候选行组件与T1/T2/T3，增加匹配分数；两页连续讲解编码与匹配。'],
  'zero-shot': ['第16页左侧图像向量I初始已可见；右侧3个状态依次保留候选、显示相似度、显示换候选是否需要重训的问题。回答后给出理由并可重试。相似度为预设值，不是概率。'],
  connector: [
    '第22页共5个手动状态，固定追踪位置295：视觉输入、第一层Linear、GELU、第二层Linear、接口输出。576个位置不变，每行1024维映射为4096维；GELU使多层映射不再等价于单次线性变换。',
    '维度匹配只是输入接口，不代表已学好对齐。第23页比较MLP与Q-Former，第24页看视觉向量与问题组成上下文，第25页用回答损失训练参数。参考：https://arxiv.org/abs/2310.03744',
  ],
  'connector-comparison': ['当前第23页，承接第22页映射。上方视觉编码器先提取特征，Connector分支标明MLP与Q-Former是同一接口环节的两种实现。8→8与8→3只示意位置数。下一页进入混合上下文，第25页再讲训练。'],
  'multimodal-context': ['当前第24页，共6个状态：初始尚无已生成回答，随后逐次追加5个中文片段，最终显示结束标记。使用上一步和下一步回看，不自动推进；来自第22页的映射向量作为视觉输入。'],
  training: ['当前第25页，共9个状态：初始样本与目标，加两阶段各4步（预测、算损失、更新参数、再预测）。只用上一步和下一步；回退到首状态恢复初始展示，没有阶段切换或重置按钮。预测后才出现概率，算损失后才出现损失；更新参数时提示概率仍为旧预测，重新预测后才刷新。阶段1只更新Connector，阶段2同时更新Connector与LLM；视觉编码器始终冻结。'],
  'visual-evidence': ['第26页共6个状态：提问、模拟错答、红伞证据、深色伞证据、修正与核对方法、变式作答。先说明错的是红色伞数量，不是总伞数，再让学习者判断能否仅凭静态图像证明伞完全防水。正确做法是保留不确定；错误答案提供理由并允许重试。核对法为“核对颜色／数量→定位依据→不能确认时保留不确定”。可能成因仅作条件性说明，不能据此诊断模型。下一页用检索和发票提取任务检查输出类型。'],
  recap: ['第27页先并列回顾表示、相似度、语言回答，再用“海边骑车”图片检索和新发票字段提取两个任务选择输出类型。作答后显示理由，答错可重新作答，切换任务清空作答；保留论文链接。本页不再展示红伞图像回顾布局。'],
};
export function getPptNotes(sceneId: string): SpeakerNote[] {
  if (sceneId === 'long-range') return [
    { text: '原稿第 2 页。只比较连接路径，不比较准确率或推理速度。两幅图复用相同场景；橙色框是女孩区域，白色框是龙猫区域。点击下一步比较同一次层更新带来的差别，点击上一步回退；页面不会自行推进。', selectors: ['.vlm-range-comparison'] },
    { text: '左图是 12×7 特征网格，源位置 (4,4)，目标位置 (8,3)。假设 3×3 卷积、步幅1、膨胀率1、保持空间尺寸、无池化，每层影响范围向外扩展一格，所以示例需4层到达目标。这是结构可达范围，不是实测激活或注意力权重；真实网络取决于卷积核、步幅、池化等配置。', selectors: ['.vlm-range-column:first-child'] },
    { text: '右图展示标准 ViT 的全局自注意力：同一层内，两个远距离 Token 已有直接的信息交互路径。箭头代表可连接性，不代表已经学到正确关系、完整理解或更快运行。参考 ViT §3.1 Inductive bias 与 §4.5：https://arxiv.org/html/2010.11929v2。', selectors: ['.vlm-range-column:last-child'] },
    { text: '结论：CNN 也能建立全局关系，只是局部传播往往需要更多层。上一步和下一步只改变本页演示阶段，不清空课程学习进度。下一页通过局部图像的歧义说明为什么需要上下文。', selectors: ['.vlm-range-footer'] },
  ];
  if (sceneId !== 'input-bridge') {
    const replacements = currentNoteText[sceneId];
    return lessonNotes(sceneId).map((note, index) => ({
      ...note,
      text: replacements?.[index] ?? note.text,
    }));
  }
  return [
    { text: '原稿第 1 页。先比较输入接口：文字经过分词和嵌入后是 L×D；这里用 I / love / cats 简化示意，不规定真实 tokenizer 的分词结果。', selectors: ['.vlm-bridge-text'] },
    { text: '图片来自用户提供的 PPT 中 ppt/media/image2.jpeg，保留原始比例。H、W 是空间维度，RGB 的 C=3。原图保持完整，中央再展示 4×4 切块；切块数仅用于入门示意，并非 ViT 的固定配置。', selectors: ['.vlm-rain-image'] },
    { text: '本页共7个手动状态：文本Token、Embedding、文本向量与Transformer、原图、切块、投影与视觉Token、图像Transformer。已显示内容保留，图像路径也按步骤展开。网格与向量为结构示意，没有运行模型。位置编码是D维向量，不是直接相加位置序号；CLS与注意力在后续页面讲解。', selectors: ['.vlm-bridge-image .vlm-bridge-process'] },
    { text: '参考：Dosovitskiy et al., An Image is Worth 16x16 Words, §3.1：https://arxiv.org/abs/2010.11929。理解输入形式后，下一页讨论图像中远距离信息如何建立联系。', selectors: ['.vlm-input-footer'] },
  ];
}
export function VisionLanguagePpt() {
  return <SceneDeck catalog={[deck]} moduleId={deck.id} assetId={moduleAssetId} progressKey="lesson-flow:vision-language-models" getNotes={getPptNotes} />;
}
