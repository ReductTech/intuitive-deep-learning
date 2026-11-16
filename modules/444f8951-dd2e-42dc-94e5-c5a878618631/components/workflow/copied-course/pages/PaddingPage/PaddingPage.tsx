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
  return <div shuku-edit-id="e-b5f67eee-a09f-4a19-b3e3-8a52a14a925c" className="cg-copy-ck-padding__input-grid" style={{ '--grid-size': size } as CSSProperties} role="img" aria-label={`${size} 乘 ${size} 输入网格，每侧补零 ${padding} 格，卷积窗口位于第 ${top + 1} 行、第 ${left + 1} 列`}>
    {Array.from({ length: size * size }, (_, index) => {
      const row = Math.floor(index / size), col = index % size;
      const isPadding = row < padding || col < padding || row >= size - padding || col >= size - padding;
      const inWindow = row >= top && row < top + KERNEL_SIZE && col >= left && col < left + KERNEL_SIZE;
      return <span shuku-edit-id="e-ff93aa20-50d6-486c-9204-2f7cd261847a" key={index} className={`${isPadding ? 'is-padding' : ''} ${inWindow ? 'is-window' : ''}`} />;
    })}
    <div shuku-edit-id="e-3905a750-5182-4713-b2fa-b01e3a297c5d" className="cg-copy-ck-padding__window" style={{ left: `${left / size * 100}%`, top: `${top / size * 100}%`, width: `${KERNEL_SIZE / size * 100}%`, height: `${KERNEL_SIZE / size * 100}%` }} />
  </div>;
}

function OutputGrid({ size, step }: { size: number; step: number }) {
  const total = size * size;
  return <div shuku-edit-id="e-293c8826-65ae-4ed8-92a0-0ff59c4ab63e" className="cg-copy-ck-padding__output-grid" style={{ '--output-size': size } as CSSProperties} role="img" aria-label={`${size} 乘 ${size} 输出特征图，共 ${total} 个位置，已扫描 ${Math.min(step, total)} 个`}>
    {Array.from({ length: total }, (_, index) => <span shuku-edit-id="e-9fd64c54-e434-4c89-8a51-8da3afbd202a" key={index} className={index === step && step < total ? 'is-current' : index < step ? 'is-complete' : ''} />)}
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

  return <ContentBlock shuku-edit-id="e-6ab051ce-1273-4e73-a7a2-1114c2c53d36" headingLevel={1} className="cg-copy-ck-padding" title="边界填充" subtitle="固定 7 × 7 输入、3 × 3 卷积核与步长 1；在边界外补零，观察输出尺寸如何变化。">
    <div shuku-edit-id="e-1021c4da-6194-46c4-b1a2-f74091c5884b" className="cg-copy-ck-padding__workspace">
      <section shuku-edit-id="e-137c45a3-015c-4486-8d41-95cf7868814e" className="cg-copy-ck-padding__picker" aria-label="选择边界填充">
        <Typography shuku-edit-id="e-71c5a1c9-f19a-4dc8-9f5c-4a423336c36e" as="h2" variant="h3" tone="accent">填充 P</Typography>
        <div shuku-edit-id="e-150af0c3-1027-4c1a-b907-3e472d055334" className="cg-copy-ck-padding__choices" role="group" aria-label="每侧补零层数">
          {PADDINGS.map((value) => <button shuku-edit-id="e-38b9466c-18eb-48b9-8452-c3a5f1e1bb61" key={value} type="button" className={padding === value ? 'is-selected' : ''} aria-pressed={padding === value} onClick={() => choosePadding(value)}><Typography shuku-edit-id="e-380feadd-c86d-4ca2-a49b-95856081433f" as="span" variant="h2" tone="inherit">{value}</Typography></button>)}
        </div>
        <Typography shuku-edit-id="e-55a5af2b-3fba-4c06-b469-5e16e1876c1a" variant="bodySmall" tone="muted">填充越多，可放置窗口的位置越多。</Typography>
      </section>
      <section shuku-edit-id="e-68ce5f92-b985-46e6-ada8-22cfb189bef5" className="cg-copy-ck-padding__input-stage" aria-label="输入网格与当前卷积窗口">
        <Typography shuku-edit-id="e-7cf4cef8-6d40-45f8-9be0-8824004ba5ba" as="h2" variant="h3" tone="accent">输入网格 {paddedSize} × {paddedSize}</Typography>
        <InputGrid padding={padding} step={step} outputSize={outputSize} />
        <Typography shuku-edit-id="e-a3b5f9d3-3c73-46a4-87b4-d824c4bd42b5" variant="bodySmall" tone="accent">浅蓝色为边界外补的零 · 每侧 {padding} 格</Typography>
      </section>
      <div shuku-edit-id="e-ce81e873-d135-4820-9011-90fe6a0c8fae" className="cg-copy-ck-padding__right">
        <section shuku-edit-id="e-42f190a0-21e2-404a-899c-1d20767e18b5" className="cg-copy-ck-padding__output-stage" aria-label="输出特征图">
          <Typography shuku-edit-id="e-672edbef-0fd8-4f3b-a19e-292835d22fb2" as="h2" variant="h3" tone="accent">输出特征图 {outputSize} × {outputSize}</Typography>
          <OutputGrid size={outputSize} step={step} />
          <Typography shuku-edit-id="e-63630cfe-ce36-49c4-a798-367a4fa643c8" variant="bodySmall" tone="muted">每放置一次窗口，生成一个输出位置。</Typography>
        </section>
        <section shuku-edit-id="e-0f90c5b6-4d25-4062-9576-3057aa93d603" className="cg-copy-ck-padding__formula-panel" aria-label="输出尺寸计算">
          <Typography shuku-edit-id="e-5443e87e-3687-4a32-a81a-826303447828" as="h2" variant="h3" tone="accent">输出尺寸</Typography>
          <MathFormulaBlock ariaLabel="步长为一时，输出边长等于输入边长加两倍填充，减卷积核边长再加一"><MathFormulaStatic latex={String.raw`N_{\mathrm{out}}=N_{\mathrm{in}}+2P-K+1`} /></MathFormulaBlock>
          <Typography shuku-edit-id="e-b2083bd0-fddb-4318-896b-48d1b90cd13b" variant="bodySmall" tone="muted">步长固定为 1 · 每侧填充 P</Typography>
        </section>
      </div>
    </div>
  </ContentBlock>;
}
