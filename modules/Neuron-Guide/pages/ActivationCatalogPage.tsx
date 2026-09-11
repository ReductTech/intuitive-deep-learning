import { LessonStage, Typography } from '../../shared/react';
import { ActivationFunctionPlot } from '../components/ActivationCharts';
import './SlidePage.css';

const activations = [
  {
    type: 'relu' as const,
    name: 'ReLU',
    formula: 'max(0, x)',
    description: '负值被抑制为 0，正值保持线性，输出向正方向没有上界。',
  },
  {
    type: 'leakyRelu' as const,
    name: 'Leaky ReLU',
    formula: 'max(0.1x, x)',
    description: '负值保留较小斜率，正值保持原斜率，两个方向都可以继续延伸。',
  },
  {
    type: 'silu' as const,
    name: 'SiLU / Swish',
    formula: 'x · sigmoid(x)',
    description: '平滑地抑制负值，正向输出没有上界。',
  },
  {
    type: 'gelu' as const,
    name: 'GELU',
    formula: 'x · Φ(x)',
    description: '按输入大小平滑调节通过比例，大模型中常见。',
  },
  {
    type: 'sigmoid' as const,
    name: 'Sigmoid',
    formula: '1 / (1 + e⁻ˣ)',
    description: '把数值压到 0～1，常用于二分类输出。',
  },
  {
    type: 'tanh' as const,
    name: 'Tanh',
    formula: 'tanh(x)',
    description: '把数值压到 −1～1，并以 0 为中心。',
  },
];

export function ActivationCatalogPage() {
  return (
    <LessonStage
      className="ng-activation-catalog"
      title="认识这些被广泛使用的激活函数"
      description="激活函数有不同形状，也会给网络带来不同的数值特性；它们共同完成同一件事：打破纯线性叠加。"
      descriptionVariant="bodySmall"
    >
      <div className="ng-activation-catalog__grid">
        {activations.map((activation) => (
          <article className="ng-activation-catalog__card" key={activation.type}>
            <ActivationFunctionPlot type={activation.type} />
            <Typography as="h3" variant="subtitle" tone="accent">{activation.name}</Typography>
            <Typography as="code" variant="bodySmall" tone="main" className="ng-activation-catalog__formula">{activation.formula}</Typography>
            <Typography variant="bodySmall" tone="muted">{activation.description}</Typography>
          </article>
        ))}
      </div>
    </LessonStage>
  );
}



