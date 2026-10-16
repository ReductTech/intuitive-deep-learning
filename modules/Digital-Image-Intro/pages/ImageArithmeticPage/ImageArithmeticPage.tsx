import moduleAssetOutline from '../../outlines.json';
import { moduleAssetUrl } from '../../../shared/react/assets';
import { useEffect, useMemo, useRef, useState, type RefObject, type PointerEvent } from 'react';
import { ContentBlock, Typography } from '../../../shared/react';
import { calculate, clip, HEIGHT, makeRegionMask, regions, WIDTH, type Operation } from './arithmeticModel';
import './ImageArithmeticPage.css';
const background = moduleAssetUrl(moduleAssetOutline.moduleIdentity.id, 'images/arithmetic-table-background.png');
const catPhoto = moduleAssetUrl(moduleAssetOutline.moduleIdentity.id, 'images/digital-image-cat-cutout.png');
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
    return <section className="di-arithmetic__panel"><Typography as="h2" variant="h3" tone="accent" align="center">{label}</Typography><div className="di-arithmetic__image" role="button" tabIndex={0} data-x={selected.x} data-y={selected.y} aria-label={`${label}：移动鼠标查看对应像素`} onPointerMove={move} onPointerDown={move} onKeyDown={e => { const delta = ({ ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] } as Record<string, number[]>)[e.key]; if (delta) { e.preventDefault(); select(selected.x + delta[0], selected.y + delta[1]); } }}><canvas ref={ref} width={WIDTH} height={HEIGHT} aria-label={`${label}灰度图像`} /><span className="di-arithmetic__scan" style={{ top: `${(selected.y + .5) / HEIGHT * 100}%` }} /><span className="di-arithmetic__selection" style={{ left: `${(selected.x + .5) / WIDTH * 100}%`, top: `${(selected.y + .5) / HEIGHT * 100}%` }} /><div className="di-arithmetic__pixel-value" style={{ left: `clamp(48px, ${(selected.x + .5) / WIDTH * 100}%, calc(100% - 48px))`, top: `min(calc(${(selected.y + .5) / HEIGHT * 100}% + 17px), calc(100% - 42px))` }}><Typography variant="bodySmall" tone="accent">{value === undefined ? '—' : coefficient ? (value / 255).toFixed(2) : value}</Typography></div></div><Typography variant="bodySmall" tone="muted" align="center">{description}</Typography></section>;
  };
  return <ContentBlock className="di-arithmetic" title="图像也可以做加减乘除" subtitle="在同一个位置，对两幅图的像素值进行运算。" headingLevel={1}><div className="di-arithmetic__body" data-ready={!!arrays}><div className="di-arithmetic__tabs" role="group" aria-label="选择图像运算">{operations.map(([id, label]) => <button key={id} type="button" aria-pressed={operation === id} className={operation === id ? 'is-selected' : ''} onClick={() => { setOperation(id); setBlend(false); }}><Typography variant="bodySmall" tone="inherit">{label}</Typography></button>)}</div><div className="di-arithmetic__images">{panel('图像 A', descriptions[0], aCanvas, arrays?.a)}<Typography variant="h3" tone="accent" align="center">{operation === 'subtract' ? '−' : operation === 'multiply' ? '×' : operation === 'divide' ? '÷' : '+'}</Typography>{panel('图像 B', descriptions[1], bCanvas, arrays?.b, operation === 'multiply' || operation === 'divide')}<Typography variant="h3" tone="accent" align="center">=</Typography>{panel('结果图', descriptions[2], resultCanvas, arrays?.result)}</div><footer className="di-arithmetic__explanation"><div><Typography variant="body" tone="accent">{takeaway}</Typography><Typography variant="bodySmall" tone="muted">{failed ? '图像加载失败，请刷新重试。' : note}</Typography></div><div className="di-arithmetic__controls">{operation === 'add' ? <><button type="button" aria-pressed={blend} onClick={() => setBlend(v => !v)}><Typography variant="bodySmall" tone="accent">{blend ? '回到直接相加' : '试试融合'}</Typography></button>{blend && <label><Typography variant="bodySmall" tone="muted">背景与猫咪的占比</Typography><input type="range" min="0" max="1" step="0.01" aria-label="融合权重" value={alpha} onChange={e => setAlpha(Number(e.target.value))} /></label>}</> : operation === 'subtract' ? <button type="button" onClick={() => setOperation('add')}><Typography variant="bodySmall" tone="accent">再看加法</Typography></button> : <div className="di-arithmetic__regions" role="group" aria-label="选择掩膜区域">{regions.map((region, i) => <button key={region.id} type="button" aria-pressed={enabled[i]} className={enabled[i] ? 'is-selected' : ''} onClick={() => setEnabled(v => v.map((old, j) => j === i ? !old : old))}><Typography variant="bodySmall" tone="inherit">{region.label}</Typography></button>)}</div>}</div></footer></div></ContentBlock>;
}
