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
  return <div shuku-edit-id="e-66f5da19-6648-4d14-974d-576109ce216a" className="aipe-replay-cg-copy-ck-padding__input-grid" style={{ '--grid-size': size } as CSSProperties} role="img" aria-label={`${size} 乘 ${size} 输入网格，每侧补零 ${padding} 格，卷积窗口位于第 ${top + 1} 行、第 ${left + 1} 列`}>
    {Array.from({ length: size * size }, (_, index) => {
      const row = Math.floor(index / size), col = index % size;
      const isPadding = row < padding || col < padding || row >= size - padding || col >= size - padding;
      const inWindow = row >= top && row < top + KERNEL_SIZE && col >= left && col < left + KERNEL_SIZE;
      return <span shuku-edit-id="e-f476381e-8f19-4319-9cb6-adc485239398" key={index} className={`${isPadding ? 'is-padding' : ''} ${inWindow ? 'is-window' : ''}`} />;
    })}
    <div shuku-edit-id="e-cbd24806-4de6-4e1c-aef7-f081db8a9b02" className="aipe-replay-cg-copy-ck-padding__window" style={{ left: `${left / size * 100}%`, top: `${top / size * 100}%`, width: `${KERNEL_SIZE / size * 100}%`, height: `${KERNEL_SIZE / size * 100}%` }} />
  </div>;
}

function OutputGrid({ size, step }: { size: number; step: number }) {
  const total = size * size;
  return <div shuku-edit-id="e-30b7bb63-3257-4218-8782-6de270348939" className="aipe-replay-cg-copy-ck-padding__output-grid" style={{ '--output-size': size } as CSSProperties} role="img" aria-label={`${size} 乘 ${size} 输出特征图，共 ${total} 个位置，已扫描 ${Math.min(step, total)} 个`}>
    {Array.from({ length: total }, (_, index) => <span shuku-edit-id="e-8adce44e-4735-47fd-bda6-78fb80ef9381" key={index} className={index === step && step < total ? 'is-current' : index < step ? 'is-complete' : ''} />)}
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

  return <ContentBlock shuku-edit-id="e-7315f7db-aa60-4290-a1a0-9bf1f9a10798" headingLevel={1} className="aipe-replay-cg-copy-ck-padding" title="边界填充" subtitle="固定 7 × 7 输入、3 × 3 卷积核与步长 1；在边界外补零，观察输出尺寸如何变化。">
    <div shuku-edit-id="e-3943f7b7-8c51-4f12-81b6-7267868fb278" className="aipe-replay-cg-copy-ck-padding__workspace">
      <section shuku-edit-id="e-e4ee0a44-a406-4be6-98d1-e40a8f8f9391" className="aipe-replay-cg-copy-ck-padding__picker" aria-label="选择边界填充">
        <Typography shuku-edit-id="e-e693564b-0e8e-4609-888f-8dcea066a95c" as="h2" variant="h3" tone="accent">填充 P</Typography>
        <div shuku-edit-id="e-2fda61ab-9e23-482b-838d-8b8ae9600eb1" className="aipe-replay-cg-copy-ck-padding__choices" role="group" aria-label="每侧补零层数">
          {PADDINGS.map((value) => <button shuku-edit-id="e-65e962da-4430-4af1-824d-dd01ca6c3174" key={value} type="button" className={padding === value ? 'is-selected' : ''} aria-pressed={padding === value} onClick={() => choosePadding(value)}><Typography shuku-edit-id="e-3c47b513-9a9c-4b05-b404-c83cc801e73c" as="span" variant="h2" tone="inherit">{value}</Typography></button>)}
        </div>
        <Typography shuku-edit-id="e-17e15afe-0e34-4ed2-ae09-608f447769d3" variant="bodySmall" tone="muted">填充越多，可放置窗口的位置越多。</Typography>
      </section>
      <section shuku-edit-id="e-e8b44073-c7c1-48f5-b0d9-24de066367f9" className="aipe-replay-cg-copy-ck-padding__input-stage" aria-label="输入网格与当前卷积窗口">
        <Typography shuku-edit-id="e-42b0469c-06cd-4e1f-84c0-a1425cea52e5" as="h2" variant="h3" tone="accent">输入网格 {paddedSize} × {paddedSize}</Typography>
        <InputGrid padding={padding} step={step} outputSize={outputSize} />
        <Typography shuku-edit-id="e-787b3807-0057-49c1-8438-87813abd71c3" variant="bodySmall" tone="accent">浅蓝色为边界外补的零 · 每侧 {padding} 格</Typography>
      </section>
      <div shuku-edit-id="e-81f8327f-a417-4aa0-8a49-ece3691b624c" className="aipe-replay-cg-copy-ck-padding__right">
        <section shuku-edit-id="e-d98b777d-5c1c-4eda-93c6-682c9efe8440" className="aipe-replay-cg-copy-ck-padding__output-stage" aria-label="输出特征图">
          <Typography shuku-edit-id="e-500a9680-9f9c-4069-8ce6-a8e44fb849b6" as="h2" variant="h3" tone="accent">输出特征图 {outputSize} × {outputSize}</Typography>
          <OutputGrid size={outputSize} step={step} />
          <Typography shuku-edit-id="e-e7397cb4-589c-4681-9f43-96f088b0af9b" variant="bodySmall" tone="muted">每放置一次窗口，生成一个输出位置。</Typography>
        </section>
        <section shuku-edit-id="e-e032e131-d5a7-4223-80ca-05cdc05662b5" className="aipe-replay-cg-copy-ck-padding__formula-panel" aria-label="输出尺寸计算">
          <Typography shuku-edit-id="e-9f957d75-8f19-42e6-acea-0cf89c744341" as="h2" variant="h3" tone="accent">输出尺寸</Typography>
          <MathFormulaBlock ariaLabel="步长为一时，输出边长等于输入边长加两倍填充，减卷积核边长再加一"><MathFormulaStatic latex={String.raw`N_{\mathrm{out}}=N_{\mathrm{in}}+2P-K+1`} /></MathFormulaBlock>
          <Typography shuku-edit-id="e-55412aba-62b0-44ee-bfdf-77ea41894de1" variant="bodySmall" tone="muted">步长固定为 1 · 每侧填充 P</Typography>
        </section>
      </div>
    </div>
  </ContentBlock>;
}
