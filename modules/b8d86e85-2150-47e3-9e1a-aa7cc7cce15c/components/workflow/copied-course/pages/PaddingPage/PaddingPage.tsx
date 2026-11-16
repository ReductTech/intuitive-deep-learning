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
  return <div shuku-edit-id="e-a788047b-91bd-4e59-8fce-0c3302988a98" className="cg-copy-ck-padding__input-grid" style={{ '--grid-size': size } as CSSProperties} role="img" aria-label={`${size} 乘 ${size} 输入网格，每侧补零 ${padding} 格，卷积窗口位于第 ${top + 1} 行、第 ${left + 1} 列`}>
    {Array.from({ length: size * size }, (_, index) => {
      const row = Math.floor(index / size), col = index % size;
      const isPadding = row < padding || col < padding || row >= size - padding || col >= size - padding;
      const inWindow = row >= top && row < top + KERNEL_SIZE && col >= left && col < left + KERNEL_SIZE;
      return <span shuku-edit-id="e-e0d9cb40-267f-41bb-adfd-8aa3dd23c847" key={index} className={`${isPadding ? 'is-padding' : ''} ${inWindow ? 'is-window' : ''}`} />;
    })}
    <div shuku-edit-id="e-806dd2bf-b935-44bc-a3df-30addcf536a9" className="cg-copy-ck-padding__window" style={{ left: `${left / size * 100}%`, top: `${top / size * 100}%`, width: `${KERNEL_SIZE / size * 100}%`, height: `${KERNEL_SIZE / size * 100}%` }} />
  </div>;
}

function OutputGrid({ size, step }: { size: number; step: number }) {
  const total = size * size;
  return <div shuku-edit-id="e-2091fc50-e51d-4b5c-b03a-c30d30674f75" className="cg-copy-ck-padding__output-grid" style={{ '--output-size': size } as CSSProperties} role="img" aria-label={`${size} 乘 ${size} 输出特征图，共 ${total} 个位置，已扫描 ${Math.min(step, total)} 个`}>
    {Array.from({ length: total }, (_, index) => <span shuku-edit-id="e-fa13ca73-4cf3-46a4-a8fe-d11ea4e055af" key={index} className={index === step && step < total ? 'is-current' : index < step ? 'is-complete' : ''} />)}
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

  return <ContentBlock shuku-edit-id="e-68952fd7-d051-4a5a-8315-3f8c4f24f337" headingLevel={1} className="cg-copy-ck-padding" title="边界填充" subtitle="固定 7 × 7 输入、3 × 3 卷积核与步长 1；在边界外补零，观察输出尺寸如何变化。">
    <div shuku-edit-id="e-2c8b322a-0b5e-4b00-bf59-33e5e275b752" className="cg-copy-ck-padding__workspace">
      <section shuku-edit-id="e-db459ee9-4936-456c-9f61-07c97230c4bc" className="cg-copy-ck-padding__picker" aria-label="选择边界填充">
        <Typography shuku-edit-id="e-8096ed9c-573d-4ca8-8433-d6a8dd0ddbdf" as="h2" variant="h3" tone="accent">填充 P</Typography>
        <div shuku-edit-id="e-18fb3cf9-7fc3-49e4-8af9-c47d576f1685" className="cg-copy-ck-padding__choices" role="group" aria-label="每侧补零层数">
          {PADDINGS.map((value) => <button shuku-edit-id="e-93d9c025-3b3d-45cb-81d8-edde86e5d89f" key={value} type="button" className={padding === value ? 'is-selected' : ''} aria-pressed={padding === value} onClick={() => choosePadding(value)}><Typography shuku-edit-id="e-5b231628-8c73-40f1-9891-60d478c47020" as="span" variant="h2" tone="inherit">{value}</Typography></button>)}
        </div>
        <Typography shuku-edit-id="e-81e4d2b9-9441-4128-a5d1-6e03cf30337c" variant="bodySmall" tone="muted">填充越多，可放置窗口的位置越多。</Typography>
      </section>
      <section shuku-edit-id="e-947e00c2-d07d-41c9-8962-4f702c03568f" className="cg-copy-ck-padding__input-stage" aria-label="输入网格与当前卷积窗口">
        <Typography shuku-edit-id="e-612881cb-75ba-45f9-a5d9-529f5e2388b1" as="h2" variant="h3" tone="accent">输入网格 {paddedSize} × {paddedSize}</Typography>
        <InputGrid padding={padding} step={step} outputSize={outputSize} />
        <Typography shuku-edit-id="e-dcb931bf-28ec-4bb8-8576-c42019aaa198" variant="bodySmall" tone="accent">浅蓝色为边界外补的零 · 每侧 {padding} 格</Typography>
      </section>
      <div shuku-edit-id="e-da62be87-56a7-4bf7-ad58-7e4174c7476d" className="cg-copy-ck-padding__right">
        <section shuku-edit-id="e-5d870ffc-b948-46eb-849e-9d4d44f25e22" className="cg-copy-ck-padding__output-stage" aria-label="输出特征图">
          <Typography shuku-edit-id="e-c389b2ec-642c-4f3b-b215-e544a0ef0dae" as="h2" variant="h3" tone="accent">输出特征图 {outputSize} × {outputSize}</Typography>
          <OutputGrid size={outputSize} step={step} />
          <Typography shuku-edit-id="e-98af7033-6069-4c0f-95bc-0be4bba5293c" variant="bodySmall" tone="muted">每放置一次窗口，生成一个输出位置。</Typography>
        </section>
        <section shuku-edit-id="e-a21e14cf-f2a3-4461-b0c3-81e607c188e2" className="cg-copy-ck-padding__formula-panel" aria-label="输出尺寸计算">
          <Typography shuku-edit-id="e-8537cfa6-a64f-4262-bcfe-96eee9fc4998" as="h2" variant="h3" tone="accent">输出尺寸</Typography>
          <MathFormulaBlock ariaLabel="步长为一时，输出边长等于输入边长加两倍填充，减卷积核边长再加一"><MathFormulaStatic latex={String.raw`N_{\mathrm{out}}=N_{\mathrm{in}}+2P-K+1`} /></MathFormulaBlock>
          <Typography shuku-edit-id="e-e0ec6e57-0d84-4559-adf9-1e5cd65e9ef1" variant="bodySmall" tone="muted">步长固定为 1 · 每侧填充 P</Typography>
        </section>
      </div>
    </div>
  </ContentBlock>;
}
