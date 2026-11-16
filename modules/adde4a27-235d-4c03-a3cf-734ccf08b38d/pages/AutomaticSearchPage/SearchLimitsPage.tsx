import { useEffect, useId, useMemo, useRef, useState, type PointerEvent } from 'react';
import { Button, ContentBlock, MathFormulaBlock, MathFormulaStatic, Typography } from "@shuku/course-style/react";
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
  return <ContentBlock shuku-edit-id="e-012cbddd-b1f8-4899-a38a-6845a735f38b" headingLevel={1} title="遍历搜索的局限" subtitle="每个参数取 5 个值，候选组合随维度迅速增加。" className="rl-search-page rl-space-page">
    <div shuku-edit-id="e-e3cb655e-cd4d-4f5a-a4f2-acd526586cbb" className="rl-space-content">
      <section shuku-edit-id="e-2c7f2db9-f982-4cfa-930f-41a731524125" className="rl-space-workspace" aria-label="参数空间遍历搜索实验">
        <header shuku-edit-id="e-90b91aaa-daff-4579-b516-83ff90db1b56" className="rl-space-toolbar">
          <div shuku-edit-id="e-64bb809a-cf01-46bc-baa4-4fc29df300ac" className="rl-space-tabs" role="group" aria-label="切换参数空间维度">{([1, 2, 3] as const).map(value => <Button key={value} active={dimension === value} variant={dimension === value ? 'primary' : 'default'} aria-pressed={dimension === value} onClick={() => switchDimension(value)}>{dimensionNames[value - 1]}</Button>)}</div>
          <Typography shuku-edit-id="e-bcd2e953-abd3-4d40-859b-119e8ff43dde" variant="body" tone="muted" className="rl-space-description"><strong shuku-edit-id="e-0be8b53f-5fd9-4d5d-80e4-631c0b219ded">{dimensionNames[dimension - 1]}参数空间</strong><span shuku-edit-id="e-1fa3bc61-ef8b-4464-a7db-19f8d1aaa468">·</span>{total} 个候选组合</Typography>
          <Typography shuku-edit-id="e-75b4f902-bb90-4da8-a8ec-d489bf5c89c3" variant="body" className={`rl-space-status${running && !finished ? ' is-running' : ''}`} role="status">{status}</Typography>
        </header>
        <div shuku-edit-id="e-69fe459d-5d80-4f1d-9da7-b764c46714a0" className="rl-space-main">
          <section shuku-edit-id="e-a4a27466-fb1f-4050-82e0-6f3da25f8142" className="rl-space-visual" aria-label={`${dimensionNames[dimension - 1]}参数空间，${total}个候选组合`}>
            <Typography shuku-edit-id="e-705e0728-7620-48f4-bad4-b04a8ed332df" variant="body" tone="muted" className="rl-space-caption">每个点代表一组参数</Typography>
            <svg shuku-edit-id="e-e541d183-4906-4108-acff-0dab28863d89" ref={svgRef} className="rl-space-plot" tabIndex={0}
              onPointerDown={event => { if (event.button !== 0 && event.button !== 1) return; event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); drag.current = { x: event.clientX, y: event.clientY, view: { ...view }, pan: dimension !== 3 || event.shiftKey || event.button === 1 }; }}
              onPointerMove={move} onPointerUp={event => { drag.current = null; if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); }} onPointerCancel={() => { drag.current = null; }}
              onDoubleClick={() => setView(initialView())}
              onKeyDown={event => { if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-','Home'].includes(event.key)) { event.preventDefault(); if (event.key === 'Home') setView(initialView()); else if (['+','=','-'].includes(event.key)) zoomBy(event.key === '-' ? .9 : 1.1); else setView(value => dimension === 3 ? { ...value, yaw: value.yaw + (event.key === 'ArrowLeft' ? -.1 : event.key === 'ArrowRight' ? .1 : 0), pitch: Math.max(-1.4, Math.min(1.4, value.pitch + (event.key === 'ArrowUp' ? -.1 : event.key === 'ArrowDown' ? .1 : 0))) } : { ...value, rotation: value.rotation + (event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -5 : 5) }); } }} viewBox={dimension === 1 ? "120 70 830 360" : "180 0 720 500"} role="img" aria-label={`${dimensionNames[dimension - 1]}候选点阵，已评估${count}/${total}组；蓝到红连续表示损失由低到高，灰色未搜索`}>
              <defs shuku-edit-id="e-8ffd0d68-cc0c-46d3-834c-c2fbff8ad5bd"><marker shuku-edit-id="e-df2b5754-ea94-4b5a-a8b4-2190fd1f75ed" id={markerId} markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path shuku-edit-id="e-84ac3c6b-5697-4f6f-8a45-4592b5144656" d="M0,0 L6,3 L0,6" fill="#27446e" /></marker></defs>
              <g shuku-edit-id="e-a0b75813-9f1f-42b0-9f34-d2e061d7b3ab" transform={`translate(${view.panX} ${view.panY}) translate(540 250) scale(${view.zoom}) rotate(${dimension === 3 ? 0 : view.rotation}) translate(-540 -250)`}>
              {dimension === 1 && <g shuku-edit-id="e-2e348cca-2afe-47e0-bccb-125a3b657fee" className="rl-space-axes"><path d="M210 245 H830" {...axisArrow} /><Typography shuku-edit-id="e-6199c7db-89d4-4c7d-9b7f-3574a6f4dbd2" as="text" variant="body" tone="accent" x="843" y="254">参数 w₁</Typography>{[1, 2, 3, 4, 5].map(value => <Typography shuku-edit-id="e-44406598-3815-4c95-8d92-cd88234e9cae" as="text" variant="body" tone="accent" key={value} x={160 + value * 118} y="285" textAnchor="middle">{value}</Typography>)}</g>}
              {dimension === 2 && <>
                <g shuku-edit-id="e-8221df4f-8e5f-4fc4-b65c-b290575c902b" className="rl-space-guides">{[1, 2, 3, 4, 5].map(value => <g shuku-edit-id="e-dc772ccf-466d-4546-b803-15a7dd5ad980" key={value}><path shuku-edit-id="e-ab1a0eae-8935-490a-9537-e830f4f14527" d={`M${250 + value * 88} 65 V440`} /><path shuku-edit-id="e-ae039f74-34cb-4735-a7a3-332287d6db57" d={`M250 ${440 - value * 70} H735`} /></g>)}</g>
                <g shuku-edit-id="e-4656b4f9-082d-4d34-bebc-805768268334" className="rl-space-axes"><path d="M250 440 H780" {...axisArrow} /><path d="M250 440 V45" {...axisArrow} /><Typography shuku-edit-id="e-d068a64d-b1ee-4d51-870d-b0eb25cd793d" as="text" variant="body" tone="accent" x="795" y="449">参数 w₁</Typography><Typography shuku-edit-id="e-a55ad479-c981-44c4-b1c0-0303417be15a" as="text" variant="body" tone="accent" x="260" y="34">参数 w₂</Typography>{[1, 2, 3, 4, 5].map(value => <g shuku-edit-id="e-d4b4581f-9d3e-4d81-8845-e6d5007eb80d" key={value}><Typography shuku-edit-id="e-a8f47b39-d966-4410-8c5f-e2b90144ef5c" as="text" variant="body" tone="accent" x={250 + value * 88} y="473" textAnchor="middle">{value}</Typography><Typography shuku-edit-id="e-244d7291-8837-40d0-a55e-73169b4a6916" as="text" variant="body" tone="accent" x="228" y={448 - value * 70} textAnchor="end">{value}</Typography></g>)}</g>
              </>}
              {dimension === 3 && <>
                <g shuku-edit-id="e-a8a6f6e6-1fdf-458b-b80e-89045611ed10" className="rl-space-planes">{[5, 4, 3, 2, 1].map(layer => {
                  const corners = [[1, 1], [5, 1], [5, 5], [1, 5]].map(([x, y]) => position([x, y, layer], 3, view));
                  return <g shuku-edit-id="e-e96891e8-5bb9-47d0-8067-8516ff9049a3" key={layer}><polygon shuku-edit-id="e-3592e894-918e-435c-9fb2-08175f7bf343" points={corners.map(p => `${p.x},${p.y}`).join(' ')} /></g>;
                })}</g>
                <g shuku-edit-id="e-d02e0b69-8b32-4a96-9cdb-7a21237c7713" className="rl-space-axes">{[0, 1, 2].map(axis => {
                  const origin = position([.5, .5, .5], 3, view);
                  const values = [.5, .5, .5]; values[axis] = 5.8;
                  const end = position(values, 3, view);
                  return <g shuku-edit-id="e-0b9a9b38-01e7-4437-a149-1463736654e9" key={axis}><path d={`M${origin.x} ${origin.y} L${end.x} ${end.y}`} {...axisArrow} /><Typography shuku-edit-id="e-dfe93a88-9753-4271-82f3-10ab09b43543" as="text" variant="body" tone="accent" x={end.x + 10} y={end.y}>w{['₁', '₂', '₃'][axis]}</Typography></g>;
                })}</g>
              </>}
              {dimension < 3 && <g shuku-edit-id="e-975dc44a-3d92-47b8-adaf-74905c7b041b" className="rl-space-heat-cells">{projected.map(point => <rect shuku-edit-id="e-bb061d31-0bc0-474e-b3c2-d6cd71fad058" key={point.index} x={point.x - (dimension === 1 ? 59 : 44)} y={point.y - (dimension === 1 ? 26 : 35)} width={dimension === 1 ? 118 : 88} height={dimension === 1 ? 52 : 70} fill={point.index < count ? lossColor(point.loss) : '#eef1f6'} opacity={point.index < count ? .48 : .3} />)}</g>}
              <g shuku-edit-id="e-1af10e4a-bcfa-4ca7-8f1a-7c31d793c284" className="rl-space-nodes">{drawOrder.map(point => {
                const searched = point.index < count;
                const fill = searched ? lossColor(point.loss) : pendingColor;
                return <circle shuku-edit-id="e-7b9738c9-cbc3-4b39-82ff-0de88143897b" key={point.index} cx={point.x} cy={point.y} r={dimension === 3 ? 8 : 13} fill={fill} data-state={searched ? 'evaluated' : 'pending'}><title>{`参数 (${point.values.join(', ')}) · ${searched ? `示意损失 ${point.loss.toFixed(3)}` : '尚未搜索'}`}</title></circle>;
              })}</g>
              {currentPosition && <circle shuku-edit-id="e-8890c53f-3a10-4565-896f-d6bf2bf67c92" className="rl-space-current-ring" cx={currentPosition.x} cy={currentPosition.y} r={dimension === 3 ? 14 : 22} />}
              </g>
            </svg>
            <div shuku-edit-id="e-a1248bb9-a66f-4b4b-b446-bdcd52026dc2" className="rl-space-search-controls" aria-label="搜索控制">
              <div shuku-edit-id="e-5f25cf7b-b077-4ddf-8b1c-58ffb9baf514" className="rl-space-progress"><Typography shuku-edit-id="e-01d009e1-8671-46b6-b574-60e4c488944d" variant="body" tone="accent">搜索进度 <strong shuku-edit-id="e-0e259da0-85bf-4809-bcd0-16d9761769be">{count} / {total}</strong></Typography><progress shuku-edit-id="e-b7e3a9d5-a157-4df3-933a-3d800e33ea2c" value={count} max={total} aria-label="参数组合搜索进度" /></div>
              <div shuku-edit-id="e-befa42a4-abc5-4b02-a9af-c8795fdd5844" className="rl-space-actions"><Button variant="primary" disabled={finished} onClick={() => setRunning(value => !value)}>{finished ? '已完成' : running ? '暂停搜索' : count ? '继续搜索' : '开始搜索'}</Button><Button onClick={reset}>重新开始</Button></div>
            </div>
            <div shuku-edit-id="e-fb026744-b984-437d-a920-7de1db1a5e42" className="rl-space-view-tools"><Typography shuku-edit-id="e-8fa58e45-bf39-4c7e-9a48-1e3b25fc0781" variant="body" tone="muted">{dimension === 3 ? '拖动旋转 · Shift+拖动平移 · 滚轮缩放' : '拖动平移 · 滚轮缩放'}</Typography><Button aria-label="缩小视图" onClick={() => zoomBy(.8)}>−</Button><Button aria-label="放大视图" onClick={() => zoomBy(1.25)}>＋</Button><Button onClick={() => setView(initialView())}>复位视角</Button></div>
            <div shuku-edit-id="e-fbe73a2c-e2eb-45e8-9aa9-abc02b478601" className="rl-space-legend"><Typography shuku-edit-id="e-4a143c02-4df8-4cdc-944e-5b99bfb3e951" as="span" variant="body" tone="muted"><i shuku-edit-id="e-add5f95a-3cb5-46a7-b049-8b9e3641cef2" />待搜索</Typography><Typography shuku-edit-id="e-6f93a35d-80e1-43d5-8af0-db0db103b70e" as="span" variant="body" tone="muted" className="rl-space-heat-scale">损失低 <i shuku-edit-id="e-6ba82a8a-ecf3-4dea-8148-850dc59e6063" /> 损失高</Typography><Typography shuku-edit-id="e-a006173a-d37d-41c8-99f0-fc66a4a3513f" variant="body" tone="muted">{current ? `当前候选 (${current.values.join(', ')})` : '等待评估第一组参数'}</Typography></div>
          </section>
          <aside shuku-edit-id="e-f75e5b94-d3bc-412a-93ab-2a93cf13ff70" className="rl-space-controls" aria-label="候选组合数与维度关系">
            <section shuku-edit-id="e-6b779626-6571-4fba-9919-10b002d6b214" className="rl-space-combinations" aria-label="不同维度的候选组合数">
              <Typography shuku-edit-id="e-f9477aad-cbd6-4294-b1e6-0197ebf18c64" variant="body" tone="accent" className="rl-space-combinations-title">组合数随维度增长</Typography>
              <dl shuku-edit-id="e-cc070ef0-f0e6-47d6-9172-26d984690c71" className="rl-space-combination-rows">{([1, 2, 3] as const).map(value => <div shuku-edit-id="e-dabf85f8-a7ae-46fd-b52e-c7ab59c71eb6" key={value} className={dimension === value ? 'is-selected' : ''}>
                <Typography shuku-edit-id="e-dc433e17-722e-44b7-9aaa-c1329e77ce2b" as="dt" variant="body" tone="inherit">{dimensionNames[value - 1]}</Typography>
                <dd shuku-edit-id="e-6316dacf-a6bc-48e7-8006-2866aa50125c"><MathFormulaBlock appearance="plain"><MathFormulaStatic latex={`${VALUES_PER_PARAMETER}^{${value}}=${VALUES_PER_PARAMETER ** value}`} /></MathFormulaBlock></dd>
              </div>)}</dl>
              <div shuku-edit-id="e-f155e0d8-03dc-412e-9998-2236544c53e5" className="rl-space-generalization" aria-label="n个参数、每个参数取5个值，共有5的n次方个候选组合">
                <MathFormulaBlock appearance="plain" className="rl-space-growth-formula"><MathFormulaStatic latex={`${VALUES_PER_PARAMETER}^{n}`} /></MathFormulaBlock>
                <Typography shuku-edit-id="e-818e0a54-b1e1-44d2-a8da-3a4eaf136b55" variant="body" tone="accent" align="center">n 个参数的候选组合数</Typography>
                <Typography shuku-edit-id="e-2941d85a-954d-48cc-8f1e-8c69efa4ac52" variant="body" tone="accent" align="center">每多一个参数，组合数 ×{VALUES_PER_PARAMETER}</Typography>
              </div>
            </section>
          </aside>
        </div>
      </section>

    </div>
  </ContentBlock>;
}
