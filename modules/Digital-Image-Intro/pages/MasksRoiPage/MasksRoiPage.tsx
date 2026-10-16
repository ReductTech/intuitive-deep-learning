import moduleAssetOutline from '../../outlines.json';
import { moduleAssetUrl } from '../../../shared/react/assets';
import { useEffect, useRef, useState } from 'react';
import { ContentBlock, MathFormulaBlock, MathFormulaStatic, Typography } from '../../../shared/react';
import { applyMask, defaults, HEIGHT, WIDTH, type Operation } from './maskModel';
import './MasksRoiPage.css';
const background = moduleAssetUrl(moduleAssetOutline.moduleIdentity.id, 'images/roi-fruit-background.png');
const applePhoto = moduleAssetUrl(moduleAssetOutline.moduleIdentity.id, 'images/roi-apple-cutout.png');
const modes: [Operation, string][] = [['brightness', '亮度'], ['contrast', '对比度'], ['gamma', 'Gamma'], ['threshold', '阈值']];
const settings: Record<Operation, { label: string; min: number; max: number; step: number }> = {
  brightness: { label: '亮度调整', min: -100, max: 100, step: 1 },
  contrast: { label: '对比度调整', min: .2, max: 2.5, step: .01 },
  gamma: { label: 'Gamma 调整', min: .2, max: 2.5, step: .01 },
  threshold: { label: '阈值调整', min: 0, max: 255, step: 1 },
};
type Source = { pixels: Uint8ClampedArray; mask: Uint8Array; roi: { x: number; y: number; width: number; height: number } };
const load = (url: string) => new Promise<HTMLImageElement>((resolve, reject) => { const image = new Image(); image.crossOrigin = 'anonymous'; image.onload = () => resolve(image); image.onerror = reject; image.src = url; });
function paint(canvas: HTMLCanvasElement | null, pixels: Uint8ClampedArray) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d')!, image = ctx.createImageData(WIDTH, HEIGHT); image.data.set(pixels); ctx.putImageData(image, 0, 0);
}
export function MasksRoiPage() {
  const [source, setSource] = useState<Source>(), [failed, setFailed] = useState(false);
  const [operation, setOperation] = useState<Operation>('brightness'), [amount, setAmount] = useState(defaults.brightness), [showRoi, setShowRoi] = useState(false);
  const original = useRef<HTMLCanvasElement>(null), overlay = useRef<HTMLCanvasElement>(null), result = useRef<HTMLCanvasElement>(null);
  const maskPreview = useRef<HTMLCanvasElement>(null), resultPreview = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let active = true;
    Promise.all([load(background), load(applePhoto)]).then(([bg, apple]) => {
      if (!active) return;
      const canvas = document.createElement('canvas'); canvas.width = WIDTH; canvas.height = HEIGHT; const ctx = canvas.getContext('2d')!;
      // Cover crop the background, then composite a transparent apple. Its alpha supplies the mask.
      const cropHeight = bg.width * HEIGHT / WIDTH;
      ctx.drawImage(bg, 0, (bg.height - cropHeight) / 2, bg.width, cropHeight, 0, 0, WIDTH, HEIGHT);
      const layer = document.createElement('canvas'); layer.width = WIDTH; layer.height = HEIGHT; const layerCtx = layer.getContext('2d')!;
      layerCtx.drawImage(apple, 195, 75, 220, 220); ctx.drawImage(layer, 0, 0);
      const alpha = layerCtx.getImageData(0, 0, WIDTH, HEIGHT).data;
      const mask = Uint8Array.from({ length: WIDTH * HEIGHT }, (_, i) => alpha[i * 4 + 3] >= 128 ? 1 : 0);
      let left = WIDTH, right = 0, top = HEIGHT, bottom = 0;
      mask.forEach((v, i) => { if (v) { const x = i % WIDTH, y = Math.floor(i / WIDTH); left = Math.min(left, x); right = Math.max(right, x); top = Math.min(top, y); bottom = Math.max(bottom, y); } });
      setSource({ pixels: ctx.getImageData(0, 0, WIDTH, HEIGHT).data, mask, roi: { x: left, y: top, width: right - left + 1, height: bottom - top + 1 } });
    }).catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (!source) return;
    paint(original.current, source.pixels);
    const tinted = new Uint8ClampedArray(WIDTH * HEIGHT * 4), binary = new Uint8ClampedArray(tinted.length);
    source.mask.forEach((v, i) => {
      binary.set([v * 255, v * 255, v * 255, 255], i * 4);
      if (!v) return;
      const x = i % WIDTH, y = Math.floor(i / WIDTH);
      const edge = x === 0 || x === WIDTH - 1 || y === 0 || y === HEIGHT - 1 || !source.mask[i - 1] || !source.mask[i + 1] || !source.mask[i - WIDTH] || !source.mask[i + WIDTH];
      tinted.set(edge ? [255, 255, 255, 255] : [28, 112, 255, 100], i * 4);
    });
    paint(overlay.current, tinted); paint(maskPreview.current, binary);
  }, [source]);
  useEffect(() => {
    if (!source) return;
    const pixels = applyMask(source.pixels, source.mask, operation, amount);
    paint(result.current, pixels); paint(resultPreview.current, pixels);
  }, [source, operation, amount]);
  const setting = settings[operation];
  const value = operation === 'brightness' ? `${amount > 0 ? '+' : ''}${amount}` : operation === 'threshold' ? String(amount) : amount.toFixed(2);
  const curve = Array.from({ length: 65 }, (_, i) => {
    const r = i / 64, s = operation === 'brightness' ? r + amount / 255 : operation === 'contrast' ? (r - .5) * amount + .5 : operation === 'gamma' ? r ** amount : r * 255 >= amount ? 1 : 0;
    return `${i ? 'L' : 'M'}${12 + 76 * r} ${62 - 50 * Math.max(0, Math.min(1, s))}`;
  }).join(' ');
  return <ContentBlock className="di-roi" title="掩膜与 ROI" subtitle="先用 Mask 选定位置，再只在这些位置上应用图像操作。" headingLevel={1}>
    <div className="di-roi__body" data-ready={!!source}>
      <div className="di-roi__main">
        <section className="di-roi__photo-panel"><Typography as="h2" variant="h3" tone="accent" align="center">原图 + Mask</Typography><div className="di-roi__photo"><canvas ref={original} width={WIDTH} height={HEIGHT} aria-label="水果原始图像" /><canvas className="di-roi__overlay" ref={overlay} width={WIDTH} height={HEIGHT} aria-label="苹果二值掩膜覆盖层" /><div className="di-roi__legend"><Typography variant="bodySmall" tone="accent"><i className="is-selected" />选中区域　M = 1</Typography><Typography variant="bodySmall" tone="muted"><i />未选区域　M = 0</Typography></div>{showRoi && source && <div className="di-roi__rectangle" style={{ left: `${source.roi.x / WIDTH * 100}%`, top: `${source.roi.y / HEIGHT * 100}%`, width: `${source.roi.width / WIDTH * 100}%`, height: `${source.roi.height / HEIGHT * 100}%` }}><Typography variant="bodySmall" tone="accent">ROI</Typography></div>}</div></section>
        <Typography className="di-roi__arrow" variant="h3" tone="accent">→</Typography>
        <section className="di-roi__operations"><Typography as="h2" variant="h3" tone="accent" align="center">操作</Typography><div className="di-roi__tabs" role="group" aria-label="选择局部图像操作">{modes.map(([id, label]) => <button type="button" key={id} aria-pressed={operation === id} className={operation === id ? 'is-selected' : ''} onClick={() => { setOperation(id); setAmount(defaults[id]); }}><Typography variant="bodySmall" tone="inherit">{label}</Typography></button>)}</div><label className="di-roi__parameter"><div><Typography variant="bodySmall" tone="accent">{setting.label}</Typography><Typography variant="body" tone="accent">{value}</Typography></div><input type="range" aria-label={setting.label} min={setting.min} max={setting.max} step={setting.step} value={amount} onChange={e => setAmount(Number(e.target.value))} /></label><Typography className="di-roi__operation-note" variant="bodySmall" tone="accent">这些操作都只作用于<br />Mask 选中的位置。</Typography><div className="di-roi__buttons"><button type="button" aria-pressed={showRoi} onClick={() => setShowRoi(v => !v)}><Typography variant="bodySmall" tone="accent">{showRoi ? '隐藏 ROI' : '显示 ROI'}</Typography></button><button type="button" onClick={() => setAmount(defaults[operation])}><Typography variant="bodySmall" tone="accent">重置</Typography></button></div></section>
        <Typography className="di-roi__arrow" variant="h3" tone="accent">→</Typography>
        <section className="di-roi__photo-panel"><Typography as="h2" variant="h3" tone="accent" align="center">结果图</Typography><div className="di-roi__photo"><canvas ref={result} width={WIDTH} height={HEIGHT} aria-label="仅处理苹果选区后的结果图像" /></div></section>
      </div>
      <div className="di-roi__workflow"><section><Typography as="h2" variant="h3" tone="accent" align="center">Mask</Typography><div><canvas ref={maskPreview} width={WIDTH} height={HEIGHT} aria-label="白色为苹果选区、黑色为未选区的二值掩膜" /><Typography variant="bodySmall" tone="accent">决定<strong>哪里</strong>参与处理</Typography></div></section><Typography variant="h3" tone="accent">→</Typography><section><Typography as="h2" variant="h3" tone="accent" align="center">操作 T(I)</Typography><div><svg viewBox="0 0 100 75" aria-label="当前操作的像素映射曲线" role="img"><path d="M12 8V62H95" fill="none" stroke="#778cab" strokeWidth="2" /><path d={curve} fill="none" stroke="#2585ff" strokeWidth="3" /></svg><Typography variant="bodySmall" tone="accent">决定<strong>怎样</strong>处理</Typography></div></section><Typography variant="h3" tone="accent">→</Typography><section><Typography as="h2" variant="h3" tone="accent" align="center">局部结果</Typography><div><canvas ref={resultPreview} width={WIDTH} height={HEIGHT} aria-label="局部处理结果缩略图" /><Typography variant="bodySmall" tone="accent">只改变<strong>选区内</strong>像素</Typography></div></section></div>
      <div className="di-roi__formula"><Typography variant="bodySmall" tone="accent">处理公式</Typography><div><MathFormulaBlock appearance="plain"><MathFormulaStatic latex={"I'(x,y)=M(x,y)\\cdot T(I(x,y))+(1-M(x,y))\\cdot I(x,y)"} /></MathFormulaBlock><Typography variant="bodySmall" tone="muted" align="center">选区内应用变换，选区外保持原样。</Typography></div></div>
      <footer className="di-roi__takeaway"><Typography variant="bodySmall" tone="accent">{failed ? '图像加载失败，请刷新重试。' : showRoi ? 'ROI 标出关注区域；矩形内仍有未选像素，真正参与处理的是 Mask。' : 'Mask 决定处理范围，ROI 是关注区域；真正参与处理的是 Mask 选中的像素。'}</Typography></footer>
    </div>
  </ContentBlock>;
}
