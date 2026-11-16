import { useEffect, useState, type CSSProperties } from 'react';
import { ContentBlock, MathFormulaBlock, MathFormulaStatic, Typography } from "@shuku/course-style/react";
import './KernelSizePage.css';

const INPUT_SIZE = 7;
const KERNELS = [3, 5, 7] as const;
type KernelSize = typeof KERNELS[number];

function InputGrid({ kernelSize, activeIndex, outputSize }: { kernelSize: KernelSize; activeIndex: number; outputSize: number }) {
  const row = Math.floor(activeIndex / outputSize);
  const col = activeIndex % outputSize;
  return <div shuku-edit-id="e-936830a2-004d-4d07-935d-7df100fdd981" className="ck-kernel-size__input-grid" role="img" aria-label={`7 乘 7 输入网格，${kernelSize} 乘 ${kernelSize} 卷积窗口位于第 ${row + 1} 行、第 ${col + 1} 列`}>
    {Array.from({ length: INPUT_SIZE * INPUT_SIZE }, (_, index) => {
      const cellRow = Math.floor(index / INPUT_SIZE);
      const cellCol = index % INPUT_SIZE;
      const inside = cellRow >= row && cellRow < row + kernelSize && cellCol >= col && cellCol < col + kernelSize;
      return <span shuku-edit-id="e-61766372-23f3-4b6c-aa20-58d7c3dc4e6b" key={index} className={inside ? 'is-inside' : ''} />;
    })}
    <div shuku-edit-id="e-58ec3232-f7a1-4245-8ea8-216d4dc554cd" className="ck-kernel-size__window" style={{ left: `${col / INPUT_SIZE * 100}%`, top: `${row / INPUT_SIZE * 100}%`, width: `${kernelSize / INPUT_SIZE * 100}%`, height: `${kernelSize / INPUT_SIZE * 100}%` }} />
  </div>;
}

function OutputGrid({ size, step }: { size: number; step: number }) {
  const total = size * size;
  return <div shuku-edit-id="e-db670b85-8ef9-4bf5-9827-65a0b50daeaf" className="ck-kernel-size__output-grid" style={{ '--output-size': size } as CSSProperties} role="img" aria-label={`${size} 乘 ${size} 输出网格，共 ${total} 个位置，已扫描 ${Math.min(step, total)} 个`}>
    {Array.from({ length: total }, (_, index) => <span shuku-edit-id="e-673b5043-9295-4ad9-8cf7-bef13e38d933" key={index} className={index === step && step < total ? 'is-current' : index < step ? 'is-complete' : ''} />)}
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

  return <ContentBlock shuku-edit-id="e-408af291-35b7-4d81-93ce-3a36230a334e" headingLevel={1} className="ck-kernel-size" title="Kernel size：卷积核有多大？" subtitle="固定 7 × 7 输入、Valid 和 Stride = 1；改变卷积核大小，观察窗口能放下多少次。">
    <div shuku-edit-id="e-ef9208fd-b04f-4261-bc12-5043191da9fd" className="ck-kernel-size__workspace">
      <section shuku-edit-id="e-901af208-d6f6-42db-a8e5-77acc23bc666" className="ck-kernel-size__picker" aria-label="选择卷积核尺寸">
        <Typography shuku-edit-id="e-fe090b01-f165-4696-9be8-f57deee45d2a" as="h2" variant="h3" tone="accent">卷积核尺寸</Typography>
        <div shuku-edit-id="e-194c0bb3-bfb7-4610-bc70-d0c837a791f0" className="ck-kernel-size__choices" role="group" aria-label="选择卷积核尺寸">
          {KERNELS.map((size) => <button shuku-edit-id="e-ca23fc35-93f8-45dc-b799-138d634dfc09" key={size} type="button" className={kernelSize === size ? 'is-selected' : ''} aria-pressed={kernelSize === size} onClick={() => chooseKernel(size)}><Typography shuku-edit-id="e-61b8d375-7de5-4f14-b83e-f2a2ee83d4d1" as="span" variant="h2" tone="inherit">{size} × {size}</Typography></button>)}
        </div>
        <Typography shuku-edit-id="e-1ac3d70e-311e-46f2-a739-f99c7beeb1a1" variant="bodySmall" tone="muted" className="ck-kernel-size__picker-note">核越大，可放置的位置越少。</Typography>
      </section>

      <section shuku-edit-id="e-65c4a60b-61e1-4a90-b0da-e5277ea881bc" className="ck-kernel-size__input-stage" aria-label="输入网格与当前扫描窗口">
        <Typography shuku-edit-id="e-15f54b7d-fb2d-4d40-a953-172433b99f6d" as="h2" variant="h3" tone="accent">输入网格 7 × 7</Typography>
        <InputGrid kernelSize={kernelSize} activeIndex={activeIndex} outputSize={outputSize} />
        <Typography shuku-edit-id="e-348d6606-4527-4845-8ea2-502c6e6c3456" variant="bodySmall" tone="accent">当前窗口 {kernelSize} × {kernelSize} · 第 {Math.min(step + 1, totalSteps)} / {totalSteps} 个位置</Typography>
      </section>

      <div shuku-edit-id="e-831b446a-2522-4a1c-9e91-a800cb876d6f" className="ck-kernel-size__right">
        <section shuku-edit-id="e-d7d72d10-9e92-49d4-b118-61ae6080302b" className="ck-kernel-size__output-stage" aria-label="输出特征图">
          <Typography shuku-edit-id="e-766dde2f-2a71-42c8-b803-aff678b0becd" as="h2" variant="h3" tone="accent">输出特征图 {outputSize} × {outputSize}</Typography>
          <OutputGrid size={outputSize} step={step} />
          <Typography shuku-edit-id="e-2470311e-6347-46ad-8e64-44996ee59b34" variant="bodySmall" tone="muted">每放置一次窗口，生成一个输出位置。</Typography>
        </section>
        <section shuku-edit-id="e-d1d4be83-d300-4efe-aeb6-e2446d444dc0" className="ck-kernel-size__formula-panel" aria-label="输出尺寸计算">
          <Typography shuku-edit-id="e-f33b4c41-eb96-4100-9c18-a54d5e7e42c1" as="h2" variant="h3" tone="accent">输出尺寸</Typography>
          <MathFormulaBlock ariaLabel="Valid 且步长为一时，输出尺寸等于输入尺寸减去卷积核尺寸加一"><MathFormulaStatic latex={String.raw`N_{out}=N_{in}-K+1`} /></MathFormulaBlock>
          <Typography shuku-edit-id="e-57c4ea12-b9f9-4997-a3f5-ddb560012aba" variant="bodySmall" tone="accent">本例：7 − {kernelSize} + 1 = {outputSize}，因此输出为 {outputSize} × {outputSize}。</Typography>
        </section>
      </div>
    </div>
  </ContentBlock>;
}
