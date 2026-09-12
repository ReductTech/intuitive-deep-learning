import { ContentBlock, Typography } from '../../../shared/react';
import './BiologicalNeuronPage.css';
import dendriteImage from '../../assets/1.png';
import synapseImage from '../../assets/2.png';
import somaImage from '../../assets/3.png';
import axonImage from '../../assets/4.png';

const abstractions = [
  { index: '1', tone: 'blue', structure: '树突', biology: '接收信号', math: '输入', symbol: 'x₁, x₂, …, xₙ', image: dendriteImage },
  { index: '2', tone: 'green', structure: '突触', biology: '连接强弱决定影响', math: '权重', symbol: 'w₁, w₂, …, wₙ', image: synapseImage },
  { index: '3', tone: 'orange', structure: '细胞体 / 轴丘', biology: '整合信号，决定触发', math: '加权和与阈值', symbol: 'Σwᵢxᵢ ≥ θ ?', image: somaImage },
  { index: '4', tone: 'purple', structure: '轴突', biology: '把响应传向下游', math: '输出', symbol: 'y = 1 或 0', image: axonImage },
] as const;

export function BiologicalNeuronPage() {
  return (
    <ContentBlock
      headingLevel={1}
      className="ng-lecture-stage ng-biological-model"
      title="人工神经元，从生物神经元获得灵感"
      subtitle="它没有复制神经细胞，而是抽象了它处理信息的过程：接收、加权、汇总、输出。"
    >
      <ol className="ng-biological-model__steps" aria-label="从生物结构到人工神经元的四步抽象">
        {abstractions.map((item) => (
          <li className={`ng-biological-model__step ng-biological-model__step--${item.tone}`} key={item.index}>
            <header className="ng-biological-model__step-head">
              <Typography as="span" variant="bodySmall" tone="inherit" className="ng-biological-model__step-index">{item.index}</Typography>
              <div>
                <Typography as="strong" variant="h3" tone="accent">{item.structure}</Typography>
                <Typography as="span" variant="bodySmall" tone="main">{item.biology}</Typography>
              </div>
            </header>
            <figure className="ng-biological-model__image">
              <img src={item.image} alt={`${item.structure}：${item.biology}`} />
            </figure>
            <div className="ng-biological-model__detail ng-biological-model__detail--math">
              <Typography as="strong" variant="bodySmall" tone="warning">对应环节</Typography>
              <Typography as="strong" variant="h3" tone="accent">{item.math}</Typography>
              <Typography as="code" variant="body" tone="main">{item.symbol}</Typography>
            </div>
          </li>
        ))}
      </ol>
      <footer className="ng-biological-model__footer">
        <Typography as="span" variant="bodySmall" tone="inherit" className="ng-biological-model__year">1943</Typography>
        <Typography as="strong" variant="h3" tone="accent">McCulloch × Pitts</Typography>
        <span className="ng-biological-model__divider" aria-hidden="true" />
        <Typography variant="body" tone="main">他们把这条生物信号链写成了早期人工神经元模型。</Typography>
      </footer>
    </ContentBlock>
  );
}
