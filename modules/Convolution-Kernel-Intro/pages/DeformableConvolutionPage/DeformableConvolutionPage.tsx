import { useState } from 'react';
import type { CSSProperties } from 'react';
import { ContentBlock, MathFormulaBlock, MathFormulaStatic, Typography } from '../../../shared/react';
import riverImage from '../../assets/xielaqiao.png';
import './DeformableConvolutionPage.css';

const steps = [
  { title: '规则采样', note: '固定位置 p₀ + pₙ', formula: String.raw`p_0+p_n`, mode: 'regular' },
  { title: '学习偏移', note: '每个采样点增加偏移 Δpₙ', formula: String.raw`p_0+p_n+\Delta p_n`, mode: 'offset' },
  { title: '重新加权求和', note: '在新位置取值，再按权重相加', formula: String.raw`y(p_0)=\sum_n w_n\,x(p_0+p_n+\Delta p_n)`, mode: 'sum' },
] as const;

function SamplingGrid({ mode }: { mode: (typeof steps)[number]['mode'] }) {
  const offsets = [[-1, -1], [0, -1], [1, -1], [-1, 0], [0, 0], [1, 0], [-1, 1], [0, 1], [1, 1]];
  return <div className={`ck-deform__grid is-${mode}`}>
    <img src={riverImage} alt="河流特征图采样区域" />
    <div className="ck-deform__grid-lines" />
    <span className="ck-deform__anchor">p₀</span>
    {offsets.map(([x, y], index) => {
      const dx = mode === 'offset' || mode === 'sum' ? ((index * 7) % 3) - 1 : 0;
      const dy = mode === 'offset' || mode === 'sum' ? ((index * 5) % 3) - 1 : 0;
      return <span key={index} className={`ck-deform__point ${index === 4 ? 'is-center' : ''}`} style={{ '--x': x, '--y': y, '--dx': dx, '--dy': dy } as CSSProperties} />;
    })}
    {mode === 'offset' || mode === 'sum' ? offsets.map(([x, y], index) => <span key={`arrow-${index}`} className="ck-deform__offset-arrow" style={{ '--x': x, '--y': y, '--dx': ((index * 7) % 3) - 1, '--dy': ((index * 5) % 3) - 1 } as CSSProperties}>↗</span>) : null}
  </div>;
}

function WeightMatrix() {
  return <div className="ck-deform__weights">{['w₁', 'w₂', 'w₃', 'w₄', 'w₅', 'w₆', 'w₇', 'w₈', 'w₉'].map((value) => <span key={value}>{value}</span>)}</div>;
}

export function DeformableConvolutionPage() {
  const [step, setStep] = useState(1);
  const current = steps[step];
  return <ContentBlock headingLevel={1} className="ck-deform" title="可变形卷积：让采样位置适应局部结构" subtitle="先预测采样点的偏移，再在这些位置取值；卷积的加权求和仍然保留。">
    <div className="ck-deform__body">
      <section className={`ck-deform__stage ${step === 0 ? 'is-selected' : ''}`} onClick={() => setStep(0)}>
        <header><Typography as="span" variant="h2" tone="accent">1</Typography><Typography as="h2" variant="h3" tone="accent">规则采样</Typography></header>
        <SamplingGrid mode="regular" />
        <MathFormulaBlock ariaLabel="规则采样位置"><MathFormulaStatic latex={steps[0].formula} /></MathFormulaBlock>
        <Typography variant="bodySmall" tone="muted">普通卷积在固定的 3×3 位置取值。</Typography>
      </section>
      <section className={`ck-deform__stage ${step === 1 ? 'is-selected' : ''}`} onClick={() => setStep(1)}>
        <header><Typography as="span" variant="h2" tone="accent">2</Typography><Typography as="h2" variant="h3" tone="accent">加上偏移 Δpₙ</Typography></header>
        <SamplingGrid mode="offset" />
        <MathFormulaBlock ariaLabel="加入偏移后的采样位置"><MathFormulaStatic latex={steps[1].formula} /></MathFormulaBlock>
        <Typography variant="bodySmall" tone="muted">网络为每个采样点学习一个二维偏移量。</Typography>
      </section>
      <section className={`ck-deform__stage is-sum ${step === 2 ? 'is-selected' : ''}`} onClick={() => setStep(2)}>
        <header><Typography as="span" variant="h2" tone="accent">3</Typography><Typography as="h2" variant="h3" tone="accent">仍然按卷积求和</Typography></header>
        <div className="ck-deform__sum-visual"><div><Typography variant="bodySmall" tone="muted">按新位置取值</Typography><SamplingGrid mode="sum" /></div><div className="ck-deform__sum-arrow">→</div><div><Typography variant="bodySmall" tone="muted">乘对应权重</Typography><WeightMatrix /></div></div>
        <MathFormulaBlock ariaLabel="可变形卷积求和公式"><MathFormulaStatic latex={steps[2].formula} /></MathFormulaBlock>
        <Typography variant="bodySmall" tone="muted">改变的是取样位置，卷积的加权求和形式不变。</Typography>
      </section>
    </div>
    <footer className="ck-deform__summary"><MathFormulaBlock ariaLabel="可变形卷积公式"><MathFormulaStatic latex={String.raw`y(p_0)=\sum_n w_n\,x(p_0+p_n+\Delta p_n)`} /></MathFormulaBlock><Typography variant="body">普通卷积固定采样；可变形卷积先预测偏移，再完成同样的加权求和。</Typography></footer>
  </ContentBlock>;
}
