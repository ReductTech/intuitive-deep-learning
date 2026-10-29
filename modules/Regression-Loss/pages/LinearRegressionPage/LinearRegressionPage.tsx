import { useLayoutEffect, useMemo, useRef, useState, type PointerEvent } from 'react';
import { Button, ContentBlock, EChartsChart, MathFormulaBlock, MathFormulaStatic, RangeControl, Typography } from '../../../shared/react';
import { useRecordedData } from '../../regressionData';
import './LinearRegressionPage.css';

const sliderStyle = (value: number, min: number, max: number) => {
  const fill = (value - min) / (max - min) * 100;
  return { background: `linear-gradient(to right, #168c97 ${fill}%, #e5eaf0 ${fill}%)` };
};

const chartGrid = { left: 82, right: 36, top: 48, bottom: 77 };
const maxX = 1750;
const maxY = 48;
const minW = .008, maxW = .024, minB = 0, maxB = 6;
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
type Endpoint = 'left' | 'right';

export function LinearRegressionPage() {
  const calibration = useRecordedData();
  const selected = Math.max(0, Math.min(4, calibration.length - 1));
  const [w, setW] = useState(.016);
  const [b, setB] = useState(0);
  const plotRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ endpoint: Endpoint; pointerY: number; depth: number; rightDepth: number } | null>(null);
  const [plotSize, setPlotSize] = useState({ width: 0, height: 0 });
  useLayoutEffect(() => {
    const host = plotRef.current;
    if (!host) return;
    const update = () => setPlotSize({ width: host.clientWidth, height: host.clientHeight });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(host);
    return () => observer.disconnect();
  }, [calibration.length > 0]);
  const adjustEndpoint = (endpoint: Endpoint, depth: number, rightDepth = w * maxX + b) => {
    if (endpoint === 'right') {
      setW(clamp((depth - b) / maxX, minW, maxW));
    } else {
      // Pivot around the opposite endpoint while keeping both controls in range.
      const nextB = clamp(depth, Math.max(minB, rightDepth - maxW * maxX), Math.min(maxB, rightDepth - minW * maxX));
      setB(nextB);
      setW((rightDepth - nextB) / maxX);
    }
  };
  const dragEndpoint = (event: PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    const host = plotRef.current;
    if (!drag || !host || !event.currentTarget.hasPointerCapture(event.pointerId)) return;
    const rect = host.getBoundingClientRect();
    const plotHeight = host.clientHeight - chartGrid.top - chartGrid.bottom;
    if (rect.height <= 0 || plotHeight <= 0) return;
    const delta = (event.clientY - drag.pointerY) * host.clientHeight / rect.height;
    adjustEndpoint(drag.endpoint, drag.depth - delta / plotHeight * maxY, drag.rightDepth);
  };
  const releaseEndpoint = (event: PointerEvent<HTMLButtonElement>) => {
    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };
  const point = calibration[Math.min(selected,calibration.length-1)] ?? {mass:0,depth:0};
  const predicted = w * point.mass + b;
  const option = useMemo(() => ({
    animation: false,
    grid: chartGrid,
    xAxis: { type: 'value', min: 0, max: 1750, interval: 500, name: '累计石重 x（千克）', nameLocation: 'middle', nameGap: 43,
      nameTextStyle: { color: '#27446e', fontSize: 27 }, axisLabel: { color: '#526582', fontSize: 22 }, axisLine: { show: true }, splitLine: { show: false } },
    yAxis: { type: 'value', min: 0, max: 48, interval: 16, name: '下沉深度（厘米）', nameGap: 24,
      nameTextStyle: { color: '#27446e', fontSize: 27, align: 'left' }, axisLabel: { color: '#526582', fontSize: 22 }, axisLine: { show: true }, splitLine: { lineStyle: { color: '#dfe6ec' } } },
    series: [
      { type: 'line', symbol: 'none', data: [[0, b], [1750, w * 1750 + b]], lineStyle: { color: '#168c97', width: 4 }, silent: true },
      { type: 'scatter', symbolSize: 14, data: calibration.filter((_, i) => i !== selected).map(p => [p.mass, p.depth]), itemStyle: { color: '#8191a6' }, silent: true },
      { type: 'line', symbol: 'none', data: [[point.mass, 0], [point.mass, Math.max(point.depth, predicted)]], lineStyle: { color: '#75849b', width: 1, type: 'dashed' }, silent: true },
      { type: 'scatter', symbolSize: 16, data: [[point.mass, point.depth]], itemStyle: { color: '#c06d17', borderWidth: 2, borderColor: '#fff' }, silent: true, z: 6 },
      { type: 'scatter', symbolSize: 22, data: [[point.mass, predicted]], itemStyle: { color: 'rgba(255,255,255,0)', borderWidth: 3, borderColor: '#168c97' }, silent: true, z: 7 },
    ],
  }), [point, predicted, selected, w, b]);
  if(!calibration.length)return <ContentBlock title="请先完成称象记录" subtitle="本页使用第一页投石时实际记录的数据。" />;
  return <ContentBlock headingLevel={1} title="线性回归模型" subtitle="调整斜率与截距，观察预测直线如何变化。" className="rl-linear-page">
    <div className="rl-linear-content">
      <div className="rl-linear-layout">
        <section className="rl-linear-data" aria-label="观测数据与可调预测直线">
          <header className="rl-linear-plot-head"><Typography variant="h3" tone="accent">观测与预测</Typography><div className="rl-linear-legend"><span><i />观测记录</span><span><i className="is-line" />预测直线</span></div></header>
          <div className="rl-linear-plot-canvas" ref={plotRef}>
          <EChartsChart className="rl-linear-chart" option={option} minHeight={0} aria-label={`载重 ${point.mass} 千克，观测深度 ${point.depth.toFixed(1)} 厘米，预测深度 ${predicted.toFixed(1)} 厘米`} />
            {plotSize.width > 0 && plotSize.height > 0 && (['left', 'right'] as const).map(endpoint => {
              const depth = endpoint === 'left' ? b : w * maxX + b;
              const x = endpoint === 'left' ? chartGrid.left : plotSize.width - chartGrid.right;
              const y = chartGrid.top + (1 - depth / maxY) * (plotSize.height - chartGrid.top - chartGrid.bottom);
              return <Button key={endpoint} className="rl-linear-handle" role="slider" aria-label={endpoint === 'left' ? '拖动直线左端点' : '拖动直线右端点'} aria-orientation="vertical" aria-valuemin={endpoint === 'left' ? minB : minW * maxX + b} aria-valuemax={endpoint === 'left' ? maxB : maxW * maxX + b} aria-valuenow={depth} aria-valuetext={`下沉深度 ${depth.toFixed(1)}，斜率 ${w.toFixed(4)}，截距 ${b.toFixed(1)}`} title="上下拖动端点；也可用方向键调整" style={{ left: x, top: y }}
                onPointerDown={event => {
                  event.preventDefault();
                  event.currentTarget.setPointerCapture(event.pointerId);
                  dragRef.current = { endpoint, pointerY: event.clientY, depth, rightDepth: w * maxX + b };
                }} onPointerMove={dragEndpoint} onPointerUp={releaseEndpoint} onPointerCancel={releaseEndpoint} onLostPointerCapture={() => { dragRef.current = null; }}
                onKeyDown={event => {
                  if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
                  event.preventDefault();
                  const min = endpoint === 'left' ? minB : minW * maxX + b;
                  const max = endpoint === 'left' ? maxB : maxW * maxX + b;
                  const next = event.key === 'Home' ? min : event.key === 'End' ? max : depth + (event.key === 'ArrowUp' || event.key === 'ArrowRight' ? .1 : -.1);
                  adjustEndpoint(endpoint, next);
                }}><Typography as="span" variant="bodySmall" tone="inherit" aria-hidden="true">↕</Typography></Button>;
            })}
          </div>
          <div className="rl-linear-sample" aria-live="polite"><Typography variant="bodySmall" tone="muted">同一输入 · <strong>{point.mass}</strong> 千克</Typography><Typography variant="bodySmall" className="rl-linear-observed"><i />观测 <strong>{point.depth.toFixed(1)}</strong> cm</Typography><Typography variant="bodySmall" className="rl-linear-predicted"><i />预测 <strong>{predicted.toFixed(1)}</strong> cm</Typography></div>
        </section>
        <section className="rl-linear-controls" aria-label="预测公式与模型参数">
          <div className="rl-linear-model-section">
            <Typography variant="h3" tone="accent">预测模型</Typography>
            <MathFormulaBlock appearance="plain" className="rl-linear-model" ariaLabel="预测值等于斜率乘输入加截距"><MathFormulaStatic latex={'\\hat{y}=\\textcolor{#168c97}{w}x+\\textcolor{#168c97}{b}'} /></MathFormulaBlock>
            <div className="rl-linear-variables"><Typography variant="bodySmall" tone="accent">x：累计石重</Typography><span aria-hidden="true">·</span><Typography variant="bodySmall" tone="accent">ŷ：预测下沉深度</Typography></div>
            <Typography variant="bodySmall" tone="muted" className="rl-linear-parameter-note">w、b 是需要确定的模型参数</Typography>
          </div>
          <div className="rl-linear-parameter rl-linear-slope"><RangeControl label={<span className="rl-linear-parameter-label"><i>w</i>斜率</span>} aria-label="斜率 w" style={sliderStyle(w, .008, .024)} min={.008} max={.024} step="any" digits={4} suffix=" 厘米/千克" value={w} onChange={event => setW(Number(event.target.value))} /><div className="rl-linear-range-ends" aria-hidden="true"><span>0.008</span><span>0.024</span></div><Typography variant="bodySmall" tone="muted">w 增大，直线变陡。<span className="rl-linear-direction" aria-hidden="true">↗</span></Typography></div>
          <div className="rl-linear-parameter rl-linear-intercept"><RangeControl label={<span className="rl-linear-parameter-label"><i>b</i>截距</span>} aria-label="截距 b" style={sliderStyle(b, 0, 6)} min={0} max={6} step="any" digits={1} suffix=" 厘米" value={b} onChange={event => setB(Number(event.target.value))} /><div className="rl-linear-range-ends" aria-hidden="true"><span>0</span><span>6</span></div><Typography variant="bodySmall" tone="muted">b 增大，整条直线上移。<span className="rl-linear-direction" aria-hidden="true">↑</span></Typography></div>
        </section>
      </div>
      <Typography variant="bodySmall" tone="accent" className="rl-linear-takeaway">观测记录保持不变，调整的是模型对数据的预测。</Typography>
    </div>
  </ContentBlock>;
}
