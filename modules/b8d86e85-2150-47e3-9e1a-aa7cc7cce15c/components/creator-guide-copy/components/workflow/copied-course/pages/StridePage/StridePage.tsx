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
  return <div shuku-edit-id="e-b30d6577-eedb-496b-a50b-ee5c51b53995" className="aipe-replay-cg-copy-ck-stride__input-grid" role="img" aria-label={`7 乘 7 输入网格，卷积窗口位于第 ${top + 1} 行、第 ${left + 1} 列`}>
    {Array.from({ length: INPUT_SIZE * INPUT_SIZE }, (_, index) => {
      const row = Math.floor(index / INPUT_SIZE), col = index % INPUT_SIZE;
      return <span shuku-edit-id="e-3dc861d7-fc3f-472c-b330-e63e8e57837d" key={index} className={row >= top && row < top + KERNEL_SIZE && col >= left && col < left + KERNEL_SIZE ? 'is-window' : ''} />;
    })}
    <div shuku-edit-id="e-5caaabfc-48ff-41b5-aeaa-8f1e7e7114fb" className="aipe-replay-cg-copy-ck-stride__window" style={{ left: `${left / INPUT_SIZE * 100}%`, top: `${top / INPUT_SIZE * 100}%`, width: `${KERNEL_SIZE / INPUT_SIZE * 100}%`, height: `${KERNEL_SIZE / INPUT_SIZE * 100}%` }} />
  </div>;
}

function OutputGrid({ size, step }: { size: number; step: number }) {
  const total = size * size;
  return <div shuku-edit-id="e-29b7d5ea-4ca5-4e9e-81a0-7de1a815b7d4" className="aipe-replay-cg-copy-ck-stride__output-grid" style={{ '--output-size': size } as CSSProperties} role="img" aria-label={`${size} 乘 ${size} 输出特征图，共 ${total} 个位置，已扫描 ${Math.min(step, total)} 个`}>
    {Array.from({ length: total }, (_, index) => <span shuku-edit-id="e-b1f0ed97-c0c2-465f-9f6a-9fa5edaa6ca5" key={index} className={index === step && step < total ? 'is-current' : index < step ? 'is-complete' : ''} />)}
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

  return <ContentBlock shuku-edit-id="e-cb680f61-3b63-4073-95e9-1a16e8f86a3a" headingLevel={1} className="aipe-replay-cg-copy-ck-stride" title="卷积步长" subtitle="固定 7 × 7 输入、3 × 3 卷积核与 Valid；步长决定相邻窗口的移动间隔。">
    <div shuku-edit-id="e-5e98b946-afaf-40cc-859e-c61b40a67ecb" className="aipe-replay-cg-copy-ck-stride__workspace">
      <section shuku-edit-id="e-174387b5-6959-4e7a-a21e-b4db515301c4" className="aipe-replay-cg-copy-ck-stride__picker" aria-label="选择卷积步长">
        <Typography shuku-edit-id="e-a40fbaa7-5b4d-4fd1-a7c2-ea21c6d77dd0" as="h2" variant="h3" tone="accent">步长 S</Typography>
        <div shuku-edit-id="e-4dd05174-fc21-4bfa-a1d2-a8152239705b" className="aipe-replay-cg-copy-ck-stride__choices" role="group" aria-label="卷积步长">
          {STRIDES.map((value) => <button shuku-edit-id="e-b03b03db-0952-49f8-82a9-3956f05ba8e6" key={value} type="button" className={stride === value ? 'is-selected' : ''} aria-pressed={stride === value} onClick={() => chooseStride(value)}><Typography shuku-edit-id="e-d2e7b4a3-1035-40f3-a045-d8407b068686" as="span" variant="h2" tone="inherit">{value}</Typography></button>)}
        </div>
        <Typography shuku-edit-id="e-f6969cad-5aab-4528-a7e6-842d6dc0a64f" variant="bodySmall" tone="muted">步长越大，输出位置越少。</Typography>
      </section>
      <section shuku-edit-id="e-fea0ddd5-e9bd-4cf6-a276-26c6053d7179" className="aipe-replay-cg-copy-ck-stride__input-stage" aria-label="输入网格与当前卷积窗口">
        <Typography shuku-edit-id="e-94d359c2-030c-4522-a122-694fcafcd0d2" as="h2" variant="h3" tone="accent">输入网格 7 × 7</Typography>
        <InputGrid stride={stride} step={step} outputSize={outputSize} />
        <Typography shuku-edit-id="e-2f55d888-f491-45a0-8e67-2bde9a31d6a7" variant="bodySmall" tone="accent">3 × 3 窗口每次移动 {stride} 格</Typography>
      </section>
      <div shuku-edit-id="e-a66d529b-86cc-46e3-a1e6-bd7f9d716da1" className="aipe-replay-cg-copy-ck-stride__right">
        <section shuku-edit-id="e-c432bf1d-caac-4e77-accb-a3ee997de6e8" className="aipe-replay-cg-copy-ck-stride__output-stage" aria-label="输出特征图">
          <Typography shuku-edit-id="e-dc71b6bd-1a29-4cb5-baf9-80820d09217d" as="h2" variant="h3" tone="accent">输出特征图 {outputSize} × {outputSize}</Typography>
          <OutputGrid size={outputSize} step={step} />
          <Typography shuku-edit-id="e-a67c9724-e4bb-4d48-9664-e0970c23fcde" variant="bodySmall" tone="muted">每放置一次窗口，生成一个输出位置。</Typography>
        </section>
        <section shuku-edit-id="e-59c254af-2d2b-4cd4-a086-c7839c114991" className="aipe-replay-cg-copy-ck-stride__formula-panel" aria-label="输出尺寸计算">
          <Typography shuku-edit-id="e-c7eee2b2-ce6e-4f64-9210-68de795e69bc" as="h2" variant="h3" tone="accent">输出尺寸</Typography>
          <MathFormulaBlock ariaLabel="不填充时，输出边长等于输入边长减卷积核边长，除以步长后向下取整再加一"><MathFormulaStatic latex={String.raw`N_{\mathrm{out}}=\left\lfloor\frac{N_{\mathrm{in}}-K}{S}\right\rfloor+1`} /></MathFormulaBlock>
          <Typography shuku-edit-id="e-a1aa9d19-4d0d-4706-b4a0-cc830efbc2c7" variant="bodySmall" tone="muted">Valid：不填充 · 步长为 S</Typography>
        </section>
      </div>
    </div>
  </ContentBlock>;
}
