import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { ContentBlock, MathFormulaBlock, MathFormulaStatic, Typography } from '../../../shared/react';
import './KernelSizePage.css';

const INPUT_SIZE = 7;
const KERNELS = [3, 5, 7] as const;
type KernelSize = typeof KERNELS[number];

function Grid({ size, kernelSize, activeIndex, revealed }: { size: number; kernelSize: number; activeIndex: number; revealed: number }) {
  const outputSize = size - kernelSize + 1;
  const cells = Array.from({ length: size * size }, (_, index) => index);
  const activeRow = Math.floor(activeIndex / Math.max(1, outputSize));
  const activeCol = activeIndex % Math.max(1, outputSize);
  const active = (row: number, col: number) => row >= activeRow && row < activeRow + kernelSize && col >= activeCol && col < activeCol + kernelSize;
  return (
    <div className={`ck-kernel-size__grid ck-kernel-size__grid--${size}`} style={{ '--grid-size': size } as CSSProperties}>
      {cells.map((index) => {
        const row = Math.floor(index / size);
        const col = index % size;
        return <span key={index} className={active(row, col) ? 'is-active' : ''} />;
      })}
    </div>
  );
}

function OutputGrid({ size, revealed, activeIndex }: { size: number; revealed: number; activeIndex: number }) {
  return <div className="ck-kernel-size__output-grid" style={{ '--grid-size': size } as CSSProperties}>{Array.from({ length: size * size }, (_, index) => <span key={index} className={index < revealed ? 'is-revealed' : index === activeIndex ? 'is-current' : ''}>{index < revealed ? '·' : ''}</span>)}</div>;
}

export function KernelSizePage() {
  const [kernelSize, setKernelSize] = useState<KernelSize>(5);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(true);
  const outputSize = INPUT_SIZE - kernelSize + 1;
  const totalSteps = outputSize * outputSize;

  useEffect(() => {
    if (!playing) return undefined;
    const timer = window.setInterval(() => setStep((current) => (current + 1) % (totalSteps + 1)), 430);
    return () => window.clearInterval(timer);
  }, [playing, totalSteps]);

  const activeIndex = Math.min(step, Math.max(0, totalSteps - 1));
  const revealed = Math.min(step, totalSteps);
  const progress = totalSteps ? Math.min(100, (revealed / totalSteps) * 100) : 100;
  const dimensionText = useMemo(() => `${INPUT_SIZE}×${INPUT_SIZE} 输入 → ${outputSize}×${outputSize} 输出`, [outputSize]);

  const chooseKernel = (size: KernelSize) => {
    setKernelSize(size);
    setStep(0);
    setPlaying(true);
  };
  const replay = () => {
    setStep(0);
    setPlaying(true);
  };

  return (
    <ContentBlock headingLevel={1} className="ck-kernel-size" title="Kernel size：卷积核有多大？" subtitle="在 Valid、Stride = 1 的条件下，卷积核越大，能够放置的位置越少，输出特征图也越小。">
      <div className="ck-kernel-size__controls">
        <Typography variant="body" tone="accent">选择卷积核大小</Typography>
        <div className="ck-kernel-size__segmented" role="group" aria-label="选择卷积核大小">
          {KERNELS.map((size) => <button key={size} type="button" className={kernelSize === size ? 'is-selected' : ''} onClick={() => chooseKernel(size)}><Typography as="span" variant="body" tone="inherit">{size}×{size}</Typography></button>)}
        </div>
        <button type="button" className="ck-kernel-size__replay" onClick={replay} aria-label="重播扫描演示"><span aria-hidden="true">↻</span><Typography as="span" variant="body" tone="inherit">重播演示</Typography></button>
      </div>

      <div className="ck-kernel-size__workspace">
        <section className="ck-kernel-size__stage">
          <header><Typography as="h2" variant="h3" tone="accent">输入图像</Typography><Typography variant="bodySmall" tone="muted">{INPUT_SIZE}×{INPUT_SIZE} 网格</Typography></header>
          <div className="ck-kernel-size__input-wrap"><Grid size={INPUT_SIZE} kernelSize={kernelSize} activeIndex={activeIndex} revealed={revealed} /><div className="ck-kernel-size__scan-caption"><Typography variant="bodySmall" tone="accent">当前窗口：{kernelSize}×{kernelSize}</Typography><div className="ck-kernel-size__progress"><span style={{ width: `${progress}%` }} /></div></div></div>
          <Typography variant="bodySmall" tone="muted">每次移动一个像素，直到窗口无法再放置。</Typography>
        </section>
        <div className="ck-kernel-size__arrow" aria-hidden="true"><Typography as="span" variant="h1" tone="accent">→</Typography></div>
        <section className="ck-kernel-size__stage ck-kernel-size__stage--output">
          <header><Typography as="h2" variant="h3" tone="accent">输出特征图</Typography><Typography variant="bodySmall" tone="muted">{dimensionText}</Typography></header>
          <OutputGrid size={outputSize} revealed={revealed} activeIndex={Math.min(activeIndex, totalSteps - 1)} />
          <Typography variant="bodySmall" tone="muted">已生成 {revealed} / {totalSteps} 个输出位置</Typography>
        </section>
      </div>

      <div className="ck-kernel-size__formula-panel">
        <Typography variant="bodySmall" tone="accent">当前设置：Valid，Stride = 1</Typography>
        <MathFormulaBlock ariaLabel="Valid 模式下输出尺寸公式"><MathFormulaStatic latex={String.raw`H_{out}=H_{in}-K_h+1\qquad W_{out}=W_{in}-K_w+1`} /></MathFormulaBlock>
        <div className="ck-kernel-size__examples"><Typography variant="bodySmall" tone="muted">7×7 输入：</Typography><Typography variant="bodySmall" tone="accent">3×3 → 5×5</Typography><Typography variant="bodySmall" tone="accent">5×5 → 3×3</Typography><Typography variant="bodySmall" tone="accent">7×7 → 1×1</Typography></div>
      </div>
    </ContentBlock>
  );
}
