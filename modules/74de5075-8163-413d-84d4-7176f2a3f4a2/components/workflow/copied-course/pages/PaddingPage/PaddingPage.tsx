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
  return <div shuku-edit-id="e-e9f850d2-1935-473d-b904-8e286c24c2cf" className="cg-copy-ck-padding__input-grid" style={{ '--grid-size': size } as CSSProperties} role="img" aria-label={`${size} 乘 ${size} 输入网格，每侧补零 ${padding} 格，卷积窗口位于第 ${top + 1} 行、第 ${left + 1} 列`}>
    {Array.from({ length: size * size }, (_, index) => {
      const row = Math.floor(index / size), col = index % size;
      const isPadding = row < padding || col < padding || row >= size - padding || col >= size - padding;
      const inWindow = row >= top && row < top + KERNEL_SIZE && col >= left && col < left + KERNEL_SIZE;
      return <span shuku-edit-id="e-c9010b29-1d9f-4f79-8853-a422f3a3c398" key={index} className={`${isPadding ? 'is-padding' : ''} ${inWindow ? 'is-window' : ''}`} />;
    })}
    <div shuku-edit-id="e-229d674f-2df3-4635-86ff-e50d8a9f87de" className="cg-copy-ck-padding__window" style={{ left: `${left / size * 100}%`, top: `${top / size * 100}%`, width: `${KERNEL_SIZE / size * 100}%`, height: `${KERNEL_SIZE / size * 100}%` }} />
  </div>;
}

function OutputGrid({ size, step }: { size: number; step: number }) {
  const total = size * size;
  return <div shuku-edit-id="e-04bbab0b-c00d-47f9-bb84-fe87142b51ae" className="cg-copy-ck-padding__output-grid" style={{ '--output-size': size } as CSSProperties} role="img" aria-label={`${size} 乘 ${size} 输出特征图，共 ${total} 个位置，已扫描 ${Math.min(step, total)} 个`}>
    {Array.from({ length: total }, (_, index) => <span shuku-edit-id="e-728a9794-0d0d-4f74-8f5c-dcbc09d90f0e" key={index} className={index === step && step < total ? 'is-current' : index < step ? 'is-complete' : ''} />)}
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

  return <ContentBlock shuku-edit-id="e-67ea12d2-2c0b-4cfa-bdc8-48a8daf778b5" headingLevel={1} className="cg-copy-ck-padding" title="边界填充" subtitle="固定 7 × 7 输入、3 × 3 卷积核与步长 1；在边界外补零，观察输出尺寸如何变化。">
    <div shuku-edit-id="e-7ea6a59a-692a-411b-b4bd-4d73a581b777" className="cg-copy-ck-padding__workspace">
      <section shuku-edit-id="e-c17ecbc0-1964-4eae-8f42-4f9108bb6fea" className="cg-copy-ck-padding__picker" aria-label="选择边界填充">
        <Typography shuku-edit-id="e-74aa09e2-3afd-4419-9672-246cfcd7e7e0" as="h2" variant="h3" tone="accent">填充 P</Typography>
        <div shuku-edit-id="e-3ca7a0d2-2aa1-41b5-83d9-ad745c8d89ad" className="cg-copy-ck-padding__choices" role="group" aria-label="每侧补零层数">
          {PADDINGS.map((value) => <button shuku-edit-id="e-cd651595-66db-433e-9143-aefb17f0ab7d" key={value} type="button" className={padding === value ? 'is-selected' : ''} aria-pressed={padding === value} onClick={() => choosePadding(value)}><Typography shuku-edit-id="e-44b2813d-b036-4cf6-9ae2-d0f613b688e7" as="span" variant="h2" tone="inherit">{value}</Typography></button>)}
        </div>
        <Typography shuku-edit-id="e-dee3866e-1609-485d-9462-9bc609caf096" variant="bodySmall" tone="muted">填充越多，可放置窗口的位置越多。</Typography>
      </section>
      <section shuku-edit-id="e-32d92ea6-80e4-42eb-a2ca-5d8a9ff656ce" className="cg-copy-ck-padding__input-stage" aria-label="输入网格与当前卷积窗口">
        <Typography shuku-edit-id="e-eeed57f0-e4c7-4210-9481-6465838cc67b" as="h2" variant="h3" tone="accent">输入网格 {paddedSize} × {paddedSize}</Typography>
        <InputGrid padding={padding} step={step} outputSize={outputSize} />
        <Typography shuku-edit-id="e-c40c0e49-9154-48d9-890e-22918093d6c4" variant="bodySmall" tone="accent">浅蓝色为边界外补的零 · 每侧 {padding} 格</Typography>
      </section>
      <div shuku-edit-id="e-c8b4fa8c-c1fd-40b8-a550-8b77664c46bb" className="cg-copy-ck-padding__right">
        <section shuku-edit-id="e-fb7ebbcd-bbde-4742-894c-02e8b50e0b07" className="cg-copy-ck-padding__output-stage" aria-label="输出特征图">
          <Typography shuku-edit-id="e-1c149d14-b20b-4ba1-9257-1c06dffb114d" as="h2" variant="h3" tone="accent">输出特征图 {outputSize} × {outputSize}</Typography>
          <OutputGrid size={outputSize} step={step} />
          <Typography shuku-edit-id="e-cfe69e64-882b-4c47-8a44-be7e596859f1" variant="bodySmall" tone="muted">每放置一次窗口，生成一个输出位置。</Typography>
        </section>
        <section shuku-edit-id="e-dfa5767d-114f-4558-89cd-cfdb49c16b04" className="cg-copy-ck-padding__formula-panel" aria-label="输出尺寸计算">
          <Typography shuku-edit-id="e-2b6ad207-30f7-46e5-8852-c6bb55d2d3a8" as="h2" variant="h3" tone="accent">输出尺寸</Typography>
          <MathFormulaBlock ariaLabel="步长为一时，输出边长等于输入边长加两倍填充，减卷积核边长再加一"><MathFormulaStatic latex={String.raw`N_{\mathrm{out}}=N_{\mathrm{in}}+2P-K+1`} /></MathFormulaBlock>
          <Typography shuku-edit-id="e-aa4372df-7d7c-4d77-83df-a1d37cb42c7f" variant="bodySmall" tone="muted">步长固定为 1 · 每侧填充 P</Typography>
        </section>
      </div>
    </div>
  </ContentBlock>;
}
