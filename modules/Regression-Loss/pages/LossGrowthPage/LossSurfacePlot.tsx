import { useCallback, useEffect, useMemo, useRef } from 'react';
import { PlotlyChart, type PlotlyGraph, type PlotlyTrace, type PlotlyLayout } from '../../../shared/react';

type Point = { u: number; v: number };
type Model = { g11: number; g12: number; loss: number; fast: Point; slow: Point };
const config = { scrollZoom: true, displayModeBar: true, displaylogo: false, modeBarButtonsToRemove: ['toImage'] };

export function LossSurfacePlot({ model, offset, onChange }: { model: Model; offset: Point; onChange: (p: Point) => void }) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const offsetRef = useRef(offset);
  offsetRef.current = offset;
  const increment = useCallback((p: Point) => Math.max(0, model.g11 * p.u ** 2 + 2 * model.g12 * p.u * p.v + p.v ** 2), [model]);
  const traces = useMemo<PlotlyTrace[]>(() => {
    const axis = Array.from({ length: 51 }, (_, i) => -3.5 + i * .14);
    const direction = (p: Point, name: string, color: string): PlotlyTrace => {
      const points = Array.from({ length: 41 }, (_, i) => ({ u: p.u * i / 40, v: p.v * i / 40 }));
      return { type: 'scatter3d', mode: 'lines', name, x: points.map(p => p.u), y: points.map(p => p.v), z: points.map(p => model.loss + increment(p)), line: { color, width: 7 }, hovertemplate: `${name}<br>1000Δw = %{x:.1f} cm<br>Δb = %{y:.1f} cm<br>MSE = %{z:.1f} cm²<extra></extra>` };
    };
    return [
      { type: 'surface', name: 'MSE曲面', x: axis, y: axis, z: axis.map(v => axis.map(u => model.loss + increment({ u, v }))), colorscale: [[0, '#e3efff'], [.45, '#a9cbf7'], [1, '#5b94e4']], opacity: .83, showscale: false, contours: { z: { show: true, usecolormap: true, highlightcolor: '#287af0', project: { z: true } } }, hovertemplate: '点选此处调整参数<br>1000Δw = %{x:.1f} cm<br>Δb = %{y:.1f} cm<br>MSE = %{z:.1f} cm²<extra></extra>' },
      direction(model.slow, '方向① · 增长慢', '#ed655a'), direction(model.fast, '方向② · 增长快', '#287af0'),
      { type: 'scatter3d', mode: 'markers', name: '最优参数', x: [0], y: [0], z: [model.loss], marker: { size: 6, color: '#009eaa' }, hovertemplate: '最优参数 θ*<br>MSE = %{z:.1f} cm²<br>所有方向的损失增量均非负<extra></extra>' },
      { type: 'scatter3d', mode: 'markers', name: '当前参数', x: [0], y: [0], z: [model.loss], marker: { size: 7, color: '#8a59ce', line: { color: '#fff', width: 2 } }, hovertemplate: '当前参数<br>1000Δw = %{x:.1f} cm<br>Δb = %{y:.1f} cm<br>MSE = %{z:.1f} cm²<extra></extra>' },
    ];
  }, [model, increment]);
  const layout = useMemo<PlotlyLayout>(() => ({
    margin: { l: 0, r: 0, t: 5, b: 0 }, paper_bgcolor: 'rgba(0,0,0,0)', showlegend: false,
    font: { family: 'Microsoft YaHei, sans-serif', size: 15, color: '#27446e' },
    scene: { dragmode: 'orbit', aspectmode: 'manual', aspectratio: { x: 1, y: 1, z: .8 }, camera: { eye: { x: 1.5, y: 1.5, z: 1.05 } },
      xaxis: { title: { text: '1000Δw（厘米）', font: { size: 17 } }, range: [-3.5, 3.5], dtick: 2, backgroundcolor: '#f5f9ff', gridcolor: '#dbe7f7', showbackground: true },
      yaxis: { title: { text: 'Δb（厘米）', font: { size: 17 } }, range: [-3.5, 3.5], dtick: 2, backgroundcolor: '#f5f9ff', gridcolor: '#dbe7f7', showbackground: true },
      zaxis: { title: { text: 'MSE（平方厘米）', font: { size: 17 } }, gridcolor: '#dbe7f7', backgroundcolor: '#f5f9ff', showbackground: true },
    },
  }), []);
  const updateMarker = useCallback((host: HTMLDivElement, p: Point) => {
    const graph = host as HTMLDivElement & { data?: PlotlyTrace[] };
    if (!graph.data || graph.data.length < 5) return;
    void window.Plotly?.restyle?.(host, { x: [[p.u]], y: [[p.v]], z: [[model.loss + increment(p)]] }, [4]);
  }, [model, increment]);
  const ready = useCallback((graph: PlotlyGraph, host: HTMLDivElement) => {
    hostRef.current = host;
    updateMarker(host, offsetRef.current);
    graph.on?.('plotly_click', event => {
      const points = event.points as { x?: number; y?: number }[] | undefined;
      const p = points?.[0];
      if (typeof p?.x === 'number' && typeof p.y === 'number') onChange({ u: Math.max(-3.2, Math.min(3.2, p.x)), v: Math.max(-3.2, Math.min(3.2, p.y)) });
    });
  }, [onChange, updateMarker]);
  useEffect(() => { if (hostRef.current) updateMarker(hostRef.current, offset); }, [offset, updateMarker]);
  return <PlotlyChart data={traces} layout={layout} config={config} minHeight={0} onGraphReady={ready} className="rl-growth-surface-chart" aria-label="MSE三维坐标曲面：拖动旋转、滚轮缩放、点选调整参数" tabIndex={0} onKeyDown={e => {
    const steps: Record<string, Point> = { ArrowLeft: { u: -.1, v: 0 }, ArrowRight: { u: .1, v: 0 }, ArrowUp: { u: 0, v: .1 }, ArrowDown: { u: 0, v: -.1 } };
    const step = steps[e.key];
    if (step) { e.preventDefault(); onChange({ u: Math.max(-3.2, Math.min(3.2, offset.u + step.u)), v: Math.max(-3.2, Math.min(3.2, offset.v + step.v)) }); }
  }} />;
}
