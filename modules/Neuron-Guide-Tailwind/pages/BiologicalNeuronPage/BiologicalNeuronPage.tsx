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
      className="ngtw-lecture-stage ngtw-biological-model"
      title="人工神经元，从生物神经元获得灵感"
      subtitle="它没有复制神经细胞，而是抽象了它处理信息的过程：接收、加权、汇总、输出。"
    >
      <ol className="ngtw-biological-model__steps grid grid-cols-[repeat(4,_minmax(0,_1fr))] gap-[18px] min-w-0 m-0 p-0" aria-label="从生物结构到人工神经元的四步抽象">
        {abstractions.map((item) => (
          <li className={`ngtw-biological-model__step relative grid min-w-0 grid-rows-[112px_minmax(180px,_1fr)_166px] overflow-visible rounded-[12px] bg-[#fff] ngtw-biological-model__step--${item.tone}`} key={item.index}>
            <header className="ngtw-biological-model__step-head grid grid-cols-[46px_minmax(0,_1fr)] items-center gap-[10px] rounded-[11px_11px_0_0] p-[8px_14px]">
              <Typography as="span" variant="bodySmall" tone="inherit" className="ngtw-biological-model__step-index">{item.index}</Typography>
              <div>
                <Typography as="strong" variant="h3" tone="accent">{item.structure}</Typography>
                <Typography as="span" variant="bodySmall" tone="main">{item.biology}</Typography>
              </div>
            </header>
            <figure className="ngtw-biological-model__image grid min-w-0 min-h-0 place-items-center overflow-hidden m-0 p-[4px_8px]">
              <img src={item.image} alt={`${item.structure}：${item.biology}`} />
            </figure>
            <div className="ngtw-biological-model__detail grid min-w-0 content-center gap-[4px] bg-[var(--step-soft)] p-[12px_16px] ngtw-biological-model__detail--math rounded-[0_0_11px_11px]">
              <Typography as="strong" variant="bodySmall" tone="warning">对应环节</Typography>
              <Typography as="strong" variant="h3" tone="accent">{item.math}</Typography>
              <Typography as="code" variant="body" tone="main">{item.symbol}</Typography>
            </div>
          </li>
        ))}
      </ol>
      <footer className="ngtw-biological-model__footer flex min-w-0 min-h-[76px] items-center justify-center gap-[20px] rounded-[10px] bg-[#edf4fb] p-[14px_24px]">
        <Typography as="span" variant="bodySmall" tone="inherit" className="ngtw-biological-model__year">1943</Typography>
        <Typography as="strong" variant="h3" tone="accent">McCulloch × Pitts</Typography>
        <span className="ngtw-biological-model__divider w-[1px] h-[36px] bg-[rgba(39,_68,_110,_.2)]" aria-hidden="true" />
        <Typography variant="body" tone="main">他们把这条生物信号链写成了早期人工神经元模型。</Typography>
      </footer>
    </ContentBlock>
  );
}

