import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent } from 'react';
import { Button, PlotlyChart, type PlotlyGraph } from '../../../shared/react';

type Axis = { _offset: number; l2p: (v: number) => number; p2l: (v: number) => number; range: number[] };
type Host = HTMLDivElement & { _fullLayout?: { xaxis: Axis; yaxis: Axis } };
export function InterceptLossPlot({ n, optimum, minimum, b, onChange, slope = false }: { slope?: boolean; n: number; optimum: number; minimum: number; b: number; onChange: (v: number) => void }) {
  const hostRef = useRef<Host | null>(null);
  const bRef = useRef(b); bRef.current = b;
  const [position, setPosition] = useState({ x: 0, y: 0, visible: false });
  const square = useCallback((x: number) => minimum + n * (x - optimum) ** 2, [n, optimum, minimum, slope]);
  const update = useCallback(() => {
    const a = hostRef.current?._fullLayout;
    if (!a) return;
    const value = bRef.current, s = square(value);
    setPosition({ x: a.xaxis._offset + a.xaxis.l2p(value), y: a.yaxis._offset + a.yaxis.l2p(s), visible: value >= a.xaxis.range[0] && value <= a.xaxis.range[1] && s >= a.yaxis.range[0] && s <= a.yaxis.range[1] });
  }, [square]);
  const data = useMemo(() => {
    const xs = Array.from({ length: 241 }, (_, i) => optimum - 12 + i * .1);
    return [
      { type: 'scatter', mode: 'lines', name: '平方和', x: xs, y: xs.map(square), line: { color: '#367de8', width: 4 }, hovertemplate: slope ? '1000w = %{x:.1f}<br>平方和 S = %{y:.1f}<extra></extra>' : '截距 b = %{x:.1f} cm<br>平方和 S = %{y:.1f} cm²<extra></extra>' },
      { type: 'scatter', mode: 'markers', name: '最低点', x: [optimum], y: [minimum], marker: { color: '#009eaa', size: 13 }, hovertemplate: slope ? '最优斜率<br>1000w* = %{x:.1f}<br>S = %{y:.1f}<extra></extra>' : '最低点<br>b(w) = %{x:.1f} cm<br>S = %{y:.1f} cm²<extra></extra>' },
      { type: 'scatter', mode: 'lines', name: '当前切线', x: [optimum - 1, optimum + 1], y: [minimum, minimum], line: { color: '#ed8a34', width: 3 }, hoverinfo: 'skip' },
    ];
  }, [square, optimum, minimum, slope]);
  const layout = useMemo(() => ({
    margin: { l: 84, r: 25, t: 13, b: 52 }, paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)', dragmode: 'pan', showlegend: false,
    font: { family: 'Microsoft YaHei, sans-serif', color: '#27446e', size: 17 },
    xaxis: { title: { text: slope ? '预测直线的斜率 1000w' : '预测直线的截距 b（厘米）', font: { size: 20 } }, range: [optimum - 6, optimum + 6], showgrid: false, zeroline: false, showline: true },
    yaxis: { title: { text: '平方误差总和 S（cm²）', font: { size: 20 } }, range: [Math.max(0, minimum - n * 3), minimum + n * 38], gridcolor: '#e3edf8', zeroline: false, showline: true },
  }), [n, optimum, minimum, slope]);
  const updateTangent = useCallback((host: Host) => {
    const value = bRef.current, derivative = 2 * n * (value - optimum);
    const width = Math.min(1.5, Math.abs(derivative) > 100 ? .8 : 1.5);
    void window.Plotly?.restyle?.(host, { x: [[value - width, value + width]], y: [[square(value) - derivative * width, square(value) + derivative * width]] }, [2]);
  }, [n, optimum, square]);
  const ready = useCallback((graph: PlotlyGraph, host: HTMLDivElement) => {
    hostRef.current = host as Host; update(); updateTangent(host as Host);
    graph.on?.('plotly_relayout', () => {
      const a = hostRef.current?._fullLayout;
      if (a) { const width = a.xaxis.range[1] - a.xaxis.range[0]; const xs = Array.from({ length: 401 }, (_, i) => a.xaxis.range[0] - width + 3 * width * i / 400); void window.Plotly?.restyle?.(host, { x: [xs], y: [xs.map(square)] }, [0]); }
      update();
    });
  }, [square, update, updateTangent]);
  useEffect(() => { update(); if (hostRef.current) updateTangent(hostRef.current); }, [b, update, updateTangent]);
  const move = (e: PointerEvent<HTMLButtonElement>) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
    const h = hostRef.current, a = h?._fullLayout;
    if (!h || !a) return;
    const rect = h.getBoundingClientRect();
    const next = a.xaxis.p2l((e.clientX - rect.left) * h.clientWidth / rect.width - a.xaxis._offset);
    onChange(Math.abs(next - optimum) < .08 ? optimum : next);
  };
  return <div className="rl-intercept-coordinate"><PlotlyChart className="rl-intercept-chart" data={data} layout={layout} minHeight={0} onGraphReady={ready} aria-label="截距平方和曲线：拖动点观察切线斜率，空白处拖动平移，滚轮缩放" />{position.visible && <div className="rl-intercept-point-wrap" style={{ left: position.x, top: position.y }}><Button className={`rl-intercept-point${Math.abs(b - optimum) < 1e-8 ? ' is-minimum' : ''}`} aria-label="拖动曲线上的点改变截距" explain={slope ? "左右拖动改变左图斜率w，截距自动取最优值ȳ−wx̄。横轴用1000w显示小数斜率：刻度15代表w=0.015。点的高度是全部平方误差总和。" : "左右拖动改变预测直线的截距b。这个点的高度是该直线全部误差平方之和；橙线斜率等于导数。绿点是损失最低的位置。"} onPointerDown={e => { e.stopPropagation(); e.currentTarget.setPointerCapture(e.pointerId); }} onPointerMove={move} onPointerUp={e => { if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId); }} onKeyDown={e => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); onChange(b + (e.key === 'ArrowLeft' ? -.1 : .1)); } }}>●</Button></div>}</div>;
}

