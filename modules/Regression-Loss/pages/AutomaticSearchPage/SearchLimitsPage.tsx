import { useEffect, useId, useMemo, useRef, useState, type PointerEvent } from 'react';
import { Button, ContentBlock, MathFormulaBlock, MathFormulaStatic, Typography } from '../../../shared/react';
import { createSearchSpace, lossColor, SEARCH_STEP_MS, VALUES_PER_PARAMETER, type SearchDimension } from './searchSpace';
import './SearchLimitsPage.css';

const dimensionNames = ['一维', '二维', '三维'];
const pendingColor = '#cbd3df';
const initialView = () => ({ yaw: -.55, pitch: .42, rotation: 0, zoom: 1, panX: 0, panY: 0 });
type ViewState = ReturnType<typeof initialView>;

function position(values: number[], dimension: SearchDimension, view: ViewState) {
  if (dimension === 1) return { x: 160 + values[0] * 118, y: 245 };
  if (dimension === 2) return { x: 250 + values[0] * 88, y: 440 - values[1] * 70 };
  const [x, y, z] = values.map(value => (value - 3) * 65);
  const rx = x * Math.cos(view.yaw) + z * Math.sin(view.yaw);
  const rz = -x * Math.sin(view.yaw) + z * Math.cos(view.yaw);
  const ry = y * Math.cos(view.pitch) - rz * Math.sin(view.pitch);
  return { x: 540 + rx, y: 250 - ry, depth: y * Math.sin(view.pitch) + rz * Math.cos(view.pitch) };
}

export function SearchLimitsPage() {
  const [dimension, setDimension] = useState<SearchDimension>(2);
  const [count, setCount] = useState(0);
  const [running, setRunning] = useState(false);
  const [view, setView] = useState(initialView);
  const countRef = useRef(0);
  const svgRef = useRef<SVGSVGElement>(null);
  const drag = useRef<{ x: number; y: number; view: ViewState; pan: boolean } | null>(null);
  const updateCount = (value: number) => { countRef.current = value; setCount(value); };
  const zoomBy = (factor: number) => setView(value => ({ ...value, zoom: Math.max(.4, Math.min(4, value.zoom * factor)) }));
  const move = (event: PointerEvent<SVGSVGElement>) => {
    const start = drag.current;
    if (!start) return;
    const dx = event.clientX - start.x, dy = event.clientY - start.y;
    if (start.pan) {
      const svg = event.currentTarget;
      const scale = Math.min(svg.clientWidth / svg.viewBox.baseVal.width, svg.clientHeight / svg.viewBox.baseVal.height);
      setView({ ...start.view, panX: start.view.panX + dx / scale, panY: start.view.panY + dy / scale });
    } else if (dimension === 3) {
      setView({ ...start.view, yaw: start.view.yaw + dx * .01, pitch: Math.max(-1.4, Math.min(1.4, start.view.pitch + dy * .01)) });
    } else {
      setView({ ...start.view, rotation: start.view.rotation + (dx - dy) * .45 });
    }
  };
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const wheel = (event: WheelEvent) => { event.preventDefault(); zoomBy(Math.exp(-Math.max(-100, Math.min(100, event.deltaY)) * .004)); };
    svg.addEventListener('wheel', wheel, { passive: false });
    return () => svg.removeEventListener('wheel', wheel);
  }, []);
  const points = useMemo(() => createSearchSpace(dimension), [dimension]);
  const total = points.length;
  const finished = count === total;
  const current = count ? points[count - 1] : undefined;
  const markerId = useId().replaceAll(':', '');
  useEffect(() => {
    if (!running) return;
    const initialCount = countRef.current;
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const next = Math.min(total, initialCount + Math.floor((now - start) / SEARCH_STEP_MS));
      countRef.current = next;
      setCount(next);
      if (next < total) frame = requestAnimationFrame(tick);
      else setRunning(false);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [running, total]);
  const reset = () => { setRunning(false); updateCount(0); };
  const switchDimension = (next: SearchDimension) => { reset(); setDimension(next); setView(initialView()); };
  const status = finished ? '搜索完成' : running ? '搜索进行中' : count ? '搜索已暂停' : '等待开始搜索';
  const projected = points.map((point, index) => ({ ...point, index, ...position(point.values, dimension, view) }));
  // Draw back layers first; traversal order remains w₁, then w₂, then w₃.
  const drawOrder = dimension === 3 ? [...projected].sort((a, b) => (a.depth ?? 0) - (b.depth ?? 0)) : projected;
  const currentPosition = current ? position(current.values, dimension, view) : undefined;
  const axisArrow = { markerEnd: `url(#${markerId})` };
  return <ContentBlock headingLevel={1} title="遍历搜索的局限" subtitle="每个参数取 5 个值，候选组合随维度迅速增加。" className="rl-search-page rl-space-page">
    <div className="rl-space-content">
      <section className="rl-space-workspace" aria-label="参数空间遍历搜索实验">
        <header className="rl-space-toolbar">
          <div className="rl-space-tabs" role="group" aria-label="切换参数空间维度">{([1, 2, 3] as const).map(value => <Button key={value} active={dimension === value} variant={dimension === value ? 'primary' : 'default'} aria-pressed={dimension === value} onClick={() => switchDimension(value)}>{dimensionNames[value - 1]}</Button>)}</div>
          <Typography variant="body" tone="muted" className="rl-space-description"><strong>{dimensionNames[dimension - 1]}参数空间</strong><span>·</span>{total} 个候选组合</Typography>
          <Typography variant="body" className={`rl-space-status${running && !finished ? ' is-running' : ''}`} role="status">{status}</Typography>
        </header>
        <div className="rl-space-main">
          <section className="rl-space-visual" aria-label={`${dimensionNames[dimension - 1]}参数空间，${total}个候选组合`}>
            <Typography variant="body" tone="muted" className="rl-space-caption">每个点代表一组参数</Typography>
            <svg ref={svgRef} className="rl-space-plot" tabIndex={0}
              onPointerDown={event => { if (event.button !== 0 && event.button !== 1) return; event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); drag.current = { x: event.clientX, y: event.clientY, view: { ...view }, pan: dimension !== 3 || event.shiftKey || event.button === 1 }; }}
              onPointerMove={move} onPointerUp={event => { drag.current = null; if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); }} onPointerCancel={() => { drag.current = null; }}
              onDoubleClick={() => setView(initialView())}
              onKeyDown={event => { if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-','Home'].includes(event.key)) { event.preventDefault(); if (event.key === 'Home') setView(initialView()); else if (['+','=','-'].includes(event.key)) zoomBy(event.key === '-' ? .9 : 1.1); else setView(value => dimension === 3 ? { ...value, yaw: value.yaw + (event.key === 'ArrowLeft' ? -.1 : event.key === 'ArrowRight' ? .1 : 0), pitch: Math.max(-1.4, Math.min(1.4, value.pitch + (event.key === 'ArrowUp' ? -.1 : event.key === 'ArrowDown' ? .1 : 0))) } : { ...value, rotation: value.rotation + (event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -5 : 5) }); } }} viewBox={dimension === 1 ? "120 70 830 360" : "180 0 720 500"} role="img" aria-label={`${dimensionNames[dimension - 1]}候选点阵，已评估${count}/${total}组；蓝到红连续表示损失由低到高，灰色未搜索`}>
              <defs><marker id={markerId} markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6" fill="#27446e" /></marker></defs>
              <g transform={`translate(${view.panX} ${view.panY}) translate(540 250) scale(${view.zoom}) rotate(${dimension === 3 ? 0 : view.rotation}) translate(-540 -250)`}>
              {dimension === 1 && <g className="rl-space-axes"><path d="M210 245 H830" {...axisArrow} /><Typography as="text" variant="body" tone="accent" x="843" y="254">参数 w₁</Typography>{[1, 2, 3, 4, 5].map(value => <Typography as="text" variant="body" tone="accent" key={value} x={160 + value * 118} y="285" textAnchor="middle">{value}</Typography>)}</g>}
              {dimension === 2 && <>
                <g className="rl-space-guides">{[1, 2, 3, 4, 5].map(value => <g key={value}><path d={`M${250 + value * 88} 65 V440`} /><path d={`M250 ${440 - value * 70} H735`} /></g>)}</g>
                <g className="rl-space-axes"><path d="M250 440 H780" {...axisArrow} /><path d="M250 440 V45" {...axisArrow} /><Typography as="text" variant="body" tone="accent" x="795" y="449">参数 w₁</Typography><Typography as="text" variant="body" tone="accent" x="260" y="34">参数 w₂</Typography>{[1, 2, 3, 4, 5].map(value => <g key={value}><Typography as="text" variant="body" tone="accent" x={250 + value * 88} y="473" textAnchor="middle">{value}</Typography><Typography as="text" variant="body" tone="accent" x="228" y={448 - value * 70} textAnchor="end">{value}</Typography></g>)}</g>
              </>}
              {dimension === 3 && <>
                <g className="rl-space-planes">{[5, 4, 3, 2, 1].map(layer => {
                  const corners = [[1, 1], [5, 1], [5, 5], [1, 5]].map(([x, y]) => position([x, y, layer], 3, view));
                  return <g key={layer}><polygon points={corners.map(p => `${p.x},${p.y}`).join(' ')} /></g>;
                })}</g>
                <g className="rl-space-axes">{[0, 1, 2].map(axis => {
                  const origin = position([.5, .5, .5], 3, view);
                  const values = [.5, .5, .5]; values[axis] = 5.8;
                  const end = position(values, 3, view);
                  return <g key={axis}><path d={`M${origin.x} ${origin.y} L${end.x} ${end.y}`} {...axisArrow} /><Typography as="text" variant="body" tone="accent" x={end.x + 10} y={end.y}>w{['₁', '₂', '₃'][axis]}</Typography></g>;
                })}</g>
              </>}
              {dimension < 3 && <g className="rl-space-heat-cells">{projected.map(point => <rect key={point.index} x={point.x - (dimension === 1 ? 59 : 44)} y={point.y - (dimension === 1 ? 26 : 35)} width={dimension === 1 ? 118 : 88} height={dimension === 1 ? 52 : 70} fill={point.index < count ? lossColor(point.loss) : '#eef1f6'} opacity={point.index < count ? .48 : .3} />)}</g>}
              <g className="rl-space-nodes">{drawOrder.map(point => {
                const searched = point.index < count;
                const fill = searched ? lossColor(point.loss) : pendingColor;
                return <circle key={point.index} cx={point.x} cy={point.y} r={dimension === 3 ? 8 : 13} fill={fill} data-state={searched ? 'evaluated' : 'pending'}><title>{`参数 (${point.values.join(', ')}) · ${searched ? `示意损失 ${point.loss.toFixed(3)}` : '尚未搜索'}`}</title></circle>;
              })}</g>
              {currentPosition && <circle className="rl-space-current-ring" cx={currentPosition.x} cy={currentPosition.y} r={dimension === 3 ? 14 : 22} />}
              </g>
            </svg>
            <div className="rl-space-search-controls" aria-label="搜索控制">
              <div className="rl-space-progress"><Typography variant="body" tone="accent">搜索进度 <strong>{count} / {total}</strong></Typography><progress value={count} max={total} aria-label="参数组合搜索进度" /></div>
              <div className="rl-space-actions"><Button variant="primary" disabled={finished} onClick={() => setRunning(value => !value)}>{finished ? '已完成' : running ? '暂停搜索' : count ? '继续搜索' : '开始搜索'}</Button><Button onClick={reset}>重新开始</Button></div>
            </div>
            <div className="rl-space-view-tools"><Typography variant="body" tone="muted">{dimension === 3 ? '拖动旋转 · Shift+拖动平移 · 滚轮缩放' : '拖动平移 · 滚轮缩放'}</Typography><Button aria-label="缩小视图" onClick={() => zoomBy(.8)}>−</Button><Button aria-label="放大视图" onClick={() => zoomBy(1.25)}>＋</Button><Button onClick={() => setView(initialView())}>复位视角</Button></div>
            <div className="rl-space-legend"><Typography as="span" variant="body" tone="muted"><i />待搜索</Typography><Typography as="span" variant="body" tone="muted" className="rl-space-heat-scale">损失低 <i /> 损失高</Typography><Typography variant="body" tone="muted">{current ? `当前候选 (${current.values.join(', ')})` : '等待评估第一组参数'}</Typography></div>
          </section>
          <aside className="rl-space-controls" aria-label="候选组合数与维度关系">
            <section className="rl-space-combinations" aria-label="不同维度的候选组合数">
              <Typography variant="body" tone="accent" className="rl-space-combinations-title">组合数随维度增长</Typography>
              <dl className="rl-space-combination-rows">{([1, 2, 3] as const).map(value => <div key={value} className={dimension === value ? 'is-selected' : ''}>
                <Typography as="dt" variant="body" tone="inherit">{dimensionNames[value - 1]}</Typography>
                <dd><MathFormulaBlock appearance="plain"><MathFormulaStatic latex={`${VALUES_PER_PARAMETER}^{${value}}=${VALUES_PER_PARAMETER ** value}`} /></MathFormulaBlock></dd>
              </div>)}</dl>
              <div className="rl-space-generalization" aria-label="n个参数、每个参数取5个值，共有5的n次方个候选组合">
                <MathFormulaBlock appearance="plain" className="rl-space-growth-formula"><MathFormulaStatic latex={`${VALUES_PER_PARAMETER}^{n}`} /></MathFormulaBlock>
                <Typography variant="body" tone="accent" align="center">n 个参数的候选组合数</Typography>
                <Typography variant="body" tone="accent" align="center">每多一个参数，组合数 ×{VALUES_PER_PARAMETER}</Typography>
              </div>
            </section>
          </aside>
        </div>
      </section>

    </div>
  </ContentBlock>;
}
