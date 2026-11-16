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

  return <ContentBlock shuku-edit-id="e-25c6107e-0e45-4582-a5f6-01fd941dce67" headingLevel={1} className="aipe-replay-cg-copy-ck-dilate" title="空洞卷积" subtitle="同样的 9 个权重，拉开采样间隔，读取更远位置的信息。">
    <div shuku-edit-id="e-7672ebcd-182a-4b07-8482-d092a6f24d62" className="aipe-replay-cg-copy-ck-dilate__layout">
      <section shuku-edit-id="e-d5376880-2cce-454a-8778-4047d4919ca7" className="aipe-replay-cg-copy-ck-dilate__visual" aria-label="空洞卷积三层交互模型">
        <div shuku-edit-id="e-d2590c41-5063-4823-ae24-52c94fa3be84" className="aipe-replay-cg-copy-ck-dilate__hint"><Typography shuku-edit-id="e-16aa538d-cc44-4ac4-8b19-0d2b9c7aa7de" variant="body" tone="muted">点击输出格子选位置 · 拖动旋转 · 滚轮缩放</Typography></div>
        <DilatedConvolutionScene rate={rate} selected={selected} onSelect={setSelected} />
      </section>
      <aside shuku-edit-id="e-045567eb-4f0d-4f10-8352-7312bd0d5928" className="aipe-replay-cg-copy-ck-dilate__aside">
        <section shuku-edit-id="e-19a93d18-387c-4bac-b22e-1389cecfaca4" className="aipe-replay-cg-copy-ck-dilate__panel">
          <Typography shuku-edit-id="e-cf657176-ae99-431b-9dbd-ea8011ccd50a" as="h2" variant="h3" tone="accent">空洞率 d</Typography>
          <div shuku-edit-id="e-b4d78646-ae92-4c98-adfb-c9e4c79767a3" className="aipe-replay-cg-copy-ck-dilate__rate-choices" role="group" aria-label="选择空洞率">
            {RATES.map((value) => <button shuku-edit-id="e-9f031b67-0426-435a-a853-cc35f19fb123" type="button" key={value} className={rate === value ? 'is-selected' : ''} aria-pressed={rate === value} onClick={() => chooseRate(value)}><Typography shuku-edit-id="e-67e63aeb-95f5-46c6-8006-b70264b12e50" as="span" variant="h3" tone="inherit">{value}</Typography></button>)}
          </div>
          <Typography shuku-edit-id="e-f13e69e4-4db7-4211-8cd8-e95524deb14d" variant="body" tone="muted">3 × 3 卷积核 · 步长 1 · 不填充</Typography>
        </section>
        <section shuku-edit-id="e-2a93d567-5947-481f-a6a2-1c41627ddd5d" className="aipe-replay-cg-copy-ck-dilate__panel aipe-replay-cg-copy-ck-dilate__facts">
          <Typography shuku-edit-id="e-16e4e511-948b-4dba-a75c-9bed7439b2b5" as="h2" variant="h3" tone="accent">当前结果</Typography>
          <div shuku-edit-id="e-cc6e7816-7745-4086-9c2e-9ddfc455b526"><Typography shuku-edit-id="e-58d8137a-e8d1-4055-96c8-eba23975f1b0" variant="body" tone="accent">实际权重</Typography><Typography shuku-edit-id="e-3b618050-4061-4b58-b5e3-c9c2b3e828e8" variant="body" tone="accent">始终 9 个</Typography></div>
          <div shuku-edit-id="e-69db91f7-13ee-46d4-adf9-4aeaf2a035ce"><Typography shuku-edit-id="e-e0993e9e-286f-41df-a143-f30274b7bbe1" variant="body" tone="accent">采样范围</Typography><Typography shuku-edit-id="e-2c315a9c-07bc-4690-a31a-4008013ef894" variant="body" tone="accent">{effectiveSize} × {effectiveSize}</Typography></div>
          <div shuku-edit-id="e-df0871aa-0141-4724-97e7-26aa95867ac8"><Typography shuku-edit-id="e-a18a14d7-e818-487f-b87d-c308736351bd" variant="body" tone="accent">输出尺寸</Typography><Typography shuku-edit-id="e-4112ae3e-2674-452f-8b70-cada494a88bf" variant="body" tone="accent">9 × 9 → {outputSize} × {outputSize}</Typography></div>
        </section>
      </aside>
    </div>
  </ContentBlock>;
}
