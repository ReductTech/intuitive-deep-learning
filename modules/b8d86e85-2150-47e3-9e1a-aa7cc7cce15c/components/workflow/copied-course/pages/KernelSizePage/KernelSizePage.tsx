import { useEffect, useState, type CSSProperties } from 'react';
import { ContentBlock, MathFormulaBlock, MathFormulaStatic, Typography } from "@shuku/course-style/react";
import './KernelSizePage.css';

const INPUT_SIZE = 7;
const KERNELS = [3, 5, 7] as const;
type KernelSize = typeof KERNELS[number];

function InputGrid({ kernelSize, activeIndex, outputSize }: { kernelSize: KernelSize; activeIndex: number; outputSize: number }) {
  const row = Math.floor(activeIndex / outputSize);
  const col = activeIndex % outputSize;
  return <div shuku-edit-id="e-0fee5879-c409-4d00-8a05-760c1dad5cd6" className="cg-copy-ck-kernel-size__input-grid" role="img" aria-label={`7 乘 7 输入网格，${kernelSize} 乘 ${kernelSize} 卷积窗口位于第 ${row + 1} 行、第 ${col + 1} 列`}>
    {Array.from({ length: INPUT_SIZE * INPUT_SIZE }, (_, index) => {
      const cellRow = Math.floor(index / INPUT_SIZE);
      const cellCol = index % INPUT_SIZE;
      const inside = cellRow >= row && cellRow < row + kernelSize && cellCol >= col && cellCol < col + kernelSize;
      return <span shuku-edit-id="e-fe3b8bfd-7fc0-447b-b457-06c6c96b106a" key={index} className={inside ? 'is-inside' : ''} />;
    })}
    <div shuku-edit-id="e-7c59d561-408d-4bf5-9b6e-f1fdcc1f7c5a" className="cg-copy-ck-kernel-size__window" style={{ left: `${col / INPUT_SIZE * 100}%`, top: `${row / INPUT_SIZE * 100}%`, width: `${kernelSize / INPUT_SIZE * 100}%`, height: `${kernelSize / INPUT_SIZE * 100}%` }} />
  </div>;
}

function OutputGrid({ size, step }: { size: number; step: number }) {
  const total = size * size;
  return <div shuku-edit-id="e-869cc734-edc6-4465-8506-0e7865850cc5" className="cg-copy-ck-kernel-size__output-grid" style={{ '--output-size': size } as CSSProperties} role="img" aria-label={`${size} 乘 ${size} 输出网格，共 ${total} 个位置，已扫描 ${Math.min(step, total)} 个`}>
    {Array.from({ length: total }, (_, index) => <span shuku-edit-id="e-d09ae4ea-e1d4-4c48-8367-e5856645500c" key={index} className={index === step && step < total ? 'is-current' : index < step ? 'is-complete' : ''} />)}
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

  return <ContentBlock shuku-edit-id="e-d2d9202b-286a-4ced-bad2-da8d32858c43" headingLevel={1} className="cg-copy-ck-kernel-size" title="Kernel size：卷积核有多大？" subtitle="固定 7 × 7 输入、Valid 和 Stride = 1；改变卷积核大小，观察窗口能放下多少次。">
    <div shuku-edit-id="e-8e5e31ab-b29b-4193-8d7a-5345aa74571a" className="cg-copy-ck-kernel-size__workspace">
      <section shuku-edit-id="e-2ab8a4b8-0d34-4b01-aa80-5e1652bd3d4e" className="cg-copy-ck-kernel-size__picker" aria-label="选择卷积核尺寸">
        <Typography shuku-edit-id="e-2b0b5e38-c10e-455f-948c-a56ee6151da2" as="h2" variant="h3" tone="accent">卷积核尺寸</Typography>
        <div shuku-edit-id="e-43b40f70-02e9-4572-8c29-b49dcb6ce9cb" className="cg-copy-ck-kernel-size__choices" role="group" aria-label="选择卷积核尺寸">
          {KERNELS.map((size) => <button shuku-edit-id="e-ab924349-cb98-42d9-80fc-a263d2207303" key={size} type="button" className={kernelSize === size ? 'is-selected' : ''} aria-pressed={kernelSize === size} onClick={() => chooseKernel(size)}><Typography shuku-edit-id="e-d0e61fc9-0078-4f5f-97a7-d43394b71ee8" as="span" variant="h2" tone="inherit">{size} × {size}</Typography></button>)}
        </div>
        <Typography shuku-edit-id="e-45424c09-756f-4c71-8c2e-feb0aa0bf10a" variant="bodySmall" tone="muted" className="cg-copy-ck-kernel-size__picker-note">核越大，可放置的位置越少。</Typography>
      </section>

      <section shuku-edit-id="e-b96e4f87-80c7-4979-8dd3-6b64ef411c0b" className="cg-copy-ck-kernel-size__input-stage" aria-label="输入网格与当前扫描窗口">
        <Typography shuku-edit-id="e-a0f4475a-5dc6-47fb-a647-38d4e18ce0d9" as="h2" variant="h3" tone="accent">输入网格 7 × 7</Typography>
        <InputGrid kernelSize={kernelSize} activeIndex={activeIndex} outputSize={outputSize} />
        <Typography shuku-edit-id="e-b8d8794f-c913-4c30-962f-627beb752c1b" variant="bodySmall" tone="accent">当前窗口 {kernelSize} × {kernelSize} · 第 {Math.min(step + 1, totalSteps)} / {totalSteps} 个位置</Typography>
      </section>

      <div shuku-edit-id="e-205f6d83-7655-49c1-ba5b-2930635acf61" className="cg-copy-ck-kernel-size__right">
        <section shuku-edit-id="e-17f42fab-0e6e-4158-8056-bd04d471b1f3" className="cg-copy-ck-kernel-size__output-stage" aria-label="输出特征图">
          <Typography shuku-edit-id="e-b093dcaf-f661-4054-b0ef-c45cb9c58e53" as="h2" variant="h3" tone="accent">输出特征图 {outputSize} × {outputSize}</Typography>
          <OutputGrid size={outputSize} step={step} />
          <Typography shuku-edit-id="e-4c4bed50-8fc7-45f9-9240-e09770ffe91d" variant="bodySmall" tone="muted">每放置一次窗口，生成一个输出位置。</Typography>
        </section>
        <section shuku-edit-id="e-b7223f66-c34a-40ad-9c80-8108f2870e7a" className="cg-copy-ck-kernel-size__formula-panel" aria-label="输出尺寸计算">
          <Typography shuku-edit-id="e-f1d7e440-e3f2-4d11-bbd6-3e4f824c0131" as="h2" variant="h3" tone="accent">输出尺寸</Typography>
          <MathFormulaBlock ariaLabel="Valid 且步长为一时，输出尺寸等于输入尺寸减去卷积核尺寸加一"><MathFormulaStatic latex={String.raw`N_{out}=N_{in}-K+1`} /></MathFormulaBlock>
          <Typography shuku-edit-id="e-4ac8b9fd-ffca-4529-9bc6-3a0a077ba8a4" variant="bodySmall" tone="accent">本例：7 − {kernelSize} + 1 = {outputSize}，因此输出为 {outputSize} × {outputSize}。</Typography>
        </section>
      </div>
    </div>
  </ContentBlock>;
}
