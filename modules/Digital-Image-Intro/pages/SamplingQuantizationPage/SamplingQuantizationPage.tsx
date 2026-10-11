import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ContentBlock, Typography } from '../../../shared/react';
import './SamplingQuantizationPage.css';

const photo = new URL('../../assets/digital-image-cat-scene.png', import.meta.url).href;
type Raster = { width: number; height: number; data: Uint8ClampedArray };
type Point = { x: number; y: number };
type Mode = 'sampling' | 'quantization';
const sizes = [8, 16, 32, 64];
const bits = [1, 2, 4, 8];
const clamp = (v: number, maximum: number) => Math.max(0, Math.min(maximum - 1, v));
function CanvasImage({ raster, depth, grid = false }: { raster?: Raster; depth?: number; grid?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !raster) return;
    canvas.width = raster.width; canvas.height = raster.height;
    const context = canvas.getContext('2d');
    if (!context) return;
    const output = context.createImageData(raster.width, raster.height);
    output.data.set(raster.data);
    if (depth !== undefined) {
      const maximum = 2 ** depth - 1;
      for (let i = 0; i < output.data.length; i += 4) {
        const gray = Math.round(.299 * raster.data[i] + .587 * raster.data[i + 1] + .114 * raster.data[i + 2]);
        const value = Math.round(Math.round(gray * maximum / 255) * 255 / maximum);
        output.data.set([value, value, value], i);
      }
    }
    context.putImageData(output, 0, 0);
  }, [raster, depth]);
  return <div className="di-precision__raster"><canvas ref={ref} role="img" aria-label={depth === undefined ? '彩色图像' : `${2 ** depth} 级灰度图像`} />{grid && raster && <div className="di-precision__grid" style={{ backgroundSize: `${100 / raster.width}% ${100 / raster.height}%` }} />}</div>;
}
function neighborhood(raster: Raster, point: Point, side: number) {
  const width = Math.min(side, raster.width), height = Math.min(side, raster.height);
  const x = clamp(Math.floor(point.x * raster.width), raster.width), y = clamp(Math.floor(point.y * raster.height), raster.height);
  const left = Math.max(0, Math.min(raster.width - width, x - Math.floor(width / 2))), top = Math.max(0, Math.min(raster.height - height, y - Math.floor(height / 2)));
  const data = new Uint8ClampedArray(width * height * 4);
  for (let row = 0; row < height; row++) for (let col = 0; col < width; col++) {
    const offset = ((top + row) * raster.width + left + col) * 4;
    data.set(raster.data.slice(offset, offset + 4), (row * width + col) * 4);
  }
  return { raster: { width, height, data }, left, top };
}
function Bulb() {
  return <svg className="di-precision__bulb" viewBox="0 0 80 100" aria-hidden="true"><circle cx="40" cy="38" r="29" fill="#ffd777" /><path d="M22 36c0-13 8-20 19-20" fill="none" stroke="#fff9df" strokeWidth="5" strokeLinecap="round" /><path d="M27 61l6 17h14l6-17M34 77V52l6 6 6-6v25" fill="none" stroke="#fff5cb" strokeWidth="3" /><path d="M30 78h20v10H30z" fill="#3977ad" /><path d="M34 90h12" stroke="#244a73" strokeWidth="6" strokeLinecap="round" /></svg>;
}
function DigitalPrecisionPage({ mode }: { mode: Mode }) {
  const sampling = mode === 'sampling';
  const [choice, setChoice] = useState(sampling ? 16 : 4);
  const [point, setPoint] = useState<Point>(sampling ? { x: .55, y: .27 } : { x: .58, y: .5 });
  const [rasters, setRasters] = useState<Record<number, Raster>>({});
  const [original, setOriginal] = useState<Raster>();
  const [failed, setFailed] = useState(false);
  const flow = useRef<HTMLDivElement>(null);
  const [links, setLinks] = useState<string[]>([]);
  useEffect(() => {
    let active = true;
    const image = new Image();
    image.onload = () => {
      if (!active) return;
      const render = (width: number): Raster => {
        const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = width * .75;
        const ctx = canvas.getContext('2d')!; ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
        const crop = sampling ? [0, image.height * .22, image.width, image.width * .75] : [image.width * .2, image.height * .2, image.width * .6, image.width * .45];
        ctx.drawImage(image, crop[0], crop[1], crop[2], crop[3], 0, 0, canvas.width, canvas.height);
        return { width, height: canvas.height, data: ctx.getImageData(0, 0, canvas.width, canvas.height).data };
      };
      setOriginal(render(sampling ? 512 : 256));
      setRasters(Object.fromEntries((sampling ? sizes : [256]).map(n => [n, render(n)])));
    };
    image.onerror = () => { if (active) setFailed(true); }; image.src = photo;
    return () => { active = false; };
  }, [sampling]);
  const result = rasters[sampling ? choice : 256];
  const detail = result ? neighborhood(result, point, sampling ? 8 : 16) : undefined;
  const column = result ? clamp(Math.floor(point.x * result.width), result.width) : 0;
  const row = result ? clamp(Math.floor(point.y * result.height), result.height) : 0;
  useLayoutEffect(() => {
    const container = flow.current;
    if (!container) return;
    const update = () => {
      const box = container.getBoundingClientRect(), selected = container.querySelector('.di-precision__picker i')?.getBoundingClientRect(), zoom = container.querySelector('.di-precision__zoom-image')?.getBoundingClientRect();
      if (!selected || !zoom || !box.width) return;
      const sx = container.clientWidth / box.width, sy = container.clientHeight / box.height;
      setLinks([`M${(selected.right - box.left) * sx} ${(selected.top - box.top) * sy}L${(zoom.left - box.left) * sx} ${(zoom.top - box.top) * sy}`, `M${(selected.right - box.left) * sx} ${(selected.bottom - box.top) * sy}L${(zoom.left - box.left) * sx} ${(zoom.bottom - box.top) * sy}`]);
    };
    const observer = new ResizeObserver(update); observer.observe(container); update();
    return () => observer.disconnect();
  }, [result, point]);
  const choose = (x: number, y: number) => { if (result) setPoint({ x: (clamp(x, result.width) + .5) / result.width, y: (clamp(y, result.height) + .5) / result.height }); };
  return <ContentBlock className={`di-precision di-precision--${mode}`} title={sampling ? '采样与空间分辨率' : '量化与位深'} subtitle={sampling ? '采样决定记录多少个位置。位置越密，能保留的空间细节越多。' : '量化决定记录成什么数。位深越高，每个位置能表示的明暗等级越多。'} headingLevel={1}>
    <div className="di-precision__body"><section className="di-precision__experiment">
      <div className="di-precision__flow" ref={flow}>
        <figure className="di-precision__figure di-precision__original"><CanvasImage raster={original} depth={sampling ? undefined : 8} /><figcaption><Typography variant="bodySmall" tone="accent">{sampling ? '连续画面' : '固定采样位置'}</Typography></figcaption></figure>
        <div className="di-precision__choices" role="group" aria-label={sampling ? '选择空间分辨率' : '选择位深'}><Typography className="di-precision__arrow di-precision__arrow--left" variant="h3" tone="muted" aria-hidden="true">→</Typography>{(sampling ? sizes : bits).map(value => <button className={choice === value ? 'is-selected' : ''} key={value} type="button" aria-pressed={choice === value} onClick={() => setChoice(value)}><Typography variant="body" tone="inherit">{sampling ? `${value} × ${value * .75}` : `${value} bit`}</Typography>{choice === value && <svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="15" fill="white" /><path d="M9 16l5 5 9-10" fill="none" stroke="#3978bf" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>}</button>)}<Typography className="di-precision__arrow di-precision__arrow--right" variant="h3" tone="muted" aria-hidden="true">→</Typography></div>
        <figure className="di-precision__figure di-precision__result"><div className="di-precision__result-image"><CanvasImage raster={result} depth={sampling ? undefined : choice} /><button className="di-precision__picker" type="button" aria-label="结果图像，点击或使用方向键选择局部放大位置" onPointerDown={e => { if (!result) return; const b = e.currentTarget.getBoundingClientRect(); choose(Math.floor((e.clientX - b.left) / b.width * result.width), Math.floor((e.clientY - b.top) / b.height * result.height)); }} onKeyDown={e => { const keys: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }; if (keys[e.key]) { e.preventDefault(); choose(column + keys[e.key][0], row + keys[e.key][1]); } }}><i style={{ left: `${result ? column / result.width * 100 : 0}%`, top: `${result ? row / result.height * 100 : 0}%`, width: `${result ? 100 / result.width : 0}%`, height: `${result ? 100 / result.height : 0}%` }} /></button></div><figcaption><Typography variant="bodySmall" tone="accent">{sampling ? '采样结果' : '量化结果'}</Typography></figcaption></figure>
        <figure className="di-precision__zoom"><div className="di-precision__zoom-image"><CanvasImage raster={detail?.raster} depth={sampling ? undefined : choice} grid /></div><figcaption><Typography variant="bodySmall" tone="accent">局部放大</Typography>{sampling ? <Typography variant="bodySmall" tone="muted">每格对应一个采样位置</Typography> : <div className="di-precision__ramps">{bits.map(b => <div key={b}><div className="di-precision__ramp" style={{ background: `linear-gradient(to right,${Array.from({ length: 2 ** b }, (_, i) => { const gray = Math.round(i * 255 / (2 ** b - 1)); return `rgb(${gray},${gray},${gray}) ${i / 2 ** b * 100}%,rgb(${gray},${gray},${gray}) ${(i + 1) / 2 ** b * 100}%`; }).join(',')})` }} /><Typography variant="bodySmall" tone="accent">{2 ** b}级</Typography></div>)}</div>}</figcaption></figure>
        <svg className="di-precision__links" width="100%" height="100%" aria-hidden="true">{links.map((d, i) => <path key={i} d={d} fill="none" stroke="#80a5cc" strokeWidth="2" strokeDasharray="8 5" />)}</svg>
      </div>
      <div className={`di-precision__stats ${sampling ? '' : 'di-precision__stats--quantization'}`} aria-live="polite"><div><Typography variant="bodySmall" tone="accent">{sampling ? '当前空间分辨率' : '当前位深'}</Typography><Typography className="di-precision__resolution" variant="display" tone="accent">{sampling ? `${choice} × ${choice * .75}` : `${choice} bit`}</Typography></div><div><Typography variant="bodySmall" tone="accent">{sampling ? '总采样位置数' : '可表示等级数'}</Typography><div className="di-precision__total"><Typography variant="display" tone="accent">{sampling ? choice * choice * .75 : 2 ** choice}</Typography><Typography variant="body" tone="accent">{sampling ? '个采样位置' : '个灰度等级'}</Typography></div></div>{!sampling && <div className="di-precision__formula"><Typography variant="h3" tone="accent"><i>b</i> bit → 2<sup><i>b</i></sup> 个等级</Typography></div>}</div>
    </section><footer className="di-precision__takeaway"><Bulb /><div><Typography as="h2" variant="h2" tone="accent">{sampling ? '采样：决定记录多少个位置' : '量化：决定每个位置记录得有多细'}</Typography><Typography variant="body" tone="muted">{sampling ? '采样位置越多，空间分辨率越高，细节越丰富。' : '位深越高，可区分的明暗等级越多，渐变越平滑。'}</Typography></div></footer>{failed && <Typography variant="bodySmall" tone="danger" role="alert">场景照片加载失败，请刷新重试。</Typography>}</div>
  </ContentBlock>;
}
export function SamplingResolutionPage() { return <DigitalPrecisionPage mode="sampling" />; }
export function QuantizationDepthPage() { return <DigitalPrecisionPage mode="quantization" />; }
