import { useEffect, useId, useMemo, useRef, useState, type PointerEvent } from 'react';
import { classNames } from '../utils';

export interface FunctionPlotProps {
  fn: (x: number) => number;
  className?: string;
  ariaLabel: string;
  minHeight?: number;
  initialCenter?: { x: number; y: number };
  initialScale?: { x: number; y: number };
  stroke?: string;
}

const width = 760;
const height = 420;

function tickStep(unitsPerPixel: number, pixels = 110) {
  const target = unitsPerPixel * pixels;
  const power = 10 ** Math.floor(Math.log10(target));
  const normalized = target / power;
  const factor = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return factor * power;
}

function ticks(min: number, max: number, step: number) {
  const start = Math.ceil(min / step) * step;
  const values: number[] = [];
  for (let value = start; value <= max + step * 0.001; value += step) values.push(value);
  return values;
}

function formatTick(value: number) {
  if (Math.abs(value) < 1e-8) return '0';
  return Math.abs(value) >= 10 || Number.isInteger(value) ? String(Math.round(value)) : value.toFixed(1);
}

/** Pan-and-zoom function view. The viewport is unrestricted; samples are regenerated from the current view. */
export function FunctionPlot({
  fn,
  className,
  ariaLabel,
  minHeight = 300,
  initialCenter = { x: 0, y: 0.5 },
  initialScale = { x: 0.025, y: 0.004 },
  stroke = '#f07e47',
}: FunctionPlotProps) {
  const [view, setView] = useState({ centerX: initialCenter.x, centerY: initialCenter.y, scaleX: initialScale.x, scaleY: initialScale.y });
  const clipId = `function-plot-clip-${useId().replace(/:/g, '')}`;
  const svgRef = useRef<SVGSVGElement>(null);
  const dragRef = useRef<{ x: number; y: number; centerX: number; centerY: number } | null>(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return undefined;
    const onWheel = (event: globalThis.WheelEvent) => {
      event.preventDefault();
      const factor = event.deltaY > 0 ? 1.16 : 1 / 1.16;
      setView((current) => ({ ...current, scaleX: current.scaleX * factor, scaleY: current.scaleY * factor }));
    };
    svg.addEventListener('wheel', onWheel, { passive: false });
    return () => svg.removeEventListener('wheel', onWheel);
  }, []);
  const xMin = view.centerX - width * view.scaleX / 2;
  const xMax = view.centerX + width * view.scaleX / 2;
  const yMin = view.centerY - height * view.scaleY / 2;
  const yMax = view.centerY + height * view.scaleY / 2;
  const toX = (value: number) => width / 2 + (value - view.centerX) / view.scaleX;
  const toY = (value: number) => height / 2 - (value - view.centerY) / view.scaleY;
  const path = useMemo(() => Array.from({ length: 361 }, (_, index) => {
    const x = xMin + (xMax - xMin) * index / 360;
    const y = fn(x);
    return `${index === 0 ? 'M' : 'L'}${toX(x).toFixed(2)},${toY(y).toFixed(2)}`;
  }).join(' '), [fn, xMax, xMin, view.centerX, view.centerY, view.scaleX, view.scaleY]);
  const xTicks = ticks(xMin, xMax, tickStep(view.scaleX));
  const yTicks = ticks(yMin, yMax, tickStep(view.scaleY));

  const pointerDown = (event: PointerEvent<SVGSVGElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { x: event.clientX, y: event.clientY, centerX: view.centerX, centerY: view.centerY };
  };
  const pointerMove = (event: PointerEvent<SVGSVGElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    const rect = event.currentTarget.getBoundingClientRect();
    setView((current) => ({ ...current, centerX: drag.centerX - (event.clientX - drag.x) * width / rect.width * current.scaleX, centerY: drag.centerY + (event.clientY - drag.y) * height / rect.height * current.scaleY }));
  };
  const pointerEnd = () => { dragRef.current = null; };
  return <div className={classNames('shared-function-plot', className)} style={{ minHeight }}><svg ref={svgRef} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={ariaLabel} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerEnd} onPointerCancel={pointerEnd}>
    <defs><clipPath id={clipId}><rect width={width} height={height} /></clipPath></defs>
    {xTicks.map((value) => <g key={`x-${value}`}><line x1={toX(value)} x2={toX(value)} y1="0" y2={height} className="shared-function-grid" />{Math.abs(value) > 1e-8 && <text x={toX(value)} y={Math.min(height - 10, toY(0) + 26)} textAnchor="middle">{formatTick(value)}</text>}</g>)}
    {yTicks.map((value) => <g key={`y-${value}`}><line x1="0" x2={width} y1={toY(value)} y2={toY(value)} className="shared-function-grid" />{Math.abs(value) > 1e-8 && <text x={Math.max(12, toX(0) - 12)} y={toY(value) + 4} textAnchor="end">{formatTick(value)}</text>}</g>)}
    {xMin < 0 && xMax > 0 && <line x1={toX(0)} x2={toX(0)} y1="0" y2={height} className="shared-function-axis" />}
    {yMin < 0 && yMax > 0 && <line x1="0" x2={width} y1={toY(0)} y2={toY(0)} className="shared-function-axis" />}
    <path d={path} clipPath={`url(#${clipId})`} fill="none" stroke={stroke} strokeWidth="4" />
  </svg></div>;
}
