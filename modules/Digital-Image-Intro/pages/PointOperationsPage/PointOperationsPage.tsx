import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ContentBlock, MathFormulaBlock, MathFormulaStatic, Typography } from '../../../shared/react';
import { mapGray, type Operation } from './pointModel';
import './PointOperationsPage.css';
const photo = new URL('../../assets/digital-image-cat-scene.png', import.meta.url).href;
const WIDTH = 480, HEIGHT = 400;
const operations: [Operation, string][] = [['brighten', '变亮'], ['darken', '变暗'], ['invert', '反相'], ['threshold', '阈值']];
const bound = (x: number, max: number) => Math.max(0, Math.min(max - 1, x));
function Curve({ operation, amount, r }: { operation: Operation; amount: number; r: number }) {
 const s = mapGray(r, operation, amount), x = 66 + r / 255 * 288, y = 322 - s / 255 * 250;
 const path = operation === 'threshold' ? `M66 322H${66 + amount / 255 * 288}M${66 + amount / 255 * 288} 72H354` : Array.from({ length: 256 }, (_, value) => `${value ? 'L' : 'M'}${66 + value / 255 * 288} ${322 - mapGray(value, operation, amount) / 255 * 250}`).join(' ');
 const label = (left: number, top: number, width: number, text: string, accent = false) => <foreignObject x={left} y={top} width={width} height={42}><Typography variant="bodySmall" tone={accent ? 'accent' : 'main'} align="center">{text}</Typography></foreignObject>;
 return <svg viewBox="0 0 420 390" className="di-point__curve" role="img" aria-label={`灰度映射，输入 ${r}，输出 ${s}`}>
  <defs><marker id="di-point-axis-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L10 5L0 10z" fill="#18334f" /></marker></defs>
  <path d="M66 322V46M66 322H382" fill="none" stroke="#18334f" strokeWidth="2" markerEnd="url(#di-point-axis-arrow)" /><path d="M66 72V46" stroke="#18334f" strokeWidth="2" markerEnd="url(#di-point-axis-arrow)" />
  <path d="M66 72H354V322" stroke="#edf2f7" fill="none" />
  <path d={path} stroke="#2884ff" fill="none" strokeWidth="3" />
  {operation === 'threshold' && <path d={`M${66 + amount / 255 * 288} 322V72`} stroke="#7cafec" strokeDasharray="5 4" />}
  <path d={`M66 ${y}H${x}V322`} stroke="#2582ff" strokeWidth="1.5" strokeDasharray="6 5" fill="none" /><circle cx={x} cy={y} r="9" fill="#147fff" stroke="white" strokeWidth="3" />
  {label(12, 49, 50, '255')}{label(14, 300, 43, '0')}{label(42, 326, 45, '0')}{label(329, 326, 55, '255')}{label(42, 6, 45, 's')}{label(377, 303, 35, 'r')}
  {r > 12 && r < 238 && label(x - 29, 326, 58, String(r), true)}{s > 15 && s < 240 && label(7, y - 20, 55, String(s), true)}
 </svg>;
}
export function PointOperationsPage() {
 const [operation, setOperation] = useState<Operation>('invert'), [amount, setAmount] = useState(45), [threshold, setThreshold] = useState(128);
 const [source, setSource] = useState<Uint8ClampedArray>(), [selected, setSelected] = useState({ x: 210, y: 230 }), [failed, setFailed] = useState(false);
 const original = useRef<HTMLCanvasElement>(null), result = useRef<HTMLCanvasElement>(null), flow = useRef<HTMLDivElement>(null);
 const [links, setLinks] = useState<string[]>([]);
 const parameter = operation === 'threshold' ? threshold : amount;
 const offset = (selected.y * WIDTH + selected.x) * 4, r = source?.[offset] ?? 0, s = mapGray(r, operation, parameter);
 useEffect(() => {
  let active = true; const image = new Image();
  image.onload = () => {
   if (!active) return;
   const c = document.createElement('canvas'); c.width = WIDTH; c.height = HEIGHT; const ctx = c.getContext('2d')!;
   ctx.drawImage(image, image.width * .2, image.height * .18, image.width * .6, image.width * .5, 0, 0, WIDTH, HEIGHT);
   const pixels = ctx.getImageData(0, 0, WIDTH, HEIGHT).data;
   for (let i = 0; i < pixels.length; i += 4) { const gray = Math.round(.299 * pixels[i] + .587 * pixels[i + 1] + .114 * pixels[i + 2]); pixels.set([gray, gray, gray], i); }
   setSource(pixels);
   // Pick a real 72-valued fur pixel near the face to match the opening example.
   let found = false;
   for (let radius = 0; radius < 50 && !found; radius++) for (let y = 230 - radius; y <= 230 + radius && !found; y++) for (let x = 210 - radius; x <= 210 + radius; x++) if (pixels[(y * WIDTH + x) * 4] === 72) { setSelected({ x, y }); found = true; break; }
  };
  image.onerror = () => { if (active) setFailed(true); }; image.src = photo;
  return () => { active = false; };
 }, []);
 useEffect(() => {
  if (!source) return;
  const before = original.current?.getContext('2d'), after = result.current?.getContext('2d'); if (!before || !after) return;
  const a = before.createImageData(WIDTH, HEIGHT); a.data.set(source); before.putImageData(a, 0, 0);
  const b = after.createImageData(WIDTH, HEIGHT); b.data.set(source);
  for (let i = 0; i < b.data.length; i += 4) { const value = mapGray(source[i], operation, parameter); b.data.set([value, value, value], i); }
  after.putImageData(b, 0, 0);
 }, [source, operation, parameter]);
 useLayoutEffect(() => {
  const container = flow.current; if (!container) return;
  const update = () => {
   const b = container.getBoundingClientRect(), first = container.querySelector('.di-point__original .di-point__picker i')?.getBoundingClientRect(), last = container.querySelector('.di-point__result .di-point__picker i')?.getBoundingClientRect(), middle = container.querySelector('.di-point__mapping')?.getBoundingClientRect();
   if (!first || !last || !middle || !b.width) return;
   const sx = container.clientWidth / b.width, sy = container.clientHeight / b.height, y = (first.top + first.height / 2 - b.top) * sy;
   setLinks([`M${(first.right - b.left) * sx} ${y}H${(middle.left - b.left) * sx}`, `M${(middle.right - b.left) * sx} ${y}H${(last.left - b.left) * sx}`]);
  };
  const observer = new ResizeObserver(update); observer.observe(container); update(); return () => observer.disconnect();
 }, [selected]);
 const choose = (x: number, y: number) => setSelected({ x: bound(x, WIDTH), y: bound(y, HEIGHT) });
 const image = (isResult: boolean) => <section className={`di-point__image-card ${isResult ? 'di-point__result' : 'di-point__original'}`}><Typography as="h2" className="di-point__heading" variant="h3" tone="accent" align="center">{isResult ? '结果图' : '原图'}</Typography><div className="di-point__photo"><canvas ref={isResult ? result : original} width={WIDTH} height={HEIGHT} role="img" aria-label={isResult ? '点运算后的图像' : '原始灰度图像'} /><button className="di-point__picker" type="button" aria-label={`${isResult ? '结果图' : '原图'}，点击或用方向键选择像素`} onPointerDown={e => { const b = e.currentTarget.getBoundingClientRect(); choose(Math.floor((e.clientX - b.left) / b.width * WIDTH), Math.floor((e.clientY - b.top) / b.height * HEIGHT)); }} onKeyDown={e => { const deltas: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }; if (deltas[e.key]) { e.preventDefault(); choose(selected.x + deltas[e.key][0], selected.y + deltas[e.key][1]); } }}><i style={{ left: `${selected.x / WIDTH * 100}%`, top: `${selected.y / HEIGHT * 100}%` }} /></button></div><div className="di-point__pixel-value" aria-live="polite"><Typography variant="body" tone="accent">{isResult ? 's' : 'r'} = {source ? isResult ? s : r : '—'}</Typography></div></section>;
 const equation = operation === 'invert' ? 's=255-r' : operation === 'threshold' ? `s=\begin{cases}255&r\geq ${threshold}\\0&r<${threshold}\end{cases}` : `s=\operatorname{clip}(r${operation === 'brighten' ? '+' : '-'}${amount},0,255)`;
 return <ContentBlock className="di-point" title="点运算" subtitle="每个像素独立映射：输入灰度 r，得到输出灰度 s。" headingLevel={1}><div className="di-point__body"><div className="di-point__tabs" role="group" aria-label="选择点运算">{operations.map(([id, title]) => <button type="button" key={id} className={operation === id ? 'is-selected' : ''} aria-pressed={operation === id} onClick={() => setOperation(id)}><Typography variant="body" tone="inherit">{title}</Typography></button>)}</div><div className="di-point__flow" ref={flow}>{image(false)}<section className="di-point__mapping"><Typography as="h2" className="di-point__heading" variant="h3" tone="accent" align="center">灰度映射</Typography><div className="di-point__chart"><div className="di-point__formula"><MathFormulaBlock appearance="plain"><MathFormulaStatic latex="s=T(r)" /></MathFormulaBlock></div><Curve operation={operation} amount={parameter} r={r} /><div className="di-point__mapping-readout" aria-live="polite"><Typography variant="bodySmall" tone="accent">r = {source ? r : '—'}</Typography><Typography variant="bodySmall" tone="muted">↓</Typography><Typography variant="bodySmall" tone="accent">s = {source ? s : '—'}</Typography></div></div><div className="di-point__parameter">{operation === 'invert' ? <MathFormulaBlock appearance="plain"><MathFormulaStatic latex={equation} /></MathFormulaBlock> : <><label><Typography as="span" variant="bodySmall" tone="accent">{operation === 'threshold' ? '阈值 T' : '变化量'}：{parameter}</Typography><input type="range" min={0} max={operation === 'threshold' ? 255 : 120} step={1} value={parameter} aria-label={operation === 'threshold' ? '阈值' : '亮度变化量'} onChange={e => operation === 'threshold' ? setThreshold(Number(e.target.value)) : setAmount(Number(e.target.value))} /></label><Typography variant="bodySmall" tone="muted">{operation === 'threshold' ? `r ≥ ${threshold} → 255，否则为 0` : `s = r ${operation === 'brighten' ? '+' : '−'} ${amount}，裁剪到 0～255`}</Typography></>}</div></section>{image(true)}<svg className="di-point__links" width="100%" height="100%" aria-hidden="true">{links.map((d, i) => <path key={i} d={d} stroke="#3b99ff" strokeWidth="2" strokeDasharray="7 5" fill="none" />)}</svg><Typography className="di-point__arrow di-point__arrow--left" variant="h2" tone="accent" aria-hidden="true">→</Typography><Typography className="di-point__arrow di-point__arrow--right" variant="h2" tone="accent" aria-hidden="true">→</Typography></div><footer className="di-point__takeaway"><Typography as="h2" variant="h3" tone="accent" align="center">点运算只看当前像素的值，不看邻域。</Typography><Typography variant="bodySmall" tone="muted" align="center">亮度、反相、阈值化，都可以理解为对每个像素分别应用同样的数值映射。</Typography></footer>{failed && <Typography variant="bodySmall" tone="danger" role="alert">猫咪图像加载失败，请刷新重试。</Typography>}</div></ContentBlock>;
}
