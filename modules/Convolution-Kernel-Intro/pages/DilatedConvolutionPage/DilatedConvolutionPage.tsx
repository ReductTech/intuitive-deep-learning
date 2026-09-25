import { useState } from 'react';
import type { CSSProperties } from 'react';
import { ContentBlock, MathFormulaBlock, MathFormulaStatic, Typography } from '../../../shared/react';
import buildingImage from '../../assets/xiandaijianzhu.png';
import './DilatedConvolutionPage.css';

const rates = [1, 2, 3] as const;
type Rate = typeof rates[number];
const kernel = ['w₁', 'w₂', 'w₃', 'w₄', 'w₅', 'w₆', 'w₇', 'w₈', 'w₉'];

function KernelMatrix() { return <div className="ck-dilate__kernel">{kernel.map((value) => <div key={value}>{value}</div>)}</div>; }
function SampleGrid({ rate, size = 9 }: { rate: Rate; size?: number }) {
  // Dilation is the spacing between adjacent kernel weights. A 3x3 kernel
  // therefore spans 3, 5, or 7 cells for rates 1, 2, and 3.
  const span = rate;
  const start = Math.floor((size - (span * 2 + 1)) / 2);
  return <div className="ck-dilate__sample-grid" style={{ '--grid-size': size } as CSSProperties}>{Array.from({ length: size * size }, (_, index) => { const row = Math.floor(index / size); const col = index % size; const active = [0, 1, 2].some((r) => [0, 1, 2].some((c) => row === start + r * span && col === start + c * span)); return <span key={index} className={active ? 'is-sampled' : ''} />; })}</div>;
}

export function DilatedConvolutionPage() {
  const [rate, setRate] = useState<Rate>(2);
  const fieldSize = 2 * rate + 1;
  return <ContentBlock headingLevel={1} className="ck-dilate" title="空洞卷积：扩大感受野，不增加参数" subtitle="在卷积核权重之间插入空白采样位置，让同一个 3×3 卷积核看到更大的范围。">
    <div className="ck-dilate__workspace"><section className="ck-dilate__why"><header><Typography as="h2" variant="h3" tone="accent">为什么需要空洞卷积？</Typography></header><ul><li>标准卷积只读取连续的局部区域。</li><li>扩大卷积核或堆叠更多层，会增加计算量。</li></ul><div className="ck-dilate__photo"><img src={buildingImage} alt="建筑特征图局部区域" /><span /></div><Typography variant="body" tone="accent">空洞卷积在保持参数量不变的同时，扩大上下文范围。</Typography></section><section className="ck-dilate__compare"><div className="ck-dilate__compare-col"><header><Typography as="h2" variant="h3" tone="accent">标准卷积</Typography><Typography variant="bodySmall" tone="muted">空洞率 r = 1</Typography></header><KernelMatrix /><SampleGrid rate={1} /><Typography variant="bodySmall" tone="muted">连续采样 · 感受野 3×3</Typography></div><div className="ck-dilate__compare-col is-dilated"><header><Typography as="h2" variant="h3" tone="accent">空洞卷积</Typography><Typography variant="bodySmall" tone="muted">空洞率 r = {rate}</Typography></header><KernelMatrix /><SampleGrid rate={rate} /><Typography variant="bodySmall" tone="muted">间隔采样 · 感受野 {fieldSize}×{fieldSize}</Typography></div></section><aside className="ck-dilate__effects"><header><Typography as="h2" variant="h3" tone="accent">空洞率的效果</Typography></header><Typography variant="bodySmall" tone="muted">选择 r，观察同一个 3×3 卷积核覆盖范围如何变化。</Typography><div className="ck-dilate__rates">{rates.map((value) => <button key={value} type="button" className={rate === value ? 'is-selected' : ''} onClick={() => setRate(value)}><Typography as="span" variant="body" tone="inherit">r = {value}</Typography><SampleGrid rate={value} size={7} /></button>)}</div><div className="ck-dilate__result"><MathFormulaBlock ariaLabel="空洞卷积感受野尺寸"><MathFormulaStatic latex={String.raw`K_{eff}=K+(K-1)(r-1)=${fieldSize}`} /></MathFormulaBlock><Typography variant="bodySmall" tone="muted">参数仍为 3×3 = 9 个权重</Typography></div></aside></div><footer className="ck-dilate__summary"><Typography as="span" variant="h3" tone="accent">空洞卷积的三个特点</Typography><Typography variant="body">参数量不增加 · 感受野扩大 · 配合 Padding 可保持特征图尺寸</Typography></footer>
  </ContentBlock>;
}
