import moduleAssetOutline from '../../outlines.json';
import { moduleAssetUrl } from "@shuku/course-runtime/react/assets";
import { useEffect, useMemo, useRef, useState } from 'react';
import { ContentBlock, Typography } from "@shuku/course-style/react";
import { adjust, defaults, fromRgb, toRgb, type Space, type Triple } from './colorModel';
import './ColorSpacePage.css';
const photo = moduleAssetUrl('images/color-space-macaw.jpg');
const WIDTH = 720, HEIGHT = 540;
const spaces: Space[] = ['RGB', 'HSV', 'YCbCr', 'Lab'];
const labels: Record<Space, [string, string, string][]> = {
 RGB: [['R', '红通道', '调节红色分量'], ['G', '绿通道', '调节绿色分量'], ['B', '蓝通道', '调节蓝色分量']],
 HSV: [['H', '色相', '旋转颜色，改变色调'], ['S', '饱和度', '调节颜色的鲜艳程度'], ['V', '明度', '调节 HSV 的明暗分量']],
 YCbCr: [['Y′', '亮度分量', '调节整体明暗'], ['Cb', '蓝色色度', '调节蓝—黄方向'], ['Cr', '红色色度', '调节红—青方向']],
 Lab: [['L*', '明度', '调节感知明暗'], ['a*', '红绿色轴', '调节绿—红方向'], ['b*', '黄蓝色轴', '调节蓝—黄方向']],
};
const ranges: Record<Space, [number, number, number][]> = { RGB: [[0, 2, .01], [0, 2, .01], [0, 2, .01]], HSV: [[-180, 180, 1], [0, 2, .01], [0, 2, .01]], YCbCr: [[-80, 80, 1], [-80, 80, 1], [-80, 80, 1]], Lab: [[-40, 40, 1], [-60, 60, 1], [-60, 60, 1]] };
function format(value: number, space: Space, index: number) { return space === 'RGB' || space === 'HSV' && index > 0 ? `×${value.toFixed(2)}` : `${value > 0 ? '+' : ''}${value}${space === 'HSV' ? '°' : ''}`; }
export function ColorSpacePage() {
 const [space, setSpace] = useState<Space>('HSV'), [settings, setSettings] = useState<Triple>(defaults('HSV'));
 const [source, setSource] = useState<Uint8ClampedArray>(), [compare, setCompare] = useState(false), [failed, setFailed] = useState(false);
 const canvas = useRef<HTMLCanvasElement>(null);
 useEffect(() => {
  let active = true; const image = new Image(); image.crossOrigin = 'anonymous';
  image.onload = () => { if (!active) return; const c = document.createElement('canvas'); c.width = WIDTH; c.height = HEIGHT; const ctx = c.getContext('2d')!; ctx.drawImage(image, 0, 0, WIDTH, HEIGHT); setSource(ctx.getImageData(0, 0, WIDTH, HEIGHT).data); };
  image.onerror = () => { if (active) setFailed(true); }; image.src = photo;
  return () => { active = false; };
 }, []);
 const coordinates = useMemo(() => {
  if (!source) return undefined;
  const result = new Float32Array(WIDTH * HEIGHT * 3);
  for (let i = 0, j = 0; i < source.length; i += 4, j += 3) result.set(fromRgb(source[i] / 255, source[i + 1] / 255, source[i + 2] / 255, space), j);
  return result;
 }, [source, space]);
 useEffect(() => {
  const ctx = canvas.current?.getContext('2d'); if (!ctx || !source || !coordinates) return;
  const output = ctx.createImageData(WIDTH, HEIGHT); output.data.set(source);
  const neutral = settings.every((value, i) => value === defaults(space)[i]);
  if (!neutral) for (let i = 0, j = 0; i < source.length; i += 4, j += 3) {
   if (compare && i / 4 % WIDTH < WIDTH / 2) continue;
   const rgb = toRgb(adjust([coordinates[j], coordinates[j + 1], coordinates[j + 2]], settings, space), space);
   output.data.set([...rgb.map(v => Math.round(v * 255)), 255], i);
  }
  ctx.putImageData(output, 0, 0);
 }, [source, coordinates, space, settings, compare]);
 return <ContentBlock shuku-edit-id="e-eea806e2-1659-4823-9b62-4a5591ddf24b" className="di-color" title="颜色空间" subtitle="同一张彩色图像，可以用不同的颜色坐标描述，也可以在相应通道上直接调节。" headingLevel={1}><div shuku-edit-id="e-db27f82c-08f8-4de4-bce7-aa62c3d2d765" className="di-color__body"><div shuku-edit-id="e-64155944-3655-4243-a12d-94dd9ce87a9c" className="di-color__main"><div shuku-edit-id="e-bb01a44e-3240-4dcd-b344-0d875a07d55e" className="di-color__photo"><canvas shuku-edit-id="e-ba43e83a-3054-4d26-be90-9e8a6f77103c" ref={canvas} width={WIDTH} height={HEIGHT} role="img" aria-label={`${space} 颜色调节结果${compare ? '，左侧原图，右侧调节结果' : ''}`} />{compare && <><i shuku-edit-id="e-58e6207d-8d62-40e1-88dc-1a0163b9da11" className="di-color__divider" /><Typography shuku-edit-id="e-1601775f-f7b8-4afb-a4d0-da5c79e8555e" className="di-color__before" variant="bodySmall" tone="accent">原图</Typography><Typography shuku-edit-id="e-064f8921-a72f-456f-87dc-8a3d44ceaec8" className="di-color__after" variant="bodySmall" tone="accent">调节结果</Typography></>}</div>
 <section shuku-edit-id="e-e1fa23ec-399f-4820-b01a-28ec4563e030" className="di-color__panel"><div shuku-edit-id="e-4dcc1d3b-32b2-428b-b1ff-5c8a8b37ddb6" className="di-color__tabs" role="group" aria-label="选择颜色空间">{spaces.map(name => <button shuku-edit-id="e-80ca68ad-f23c-422b-b460-ed4948553e40" type="button" key={name} aria-pressed={space === name} className={space === name ? 'is-selected' : ''} onClick={() => { setSpace(name); setSettings(defaults(name)); }}><Typography shuku-edit-id="e-4c1d853e-1443-4ed5-ac00-6ce42f91d900" variant="bodySmall" tone="inherit">{name}</Typography></button>)}</div>
 <div shuku-edit-id="e-3648dacb-797f-4294-b608-a45f7990df90" className="di-color__controls">{labels[space].map(([symbol, title, description], index) => <label shuku-edit-id="e-c5ca6758-d4f6-4195-bc84-da48a68a80e1" className="di-color__control" key={`${space}-${index}`}><Typography shuku-edit-id="e-238f5bf9-cea9-48db-a0f4-6b67dbd29ef4" className={`di-color__symbol di-color__symbol--${index}`} as="span" variant="body" tone="light">{symbol}</Typography><div shuku-edit-id="e-7ff2c89a-a070-42d9-9ed9-13d6863bb27a" className="di-color__control-copy"><Typography shuku-edit-id="e-37839c4e-40cb-458a-9c67-d688098941b5" variant="bodySmall" tone="accent">{title}</Typography><Typography shuku-edit-id="e-68886e1a-8ab4-46ea-8c08-d10a50be17d0" variant="bodySmall" tone="muted">{description}</Typography></div><input shuku-edit-id="e-95b6fd3b-2728-49eb-a105-5603e0e9e5f7" type="range" min={ranges[space][index][0]} max={ranges[space][index][1]} step={ranges[space][index][2]} value={settings[index]} aria-label={`${space} ${title}`} style={{ background: space === 'HSV' && index === 0 ? 'linear-gradient(to right,cyan,blue,magenta,red,yellow,lime,cyan)' : index === 0 ? 'linear-gradient(to right,#152335,#f6f7f9)' : index === 1 ? 'linear-gradient(to right,#dededd,#42b88b)' : 'linear-gradient(to right,#e1e6ed,#3489ee)' }} onChange={e => { const next = [...settings] as Triple; next[index] = Number(e.target.value); setSettings(next); }} /><Typography shuku-edit-id="e-bdcdffbb-ac5e-4bfa-ae15-151d52470ee7" className="di-color__value" as="span" variant="bodySmall" tone="accent">{format(settings[index], space, index)}</Typography></label>)}<div shuku-edit-id="e-c2e58c29-ba91-4879-8bb1-432b84be690c" className="di-color__actions"><Typography shuku-edit-id="e-2e4011bd-2de3-4633-b5c3-86f352f4c554" variant="bodySmall" tone="muted">滑杆为相对原图的调节量</Typography><button shuku-edit-id="e-947ceee0-c47a-4dd0-8bef-b8816b2e59bb" type="button" onClick={() => { setSettings(defaults(space)); setCompare(false); }}><Typography shuku-edit-id="e-0be3d86d-b381-4dcb-8b2f-24645f3fb723" variant="bodySmall" tone="accent">重置</Typography></button><button shuku-edit-id="e-1e6ad773-cac5-4034-bac7-4b0df24047b2" className={compare ? 'is-selected' : 'di-color__compare'} type="button" aria-pressed={compare} onClick={() => setCompare(!compare)}><Typography shuku-edit-id="e-53274aef-8287-421a-8436-9c0adfd6bcc6" variant="bodySmall" tone="inherit">对比原图</Typography></button></div></div>
 <div shuku-edit-id="e-80b5884e-7001-4b86-a14d-8cd5a583a945" className="di-color__why"><Typography shuku-edit-id="e-d3e3dc6b-75ce-4a2b-8444-48f46edd3908" as="h2" variant="bodySmall" tone="accent">为什么切换颜色空间？</Typography><Typography shuku-edit-id="e-b0f19fdc-1f0d-4854-a179-21237a63d605" variant="bodySmall" tone="muted"><span shuku-edit-id="e-e544c2ae-2f3c-4f4e-826c-27df5fa44ead" className="di-color__dot di-color__dot--red" />RGB：直接控制红、绿、蓝三个分量</Typography><Typography shuku-edit-id="e-9e797c01-932f-43e2-b443-2c70708c86c2" variant="bodySmall" tone="muted"><span shuku-edit-id="e-2adcffa2-e735-48eb-a1e3-76a4e4c21535" className="di-color__dot di-color__dot--green" />HSV：按色相、鲜艳程度和明暗调节</Typography><Typography shuku-edit-id="e-e87568c7-7f3a-4b64-a514-4f8f4389e85e" variant="bodySmall" tone="muted"><span shuku-edit-id="e-dc64aa4b-8641-46ea-a31e-8dee9a762979" className="di-color__dot di-color__dot--blue" />YCbCr / Lab：分开处理明暗与色度信息</Typography></div></section></div><footer shuku-edit-id="e-9b508154-3346-4c56-ab7f-9fdd75cd3930" className="di-color__takeaway"><svg shuku-edit-id="e-81184088-1e05-4335-b5de-4f88ee1a7de0" viewBox="0 0 50 60" aria-hidden="true"><path shuku-edit-id="e-c30a3bf1-5d04-4e00-b1cd-a0683cc1887c" d="M13 33a16 16 0 1 1 24 0l-4 12H17z" fill="#c3e4ff" stroke="#2682eb" strokeWidth="2" /><path shuku-edit-id="e-8c3ec327-300d-4f41-ad62-7da6d0530169" d="M20 47h10M21 52h8M23 42V29l3 4 3-4v13" fill="none" stroke="#2682eb" strokeWidth="3" strokeLinecap="round" /></svg><Typography shuku-edit-id="e-61392b2f-92d9-44c1-b8a9-b1ed4b72e642" variant="body" tone="accent">切换颜色空间，改变颜色的描述方式；调节通道，改变图像的颜色。</Typography></footer>{failed && <Typography shuku-edit-id="e-0601046f-86b7-4ac6-acf8-27b4121f45a9" variant="bodySmall" tone="danger" role="alert">鹦鹉照片加载失败，请刷新重试。</Typography>}</div></ContentBlock>;
}
