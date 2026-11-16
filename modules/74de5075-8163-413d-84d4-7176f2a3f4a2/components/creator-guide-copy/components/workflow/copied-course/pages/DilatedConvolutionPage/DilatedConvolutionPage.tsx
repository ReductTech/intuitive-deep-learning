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

  return <ContentBlock shuku-edit-id="e-48428cf4-69be-4027-93d0-ec22b57c684a" headingLevel={1} className="aipe-replay-cg-copy-ck-dilate" title="空洞卷积" subtitle="同样的 9 个权重，拉开采样间隔，读取更远位置的信息。">
    <div shuku-edit-id="e-8f240b7a-0bc1-4331-a14a-9cd828b8651f" className="aipe-replay-cg-copy-ck-dilate__layout">
      <section shuku-edit-id="e-65fc47dc-1169-4e25-86f1-cd04e4308527" className="aipe-replay-cg-copy-ck-dilate__visual" aria-label="空洞卷积三层交互模型">
        <div shuku-edit-id="e-f7249011-d996-49b3-a73d-4703d27b2b73" className="aipe-replay-cg-copy-ck-dilate__hint"><Typography shuku-edit-id="e-735417d4-fa4b-4a6f-a6bc-3b9005061dc8" variant="body" tone="muted">点击输出格子选位置 · 拖动旋转 · 滚轮缩放</Typography></div>
        <DilatedConvolutionScene rate={rate} selected={selected} onSelect={setSelected} />
      </section>
      <aside shuku-edit-id="e-65daa865-dd04-4706-a58b-6cb3bf0d6283" className="aipe-replay-cg-copy-ck-dilate__aside">
        <section shuku-edit-id="e-f72ea898-119d-46db-82f0-c8285c4bd4a9" className="aipe-replay-cg-copy-ck-dilate__panel">
          <Typography shuku-edit-id="e-db996728-e1e7-4107-a95d-65b374d60c8e" as="h2" variant="h3" tone="accent">空洞率 d</Typography>
          <div shuku-edit-id="e-56c75c36-29f0-4f67-b583-8a9a1e6285a9" className="aipe-replay-cg-copy-ck-dilate__rate-choices" role="group" aria-label="选择空洞率">
            {RATES.map((value) => <button shuku-edit-id="e-7443b38b-fffa-42a7-8726-a2e7308dde32" type="button" key={value} className={rate === value ? 'is-selected' : ''} aria-pressed={rate === value} onClick={() => chooseRate(value)}><Typography shuku-edit-id="e-9fd3bc8f-5d3f-47ef-968e-d9e3d6668eab" as="span" variant="h3" tone="inherit">{value}</Typography></button>)}
          </div>
          <Typography shuku-edit-id="e-b6f9ceb5-fad2-4142-8428-53770f016dba" variant="body" tone="muted">3 × 3 卷积核 · 步长 1 · 不填充</Typography>
        </section>
        <section shuku-edit-id="e-3748df89-ebe5-49a5-81b2-b5a1416518c7" className="aipe-replay-cg-copy-ck-dilate__panel aipe-replay-cg-copy-ck-dilate__facts">
          <Typography shuku-edit-id="e-06562ceb-0569-44ef-810e-909a87d17eef" as="h2" variant="h3" tone="accent">当前结果</Typography>
          <div shuku-edit-id="e-8e8864a5-2c5e-462e-9e32-d125c0a7186c"><Typography shuku-edit-id="e-bd979560-03ef-477d-aef6-5c3f4625ce10" variant="body" tone="accent">实际权重</Typography><Typography shuku-edit-id="e-86ad49fd-8943-4386-a4a0-bf4a111c37d2" variant="body" tone="accent">始终 9 个</Typography></div>
          <div shuku-edit-id="e-56a28541-098b-485b-b533-c2b42cfa64a9"><Typography shuku-edit-id="e-9a102052-72d9-4cdc-bb4f-bba46e07d95d" variant="body" tone="accent">采样范围</Typography><Typography shuku-edit-id="e-185e4416-daae-41cb-8110-2f80ef72107d" variant="body" tone="accent">{effectiveSize} × {effectiveSize}</Typography></div>
          <div shuku-edit-id="e-a057cc35-3054-421f-9934-4602476efb12"><Typography shuku-edit-id="e-1a1d1296-0312-45aa-a390-6871ba5960af" variant="body" tone="accent">输出尺寸</Typography><Typography shuku-edit-id="e-a56d645c-c630-4668-9c4b-7bc121c2e226" variant="body" tone="accent">9 × 9 → {outputSize} × {outputSize}</Typography></div>
        </section>
      </aside>
    </div>
  </ContentBlock>;
}
