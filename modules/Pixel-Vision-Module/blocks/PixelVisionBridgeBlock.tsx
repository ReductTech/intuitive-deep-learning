import { ContentBlock, NoticeStrip } from '../../shared/react';
const code = `image, mask = paired_random_crop(image, mask)
# mask: (H, W)，每个像素保存类别索引

features = pretrained_resnet18_without_pool_and_fc(image)
class_scores = conv1x1(features)          # 512 -> num_classes
logits = transposed_conv(class_scores)    # H/32, W/32 -> H, W

loss = cross_entropy(logits, mask)
prediction = logits.argmax(dim=1)`;

export function PixelVisionBridgeBlock() {
  return <ContentBlock className="pvm-block pvm-bridge-block" title="从成对数据增强到逐像素交叉熵" subtitle="训练时无需为每个像素单独写循环：类别通道上的交叉熵会在整张标签图上并行计算。"><NoticeStrip tone="blue" lead="尺寸必须闭合：">输入与标签同尺寸，FCN 输出也回到同一尺寸，才能逐位置计算损失。</NoticeStrip><pre className="pvm-code"><code>{code}</code></pre></ContentBlock>;
}
