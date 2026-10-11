import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, ContentBlock, MathFormulaBlock, MathFormulaStatic, MathFormulaTerm, PlotlyChart, Typography, type PlotlyGraph, type PlotlyTrace } from '../../../shared/react';
import { useRecordedData } from '../../regressionData';
import './LeastSquaresGeometryPage.css';

type Offset = { u: number; v: number };
const config = { scrollZoom: true, displayModeBar: true, displaylogo: false, modeBarButtonsToRemove: ['toImage'] };
const clamp = (x: number) => Math.max(-3, Math.min(3, x));
function GeometryPlot({ height, offset, onChange }: { height: number; offset: Offset; onChange: (p: Offset) => void }) {
  const host = useRef<HTMLDivElement | null>(null);
  const current = useRef(offset); current.current = offset;
  const hovered = useRef(false);
  const [moveMode, setMoveMode] = useState(true);
  const camera = useRef({ x: .85, y: -1.1, z: .8 });
  const drag = useRef<{ x: number; y: number; start: Offset } | null>(null);
  const traces = useMemo<PlotlyTrace[]>(() => [
    { type: 'surface', x: [-3.5, 3.5], y: [-3.5, 3.5], z: [[0, 0], [0, 0]], colorscale: [[0, '#cfe5ff'], [1, '#cfe5ff']], opacity: .45, showscale: false, hovertemplate: '列空间 Col(X)<br>所有可行的预测向量都在这个平面内<br>点选平面可移动候选预测<extra></extra>', contours: { x: { show: true, start: -3, end: 3, size: 1, color: '#a6caff' }, y: { show: true, start: -3, end: 3, size: 1, color: '#a6caff' } } },
    { type: 'scatter3d', mode: 'lines', x: [0, 0], y: [0, 0], z: [0, height], line: { color: '#00a393', width: 6, dash: 'dash' }, hovertemplate: '最优残差 y−Xθ*<br>垂直于整个列空间，长度最短<extra></extra>' },
    { type: 'scatter3d', mode: 'markers+text', x: [0], y: [0], z: [height], text: ['观测 y（固定）'], textposition: 'top center', marker: { size: 9, color: '#f68a32' }, hovertemplate: '固定观测向量 y<br>代表第一页全部观测，不是单条石重—深度记录<extra></extra>' },
    { type: 'scatter3d', mode: 'markers+text', x: [0], y: [0], z: [0], text: [''], textposition: 'bottom center', marker: { size: 8, color: '#00a393' }, hovertemplate: '正交投影 Xθ*<br>所有可行预测中，与固定观测最近的点<br>Xᵀ(y−Xθ*) = 0<extra></extra>' },
    { type: 'scatter3d', mode: 'lines', x: [0, 1.7], y: [0, .6], z: [height, 0], line: { color: '#367de8', width: 5, dash: 'dash' }, hovertemplate: '当前残差 y−Xθ<br>连线长度平方就是平方误差总和<extra></extra>' },
    { type: 'scatter3d', mode: 'markers+text', x: [1.7], y: [.6], z: [0], text: [''], textposition: 'bottom center', marker: { size: 9, color: '#367de8' }, hovertemplate: '当前预测 Xθ<br>直接拖动蓝点，可在列空间内移动<br>空白处拖动旋转；滚轮缩放；工具栏切换平移<extra></extra>' },
  ], [height]);
  const layout = useMemo(() => ({ margin: { l: 0, r: 0, t: 10, b: 0 }, paper_bgcolor: 'rgba(0,0,0,0)', showlegend: false, uirevision: 'geometry-camera', font: { family: 'Microsoft YaHei', size: 16, color: '#27446e' }, scene: { dragmode: 'orbit', camera: { eye: { x: .85, y: -1.1, z: .8 }, projection: { type: 'orthographic' } }, aspectmode: 'manual', aspectratio: { x: 1.25, y: 1.25, z: 1 }, xaxis: { range: [-3.6, 3.6], visible: false }, yaxis: { range: [-3.6, 3.6], visible: false }, zaxis: { range: [-.3, Math.max(4, height * 1.25)], visible: false } } }), [height]);
  const update = useCallback((p: Offset) => { if (!host.current) return; void window.Plotly?.restyle?.(host.current, { x: [[0, p.u]], y: [[0, p.v]] }, [4]); void window.Plotly?.restyle?.(host.current, { x: [[p.u]], y: [[p.v]] }, [5]); }, []);
  const ready = useCallback((graph: PlotlyGraph, element: HTMLDivElement) => {
    host.current = element; update(current.current);
    graph.on?.('plotly_hover', e => { hovered.current = (e.points as { curveNumber: number }[] | undefined)?.[0]?.curveNumber === 5; });
    graph.on?.('plotly_unhover', () => { hovered.current = false; });
    graph.on?.('plotly_relayout', e => { const c = e['scene.camera'] as { eye?: typeof camera.current } | undefined; if (c?.eye) camera.current = c.eye; });
    graph.on?.('plotly_click', e => { if (drag.current) return; const p = (e.points as { curveNumber: number; x: number; y: number }[] | undefined)?.[0]; if (p?.curveNumber === 0) onChange({ u: clamp(p.x), v: clamp(p.y) }); });
  }, [onChange, update]);
  useEffect(() => { update(offset); }, [offset, update]);
  return <div className="rl-geometry-space-wrap"><div className="rl-geometry-space-tools"><Button onClick={() => setMoveMode(true)} variant={moveMode ? 'primary' : undefined}>移动预测</Button><Button onClick={() => setMoveMode(false)} variant={!moveMode ? 'primary' : undefined}>旋转视图</Button><Button onClick={() => { camera.current = { x:.85,y:-1.1,z:.8 }; if(host.current) void window.Plotly?.relayout?.(host.current, { 'scene.camera': {eye:camera.current,projection:{type:'orthographic'}} }); }}>重置视角</Button></div><div className="rl-geometry-space" onPointerDownCapture={e => {
    if (!moveMode && !hovered.current) return; e.stopPropagation(); e.preventDefault(); drag.current = { x: e.clientX, y: e.clientY, start: current.current }; e.currentTarget.setPointerCapture(e.pointerId);
  }} onPointerMoveCapture={e => {
    const d = drag.current; if (!d) return; e.stopPropagation(); const eye = camera.current; const len = Math.hypot(eye.x, eye.y) || 1; const rect = e.currentTarget.getBoundingClientRect(); const scale = 6 / Math.max(200, rect.width); const dx = (e.clientX - d.x) * scale, dy = (e.clientY - d.y) * scale; const elevation = Math.max(.3, Math.abs(eye.z) / (Math.hypot(len, eye.z) || 1)); onChange({ u: clamp(d.start.u - eye.y / len * dx + eye.x / len * dy / elevation), v: clamp(d.start.v + eye.x / len * dx + eye.y / len * dy / elevation) });
  }} onPointerUpCapture={e => { if (drag.current) { e.stopPropagation(); drag.current = null; e.currentTarget.releasePointerCapture(e.pointerId); } }} onPointerCancel={() => { drag.current = null; }}><PlotlyChart data={traces} layout={layout} config={config} minHeight={0} onGraphReady={ready} className="rl-geometry-chart" aria-label="三维列空间：移动预测模式拖动改变蓝点，旋转模式拖动旋转，滚轮缩放" /></div><div className="rl-geometry-point-legend"><Typography variant="bodySmall" tone="muted">橙：观测　绿：最优预测　蓝：当前预测</Typography></div></div>;
}
function GaussianPlot({ radius, onChange }: { radius: number; onChange: (r: number) => void }) {
  const host = useRef<HTMLDivElement | null>(null);
  const value = useRef(radius); value.current = radius;
  const density = (x: number, mean = 0) => Math.exp(-((x - mean) ** 2) / 2) / Math.sqrt(2 * Math.PI);
  const traces = useMemo<PlotlyTrace[]>(() => { const xs = Array.from({ length: 241 }, (_, i) => -4 + i / 20); return [
    { type: 'scatter', mode: 'lines', x: xs, y: xs.map(x => density(x)), name: '最优预测', line: { color: '#00a393', width: 4 }, fill: 'tozeroy', fillcolor: 'rgba(0,163,147,.08)', hovertemplate: '最优预测的高斯截面<br>坐标 %{x:.1f}<br>密度 %{y:.3f}<extra></extra>' },
    { type: 'scatter', mode: 'lines', x: xs, y: xs.map(x => density(x, 1.8)), name: '当前预测', line: { color: '#367de8', width: 4 }, fill: 'tozeroy', fillcolor: 'rgba(54,125,232,.08)', hovertemplate: '当前预测的高斯截面<br>点击图中位置改变候选偏移<extra></extra>' },
    { type: 'scatter', mode: 'markers', x: [0, 0], y: [density(0), density(0, 1.8)], showlegend: false, marker: { color: ['#00a393', '#367de8'], size: 13 }, hovertemplate: '固定观测处的密度 %{y:.3f}<br>绿色为最优；蓝色为当前<extra></extra>' },
    { type: 'scatter', mode: 'markers+text', x: [0], y: [.46], showlegend: false, text: ['观测（固定）'], textposition: 'top center', marker: { color: '#f68a32', size: 11 }, hovertemplate: '观测沿候选偏移方向的坐标固定为0<extra></extra>' },
  ]; }, []);
  const layout = useMemo(() => ({ margin: { l: 58, r: 15, t: 34, b: 65 }, paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)', dragmode: 'pan', showlegend: true, legend: { orientation: 'h', x: .1, y: 1.14 }, font: { family: 'Microsoft YaHei', size: 16, color: '#27446e' }, xaxis: { title: { text: '沿候选偏移方向的标准化坐标', font: { size: 17 } }, range: [-3.5, 6], zeroline: false, showgrid: false }, yaxis: { title: { text: '条件概率密度', font: { size: 17 } }, range: [0, .52], zeroline: false, gridcolor: '#e5eef8' }, shapes: [{ type: 'line', x0: 0, x1: 0, y0: 0, y1: .46, line: { color: '#f68a32', dash: 'dot', width: 2 } }] }), []);
  const update = useCallback((r: number) => { if (!host.current) return; const xs = Array.from({ length: 241 }, (_, i) => -4 + i / 20); void window.Plotly?.restyle?.(host.current, { y: [xs.map(x => density(x, r))] }, [1]); void window.Plotly?.restyle?.(host.current, { y: [[density(0), density(0, r)]] }, [2]); }, []);
  const ready = useCallback((graph: PlotlyGraph, element: HTMLDivElement) => { host.current = element; update(value.current); graph.on?.('plotly_click', e => { const p = (e.points as { x: number }[] | undefined)?.[0]; if (typeof p?.x === 'number') onChange(Math.max(0, Math.min(4.2, p.x))); }); }, [onChange, update]);
  useEffect(() => { update(radius); }, [radius, update]);
  return <PlotlyChart data={traces} layout={layout} config={config} minHeight={0} onGraphReady={ready} className="rl-geometry-chart" aria-label="可平移缩放的高斯截面：点击曲线改变候选预测，两图同步" />;
}
export function LeastSquaresGeometryPage() {
  const data = useRecordedData();
  const [offset, setOffset] = useState<Offset>({ u: 1.7, v: .6 });
  const sigma = 2;
  const minimum = useMemo(() => { const n = data.length; const mx = n ? data.reduce((s,p) => s+p.mass,0)/n : 0; const my = n ? data.reduce((s,p) => s+p.depth,0)/n : 0; const xx = data.reduce((s,p) => s+(p.mass-mx)**2,0); const w = xx ? data.reduce((s,p) => s+(p.mass-mx)*(p.depth-my),0)/xx : 0; const b = my-w*mx; return { xx, s: data.reduce((s,p) => s+(p.depth-w*p.mass-b)**2,0) }; }, [data]);
  const radius = Math.hypot(offset.u, offset.v);
  const squaredError = minimum.s + sigma ** 2 * radius ** 2;
  const likelihood = Math.exp(-(radius ** 2) / 2);
  const changeRadius = useCallback((r: number) => setOffset(p => { const d = Math.hypot(p.u,p.v); return d > .001 ? { u:p.u*r/d, v:p.v*r/d } : { u:r,v:0 }; }), []);
  if (!data.length || !minimum.xx) return <ContentBlock title="请先完成称象记录" subtitle="本页使用第一页实际记录计算平方误差与似然。" />;
  return <ContentBlock headingLevel={1} title="最小二乘的几何意义" subtitle="平方距离最小，与高斯似然最大，指向同一个预测。" className="rl-geometry-page"><div className="rl-geometry-layout">
    <section className="rl-geometry-panel"><div className="rl-geometry-heading"><Typography variant="h3" tone="accent">① 几何视角：离观测最近</Typography><Button explain="这是n维观测空间的三维示意。平面是X的二维列空间；图上每个点代表全部记录组成的向量。平面内两轴采用正交标准化坐标，垂直方向代表最优残差。">ⓘ</Button></div><Typography variant="bodySmall" tone="muted">拖动移动蓝点 · 切换模式旋转 · 滚轮缩放</Typography><GeometryPlot height={Math.sqrt(minimum.s)/sigma} offset={offset} onChange={setOffset} /><div className="rl-geometry-readout"><div><Typography variant="bodySmall" tone="muted">平方误差总和 S</Typography><Typography variant="h2" tone="accent">{squaredError.toFixed(1)}</Typography></div><Button variant="primary" onClick={() => setOffset({u:0,v:0})}>回到正交投影</Button></div></section>
    <aside className="rl-geometry-bridge"><Typography variant="h3" tone="accent">同一个残差<br/>两种理解</Typography><Typography variant="h2" tone="accent">→</Typography><MathFormulaBlock appearance="plain"><MathFormulaTerm latex="\mathbf r=\mathbf y-X\theta" tooltip="一整组观测减去一整组预测。左侧连线表示它的长度；右侧密度的变化反映同一个偏差。" /></MathFormulaBlock><Typography variant="bodySmall" tone="muted">距离越小<br/>高斯模型下<br/>似然越大</Typography></aside>
    <section className="rl-geometry-panel rl-geometry-probability"><div className="rl-geometry-heading"><Typography variant="h3" tone="accent">② 概率视角：观测更可能</Typography><Button explain="假设各条噪声独立、同方差且服从高斯分布，σ固定为2。右图展示沿候选偏移方向的条件高斯截面；其余方向的共同因子已约去。截面在观测处的密度比，等于全部记录的联合似然比。连续观测比较概率密度，不是某一个数值的事件概率。">ⓘ</Button></div><Typography variant="bodySmall" tone="muted">高斯似然截面 · 点击曲线可同步改变候选</Typography><GaussianPlot radius={radius} onChange={changeRadius} /><div className="rl-geometry-readout"><div><Typography variant="bodySmall" tone="muted">相对似然（最优 = 1）</Typography><Typography variant="h2" tone="accent">{likelihood.toFixed(1)}</Typography></div><Button explain="相对似然 = exp[−(S−S*)/(2σ²)]。蓝点到投影越远，平方误差越大，观测处蓝色密度越低；回到投影时两条曲线重合。">为什么同步？</Button></div></section>
    <div className="rl-geometry-footer"><Typography variant="body" tone="accent">独立、同方差高斯噪声下：距离最小 ⇔ 似然最大</Typography><MathFormulaBlock appearance="plain"><MathFormulaTerm latex="X^\top(\mathbf y-X\theta^*)=\mathbf0" tooltip="最优残差与X的每一列正交，因此与整个列空间正交，这就是正规方程。" tooltipPlacement="top" /><MathFormulaStatic latex="\qquad" /><MathFormulaTerm latex="\frac{p(\mathbf y\mid\theta)}{p(\mathbf y\mid\theta^*)}=\exp\!\left[-\frac{S(\theta)-S(\theta^*)}{2\sigma^2}\right]" tooltip="固定σ时，平方误差增大，联合高斯似然必然减小；最小二乘与最大似然得到相同参数。" tooltipPlacement="top" /></MathFormulaBlock></div>
  </div></ContentBlock>;
}


