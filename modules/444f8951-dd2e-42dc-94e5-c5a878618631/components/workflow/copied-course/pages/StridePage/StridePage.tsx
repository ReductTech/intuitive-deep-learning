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
  return <div shuku-edit-id="e-d2d2975a-c278-41d7-ae96-a5c7ec37e1d6" className="cg-copy-ck-stride__input-grid" role="img" aria-label={`7 乘 7 输入网格，卷积窗口位于第 ${top + 1} 行、第 ${left + 1} 列`}>
    {Array.from({ length: INPUT_SIZE * INPUT_SIZE }, (_, index) => {
      const row = Math.floor(index / INPUT_SIZE), col = index % INPUT_SIZE;
      return <span shuku-edit-id="e-815f2f37-ce16-45d3-bb3c-b4cf4e73617a" key={index} className={row >= top && row < top + KERNEL_SIZE && col >= left && col < left + KERNEL_SIZE ? 'is-window' : ''} />;
    })}
    <div shuku-edit-id="e-c67ced8f-4cd7-4643-be48-ffc747bdd1a8" className="cg-copy-ck-stride__window" style={{ left: `${left / INPUT_SIZE * 100}%`, top: `${top / INPUT_SIZE * 100}%`, width: `${KERNEL_SIZE / INPUT_SIZE * 100}%`, height: `${KERNEL_SIZE / INPUT_SIZE * 100}%` }} />
  </div>;
}

function OutputGrid({ size, step }: { size: number; step: number }) {
  const total = size * size;
  return <div shuku-edit-id="e-5c18bc77-0675-4dad-a9ae-3324d011b722" className="cg-copy-ck-stride__output-grid" style={{ '--output-size': size } as CSSProperties} role="img" aria-label={`${size} 乘 ${size} 输出特征图，共 ${total} 个位置，已扫描 ${Math.min(step, total)} 个`}>
    {Array.from({ length: total }, (_, index) => <span shuku-edit-id="e-4579cc3f-41be-4c5b-a3df-9c4344af1357" key={index} className={index === step && step < total ? 'is-current' : index < step ? 'is-complete' : ''} />)}
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

  return <ContentBlock shuku-edit-id="e-8f4dc02a-e739-4bce-986e-a9dba3bc884d" headingLevel={1} className="cg-copy-ck-stride" title="卷积步长" subtitle="固定 7 × 7 输入、3 × 3 卷积核与 Valid；步长决定相邻窗口的移动间隔。">
    <div shuku-edit-id="e-a16989b4-7607-46fb-86a7-564affc20f72" className="cg-copy-ck-stride__workspace">
      <section shuku-edit-id="e-c818abd6-d94f-4fb2-9063-7bccc1e3b965" className="cg-copy-ck-stride__picker" aria-label="选择卷积步长">
        <Typography shuku-edit-id="e-c6364af9-a76b-4f11-8e4b-c3883d60e9dc" as="h2" variant="h3" tone="accent">步长 S</Typography>
        <div shuku-edit-id="e-71222d95-7221-4d04-90c9-da3d22163a86" className="cg-copy-ck-stride__choices" role="group" aria-label="卷积步长">
          {STRIDES.map((value) => <button shuku-edit-id="e-a9ca12d7-1519-4d72-9930-a4ecb4cc77ef" key={value} type="button" className={stride === value ? 'is-selected' : ''} aria-pressed={stride === value} onClick={() => chooseStride(value)}><Typography shuku-edit-id="e-a93c3f16-4570-46c4-ba9f-b7a8a98db745" as="span" variant="h2" tone="inherit">{value}</Typography></button>)}
        </div>
        <Typography shuku-edit-id="e-00d13a64-8e87-44ba-8228-d5676ee2fb5f" variant="bodySmall" tone="muted">步长越大，输出位置越少。</Typography>
      </section>
      <section shuku-edit-id="e-1233dfc4-de48-4279-80c9-67bb38310bc2" className="cg-copy-ck-stride__input-stage" aria-label="输入网格与当前卷积窗口">
        <Typography shuku-edit-id="e-ac6c4854-8a2c-40c4-a9f8-2e0b559edc84" as="h2" variant="h3" tone="accent">输入网格 7 × 7</Typography>
        <InputGrid stride={stride} step={step} outputSize={outputSize} />
        <Typography shuku-edit-id="e-231ed193-835f-471d-900d-6357dc46f255" variant="bodySmall" tone="accent">3 × 3 窗口每次移动 {stride} 格</Typography>
      </section>
      <div shuku-edit-id="e-623918f8-a68c-4c28-97e1-e5092a87d2cb" className="cg-copy-ck-stride__right">
        <section shuku-edit-id="e-e74ff292-1eb0-43f7-9be3-f2ce56e6de35" className="cg-copy-ck-stride__output-stage" aria-label="输出特征图">
          <Typography shuku-edit-id="e-f7eded45-947a-4c48-b676-197235a9560a" as="h2" variant="h3" tone="accent">输出特征图 {outputSize} × {outputSize}</Typography>
          <OutputGrid size={outputSize} step={step} />
          <Typography shuku-edit-id="e-e6153dfc-2740-4120-b598-340fb7b1d2ec" variant="bodySmall" tone="muted">每放置一次窗口，生成一个输出位置。</Typography>
        </section>
        <section shuku-edit-id="e-a5b0996b-f2c5-476f-b6aa-11e66030d243" className="cg-copy-ck-stride__formula-panel" aria-label="输出尺寸计算">
          <Typography shuku-edit-id="e-8baf5195-7f4c-4768-898d-ad7e0ffab273" as="h2" variant="h3" tone="accent">输出尺寸</Typography>
          <MathFormulaBlock ariaLabel="不填充时，输出边长等于输入边长减卷积核边长，除以步长后向下取整再加一"><MathFormulaStatic latex={String.raw`N_{\mathrm{out}}=\left\lfloor\frac{N_{\mathrm{in}}-K}{S}\right\rfloor+1`} /></MathFormulaBlock>
          <Typography shuku-edit-id="e-530459f2-a308-4862-9a9a-1dcc92e37829" variant="bodySmall" tone="muted">Valid：不填充 · 步长为 S</Typography>
        </section>
      </div>
    </div>
  </ContentBlock>;
}
