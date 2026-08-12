import { ContentBlock, Typography } from '../../shared/react';
import neuronDiagram from '../../Activation-Func-Module-React/assets/biological-neuron-diagram.svg';

const abstractions = [
  {
    index: '01',
    structure: '树突',
    biology: '接收其他神经元传来的信号',
    math: '输入',
    symbol: 'x₁, x₂, …, xₙ',
  },
  {
    index: '02',
    structure: '突触',
    biology: '连接强弱改变信号影响力',
    math: '权重',
    symbol: 'w₁, w₂, …, wₙ',
  },
  {
    index: '03',
    structure: '细胞体与轴丘',
    biology: '整合信号并决定是否触发',
    math: '加权和与阈值',
    symbol: 'Σwᵢxᵢ ≥ θ ?',
  },
  {
    index: '04',
    structure: '轴突',
    biology: '把触发后的响应传向下游',
    math: '输出',
    symbol: 'y = 1 或 0',
  },
];

export function BiologicalNeuronBlock() {
  return (
    <ContentBlock
      className="ng-lecture-stage ng-biological-model"
      title="1943 年，神经元被写成了数学模型"
      subtitle="沃伦·麦卡洛克与沃尔特·皮茨没有复制神经元的形状，而是抽出了它处理信号的基本规则。"
    >
      <div className="ng-biological-model__hero">
        <figure className="ng-biological-model__figure">
          <img src={neuronDiagram} alt="神经元结构示意图，展示树突、细胞体、轴突和轴突末梢" />
        </figure>

        <section className="ng-biological-model__thesis">
          <Typography variant="bodySmall" tone="warning">关键抽象</Typography>
          <Typography as="h3" variant="h2" tone="accent" wrap="balance">
            不复刻细胞，<br />只保留“怎样形成一次输出”
          </Typography>
          <Typography variant="body" tone="main">
            一个神经元会同时受到多路信号影响。只有这些影响整合后的结果达到触发条件，它才向下游传出响应。
          </Typography>

          <div className="ng-biological-model__authors">
            <Typography variant="h2" tone="warning">1943</Typography>
            <div>
              <Typography as="strong" variant="h3" tone="accent">McCulloch × Pitts</Typography>
              <Typography variant="bodySmall" tone="muted">
                他们把上述关系形式化为早期人工神经元，使神经活动第一次能够用逻辑和数学讨论。
              </Typography>
            </div>
          </div>
        </section>
      </div>

      <section className="ng-biological-model__translation">
        <div className="ng-biological-model__translation-head">
          <Typography variant="bodySmall" tone="warning">从生物机制到可计算关系</Typography>
          <Typography as="a" variant="bodySmall" tone="muted" href="https://doi.org/10.1007/BF02478259" target="_blank" rel="noreferrer">
            McCulloch &amp; Pitts, 1943
          </Typography>
        </div>
        <ol className="ng-biological-model__steps">
          {abstractions.map((item) => (
            <li key={item.index}>
              <div className="ng-biological-model__step-biology">
                <Typography as="span" variant="bodySmall" tone="warning" className="ng-biological-model__step-index">{item.index}</Typography>
                <Typography variant="bodySmall" tone="warning">生物结构</Typography>
                <Typography as="strong" variant="h3" tone="accent">{item.structure}</Typography>
                <Typography variant="bodySmall" tone="muted">{item.biology}</Typography>
              </div>
              <div className="ng-biological-model__mapping-label">
                <Typography as="span" variant="bodySmall" tone="warning">建模为</Typography>
              </div>
              <div className="ng-biological-model__step-math">
                <Typography variant="bodySmall" tone="muted">数学抽象</Typography>
                <Typography as="strong" variant="h3" tone="accent">{item.math}</Typography>
                <Typography as="code" variant="bodySmall" tone="main">{item.symbol}</Typography>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </ContentBlock>
  );
}
