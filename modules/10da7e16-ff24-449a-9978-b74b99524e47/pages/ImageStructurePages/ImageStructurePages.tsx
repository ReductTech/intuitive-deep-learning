import { useId, useMemo, useState } from 'react';
import { Button, ContentBlock, Typography } from '@shuku/course-style/react';
import { distributionLookup, histogram, type DistributionMode } from './model';
import './ImageStructurePages.css';

const source = Array.from({ length: 256 }, (_, i) => 70 + Math.round(106 * (.6 * (i % 16) / 15 + .4 * Math.sin(Math.floor(i / 16) * .3) ** 2)));
const methods: [DistributionMode, string][] = [['stretch', '拉伸'], ['equalize', '均衡化'], ['match', '规定化']];
function PixelImage({ values, label }: { values: number[]; label: string }) {
  return <svg viewBox="0 0 256 256" role="img" aria-label={label}>{values.map((v, i) => <rect key={i} x={i % 16 * 16} y={Math.floor(i / 16) * 16} width={16} height={16} fill={`rgb(${v},${v},${v})`} />)}</svg>;
}
function Histogram({ values }: { values: number[] }) {
  const bins = histogram(values), groups = Array.from({ length: 64 }, (_, i) => bins.slice(i * 4, i * 4 + 4).reduce((a, b) => a + b, 0)), maximum = Math.max(1, ...groups);
  return <svg viewBox="0 0 256 100" role="img" aria-label="灰度直方图，横轴0到255，纵轴为像素数">{groups.map((count, i) => <rect key={i} x={i * 4} y={100 - count / maximum * 96} width={3} height={count / maximum * 96} fill="#3679b7" />)}</svg>;
}
export function HistogramDistributionPage() {
  const [mode, setMode] = useState<DistributionMode>('stretch');
  const lookup = useMemo(() => distributionLookup(source, mode), [mode]), result = source.map(value => lookup[value]);
  const explanation = { stretch: '把已使用的灰度范围扩展到 0～255，保留灰度的先后关系。', equalize: '根据累计分布重新分配灰度；离散直方图不保证每个柱子一样高。', match: '把累计分布匹配到偏亮的目标分布；目标决定输出的明暗倾向。' }[mode];
  return <ContentBlock className="di-structure" title="直方图拉伸、均衡化与规定化" subtitle="同一幅灰度图，三种利用整体分布重新映射数值的方法。" headingLevel={1}><div className="di-structure__body">
    <div className="di-structure__controls" role="group" aria-label="选择直方图处理方法">{methods.map(([id, label]) => <Button key={id} active={mode === id} aria-pressed={mode === id} onClick={() => setMode(id)}>{label}</Button>)}</div>
    <div className="di-structure__columns"><section className="di-structure__card"><Typography variant="h3" tone="accent">输入图像与分布</Typography><PixelImage values={source} label="灰度集中在中间区间的原始图像" /><Histogram values={source} /></section>
      <section className="di-structure__card"><Typography variant="h3" tone="accent">输入 → 输出灰度映射</Typography><svg viewBox="0 0 280 280" role="img" aria-label="当前处理方法的灰度映射曲线"><path d="M12 12V268H268" stroke="#7b91a8" fill="none" /><path d="M12 268L268 12" stroke="#b3c2d2" strokeDasharray="5 5" /><polyline points={lookup.map((v, i) => `${12 + i},${268 - v}`).join(' ')} fill="none" stroke="#2582cd" strokeWidth={3} /></svg><Typography variant="bodySmall" tone="muted">横轴：输入灰度 0～255<br />纵轴：输出灰度 0～255</Typography></section>
      <section className="di-structure__card"><Typography variant="h3" tone="accent">输出图像与分布</Typography><PixelImage values={result} label="处理后的灰度图像" /><Histogram values={result} /></section></div>
    <Typography variant="body" tone="accent" aria-live="polite">{explanation}</Typography><Typography variant="bodySmall" tone="muted">三者都会改变数值分布，不能保证对每一幅图像都更合适。</Typography></div></ContentBlock>;
}

const neighborhoods = [
  { title: '平坦区域', values: [125, 128, 130, 127, 128, 129, 126, 128, 130], detail: '邻域数值接近，明暗变化很小。' },
  { title: '边缘', values: [32, 128, 224, 32, 128, 224, 32, 128, 224], detail: '左暗右亮，呈现有方向的变化。' },
  { title: '纹理', values: [32, 224, 32, 224, 128, 224, 32, 224, 32], detail: '明暗反复交替，形成重复结构。' },
];
export function NeighborhoodContextPage() {
  const [reveal, setReveal] = useState(false);
  return <ContentBlock className="di-structure" title="一个像素够吗？" subtitle="三个中心像素都是 128，周围的排列却可以完全不同。" headingLevel={1}><div className="di-structure__body">
    <div className="di-structure__controls"><Button variant="primary" onClick={() => setReveal(v => !v)} aria-pressed={reveal}>{reveal ? '只看中心' : '显示邻域'}</Button></div>
    <div className="di-structure__columns">{neighborhoods.map(example => <section className="di-structure__card" key={example.title}><Typography variant="h3" tone="accent">{reveal ? example.title : '中心灰度：128'}</Typography><div className="di-neighborhood" aria-label={reveal ? `${example.title}的3×3邻域` : '只显示中心像素'}>{example.values.map((v, i) => <div key={i} className={i === 4 ? 'is-center' : undefined} style={{ background: reveal || i === 4 ? `rgb(${v},${v},${v})` : '#edf2f8', color: (reveal || i === 4) && v < 150 ? '#fff' : '#233c56' }}><Typography variant="h3" tone="inherit">{reveal || i === 4 ? v : '?'}</Typography></div>)}</div><Typography variant="bodySmall" tone="muted">{reveal ? example.detail : '只凭中心像素，无法判断这里是什么结构。'}</Typography></section>)}</div>
    <Typography variant="body" tone="accent" aria-live="polite">{reveal ? '空间关系提供上下文：同一个数值，可以处在不同的图像结构中。' : '三个数值相同的中心，是否一定表示相同的图像结构？'}</Typography></div></ContentBlock>;
}

function signal(x: number) { return Math.round(128 + 112 * Math.sin(2 * Math.PI * 22 * x)); }
function Stripe({ values, label }: { values: number[]; label: string }) {
  return <svg className="di-resampling__strip" viewBox="0 0 1100 100" preserveAspectRatio="none" role="img" aria-label={label}>{values.map((v, i) => <rect key={i} x={i / values.length * 1100} width={1100 / values.length + .1} height={100} fill={`rgb(${v},${v},${v})`} />)}</svg>;
}
export function ResamplingAliasingPage() {
  const [samples, setSamples] = useState(32), [phase, setPhase] = useState(0), [smooth, setSmooth] = useState(false);
  const pattern = useId().replaceAll(':', '');
  const result = Array.from({ length: samples }, (_, i) => { const center = (i + .5 + phase) / samples; return smooth ? Math.round(Array.from({ length: 32 }, (_, j) => signal(center + ((j + .5) / 32 - .5) / samples)).reduce((a, b) => a + b, 0) / 32) : signal(center); });
  return <ContentBlock className="di-structure" title="重采样、混叠与摩尔纹" subtitle="减少采样点，可能把原来的细条纹误读为新的粗结构。" headingLevel={1}><div className="di-structure__body">
    <div className="di-structure__controls"><label><Typography as="span" variant="bodySmall">采样点数：{samples}</Typography><input aria-label="采样点数" type="range" min={8} max={96} value={samples} onChange={e => setSamples(Number(e.target.value))} /></label><label><Typography as="span" variant="bodySmall">采样相位：{phase.toFixed(2)}</Typography><input aria-label="采样相位" type="range" min={0} max={1} step={.05} value={phase} onChange={e => setPhase(Number(e.target.value))} /></label><Button active={smooth} aria-pressed={smooth} onClick={() => setSmooth(v => !v)}>下采样前平滑</Button><Button onClick={() => { setSamples(32); setPhase(0); setSmooth(false); }}>重置</Button></div>
    <section className="di-structure__wide-card"><Typography variant="h3" tone="accent">原始细条纹：22 个明暗周期</Typography><Stripe values={Array.from({ length: 512 }, (_, i) => signal((i + .5) / 512))} label="高密度表示的原始细条纹" /></section>
    <section className="di-structure__wide-card"><Typography variant="h3" tone="accent">{samples} 个采样点的显示结果</Typography><Stripe values={result} label="重采样后的条纹" /><Typography variant="bodySmall" tone="muted" aria-live="polite">{samples < 44 ? '每个条纹周期少于两个采样点，可能出现原图没有的粗条纹。' : '采样较密，可以更完整地保留原始条纹。'}{smooth ? ' 平滑抑制高频变化，也会降低细节与对比度。' : ''}</Typography></section>
    <section className="di-resampling__moire"><svg data-ppt-viewport="叠加条纹按摩尔纹观察窗裁切" style={{ overflow: 'hidden' }} viewBox="0 0 400 100" role="img" aria-label="两组细密条纹叠加形成摩尔纹"><defs><pattern id={pattern} width={7} height={7} patternUnits="userSpaceOnUse"><rect width={3} height={7} fill="#274969" /></pattern></defs><rect width={400} height={100} fill="#fff" /><rect width={400} height={100} fill={`url(#${pattern})`} /><rect x={-50} y={-70} width={500} height={240} fill={`url(#${pattern})`} opacity={.6} transform={`rotate(${3 + phase * 6} 200 50)`} /></svg><Typography variant="bodySmall" tone="muted">摩尔纹：重复结构叠加或重采样时出现的较粗伪结构。改变相位，观察它怎样变化。</Typography></section></div></ContentBlock>;
}
