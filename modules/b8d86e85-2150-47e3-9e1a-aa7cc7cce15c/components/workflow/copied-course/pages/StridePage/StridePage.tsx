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
  return <div shuku-edit-id="e-1dc4f43e-f6e0-4da7-937b-b701c145d242" className="cg-copy-ck-stride__input-grid" role="img" aria-label={`7 乘 7 输入网格，卷积窗口位于第 ${top + 1} 行、第 ${left + 1} 列`}>
    {Array.from({ length: INPUT_SIZE * INPUT_SIZE }, (_, index) => {
      const row = Math.floor(index / INPUT_SIZE), col = index % INPUT_SIZE;
      return <span shuku-edit-id="e-40757503-6d50-4faa-aed7-ed114fcca139" key={index} className={row >= top && row < top + KERNEL_SIZE && col >= left && col < left + KERNEL_SIZE ? 'is-window' : ''} />;
    })}
    <div shuku-edit-id="e-050a65c0-0d2d-4c1d-866a-770051fce0a3" className="cg-copy-ck-stride__window" style={{ left: `${left / INPUT_SIZE * 100}%`, top: `${top / INPUT_SIZE * 100}%`, width: `${KERNEL_SIZE / INPUT_SIZE * 100}%`, height: `${KERNEL_SIZE / INPUT_SIZE * 100}%` }} />
  </div>;
}

function OutputGrid({ size, step }: { size: number; step: number }) {
  const total = size * size;
  return <div shuku-edit-id="e-0b24fdc0-ec5c-40e2-8f27-cf0927f53f3b" className="cg-copy-ck-stride__output-grid" style={{ '--output-size': size } as CSSProperties} role="img" aria-label={`${size} 乘 ${size} 输出特征图，共 ${total} 个位置，已扫描 ${Math.min(step, total)} 个`}>
    {Array.from({ length: total }, (_, index) => <span shuku-edit-id="e-29189e99-051e-4b03-939a-4f816732a0a5" key={index} className={index === step && step < total ? 'is-current' : index < step ? 'is-complete' : ''} />)}
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

  return <ContentBlock shuku-edit-id="e-b0127f28-a04c-444c-b8ad-8064d1eef593" headingLevel={1} className="cg-copy-ck-stride" title="卷积步长" subtitle="固定 7 × 7 输入、3 × 3 卷积核与 Valid；步长决定相邻窗口的移动间隔。">
    <div shuku-edit-id="e-91859009-f932-4e0e-b6e3-8a8b070299a3" className="cg-copy-ck-stride__workspace">
      <section shuku-edit-id="e-bae3c8a7-8a4b-4bf8-905e-ddab861a64df" className="cg-copy-ck-stride__picker" aria-label="选择卷积步长">
        <Typography shuku-edit-id="e-4efe1c43-79a0-4260-aac2-b20ee3b77798" as="h2" variant="h3" tone="accent">步长 S</Typography>
        <div shuku-edit-id="e-452a5a29-76c6-4658-98ed-0c18dda35411" className="cg-copy-ck-stride__choices" role="group" aria-label="卷积步长">
          {STRIDES.map((value) => <button shuku-edit-id="e-bf5dbef7-063d-45b8-bab2-613ec560de56" key={value} type="button" className={stride === value ? 'is-selected' : ''} aria-pressed={stride === value} onClick={() => chooseStride(value)}><Typography shuku-edit-id="e-718992f9-0330-42c8-af85-4b2e6ba06e23" as="span" variant="h2" tone="inherit">{value}</Typography></button>)}
        </div>
        <Typography shuku-edit-id="e-2b06f9ec-7d9f-4d23-9e68-134250cf1c6d" variant="bodySmall" tone="muted">步长越大，输出位置越少。</Typography>
      </section>
      <section shuku-edit-id="e-e736dfe3-5194-44db-a4bb-22265ce22434" className="cg-copy-ck-stride__input-stage" aria-label="输入网格与当前卷积窗口">
        <Typography shuku-edit-id="e-68cf299b-5b7f-43f5-b4e5-dd38041ae418" as="h2" variant="h3" tone="accent">输入网格 7 × 7</Typography>
        <InputGrid stride={stride} step={step} outputSize={outputSize} />
        <Typography shuku-edit-id="e-6c4effa0-e854-42d5-ad1f-08780224fd21" variant="bodySmall" tone="accent">3 × 3 窗口每次移动 {stride} 格</Typography>
      </section>
      <div shuku-edit-id="e-5fd854de-eae1-4c85-b7fd-5d2a1cc22a9f" className="cg-copy-ck-stride__right">
        <section shuku-edit-id="e-648c4157-2ec1-4a39-b60e-740e2edef54e" className="cg-copy-ck-stride__output-stage" aria-label="输出特征图">
          <Typography shuku-edit-id="e-e540477a-43dd-4745-8828-7acb3b594120" as="h2" variant="h3" tone="accent">输出特征图 {outputSize} × {outputSize}</Typography>
          <OutputGrid size={outputSize} step={step} />
          <Typography shuku-edit-id="e-9eab9965-dbfb-4433-8663-0bacb141a35f" variant="bodySmall" tone="muted">每放置一次窗口，生成一个输出位置。</Typography>
        </section>
        <section shuku-edit-id="e-f6afb177-90f9-463c-bc43-42641aae41fe" className="cg-copy-ck-stride__formula-panel" aria-label="输出尺寸计算">
          <Typography shuku-edit-id="e-bc2c3a89-04d6-4d68-b10d-e176a3b75977" as="h2" variant="h3" tone="accent">输出尺寸</Typography>
          <MathFormulaBlock ariaLabel="不填充时，输出边长等于输入边长减卷积核边长，除以步长后向下取整再加一"><MathFormulaStatic latex={String.raw`N_{\mathrm{out}}=\left\lfloor\frac{N_{\mathrm{in}}-K}{S}\right\rfloor+1`} /></MathFormulaBlock>
          <Typography shuku-edit-id="e-459d586c-8bba-4238-90dd-1046a465183c" variant="bodySmall" tone="muted">Valid：不填充 · 步长为 S</Typography>
        </section>
      </div>
    </div>
  </ContentBlock>;
}
