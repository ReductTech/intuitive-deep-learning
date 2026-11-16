import { useLayoutEffect, useRef, useState, type PointerEvent } from 'react';
import { Typography } from "@shuku/course-style/react";

export type MaeStage = 0 | 1 | 2;
type Frame = { absolute: number; bars: number; mean: number };
const orange = '#f17c60', blue = '#4c89ed';

export function MergedAbsoluteErrorPlot({ errors, stage, replay, onAnimationComplete, onInteraction, loss = 'absolute' }: { errors: number[]; stage: MaeStage; replay: number; onAnimationComplete: () => void; onInteraction: () => void; loss?: 'absolute' | 'squared' }) {
  const [frame, setFrame] = useState<Frame>({ absolute: 0, bars: 0, mean: 0 });
  const frameRef = useRef(frame);
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [{ width, height }, setSize] = useState({ width: 1000, height: 540 });
  const plot = { left: 80, right: width - 30, top: 25, bottom: height - 68 };
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const update = (width: number, height: number) => {
      if (width <= 0 || height <= 0) return;
      setSize(previous => previous.width === width && previous.height === height ? previous : { width, height });
    };
    update(container.clientWidth, container.clientHeight);
    const observer = new ResizeObserver(([entry]) => {
      if (entry) update(entry.contentRect.width, entry.contentRect.height);
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);
  const [probe, setProbe] = useState(-3);
  const [hovered, setHovered] = useState<number | null>(null);
  const bound = Math.max(6, Math.ceil(Math.max(0, ...errors.map(Math.abs), Math.abs(probe)) / 2) * 2);
  const squared = loss === 'squared';
  const lossValue = (value: number) => squared ? value * value : Math.abs(value);
  const metric = squared ? 'MSE' : 'MAE';
  const mean = errors.reduce((sum, error) => sum + lossValue(error), 0) / Math.max(1, errors.length);
  const completionRef = useRef(onAnimationComplete);
  useLayoutEffect(() => { completionRef.current = onAnimationComplete; });
  useLayoutEffect(() => {
    const complete = completionRef.current;
    const from = stage === 0 ? { absolute: 0, bars: 0, mean: 0 } : { ...frameRef.current, mean: 0 };
    frameRef.current = from; setFrame(from);
    const started = performance.now();
    let animation = 0;
    let cancelled = false;
    const tick = (now: number) => {
      if (cancelled) return;
      const time = Math.min(1, (now - started) / 1100);
      const ease = (value: number) => value * value * (3 - 2 * value);
      const curveTime = ease(time);
      const barsTime = ease(Math.max(0, Math.min(1, (time - .12) / .88)));
      const next = {
        absolute: stage === 0 ? 0 : from.absolute + (1 - from.absolute) * curveTime,
        bars: stage === 0 ? barsTime : from.bars + (1 - from.bars) * curveTime,
        mean: stage === 2 ? ease(time) : 0,
      };
      frameRef.current = next; setFrame(next);
      if (time < 1) animation = requestAnimationFrame(tick);
      else complete();
    };
    animation = requestAnimationFrame(tick);
    return () => { cancelled = true; cancelAnimationFrame(animation); };
  }, [stage, replay, loss]);
  const low = -bound * (1 - frame.absolute) - bound * .06;
  const upper = bound + (lossValue(bound) - bound) * frame.absolute;
  const high = upper * 1.1;
  const px = (value: number) => plot.left + (value + bound) / (2 * bound) * (plot.right - plot.left);
  const py = (value: number) => plot.bottom - (value - low) / (high - low) * (plot.bottom - plot.top);
  const transformed = (value: number) => value + (lossValue(value) - value) * frame.absolute;
  const ticks = [-bound, -bound / 2, 0, bound / 2, bound];
  const yTicks = squared ? [-bound, -bound / 2, 0, upper / 2, upper].filter(value => value >= low && value <= high) : ticks.filter(value => value >= low && value <= high);
  const curve = Array.from({ length: 81 }, (_, index) => -bound + 2 * bound * index / 80).map(value => `${px(value)},${py(transformed(value))}`).join(' ');
  const probeY = py(transformed(probe));
  const dragProbe = (event: PointerEvent<HTMLButtonElement>) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    const svg = svgRef.current, matrix = svg?.getScreenCTM();
    if (!svg || !matrix) return;
    const point = svg.createSVGPoint(); point.x = event.clientX; point.y = event.clientY;
    const local = point.matrixTransform(matrix.inverse());
    setProbe(Math.round(Math.max(-bound, Math.min(bound, (local.x - plot.left) / (plot.right - plot.left) * 2 * bound - bound)) * 10) / 10);
  };
  const hoveredError = hovered === null ? undefined : errors[hovered];
  return <div shuku-edit-id="e-b5fe223b-b53c-44c1-b2be-1a0153e3ecbd" ref={containerRef} className="rl-mae-merged-coordinate">
    <svg shuku-edit-id="e-3a67e807-d0a0-4e32-8d25-c8dc60705ac1" ref={svgRef} viewBox={`0 0 ${width} ${height}`} className="rl-mae-merged-svg" role="img" aria-label={`残差与${squared ? '平方' : '绝对值'}函数合并图，当前第${stage + 1}阶段，共${errors.length}条记录`}>
      <g shuku-edit-id="e-b6dcffe8-d876-4a0a-bf60-05ec9a228a8f" className="rl-mae-merged-grid">{yTicks.map(value => <line shuku-edit-id="e-e7555297-dd68-4d7c-b6f8-95c690989569" key={value} x1={plot.left} x2={plot.right} y1={py(value)} y2={py(value)} />)}</g>
      <g shuku-edit-id="e-6f0881ca-d925-4def-bd80-6152e32f7aa9" className="rl-mae-merged-axes"><line shuku-edit-id="e-fea8d706-b4f5-4cc6-afb4-7759cb036b70" x1={plot.left} x2={plot.right} y1={py(0)} y2={py(0)} /><line shuku-edit-id="e-3fa5992f-2075-41e7-9aea-85cdf9e15759" x1={plot.left} x2={plot.left} y1={plot.top} y2={plot.bottom} />{ticks.map(value => <Typography shuku-edit-id="e-4fef2e1e-2016-4777-b11b-9d472664afab" as="text" variant="bodySmall" tone="accent" key={value} x={px(value)} y={plot.bottom + 30} textAnchor="middle">{value}</Typography>)}{yTicks.map(value => <Typography shuku-edit-id="e-09d3c69b-d9d8-4179-8d6a-bf48b8df7e31" as="text" variant="bodySmall" tone="accent" key={value} x={plot.left - 16} y={py(value) + 7} textAnchor="end">{Number(value.toFixed(1))}</Typography>)}<Typography shuku-edit-id="e-c089f966-b7ab-45b2-a322-1ca99dd061c0" as="text" variant="body" tone="accent" x={(plot.left + plot.right) / 2} y={height - 18} textAnchor="middle">残差 e</Typography><Typography shuku-edit-id="e-7d5b3a28-fd92-40a1-a530-63aac9918a86" as="text" variant="body" tone="accent" transform={`translate(24 ${(plot.top + plot.bottom) / 2}) rotate(-90)`} textAnchor="middle">{stage === 0 ? '原始残差' : squared ? '平方误差' : '绝对误差'}</Typography></g>
      <polyline shuku-edit-id="e-db3fc276-69c2-48fa-a69a-8c41f7b9ac87" points={curve} fill="none" stroke="#ee7759" strokeWidth="2.5" strokeLinejoin="round" pointerEvents="none" />
      <g shuku-edit-id="e-0eb3465b-1b5e-4b54-adc3-729325a5b213" className="rl-mae-merged-bars">{errors.map((error, index) => {
        const end = py(transformed(error) * frame.bars);
        const zero = py(0);
        const active = hovered === index;
        const color = error < 0 ? blue : orange;
        return <g shuku-edit-id="e-2c477381-83f8-4866-b2e3-76a9346879c1" key={index} onMouseEnter={() => setHovered(index)} onMouseLeave={() => setHovered(null)} onFocus={() => { onInteraction(); setHovered(index); }} onBlur={() => setHovered(null)} tabIndex={0} role="button" aria-label={`样本${index + 1}，残差${error.toFixed(1)}，${squared ? '平方误差' : '绝对误差'}${lossValue(error).toFixed(1)}`} onClick={() => { onInteraction(); setProbe(error); }} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onInteraction(); setProbe(error); } }}>
          <rect shuku-edit-id="e-c5abf76d-83ac-4775-9bba-456ce61d66d8" x={px(error) - 9} y={Math.min(zero, end)} width="18" height={Math.max(1, Math.abs(end - zero))} rx="4" fill={color} opacity={active ? .9 : .68} />
          <line shuku-edit-id="e-04a278b0-073b-44cd-8348-2dd64956baf4" x1={px(error)} x2={px(error)} y1={zero} y2={end} stroke="transparent" strokeWidth="24" />
          {active && <circle shuku-edit-id="e-a62963f7-488a-41f3-b548-a583180b2f94" cx={px(error)} cy={end} r="13" fill={color} opacity=".13" />}
          <circle shuku-edit-id="e-ea4487c6-699e-4aa1-957b-f7a94f920885" cx={px(error)} cy={end} r={active ? 7 : 5.5} fill={color} stroke="white" strokeWidth="2" opacity={frame.bars} />
        </g>;
      })}</g>
      <g shuku-edit-id="e-80b7dcb5-9d28-4dc0-911b-b548b2d98cec" opacity={frame.mean} pointerEvents="none"><line shuku-edit-id="e-232444be-c849-4519-8821-fd65c73ad006" x1={plot.left} x2={plot.right} y1={py(mean)} y2={py(mean)} stroke="#15958c" strokeWidth="2" strokeDasharray="8 6" /><Typography shuku-edit-id="e-8d3972b6-82c9-4c89-9c76-b70181faf535" as="text" variant="bodySmall" tone="accent" x={plot.right - 8} y={py(mean) - 12} textAnchor="end">{metric} = {mean.toFixed(1)}</Typography></g>
    </svg>
    <button shuku-edit-id="e-24be1593-addd-4103-baae-471f4db2f41b" className="rl-mae-merged-probe" aria-label={`拖动函数上的点，观察原始残差与${squared ? '平方' : '绝对值'}`} style={{ left: `${px(probe) / width * 100}%`, top: `${probeY / height * 100}%` }} onPointerDown={event => { onInteraction(); event.currentTarget.setPointerCapture(event.pointerId); }} onPointerMove={dragProbe} onPointerUp={event => { if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); }} onKeyDown={event => { if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); onInteraction(); setProbe(Math.max(-bound, Math.min(bound, Math.round((probe + (event.key === 'ArrowLeft' ? -.1 : .1)) * 10) / 10))); } }} />
    {hoveredError !== undefined && <div shuku-edit-id="e-39a6d1a3-1669-4497-9075-65687ba6f162" className="rl-mae-merged-tooltip" role="tooltip"><Typography shuku-edit-id="e-df5b545f-5d68-4c80-9f9a-ffecd65d2cdc" variant="body" tone="accent">样本 {(hovered ?? 0) + 1}</Typography><Typography shuku-edit-id="e-8f61613c-9140-488e-840a-f516762f9bb0" variant="body" tone="accent">残差：{hoveredError.toFixed(1)}</Typography><Typography shuku-edit-id="e-a99e54d7-6e34-41fd-a256-767840138d15" variant="body" tone="accent">{squared ? '平方' : '绝对值'}：{lossValue(hoveredError).toFixed(1)}</Typography></div>}
  </div>;
}
