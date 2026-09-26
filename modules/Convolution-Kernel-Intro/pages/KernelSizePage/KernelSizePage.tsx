import { useEffect, useState, type CSSProperties } from 'react';
import { ContentBlock, MathFormulaBlock, MathFormulaStatic, Typography } from '../../../shared/react';
import './KernelSizePage.css';

const INPUT_SIZE = 7;
const KERNELS = [3, 5, 7] as const;
type KernelSize = typeof KERNELS[number];

function InputGrid({ kernelSize, activeIndex, outputSize }: { kernelSize: KernelSize; activeIndex: number; outputSize: number }) {
  const row = Math.floor(activeIndex / outputSize);
  const col = activeIndex % outputSize;
  return <div className="ck-kernel-size__input-grid" role="img" aria-label={`7 乘 7 输入网格，${kernelSize} 乘 ${kernelSize} 卷积窗口位于第 ${row + 1} 行、第 ${col + 1} 列`}>
    {Array.from({ length: INPUT_SIZE * INPUT_SIZE }, (_, index) => {
      const cellRow = Math.floor(index / INPUT_SIZE);
      const cellCol = index % INPUT_SIZE;
      const inside = cellRow >= row && cellRow < row + kernelSize && cellCol >= col && cellCol < col + kernelSize;
      return <span key={index} className={inside ? 'is-inside' : ''} />;
    })}
    <div className="ck-kernel-size__window" style={{ left: `${col / INPUT_SIZE * 100}%`, top: `${row / INPUT_SIZE * 100}%`, width: `${kernelSize / INPUT_SIZE * 100}%`, height: `${kernelSize / INPUT_SIZE * 100}%` }} />
  </div>;
}

function OutputGrid({ size, step }: { size: number; step: number }) {
  const total = size * size;
  return <div className="ck-kernel-size__output-grid" style={{ '--output-size': size } as CSSProperties} role="img" aria-label={`${size} 乘 ${size} 输出网格，共 ${total} 个位置，已扫描 ${Math.min(step, total)} 个`}>
    {Array.from({ length: total }, (_, index) => <span key={index} className={index === step && step < total ? 'is-current' : index < step ? 'is-complete' : ''} />)}
  </div>;
}

export function KernelSizePage() {
  const [kernelSize, setKernelSize] = useState<KernelSize>(5);
  const [step, setStep] = useState(0);
  const outputSize = INPUT_SIZE - kernelSize + 1;
  const totalSteps = outputSize * outputSize;
  const activeIndex = Math.min(step, totalSteps - 1);

  useEffect(() => {
    const timer = window.setInterval(() => setStep((current) => (current + 1) % (totalSteps + 1)), 650);
    return () => window.clearInterval(timer);
  }, [totalSteps]);

  const chooseKernel = (size: KernelSize) => { setKernelSize(size); setStep(0); };

  return <ContentBlock headingLevel={1} className="ck-kernel-size" title="Kernel size：卷积核有多大？" subtitle="固定 7 × 7 输入、Valid 和 Stride = 1；改变卷积核大小，观察窗口能放下多少次。">
    <div className="ck-kernel-size__workspace">
      <section className="ck-kernel-size__picker" aria-label="选择卷积核尺寸">
        <Typography as="h2" variant="h3" tone="accent">卷积核尺寸</Typography>
        <div className="ck-kernel-size__choices" role="group" aria-label="选择卷积核尺寸">
          {KERNELS.map((size) => <button key={size} type="button" className={kernelSize === size ? 'is-selected' : ''} aria-pressed={kernelSize === size} onClick={() => chooseKernel(size)}><Typography as="span" variant="h2" tone="inherit">{size} × {size}</Typography></button>)}
        </div>
        <Typography variant="bodySmall" tone="muted" className="ck-kernel-size__picker-note">核越大，可放置的位置越少。</Typography>
      </section>

      <section className="ck-kernel-size__input-stage" aria-label="输入网格与当前扫描窗口">
        <Typography as="h2" variant="h3" tone="accent">输入网格 7 × 7</Typography>
        <InputGrid kernelSize={kernelSize} activeIndex={activeIndex} outputSize={outputSize} />
        <Typography variant="bodySmall" tone="accent">当前窗口 {kernelSize} × {kernelSize} · 第 {Math.min(step + 1, totalSteps)} / {totalSteps} 个位置</Typography>
      </section>

      <div className="ck-kernel-size__right">
        <section className="ck-kernel-size__output-stage" aria-label="输出特征图">
          <Typography as="h2" variant="h3" tone="accent">输出特征图 {outputSize} × {outputSize}</Typography>
          <OutputGrid size={outputSize} step={step} />
          <Typography variant="bodySmall" tone="muted">每放置一次窗口，生成一个输出位置。</Typography>
        </section>
        <section className="ck-kernel-size__formula-panel" aria-label="输出尺寸计算">
          <Typography as="h2" variant="h3" tone="accent">输出尺寸</Typography>
          <MathFormulaBlock ariaLabel="Valid 且步长为一时，输出尺寸等于输入尺寸减去卷积核尺寸加一"><MathFormulaStatic latex={String.raw`N_{out}=N_{in}-K+1`} /></MathFormulaBlock>
          <Typography variant="bodySmall" tone="accent">本例：7 − {kernelSize} + 1 = {outputSize}，因此输出为 {outputSize} × {outputSize}。</Typography>
        </section>
      </div>
    </div>
  </ContentBlock>;
}
