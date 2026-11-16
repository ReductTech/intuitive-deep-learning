import { useEffect, useLayoutEffect, useMemo, useRef, useState, type PointerEvent } from 'react';
import { Redo } from '@icon-park/react';
import { Button, ContentBlock, MathFormulaBlock, MathFormulaStatic, Typography } from "@shuku/course-style/react";
import { useRecordedData } from '../../regressionData';
import { fitLossChoices, type LineFit } from './lossChoiceFit';
import './LossChoicePage.css';

const blue = '#367de8';
const teal = '#009eaa';
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export function LossChoicePage() {
  const observations = useRecordedData();
  const [offsets, setOffsets] = useState<Record<number, number>>({});
  const [selected, setSelected] = useState<number | null>(null);
  const [dragging, setDragging] = useState<number | null>(null);
  const drag = useRef<{ index: number; y: number; depth: number } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [{ width, height }, setSize] = useState({ width: 1000, height: 540 });
  useEffect(() => { setOffsets({}); setSelected(null); setDragging(null); drag.current = null; }, [observations]);
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
  const points = useMemo(() => observations.map((point, index) => ({ ...point, depth: point.depth + (offsets[index] ?? 0) })), [observations, offsets]);
  const fits = useMemo(() => fitLossChoices(points), [points]);
  const xMax = Math.max(1500, Math.ceil(Math.max(0, ...observations.map(point => point.mass)) / 500) * 500);
  const yMin = Math.min(0, Math.floor(Math.min(0, ...observations.map(point => point.depth)) / 10) * 10);
  const yMax = Math.max(50, Math.ceil((Math.max(0, ...observations.map(point => point.depth)) + 22) / 10) * 10);
  const plot = { left: 78, right: width - 94, top: 46, bottom: height - 70 };
  const px = (mass: number) => plot.left + mass / xMax * (plot.right - plot.left);
  const py = (depth: number) => plot.bottom - (depth - yMin) / (yMax - yMin) * (plot.bottom - plot.top);
  const moving = selected === null ? undefined : points[selected];
  const changeDepth = (index: number, depth: number) => {
    const original = observations[index];
    if (!original) return;
    const next = Math.round(clamp(depth, yMin, yMax - 2) * 10) / 10 - original.depth;
    setOffsets(previous => ({ ...previous, [index]: next }));
  };
  const pointerY = (event: PointerEvent<HTMLButtonElement>) => {
    const svg = svgRef.current;
    const matrix = svg?.getScreenCTM();
    if (!svg || !matrix) return null;
    const pointer = svg.createSVGPoint();
    pointer.x = event.clientX; pointer.y = event.clientY;
    return pointer.matrixTransform(matrix.inverse()).y;
  };
  const move = (event: PointerEvent<HTMLButtonElement>) => {
    const current = drag.current;
    if (!current || !event.currentTarget.hasPointerCapture(event.pointerId)) return;
    const y = pointerY(event);
    if (y === null) return;
    changeDepth(current.index, current.depth + (current.y - y) / (plot.bottom - plot.top) * (yMax - yMin));
  };
  const release = (event: PointerEvent<HTMLButtonElement>) => {
    drag.current = null;
    setDragging(null);
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

  return <ContentBlock shuku-edit-id="e-26f6e1f5-6416-44ab-9deb-fa18d2967bce" headingLevel={1} title="损失函数，体现任务的取舍" subtitle="改变观测深度，比较 MAE 与 MSE 各自拟合的直线如何变化。" className="rl-loss-choice-page">
    <div shuku-edit-id="e-b4d3c6d9-3d8d-4ed4-9be2-d78658448ecc" className="rl-loss-choice-layout">
      <section shuku-edit-id="e-963dafba-3d81-463a-b5cf-d5f034f1ef0f" className="rl-loss-choice-experiment" aria-label="拖动一个观测，对比两种损失各自最优的拟合线">
        <header shuku-edit-id="e-ecc319fa-35c3-4e7f-83c5-83572f91b3c0" className="rl-loss-choice-plot-head"><Typography shuku-edit-id="e-9b2a8157-7c03-4f7e-a929-afe0c4776446" variant="h3" tone="accent">点击任意观测点，上下拖动</Typography><div shuku-edit-id="e-f15b75e6-4c8d-4eca-9271-afb6aa11bb61" className="rl-loss-choice-legend"><Typography shuku-edit-id="e-1a5845f4-1b24-4289-8bd0-24176d80268d" as="span" variant="body" tone="inherit"><i shuku-edit-id="e-6547a448-68ad-4f19-9aae-fd03695d8b4d" style={{ borderColor: blue }} />MSE 拟合</Typography><Typography shuku-edit-id="e-8941a190-b359-4cf5-9359-2e139d068080" as="span" variant="body" tone="inherit"><i shuku-edit-id="e-275166c8-9838-4a60-8fe6-bb10d366c13c" style={{ borderColor: teal }} />MAE 拟合</Typography></div><Button onClick={() => { setOffsets({}); setSelected(null); setDragging(null); drag.current = null; }}><Redo size={20} /> 复原观测</Button></header>
        <div shuku-edit-id="e-1ae3c33c-2fcd-444b-b8ce-374079f7bf56" className="rl-loss-choice-canvas" ref={canvasRef}>
          <svg shuku-edit-id="e-b10fbc26-7733-4283-9b11-9c9b90d5374b" ref={svgRef} viewBox={`0 0 ${width} ${height}`} className="rl-loss-choice-svg" role="img" aria-label="同一批观测的最小均方误差与最小平均绝对误差拟合线">
            {yTicks.map(value => <g shuku-edit-id="e-11a7ca93-e94a-49e1-bd81-258f04b24984" key={value}><line shuku-edit-id="e-0a1eeaf7-7b43-4439-ac56-ff9a4b7df7bc" x1={plot.left} x2={plot.right} y1={py(value)} y2={py(value)} className="rl-loss-choice-grid" /><Typography shuku-edit-id="e-d4f4f01a-1406-41fd-a1f8-8ff37250cddd" as="text" variant="body" tone="muted" x={plot.left - 12} y={py(value)} dy=".35em" textAnchor="end">{value}</Typography></g>)}
            <path shuku-edit-id="e-2f80b443-88ea-4446-9afc-4da7b5784c34" d={`M${plot.left} ${plot.top}V${plot.bottom}H${plot.right}`} className="rl-loss-choice-axis" />
            {xTicks.map(value => <Typography shuku-edit-id="e-68d1220e-dbad-4248-8518-15ed04852c0d" as="text" variant="body" tone="muted" key={value} x={px(value)} y={plot.bottom + 28} textAnchor="middle">{value.toLocaleString()}</Typography>)}
            <Typography shuku-edit-id="e-f9a5e9ce-5c94-41f2-9042-3f761ae96fd7" as="text" variant="body" tone="accent" x={(plot.left + plot.right) / 2} y={height - 10} textAnchor="middle">累计石重 x</Typography>
            <Typography shuku-edit-id="e-c841ef8b-6367-4e3b-8edd-36f5ac15f42f" as="text" variant="body" tone="accent" transform={`translate(23 ${(plot.top + plot.bottom) / 2}) rotate(-90)`} textAnchor="middle">下沉深度 y</Typography>
            {(['mse', 'mae'] as const).map(kind => {
              const fit = fits[kind];
              const ends = lineEnds(fit);
              const color = kind === 'mse' ? blue : teal;
              const labelY = clamp(py(fit.w * xMax + fit.b) + (closeLabels ? kind === 'mse' ? -20 : 20 : 0), plot.top + 16, plot.bottom - 12);
              return <g shuku-edit-id="e-905820f5-b45a-4951-a25e-903c4c5dd68e" key={kind}><polyline shuku-edit-id="e-a861f221-819e-4a7c-9ee0-f058a36f2315" points={ends.map(([x, y]) => `${px(x)},${py(y)}`).join(' ')} fill="none" stroke={color} strokeWidth="3.5" /><Typography shuku-edit-id="e-98379f7f-390e-441f-a67f-0fd73778eac4" as="text" variant="body" tone="inherit" style={{ color }} x={plot.right + 10} y={labelY} dy=".35em">{kind.toUpperCase()}</Typography></g>;
            })}
          </svg>
          {points.map((point, index) => <button shuku-edit-id="e-8e95a610-fdf2-47ed-a102-50845bbb195b" key={index} type="button" className={`rl-loss-choice-point${selected === index ? ' is-selected' : ''}${dragging === index ? ' is-dragging' : ''}`} style={{ left: px(point.mass), top: py(point.depth) }} role="slider" aria-label={`观测 ${index + 1}：上下拖动修改深度`} aria-orientation="vertical" aria-valuemin={yMin} aria-valuemax={yMax - 2} aria-valuenow={point.depth} aria-valuetext={`累计石重 ${point.mass} 千克，下沉深度 ${point.depth.toFixed(1)} 厘米`} title="按住观测点上下拖动；也可用方向键调整" onFocus={() => setSelected(index)} onPointerDown={event => {
            event.preventDefault();
            event.currentTarget.focus();
            setSelected(index);
            const y = pointerY(event);
            if (y === null) return;
            drag.current = { index, y, depth: point.depth };
            setDragging(index);
            event.currentTarget.setPointerCapture(event.pointerId);
          }} onPointerMove={move} onPointerUp={release} onPointerCancel={release} onLostPointerCapture={() => { drag.current = null; setDragging(null); }} onKeyDown={event => {
            if (!['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
            event.preventDefault();
            setSelected(index);
            changeDepth(index, event.key === 'Home' ? yMin : event.key === 'End' ? yMax - 2 : point.depth + (event.key === 'ArrowUp' ? .5 : -.5));
          }} />)}
          {moving && <div shuku-edit-id="e-f3ec1b85-99cf-4150-af38-ecb0bec5732b" className="rl-loss-choice-point-hint" style={{ left: clamp(px(moving.mass), 115, width - 115), top: Math.max(4, py(moving.depth) - 55) }} aria-hidden="true">{dragging === null ? '上下拖动' : '调整中'} · {moving.depth.toFixed(1)} 厘米</div>}
        </div>
      </section>
      <section shuku-edit-id="e-f48d8c52-5da7-4cfa-aba8-488839df6971" className="rl-loss-choice-guide" aria-label="根据任务需求选择损失函数">
        <section shuku-edit-id="e-88d4bbb5-0de3-46b3-9a0c-fc183d5dc92f" className="rl-loss-choice-task is-mae"><Typography shuku-edit-id="e-cc89030b-5f79-4fc4-aaae-b30afcea8051" variant="h3" tone="accent">希望减弱少数异常读数的影响</Typography><Typography shuku-edit-id="e-f1fc3a3e-b005-444f-a24f-b36f6823c937" variant="body" tone="muted">更关注大多数观测的整体趋势。</Typography><div shuku-edit-id="e-58f3fa28-a9e5-44fe-9fb0-581a501416d5" className="rl-loss-choice-recommendation"><MathFormulaBlock appearance="plain"><MathFormulaStatic latex="|e|" /></MathFormulaBlock><Typography shuku-edit-id="e-281f5211-9335-47e1-8bc7-645b7f62654b" variant="body" tone="inherit">可以考虑 <strong shuku-edit-id="e-b7c144d9-02e5-4ab4-b7da-1834cc11ed8e">MAE</strong></Typography></div></section>
        <section shuku-edit-id="e-f6841324-5468-4b21-b0e4-3e499b70f59c" className="rl-loss-choice-task is-mse"><Typography shuku-edit-id="e-ee8336a0-19fa-45ef-9be3-804717002303" variant="h3" tone="accent">希望更强地惩罚较大的偏差</Typography><Typography shuku-edit-id="e-cbe6a415-330d-46f4-99e6-921d234a80c4" variant="body" tone="muted">少数大误差也需要付出更高代价。</Typography><div shuku-edit-id="e-08010bd3-3b6e-42b1-aeee-c16e6a799144" className="rl-loss-choice-recommendation"><MathFormulaBlock appearance="plain"><MathFormulaStatic latex="e^2" /></MathFormulaBlock><Typography shuku-edit-id="e-e0824407-e56b-4ffc-ae84-cdea165675db" variant="body" tone="inherit">可以选择 <strong shuku-edit-id="e-69f086cb-ad3b-4014-bff5-33623b52e1aa">MSE</strong></Typography></div></section>
      </section>
      <Typography shuku-edit-id="e-42387cd6-239b-4cec-b32a-e8a373c411d1" variant="body" tone="accent" align="center" className="rl-loss-choice-takeaway">没有统一的最佳选择：损失要与任务目标和数据特点一致。</Typography>
    </div>
  </ContentBlock>;
}
