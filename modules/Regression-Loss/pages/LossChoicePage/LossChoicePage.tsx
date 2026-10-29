import { useEffect, useLayoutEffect, useMemo, useRef, useState, type PointerEvent } from 'react';
import { Redo, UpAndDown } from '@icon-park/react';
import { Button, ContentBlock, MathFormulaBlock, MathFormulaStatic, Typography } from '../../../shared/react';
import { useRecordedData } from '../../regressionData';
import { fitLossChoices, type LineFit } from './lossChoiceFit';
import './LossChoicePage.css';

const blue = '#367de8';
const teal = '#009eaa';
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export function LossChoicePage() {
  const observations = useRecordedData();
  const [offset, setOffset] = useState(16);
  const [interacted, setInteracted] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [{ width, height }, setSize] = useState({ width: 1000, height: 540 });
  const selected = Math.max(0, observations.length - 2);
  const original = observations[selected];
  useEffect(() => { setOffset(16); setInteracted(false); }, [observations]);
  useLayoutEffect(() => {
    const host = canvasRef.current;
    if (!host) return;
    const update = () => {
      if (host.clientWidth > 0 && host.clientHeight > 0) setSize({ width: host.clientWidth, height: host.clientHeight });
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(host);
    return () => observer.disconnect();
  }, []);
  const points = useMemo(() => observations.map((point, index) => index === selected ? { ...point, depth: point.depth + offset } : point), [observations, selected, offset]);
  const fits = useMemo(() => fitLossChoices(points), [points]);
  const xMax = Math.max(1500, Math.ceil(Math.max(0, ...observations.map(point => point.mass)) / 500) * 500);
  const yMin = Math.min(0, Math.floor(Math.min(0, ...observations.map(point => point.depth)) / 10) * 10);
  const yMax = Math.max(50, Math.ceil((Math.max(0, ...observations.map(point => point.depth)) + 22) / 10) * 10);
  const plot = { left: 78, right: width - 94, top: 46, bottom: height - 70 };
  const px = (mass: number) => plot.left + mass / xMax * (plot.right - plot.left);
  const py = (depth: number) => plot.bottom - (depth - yMin) / (yMax - yMin) * (plot.bottom - plot.top);
  const moving = points[selected];
  const changeDepth = (depth: number) => {
    if (!original) return;
    const next = Math.round(clamp(depth, yMin + 1, yMax - 2) * 10) / 10 - original.depth;
    if (Math.abs(next - offset) > 1e-8) setInteracted(true);
    setOffset(next);
  };
  const move = (event: PointerEvent<HTMLButtonElement>) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    const svg = svgRef.current;
    const matrix = svg?.getScreenCTM();
    if (!svg || !matrix) return;
    const pointer = svg.createSVGPoint();
    pointer.x = event.clientX; pointer.y = event.clientY;
    const local = pointer.matrixTransform(matrix.inverse());
    changeDepth(yMin + (plot.bottom - local.y) / (plot.bottom - plot.top) * (yMax - yMin));
  };
  const release = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };
  const lineEnds = (fit: LineFit) => {
    if (Math.abs(fit.w) < 1e-12) return [[0, fit.b], [xMax, fit.b]];
    const xs = [(yMin - fit.b) / fit.w, (yMax - fit.b) / fit.w].sort((a, b) => a - b);
    return [clamp(xs[0], 0, xMax), clamp(xs[1], 0, xMax)].map(x => [x, fit.w * x + fit.b]);
  };
  const xTicks = Array.from({ length: Math.floor(xMax / 500) + 1 }, (_, index) => index * 500);
  const yTicks = Array.from({ length: Math.round((yMax - yMin) / 10) + 1 }, (_, index) => yMin + index * 10);
  const closeLabels = Math.abs(py(fits.mse.w * xMax + fits.mse.b) - py(fits.mae.w * xMax + fits.mae.b)) < 36;

  return <ContentBlock headingLevel={1} title="损失函数，体现任务的取舍" subtitle="拖动一个观测，看看两种损失各自拟合的直线会怎样变化。" className="rl-loss-choice-page">
    <div className="rl-loss-choice-layout">
      <section className="rl-loss-choice-experiment" aria-label="拖动一个观测，对比两种损失各自最优的拟合线">
        <header className="rl-loss-choice-plot-head"><Typography variant="h3" tone="accent">一个观测变了，其他观测保持不变</Typography><div className="rl-loss-choice-legend"><Typography as="span" variant="body" tone="inherit"><i style={{ borderColor: blue }} />MSE 拟合</Typography><Typography as="span" variant="body" tone="inherit"><i style={{ borderColor: teal }} />MAE 拟合</Typography></div><Button onClick={() => { setOffset(0); setInteracted(false); }}><Redo size={20} /> 复原观测</Button></header>
        <div className="rl-loss-choice-canvas" ref={canvasRef}>
          <svg ref={svgRef} viewBox={`0 0 ${width} ${height}`} className="rl-loss-choice-svg" role="img" aria-label="同一批观测的最小均方误差与最小平均绝对误差拟合线">
            {yTicks.map(value => <g key={value}><line x1={plot.left} x2={plot.right} y1={py(value)} y2={py(value)} className="rl-loss-choice-grid" /><Typography as="text" variant="body" tone="muted" x={plot.left - 12} y={py(value)} dy=".35em" textAnchor="end">{value}</Typography></g>)}
            <path d={`M${plot.left} ${plot.top}V${plot.bottom}H${plot.right}`} className="rl-loss-choice-axis" />
            {xTicks.map(value => <Typography as="text" variant="body" tone="muted" key={value} x={px(value)} y={plot.bottom + 28} textAnchor="middle">{value.toLocaleString()}</Typography>)}
            <Typography as="text" variant="body" tone="accent" x={(plot.left + plot.right) / 2} y={height - 10} textAnchor="middle">累计石重 x</Typography>
            <Typography as="text" variant="body" tone="accent" transform={`translate(23 ${(plot.top + plot.bottom) / 2}) rotate(-90)`} textAnchor="middle">下沉深度 y</Typography>
            {original && moving && Math.abs(offset) > .01 && <g><line x1={px(original.mass)} x2={px(original.mass)} y1={py(original.depth)} y2={py(moving.depth)} stroke="#e58a36" strokeWidth="1.5" strokeDasharray="6 6" /><circle cx={px(original.mass)} cy={py(original.depth)} r="8" fill="#fff" stroke="#9aa6b5" strokeWidth="2" /></g>}
            {(['mse', 'mae'] as const).map(kind => {
              const fit = fits[kind];
              const ends = lineEnds(fit);
              const color = kind === 'mse' ? blue : teal;
              const labelY = clamp(py(fit.w * xMax + fit.b) + (closeLabels ? kind === 'mse' ? -20 : 20 : 0), plot.top + 16, plot.bottom - 12);
              return <g key={kind}><polyline points={ends.map(([x, y]) => `${px(x)},${py(y)}`).join(' ')} fill="none" stroke={color} strokeWidth="3.5" /><Typography as="text" variant="body" tone="inherit" style={{ color }} x={plot.right + 10} y={labelY} dy=".35em">{kind.toUpperCase()}</Typography></g>;
            })}
            {points.map((point, index) => index !== selected && <circle key={index} cx={px(point.mass)} cy={py(point.depth)} r="6" fill="#3b5578" stroke="#fff" strokeWidth="1.5" />)}
          </svg>
          {moving && <div className={`rl-loss-choice-drag-wrap${interacted ? '' : ' edu-attention-hint'}`} style={{ left: px(moving.mass), top: py(moving.depth) }}><Button className="rl-loss-choice-drag" role="slider" aria-label="上下拖动这一条观测，同时重新拟合MSE与MAE直线" aria-orientation="vertical" aria-valuemin={yMin + 1} aria-valuemax={yMax - 2} aria-valuenow={moving.depth} onPointerDown={event => { event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); }} onPointerMove={move} onPointerUp={release} onPointerCancel={release} onKeyDown={event => { if (['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) { event.preventDefault(); changeDepth(event.key === 'Home' ? yMin + 1 : event.key === 'End' ? yMax - 2 : moving.depth + (event.key === 'ArrowUp' ? .5 : -.5)); } }}><UpAndDown size={24} /></Button></div>}
          {moving && !interacted && <div className="rl-loss-choice-drag-label" style={{ right: width - px(moving.mass) + 24, top: Math.max(0, py(moving.depth) - 28) }}><Typography variant="body" tone="inherit">拖动观测</Typography></div>}
        </div>
      </section>
      <section className="rl-loss-choice-guide" aria-label="根据任务需求选择损失函数">
        <section className="rl-loss-choice-task is-mae"><Typography variant="h3" tone="accent">希望减弱少数异常读数的影响</Typography><Typography variant="body" tone="muted">更关注大多数观测的整体趋势。</Typography><div className="rl-loss-choice-recommendation"><MathFormulaBlock appearance="plain"><MathFormulaStatic latex="|e|" /></MathFormulaBlock><Typography variant="body" tone="inherit">可以考虑 <strong>MAE</strong></Typography></div></section>
        <section className="rl-loss-choice-task is-mse"><Typography variant="h3" tone="accent">希望更强地惩罚较大的偏差</Typography><Typography variant="body" tone="muted">少数大误差也需要付出更高代价。</Typography><div className="rl-loss-choice-recommendation"><MathFormulaBlock appearance="plain"><MathFormulaStatic latex="e^2" /></MathFormulaBlock><Typography variant="body" tone="inherit">可以选择 <strong>MSE</strong></Typography></div></section>
      </section>
      <Typography variant="body" tone="accent" align="center" className="rl-loss-choice-takeaway">没有统一的最佳选择：损失要与任务目标和数据特点一致。</Typography>
    </div>
  </ContentBlock>;
}
