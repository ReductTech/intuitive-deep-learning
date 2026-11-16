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

  return <ContentBlock shuku-edit-id="e-f26ca823-fa80-4e77-9caa-acff863c1f34" headingLevel={1} className="cg-copy-ck-dilate" title="空洞卷积" subtitle="同样的 9 个权重，拉开采样间隔，读取更远位置的信息。">
    <div shuku-edit-id="e-c6174961-62e3-4f29-8d3c-31a1e1a0fa3b" className="cg-copy-ck-dilate__layout">
      <section shuku-edit-id="e-f8d01cee-56e2-430a-a648-45cc3e4dfe1d" className="cg-copy-ck-dilate__visual" aria-label="空洞卷积三层交互模型">
        <div shuku-edit-id="e-480222fc-a3b8-4e1a-ba57-b8a7706366e8" className="cg-copy-ck-dilate__hint"><Typography shuku-edit-id="e-cb097e12-fbc4-4c57-a3f8-c86a0d35b56b" variant="body" tone="muted">点击输出格子选位置 · 拖动旋转 · 滚轮缩放</Typography></div>
        <DilatedConvolutionScene rate={rate} selected={selected} onSelect={setSelected} />
      </section>
      <aside shuku-edit-id="e-a3b91bc6-2098-4b47-bd8c-cc3f87652eeb" className="cg-copy-ck-dilate__aside">
        <section shuku-edit-id="e-27c26c46-311d-47a8-b998-d215b8e68205" className="cg-copy-ck-dilate__panel">
          <Typography shuku-edit-id="e-0ecfd55e-042b-4c67-a2e0-12357fd1276d" as="h2" variant="h3" tone="accent">空洞率 d</Typography>
          <div shuku-edit-id="e-38c80218-5c8a-4444-b9ac-b70cca1686b5" className="cg-copy-ck-dilate__rate-choices" role="group" aria-label="选择空洞率">
            {RATES.map((value) => <button shuku-edit-id="e-3f21acfb-f005-408c-9a10-15bde2a00f48" type="button" key={value} className={rate === value ? 'is-selected' : ''} aria-pressed={rate === value} onClick={() => chooseRate(value)}><Typography shuku-edit-id="e-705762a9-3faa-484b-a706-3372b23f7389" as="span" variant="h3" tone="inherit">{value}</Typography></button>)}
          </div>
          <Typography shuku-edit-id="e-9725ab1b-f66f-441f-93c3-c79401a33f1f" variant="body" tone="muted">3 × 3 卷积核 · 步长 1 · 不填充</Typography>
        </section>
        <section shuku-edit-id="e-3fad92ac-076b-42a8-be21-95404bd9f51b" className="cg-copy-ck-dilate__panel cg-copy-ck-dilate__facts">
          <Typography shuku-edit-id="e-c2f57193-c0c6-42c2-8ac8-0a768f5933e6" as="h2" variant="h3" tone="accent">当前结果</Typography>
          <div shuku-edit-id="e-3ffffbec-7a09-49cd-a73c-18d91a580596"><Typography shuku-edit-id="e-fa6c9597-57a5-415d-a208-d8e62b2185d5" variant="body" tone="accent">实际权重</Typography><Typography shuku-edit-id="e-62c6830d-34fe-4671-9f37-612742ce83e3" variant="body" tone="accent">始终 9 个</Typography></div>
          <div shuku-edit-id="e-4d3ed2d3-a169-4f12-873b-ef70f644d993"><Typography shuku-edit-id="e-67577334-5916-4e77-806a-a650a9baf5f9" variant="body" tone="accent">采样范围</Typography><Typography shuku-edit-id="e-62aec167-b1df-4b27-b50a-87f240880d26" variant="body" tone="accent">{effectiveSize} × {effectiveSize}</Typography></div>
          <div shuku-edit-id="e-cdeaedb8-38ed-42e2-820e-9c69e2e82bc3"><Typography shuku-edit-id="e-00054b1f-5129-4f83-8d86-cca6725fd02d" variant="body" tone="accent">输出尺寸</Typography><Typography shuku-edit-id="e-ef15c45d-617a-4e30-8531-70c117ab0043" variant="body" tone="accent">9 × 9 → {outputSize} × {outputSize}</Typography></div>
        </section>
      </aside>
    </div>
  </ContentBlock>;
}
