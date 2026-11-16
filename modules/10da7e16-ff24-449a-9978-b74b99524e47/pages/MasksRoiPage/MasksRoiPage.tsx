import moduleAssetOutline from '../../outlines.json';
import { moduleAssetUrl } from "@shuku/course-runtime/react/assets";
import { useEffect, useRef, useState } from 'react';
import { ContentBlock, MathFormulaBlock, MathFormulaStatic, Typography } from "@shuku/course-style/react";
import { applyMask, defaults, HEIGHT, WIDTH, type Operation } from './maskModel';
import './MasksRoiPage.css';
const background = moduleAssetUrl('images/roi-fruit-background.jpg');
const applePhoto = moduleAssetUrl('images/roi-apple-cutout.png');
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
  return <ContentBlock shuku-edit-id="e-1f3d232a-6f98-4834-8bb9-eff820d6506f" className="di-roi" title="掩膜与 ROI" subtitle="先用 Mask 选定位置，再只在这些位置上应用图像操作。" headingLevel={1}>
    <div shuku-edit-id="e-9529da3b-f413-481a-a755-d13a377d54fa" className="di-roi__body" data-ready={!!source}>
      <div shuku-edit-id="e-b8ad6d46-34d5-445c-9812-6d1d3216300a" className="di-roi__main">
        <section shuku-edit-id="e-c50db7e6-2a9a-4d4a-9ae0-00a176ce5b52" className="di-roi__photo-panel"><Typography shuku-edit-id="e-cfc87878-cf5c-4e77-af10-ef03507b0002" as="h2" variant="h3" tone="accent" align="center">原图 + Mask</Typography><div shuku-edit-id="e-31ed70eb-8119-4f85-9383-360f67dd0673" className="di-roi__photo"><canvas shuku-edit-id="e-de059f6d-4702-4f16-b89c-995dca3cc2eb" ref={original} width={WIDTH} height={HEIGHT} aria-label="水果原始图像" /><canvas shuku-edit-id="e-385d1564-44f3-4d32-a5d4-dae7010ce6ac" className="di-roi__overlay" ref={overlay} width={WIDTH} height={HEIGHT} aria-label="苹果二值掩膜覆盖层" /><div shuku-edit-id="e-920af2a3-81ed-4f64-ad4c-96703fdb20f6" className="di-roi__legend"><Typography shuku-edit-id="e-2910f5c5-a2bd-4591-bff3-0519f4bfb968" variant="bodySmall" tone="accent"><i shuku-edit-id="e-6bb67471-842a-425b-8b88-ac4bfb4398b7" className="is-selected" />选中区域　M = 1</Typography><Typography shuku-edit-id="e-ee9f9038-0c97-4d7c-ac7b-65155ee95ae5" variant="bodySmall" tone="muted"><i shuku-edit-id="e-f06cf651-863e-424d-8fee-da7511d25817" />未选区域　M = 0</Typography></div>{showRoi && source && <div shuku-edit-id="e-9c020a60-2ef4-4643-bb16-416a89b205aa" className="di-roi__rectangle" style={{ left: `${source.roi.x / WIDTH * 100}%`, top: `${source.roi.y / HEIGHT * 100}%`, width: `${source.roi.width / WIDTH * 100}%`, height: `${source.roi.height / HEIGHT * 100}%` }}><Typography shuku-edit-id="e-a524597c-3cec-4d5a-b4cd-bb83b2235309" variant="bodySmall" tone="accent">ROI</Typography></div>}</div></section>
        <Typography shuku-edit-id="e-58c7828f-5701-4e88-9cb7-8eceb89d4acd" className="di-roi__arrow" variant="h3" tone="accent">→</Typography>
        <section shuku-edit-id="e-631adba7-828a-451e-98db-c14538dfb207" className="di-roi__operations"><Typography shuku-edit-id="e-e1c1f031-44cb-44e4-8b95-4bd5bb9dc261" as="h2" variant="h3" tone="accent" align="center">操作</Typography><div shuku-edit-id="e-bfe2158d-4a23-46f5-b2d8-031c446994cd" className="di-roi__tabs" role="group" aria-label="选择局部图像操作">{modes.map(([id, label]) => <button shuku-edit-id="e-1302adcc-d488-486d-b230-40c204d6eea5" type="button" key={id} aria-pressed={operation === id} className={operation === id ? 'is-selected' : ''} onClick={() => { setOperation(id); setAmount(defaults[id]); }}><Typography shuku-edit-id="e-588ef8ca-2b21-4117-aa08-1d0981d5c7d6" variant="bodySmall" tone="inherit">{label}</Typography></button>)}</div><label shuku-edit-id="e-68051685-8f1a-42c2-ad1c-cde22dbee347" className="di-roi__parameter"><div shuku-edit-id="e-4aab37e3-aa6a-428f-bea5-a12f1a11e571"><Typography shuku-edit-id="e-9f52cc77-c961-4d28-bd8b-33c09758700b" variant="bodySmall" tone="accent">{setting.label}</Typography><Typography shuku-edit-id="e-49eb70b2-4f6c-44df-bfdc-500915b20793" variant="body" tone="accent">{value}</Typography></div><input shuku-edit-id="e-92f686b1-cf25-499f-8cbc-44e4c19e41b1" type="range" aria-label={setting.label} min={setting.min} max={setting.max} step={setting.step} value={amount} onChange={e => setAmount(Number(e.target.value))} /></label><Typography shuku-edit-id="e-9815c1c5-41f2-4894-bf46-28c11f65c860" className="di-roi__operation-note" variant="bodySmall" tone="accent">这些操作都只作用于<br shuku-edit-id="e-1bfa96b0-afe2-4961-b727-bb7aab25ad86" />Mask 选中的位置。</Typography><div shuku-edit-id="e-b0e95a45-535f-43ba-9796-4007c5146d3c" className="di-roi__buttons"><button shuku-edit-id="e-e55364f7-b534-4f35-86d8-4eeb09c1bf05" type="button" aria-pressed={showRoi} onClick={() => setShowRoi(v => !v)}><Typography shuku-edit-id="e-c2487b0d-f076-4e5c-b97f-9eddd7add4c8" variant="bodySmall" tone="accent">{showRoi ? '隐藏 ROI' : '显示 ROI'}</Typography></button><button shuku-edit-id="e-ca96b53a-315a-41bb-a8a2-1d329616c801" type="button" onClick={() => setAmount(defaults[operation])}><Typography shuku-edit-id="e-b0c06ce2-793a-4378-b9dc-45dee1d8b660" variant="bodySmall" tone="accent">重置</Typography></button></div></section>
        <Typography shuku-edit-id="e-bb263eff-a925-408a-96ef-64f9772044ae" className="di-roi__arrow" variant="h3" tone="accent">→</Typography>
        <section shuku-edit-id="e-648cbed0-a397-4780-8a7a-c0e3dc520a2a" className="di-roi__photo-panel"><Typography shuku-edit-id="e-9766c6f3-6740-438c-82ff-1a8d1134a8f4" as="h2" variant="h3" tone="accent" align="center">结果图</Typography><div shuku-edit-id="e-44478606-dadf-4e2c-87c2-5a7855c94cce" className="di-roi__photo"><canvas shuku-edit-id="e-0b653a99-d78a-4424-8bd4-f49821a58755" ref={result} width={WIDTH} height={HEIGHT} aria-label="仅处理苹果选区后的结果图像" /></div></section>
      </div>
      <div shuku-edit-id="e-0d965761-57a0-403a-94a1-221c85c24a0b" className="di-roi__workflow"><section shuku-edit-id="e-6783ede7-d2b9-4571-aebb-9e4707353f00"><Typography shuku-edit-id="e-fb55e08f-3293-4228-89e9-4042b50f9bbd" as="h2" variant="h3" tone="accent" align="center">Mask</Typography><div shuku-edit-id="e-0cc88960-fe5c-41d4-80c3-97150ce66edc"><canvas shuku-edit-id="e-b3150b76-432a-4c54-a86e-99bdfee9268f" ref={maskPreview} width={WIDTH} height={HEIGHT} aria-label="白色为苹果选区、黑色为未选区的二值掩膜" /><Typography shuku-edit-id="e-35a8ade4-7d9c-4368-a9d0-b01a7a27bbf1" variant="bodySmall" tone="accent">决定<strong shuku-edit-id="e-d710e10a-5ce5-4ca7-bc65-7f1a2a489e47">哪里</strong>参与处理</Typography></div></section><Typography shuku-edit-id="e-a647e842-f8b2-4fcb-8827-e3971fc087ba" variant="h3" tone="accent">→</Typography><section shuku-edit-id="e-f9dea41d-6c9c-411a-a7cf-6618550e5d8e"><Typography shuku-edit-id="e-2f8840d8-98b5-4c88-a4f4-aa2789cf912b" as="h2" variant="h3" tone="accent" align="center">操作 T(I)</Typography><div shuku-edit-id="e-4a895222-41a0-4309-9d82-7f1eec037bad"><svg shuku-edit-id="e-5e0680b2-be85-4334-937d-93e952198bb0" viewBox="0 0 100 75" aria-label="当前操作的像素映射曲线" role="img"><path shuku-edit-id="e-276d0be1-e65c-4159-891f-4105a4e59e06" d="M12 8V62H95" fill="none" stroke="#778cab" strokeWidth="2" /><path shuku-edit-id="e-d365ceb1-bed8-4939-aaae-bc154b907166" d={curve} fill="none" stroke="#2585ff" strokeWidth="3" /></svg><Typography shuku-edit-id="e-6ee5ee2a-fdad-4994-813a-77e143b3befa" variant="bodySmall" tone="accent">决定<strong shuku-edit-id="e-58a9c033-46b9-41b0-8114-a96c840ec9f8">怎样</strong>处理</Typography></div></section><Typography shuku-edit-id="e-f783199f-61b4-4cf9-a025-b5408c4446c1" variant="h3" tone="accent">→</Typography><section shuku-edit-id="e-af802d1c-7d84-4cbb-99f6-b8a191db6de3"><Typography shuku-edit-id="e-c0753306-e4e7-4c64-8d00-29fb01ccc2c6" as="h2" variant="h3" tone="accent" align="center">局部结果</Typography><div shuku-edit-id="e-4b1f87cf-0892-4c3b-b71d-84a2b6219030"><canvas shuku-edit-id="e-2ade2191-eb69-492f-b6cb-0ca92629c0af" ref={resultPreview} width={WIDTH} height={HEIGHT} aria-label="局部处理结果缩略图" /><Typography shuku-edit-id="e-fe235c49-261a-457a-adfa-99ee516b7925" variant="bodySmall" tone="accent">只改变<strong shuku-edit-id="e-8b8a5f61-6a54-4e50-8931-c0282cc3e14a">选区内</strong>像素</Typography></div></section></div>
      <div shuku-edit-id="e-18538427-4577-47aa-9162-c3b22d139b79" className="di-roi__formula"><Typography shuku-edit-id="e-0e200c92-be64-406f-93b1-cb21d383d072" variant="bodySmall" tone="accent">处理公式</Typography><div shuku-edit-id="e-0dfd7c51-1f70-42f6-9acc-99a3bcc888e6"><MathFormulaBlock appearance="plain"><MathFormulaStatic latex={"I'(x,y)=M(x,y)\\cdot T(I(x,y))+(1-M(x,y))\\cdot I(x,y)"} /></MathFormulaBlock><Typography shuku-edit-id="e-d97d4c16-cd07-46ee-b114-c59ca707a603" variant="bodySmall" tone="muted" align="center">选区内应用变换，选区外保持原样。</Typography></div></div>
      <footer shuku-edit-id="e-141b29d7-ec0e-463d-9cbd-060f5bc4a5a4" className="di-roi__takeaway"><Typography shuku-edit-id="e-c109dff0-aa68-4bf4-8ca8-158f40276717" variant="bodySmall" tone="accent">{failed ? '图像加载失败，请刷新重试。' : showRoi ? 'ROI 标出关注区域；矩形内仍有未选像素，真正参与处理的是 Mask。' : 'Mask 决定处理范围，ROI 是关注区域；真正参与处理的是 Mask 选中的像素。'}</Typography></footer>
    </div>
  </ContentBlock>;
}
