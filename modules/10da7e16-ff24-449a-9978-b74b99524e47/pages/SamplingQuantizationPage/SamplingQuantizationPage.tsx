import moduleAssetOutline from '../../outlines.json';
import { moduleAssetUrl } from "@shuku/course-runtime/react/assets";
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ContentBlock, Typography } from "@shuku/course-style/react";
import './SamplingQuantizationPage.css';

const photo = moduleAssetUrl('images/digital-image-cat-scene.jpg');
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
  return <div shuku-edit-id="e-f278e783-fc09-4f40-87d6-d19053449e51" className="di-precision__raster"><canvas shuku-edit-id="e-cd14f1a7-6bdb-455d-acf2-66950e0829ac" ref={ref} role="img" aria-label={depth === undefined ? '彩色图像' : `${2 ** depth} 级灰度图像`} />{grid && raster && <div shuku-edit-id="e-00fe0729-9651-4621-aab2-6ef4cfa7124c" className="di-precision__grid" style={{ backgroundSize: `${100 / raster.width}% ${100 / raster.height}%` }} />}</div>;
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
  return <svg shuku-edit-id="e-f05b8075-d6bd-447f-abcd-63386520f82d" className="di-precision__bulb" viewBox="0 0 80 100" aria-hidden="true"><circle shuku-edit-id="e-8a614e50-92e6-4aa2-97c4-da5bac95bc9e" cx="40" cy="38" r="29" fill="#ffd777" /><path shuku-edit-id="e-ebf139f3-db29-4cc9-8006-e3f97309cbad" d="M22 36c0-13 8-20 19-20" fill="none" stroke="#fff9df" strokeWidth="5" strokeLinecap="round" /><path shuku-edit-id="e-102f52a7-d07e-4314-a1be-70a62a62f614" d="M27 61l6 17h14l6-17M34 77V52l6 6 6-6v25" fill="none" stroke="#fff5cb" strokeWidth="3" /><path shuku-edit-id="e-9c7fc10d-2c3c-454a-9841-31fe950ef33b" d="M30 78h20v10H30z" fill="#3977ad" /><path shuku-edit-id="e-085a8355-8697-4d39-b80a-3de120b15417" d="M34 90h12" stroke="#244a73" strokeWidth="6" strokeLinecap="round" /></svg>;
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
    const image = new Image(); image.crossOrigin = 'anonymous';
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
  return <ContentBlock shuku-edit-id="e-40b4676a-4ef9-472f-9d6d-a247630dd1db" className={`di-precision di-precision--${mode}`} title={sampling ? '采样与空间分辨率' : '量化与位深'} subtitle={sampling ? '采样决定记录多少个位置。位置越密，能保留的空间细节越多。' : '量化决定记录成什么数。位深越高，每个位置能表示的明暗等级越多。'} headingLevel={1}>
    <div shuku-edit-id="e-8131a7eb-c91b-40b7-9142-f94a4b596282" className="di-precision__body"><section shuku-edit-id="e-0a29be89-cd00-473d-a411-3371a835d9b4" className="di-precision__experiment">
      <div shuku-edit-id="e-5ca2fd5b-3103-4d55-a241-a02e7181e505" className="di-precision__flow" ref={flow}>
        <figure shuku-edit-id="e-2eee99ff-f5cd-49f1-95e7-499234846078" className="di-precision__figure di-precision__original"><CanvasImage raster={original} depth={sampling ? undefined : 8} /><figcaption shuku-edit-id="e-d4ff86a6-0249-402a-b880-2afb8ca69e72"><Typography shuku-edit-id="e-0528a501-d586-4b85-985d-12b79eb88dd7" variant="bodySmall" tone="accent">{sampling ? '连续画面' : '固定采样位置'}</Typography></figcaption></figure>
        <div shuku-edit-id="e-ccea6f59-88f0-4d4f-855c-74db75688678" className="di-precision__choices" role="group" aria-label={sampling ? '选择空间分辨率' : '选择位深'}><Typography shuku-edit-id="e-31c7bde5-f014-4d35-ba50-35a83790c8e1" className="di-precision__arrow di-precision__arrow--left" variant="h3" tone="muted" aria-hidden="true">→</Typography>{(sampling ? sizes : bits).map(value => <button shuku-edit-id="e-6bf08f7b-63d6-4dc4-97ef-649808de2d6f" className={choice === value ? 'is-selected' : ''} key={value} type="button" aria-pressed={choice === value} onClick={() => setChoice(value)}><Typography shuku-edit-id="e-e0c5840e-ff63-46ba-b401-db0bd2d6916a" variant="body" tone="inherit">{sampling ? `${value} × ${value * .75}` : `${value} bit`}</Typography>{choice === value && <svg shuku-edit-id="e-8f7b7ed2-7f15-4a0c-aa44-44d289793ed7" viewBox="0 0 32 32" aria-hidden="true"><circle shuku-edit-id="e-c4f7be46-ae7c-4b22-a739-e6e699e5beb1" cx="16" cy="16" r="15" fill="white" /><path shuku-edit-id="e-7a66370d-c1e1-4e24-8512-e14771cd74a4" d="M9 16l5 5 9-10" fill="none" stroke="#3978bf" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>}</button>)}<Typography shuku-edit-id="e-c9acde83-d7dd-40d6-8ac5-991bd01c7148" className="di-precision__arrow di-precision__arrow--right" variant="h3" tone="muted" aria-hidden="true">→</Typography></div>
        <figure shuku-edit-id="e-25daa373-055f-4a69-bbcd-6fdf2787d249" className="di-precision__figure di-precision__result"><div shuku-edit-id="e-5cfc2c35-8aec-4dcd-815d-1cd238d41016" className="di-precision__result-image"><CanvasImage raster={result} depth={sampling ? undefined : choice} /><button shuku-edit-id="e-9e2b9966-79fb-4ae7-9bf6-fe880d43ca6e" className="di-precision__picker" type="button" aria-label="结果图像，点击或使用方向键选择局部放大位置" onPointerDown={e => { if (!result) return; const b = e.currentTarget.getBoundingClientRect(); choose(Math.floor((e.clientX - b.left) / b.width * result.width), Math.floor((e.clientY - b.top) / b.height * result.height)); }} onKeyDown={e => { const keys: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }; if (keys[e.key]) { e.preventDefault(); choose(column + keys[e.key][0], row + keys[e.key][1]); } }}><i shuku-edit-id="e-54bfe8d2-178d-425f-8373-e436beee508a" style={{ left: `${result ? column / result.width * 100 : 0}%`, top: `${result ? row / result.height * 100 : 0}%`, width: `${result ? 100 / result.width : 0}%`, height: `${result ? 100 / result.height : 0}%` }} /></button></div><figcaption shuku-edit-id="e-e0961111-b3bd-42b6-80bb-749cc7092bdc"><Typography shuku-edit-id="e-702bd333-2a05-4e42-a0c1-c064bfcb76db" variant="bodySmall" tone="accent">{sampling ? '采样结果' : '量化结果'}</Typography></figcaption></figure>
        <figure shuku-edit-id="e-439a48bd-d6a0-49f4-b933-6ca3745443a7" className="di-precision__zoom"><div shuku-edit-id="e-5dad9ff6-0445-43ab-ab4a-7ec43200a468" className="di-precision__zoom-image"><CanvasImage raster={detail?.raster} depth={sampling ? undefined : choice} grid /></div><figcaption shuku-edit-id="e-0826d568-ac14-4ddb-95b2-f475f0bf2047"><Typography shuku-edit-id="e-d10ccfef-0597-43f6-a14c-f3d23b43b2a3" variant="bodySmall" tone="accent">局部放大</Typography>{sampling ? <Typography shuku-edit-id="e-9bd896e9-b26b-4ae0-9e82-b8d11f04ab53" variant="bodySmall" tone="muted">每格对应一个采样位置</Typography> : <div shuku-edit-id="e-c8b8f228-704d-403f-8762-8557cc0e7916" className="di-precision__ramps">{bits.map(b => <div shuku-edit-id="e-15fabbe6-09ac-4e86-9db5-ffe82a57c195" key={b}><div shuku-edit-id="e-2f318b6b-fa04-4adb-8bfd-2d077d4e3400" className="di-precision__ramp" style={{ background: `linear-gradient(to right,${Array.from({ length: 2 ** b }, (_, i) => { const gray = Math.round(i * 255 / (2 ** b - 1)); return `rgb(${gray},${gray},${gray}) ${i / 2 ** b * 100}%,rgb(${gray},${gray},${gray}) ${(i + 1) / 2 ** b * 100}%`; }).join(',')})` }} /><Typography shuku-edit-id="e-1d8a1da8-8600-4b7e-a888-5a028f304c28" variant="bodySmall" tone="accent">{2 ** b}级</Typography></div>)}</div>}</figcaption></figure>
        <svg shuku-edit-id="e-abc9ce33-ce83-48ca-a699-e66bf61c8617" className="di-precision__links" width="100%" height="100%" aria-hidden="true">{links.map((d, i) => <path shuku-edit-id="e-db261ff6-1e92-4a31-9efb-1fe6f974e27b" key={i} d={d} fill="none" stroke="#80a5cc" strokeWidth="2" strokeDasharray="8 5" />)}</svg>
      </div>
      <div shuku-edit-id="e-509d581b-2467-492c-87a4-d536937e74d9" className={`di-precision__stats ${sampling ? '' : 'di-precision__stats--quantization'}`} aria-live="polite"><div shuku-edit-id="e-597656bc-61cf-4cfa-8318-be1bc9983d98"><Typography shuku-edit-id="e-ce5e49b5-fc6d-48b1-92b8-8f4913a4a5d6" variant="bodySmall" tone="accent">{sampling ? '当前空间分辨率' : '当前位深'}</Typography><Typography shuku-edit-id="e-81df503d-fd26-4560-964a-1bfc9a99a21f" className="di-precision__resolution" variant="display" tone="accent">{sampling ? `${choice} × ${choice * .75}` : `${choice} bit`}</Typography></div><div shuku-edit-id="e-b18d9682-36d9-4a95-9ac5-af1da79ff348"><Typography shuku-edit-id="e-fc5df063-396b-478d-b412-b1e4e424ffc6" variant="bodySmall" tone="accent">{sampling ? '总采样位置数' : '可表示等级数'}</Typography><div shuku-edit-id="e-cd3ab1a6-6891-4dd7-ae07-7f00a13a00e9" className="di-precision__total"><Typography shuku-edit-id="e-16c248a7-3d9d-4219-b0a9-b66b1eb35285" variant="display" tone="accent">{sampling ? choice * choice * .75 : 2 ** choice}</Typography><Typography shuku-edit-id="e-cf50927c-af73-4177-8438-15ff7fd01ce6" variant="body" tone="accent">{sampling ? '个采样位置' : '个灰度等级'}</Typography></div></div>{!sampling && <div shuku-edit-id="e-77f30b33-ac09-403b-974b-1917be89aede" className="di-precision__formula"><Typography shuku-edit-id="e-424143e9-9d58-4e92-b089-24d54f71bc59" variant="h3" tone="accent"><i shuku-edit-id="e-128eb378-591b-40ec-bfab-ecd6d2b38ab7">b</i> bit → 2<sup shuku-edit-id="e-e9023e70-8af1-4c58-9bc9-52728395248e"><i shuku-edit-id="e-e8f04908-87a1-4b00-a0b3-2bfc3721865c">b</i></sup> 个等级</Typography></div>}</div>
    </section><footer shuku-edit-id="e-a386cbbe-e721-4d3c-9561-8c557079c47f" className="di-precision__takeaway"><Bulb /><div shuku-edit-id="e-dd3b3e22-2830-49d9-bc61-9afad03ab418"><Typography shuku-edit-id="e-352ef4fe-c00f-486e-84e7-2bf5c9d9da66" as="h2" variant="h2" tone="accent">{sampling ? '采样：决定记录多少个位置' : '量化：决定每个位置记录得有多细'}</Typography><Typography shuku-edit-id="e-deae9d77-9b4d-4390-a0e0-915cd3318f31" variant="body" tone="muted">{sampling ? '采样位置越多，空间分辨率越高，细节越丰富。' : '位深越高，可区分的明暗等级越多，渐变越平滑。'}</Typography></div></footer>{failed && <Typography shuku-edit-id="e-e7c8f58c-0d47-48ba-9e16-d3456c8b7726" variant="bodySmall" tone="danger" role="alert">场景照片加载失败，请刷新重试。</Typography>}</div>
  </ContentBlock>;
}
export function SamplingResolutionPage() { return <DigitalPrecisionPage mode="sampling" />; }
export function QuantizationDepthPage() { return <DigitalPrecisionPage mode="quantization" />; }
