import { useEffect, useState, type CSSProperties } from 'react';
import { ContentBlock, MathFormulaBlock, MathFormulaStatic, Typography } from "@shuku/course-style/react";
import './KernelSizePage.css';

const INPUT_SIZE = 7;
const KERNELS = [3, 5, 7] as const;
type KernelSize = typeof KERNELS[number];

function InputGrid({ kernelSize, activeIndex, outputSize }: { kernelSize: KernelSize; activeIndex: number; outputSize: number }) {
  const row = Math.floor(activeIndex / outputSize);
  const col = activeIndex % outputSize;
  return <div shuku-edit-id="e-4dbbcf3d-ed93-4e08-8fe0-a05189416cd5" className="aipe-replay-cg-copy-ck-kernel-size__input-grid" role="img" aria-label={`7 乘 7 输入网格，${kernelSize} 乘 ${kernelSize} 卷积窗口位于第 ${row + 1} 行、第 ${col + 1} 列`}>
    {Array.from({ length: INPUT_SIZE * INPUT_SIZE }, (_, index) => {
      const cellRow = Math.floor(index / INPUT_SIZE);
      const cellCol = index % INPUT_SIZE;
      const inside = cellRow >= row && cellRow < row + kernelSize && cellCol >= col && cellCol < col + kernelSize;
      return <span shuku-edit-id="e-d7d4f1f7-00ea-4e4d-abee-167b6aaa571f" key={index} className={inside ? 'is-inside' : ''} />;
    })}
    <div shuku-edit-id="e-63de7013-b477-48fa-bf8f-fc564e83213e" className="aipe-replay-cg-copy-ck-kernel-size__window" style={{ left: `${col / INPUT_SIZE * 100}%`, top: `${row / INPUT_SIZE * 100}%`, width: `${kernelSize / INPUT_SIZE * 100}%`, height: `${kernelSize / INPUT_SIZE * 100}%` }} />
  </div>;
}

function OutputGrid({ size, step }: { size: number; step: number }) {
  const total = size * size;
  return <div shuku-edit-id="e-95dd313f-e77c-47f6-8bc8-449c5c7ee79a" className="aipe-replay-cg-copy-ck-kernel-size__output-grid" style={{ '--output-size': size } as CSSProperties} role="img" aria-label={`${size} 乘 ${size} 输出网格，共 ${total} 个位置，已扫描 ${Math.min(step, total)} 个`}>
    {Array.from({ length: total }, (_, index) => <span shuku-edit-id="e-5ab2c0ba-2bae-4ff3-aa7a-2101bc8e1b59" key={index} className={index === step && step < total ? 'is-current' : index < step ? 'is-complete' : ''} />)}
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

  return <ContentBlock shuku-edit-id="e-ed2d4b8c-3884-4e1d-822b-c410332f4d7d" headingLevel={1} className="aipe-replay-cg-copy-ck-kernel-size" title="Kernel size：卷积核有多大？" subtitle="固定 7 × 7 输入、Valid 和 Stride = 1；改变卷积核大小，观察窗口能放下多少次。">
    <div shuku-edit-id="e-d332ad11-c2ae-4fb6-a710-3aea4695cf91" className="aipe-replay-cg-copy-ck-kernel-size__workspace">
      <section shuku-edit-id="e-a4787018-a206-45c0-b2d0-76c15f71763f" className="aipe-replay-cg-copy-ck-kernel-size__picker" aria-label="选择卷积核尺寸">
        <Typography shuku-edit-id="e-4078784e-b7f1-4b90-b80a-d2c6fbb67aa5" as="h2" variant="h3" tone="accent">卷积核尺寸</Typography>
        <div shuku-edit-id="e-a892e7ae-338b-4be8-8505-d74ac247c629" className="aipe-replay-cg-copy-ck-kernel-size__choices" role="group" aria-label="选择卷积核尺寸">
          {KERNELS.map((size) => <button shuku-edit-id="e-89ca9aa9-7f74-44d8-a4a9-e55a06f602dd" key={size} type="button" className={kernelSize === size ? 'is-selected' : ''} aria-pressed={kernelSize === size} onClick={() => chooseKernel(size)}><Typography shuku-edit-id="e-b8724fe0-91c4-48b5-91ce-b94c20e7c0ba" as="span" variant="h2" tone="inherit">{size} × {size}</Typography></button>)}
        </div>
        <Typography shuku-edit-id="e-2a127f57-2bda-44a6-a325-bf98f9e100ce" variant="bodySmall" tone="muted" className="aipe-replay-cg-copy-ck-kernel-size__picker-note">核越大，可放置的位置越少。</Typography>
      </section>

      <section shuku-edit-id="e-5b12701b-a191-4ebc-b4ba-e589797f9e13" className="aipe-replay-cg-copy-ck-kernel-size__input-stage" aria-label="输入网格与当前扫描窗口">
        <Typography shuku-edit-id="e-724fae29-f128-40ec-be8f-bd9fc99f6394" as="h2" variant="h3" tone="accent">输入网格 7 × 7</Typography>
        <InputGrid kernelSize={kernelSize} activeIndex={activeIndex} outputSize={outputSize} />
        <Typography shuku-edit-id="e-bebc67a4-5cec-42b0-9089-086aee9ea787" variant="bodySmall" tone="accent">当前窗口 {kernelSize} × {kernelSize} · 第 {Math.min(step + 1, totalSteps)} / {totalSteps} 个位置</Typography>
      </section>

      <div shuku-edit-id="e-ffffe4d9-8b80-4bab-89bc-f9dec03732d1" className="aipe-replay-cg-copy-ck-kernel-size__right">
        <section shuku-edit-id="e-8079b352-bd7c-4a8e-a913-d6fb61df0a49" className="aipe-replay-cg-copy-ck-kernel-size__output-stage" aria-label="输出特征图">
          <Typography shuku-edit-id="e-694c01f5-3828-45aa-aa8d-d5c5f22bfb0e" as="h2" variant="h3" tone="accent">输出特征图 {outputSize} × {outputSize}</Typography>
          <OutputGrid size={outputSize} step={step} />
          <Typography shuku-edit-id="e-b0e5d2a3-f34e-4021-9655-fa6257a0d19e" variant="bodySmall" tone="muted">每放置一次窗口，生成一个输出位置。</Typography>
        </section>
        <section shuku-edit-id="e-476b724c-d184-44ca-80ba-bdb50f60a42b" className="aipe-replay-cg-copy-ck-kernel-size__formula-panel" aria-label="输出尺寸计算">
          <Typography shuku-edit-id="e-2f924746-23ba-437f-afc0-33821016809d" as="h2" variant="h3" tone="accent">输出尺寸</Typography>
          <MathFormulaBlock ariaLabel="Valid 且步长为一时，输出尺寸等于输入尺寸减去卷积核尺寸加一"><MathFormulaStatic latex={String.raw`N_{out}=N_{in}-K+1`} /></MathFormulaBlock>
          <Typography shuku-edit-id="e-1f95b80c-9bba-4ca1-9d97-3259211f12c0" variant="bodySmall" tone="accent">本例：7 − {kernelSize} + 1 = {outputSize}，因此输出为 {outputSize} × {outputSize}。</Typography>
        </section>
      </div>
    </div>
  </ContentBlock>;
}
