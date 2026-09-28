import { useEffect, useState, type CSSProperties } from 'react';
import { ContentBlock, MathFormulaBlock, MathFormulaStatic, Typography } from '../../../shared/react';
import './PaddingPage.css';

const INPUT_SIZE = 7;
const KERNEL_SIZE = 3;
const PADDINGS = [0, 1, 2] as const;
type Padding = typeof PADDINGS[number];

function InputGrid({ padding, step, outputSize }: { padding: Padding; step: number; outputSize: number }) {
  const size = INPUT_SIZE + padding * 2;
  const activeIndex = Math.min(step, outputSize * outputSize - 1);
  const top = Math.floor(activeIndex / outputSize);
  const left = activeIndex % outputSize;
  return <div className="ck-padding__input-grid" style={{ '--grid-size': size } as CSSProperties} role="img" aria-label={`${size} 乘 ${size} 输入网格，每侧补零 ${padding} 格，卷积窗口位于第 ${top + 1} 行、第 ${left + 1} 列`}>
    {Array.from({ length: size * size }, (_, index) => {
      const row = Math.floor(index / size), col = index % size;
      const isPadding = row < padding || col < padding || row >= size - padding || col >= size - padding;
      const inWindow = row >= top && row < top + KERNEL_SIZE && col >= left && col < left + KERNEL_SIZE;
      return <span key={index} className={`${isPadding ? 'is-padding' : ''} ${inWindow ? 'is-window' : ''}`} />;
    })}
    <div className="ck-padding__window" style={{ left: `${left / size * 100}%`, top: `${top / size * 100}%`, width: `${KERNEL_SIZE / size * 100}%`, height: `${KERNEL_SIZE / size * 100}%` }} />
  </div>;
}

function OutputGrid({ size, step }: { size: number; step: number }) {
  const total = size * size;
  return <div className="ck-padding__output-grid" style={{ '--output-size': size } as CSSProperties} role="img" aria-label={`${size} 乘 ${size} 输出特征图，共 ${total} 个位置，已扫描 ${Math.min(step, total)} 个`}>
    {Array.from({ length: total }, (_, index) => <span key={index} className={index === step && step < total ? 'is-current' : index < step ? 'is-complete' : ''} />)}
  </div>;
}

export function PaddingPage() {
  const [padding, setPadding] = useState<Padding>(1);
  const [step, setStep] = useState(0);
  const paddedSize = INPUT_SIZE + 2 * padding;
  const outputSize = paddedSize - KERNEL_SIZE + 1;
  const totalSteps = outputSize * outputSize;

  useEffect(() => {
    const interval = Math.min(650, Math.max(180, Math.round(16000 / totalSteps)));
    const timer = window.setInterval(() => setStep((current) => (current + 1) % (totalSteps + 1)), interval);
    return () => window.clearInterval(timer);
  }, [totalSteps]);

  const choosePadding = (value: Padding) => { setPadding(value); setStep(0); };

  return <ContentBlock headingLevel={1} className="ck-padding" title="边界填充" subtitle="固定 7 × 7 输入、3 × 3 卷积核与步长 1；在边界外补零，观察输出尺寸如何变化。">
    <div className="ck-padding__workspace">
      <section className="ck-padding__picker" aria-label="选择边界填充">
        <Typography as="h2" variant="h3" tone="accent">填充 P</Typography>
        <div className="ck-padding__choices" role="group" aria-label="每侧补零层数">
          {PADDINGS.map((value) => <button key={value} type="button" className={padding === value ? 'is-selected' : ''} aria-pressed={padding === value} onClick={() => choosePadding(value)}><Typography as="span" variant="h2" tone="inherit">{value}</Typography></button>)}
        </div>
        <Typography variant="bodySmall" tone="muted">填充越多，可放置窗口的位置越多。</Typography>
      </section>
      <section className="ck-padding__input-stage" aria-label="输入网格与当前卷积窗口">
        <Typography as="h2" variant="h3" tone="accent">输入网格 {paddedSize} × {paddedSize}</Typography>
        <InputGrid padding={padding} step={step} outputSize={outputSize} />
        <Typography variant="bodySmall" tone="accent">浅蓝色为边界外补的零 · 每侧 {padding} 格</Typography>
      </section>
      <div className="ck-padding__right">
        <section className="ck-padding__output-stage" aria-label="输出特征图">
          <Typography as="h2" variant="h3" tone="accent">输出特征图 {outputSize} × {outputSize}</Typography>
          <OutputGrid size={outputSize} step={step} />
          <Typography variant="bodySmall" tone="muted">每放置一次窗口，生成一个输出位置。</Typography>
        </section>
        <section className="ck-padding__formula-panel" aria-label="输出尺寸计算">
          <Typography as="h2" variant="h3" tone="accent">输出尺寸</Typography>
          <MathFormulaBlock ariaLabel="步长为一时，输出边长等于输入边长加两倍填充，减卷积核边长再加一"><MathFormulaStatic latex={String.raw`N_{\mathrm{out}}=N_{\mathrm{in}}+2P-K+1`} /></MathFormulaBlock>
          <Typography variant="bodySmall" tone="muted">步长固定为 1 · 每侧填充 P</Typography>
        </section>
      </div>
    </div>
  </ContentBlock>;
}
