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

  return <ContentBlock shuku-edit-id="e-f1443f1a-b366-409f-bc95-459ab0c02ebc" headingLevel={1} className="ck-dilate" title="空洞卷积" subtitle="同样的 9 个权重，拉开采样间隔，读取更远位置的信息。">
    <div shuku-edit-id="e-424a3408-0feb-4e56-8522-a1622e1a1977" className="ck-dilate__layout">
      <section shuku-edit-id="e-48a1dbfa-cd06-4f68-bdde-3dbf230b1658" className="ck-dilate__visual" aria-label="空洞卷积三层交互模型">
        <div shuku-edit-id="e-87204fbc-4bcb-4f36-8bb7-1dd9ae3b445c" className="ck-dilate__hint"><Typography shuku-edit-id="e-037c4eaa-b950-4914-b1f9-6401a1310ce8" variant="body" tone="muted">点击输出格子选位置 · 拖动旋转 · 滚轮缩放</Typography></div>
        <DilatedConvolutionScene rate={rate} selected={selected} onSelect={setSelected} />
      </section>
      <aside shuku-edit-id="e-48b162eb-b84d-4110-b729-aa86e461e0e1" className="ck-dilate__aside">
        <section shuku-edit-id="e-a1b01eb1-0171-44d9-bee9-0851b7835ce4" className="ck-dilate__panel">
          <Typography shuku-edit-id="e-e79b575b-1243-480c-9ba1-e5761093b075" as="h2" variant="h3" tone="accent">空洞率 d</Typography>
          <div shuku-edit-id="e-496a186d-fbc2-485c-a8ea-59529b9cbb36" className="ck-dilate__rate-choices" role="group" aria-label="选择空洞率">
            {RATES.map((value) => <button shuku-edit-id="e-f744db96-7237-4eec-8d9b-71b77ee1ee2b" type="button" key={value} className={rate === value ? 'is-selected' : ''} aria-pressed={rate === value} onClick={() => chooseRate(value)}><Typography shuku-edit-id="e-1303483b-0752-47fd-9eb3-d94079738439" as="span" variant="h3" tone="inherit">{value}</Typography></button>)}
          </div>
          <Typography shuku-edit-id="e-e6934e1f-697b-4cf0-ac94-a6c99646cdb4" variant="body" tone="muted">3 × 3 卷积核 · 步长 1 · 不填充</Typography>
        </section>
        <section shuku-edit-id="e-66f99242-b606-4775-9459-ec9391f4184c" className="ck-dilate__panel ck-dilate__facts">
          <Typography shuku-edit-id="e-f8d031b1-8b93-4521-8709-966ca56f9a13" as="h2" variant="h3" tone="accent">当前结果</Typography>
          <div shuku-edit-id="e-73eb808b-c4be-4ad2-8b82-aa200936a1cc"><Typography shuku-edit-id="e-98c98273-787c-48cd-8056-74f9c4cbf964" variant="body" tone="accent">实际权重</Typography><Typography shuku-edit-id="e-9c813eae-5396-44c8-8648-990f7d662fe8" variant="body" tone="accent">始终 9 个</Typography></div>
          <div shuku-edit-id="e-361a6c1b-6b8c-4fba-9973-01585eb492a7"><Typography shuku-edit-id="e-13ae5e40-7acf-4014-af2a-b6b4f95ad5f1" variant="body" tone="accent">采样范围</Typography><Typography shuku-edit-id="e-19c3981a-7806-4357-859b-1bce7ce9f55d" variant="body" tone="accent">{effectiveSize} × {effectiveSize}</Typography></div>
          <div shuku-edit-id="e-2aa0ded4-dffd-4999-a676-975b2d5a4db8"><Typography shuku-edit-id="e-333ad0f2-5183-4b49-9fb4-d4f14e56d85c" variant="body" tone="accent">输出尺寸</Typography><Typography shuku-edit-id="e-3767bb8a-b66b-4304-aa5a-ee09c1d72228" variant="body" tone="accent">9 × 9 → {outputSize} × {outputSize}</Typography></div>
        </section>
      </aside>
    </div>
  </ContentBlock>;
}
