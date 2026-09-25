import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { ContentBlock, MathFormulaBlock, MathFormulaStatic, Typography } from '../../../shared/react';
import './PaddingPage.css';

const INPUT_SIZE = 7;
const KERNEL_SIZE = 3;
const MODES = ['Valid', 'Same'] as const;
type PaddingMode = typeof MODES[number];

function InputGrid({ mode, activeIndex }: { mode: PaddingMode; activeIndex: number }) {
  const padding = mode === 'Same' ? 1 : 0;
  const size = INPUT_SIZE + padding * 2;
  const outputSize = mode === 'Same' ? INPUT_SIZE : INPUT_SIZE - KERNEL_SIZE + 1;
  const activeRow = Math.floor(activeIndex / outputSize);
  const activeCol = activeIndex % outputSize;
  return <div className={`ck-padding__input-grid ${mode === 'Same' ? 'is-padded' : ''}`} style={{ '--grid-size': size } as CSSProperties}>{Array.from({ length: size * size }, (_, index) => { const row = Math.floor(index / size); const col = index % size; const isPad = padding > 0 && (row < padding || col < padding || row >= size - padding || col >= size - padding); const inputRow = row - padding; const inputCol = col - padding; const active = inputRow >= activeRow && inputRow < activeRow + KERNEL_SIZE && inputCol >= activeCol && inputCol < activeCol + KERNEL_SIZE; return <span key={index} className={`${isPad ? 'is-pad' : ''} ${active ? 'is-active' : ''}`}>{isPad ? '0' : ''}</span>; })}</div>;
}

function OutputGrid({ size, revealed, activeIndex }: { size: number; revealed: number; activeIndex: number }) {
  return <div className="ck-padding__output-grid" style={{ '--grid-size': size } as CSSProperties}>{Array.from({ length: size * size }, (_, index) => <span key={index} className={index < revealed ? 'is-revealed' : index === activeIndex ? 'is-current' : ''}>{index < revealed ? '·' : ''}</span>)}</div>;
}

export function PaddingPage() {
  const [mode, setMode] = useState<PaddingMode>('Same');
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(true);
  const outputSize = mode === 'Same' ? INPUT_SIZE : INPUT_SIZE - KERNEL_SIZE + 1;
  const totalSteps = outputSize * outputSize;
  useEffect(() => { if (!playing) return undefined; const timer = window.setInterval(() => setStep((current) => (current + 1) % (totalSteps + 1)), 440); return () => window.clearInterval(timer); }, [playing, totalSteps]);
  const activeIndex = Math.min(step, Math.max(0, totalSteps - 1));
  const revealed = Math.min(step, totalSteps);
  const progress = totalSteps ? Math.min(100, (revealed / totalSteps) * 100) : 100;
  const chooseMode = (value: PaddingMode) => { setMode(value); setStep(0); setPlaying(true); };
  const replay = () => { setStep(0); setPlaying(true); };
  const dimensionText = useMemo(() => `7×7 输入 → ${outputSize}×${outputSize} 输出`, [outputSize]);
  return <ContentBlock headingLevel={1} className="ck-padding" title="Padding：让边缘也参与计算" subtitle="在输入边界外补上占位值，控制输出尺寸，也让边缘像素获得和中心相同的机会。">
    <div className="ck-padding__controls"><Typography variant="body" tone="accent">选择边界方式</Typography><div className="ck-padding__segmented" role="group" aria-label="选择边界方式">{MODES.map((value) => <button key={value} type="button" className={mode === value ? 'is-selected' : ''} onClick={() => chooseMode(value)}><Typography as="span" variant="body" tone="inherit">{value}</Typography></button>)}</div><button type="button" className="ck-padding__replay" onClick={replay} aria-label="重播 Padding 扫描演示"><span aria-hidden="true">↻</span><Typography as="span" variant="body" tone="inherit">重播演示</Typography></button></div>
    <div className="ck-padding__workspace">
      <section className="ck-padding__stage"><header><Typography as="h2" variant="h3" tone="accent">输入图像</Typography><Typography variant="bodySmall" tone="muted">7×7 网格{mode === 'Same' ? ' + 1 圈补零' : ''}</Typography></header><div className="ck-padding__input-wrap"><InputGrid mode={mode} activeIndex={activeIndex} /><Typography variant="bodySmall" tone="accent">当前窗口：3×3 · {mode === 'Same' ? '可访问边界' : '只在原图内移动'}</Typography><div className="ck-padding__progress"><span style={{ width: `${progress}%` }} /></div></div><Typography variant="bodySmall" tone="muted">{mode === 'Same' ? '补零后，窗口可以覆盖原图边缘。' : '没有补零，窗口不能越过输入边界。'}</Typography></section>
      <div className="ck-padding__arrow" aria-hidden="true"><Typography as="span" variant="h1" tone="accent">→</Typography></div>
      <section className="ck-padding__stage"><header><Typography as="h2" variant="h3" tone="accent">输出特征图</Typography><Typography variant="bodySmall" tone="muted">{dimensionText}</Typography></header><OutputGrid size={outputSize} revealed={revealed} activeIndex={activeIndex} /><Typography variant="bodySmall" tone="muted">已生成 {revealed} / {totalSteps} 个输出位置</Typography></section>
    </div>
    <div className="ck-padding__formula-panel"><Typography variant="bodySmall" tone="accent">当前设置：3×3 卷积核，Stride = 1</Typography><MathFormulaBlock ariaLabel="包含 Padding 的输出尺寸公式"><MathFormulaStatic latex={String.raw`H_{out}=\left\lfloor\frac{H_{in}+2P_h-K_h}{S_h}\right\rfloor+1\qquad W_{out}=\left\lfloor\frac{W_{in}+2P_w-K_w}{S_w}\right\rfloor+1`} /></MathFormulaBlock><div className="ck-padding__examples"><Typography variant="bodySmall" tone="muted">7×7 输入，3×3 卷积核：</Typography><Typography variant="bodySmall" tone="accent">Valid（P=0）→ 5×5</Typography><Typography variant="bodySmall" tone="accent">Same（P=1）→ 7×7</Typography></div></div>
  </ContentBlock>;
}
