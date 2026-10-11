import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ContentBlock, Typography } from '../../../shared/react';
import './ImageMemoryPage.css';

const photo = new URL('../../assets/digital-image-cat-scene.png', import.meta.url).href;
const WIDTH = 600, HEIGHT = 450, COLS = 6, ROWS = 4;
const clamp = (v: number, max: number) => Math.max(0, Math.min(max - 1, v));
type Point = { x: number; y: number };
export function ImageMemoryPage() {
  const [pixels, setPixels] = useState<Uint8ClampedArray>();
  const [color, setColor] = useState(false);
  const [channel, setChannel] = useState(0);
  const [point, setPoint] = useState<Point>({ x: 326, y: 125 });
  const [failed, setFailed] = useState(false);
  const imageCanvas = useRef<HTMLCanvasElement>(null), zoomCanvas = useRef<HTMLCanvasElement>(null), visual = useRef<HTMLDivElement>(null);
  const [links, setLinks] = useState<string[]>([]);
  const left = Math.max(0, Math.min(WIDTH - COLS, point.x - 2)), top = Math.max(0, Math.min(HEIGHT - ROWS, point.y - 1));
  const rgb = (x: number, y: number) => pixels ? Array.from(pixels.slice((y * WIDTH + x) * 4, (y * WIDTH + x) * 4 + 3)) : [];
  const gray = (values: number[]) => Math.round(.299 * values[0] + .587 * values[1] + .114 * values[2]);
  const selectedRgb = rgb(point.x, point.y);
  useEffect(() => {
    let active = true; const image = new Image();
    image.onload = () => {
      if (!active) return;
      const canvas = document.createElement('canvas'); canvas.width = WIDTH; canvas.height = HEIGHT;
      const ctx = canvas.getContext('2d')!; ctx.drawImage(image, 0, image.height * .22, image.width, image.width * .75, 0, 0, WIDTH, HEIGHT);
      setPixels(ctx.getImageData(0, 0, WIDTH, HEIGHT).data);
    };
    image.onerror = () => { if (active) setFailed(true); }; image.src = photo;
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (!pixels) return;
    const context = imageCanvas.current?.getContext('2d'), zoom = zoomCanvas.current?.getContext('2d');
    if (!context || !zoom) return;
    const image = context.createImageData(WIDTH, HEIGHT); image.data.set(pixels);
    if (!color) for (let i = 0; i < image.data.length; i += 4) { const g = Math.round(.299 * pixels[i] + .587 * pixels[i + 1] + .114 * pixels[i + 2]); image.data.set([g, g, g], i); }
    context.putImageData(image, 0, 0);
    const neighborhood = zoom.createImageData(COLS, ROWS);
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) { const index = ((top + y) * WIDTH + left + x) * 4; neighborhood.data.set(image.data.slice(index, index + 4), (y * COLS + x) * 4); }
    zoom.putImageData(neighborhood, 0, 0);
  }, [pixels, color, left, top]);
  useLayoutEffect(() => {
    const container = visual.current;
    if (!container) return;
    const update = () => {
      const b = container.getBoundingClientRect(), source = container.querySelector('.di-memory__picker i')?.getBoundingClientRect(), target = container.querySelector('.di-memory__zoom')?.getBoundingClientRect();
      if (!source || !target || !b.width) return;
      const sx = container.clientWidth / b.width, sy = container.clientHeight / b.height;
      setLinks([`M${(source.right - b.left) * sx} ${(source.top - b.top) * sy}L${(target.left - b.left) * sx} ${(target.top - b.top) * sy}`, `M${(source.right - b.left) * sx} ${(source.bottom - b.top) * sy}L${(target.left - b.left) * sx} ${(target.bottom - b.top) * sy}`]);
    };
    const observer = new ResizeObserver(update); observer.observe(container); update();
    return () => observer.disconnect();
  }, [point, pixels]);
  const choose = (x: number, y: number) => setPoint({ x: clamp(x, WIDTH), y: clamp(y, HEIGHT) });
  return <ContentBlock className="di-memory" title="数字图像怎样存在内存里" subtitle="一张图像可以看作一个三维数组，大小是 H × W × C。" headingLevel={1}><div className="di-memory__body"><div className="di-memory__panels">
    <section className="di-memory__scene"><div className="di-memory__modes" role="group" aria-label="图像表示类型">{[false, true].map(value => <button type="button" key={String(value)} className={color === value ? 'is-selected' : ''} aria-pressed={color === value} onClick={() => setColor(value)}><Typography variant="bodySmall" tone="inherit">{value ? '彩色图像（C = 3）' : '灰度图像（C = 1）'}</Typography></button>)}</div>
    <div className="di-memory__visual" ref={visual}><canvas className="di-memory__photo" ref={imageCanvas} width={WIDTH} height={HEIGHT} role="img" aria-label="用于读取像素的猫咪图像" /><button className="di-memory__picker" type="button" aria-label="点击图像或用方向键选择像素" onPointerDown={e => { const b = e.currentTarget.getBoundingClientRect(); choose(Math.floor((e.clientX - b.left) / b.width * WIDTH), Math.floor((e.clientY - b.top) / b.height * HEIGHT)); }} onKeyDown={e => { const delta: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }; if (delta[e.key]) { e.preventDefault(); choose(point.x + delta[e.key][0], point.y + delta[e.key][1]); } }}><i style={{ left: `${point.x / WIDTH * 100}%`, top: `${point.y / HEIGHT * 100}%` }} /></button>
    <div className="di-memory__zoom"><canvas ref={zoomCanvas} width={COLS} height={ROWS} role="img" aria-label="选中位置附近的 4 行 6 列像素" /><div className="di-memory__grid" /><i style={{ left: `${(point.x - left) / COLS * 100}%`, top: `${(point.y - top) / ROWS * 100}%` }} /></div><svg className="di-memory__links" width="100%" height="100%" aria-hidden="true">{links.map((d, i) => <path key={i} d={d} stroke="white" strokeWidth="2" strokeDasharray="8 5" fill="none" />)}</svg>
    <div className="di-memory__reading" aria-live="polite"><Typography variant="bodySmall" tone="accent">坐标 (x, y) = ({point.x}, {point.y})</Typography><Typography className="di-memory__selected-value" variant="bodySmall" tone="accent">像素值　{pixels ? color ? `[${selectedRgb.join(', ')}]` : gray(selectedRgb) : '—'}</Typography></div></div></section>
    <section className="di-memory__array"><header><div><Typography as="h2" variant="h3" tone="accent">内存里的表示</Typography><Typography className="di-memory__shape" variant="bodySmall" tone="accent">局部 H × W × C = 4 × 6 × {color ? 3 : 1}</Typography></div><div className="di-memory__legend"><Typography variant="bodySmall" tone="muted">W：宽度（列数）</Typography><Typography variant="bodySmall" tone="muted">H：高度（行数）</Typography><Typography variant="bodySmall" tone="muted">C：通道数</Typography></div></header>
    <div className="di-memory__channel-row">{color ? <><Typography variant="bodySmall" tone="muted">查看通道</Typography>{['R', 'G', 'B'].map((name, index) => <button type="button" key={name} aria-pressed={channel === index} className={channel === index ? 'is-selected' : ''} onClick={() => setChannel(index)}><Typography as="span" variant="bodySmall" tone="inherit">{name}</Typography></button>)}</> : <Typography variant="bodySmall" tone="muted">灰度图像：每个位置记录一个数</Typography>}</div>
    <div className="di-memory__matrix-layout"><Typography className="di-memory__width" variant="bodySmall" tone="accent">←　W = 6（宽度）　→</Typography><Typography className="di-memory__height" variant="bodySmall" tone="accent">H = 4<br />高度</Typography><div className="di-memory__matrix" aria-label={color ? `${['R','G','B'][channel]} 通道的局部数组` : '灰度局部数组'}>{Array.from({ length: 24 }, (_, i) => { const x = left + i % COLS, y = top + Math.floor(i / COLS), values = rgb(x, y), value = pixels ? color ? values[channel] : gray(values) : undefined; return <button type="button" key={i} className={x === point.x && y === point.y ? 'is-selected' : ''} aria-pressed={x === point.x && y === point.y} aria-label={`行 ${y}，列 ${x}，值 ${value ?? '读取中'}`} style={{ background: value === undefined ? '#edf1f5' : color ? `rgba(${channel === 0 ? '218,88,74' : channel === 1 ? '46,159,113' : '65,130,210'},${.08 + value / 255 * .15})` : `rgb(${Math.round(200 + value / 255 * 40)},${Math.round(205 + value / 255 * 40)},${Math.round(211 + value / 255 * 40)})` }} onClick={() => choose(x, y)}><Typography as="span" variant="bodySmall" tone="accent">{value ?? '—'}</Typography></button>; })}</div><Typography className="di-memory__channels" variant="bodySmall" tone="accent">C = {color ? 3 : 1}（通道数）{color ? ` · 当前显示 ${['R','G','B'][channel]}` : ''}</Typography></div>
    </section></div><footer className="di-memory__takeaway"><svg viewBox="0 0 80 100" aria-hidden="true"><circle cx="40" cy="38" r="28" fill="#ffd777" /><path d="M23 35c0-11 7-19 18-19M33 76V53l7 7 7-7v23" fill="none" stroke="#fff8dc" strokeWidth="4" strokeLinecap="round" /><path d="M30 77h20v12H30z" fill="#3977ad" /><path d="M34 91h12" stroke="#244a73" strokeWidth="5" strokeLinecap="round" /></svg><div><Typography as="h2" variant="h3" tone="accent">一张图像在内存中可以看作大小为 H × W × C 的三维数组。</Typography><Typography variant="bodySmall" tone="muted">灰度图像 C = 1，每个位置一个数；彩色图像 C = 3，每个位置包含 R、G、B 三个数。</Typography></div></footer>{failed && <Typography variant="bodySmall" tone="danger" role="alert">照片加载失败，请刷新重试。</Typography>}</div></ContentBlock>;
}
