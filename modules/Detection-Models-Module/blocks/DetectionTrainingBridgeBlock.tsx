import { ContentBlock, NoticeStrip } from '../../shared/react';

const trainingCode = `images, labels = next(iter(train_loader))
# labels: (batch, max_objects, 5)

anchors, class_preds, box_preds = detector(images)
box_targets, box_masks, class_targets = multibox_target(anchors, labels)

class_loss = cross_entropy(class_preds, class_targets)
box_loss = l1_loss(box_preds * box_masks, box_targets * box_masks)
loss = class_loss + box_loss

# 推理：解码偏移、过滤低置信度并执行 NMS
detections = multibox_detection(class_preds, box_preds, anchors)`;

export function DetectionTrainingBridgeBlock() {
  return (
    <ContentBlock
      className="dmm-block dmm-training-bridge"
      title="把数据、预测头和损失函数接成一次训练与推理"
      subtitle="无论单阶段还是两阶段，检测头最终都要学习类别与位置；差异主要在候选区域怎样产生、特征怎样共享。"
    >
      <NoticeStrip tone="blue" lead="边界框损失要加掩码：">背景锚框没有需要回归的真实位置，因此只对正锚框计算位置损失。</NoticeStrip>
      <div className="dmm-model-comparison" aria-label="单阶段和两阶段检测器对比">
        <div className="dmm-comparison-head"><span>比较项</span><strong>SSD · 单阶段</strong><strong>Faster R-CNN · 两阶段</strong></div>
        <div><span>候选处理</span><p>所有尺度直接密集预测</p><p>RPN 先筛选 RoI，再精细预测</p></div>
        <div><span>共享特征</span><p>每个尺度共用卷积预测头</p><p>RPN 与检测头共享整图骨干特征</p></div>
        <div><span>最终输出</span><p>类别、框偏移，经过 NMS</p><p>RoI 类别、框偏移，经过 NMS</p></div>
      </div>
      <pre className="dmm-training-code" aria-label="目标检测训练与推理伪代码"><code>{trainingCode}</code></pre>
    </ContentBlock>
  );
}
