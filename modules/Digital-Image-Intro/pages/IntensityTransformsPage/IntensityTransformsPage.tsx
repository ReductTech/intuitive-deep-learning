import { useEffect, useRef, useState } from 'react';
import { ContentBlock, MathFormulaBlock, MathFormulaStatic, Typography } from '../../../shared/react';
import { initialParameters, transformGray, type Parameters, type Transform } from './intensityModel';
import './IntensityTransformsPage.css';
const photo = new URL('../../assets/digital-image-cat-scene.png', import.meta.url).href;
const WIDTH = 480, HEIGHT = 400;
const modes: [Transform, string][] = [['linear', '线性变换'], ['log', '对数变换'], ['gamma', 'Gamma 变换']];
const samples = [{ r: .1, name: '暗部', color: '#e34c42' }, { r: .5, name: '中间调', color: '#239a50' }, { r: .9, name: '亮部', color: '#8146cf' }];
function MappingCurve({ mode, parameters }: { mode: Transform; parameters: Parameters }) {
 const path = Array.from({ length: 257 }, (_, i) => { const r = i / 256; return `${i ? 'L' : 'M'}${48 + r * 326} ${236 - transformGray(r, mode, parameters) * 194}`; }).join(' ');
 const label = (x: number, y: number, width: number, text: string) => <foreignObject x={x} y={y} width={width} height={38}><Typography variant="bodySmall" tone="accent" align="center">{text}</Typography></foreignObject>;
 return <svg className="di-intensity__curve" viewBox="0 0 420 290" role="img" aria-label={`${mode} 映射曲线，横轴输入 r，纵轴输出 s，范围 0 至 1`}>
  <defs><marker id="di-intensity-axis" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L10 5L0 10z" fill="#18334f" /></marker></defs>
  {[0,.25,.5,.75,1].map(v => <g key={v}><path d={`M48 ${236 - v * 194}H374M${48 + v * 326} 42V236`} stroke="#dbe6f1" strokeDasharray="4 4" fill="none" /></g>)}
  <path d="M48 236V21M48 236H396" fill="none" stroke="#18334f" strokeWidth="2" markerEnd="url(#di-intensity-axis)" /><path d="M48 42V21" stroke="#18334f" strokeWidth="2" markerEnd="url(#di-intensity-axis)" />
  <path d="M48 236L374 42" fill="none" stroke="#9aacbd" strokeWidth="1.5" strokeDasharray="7 5" />
  <path className="di-intensity__mapping-path" d={path} fill="none" stroke="#2586f7" strokeWidth="3" />
  {label(0, 217, 44, '0')}{label(0, 23, 44, '1')}{label(28, 242, 40, '0')}{label(353, 242, 42, '1')}{label(29, -7, 38, 's')}{label(387, 218, 32, 'r')}{label(185, 242, 48, '0.5')}
  {samples.map((sample, i) => { const x = 48 + sample.r * 326, y = 236 - transformGray(sample.r, mode, parameters) * 194; return <g key={sample.name}><circle cx={x} cy={y} r="7" fill={sample.color} stroke="white" strokeWidth="2" /><foreignObject x={i === 2 ? x - 73 : x + 7} y={Math.min(200, Math.max(10, y + (i === 2 ? 5 : -15)))} width={88} height={38}><Typography variant="bodySmall" className={`di-intensity__sample-color di-intensity__sample-color--${i}`}>{sample.name}</Typography></foreignObject></g>; })}
 </svg>;
}
export function IntensityTransformsPage() {
 const [mode, setMode] = useState<Transform>('gamma'), [parameters, setParameters] = useState<Parameters>({ ...initialParameters });
 const [source, setSource] = useState<Uint8ClampedArray>(), [failed, setFailed] = useState(false);
 const original = useRef<HTMLCanvasElement>(null), result = useRef<HTMLCanvasElement>(null);
 useEffect(() => {
  let active = true; const image = new Image();
  image.onload = () => {
   if (!active) return;
   const canvas = document.createElement('canvas'); canvas.width = WIDTH; canvas.height = HEIGHT; const ctx = canvas.getContext('2d')!;
   ctx.drawImage(image, image.width * .2, image.height * .18, image.width * .6, image.width * .5, 0, 0, WIDTH, HEIGHT);
   const data = ctx.getImageData(0, 0, WIDTH, HEIGHT).data;
   for (let i = 0; i < data.length; i += 4) { const g = Math.round(.299 * data[i] + .587 * data[i + 1] + .114 * data[i + 2]); data.set([g, g, g], i); }
   setSource(data);
  };
  image.onerror = () => { if (active) setFailed(true); }; image.src = photo;
  return () => { active = false; };
 }, []);
 useEffect(() => {
  if (!source) return;
  const before = original.current?.getContext('2d'), after = result.current?.getContext('2d'); if (!before || !after) return;
  const input = before.createImageData(WIDTH, HEIGHT); input.data.set(source); before.putImageData(input, 0, 0);
  const output = after.createImageData(WIDTH, HEIGHT); output.data.set(source);
  const lookup = Array.from({ length: 256 }, (_, r) => Math.round(transformGray(r / 255, mode, parameters) * 255));
  for (let i = 0; i < output.data.length; i += 4) output.data.set([lookup[source[i]], lookup[source[i]], lookup[source[i]]], i);
  after.putImageData(output, 0, 0);
 }, [source, mode, parameters]);
 const formula = mode === 'linear' ? 's=ar+b' : mode === 'log' ? 's=\\frac{\\log(1+kr)}{\\log(1+k)}' : 's=r^{\\gamma}';
 const slider = (key: keyof Parameters, text: string, min: number, max: number, step: number) => <label className="di-intensity__slider"><Typography as="span" variant="bodySmall" tone="accent">{text}</Typography><input type="range" aria-label={text} min={min} max={max} step={step} value={parameters[key]} onChange={e => setParameters(p => ({ ...p, [key]: Number(e.target.value) }))} /><Typography as="span" className="di-intensity__parameter-value" variant="bodySmall" tone="accent">{parameters[key].toFixed(key === 'k' ? 0 : 2)}</Typography></label>;
 return <ContentBlock className="di-intensity" title="线性、对数与 Gamma 变换" subtitle="看懂映射曲线，怎样改变暗部、中间调和亮部。" headingLevel={1}><div className="di-intensity__body"><div className="di-intensity__tabs" role="group" aria-label="选择灰度变换">{modes.map(([id, title]) => <button type="button" key={id} className={mode === id ? 'is-selected' : ''} aria-pressed={mode === id} onClick={() => setMode(id)}><Typography variant="bodySmall" tone="inherit">{title}</Typography></button>)}</div><div className="di-intensity__main"><section className="di-intensity__image-card"><Typography as="h2" variant="h3" tone="accent">原图</Typography><div className="di-intensity__photo"><canvas ref={original} width={WIDTH} height={HEIGHT} role="img" aria-label="原始灰度图像" /></div></section><section className="di-intensity__mapping"><Typography as="h2" variant="h3" tone="accent">灰度映射</Typography><div className="di-intensity__formula"><MathFormulaBlock appearance="plain"><MathFormulaStatic latex={formula} /></MathFormulaBlock><Typography variant="bodySmall" tone="muted">r、s：0～1</Typography></div><div className="di-intensity__graph"><MappingCurve mode={mode} parameters={parameters} /></div><div className="di-intensity__controls"><div>{mode === 'linear' ? <>{slider('a', '斜率 a', 0, 2, .01)}{slider('b', '偏移 b', -.5, .5, .01)}</> : mode === 'log' ? slider('k', '强度 k', 0, 30, 1) : slider('gamma', 'γ', .2, 2.5, .01)}</div><button type="button" onClick={() => setParameters({ ...initialParameters })}><Typography variant="bodySmall" tone="accent">重置</Typography></button></div></section><section className="di-intensity__image-card"><Typography as="h2" variant="h3" tone="accent">结果图</Typography><div className="di-intensity__photo"><canvas ref={result} width={WIDTH} height={HEIGHT} role="img" aria-label={`${mode} 灰度变换后的图像`} /></div></section></div><div className="di-intensity__samples" aria-live="polite">{samples.map((sample, i) => { const output = transformGray(sample.r, mode, parameters); return <div key={sample.name} className="di-intensity__sample"><Typography className={`di-intensity__sample-color di-intensity__sample-color--${i}`} variant="bodySmall">{sample.name}（示例）</Typography><div className="di-intensity__sample-values"><div className="di-intensity__swatches" aria-hidden="true"><i style={{ background: `rgb(${sample.r * 255},${sample.r * 255},${sample.r * 255})` }} /><i style={{ background: `rgb(${output * 255},${output * 255},${output * 255})` }} /></div><Typography variant="body" tone="accent">{sample.r.toFixed(2)} → {output.toFixed(2)}</Typography></div></div>; })}</div><footer className="di-intensity__takeaway"><svg viewBox="0 0 50 60" aria-hidden="true"><path d="M13 33a16 16 0 1 1 24 0l-4 12H17z" fill="#ffda83" /><path d="M20 47h10M21 52h8M23 42V29l3 4 3-4v13" fill="none" stroke="#397cba" strokeWidth="3" strokeLinecap="round" /></svg><Typography variant="body" tone="accent">曲线在哪里更陡，哪里的灰度差异就被放大。</Typography><Typography variant="bodySmall" tone="muted">{mode === 'gamma' ? 'γ < 1 提亮；γ > 1 压暗暗部和中间调。' : mode === 'linear' ? 'a 控制斜率，b 控制整体偏移；输出需裁剪。' : 'k 越大，暗部被拉开得越明显；k = 0 保持原图。'}</Typography></footer>{failed && <Typography variant="bodySmall" tone="danger" role="alert">图像加载失败，请刷新重试。</Typography>}</div></ContentBlock>;
}
