import moduleAssetOutline from '../../outlines.json';
import { moduleAssetUrl } from '../../../shared/react/assets';
import { useEffect, useMemo, useRef, useState, type PointerEvent } from 'react';
import { ContentBlock, Typography } from '../../../shared/react';
import { clamp, curveValue, histogram, presetPoints, type Point, type Preset } from './curveModel';
import './HistogramAdjustmentPage.css';
const photo = moduleAssetUrl(moduleAssetOutline.moduleIdentity.id, 'images/digital-image-cat-scene.jpg');
const WIDTH = 600, HEIGHT = 480;
const GRAPH = { x: 110, y: 54, width: 532, height: 345 }, GW = 700, GH = 480;
const presets: [Preset, string][] = [['shadows', '提亮暗部'], ['contrast', '增强对比'], ['highlights', '压暗亮部'], ['invert', '反相'], ['identity', '重置']];
function paint(canvas: HTMLCanvasElement | null, pixels: Uint8Array) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d')!, data = ctx.createImageData(WIDTH, HEIGHT);
  pixels.forEach((value, i) => data.data.set([value, value, value, 255], i * 4)); ctx.putImageData(data, 0, 0);
}
export function HistogramAdjustmentPage() {
  const [source, setSource] = useState<Uint8Array>(), [failed, setFailed] = useState(false);
  const [points, setPoints] = useState<Point[]>(presetPoints('contrast')), [activePreset, setActivePreset] = useState<Preset | undefined>('contrast');
  const [selected, setSelected] = useState(2), [split, setSplit] = useState(50), [showResultHistogram, setShowResultHistogram] = useState(true);
  const before = useRef<HTMLCanvasElement>(null), after = useRef<HTMLCanvasElement>(null), compare = useRef<HTMLDivElement>(null), splitDragging = useRef(false);
  useEffect(() => {
    let active = true; const image = new Image(); image.crossOrigin = 'anonymous';
    image.onload = () => {
      if (!active) return;
      const canvas = document.createElement('canvas'); canvas.width = WIDTH; canvas.height = HEIGHT; const ctx = canvas.getContext('2d')!;
      const cropWidth = image.width * .75;
      ctx.drawImage(image, image.width * .13, image.height * .18, cropWidth, cropWidth * HEIGHT / WIDTH, 0, 0, WIDTH, HEIGHT);
      const data = ctx.getImageData(0, 0, WIDTH, HEIGHT).data;
      setSource(Uint8Array.from({ length: WIDTH * HEIGHT }, (_, i) => Math.round(.299 * data[i * 4] + .587 * data[i * 4 + 1] + .114 * data[i * 4 + 2])));
    };
    image.onerror = () => { if (active) setFailed(true); }; image.src = photo;
    return () => { active = false; };
  }, []);
  const inputHistogram = useMemo(() => source ? histogram(source) : Array(256).fill(0), [source]);
  const lookup = useMemo(() => Array.from({ length: 256 }, (_, value) => Math.round(curveValue(points, value))), [points]);
  const output = useMemo(() => source?.map(value => lookup[value]), [source, lookup]);
  const outputHistogram = useMemo(() => output ? histogram(output) : Array(256).fill(0), [output]);
  useEffect(() => { if (source) paint(before.current, source); }, [source]);
  useEffect(() => { if (output) paint(after.current, output); }, [output]);
  const histMax = Math.max(1, ...inputHistogram, ...outputHistogram);
  const path = Array.from({ length: 256 }, (_, value) => `${value ? 'L' : 'M'}${GRAPH.x + value / 255 * GRAPH.width} ${GRAPH.y + GRAPH.height - curveValue(points, value) / 255 * GRAPH.height}`).join(' ');
  const updatePoint = (index: number, x: number, y: number) => {
    setActivePreset(undefined); setSelected(index);
    setPoints(previous => previous.map((point, i) => i !== index ? point : { x: index === 0 ? 0 : index === previous.length - 1 ? 255 : Math.round(clamp(x, previous[index - 1].x + 6, previous[index + 1].x - 6)), y: Math.round(clamp(y)) }));
  };
  const dragPoint = (e: PointerEvent<SVGCircleElement>, index: number) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
    const box = e.currentTarget.ownerSVGElement!.getBoundingClientRect();
    updatePoint(index, ((e.clientX - box.left) / box.width * GW - GRAPH.x) / GRAPH.width * 255, (GRAPH.y + GRAPH.height - (e.clientY - box.top) / box.height * GH) / GRAPH.height * 255);
  };
  const moveSplit = (e: PointerEvent<HTMLDivElement>) => {
    if (!splitDragging.current || !compare.current) return;
    const box = compare.current.getBoundingClientRect(); setSplit(clamp((e.clientX - box.left) / box.width * 100, 0, 100));
  };
  const text = (x: number, y: number, width: number, value: string, align: 'center' | 'end' = 'center') => <foreignObject x={x} y={y} width={width} height={40}><Typography variant="bodySmall" tone="muted" align={align}>{value}</Typography></foreignObject>;
  const change = (value: number) => lookup[value] - value > 1 ? '提亮' : lookup[value] - value < -1 ? '压暗' : '基本不变';
  return <ContentBlock className="di-curves" title="直方图与图像调节" subtitle="把直方图和映射曲线放在一起，观察灰度分布与图像怎样同步变化。" headingLevel={1}>
    <div className="di-curves__body" data-ready={!!source}>
      <div className="di-curves__main">
        <div className="di-curves__compare" ref={compare} onPointerDown={e => { splitDragging.current = true; e.currentTarget.setPointerCapture(e.pointerId); moveSplit(e); }} onPointerMove={moveSplit} onPointerUp={e => { splitDragging.current = false; if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId); }} onPointerCancel={() => { splitDragging.current = false; }}>
          <canvas ref={after} width={WIDTH} height={HEIGHT} aria-label="实时曲线调整结果图像" />
          <canvas className="di-curves__before" ref={before} width={WIDTH} height={HEIGHT} style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }} aria-label="对比用原始灰度图像" />
          <div className="di-curves__image-label di-curves__image-label--before"><Typography variant="bodySmall" tone="inherit">原图</Typography></div><div className="di-curves__image-label di-curves__image-label--after"><Typography variant="bodySmall" tone="inherit">调节结果</Typography></div>
          <div className="di-curves__divider" style={{ left: `${split}%` }}><div role="slider" tabIndex={0} aria-label="原图与结果对比分隔线" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(split)} onKeyDown={e => { const delta = e.key === 'ArrowLeft' ? -2 : e.key === 'ArrowRight' ? 2 : 0; if (delta || e.key === 'Home' || e.key === 'End') { e.preventDefault(); setSplit(e.key === 'Home' ? 0 : e.key === 'End' ? 100 : clamp(split + delta, 0, 100)); } }}><Typography variant="bodySmall" tone="accent">‹ ›</Typography></div></div>
        </div>
        <section className="di-curves__tool"><div className="di-curves__tool-heading"><Typography as="h2" variant="h3" tone="accent">曲线工具</Typography><Typography variant="bodySmall" tone="muted">输入 {points[selected].x} → 输出 {points[selected].y}</Typography></div>
          <div className="di-curves__legend"><Typography variant="bodySmall" tone="muted"><i />原图分布</Typography><button type="button" aria-pressed={showResultHistogram} onClick={() => setShowResultHistogram(v => !v)}><Typography variant="bodySmall" tone="accent"><i />{showResultHistogram ? '结果分布 ✓' : '显示结果分布'}</Typography></button></div>
          <svg className="di-curves__graph" viewBox={`0 0 ${GW} ${GH}`} preserveAspectRatio="none" role="img" aria-label="可拖动的灰度映射曲线，灰色与蓝色柱形分别为原图与结果的灰度分布">
            <title>直方图共用像素计数尺度并缩放到绘图区；坐标轴数值用于读取映射曲线的输入与输出灰度。</title>
            {[0, 64, 128, 192, 255].map(value => <g key={value}><path d={`M${GRAPH.x} ${GRAPH.y + GRAPH.height - value / 255 * GRAPH.height}H${GRAPH.x + GRAPH.width}M${GRAPH.x + value / 255 * GRAPH.width} ${GRAPH.y}V${GRAPH.y + GRAPH.height}`} fill="none" stroke="#dbe5ef" strokeDasharray="4 4" />{text(GRAPH.x - 58, GRAPH.y + GRAPH.height - value / 255 * GRAPH.height - 18, 48, String(value), 'end')}{text(GRAPH.x + value / 255 * GRAPH.width - 26, GRAPH.y + GRAPH.height + 2, 52, String(value))}</g>)}
            {inputHistogram.map((count, value) => <rect key={value} className="di-curves__input-bin" data-gray={value} data-count={count} x={GRAPH.x + value / 256 * GRAPH.width} y={GRAPH.y + GRAPH.height - count / histMax * GRAPH.height * .8} width={GRAPH.width / 256} height={count / histMax * GRAPH.height * .8} fill="#8f9cab" opacity=".42" />)}
            {showResultHistogram && outputHistogram.map((count, value) => <rect key={value} className="di-curves__output-bin" data-gray={value} data-count={count} x={GRAPH.x + value / 256 * GRAPH.width} y={GRAPH.y + GRAPH.height - count / histMax * GRAPH.height * .8} width={GRAPH.width / 256} height={count / histMax * GRAPH.height * .8} fill="#2587fa" opacity=".33" />)}
            <path d={`M${GRAPH.x} ${GRAPH.y}V${GRAPH.y + GRAPH.height}H${GRAPH.x + GRAPH.width}`} fill="none" stroke="#38536e" strokeWidth="2" />
            <path d={`M${GRAPH.x} ${GRAPH.y + GRAPH.height}L${GRAPH.x + GRAPH.width} ${GRAPH.y}`} fill="none" stroke="#8a9db3" strokeDasharray="6 5" />
            <path d={path} className="di-curves__mapping" fill="none" stroke="#163959" strokeWidth="3" />
            {points.map((point, i) => <circle key={i} className="di-curves__point" data-x={point.x} data-y={point.y} cx={GRAPH.x + point.x / 255 * GRAPH.width} cy={GRAPH.y + GRAPH.height - point.y / 255 * GRAPH.height} r={selected === i ? 9 : 7} fill="white" stroke={selected === i ? '#167bfa' : '#163959'} strokeWidth="2.5" role="button" tabIndex={0} aria-label={`控制点 ${i + 1}，输入 ${point.x}，输出 ${point.y}`} onPointerDown={e => { e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); setSelected(i); }} onPointerMove={e => dragPoint(e, i)} onPointerUp={e => { if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId); }} onKeyDown={e => { const delta = ({ ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] } as Record<string, number[]>)[e.key]; if (delta) { e.preventDefault(); updatePoint(i, point.x + delta[0], point.y + delta[1]); } }} />)}
            {text(GRAPH.x + 10, 0, 150, '暗部')}{text(GRAPH.x + 210, 0, 150, '中间调')}{text(GRAPH.x + 410, 0, 150, '亮部')}
            {text(GRAPH.x + GRAPH.width / 2 - 90, GRAPH.y + GRAPH.height + 36, 180, '输入灰度 r')}
            <foreignObject x={1} y={GRAPH.y + 115} width={40} height={150}><Typography className="di-curves__y-label" variant="bodySmall" tone="muted">输出灰度 s</Typography></foreignObject>
          </svg>
          <div className="di-curves__presets">{presets.map(([id, label]) => <button key={id} type="button" className={activePreset === id ? 'is-selected' : ''} onClick={() => { setPoints(presetPoints(id)); setActivePreset(id); setSelected(2); }}><Typography variant="bodySmall" tone="inherit">{label}</Typography></button>)}</div>
        </section>
      </div>
      <footer className="di-curves__takeaway"><Typography variant="body" tone="accent">{failed ? '图像加载失败，请刷新重试。' : `当前示例：暗部${change(64)}，中间调${change(128)}，亮部${change(192)}。`}</Typography><Typography variant="bodySmall" tone="muted">拖动控制点：向上提亮，向下压暗；拖动图片分隔线，对比调节前后。</Typography></footer>
    </div>
  </ContentBlock>;
}
