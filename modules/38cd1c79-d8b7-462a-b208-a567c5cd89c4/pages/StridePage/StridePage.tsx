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
  return <div shuku-edit-id="e-1c3f8dd2-342a-41bb-a793-7eee78602967" className="ck-stride__input-grid" role="img" aria-label={`7 乘 7 输入网格，卷积窗口位于第 ${top + 1} 行、第 ${left + 1} 列`}>
    {Array.from({ length: INPUT_SIZE * INPUT_SIZE }, (_, index) => {
      const row = Math.floor(index / INPUT_SIZE), col = index % INPUT_SIZE;
      return <span shuku-edit-id="e-cbfd5078-8568-4990-8ae8-69cc9ef3ac3a" key={index} className={row >= top && row < top + KERNEL_SIZE && col >= left && col < left + KERNEL_SIZE ? 'is-window' : ''} />;
    })}
    <div shuku-edit-id="e-52e3abe4-90b1-4844-b668-56d58df19775" className="ck-stride__window" style={{ left: `${left / INPUT_SIZE * 100}%`, top: `${top / INPUT_SIZE * 100}%`, width: `${KERNEL_SIZE / INPUT_SIZE * 100}%`, height: `${KERNEL_SIZE / INPUT_SIZE * 100}%` }} />
  </div>;
}

function OutputGrid({ size, step }: { size: number; step: number }) {
  const total = size * size;
  return <div shuku-edit-id="e-ff0d8672-dcb4-40e3-9f1d-9b67ccd5fbb4" className="ck-stride__output-grid" style={{ '--output-size': size } as CSSProperties} role="img" aria-label={`${size} 乘 ${size} 输出特征图，共 ${total} 个位置，已扫描 ${Math.min(step, total)} 个`}>
    {Array.from({ length: total }, (_, index) => <span shuku-edit-id="e-77f78049-11cc-4503-9a59-3d04ba467e75" key={index} className={index === step && step < total ? 'is-current' : index < step ? 'is-complete' : ''} />)}
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

  return <ContentBlock shuku-edit-id="e-a8fcdd4f-db28-42a3-a49c-2b6bb8def68f" headingLevel={1} className="ck-stride" title="卷积步长" subtitle="固定 7 × 7 输入、3 × 3 卷积核与 Valid；步长决定相邻窗口的移动间隔。">
    <div shuku-edit-id="e-b45867bd-a678-4a24-803d-a9b3fba72bc8" className="ck-stride__workspace">
      <section shuku-edit-id="e-f4771b3d-8813-413a-ada9-dead5324fd2b" className="ck-stride__picker" aria-label="选择卷积步长">
        <Typography shuku-edit-id="e-349a19fd-ef2b-46ad-b279-6f5985539030" as="h2" variant="h3" tone="accent">步长 S</Typography>
        <div shuku-edit-id="e-1c68175e-e52f-4c43-8d87-08750d0c9546" className="ck-stride__choices" role="group" aria-label="卷积步长">
          {STRIDES.map((value) => <button shuku-edit-id="e-aac700fc-4458-44ee-af78-46c875e9a565" key={value} type="button" className={stride === value ? 'is-selected' : ''} aria-pressed={stride === value} onClick={() => chooseStride(value)}><Typography shuku-edit-id="e-daffce9e-4fb7-4dcf-80d5-62616efd8faf" as="span" variant="h2" tone="inherit">{value}</Typography></button>)}
        </div>
        <Typography shuku-edit-id="e-30eab7bb-7f03-455f-82bf-8978a89d6d99" variant="bodySmall" tone="muted">步长越大，输出位置越少。</Typography>
      </section>
      <section shuku-edit-id="e-c4f0875d-2cea-4c8f-af63-2bbefe455750" className="ck-stride__input-stage" aria-label="输入网格与当前卷积窗口">
        <Typography shuku-edit-id="e-a25166c8-83e1-463e-9604-247222a257ec" as="h2" variant="h3" tone="accent">输入网格 7 × 7</Typography>
        <InputGrid stride={stride} step={step} outputSize={outputSize} />
        <Typography shuku-edit-id="e-7bfdcf03-dc50-4fc3-aef5-99f56391f633" variant="bodySmall" tone="accent">3 × 3 窗口每次移动 {stride} 格</Typography>
      </section>
      <div shuku-edit-id="e-3e91d5fa-a325-46f6-a72d-6fe24c384133" className="ck-stride__right">
        <section shuku-edit-id="e-3eadb1f2-4b4a-4c32-909c-c9f5ed92fd2c" className="ck-stride__output-stage" aria-label="输出特征图">
          <Typography shuku-edit-id="e-7ded2e63-1abd-48c9-bf82-0a017c302502" as="h2" variant="h3" tone="accent">输出特征图 {outputSize} × {outputSize}</Typography>
          <OutputGrid size={outputSize} step={step} />
          <Typography shuku-edit-id="e-e2a9a6a2-fcb1-4000-966d-3332a0e90b3e" variant="bodySmall" tone="muted">每放置一次窗口，生成一个输出位置。</Typography>
        </section>
        <section shuku-edit-id="e-f0126c25-b305-4974-ab54-e54ff18ff8b1" className="ck-stride__formula-panel" aria-label="输出尺寸计算">
          <Typography shuku-edit-id="e-56f36a31-1261-4ffe-9b98-c871d5075f74" as="h2" variant="h3" tone="accent">输出尺寸</Typography>
          <MathFormulaBlock ariaLabel="不填充时，输出边长等于输入边长减卷积核边长，除以步长后向下取整再加一"><MathFormulaStatic latex={String.raw`N_{\mathrm{out}}=\left\lfloor\frac{N_{\mathrm{in}}-K}{S}\right\rfloor+1`} /></MathFormulaBlock>
          <Typography shuku-edit-id="e-8914bd6a-3a21-4925-bf7a-866e5f8f3e47" variant="bodySmall" tone="muted">Valid：不填充 · 步长为 S</Typography>
        </section>
      </div>
    </div>
  </ContentBlock>;
}
