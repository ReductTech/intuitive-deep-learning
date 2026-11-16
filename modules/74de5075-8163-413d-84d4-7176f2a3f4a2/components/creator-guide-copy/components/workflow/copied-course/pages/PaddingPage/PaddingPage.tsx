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
  return <div shuku-edit-id="e-99c065b8-06cc-4228-9e49-4c4f452b6a70" className="aipe-replay-cg-copy-ck-padding__input-grid" style={{ '--grid-size': size } as CSSProperties} role="img" aria-label={`${size} 乘 ${size} 输入网格，每侧补零 ${padding} 格，卷积窗口位于第 ${top + 1} 行、第 ${left + 1} 列`}>
    {Array.from({ length: size * size }, (_, index) => {
      const row = Math.floor(index / size), col = index % size;
      const isPadding = row < padding || col < padding || row >= size - padding || col >= size - padding;
      const inWindow = row >= top && row < top + KERNEL_SIZE && col >= left && col < left + KERNEL_SIZE;
      return <span shuku-edit-id="e-2537f1ba-6db9-4611-ab01-71e6ecefa66b" key={index} className={`${isPadding ? 'is-padding' : ''} ${inWindow ? 'is-window' : ''}`} />;
    })}
    <div shuku-edit-id="e-583c3b02-9bc1-4af1-b4c1-47aa3727ce89" className="aipe-replay-cg-copy-ck-padding__window" style={{ left: `${left / size * 100}%`, top: `${top / size * 100}%`, width: `${KERNEL_SIZE / size * 100}%`, height: `${KERNEL_SIZE / size * 100}%` }} />
  </div>;
}

function OutputGrid({ size, step }: { size: number; step: number }) {
  const total = size * size;
  return <div shuku-edit-id="e-cc9d2428-6630-49ef-a47b-2ad6086b067e" className="aipe-replay-cg-copy-ck-padding__output-grid" style={{ '--output-size': size } as CSSProperties} role="img" aria-label={`${size} 乘 ${size} 输出特征图，共 ${total} 个位置，已扫描 ${Math.min(step, total)} 个`}>
    {Array.from({ length: total }, (_, index) => <span shuku-edit-id="e-2c27c3a5-839c-4cd6-b557-063d18669c0e" key={index} className={index === step && step < total ? 'is-current' : index < step ? 'is-complete' : ''} />)}
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

  return <ContentBlock shuku-edit-id="e-b19d01a3-0612-48e3-b231-81d222e73605" headingLevel={1} className="aipe-replay-cg-copy-ck-padding" title="边界填充" subtitle="固定 7 × 7 输入、3 × 3 卷积核与步长 1；在边界外补零，观察输出尺寸如何变化。">
    <div shuku-edit-id="e-af984403-572b-4366-98a6-4fad78e85ec1" className="aipe-replay-cg-copy-ck-padding__workspace">
      <section shuku-edit-id="e-19d892ef-d7ff-42c9-b675-58726b640ce6" className="aipe-replay-cg-copy-ck-padding__picker" aria-label="选择边界填充">
        <Typography shuku-edit-id="e-e18dd5cf-9a24-4a4a-a361-0684578765c7" as="h2" variant="h3" tone="accent">填充 P</Typography>
        <div shuku-edit-id="e-a1871c72-1787-4812-8b50-a977c957c540" className="aipe-replay-cg-copy-ck-padding__choices" role="group" aria-label="每侧补零层数">
          {PADDINGS.map((value) => <button shuku-edit-id="e-6a445a6d-b8bb-40dd-a7a4-bb2260bba6d8" key={value} type="button" className={padding === value ? 'is-selected' : ''} aria-pressed={padding === value} onClick={() => choosePadding(value)}><Typography shuku-edit-id="e-583c906c-874b-41a2-8827-ff35eebfe2c2" as="span" variant="h2" tone="inherit">{value}</Typography></button>)}
        </div>
        <Typography shuku-edit-id="e-e5b95ecb-7ff9-4523-890c-5df277fa79b6" variant="bodySmall" tone="muted">填充越多，可放置窗口的位置越多。</Typography>
      </section>
      <section shuku-edit-id="e-e406399b-f17c-4d6f-acdc-e66bd07368ca" className="aipe-replay-cg-copy-ck-padding__input-stage" aria-label="输入网格与当前卷积窗口">
        <Typography shuku-edit-id="e-dc1d9143-b21c-4af7-a8bd-51ba16c5b4de" as="h2" variant="h3" tone="accent">输入网格 {paddedSize} × {paddedSize}</Typography>
        <InputGrid padding={padding} step={step} outputSize={outputSize} />
        <Typography shuku-edit-id="e-81c4e911-b8d8-499e-b43c-da077d47ee57" variant="bodySmall" tone="accent">浅蓝色为边界外补的零 · 每侧 {padding} 格</Typography>
      </section>
      <div shuku-edit-id="e-eba63958-e948-432c-93b0-fdb511d90615" className="aipe-replay-cg-copy-ck-padding__right">
        <section shuku-edit-id="e-3f4b19a7-524c-447b-af4a-7f2a29daa26c" className="aipe-replay-cg-copy-ck-padding__output-stage" aria-label="输出特征图">
          <Typography shuku-edit-id="e-6361129f-57c0-4afe-be8e-2dd730be3264" as="h2" variant="h3" tone="accent">输出特征图 {outputSize} × {outputSize}</Typography>
          <OutputGrid size={outputSize} step={step} />
          <Typography shuku-edit-id="e-1f77ca76-a63c-4731-acf2-b16d73b269d1" variant="bodySmall" tone="muted">每放置一次窗口，生成一个输出位置。</Typography>
        </section>
        <section shuku-edit-id="e-5d334f76-7708-44d1-8775-cb072d0c5151" className="aipe-replay-cg-copy-ck-padding__formula-panel" aria-label="输出尺寸计算">
          <Typography shuku-edit-id="e-1ebd85cb-efb5-4aa3-b6fb-81babdb08c27" as="h2" variant="h3" tone="accent">输出尺寸</Typography>
          <MathFormulaBlock ariaLabel="步长为一时，输出边长等于输入边长加两倍填充，减卷积核边长再加一"><MathFormulaStatic latex={String.raw`N_{\mathrm{out}}=N_{\mathrm{in}}+2P-K+1`} /></MathFormulaBlock>
          <Typography shuku-edit-id="e-aacf76c7-22ee-4234-b0f1-9eb934f4163f" variant="bodySmall" tone="muted">步长固定为 1 · 每侧填充 P</Typography>
        </section>
      </div>
    </div>
  </ContentBlock>;
}
