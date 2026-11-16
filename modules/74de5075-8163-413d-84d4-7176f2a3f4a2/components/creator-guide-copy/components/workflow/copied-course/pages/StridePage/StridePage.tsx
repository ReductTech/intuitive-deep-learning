import { useEffect, useState, type CSSProperties } from 'react';
import { ContentBlock, MathFormulaBlock, MathFormulaStatic, Typography } from "@shuku/course-style/react";
import './StridePage.css';

const INPUT_SIZE = 7;
const KERNEL_SIZE = 3;
const STRIDES = [1, 2, 3] as const;
type Stride = typeof STRIDES[number];

function InputGrid({ stride, step, outputSize }: { stride: Stride; step: number; outputSize: number }) {
  const activeIndex = Math.min(step, outputSize * outputSize - 1);
  const top = Math.floor(activeIndex / outputSize) * stride;
  const left = activeIndex % outputSize * stride;
  return <div shuku-edit-id="e-4a14b80c-1b78-4227-a32d-43297c3254a6" className="aipe-replay-cg-copy-ck-stride__input-grid" role="img" aria-label={`7 乘 7 输入网格，卷积窗口位于第 ${top + 1} 行、第 ${left + 1} 列`}>
    {Array.from({ length: INPUT_SIZE * INPUT_SIZE }, (_, index) => {
      const row = Math.floor(index / INPUT_SIZE), col = index % INPUT_SIZE;
      return <span shuku-edit-id="e-1587382d-0709-414e-a7eb-8f55af6beeda" key={index} className={row >= top && row < top + KERNEL_SIZE && col >= left && col < left + KERNEL_SIZE ? 'is-window' : ''} />;
    })}
    <div shuku-edit-id="e-e378ce5c-53ca-40c8-abb4-7334247b11f2" className="aipe-replay-cg-copy-ck-stride__window" style={{ left: `${left / INPUT_SIZE * 100}%`, top: `${top / INPUT_SIZE * 100}%`, width: `${KERNEL_SIZE / INPUT_SIZE * 100}%`, height: `${KERNEL_SIZE / INPUT_SIZE * 100}%` }} />
  </div>;
}

function OutputGrid({ size, step }: { size: number; step: number }) {
  const total = size * size;
  return <div shuku-edit-id="e-b3605c26-7716-48ae-acb0-0160dcc3c9ce" className="aipe-replay-cg-copy-ck-stride__output-grid" style={{ '--output-size': size } as CSSProperties} role="img" aria-label={`${size} 乘 ${size} 输出特征图，共 ${total} 个位置，已扫描 ${Math.min(step, total)} 个`}>
    {Array.from({ length: total }, (_, index) => <span shuku-edit-id="e-736f8aea-a397-4821-bdc0-5122ab35a8ff" key={index} className={index === step && step < total ? 'is-current' : index < step ? 'is-complete' : ''} />)}
  </div>;
}

export function StridePage() {
  const [stride, setStride] = useState<Stride>(2);
  const [step, setStep] = useState(0);
  const outputSize = Math.floor((INPUT_SIZE - KERNEL_SIZE) / stride) + 1;
  const totalSteps = outputSize * outputSize;

  useEffect(() => {
    const interval = Math.min(650, Math.max(180, Math.round(16000 / totalSteps)));
    const timer = window.setInterval(() => setStep((current) => (current + 1) % (totalSteps + 1)), interval);
    return () => window.clearInterval(timer);
  }, [totalSteps]);

  const chooseStride = (value: Stride) => { setStride(value); setStep(0); };

  return <ContentBlock shuku-edit-id="e-54a65a1b-3176-4780-8a59-94f85300ad5b" headingLevel={1} className="aipe-replay-cg-copy-ck-stride" title="卷积步长" subtitle="固定 7 × 7 输入、3 × 3 卷积核与 Valid；步长决定相邻窗口的移动间隔。">
    <div shuku-edit-id="e-b40bd335-de32-44be-a2a3-ff6380a65f12" className="aipe-replay-cg-copy-ck-stride__workspace">
      <section shuku-edit-id="e-b237c27b-1a1a-49ee-bbf6-7fa10e57796b" className="aipe-replay-cg-copy-ck-stride__picker" aria-label="选择卷积步长">
        <Typography shuku-edit-id="e-bdbc3414-fee1-4002-a6cd-fa6597c0d873" as="h2" variant="h3" tone="accent">步长 S</Typography>
        <div shuku-edit-id="e-087caa6d-76e5-4635-92f0-e40255e6b536" className="aipe-replay-cg-copy-ck-stride__choices" role="group" aria-label="卷积步长">
          {STRIDES.map((value) => <button shuku-edit-id="e-159e7b87-c5c2-4d2d-bcb4-4b73d6a192f2" key={value} type="button" className={stride === value ? 'is-selected' : ''} aria-pressed={stride === value} onClick={() => chooseStride(value)}><Typography shuku-edit-id="e-f419baba-04a3-4dac-8052-40ac2a120220" as="span" variant="h2" tone="inherit">{value}</Typography></button>)}
        </div>
        <Typography shuku-edit-id="e-cbb88e53-4d48-4fe2-84ea-6aa4ba2cb2fe" variant="bodySmall" tone="muted">步长越大，输出位置越少。</Typography>
      </section>
      <section shuku-edit-id="e-e8814556-6d2f-4e92-b9fb-d71812ecf63e" className="aipe-replay-cg-copy-ck-stride__input-stage" aria-label="输入网格与当前卷积窗口">
        <Typography shuku-edit-id="e-afd4a519-f440-4050-a975-e6579998b898" as="h2" variant="h3" tone="accent">输入网格 7 × 7</Typography>
        <InputGrid stride={stride} step={step} outputSize={outputSize} />
        <Typography shuku-edit-id="e-806e121b-33d0-401c-ae5e-a9b03ac5ac1a" variant="bodySmall" tone="accent">3 × 3 窗口每次移动 {stride} 格</Typography>
      </section>
      <div shuku-edit-id="e-abd2b87c-b568-4caa-8615-cec64586ce36" className="aipe-replay-cg-copy-ck-stride__right">
        <section shuku-edit-id="e-dbe59dd7-8587-4f7c-afca-ffc1cc85b7b7" className="aipe-replay-cg-copy-ck-stride__output-stage" aria-label="输出特征图">
          <Typography shuku-edit-id="e-55fe73c9-690b-4b06-81d0-86c4e109516a" as="h2" variant="h3" tone="accent">输出特征图 {outputSize} × {outputSize}</Typography>
          <OutputGrid size={outputSize} step={step} />
          <Typography shuku-edit-id="e-a6081b6f-a0eb-4f4d-9d41-e65cfb115bcf" variant="bodySmall" tone="muted">每放置一次窗口，生成一个输出位置。</Typography>
        </section>
        <section shuku-edit-id="e-ae205aee-d958-46b7-bd25-d14cb6cb7aeb" className="aipe-replay-cg-copy-ck-stride__formula-panel" aria-label="输出尺寸计算">
          <Typography shuku-edit-id="e-f7b5ca39-4ceb-446a-8506-e7e3d0cb71b0" as="h2" variant="h3" tone="accent">输出尺寸</Typography>
          <MathFormulaBlock ariaLabel="不填充时，输出边长等于输入边长减卷积核边长，除以步长后向下取整再加一"><MathFormulaStatic latex={String.raw`N_{\mathrm{out}}=\left\lfloor\frac{N_{\mathrm{in}}-K}{S}\right\rfloor+1`} /></MathFormulaBlock>
          <Typography shuku-edit-id="e-5f61f088-711b-45d6-b268-78cf6a1a3d5f" variant="bodySmall" tone="muted">Valid：不填充 · 步长为 S</Typography>
        </section>
      </div>
    </div>
  </ContentBlock>;
}
