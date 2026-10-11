import { useEffect, useState, type CSSProperties } from 'react';
import { ContentBlock, MathFormulaBlock, MathFormulaStatic, Typography } from '../../../shared/react';
import './StridePage.css';

const INPUT_SIZE = 7;
const KERNEL_SIZE = 3;
const STRIDES = [1, 2, 3] as const;
type Stride = typeof STRIDES[number];

function InputGrid({ stride, step, outputSize }: { stride: Stride; step: number; outputSize: number }) {
  const activeIndex = Math.min(step, outputSize * outputSize - 1);
  const top = Math.floor(activeIndex / outputSize) * stride;
  const left = activeIndex % outputSize * stride;
  return <div className="ck-stride__input-grid" role="img" aria-label={`7 乘 7 输入网格，卷积窗口位于第 ${top + 1} 行、第 ${left + 1} 列`}>
    {Array.from({ length: INPUT_SIZE * INPUT_SIZE }, (_, index) => {
      const row = Math.floor(index / INPUT_SIZE), col = index % INPUT_SIZE;
      return <span key={index} className={row >= top && row < top + KERNEL_SIZE && col >= left && col < left + KERNEL_SIZE ? 'is-window' : ''} />;
    })}
    <div className="ck-stride__window" style={{ left: `${left / INPUT_SIZE * 100}%`, top: `${top / INPUT_SIZE * 100}%`, width: `${KERNEL_SIZE / INPUT_SIZE * 100}%`, height: `${KERNEL_SIZE / INPUT_SIZE * 100}%` }} />
  </div>;
}

function OutputGrid({ size, step }: { size: number; step: number }) {
  const total = size * size;
  return <div className="ck-stride__output-grid" style={{ '--output-size': size } as CSSProperties} role="img" aria-label={`${size} 乘 ${size} 输出特征图，共 ${total} 个位置，已扫描 ${Math.min(step, total)} 个`}>
    {Array.from({ length: total }, (_, index) => <span key={index} className={index === step && step < total ? 'is-current' : index < step ? 'is-complete' : ''} />)}
  </div>;
}

export function StridePage() {
  const [stride, setStride] = useState<Stride>(2);
  const [step, setStep] = useState(0);
  const outputSize = Math.floor((INPUT_SIZE - KERNEL_SIZE) / stride) + 1;
  const totalSteps = outputSize * outputSize;

  useEffect(() => {
    const interval = Math.min(650, Math.max(180, Math.round(16000 / totalSteps)));
    const timer = window.setInterval(() => setStep((current) => (current + 1) % (totalSteps + 1)), interval);
    return () => window.clearInterval(timer);
  }, [totalSteps]);

  const chooseStride = (value: Stride) => { setStride(value); setStep(0); };

  return <ContentBlock headingLevel={1} className="ck-stride" title="卷积步长" subtitle="固定 7 × 7 输入、3 × 3 卷积核与 Valid；步长决定相邻窗口的移动间隔。">
    <div className="ck-stride__workspace">
      <section className="ck-stride__picker" aria-label="选择卷积步长">
        <Typography as="h2" variant="h3" tone="accent">步长 S</Typography>
        <div className="ck-stride__choices" role="group" aria-label="卷积步长">
          {STRIDES.map((value) => <button key={value} type="button" className={stride === value ? 'is-selected' : ''} aria-pressed={stride === value} onClick={() => chooseStride(value)}><Typography as="span" variant="h2" tone="inherit">{value}</Typography></button>)}
        </div>
        <Typography variant="bodySmall" tone="muted">步长越大，输出位置越少。</Typography>
      </section>
      <section className="ck-stride__input-stage" aria-label="输入网格与当前卷积窗口">
        <Typography as="h2" variant="h3" tone="accent">输入网格 7 × 7</Typography>
        <InputGrid stride={stride} step={step} outputSize={outputSize} />
        <Typography variant="bodySmall" tone="accent">3 × 3 窗口每次移动 {stride} 格</Typography>
      </section>
      <div className="ck-stride__right">
        <section className="ck-stride__output-stage" aria-label="输出特征图">
          <Typography as="h2" variant="h3" tone="accent">输出特征图 {outputSize} × {outputSize}</Typography>
          <OutputGrid size={outputSize} step={step} />
          <Typography variant="bodySmall" tone="muted">每放置一次窗口，生成一个输出位置。</Typography>
        </section>
        <section className="ck-stride__formula-panel" aria-label="输出尺寸计算">
          <Typography as="h2" variant="h3" tone="accent">输出尺寸</Typography>
          <MathFormulaBlock ariaLabel="不填充时，输出边长等于输入边长减卷积核边长，除以步长后向下取整再加一"><MathFormulaStatic latex={String.raw`N_{\mathrm{out}}=\left\lfloor\frac{N_{\mathrm{in}}-K}{S}\right\rfloor+1`} /></MathFormulaBlock>
          <Typography variant="bodySmall" tone="muted">Valid：不填充 · 步长为 S</Typography>
        </section>
      </div>
    </div>
  </ContentBlock>;
}
