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

  return <ContentBlock shuku-edit-id="e-c9096480-8597-47a3-bdd9-5179dbb46255" headingLevel={1} className="cg-copy-ck-dilate" title="空洞卷积" subtitle="同样的 9 个权重，拉开采样间隔，读取更远位置的信息。">
    <div shuku-edit-id="e-7d88208a-7e23-45d7-b4b6-6b1cca0d7060" className="cg-copy-ck-dilate__layout">
      <section shuku-edit-id="e-84fe0163-54ca-4501-be94-40712ea02755" className="cg-copy-ck-dilate__visual" aria-label="空洞卷积三层交互模型">
        <div shuku-edit-id="e-fbda9a24-8f50-4a8a-8b47-c3e579067934" className="cg-copy-ck-dilate__hint"><Typography shuku-edit-id="e-bbed05a6-c33c-4375-94d2-f32a85cce4ce" variant="body" tone="muted">点击输出格子选位置 · 拖动旋转 · 滚轮缩放</Typography></div>
        <DilatedConvolutionScene rate={rate} selected={selected} onSelect={setSelected} />
      </section>
      <aside shuku-edit-id="e-dee1ba83-04a9-43ff-96b0-a39574ac9685" className="cg-copy-ck-dilate__aside">
        <section shuku-edit-id="e-1f764f33-8c62-4a66-8b7d-4179d1e3f5e4" className="cg-copy-ck-dilate__panel">
          <Typography shuku-edit-id="e-ba5bca1e-b07e-4871-a879-b25ec3dd98e7" as="h2" variant="h3" tone="accent">空洞率 d</Typography>
          <div shuku-edit-id="e-2ffe45b8-a612-4542-9341-b90d466020dc" className="cg-copy-ck-dilate__rate-choices" role="group" aria-label="选择空洞率">
            {RATES.map((value) => <button shuku-edit-id="e-3902e843-3a69-4398-907a-54a7f393d979" type="button" key={value} className={rate === value ? 'is-selected' : ''} aria-pressed={rate === value} onClick={() => chooseRate(value)}><Typography shuku-edit-id="e-cac36bd3-3f5f-4a0c-9522-5a9ce875d972" as="span" variant="h3" tone="inherit">{value}</Typography></button>)}
          </div>
          <Typography shuku-edit-id="e-b52e5dba-69de-412b-9d0b-fb661a7544fa" variant="body" tone="muted">3 × 3 卷积核 · 步长 1 · 不填充</Typography>
        </section>
        <section shuku-edit-id="e-bd815be6-527a-4c46-8ea0-3f947569f42b" className="cg-copy-ck-dilate__panel cg-copy-ck-dilate__facts">
          <Typography shuku-edit-id="e-0e61af1f-ae5f-447f-95e9-b223433811bc" as="h2" variant="h3" tone="accent">当前结果</Typography>
          <div shuku-edit-id="e-03f8da77-0c65-40fc-acf9-61e0b0072fbc"><Typography shuku-edit-id="e-3c2a441f-0310-4c53-95c5-3968d99f7af3" variant="body" tone="accent">实际权重</Typography><Typography shuku-edit-id="e-45f9b5f8-128f-4cd3-8923-de73cfa496fa" variant="body" tone="accent">始终 9 个</Typography></div>
          <div shuku-edit-id="e-21b2c045-b23c-4ea0-a32d-eda72525a160"><Typography shuku-edit-id="e-1bfaecf0-a444-49bb-a4c4-33ddf91c009a" variant="body" tone="accent">采样范围</Typography><Typography shuku-edit-id="e-c8f37e1f-4450-4014-8085-3569c56440a3" variant="body" tone="accent">{effectiveSize} × {effectiveSize}</Typography></div>
          <div shuku-edit-id="e-f0a5d177-84e7-4a5c-b17d-9c553733b0cc"><Typography shuku-edit-id="e-844b5ee3-7c41-4629-9122-31b1a6bc00bf" variant="body" tone="accent">输出尺寸</Typography><Typography shuku-edit-id="e-5a5978f5-b9ae-47f8-a219-44b3cf08d21c" variant="body" tone="accent">9 × 9 → {outputSize} × {outputSize}</Typography></div>
        </section>
      </aside>
    </div>
  </ContentBlock>;
}
