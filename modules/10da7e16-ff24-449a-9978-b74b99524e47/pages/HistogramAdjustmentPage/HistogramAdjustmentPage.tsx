import moduleAssetOutline from '../../outlines.json';
import { moduleAssetUrl } from "@shuku/course-runtime/react/assets";
import { useEffect, useMemo, useRef, useState, type PointerEvent } from 'react';
import { ContentBlock, Typography } from "@shuku/course-style/react";
import { clamp, curveValue, histogram, presetPoints, type Point, type Preset } from './curveModel';
import './HistogramAdjustmentPage.css';
const photo = moduleAssetUrl("images/digital-image-cat-scene.webp");
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
  const text = (x: number, y: number, width: number, value: string, align: 'center' | 'end' = 'center') => <foreignObject shuku-edit-id="e-53558e70-1e71-4d8e-a17d-1036878a7d05" x={x} y={y} width={width} height={40}><Typography shuku-edit-id="e-c8563ff8-9746-4a1c-85da-64e8153f0a00" variant="bodySmall" tone="muted" align={align}>{value}</Typography></foreignObject>;
  const change = (value: number) => lookup[value] - value > 1 ? '提亮' : lookup[value] - value < -1 ? '压暗' : '基本不变';
  return <ContentBlock shuku-edit-id="e-ab460e12-66eb-471c-a218-38052e72b180" className="di-curves" title="直方图与图像调节" subtitle="把直方图和映射曲线放在一起，观察灰度分布与图像怎样同步变化。" headingLevel={1}>
    <div shuku-edit-id="e-f6bb836e-8cfa-4ba6-b934-4d335134800a" className="di-curves__body" data-ready={!!source}>
      <div shuku-edit-id="e-a777a94b-028c-4766-9317-5e407f2834db" className="di-curves__main">
        <div shuku-edit-id="e-4a342bc1-791d-4a8a-aed6-2a7eed4ff251" className="di-curves__compare" ref={compare} onPointerDown={e => { splitDragging.current = true; e.currentTarget.setPointerCapture(e.pointerId); moveSplit(e); }} onPointerMove={moveSplit} onPointerUp={e => { splitDragging.current = false; if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId); }} onPointerCancel={() => { splitDragging.current = false; }}>
          <canvas shuku-edit-id="e-3ccfa980-6433-4b27-856e-828f51f15bac" ref={after} width={WIDTH} height={HEIGHT} aria-label="实时曲线调整结果图像" />
          <canvas shuku-edit-id="e-46f73199-d840-40bd-a46e-4c2d4a6d398b" className="di-curves__before" ref={before} width={WIDTH} height={HEIGHT} style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }} aria-label="对比用原始灰度图像" />
          <div shuku-edit-id="e-947ae83b-b1e7-4e7c-bc24-9f97f2ce504f" className="di-curves__image-label di-curves__image-label--before"><Typography shuku-edit-id="e-2b19aebe-9d4a-4a4c-90a6-a31ab38f51a9" variant="bodySmall" tone="inherit">原图</Typography></div><div shuku-edit-id="e-03e8971f-0c3b-4e63-95dd-1e19ab824dcf" className="di-curves__image-label di-curves__image-label--after"><Typography shuku-edit-id="e-c34b1d5a-b617-498e-8670-3f4e0dbf5998" variant="bodySmall" tone="inherit">调节结果</Typography></div>
          <div shuku-edit-id="e-52b82b08-c4c4-4796-94d9-8f3dbbbd8792" className="di-curves__divider" style={{ left: `${split}%` }}><div shuku-edit-id="e-dfa46d61-4a4e-4747-a598-13bdf6a1cbd4" role="slider" tabIndex={0} aria-label="原图与结果对比分隔线" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(split)} onKeyDown={e => { const delta = e.key === 'ArrowLeft' ? -2 : e.key === 'ArrowRight' ? 2 : 0; if (delta || e.key === 'Home' || e.key === 'End') { e.preventDefault(); setSplit(e.key === 'Home' ? 0 : e.key === 'End' ? 100 : clamp(split + delta, 0, 100)); } }}><Typography shuku-edit-id="e-e5d6fc09-daac-47d9-8132-fe92e8ea39cd" variant="bodySmall" tone="accent">‹ ›</Typography></div></div>
        </div>
        <section shuku-edit-id="e-cabaf957-ab7c-449a-9e4f-4062ec7ad3b2" className="di-curves__tool"><div shuku-edit-id="e-d515c25a-68c7-4138-95fa-3a4fc8e88086" className="di-curves__tool-heading"><Typography shuku-edit-id="e-88e3c89a-6cc1-4e70-a1b3-cb825bb50fc3" as="h2" variant="h3" tone="accent">曲线工具</Typography><Typography shuku-edit-id="e-33256084-b084-4fb2-b561-07110c7ee843" variant="bodySmall" tone="muted">输入 {points[selected].x} → 输出 {points[selected].y}</Typography></div>
          <div shuku-edit-id="e-9c63c928-306c-4469-a70a-ec46ff5e690b" className="di-curves__legend"><Typography shuku-edit-id="e-6af21c93-34ef-412b-870b-97768c0a9855" variant="bodySmall" tone="muted"><i shuku-edit-id="e-18a52856-560b-4cc2-a887-43240acc73ae" />原图分布</Typography><button shuku-edit-id="e-83b01e46-2d3e-438e-979a-6b6c406f09d2" type="button" aria-pressed={showResultHistogram} onClick={() => setShowResultHistogram(v => !v)}><Typography shuku-edit-id="e-bf7e4d79-1890-43b7-a835-500db236650a" variant="bodySmall" tone="accent"><i shuku-edit-id="e-e706848f-88ef-4377-bf46-3bdf9185ad05" />{showResultHistogram ? '结果分布 ✓' : '显示结果分布'}</Typography></button></div>
          <svg shuku-edit-id="e-5154a144-df53-4847-8a77-7c5d3c1e0665" className="di-curves__graph" viewBox={`0 0 ${GW} ${GH}`} preserveAspectRatio="none" role="img" aria-label="可拖动的灰度映射曲线，灰色与蓝色柱形分别为原图与结果的灰度分布">
            <title>直方图共用像素计数尺度并缩放到绘图区；坐标轴数值用于读取映射曲线的输入与输出灰度。</title>
            {[0, 64, 128, 192, 255].map(value => <g shuku-edit-id="e-f07ce56a-c3b6-49b1-8969-48efaf703eaa" key={value}><path shuku-edit-id="e-8ef2505c-7234-468b-8db9-d079ea85e02a" d={`M${GRAPH.x} ${GRAPH.y + GRAPH.height - value / 255 * GRAPH.height}H${GRAPH.x + GRAPH.width}M${GRAPH.x + value / 255 * GRAPH.width} ${GRAPH.y}V${GRAPH.y + GRAPH.height}`} fill="none" stroke="#dbe5ef" strokeDasharray="4 4" />{text(GRAPH.x - 58, GRAPH.y + GRAPH.height - value / 255 * GRAPH.height - 18, 48, String(value), 'end')}{text(GRAPH.x + value / 255 * GRAPH.width - 26, GRAPH.y + GRAPH.height + 2, 52, String(value))}</g>)}
            {inputHistogram.map((count, value) => <rect shuku-edit-id="e-90e5f30a-f9bc-47a5-82d1-080979537aaf" key={value} className="di-curves__input-bin" data-gray={value} data-count={count} x={GRAPH.x + value / 256 * GRAPH.width} y={GRAPH.y + GRAPH.height - count / histMax * GRAPH.height * .8} width={GRAPH.width / 256} height={count / histMax * GRAPH.height * .8} fill="#8f9cab" opacity=".42" />)}
            {showResultHistogram && outputHistogram.map((count, value) => <rect shuku-edit-id="e-fcf0e3eb-30ef-4dbb-bf5a-4a5036414bc8" key={value} className="di-curves__output-bin" data-gray={value} data-count={count} x={GRAPH.x + value / 256 * GRAPH.width} y={GRAPH.y + GRAPH.height - count / histMax * GRAPH.height * .8} width={GRAPH.width / 256} height={count / histMax * GRAPH.height * .8} fill="#2587fa" opacity=".33" />)}
            <path shuku-edit-id="e-83a0d0b1-dce8-4bed-a4d5-7ceb5c9b285d" d={`M${GRAPH.x} ${GRAPH.y}V${GRAPH.y + GRAPH.height}H${GRAPH.x + GRAPH.width}`} fill="none" stroke="#38536e" strokeWidth="2" />
            <path shuku-edit-id="e-1b1332a3-f1e7-4fc2-83ef-9f244d42893a" d={`M${GRAPH.x} ${GRAPH.y + GRAPH.height}L${GRAPH.x + GRAPH.width} ${GRAPH.y}`} fill="none" stroke="#8a9db3" strokeDasharray="6 5" />
            <path shuku-edit-id="e-18c7aad4-cee3-47e1-8729-f605aa2e014f" d={path} className="di-curves__mapping" fill="none" stroke="#163959" strokeWidth="3" />
            {points.map((point, i) => <circle shuku-edit-id="e-e57b379f-96ef-40c7-be81-d9095b5dd652" key={i} className="di-curves__point" data-x={point.x} data-y={point.y} cx={GRAPH.x + point.x / 255 * GRAPH.width} cy={GRAPH.y + GRAPH.height - point.y / 255 * GRAPH.height} r={selected === i ? 9 : 7} fill="white" stroke={selected === i ? '#167bfa' : '#163959'} strokeWidth="2.5" role="button" tabIndex={0} aria-label={`控制点 ${i + 1}，输入 ${point.x}，输出 ${point.y}`} onPointerDown={e => { e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); setSelected(i); }} onPointerMove={e => dragPoint(e, i)} onPointerUp={e => { if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId); }} onKeyDown={e => { const delta = ({ ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] } as Record<string, number[]>)[e.key]; if (delta) { e.preventDefault(); updatePoint(i, point.x + delta[0], point.y + delta[1]); } }} />)}
            {text(GRAPH.x + 10, 0, 150, '暗部')}{text(GRAPH.x + 210, 0, 150, '中间调')}{text(GRAPH.x + 410, 0, 150, '亮部')}
            {text(GRAPH.x + GRAPH.width / 2 - 90, GRAPH.y + GRAPH.height + 36, 180, '输入灰度 r')}
            <foreignObject shuku-edit-id="e-46d743ba-412f-41be-88c5-a5a1714c1f8a" x={1} y={GRAPH.y + 115} width={40} height={150}><Typography shuku-edit-id="e-705d7769-b892-4f79-87f7-b0571bee9ba1" className="di-curves__y-label" variant="bodySmall" tone="muted">输出灰度 s</Typography></foreignObject>
          </svg>
          <div shuku-edit-id="e-f05c0427-d69e-44f3-a920-48c966d30ac9" className="di-curves__presets">{presets.map(([id, label]) => <button shuku-edit-id="e-2a34db9e-25d4-4d61-9090-fa89b26283f7" key={id} type="button" className={activePreset === id ? 'is-selected' : ''} onClick={() => { setPoints(presetPoints(id)); setActivePreset(id); setSelected(2); }}><Typography shuku-edit-id="e-81786432-f679-4770-8d45-3b3b22be42f0" variant="bodySmall" tone="inherit">{label}</Typography></button>)}</div>
        </section>
      </div>
      <footer shuku-edit-id="e-d8ac7d61-2ed0-429c-ade1-5aa11004f53b" className="di-curves__takeaway"><Typography shuku-edit-id="e-d1e0bcc5-9bb6-4f68-95f3-9075306d3c1c" variant="body" tone="accent">{failed ? '图像加载失败，请刷新重试。' : `当前示例：暗部${change(64)}，中间调${change(128)}，亮部${change(192)}。`}</Typography><Typography shuku-edit-id="e-4e496f7a-a07b-49d7-b8cd-45b34f4541e2" variant="bodySmall" tone="muted">拖动控制点：向上提亮，向下压暗；拖动图片分隔线，对比调节前后。</Typography></footer>
    </div>
  </ContentBlock>;
}
