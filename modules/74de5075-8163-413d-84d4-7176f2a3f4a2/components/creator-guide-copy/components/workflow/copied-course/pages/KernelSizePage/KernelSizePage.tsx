import { useEffect, useState, type CSSProperties } from 'react';
import { ContentBlock, MathFormulaBlock, MathFormulaStatic, Typography } from "@shuku/course-style/react";
import './KernelSizePage.css';

const INPUT_SIZE = 7;
const KERNELS = [3, 5, 7] as const;
type KernelSize = typeof KERNELS[number];

function InputGrid({ kernelSize, activeIndex, outputSize }: { kernelSize: KernelSize; activeIndex: number; outputSize: number }) {
  const row = Math.floor(activeIndex / outputSize);
  const col = activeIndex % outputSize;
  return <div shuku-edit-id="e-043a5a59-a64e-4985-8ed8-4ebf880d2712" className="aipe-replay-cg-copy-ck-kernel-size__input-grid" role="img" aria-label={`7 乘 7 输入网格，${kernelSize} 乘 ${kernelSize} 卷积窗口位于第 ${row + 1} 行、第 ${col + 1} 列`}>
    {Array.from({ length: INPUT_SIZE * INPUT_SIZE }, (_, index) => {
      const cellRow = Math.floor(index / INPUT_SIZE);
      const cellCol = index % INPUT_SIZE;
      const inside = cellRow >= row && cellRow < row + kernelSize && cellCol >= col && cellCol < col + kernelSize;
      return <span shuku-edit-id="e-5d0ef376-f0b9-472f-90cb-1cfdfa0641b8" key={index} className={inside ? 'is-inside' : ''} />;
    })}
    <div shuku-edit-id="e-44a23ac9-5419-4195-a1ed-0db1a6389ef5" className="aipe-replay-cg-copy-ck-kernel-size__window" style={{ left: `${col / INPUT_SIZE * 100}%`, top: `${row / INPUT_SIZE * 100}%`, width: `${kernelSize / INPUT_SIZE * 100}%`, height: `${kernelSize / INPUT_SIZE * 100}%` }} />
  </div>;
}

function OutputGrid({ size, step }: { size: number; step: number }) {
  const total = size * size;
  return <div shuku-edit-id="e-7c05ed9f-7c81-4889-9bf3-2670c71c86e0" className="aipe-replay-cg-copy-ck-kernel-size__output-grid" style={{ '--output-size': size } as CSSProperties} role="img" aria-label={`${size} 乘 ${size} 输出网格，共 ${total} 个位置，已扫描 ${Math.min(step, total)} 个`}>
    {Array.from({ length: total }, (_, index) => <span shuku-edit-id="e-a2b8201f-3845-49a9-8f57-dc5c5fbb5147" key={index} className={index === step && step < total ? 'is-current' : index < step ? 'is-complete' : ''} />)}
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

  return <ContentBlock shuku-edit-id="e-997d9219-24bd-4cad-8eda-425abcdbdc6b" headingLevel={1} className="aipe-replay-cg-copy-ck-kernel-size" title="Kernel size：卷积核有多大？" subtitle="固定 7 × 7 输入、Valid 和 Stride = 1；改变卷积核大小，观察窗口能放下多少次。">
    <div shuku-edit-id="e-87ff08ad-d538-4d08-a20e-2cbb048f09c4" className="aipe-replay-cg-copy-ck-kernel-size__workspace">
      <section shuku-edit-id="e-8d83b1cb-7a3b-4f13-9193-cc430f00c5fc" className="aipe-replay-cg-copy-ck-kernel-size__picker" aria-label="选择卷积核尺寸">
        <Typography shuku-edit-id="e-35ff072f-a47d-49bc-a337-dbfd5c42c2a5" as="h2" variant="h3" tone="accent">卷积核尺寸</Typography>
        <div shuku-edit-id="e-f465bad0-efd6-4fcf-ac5e-4dc2bae9912f" className="aipe-replay-cg-copy-ck-kernel-size__choices" role="group" aria-label="选择卷积核尺寸">
          {KERNELS.map((size) => <button shuku-edit-id="e-5eaac540-b05d-4d5a-a62b-9b7cd9455664" key={size} type="button" className={kernelSize === size ? 'is-selected' : ''} aria-pressed={kernelSize === size} onClick={() => chooseKernel(size)}><Typography shuku-edit-id="e-1b3ec576-d6f7-4f44-a634-360484dbcdc1" as="span" variant="h2" tone="inherit">{size} × {size}</Typography></button>)}
        </div>
        <Typography shuku-edit-id="e-a359089e-809b-4820-97df-315411d9691d" variant="bodySmall" tone="muted" className="aipe-replay-cg-copy-ck-kernel-size__picker-note">核越大，可放置的位置越少。</Typography>
      </section>

      <section shuku-edit-id="e-9ad7aeec-9e55-465c-b90d-97dfe99b469d" className="aipe-replay-cg-copy-ck-kernel-size__input-stage" aria-label="输入网格与当前扫描窗口">
        <Typography shuku-edit-id="e-4a66ea96-b70b-4122-9628-5fda43a232a4" as="h2" variant="h3" tone="accent">输入网格 7 × 7</Typography>
        <InputGrid kernelSize={kernelSize} activeIndex={activeIndex} outputSize={outputSize} />
        <Typography shuku-edit-id="e-a904f51f-c98c-4a02-b5cb-eacc5f467e93" variant="bodySmall" tone="accent">当前窗口 {kernelSize} × {kernelSize} · 第 {Math.min(step + 1, totalSteps)} / {totalSteps} 个位置</Typography>
      </section>

      <div shuku-edit-id="e-3e2ecf6b-4992-492f-8231-ff96ceba532f" className="aipe-replay-cg-copy-ck-kernel-size__right">
        <section shuku-edit-id="e-857ac133-0a0c-481c-88e7-1d4a34b5890c" className="aipe-replay-cg-copy-ck-kernel-size__output-stage" aria-label="输出特征图">
          <Typography shuku-edit-id="e-79328e7d-2c0c-4211-bffe-f43da5aafc4e" as="h2" variant="h3" tone="accent">输出特征图 {outputSize} × {outputSize}</Typography>
          <OutputGrid size={outputSize} step={step} />
          <Typography shuku-edit-id="e-88b029b0-7ab3-435d-afaa-7871ca661026" variant="bodySmall" tone="muted">每放置一次窗口，生成一个输出位置。</Typography>
        </section>
        <section shuku-edit-id="e-596fbdfa-15ed-4d33-96fe-6cca22c95314" className="aipe-replay-cg-copy-ck-kernel-size__formula-panel" aria-label="输出尺寸计算">
          <Typography shuku-edit-id="e-9d055a86-9857-483b-8b06-78298841798e" as="h2" variant="h3" tone="accent">输出尺寸</Typography>
          <MathFormulaBlock ariaLabel="Valid 且步长为一时，输出尺寸等于输入尺寸减去卷积核尺寸加一"><MathFormulaStatic latex={String.raw`N_{out}=N_{in}-K+1`} /></MathFormulaBlock>
          <Typography shuku-edit-id="e-ab06824f-03cb-4986-8feb-20701d33b475" variant="bodySmall" tone="accent">本例：7 − {kernelSize} + 1 = {outputSize}，因此输出为 {outputSize} × {outputSize}。</Typography>
        </section>
      </div>
    </div>
  </ContentBlock>;
}
