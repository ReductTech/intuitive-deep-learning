import { useState } from 'react';
import { ContentBlock, Typography } from '../../../shared/react';
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

  return <ContentBlock headingLevel={1} className="ck-dilate" title="空洞卷积" subtitle="同样的 9 个权重，拉开采样间隔，读取更远位置的信息。">
    <div className="ck-dilate__layout">
      <section className="ck-dilate__visual" aria-label="空洞卷积三层交互模型">
        <div className="ck-dilate__hint"><Typography variant="body" tone="muted">点击输出格子选位置 · 拖动旋转 · 滚轮缩放</Typography></div>
        <DilatedConvolutionScene rate={rate} selected={selected} onSelect={setSelected} />
      </section>
      <aside className="ck-dilate__aside">
        <section className="ck-dilate__panel">
          <Typography as="h2" variant="h3" tone="accent">空洞率 d</Typography>
          <div className="ck-dilate__rate-choices" role="group" aria-label="选择空洞率">
            {RATES.map((value) => <button type="button" key={value} className={rate === value ? 'is-selected' : ''} aria-pressed={rate === value} onClick={() => chooseRate(value)}><Typography as="span" variant="h3" tone="inherit">{value}</Typography></button>)}
          </div>
          <Typography variant="body" tone="muted">3 × 3 卷积核 · 步长 1 · 不填充</Typography>
        </section>
        <section className="ck-dilate__panel ck-dilate__facts">
          <Typography as="h2" variant="h3" tone="accent">当前结果</Typography>
          <div><Typography variant="body" tone="accent">实际权重</Typography><Typography variant="body" tone="accent">始终 9 个</Typography></div>
          <div><Typography variant="body" tone="accent">采样范围</Typography><Typography variant="body" tone="accent">{effectiveSize} × {effectiveSize}</Typography></div>
          <div><Typography variant="body" tone="accent">输出尺寸</Typography><Typography variant="body" tone="accent">9 × 9 → {outputSize} × {outputSize}</Typography></div>
        </section>
      </aside>
    </div>
  </ContentBlock>;
}
