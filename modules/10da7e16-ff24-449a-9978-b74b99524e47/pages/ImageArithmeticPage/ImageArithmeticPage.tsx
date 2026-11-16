import moduleAssetOutline from '../../outlines.json';
import { moduleAssetUrl } from "@shuku/course-runtime/react/assets";
import { useEffect, useMemo, useRef, useState, type RefObject, type PointerEvent } from 'react';
import { ContentBlock, Typography } from "@shuku/course-style/react";
import { calculate, clip, HEIGHT, makeRegionMask, regions, WIDTH, type Operation } from './arithmeticModel';
import './ImageArithmeticPage.css';
const background = moduleAssetUrl('images/arithmetic-table-background.jpg');
const catPhoto = moduleAssetUrl('images/digital-image-cat-cutout.png');
const operations: [Operation, string][] = [['add', '加'], ['subtract', '减'], ['multiply', '乘'], ['divide', '除']];
function load(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => { const image = new Image(); image.crossOrigin = 'anonymous'; image.onload = () => resolve(image); image.onerror = reject; image.src = url; });
}
function grayscale(ctx: CanvasRenderingContext2D): Uint8Array {
  const data = ctx.getImageData(0, 0, WIDTH, HEIGHT).data;
  return Uint8Array.from({ length: WIDTH * HEIGHT }, (_, i) => clip(.299 * data[i * 4] + .587 * data[i * 4 + 1] + .114 * data[i * 4 + 2]));
}
function paint(canvas: HTMLCanvasElement, pixels: Uint8Array) {
  const ctx = canvas.getContext('2d')!, image = ctx.createImageData(WIDTH, HEIGHT);
  pixels.forEach((v, i) => image.data.set([v, v, v, 255], i * 4)); ctx.putImageData(image, 0, 0);
}
export function ImageArithmeticPage() {
  const [source, setSource] = useState<{ empty: Uint8Array; cat: Uint8Array; added: Uint8Array }>();
  const [failed, setFailed] = useState(false), [operation, setOperation] = useState<Operation>('add');
  const [blend, setBlend] = useState(false), [alpha, setAlpha] = useState(.5), [enabled, setEnabled] = useState([true, true, true]);
  const [selected, setSelected] = useState({ x: 330, y: 170 });
  const aCanvas = useRef<HTMLCanvasElement>(null), bCanvas = useRef<HTMLCanvasElement>(null), resultCanvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let active = true;
    Promise.all([load(background), load(catPhoto)]).then(([bg, cutout]) => {
      if (!active) return;
      const canvas = document.createElement('canvas'); canvas.width = WIDTH; canvas.height = HEIGHT;
      const ctx = canvas.getContext('2d')!; ctx.drawImage(bg, 0, 0, WIDTH, HEIGHT);
      const empty = grayscale(ctx).map(v => clip(v * .55));
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, WIDTH, HEIGHT); ctx.drawImage(cutout, 230, 35, 225, 281);
      const cat = grayscale(ctx).map(v => clip(v * .45));
      // Reserve complementary ranges so addition never clips and subtraction is exact.
      const added = empty.map((v, i) => calculate(v, cat[i], 'add', false, .5));
      setSource({ empty, cat, added });
    }).catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, []);
  const arrays = useMemo(() => {
    if (!source) return;
    let a: Uint8Array, b: Uint8Array;
    if (operation === 'add') { a = source.empty; b = source.cat; }
    else if (operation === 'subtract') { a = source.added; b = source.cat; }
    else {
      b = makeRegionMask(enabled);
      a = operation === 'multiply' ? source.added : source.added.map((v, i) => clip(v * b[i] / 255));
    }
    return { a, b, result: a.map((v, i) => calculate(v, b[i], operation, blend, alpha)) };
  }, [source, operation, blend, alpha, enabled]);
  useEffect(() => {
    if (arrays && aCanvas.current && bCanvas.current && resultCanvas.current) {
      paint(aCanvas.current, arrays.a); paint(bCanvas.current, arrays.b); paint(resultCanvas.current, arrays.result);
    }
  }, [arrays]);
  const index = selected.y * WIDTH + selected.x;
  const descriptions = operation === 'add' ? ['背景图', '猫咪图', blend ? '加权融合' : '逐像素相加'] : operation === 'subtract' ? ['相加得到的图像', '同一张猫咪图', '还原背景'] : operation === 'multiply' ? ['原始图像', '区域掩膜', '突出前景'] : ['被压暗的图像', '同一张明暗掩膜', '补偿后的图像'];
  const takeaway = operation === 'add' ? blend ? '加权融合：按不同的比例混合两幅图像。' : '图像叠加：把两幅图像同一位置的像素值相加。' : operation === 'subtract' ? '图像相减：从叠加的图像中减去猫咪，得到原来的背景。' : operation === 'multiply' ? '图像相乘：用区域掩膜，突出更有价值的前景像素。' : '图像相除：用对应的明暗掩膜，补偿被压暗的图像。';
  const note = operation === 'add' ? blend ? '拖动滑杆，观察背景与猫咪在结果中的不同占比。' : '猫咪以外的黑色区域不增加亮度，原来的背景得以保留。' : operation === 'subtract' ? '加法与减法使用同一组图像，观察背景怎样被还原。' : operation === 'multiply' ? '掩膜明亮的区域保留细节，其他区域被压暗。' : '这里先模拟亮度衰减，再用同一掩膜进行补偿。';
  const select = (x: number, y: number) => setSelected({ x: Math.max(0, Math.min(WIDTH - 1, x)), y: Math.max(0, Math.min(HEIGHT - 1, y)) });
  const move = (e: PointerEvent<HTMLDivElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    select(Math.floor((e.clientX - box.left) / box.width * WIDTH), Math.floor((e.clientY - box.top) / box.height * HEIGHT));
  };
  const panel = (label: string, description: string, ref: RefObject<HTMLCanvasElement | null>, pixels: Uint8Array | undefined, coefficient = false) => {
    const value = pixels?.[index];
    return <section shuku-edit-id="e-22e7729a-33e8-4b36-8408-4d6d5858e336" className="di-arithmetic__panel"><Typography shuku-edit-id="e-b4ade1fd-758e-4fec-afd1-a1b31d85f120" as="h2" variant="h3" tone="accent" align="center">{label}</Typography><div shuku-edit-id="e-b868a120-1e72-4f17-92ed-3a1d198ed8d8" className="di-arithmetic__image" role="button" tabIndex={0} data-x={selected.x} data-y={selected.y} aria-label={`${label}：移动鼠标查看对应像素`} onPointerMove={move} onPointerDown={move} onKeyDown={e => { const delta = ({ ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] } as Record<string, number[]>)[e.key]; if (delta) { e.preventDefault(); select(selected.x + delta[0], selected.y + delta[1]); } }}><canvas shuku-edit-id="e-a944c78d-251c-41d7-8443-e7b3d0c6d2aa" ref={ref} width={WIDTH} height={HEIGHT} aria-label={`${label}灰度图像`} /><span shuku-edit-id="e-4ee75190-a135-41ef-8aae-6671108e54fa" className="di-arithmetic__scan" style={{ top: `${(selected.y + .5) / HEIGHT * 100}%` }} /><span shuku-edit-id="e-0f11d648-a924-473a-a174-f18d262e4620" className="di-arithmetic__selection" style={{ left: `${(selected.x + .5) / WIDTH * 100}%`, top: `${(selected.y + .5) / HEIGHT * 100}%` }} /><div shuku-edit-id="e-95fc2073-768d-4d05-98c8-2943b600c46f" className="di-arithmetic__pixel-value" style={{ left: `clamp(48px, ${(selected.x + .5) / WIDTH * 100}%, calc(100% - 48px))`, top: `min(calc(${(selected.y + .5) / HEIGHT * 100}% + 17px), calc(100% - 42px))` }}><Typography shuku-edit-id="e-899cd6cd-618f-4bef-834a-4759754d242f" variant="bodySmall" tone="accent">{value === undefined ? '—' : coefficient ? (value / 255).toFixed(2) : value}</Typography></div></div><Typography shuku-edit-id="e-adb31100-d222-434e-b318-e228a0424159" variant="bodySmall" tone="muted" align="center">{description}</Typography></section>;
  };
  return <ContentBlock shuku-edit-id="e-5e9aee3b-8963-419b-9776-8d16fe20e99c" className="di-arithmetic" title="图像也可以做加减乘除" subtitle="在同一个位置，对两幅图的像素值进行运算。" headingLevel={1}><div shuku-edit-id="e-d0ac5bf0-2c52-4395-bace-1d6006466cb9" className="di-arithmetic__body" data-ready={!!arrays}><div shuku-edit-id="e-8b804ee3-81b5-4aa4-a480-5415b867dc5c" className="di-arithmetic__tabs" role="group" aria-label="选择图像运算">{operations.map(([id, label]) => <button shuku-edit-id="e-ef9a42d3-247e-47c6-94b2-5a6a53bc84b4" key={id} type="button" aria-pressed={operation === id} className={operation === id ? 'is-selected' : ''} onClick={() => { setOperation(id); setBlend(false); }}><Typography shuku-edit-id="e-bbe82c42-49af-42bd-9527-2736ba644875" variant="bodySmall" tone="inherit">{label}</Typography></button>)}</div><div shuku-edit-id="e-5d4fed66-d9a2-4470-b432-a6e58b79334f" className="di-arithmetic__images">{panel('图像 A', descriptions[0], aCanvas, arrays?.a)}<Typography shuku-edit-id="e-256f5abd-f69e-4ae1-884f-2a3a260ae55c" variant="h3" tone="accent" align="center">{operation === 'subtract' ? '−' : operation === 'multiply' ? '×' : operation === 'divide' ? '÷' : '+'}</Typography>{panel('图像 B', descriptions[1], bCanvas, arrays?.b, operation === 'multiply' || operation === 'divide')}<Typography shuku-edit-id="e-f8507a79-5c49-4ea7-82e2-11a661fcd6ef" variant="h3" tone="accent" align="center">=</Typography>{panel('结果图', descriptions[2], resultCanvas, arrays?.result)}</div><footer shuku-edit-id="e-869ccce5-267d-4a5d-b441-5aaec7c1274f" className="di-arithmetic__explanation"><div shuku-edit-id="e-d086c0ac-b38b-4a45-86af-c00e18ffc39b"><Typography shuku-edit-id="e-3b58ff53-e96e-4c6d-b607-8cb076e728bb" variant="body" tone="accent">{takeaway}</Typography><Typography shuku-edit-id="e-15d308e4-e63b-4241-9904-c753291d78e4" variant="bodySmall" tone="muted">{failed ? '图像加载失败，请刷新重试。' : note}</Typography></div><div shuku-edit-id="e-86506a28-3d6d-4177-8fad-029faf36700f" className="di-arithmetic__controls">{operation === 'add' ? <><button shuku-edit-id="e-ad890043-af61-40c9-bdbe-0841118fd365" type="button" aria-pressed={blend} onClick={() => setBlend(v => !v)}><Typography shuku-edit-id="e-0a03ae7e-ac83-4390-b69c-a6c460245766" variant="bodySmall" tone="accent">{blend ? '回到直接相加' : '试试融合'}</Typography></button>{blend && <label shuku-edit-id="e-856a9d3a-58eb-4603-951d-b905c0e0ffe7"><Typography shuku-edit-id="e-4f7c7185-9a43-490d-a867-81724e552585" variant="bodySmall" tone="muted">背景与猫咪的占比</Typography><input shuku-edit-id="e-23e1034d-da7b-4828-aa44-45ba76b4e6da" type="range" min="0" max="1" step="0.01" aria-label="融合权重" value={alpha} onChange={e => setAlpha(Number(e.target.value))} /></label>}</> : operation === 'subtract' ? <button shuku-edit-id="e-8ab03aa1-9451-4f04-a214-2826906a0524" type="button" onClick={() => setOperation('add')}><Typography shuku-edit-id="e-cf8d0fa5-8065-47c5-96d5-970fd83c3374" variant="bodySmall" tone="accent">再看加法</Typography></button> : <div shuku-edit-id="e-b81de1d3-d130-4c3b-9e7d-27dab296727d" className="di-arithmetic__regions" role="group" aria-label="选择掩膜区域">{regions.map((region, i) => <button shuku-edit-id="e-6df6b480-8b14-4eb1-9881-1ed862446f5f" key={region.id} type="button" aria-pressed={enabled[i]} className={enabled[i] ? 'is-selected' : ''} onClick={() => setEnabled(v => v.map((old, j) => j === i ? !old : old))}><Typography shuku-edit-id="e-78243950-ddf1-4ac2-987c-7367d5790ab2" variant="bodySmall" tone="inherit">{region.label}</Typography></button>)}</div>}</div></footer></div></ContentBlock>;
}
