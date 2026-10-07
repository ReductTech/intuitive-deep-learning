import { useEffect, useMemo, useRef, useState } from 'react';
import { ContentBlock, Typography } from '../../../shared/react';
import { adjust, defaults, fromRgb, toRgb, type Space, type Triple } from './colorModel';
import './ColorSpacePage.css';
const photo = new URL('../../assets/color-space-macaw.png', import.meta.url).href;
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
  let active = true; const image = new Image();
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
 return <ContentBlock className="di-color" title="颜色空间" subtitle="同一张彩色图像，可以用不同的颜色坐标描述，也可以在相应通道上直接调节。" headingLevel={1}><div className="di-color__body"><div className="di-color__main"><div className="di-color__photo"><canvas ref={canvas} width={WIDTH} height={HEIGHT} role="img" aria-label={`${space} 颜色调节结果${compare ? '，左侧原图，右侧调节结果' : ''}`} />{compare && <><i className="di-color__divider" /><Typography className="di-color__before" variant="bodySmall" tone="accent">原图</Typography><Typography className="di-color__after" variant="bodySmall" tone="accent">调节结果</Typography></>}</div>
 <section className="di-color__panel"><div className="di-color__tabs" role="group" aria-label="选择颜色空间">{spaces.map(name => <button type="button" key={name} aria-pressed={space === name} className={space === name ? 'is-selected' : ''} onClick={() => { setSpace(name); setSettings(defaults(name)); }}><Typography variant="bodySmall" tone="inherit">{name}</Typography></button>)}</div>
 <div className="di-color__controls">{labels[space].map(([symbol, title, description], index) => <label className="di-color__control" key={`${space}-${index}`}><Typography className={`di-color__symbol di-color__symbol--${index}`} as="span" variant="body" tone="light">{symbol}</Typography><div className="di-color__control-copy"><Typography variant="bodySmall" tone="accent">{title}</Typography><Typography variant="bodySmall" tone="muted">{description}</Typography></div><input type="range" min={ranges[space][index][0]} max={ranges[space][index][1]} step={ranges[space][index][2]} value={settings[index]} aria-label={`${space} ${title}`} style={{ background: space === 'HSV' && index === 0 ? 'linear-gradient(to right,cyan,blue,magenta,red,yellow,lime,cyan)' : index === 0 ? 'linear-gradient(to right,#152335,#f6f7f9)' : index === 1 ? 'linear-gradient(to right,#dededd,#42b88b)' : 'linear-gradient(to right,#e1e6ed,#3489ee)' }} onChange={e => { const next = [...settings] as Triple; next[index] = Number(e.target.value); setSettings(next); }} /><Typography className="di-color__value" as="span" variant="bodySmall" tone="accent">{format(settings[index], space, index)}</Typography></label>)}<div className="di-color__actions"><Typography variant="bodySmall" tone="muted">滑杆为相对原图的调节量</Typography><button type="button" onClick={() => { setSettings(defaults(space)); setCompare(false); }}><Typography variant="bodySmall" tone="accent">重置</Typography></button><button className={compare ? 'is-selected' : 'di-color__compare'} type="button" aria-pressed={compare} onClick={() => setCompare(!compare)}><Typography variant="bodySmall" tone="inherit">对比原图</Typography></button></div></div>
 <div className="di-color__why"><Typography as="h2" variant="bodySmall" tone="accent">为什么切换颜色空间？</Typography><Typography variant="bodySmall" tone="muted"><span className="di-color__dot di-color__dot--red" />RGB：直接控制红、绿、蓝三个分量</Typography><Typography variant="bodySmall" tone="muted"><span className="di-color__dot di-color__dot--green" />HSV：按色相、鲜艳程度和明暗调节</Typography><Typography variant="bodySmall" tone="muted"><span className="di-color__dot di-color__dot--blue" />YCbCr / Lab：分开处理明暗与色度信息</Typography></div></section></div><footer className="di-color__takeaway"><svg viewBox="0 0 50 60" aria-hidden="true"><path d="M13 33a16 16 0 1 1 24 0l-4 12H17z" fill="#c3e4ff" stroke="#2682eb" strokeWidth="2" /><path d="M20 47h10M21 52h8M23 42V29l3 4 3-4v13" fill="none" stroke="#2682eb" strokeWidth="3" strokeLinecap="round" /></svg><Typography variant="body" tone="accent">切换颜色空间，改变颜色的描述方式；调节通道，改变图像的颜色。</Typography></footer>{failed && <Typography variant="bodySmall" tone="danger" role="alert">鹦鹉照片加载失败，请刷新重试。</Typography>}</div></ContentBlock>;
}
