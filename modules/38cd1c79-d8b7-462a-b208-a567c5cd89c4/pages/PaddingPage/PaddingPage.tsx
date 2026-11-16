import { useEffect, useState, type CSSProperties } from 'react';
import { ContentBlock, MathFormulaBlock, MathFormulaStatic, Typography } from "@shuku/course-style/react";
import './PaddingPage.css';

const INPUT_SIZE = 7;
const KERNEL_SIZE = 3;
const PADDINGS = [0, 1, 2] as const;
type Padding = typeof PADDINGS[number];

function InputGrid({ padding, step, outputSize }: { padding: Padding; step: number; outputSize: number }) {
  const size = INPUT_SIZE + padding * 2;
  const activeIndex = Math.min(step, outputSize * outputSize - 1);
  const top = Math.floor(activeIndex / outputSize);
  const left = activeIndex % outputSize;
  return <div shuku-edit-id="e-dccdb2b7-8f59-4988-a520-e5b1523d1c95" className="ck-padding__input-grid" style={{ '--grid-size': size } as CSSProperties} role="img" aria-label={`${size} 乘 ${size} 输入网格，每侧补零 ${padding} 格，卷积窗口位于第 ${top + 1} 行、第 ${left + 1} 列`}>
    {Array.from({ length: size * size }, (_, index) => {
      const row = Math.floor(index / size), col = index % size;
      const isPadding = row < padding || col < padding || row >= size - padding || col >= size - padding;
      const inWindow = row >= top && row < top + KERNEL_SIZE && col >= left && col < left + KERNEL_SIZE;
      return <span shuku-edit-id="e-611b1c3f-8dca-4bb1-907d-9adbf90b1a56" key={index} className={`${isPadding ? 'is-padding' : ''} ${inWindow ? 'is-window' : ''}`} />;
    })}
    <div shuku-edit-id="e-16986416-4e53-49a6-96fc-4d58166bb15c" className="ck-padding__window" style={{ left: `${left / size * 100}%`, top: `${top / size * 100}%`, width: `${KERNEL_SIZE / size * 100}%`, height: `${KERNEL_SIZE / size * 100}%` }} />
  </div>;
}

function OutputGrid({ size, step }: { size: number; step: number }) {
  const total = size * size;
  return <div shuku-edit-id="e-f8c05e91-b7c2-4e96-a72c-6f706c8dbacc" className="ck-padding__output-grid" style={{ '--output-size': size } as CSSProperties} role="img" aria-label={`${size} 乘 ${size} 输出特征图，共 ${total} 个位置，已扫描 ${Math.min(step, total)} 个`}>
    {Array.from({ length: total }, (_, index) => <span shuku-edit-id="e-72ef8577-5b0b-41a3-8ec0-4bac2b76f255" key={index} className={index === step && step < total ? 'is-current' : index < step ? 'is-complete' : ''} />)}
  </div>;
}

export function PaddingPage() {
  const [padding, setPadding] = useState<Padding>(1);
  const [step, setStep] = useState(0);
  const paddedSize = INPUT_SIZE + 2 * padding;
  const outputSize = paddedSize - KERNEL_SIZE + 1;
  const totalSteps = outputSize * outputSize;

  useEffect(() => {
    const interval = Math.min(650, Math.max(180, Math.round(16000 / totalSteps)));
    const timer = window.setInterval(() => setStep((current) => (current + 1) % (totalSteps + 1)), interval);
    return () => window.clearInterval(timer);
  }, [totalSteps]);

  const choosePadding = (value: Padding) => { setPadding(value); setStep(0); };

  return <ContentBlock shuku-edit-id="e-6790a8f8-c3b0-480f-9423-daf8f73e4c12" headingLevel={1} className="ck-padding" title="边界填充" subtitle="固定 7 × 7 输入、3 × 3 卷积核与步长 1；在边界外补零，观察输出尺寸如何变化。">
    <div shuku-edit-id="e-578add9e-4465-4d0a-8f94-c99dc999053b" className="ck-padding__workspace">
      <section shuku-edit-id="e-4b1c6065-73c9-43aa-938e-eb8179113a06" className="ck-padding__picker" aria-label="选择边界填充">
        <Typography shuku-edit-id="e-cbdf74aa-0855-4c2b-bc9e-4ec70a4547ad" as="h2" variant="h3" tone="accent">填充 P</Typography>
        <div shuku-edit-id="e-39406f3e-dd94-41b8-a189-c654e39f2426" className="ck-padding__choices" role="group" aria-label="每侧补零层数">
          {PADDINGS.map((value) => <button shuku-edit-id="e-61de2827-e1f2-42e8-a715-5e8f81974d6b" key={value} type="button" className={padding === value ? 'is-selected' : ''} aria-pressed={padding === value} onClick={() => choosePadding(value)}><Typography shuku-edit-id="e-fc7a317b-30cc-43de-a1f5-fe5eb466ff30" as="span" variant="h2" tone="inherit">{value}</Typography></button>)}
        </div>
        <Typography shuku-edit-id="e-d349b9b7-5de6-4b1c-bada-7a49e89a0d83" variant="bodySmall" tone="muted">填充越多，可放置窗口的位置越多。</Typography>
      </section>
      <section shuku-edit-id="e-6bc1e6de-0ecc-46b8-848c-9364a6fbcb28" className="ck-padding__input-stage" aria-label="输入网格与当前卷积窗口">
        <Typography shuku-edit-id="e-b76c2198-722a-4d70-9438-725e85b9ddeb" as="h2" variant="h3" tone="accent">输入网格 {paddedSize} × {paddedSize}</Typography>
        <InputGrid padding={padding} step={step} outputSize={outputSize} />
        <Typography shuku-edit-id="e-8c2f8954-c68b-4869-a7ed-715f8b297e0d" variant="bodySmall" tone="accent">浅蓝色为边界外补的零 · 每侧 {padding} 格</Typography>
      </section>
      <div shuku-edit-id="e-e75f5b6d-4717-44d6-bbc8-bb338c323113" className="ck-padding__right">
        <section shuku-edit-id="e-c45fe194-45c0-490c-b44b-33a94e8cd140" className="ck-padding__output-stage" aria-label="输出特征图">
          <Typography shuku-edit-id="e-5c27db70-9fee-4296-9331-3a2e39106cb4" as="h2" variant="h3" tone="accent">输出特征图 {outputSize} × {outputSize}</Typography>
          <OutputGrid size={outputSize} step={step} />
          <Typography shuku-edit-id="e-06d6a19a-d979-4a6b-807a-fa4ec24073c4" variant="bodySmall" tone="muted">每放置一次窗口，生成一个输出位置。</Typography>
        </section>
        <section shuku-edit-id="e-c323afd4-5e03-49e6-bfad-01474495ad3b" className="ck-padding__formula-panel" aria-label="输出尺寸计算">
          <Typography shuku-edit-id="e-8a758259-89b8-44bd-af95-23055ac306a8" as="h2" variant="h3" tone="accent">输出尺寸</Typography>
          <MathFormulaBlock ariaLabel="步长为一时，输出边长等于输入边长加两倍填充，减卷积核边长再加一"><MathFormulaStatic latex={String.raw`N_{\mathrm{out}}=N_{\mathrm{in}}+2P-K+1`} /></MathFormulaBlock>
          <Typography shuku-edit-id="e-0ed91bc9-a479-45aa-8c82-69343ebbad0a" variant="bodySmall" tone="muted">步长固定为 1 · 每侧填充 P</Typography>
        </section>
      </div>
    </div>
  </ContentBlock>;
}
