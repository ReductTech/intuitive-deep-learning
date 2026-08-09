import { ContentBlock, NoticeStrip } from '../../shared/react';

const anchorCode = `sizes = [0.2, 0.4]
ratios = [1, 2, 0.5]

# 每个特征点生成 n + m - 1 = 4 个锚框
anchors = multibox_prior(feature_map, sizes, ratios)

# 每个正锚框学习两件事
class_target = object_class
offset_target = encode_offset(anchor_box, ground_truth_box)`;

const pipeline = [
  { step: '01', title: '生成锚框', text: '在特征图采样点上放置不同尺度、不同宽高比的候选框。' },
  { step: '02', title: '分配训练标签', text: '用 IoU 将锚框匹配到真实框；正样本学习类别与位置偏移，未匹配框作为背景。' },
  { step: '03', title: '调整预测框', text: '模型预测类别置信度和四个偏移量，把固定锚框修正到目标附近。' },
  { step: '04', title: '筛选最终结果', text: '先过滤低置信度框，再用 NMS 抑制高度重合的重复预测。' },
];

export function DetectionPipelineBridgeBlock() {
  return (
    <ContentBlock
      className="odf-block odf-pipeline-bridge"
      title="把四关串起来：检测器真正训练和预测什么？"
      subtitle="锚框不是模型的最终答案，而是大量可学习的起点。模型要为每个锚框预测类别和位置偏移。"
    >
      <NoticeStrip tone="blue" lead="训练与预测的分工：">训练阶段用真实框给锚框分配监督；预测阶段用学到的偏移修正锚框，再对结果去重。</NoticeStrip>
      <div className="odf-detection-pipeline">
        {pipeline.map((item) => (
          <article key={item.step}>
            <span>{item.step}</span>
            <div><strong>{item.title}</strong><p>{item.text}</p></div>
          </article>
        ))}
      </div>
      <div className="odf-anchor-bridge">
        <div>
          <span>为什么不是所有 size × ratio 组合？</span>
          <strong>每个位置使用 n + m − 1 个常用组合</strong>
          <p>固定第一个尺度遍历全部宽高比，再固定第一个宽高比遍历其余尺度，可以保留形状多样性，同时避免候选数量过快膨胀。</p>
        </div>
        <pre aria-label="锚框生成与训练标签伪代码"><code>{anchorCode}</code></pre>
      </div>
    </ContentBlock>
  );
}
