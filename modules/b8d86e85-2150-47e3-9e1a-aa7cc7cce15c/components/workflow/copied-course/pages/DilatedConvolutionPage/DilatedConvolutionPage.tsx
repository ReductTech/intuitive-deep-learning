import { useState } from 'react';
import { ContentBlock, Typography } from "@shuku/course-style/react";
import { DilatedConvolutionScene, type OutputCell } from './DilatedConvolutionScene';
import './DilatedConvolutionPage.css';

const RATES = [1, 2, 3] as const;
export type DilationRate = typeof RATES[number];
const INPUT_SIZE = 9;

export function DilatedConvolutionPage() {
  const [rate, setRate] = useState<DilationRate>(2);
  const [selected, setSelected] = useState<OutputCell>({ row: 2, col: 2 });
  const effectiveSize = 2 * rate + 1;
  const outputSize = INPUT_SIZE - effectiveSize + 1;
  const chooseRate = (value: DilationRate) => {
    setRate(value);
    const middle = Math.floor((INPUT_SIZE - 2 * value) / 2);
    setSelected({ row: middle, col: middle });
  };

  return <ContentBlock shuku-edit-id="e-010cb77e-4311-4b9f-99f3-6ad29c18e73d" headingLevel={1} className="cg-copy-ck-dilate" title="空洞卷积" subtitle="同样的 9 个权重，拉开采样间隔，读取更远位置的信息。">
    <div shuku-edit-id="e-4aa37f14-1bff-46ae-a4aa-e33eefe9ebad" className="cg-copy-ck-dilate__layout">
      <section shuku-edit-id="e-ca260a09-9340-44b4-91cc-55f17ae6370f" className="cg-copy-ck-dilate__visual" aria-label="空洞卷积三层交互模型">
        <div shuku-edit-id="e-0c146c5a-0db2-448f-83b1-0471a4d84188" className="cg-copy-ck-dilate__hint"><Typography shuku-edit-id="e-024e9bf2-2bd0-4ced-9f84-b142813bc126" variant="body" tone="muted">点击输出格子选位置 · 拖动旋转 · 滚轮缩放</Typography></div>
        <DilatedConvolutionScene rate={rate} selected={selected} onSelect={setSelected} />
      </section>
      <aside shuku-edit-id="e-e015aeba-0a89-4435-b8de-571e31567e8d" className="cg-copy-ck-dilate__aside">
        <section shuku-edit-id="e-3f0ba12b-94ff-45f7-ab4a-a24918df728b" className="cg-copy-ck-dilate__panel">
          <Typography shuku-edit-id="e-7319d00c-3fc9-412e-95f7-c7db9fc9cb5d" as="h2" variant="h3" tone="accent">空洞率 d</Typography>
          <div shuku-edit-id="e-982aff7c-6ab6-4f8c-935e-e54ef640e650" className="cg-copy-ck-dilate__rate-choices" role="group" aria-label="选择空洞率">
            {RATES.map((value) => <button shuku-edit-id="e-55f4d5cd-7420-4c9f-b618-f98938de4f1c" type="button" key={value} className={rate === value ? 'is-selected' : ''} aria-pressed={rate === value} onClick={() => chooseRate(value)}><Typography shuku-edit-id="e-5b81f2a4-8e0f-40b0-89ce-a795a2660e0d" as="span" variant="h3" tone="inherit">{value}</Typography></button>)}
          </div>
          <Typography shuku-edit-id="e-6664018b-e12f-441d-8b49-7c616b332ca5" variant="body" tone="muted">3 × 3 卷积核 · 步长 1 · 不填充</Typography>
        </section>
        <section shuku-edit-id="e-c66f1ed9-494e-40c3-913b-7fd8359ce1a9" className="cg-copy-ck-dilate__panel cg-copy-ck-dilate__facts">
          <Typography shuku-edit-id="e-d1b54841-33bb-4970-9ad0-215901ca22bf" as="h2" variant="h3" tone="accent">当前结果</Typography>
          <div shuku-edit-id="e-7bf3c66c-92ec-4cd5-8ade-c1bf3277bed9"><Typography shuku-edit-id="e-912cd4a0-91f3-4ce5-a2b7-cf6f286b6640" variant="body" tone="accent">实际权重</Typography><Typography shuku-edit-id="e-6742b74f-9e8f-4f71-9684-7abaf6552672" variant="body" tone="accent">始终 9 个</Typography></div>
          <div shuku-edit-id="e-2354e801-ef77-411d-8393-4549ef71410a"><Typography shuku-edit-id="e-fa16e9c1-6ec0-4bde-aa14-80bdd50fc83e" variant="body" tone="accent">采样范围</Typography><Typography shuku-edit-id="e-184799da-1b20-4bc0-adc6-f183c2e6dfa2" variant="body" tone="accent">{effectiveSize} × {effectiveSize}</Typography></div>
          <div shuku-edit-id="e-3a9672bb-9163-435b-bc02-4c5fa64595a3"><Typography shuku-edit-id="e-d3ac85d6-4640-4f3a-83eb-9a4d4e38fdd6" variant="body" tone="accent">输出尺寸</Typography><Typography shuku-edit-id="e-b9e598e1-8c1c-49f3-bea4-f7b2de27f05c" variant="body" tone="accent">9 × 9 → {outputSize} × {outputSize}</Typography></div>
        </section>
      </aside>
    </div>
  </ContentBlock>;
}
