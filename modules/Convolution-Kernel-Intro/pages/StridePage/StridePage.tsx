import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { ContentBlock, MathFormulaBlock, MathFormulaStatic, Typography } from '../../../shared/react';
import './StridePage.css';

const INPUT_SIZE = 7;
const KERNEL_SIZE = 3;
const STRIDES = [1, 2, 3] as const;
type Stride = typeof STRIDES[number];

function InputGrid({ stride, activeIndex }: { stride: Stride; activeIndex: number }) {
  const outputSize = Math.floor((INPUT_SIZE - KERNEL_SIZE) / stride) + 1;
  const activeRow = Math.floor(activeIndex / outputSize) * stride;
  const activeCol = (activeIndex % outputSize) * stride;
  return <div className="ck-stride__input-grid" style={{ '--grid-size': INPUT_SIZE } as CSSProperties}>{Array.from({ length: INPUT_SIZE * INPUT_SIZE }, (_, index) => { const row = Math.floor(index / INPUT_SIZE); const col = index % INPUT_SIZE; const active = row >= activeRow && row < activeRow + KERNEL_SIZE && col >= activeCol && col < activeCol + KERNEL_SIZE; return <span key={index} className={active ? 'is-active' : ''} />; })}</div>;
}

function OutputGrid({ size, revealed, activeIndex }: { size: number; revealed: number; activeIndex: number }) {
  return <div className="ck-stride__output-grid" style={{ '--grid-size': size } as CSSProperties}>{Array.from({ length: size * size }, (_, index) => <span key={index} className={index < revealed ? 'is-revealed' : index === activeIndex ? 'is-current' : ''}>{index < revealed ? '·' : ''}</span>)}</div>;
}

export function StridePage() {
  const [stride, setStride] = useState<Stride>(2);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(true);
  const outputSize = Math.floor((INPUT_SIZE - KERNEL_SIZE) / stride) + 1;
  const totalSteps = outputSize * outputSize;
  useEffect(() => { if (!playing) return undefined; const timer = window.setInterval(() => setStep((current) => (current + 1) % (totalSteps + 1)), 440); return () => window.clearInterval(timer); }, [playing, totalSteps]);
  const activeIndex = Math.min(step, Math.max(0, totalSteps - 1));
  const revealed = Math.min(step, totalSteps);
  const progress = totalSteps ? Math.min(100, (revealed / totalSteps) * 100) : 100;
  const chooseStride = (value: Stride) => { setStride(value); setStep(0); setPlaying(true); };
  const replay = () => { setStep(0); setPlaying(true); };
  const dimensionText = useMemo(() => `7×7 输入 → ${outputSize}×${outputSize} 输出`, [outputSize]);
  return <ContentBlock headingLevel={1} className="ck-stride" title="Stride：卷积核每次移动几格？" subtitle="在 Valid、3×3 卷积核固定时，步长越大，窗口跳得越远，可放置的位置越少。">
    <div className="ck-stride__controls"><Typography variant="body" tone="accent">选择步长</Typography><div className="ck-stride__segmented" role="group" aria-label="选择步长">{STRIDES.map((value) => <button key={value} type="button" className={stride === value ? 'is-selected' : ''} onClick={() => chooseStride(value)}><Typography as="span" variant="body" tone="inherit">{value}</Typography></button>)}</div><button type="button" className="ck-stride__replay" onClick={replay} aria-label="重播步长扫描演示"><span aria-hidden="true">↻</span><Typography as="span" variant="body" tone="inherit">重播演示</Typography></button></div>
    <div className="ck-stride__workspace">
      <section className="ck-stride__stage"><header><Typography as="h2" variant="h3" tone="accent">输入图像</Typography><Typography variant="bodySmall" tone="muted">7×7 网格</Typography></header><div className="ck-stride__input-wrap"><InputGrid stride={stride} activeIndex={activeIndex} /><Typography variant="bodySmall" tone="accent">当前窗口：3×3 · 每次跳 {stride} 格</Typography><div className="ck-stride__progress"><span style={{ width: `${progress}%` }} /></div></div><Typography variant="bodySmall" tone="muted">步长决定下一次窗口从哪里开始。</Typography></section>
      <div className="ck-stride__arrow" aria-hidden="true"><Typography as="span" variant="h1" tone="accent">→</Typography></div>
      <section className="ck-stride__stage"><header><Typography as="h2" variant="h3" tone="accent">输出特征图</Typography><Typography variant="bodySmall" tone="muted">{dimensionText}</Typography></header><OutputGrid size={outputSize} revealed={revealed} activeIndex={activeIndex} /><Typography variant="bodySmall" tone="muted">已生成 {revealed} / {totalSteps} 个输出位置</Typography></section>
    </div>
    <div className="ck-stride__formula-panel"><Typography variant="bodySmall" tone="accent">当前设置：Valid，3×3 卷积核</Typography><MathFormulaBlock ariaLabel="包含步长的输出尺寸公式"><MathFormulaStatic latex={String.raw`H_{out}=\left\lfloor\frac{H_{in}-K_h}{S_h}\right\rfloor+1\qquad W_{out}=\left\lfloor\frac{W_{in}-K_w}{S_w}\right\rfloor+1`} /></MathFormulaBlock><div className="ck-stride__examples"><Typography variant="bodySmall" tone="muted">7×7 输入，3×3 卷积核：</Typography><Typography variant="bodySmall" tone="accent">Stride 1 → 5×5</Typography><Typography variant="bodySmall" tone="accent">Stride 2 → 3×3</Typography><Typography variant="bodySmall" tone="accent">Stride 3 → 2×2</Typography></div></div>
  </ContentBlock>;
}
