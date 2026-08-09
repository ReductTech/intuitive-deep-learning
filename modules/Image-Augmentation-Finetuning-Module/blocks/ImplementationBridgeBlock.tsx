import { ContentBlock, NoticeStrip } from '../../shared/react';

const trainPipeline = [
  'RandomResizedCrop',
  'RandomHorizontalFlip',
  'ColorJitter',
  'ToTensor',
  'Normalize',
];

const evaluationPipeline = ['Resize', 'CenterCrop', 'ToTensor', 'Normalize'];

const augmentationCode = `normalize = transforms.Normalize(IMAGENET_MEAN, IMAGENET_STD)

train_augs = transforms.Compose([
    transforms.RandomResizedCrop(224),
    transforms.RandomHorizontalFlip(),
    transforms.ColorJitter(brightness=.2, contrast=.2),
    transforms.ToTensor(),
    normalize,
])

eval_augs = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    normalize,
])`;

const fineTuningCode = `model = resnet18(weights=ResNet18_Weights.DEFAULT)
model.fc = nn.Linear(model.fc.in_features, num_classes)

backbone = [p for name, p in model.named_parameters()
            if not name.startswith("fc.")]

optimizer = torch.optim.SGD([
    {"params": backbone},
    {"params": model.fc.parameters(), "lr": base_lr * 10},
], lr=base_lr, weight_decay=1e-3)`;

function Pipeline({ label, steps, note }: { label: string; steps: string[]; note: string }) {
  return (
    <article className="vgen-pipeline-card">
      <header>
        <span>{label}</span>
        <p>{note}</p>
      </header>
      <ol aria-label={`${label}预处理顺序`}>
        {steps.map((step) => <li key={step}><code>{step}</code></li>)}
      </ol>
    </article>
  );
}

export function ImplementationBridgeBlock() {
  return (
    <ContentBlock
      className="vgen-block vgen-implementation-block"
      title="从直觉到代码：把增广与微调接进训练管线"
      subtitle="原章节不仅说明为什么有效，也强调训练与评估要使用不同的图像处理，并展示了分类头与骨干网络的分层学习率。"
    >
      <NoticeStrip tone="blue" lead="一条容易漏掉的规则：">
        随机增广只用于训练集；验证和测试必须使用确定性的处理。两边仍应保持相同的输入尺寸约定和通道标准化。
      </NoticeStrip>

      <div className="vgen-pipeline-grid">
        <Pipeline
          label="训练管线"
          steps={trainPipeline}
          note="每次读取都可能得到不同样本，让模型少依赖位置、亮度或颜色。具体操作仍要先通过标签保持检查。"
        />
        <Pipeline
          label="验证 / 测试管线"
          steps={evaluationPipeline}
          note="使用中心裁剪等确定性步骤，避免指标被随机变换扰动；Normalize 与预训练模型保持一致。"
        />
      </div>

      <div className="vgen-code-grid">
        <article className="vgen-code-card">
          <header>
            <span>PyTorch · 组合图像增广</span>
            <strong>Compose 让操作按顺序执行</strong>
          </header>
          <pre><code>{augmentationCode}</code></pre>
        </article>
        <article className="vgen-code-card">
          <header>
            <span>PyTorch · 分层学习率</span>
            <strong>新分类头比骨干网络学得更快</strong>
          </header>
          <pre><code>{fineTuningCode}</code></pre>
        </article>
      </div>

      <div className="vgen-coverage-note">
        <div>
          <span>本课已经覆盖</span>
          <strong>标签保持 · 增广强度 · 冻结 / 微调 / 从零训练</strong>
        </div>
        <div>
          <span>本段补齐原文实现点</span>
          <strong>随机裁剪与颜色扰动 · Compose · 训练 / 评估分流 · 分类头 10× 学习率</strong>
        </div>
        <p>
          小数据示例中的热狗数据集与多 GPU 训练属于案例和工程细节，不再复制成独立互动；需要复现实验时可直接阅读
          {' '}<a href="https://zh-v2.d2l.ai/chapter_computer-vision/image-augmentation.html" target="_blank" rel="noreferrer">D2L 图像增广</a>
          {' '}和{' '}
          <a href="https://zh-v2.d2l.ai/chapter_computer-vision/fine-tuning.html" target="_blank" rel="noreferrer">D2L 微调</a>。
        </p>
      </div>
    </ContentBlock>
  );
}
