import moduleAssetOutline from '../../outlines.json';
import { moduleAssetUrl } from "@shuku/course-runtime/react/assets";
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ContentBlock, Typography } from "@shuku/course-style/react";
import './ImageMemoryPage.css';

const photo = moduleAssetUrl('images/digital-image-cat-scene.jpg');
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
    let active = true; const image = new Image(); image.crossOrigin = 'anonymous';
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
  return <ContentBlock shuku-edit-id="e-2102a654-0196-4ec8-802b-1e48bd8afe2f" className="di-memory" title="数字图像怎样存在内存里" subtitle="一张图像可以看作一个三维数组，大小是 H × W × C。" headingLevel={1}><div shuku-edit-id="e-ef20f89b-1f4a-4947-ae2f-631a76ec7f2a" className="di-memory__body"><div shuku-edit-id="e-88093277-dc4f-4341-a9b7-94b0e94a79dd" className="di-memory__panels">
    <section shuku-edit-id="e-fe831864-bed6-4c21-b848-7837293b2f27" className="di-memory__scene"><div shuku-edit-id="e-8a554cc2-cb36-4439-be37-b9a45366565d" className="di-memory__modes" role="group" aria-label="图像表示类型">{[false, true].map(value => <button shuku-edit-id="e-60779b94-82d2-4540-a3cc-777e573d387f" type="button" key={String(value)} className={color === value ? 'is-selected' : ''} aria-pressed={color === value} onClick={() => setColor(value)}><Typography shuku-edit-id="e-3a3a374d-af0f-4017-aa09-4ba51caff61b" variant="bodySmall" tone="inherit">{value ? '彩色图像（C = 3）' : '灰度图像（C = 1）'}</Typography></button>)}</div>
    <div shuku-edit-id="e-1338c074-6948-4a08-8185-0bb1f8f653e0" className="di-memory__visual" ref={visual}><canvas shuku-edit-id="e-5765c20c-14fe-4261-8c85-85bfd2ba3b06" className="di-memory__photo" ref={imageCanvas} width={WIDTH} height={HEIGHT} role="img" aria-label="用于读取像素的猫咪图像" /><button shuku-edit-id="e-536a2cd0-fc1d-4b20-99f8-16c68fa2b4f9" className="di-memory__picker" type="button" aria-label="点击图像或用方向键选择像素" onPointerDown={e => { const b = e.currentTarget.getBoundingClientRect(); choose(Math.floor((e.clientX - b.left) / b.width * WIDTH), Math.floor((e.clientY - b.top) / b.height * HEIGHT)); }} onKeyDown={e => { const delta: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }; if (delta[e.key]) { e.preventDefault(); choose(point.x + delta[e.key][0], point.y + delta[e.key][1]); } }}><i shuku-edit-id="e-cbaa6805-10e3-4ed3-a94d-7dab022b7a80" style={{ left: `${point.x / WIDTH * 100}%`, top: `${point.y / HEIGHT * 100}%` }} /></button>
    <div shuku-edit-id="e-26beb1b9-1a7f-4de2-bbb0-5e2b64695c0a" className="di-memory__zoom"><canvas shuku-edit-id="e-a4acaeaf-ad4e-435c-aad5-a6cda14c4756" ref={zoomCanvas} width={COLS} height={ROWS} role="img" aria-label="选中位置附近的 4 行 6 列像素" /><div shuku-edit-id="e-927be601-1b1c-4423-87b5-f38467103cfd" className="di-memory__grid" /><i shuku-edit-id="e-0fc4669d-b48b-4cec-b856-5d5306854123" style={{ left: `${(point.x - left) / COLS * 100}%`, top: `${(point.y - top) / ROWS * 100}%` }} /></div><svg shuku-edit-id="e-0a8490c5-795a-44be-94a5-0dc47efb6d84" className="di-memory__links" width="100%" height="100%" aria-hidden="true">{links.map((d, i) => <path shuku-edit-id="e-779216f2-2b68-482b-b27a-c90e87e02023" key={i} d={d} stroke="white" strokeWidth="2" strokeDasharray="8 5" fill="none" />)}</svg>
    <div shuku-edit-id="e-62a482d3-a513-4449-a397-2994e62c2ee4" className="di-memory__reading" aria-live="polite"><Typography shuku-edit-id="e-ae3e3a35-ec56-494f-bc89-69d825a2fea1" variant="bodySmall" tone="accent">坐标 (x, y) = ({point.x}, {point.y})</Typography><Typography shuku-edit-id="e-472621c3-a4ea-41c1-a4ab-139245a808bd" className="di-memory__selected-value" variant="bodySmall" tone="accent">像素值　{pixels ? color ? `[${selectedRgb.join(', ')}]` : gray(selectedRgb) : '—'}</Typography></div></div></section>
    <section shuku-edit-id="e-3f410820-7e20-4c23-baf5-e107fbeb3818" className="di-memory__array"><header shuku-edit-id="e-b2f8b7af-a6f2-450b-9805-74ccbbcf3444"><div shuku-edit-id="e-d3d4babe-74ba-4e43-9483-9a958cd71d05"><Typography shuku-edit-id="e-b01065be-eeb2-4122-b5c5-aea7c050000d" as="h2" variant="h3" tone="accent">内存里的表示</Typography><Typography shuku-edit-id="e-984127a0-a184-4846-ac48-ba6df18628bb" className="di-memory__shape" variant="bodySmall" tone="accent">局部 H × W × C = 4 × 6 × {color ? 3 : 1}</Typography></div><div shuku-edit-id="e-f8f687a5-ef85-40a0-a824-5f8c9037b549" className="di-memory__legend"><Typography shuku-edit-id="e-01c3a361-57ca-44a9-9223-89d4b503d437" variant="bodySmall" tone="muted">W：宽度（列数）</Typography><Typography shuku-edit-id="e-d7b8c57f-bc59-4048-80e4-674bff57f1a1" variant="bodySmall" tone="muted">H：高度（行数）</Typography><Typography shuku-edit-id="e-5932d783-e194-4b5e-9a9f-854fdd84b441" variant="bodySmall" tone="muted">C：通道数</Typography></div></header>
    <div shuku-edit-id="e-abde7add-7f96-492a-aa4f-8cb685d0e24c" className="di-memory__channel-row">{color ? <><Typography shuku-edit-id="e-3f38ed62-2916-45e6-a316-05bbeecfd754" variant="bodySmall" tone="muted">查看通道</Typography>{['R', 'G', 'B'].map((name, index) => <button shuku-edit-id="e-876bf5dd-c7d3-49fa-a000-b67710f95897" type="button" key={name} aria-pressed={channel === index} className={channel === index ? 'is-selected' : ''} onClick={() => setChannel(index)}><Typography shuku-edit-id="e-c23baeda-b504-4297-9200-be1be8918ee5" as="span" variant="bodySmall" tone="inherit">{name}</Typography></button>)}</> : <Typography shuku-edit-id="e-7b8e523b-30bd-4a78-b311-83f41a5a2135" variant="bodySmall" tone="muted">灰度图像：每个位置记录一个数</Typography>}</div>
    <div shuku-edit-id="e-582df858-fd7b-449b-b79d-7c84fd750061" className="di-memory__matrix-layout"><Typography shuku-edit-id="e-ca981c84-2834-4ff5-b7f0-effb4e789431" className="di-memory__width" variant="bodySmall" tone="accent">←　W = 6（宽度）　→</Typography><Typography shuku-edit-id="e-45f3322f-c46d-4484-bd4a-60f07f51c036" className="di-memory__height" variant="bodySmall" tone="accent">H = 4<br shuku-edit-id="e-a4719208-fe29-4584-9953-c869411626d9" />高度</Typography><div shuku-edit-id="e-0d396661-d7e0-4194-b03e-e1d24e52db18" className="di-memory__matrix" aria-label={color ? `${['R','G','B'][channel]} 通道的局部数组` : '灰度局部数组'}>{Array.from({ length: 24 }, (_, i) => { const x = left + i % COLS, y = top + Math.floor(i / COLS), values = rgb(x, y), value = pixels ? color ? values[channel] : gray(values) : undefined; return <button shuku-edit-id="e-234eb260-bb93-4317-9e5d-f2b281bd8096" type="button" key={i} className={x === point.x && y === point.y ? 'is-selected' : ''} aria-pressed={x === point.x && y === point.y} aria-label={`行 ${y}，列 ${x}，值 ${value ?? '读取中'}`} style={{ background: value === undefined ? '#edf1f5' : color ? `rgba(${channel === 0 ? '218,88,74' : channel === 1 ? '46,159,113' : '65,130,210'},${.08 + value / 255 * .15})` : `rgb(${Math.round(200 + value / 255 * 40)},${Math.round(205 + value / 255 * 40)},${Math.round(211 + value / 255 * 40)})` }} onClick={() => choose(x, y)}><Typography shuku-edit-id="e-d9c6397e-1235-4c57-b244-1c8cfc941895" as="span" variant="bodySmall" tone="accent">{value ?? '—'}</Typography></button>; })}</div><Typography shuku-edit-id="e-6835c278-8282-4ab8-932d-f548433f6de4" className="di-memory__channels" variant="bodySmall" tone="accent">C = {color ? 3 : 1}（通道数）{color ? ` · 当前显示 ${['R','G','B'][channel]}` : ''}</Typography></div>
    </section></div><footer shuku-edit-id="e-87289760-77e6-4963-8326-3605e63a8887" className="di-memory__takeaway"><svg shuku-edit-id="e-7dc12cec-dd1e-4d0c-b952-4a9a8b865b56" viewBox="0 0 80 100" aria-hidden="true"><circle shuku-edit-id="e-d6212929-6703-410f-8c10-5e90f8c0e814" cx="40" cy="38" r="28" fill="#ffd777" /><path shuku-edit-id="e-1ad38c54-efd3-462c-be15-1a603c489270" d="M23 35c0-11 7-19 18-19M33 76V53l7 7 7-7v23" fill="none" stroke="#fff8dc" strokeWidth="4" strokeLinecap="round" /><path shuku-edit-id="e-74322889-e8a2-425d-8b73-c8d49a83a525" d="M30 77h20v12H30z" fill="#3977ad" /><path shuku-edit-id="e-04ddb157-e234-421a-b9e0-8de43e9ad3e3" d="M34 91h12" stroke="#244a73" strokeWidth="5" strokeLinecap="round" /></svg><div shuku-edit-id="e-44e454cf-6b57-4e44-b3ba-d0cc4fb4ffc9"><Typography shuku-edit-id="e-73dc913d-5909-4f1d-ae2f-f6b6f2701ace" as="h2" variant="h3" tone="accent">一张图像在内存中可以看作大小为 H × W × C 的三维数组。</Typography><Typography shuku-edit-id="e-52f6f146-a559-4824-8109-433b3e5b448d" variant="bodySmall" tone="muted">灰度图像 C = 1，每个位置一个数；彩色图像 C = 3，每个位置包含 R、G、B 三个数。</Typography></div></footer>{failed && <Typography shuku-edit-id="e-d12e023c-a399-4f1e-b6d1-c59b80d7b04c" variant="bodySmall" tone="danger" role="alert">照片加载失败，请刷新重试。</Typography>}</div></ContentBlock>;
}
