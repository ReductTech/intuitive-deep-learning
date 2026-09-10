import { useMemo, useState, type ReactNode } from 'react';
import { Callout, ContentBlock, FormulaBlock, RangeControl, Typography } from '../../shared/react';
import { galtonSources, galtonTeachingPoints, mae, mse, predict, residual } from '../data/galtonRegression';

const X_MIN = 150;
const X_MAX = 188;
const Y_MIN = 150;
const Y_MAX = 188;

function scaleX(value: number, width: number) { return ((value - X_MIN) / (X_MAX - X_MIN)) * width; }
function scaleY(value: number, height: number) { return height - ((value - Y_MIN) / (Y_MAX - Y_MIN)) * height; }

function ScatterPlot({ slope, intercept, showResiduals = false, compact = false }: { slope?: number; intercept?: number; showResiduals?: boolean; compact?: boolean }) {
  const width = compact ? 620 : 820;
  const height = compact ? 360 : 450;
  const lineStart = slope === undefined || intercept === undefined ? undefined : predict(X_MIN, slope, intercept);
  const lineEnd = slope === undefined || intercept === undefined ? undefined : predict(X_MAX, slope, intercept);
  return (
    <svg className="grl-plot" viewBox={`0 0 ${width + 72} ${height + 62}`} role="img" aria-label="父母平均身高与孩子身高散点图">
      <g transform="translate(46 12)">
        <rect width={width} height={height} fill="#f7f8f4" stroke="#d8ddd4" />
        {[150, 160, 170, 180].map((tick) => <g key={`x-${tick}`}><line x1={scaleX(tick, width)} x2={scaleX(tick, width)} y1="0" y2={height} stroke="#e3e6df" /><text x={scaleX(tick, width)} y={height + 23} textAnchor="middle">{tick}</text></g>)}
        {[150, 160, 170, 180].map((tick) => <g key={`y-${tick}`}><line x1="0" x2={width} y1={scaleY(tick, height)} y2={scaleY(tick, height)} stroke="#e3e6df" /><text x="-12" y={scaleY(tick, height) + 4} textAnchor="end">{tick}</text></g>)}
        {showResiduals && slope !== undefined && intercept !== undefined && galtonTeachingPoints.map((point) => <line key={`r-${point.parent}-${point.child}`} x1={scaleX(point.parent, width)} x2={scaleX(point.parent, width)} y1={scaleY(point.child, height)} y2={scaleY(predict(point.parent, slope, intercept), height)} stroke="#d56b45" strokeWidth="2" opacity=".72" />)}
        {slope !== undefined && intercept !== undefined && lineStart !== undefined && lineEnd !== undefined && <line x1={scaleX(X_MIN, width)} y1={scaleY(lineStart, height)} x2={scaleX(X_MAX, width)} y2={scaleY(lineEnd, height)} stroke="#245b52" strokeWidth="4" />}
        {galtonTeachingPoints.map((point) => <circle key={`${point.parent}-${point.child}`} cx={scaleX(point.parent, width)} cy={scaleY(point.child, height)} r={compact ? 5 : 6} fill="#d56b45" stroke="#fff" strokeWidth="2" />)}
        <text x={width / 2} y={height + 49} textAnchor="middle">父母平均身高（cm）</text>
        <text transform={`translate(-38 ${height / 2}) rotate(-90)`} textAnchor="middle">成年孩子身高（cm）</text>
      </g>
    </svg>
  );
}

export function GaltonOpeningBlock() {
  return (
    <ContentBlock className="grl-opening" title="一个真实问题：父母身高，能预测孩子吗？" subtitle="1886 年，Francis Galton 把遗传直觉变成了可测量的问题。">
      <div className="grl-opening-grid">
        <div className="grl-archive">
          <Typography as="span" variant="bodySmall" tone="accent">ARCHIVE · 1886</Typography>
          <Typography as="h3" variant="h2">回归平均值</Typography>
          <Typography variant="body">高尔顿观察到：高个子父母的孩子通常更高，但往往没有父母那么高；矮个子父母的孩子也会向中间靠近。</Typography>
          <div className="grl-timeline"><span><b>测量</b><small>父母与成年子女</small></span><i>→</i><span><b>比较</b><small>一组组身高</small></span><i>→</i><span><b>预测</b><small>下一位孩子</small></span></div>
        </div>
        <div className="grl-opening-question"><Typography as="span" variant="bodySmall" tone="muted">课堂问题</Typography><Typography as="h3" variant="display">如果只能画一条线，<br />你会怎样画？</Typography><Typography variant="bodySmall" tone="muted">先别急着算。下一页只看数据本身。</Typography></div>
      </div>
      <Typography variant="bodySmall" tone="muted" className="grl-source">{galtonSources.join(' ')}</Typography>
    </ContentBlock>
  );
}

export function GaltonScatterBlock() {
  return <ContentBlock className="grl-scatter" title="先看见关系：点云向右上方倾斜" subtitle="相关性提供方向，但它不是一条完美的因果直线。"><div className="grl-visual-main"><ScatterPlot /><div className="grl-scatter-note"><Typography as="strong" variant="h3">正相关</Typography><Typography variant="body">父母平均身高越高，孩子身高通常也越高；但每个点都留有自己的偏离。</Typography><span className="grl-key"><i />一户家庭</span></div></div></ContentBlock>;
}

export function GaltonModelBlock({ interactive = true, onComplete }: { interactive?: boolean; onComplete?: () => void }) {
  const [slope, setSlope] = useState(0.72);
  const [intercept, setIntercept] = useState(45);
  const sample = predict(174, slope, intercept);
  const change = (setter: (value: number) => void, value: number) => { setter(value); onComplete?.(); };
  return <ContentBlock className="grl-model" title="把趋势写成可计算的预测" subtitle="一条直线只有两个自由度：斜率决定倾斜，截距决定上下位置。">
    <div className="grl-model-grid"><div><ScatterPlot slope={slope} intercept={intercept} compact /><div className="grl-controls">{interactive && <><RangeControl label="斜率 w" min="0.45" max="1.05" step="0.01" value={slope} digits={2} onChange={(event) => change(setSlope, Number(event.currentTarget.value))} /><RangeControl label="截距 b" min="-20" max="90" step="1" value={intercept} suffix=" cm" onChange={(event) => change(setIntercept, Number(event.currentTarget.value))} /></>}</div></div><div className="grl-equation"><Typography as="span" variant="bodySmall" tone="muted">模型</Typography><FormulaBlock ariaLabel="y hat equals w x plus b"><span>ŷ = <em>{slope.toFixed(2)}</em>x + <em>{intercept.toFixed(0)}</em></span></FormulaBlock><Typography variant="body">输入父母平均身高 x，模型输出预测的孩子身高 ŷ。</Typography><Callout tone="green" label="试读一个点" text={`父母平均身高 174 cm → 预测 ${sample.toFixed(1)} cm`} /></div></div>
  </ContentBlock>;
}

export function GaltonLossBlock({ interactive = true, onComplete }: { interactive?: boolean; onComplete?: () => void }) {
  const [slope, setSlope] = useState(0.72);
  const [intercept, setIntercept] = useState(45);
  const metrics = useMemo(() => ({ mae: mae(slope, intercept), mse: mse(slope, intercept) }), [slope, intercept]);
  const change = (setter: (value: number) => void, value: number) => { setter(value); onComplete?.(); };
  return <ContentBlock className="grl-loss" title="残差：预测差了多少？" subtitle="把每个点到直线的垂直距离收集起来，才有可能评价整条线。"><div className="grl-loss-grid"><div><ScatterPlot slope={slope} intercept={intercept} showResiduals compact /><div className="grl-legend"><span><i className="grl-dot grl-dot--point" />真实身高</span><span><i className="grl-dot grl-dot--line" />预测线</span><span><i className="grl-dot grl-dot--residual" />残差</span></div></div><div className="grl-loss-side">{interactive && <><RangeControl label="移动直线：斜率 w" min="0.45" max="1.05" step="0.01" value={slope} digits={2} onChange={(event) => change(setSlope, Number(event.currentTarget.value))} /><RangeControl label="移动直线：截距 b" min="-20" max="90" step="1" value={intercept} suffix=" cm" onChange={(event) => change(setIntercept, Number(event.currentTarget.value))} /></>}<div className="grl-metrics"><div><Typography variant="bodySmall" tone="muted">平均绝对误差 MAE</Typography><Typography as="strong" variant="h2">{metrics.mae.toFixed(1)} cm</Typography><Typography variant="bodySmall" tone="muted">每个误差同等计数</Typography></div><div><Typography variant="bodySmall" tone="muted">均方误差 MSE</Typography><Typography as="strong" variant="h2">{metrics.mse.toFixed(1)}</Typography><Typography variant="bodySmall" tone="muted">较大的误差被放大</Typography></div></div><FormulaBlock ariaLabel="loss equals average squared residual"><span>L(w,b) = <sup>1</sup>⁄<sub>n</sub> Σ(yᵢ − ŷᵢ)²</span></FormulaBlock></div></div></ContentBlock>;
}

export function GaltonSummaryBlock() {
  const cards: { title: string; text: ReactNode }[] = [
    { title: '数据', text: '每个点是一户家庭：输入 x，真实结果 y。' },
    { title: '模型', text: 'ŷ = wx + b 把趋势压缩成可计算的预测。' },
    { title: '损失', text: 'L(w,b) 汇总残差，告诉我们这条线整体有多差。' },
  ];
  return <ContentBlock className="grl-summary" title="从历史观察到训练目标" subtitle="线性回归不是先背公式，而是把一个预测问题逐层变得可计算。"><div className="grl-summary-flow">{cards.map((card, index) => <div className="grl-summary-step" key={card.title}><span>0{index + 1}</span><Typography as="h3" variant="h2">{card.title}</Typography><Typography variant="body">{card.text}</Typography>{index < cards.length - 1 && <b aria-hidden="true">→</b>}</div>)}</div><Callout tone="orange" label="下一步" text="当损失变成一个可比较的数字，下一件事就是：怎样系统地把它变小？这正是梯度下降要回答的问题。" /></ContentBlock>;
}
