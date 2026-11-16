import { useEffect, useState, type CSSProperties } from 'react';
import { ContentBlock, MathFormulaBlock, MathFormulaStatic, Typography } from "@shuku/course-style/react";
import './KernelSizePage.css';

const INPUT_SIZE = 7;
const KERNELS = [3, 5, 7] as const;
type KernelSize = typeof KERNELS[number];

function InputGrid({ kernelSize, activeIndex, outputSize }: { kernelSize: KernelSize; activeIndex: number; outputSize: number }) {
  const row = Math.floor(activeIndex / outputSize);
  const col = activeIndex % outputSize;
  return <div shuku-edit-id="e-33cf4ccc-3e88-48ac-80ee-6609c113d380" className="cg-copy-ck-kernel-size__input-grid" role="img" aria-label={`7 乘 7 输入网格，${kernelSize} 乘 ${kernelSize} 卷积窗口位于第 ${row + 1} 行、第 ${col + 1} 列`}>
    {Array.from({ length: INPUT_SIZE * INPUT_SIZE }, (_, index) => {
      const cellRow = Math.floor(index / INPUT_SIZE);
      const cellCol = index % INPUT_SIZE;
      const inside = cellRow >= row && cellRow < row + kernelSize && cellCol >= col && cellCol < col + kernelSize;
      return <span shuku-edit-id="e-4a5fa899-16c0-46b4-8cd5-84722ba72b59" key={index} className={inside ? 'is-inside' : ''} />;
    })}
    <div shuku-edit-id="e-31c1be70-f679-41f5-9437-f7907fcc485b" className="cg-copy-ck-kernel-size__window" style={{ left: `${col / INPUT_SIZE * 100}%`, top: `${row / INPUT_SIZE * 100}%`, width: `${kernelSize / INPUT_SIZE * 100}%`, height: `${kernelSize / INPUT_SIZE * 100}%` }} />
  </div>;
}

function OutputGrid({ size, step }: { size: number; step: number }) {
  const total = size * size;
  return <div shuku-edit-id="e-9d1c30cc-00ba-4e72-911d-555fdc05c512" className="cg-copy-ck-kernel-size__output-grid" style={{ '--output-size': size } as CSSProperties} role="img" aria-label={`${size} 乘 ${size} 输出网格，共 ${total} 个位置，已扫描 ${Math.min(step, total)} 个`}>
    {Array.from({ length: total }, (_, index) => <span shuku-edit-id="e-f057585d-af0e-4a32-b6ad-bcb2f4bcb242" key={index} className={index === step && step < total ? 'is-current' : index < step ? 'is-complete' : ''} />)}
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

  return <ContentBlock shuku-edit-id="e-9f87523a-30f2-4481-ae0b-1c3f99d9265d" headingLevel={1} className="cg-copy-ck-kernel-size" title="Kernel size：卷积核有多大？" subtitle="固定 7 × 7 输入、Valid 和 Stride = 1；改变卷积核大小，观察窗口能放下多少次。">
    <div shuku-edit-id="e-40ed3d01-075f-40a0-955e-3c0a33b2ae49" className="cg-copy-ck-kernel-size__workspace">
      <section shuku-edit-id="e-697226e2-f61a-4569-9cf6-e4a67ad8fb1c" className="cg-copy-ck-kernel-size__picker" aria-label="选择卷积核尺寸">
        <Typography shuku-edit-id="e-2c5ab287-4e34-49ad-a922-3f65b736cf37" as="h2" variant="h3" tone="accent">卷积核尺寸</Typography>
        <div shuku-edit-id="e-d08ed16f-f5ea-4ea3-812b-f41a23ad840a" className="cg-copy-ck-kernel-size__choices" role="group" aria-label="选择卷积核尺寸">
          {KERNELS.map((size) => <button shuku-edit-id="e-9145c262-9e4a-4db6-b570-6a309d56670e" key={size} type="button" className={kernelSize === size ? 'is-selected' : ''} aria-pressed={kernelSize === size} onClick={() => chooseKernel(size)}><Typography shuku-edit-id="e-5ceee8ab-d894-423f-a7e5-af2bc554a463" as="span" variant="h2" tone="inherit">{size} × {size}</Typography></button>)}
        </div>
        <Typography shuku-edit-id="e-68bd520c-fa58-4a46-b7d0-cfc6b047f361" variant="bodySmall" tone="muted" className="cg-copy-ck-kernel-size__picker-note">核越大，可放置的位置越少。</Typography>
      </section>

      <section shuku-edit-id="e-5dafc7c4-7e01-491b-9c2b-7ecb2173cad4" className="cg-copy-ck-kernel-size__input-stage" aria-label="输入网格与当前扫描窗口">
        <Typography shuku-edit-id="e-e0856fc8-4dae-46b8-88a1-ef08b34585dc" as="h2" variant="h3" tone="accent">输入网格 7 × 7</Typography>
        <InputGrid kernelSize={kernelSize} activeIndex={activeIndex} outputSize={outputSize} />
        <Typography shuku-edit-id="e-d6a38435-3517-4baa-8803-48c1cf92a593" variant="bodySmall" tone="accent">当前窗口 {kernelSize} × {kernelSize} · 第 {Math.min(step + 1, totalSteps)} / {totalSteps} 个位置</Typography>
      </section>

      <div shuku-edit-id="e-7a82087a-40d2-46ec-a063-f165673625ca" className="cg-copy-ck-kernel-size__right">
        <section shuku-edit-id="e-da2db2f7-7d20-4ff6-b893-5d20742ab2f3" className="cg-copy-ck-kernel-size__output-stage" aria-label="输出特征图">
          <Typography shuku-edit-id="e-a36a4c99-0ec7-49e8-8d2c-2f5ec14cb8b4" as="h2" variant="h3" tone="accent">输出特征图 {outputSize} × {outputSize}</Typography>
          <OutputGrid size={outputSize} step={step} />
          <Typography shuku-edit-id="e-94563839-33a0-4b01-b207-0b508a989ceb" variant="bodySmall" tone="muted">每放置一次窗口，生成一个输出位置。</Typography>
        </section>
        <section shuku-edit-id="e-688c7d97-e6d9-4727-899d-0422d9e0298f" className="cg-copy-ck-kernel-size__formula-panel" aria-label="输出尺寸计算">
          <Typography shuku-edit-id="e-0b8041cb-d4b3-4c14-80f6-3cefc4fff5f6" as="h2" variant="h3" tone="accent">输出尺寸</Typography>
          <MathFormulaBlock ariaLabel="Valid 且步长为一时，输出尺寸等于输入尺寸减去卷积核尺寸加一"><MathFormulaStatic latex={String.raw`N_{out}=N_{in}-K+1`} /></MathFormulaBlock>
          <Typography shuku-edit-id="e-86bb2f2f-acd6-4f95-b85b-37d8e0cd952e" variant="bodySmall" tone="accent">本例：7 − {kernelSize} + 1 = {outputSize}，因此输出为 {outputSize} × {outputSize}。</Typography>
        </section>
      </div>
    </div>
  </ContentBlock>;
}
