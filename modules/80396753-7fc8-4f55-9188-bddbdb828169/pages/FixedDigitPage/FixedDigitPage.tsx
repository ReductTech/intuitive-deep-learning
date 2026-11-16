import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { Button, ContentBlock, Typography } from "@shuku/course-style/react";
import './FixedDigitPage.css';
import { trainFixedDigitClassifier, type Classifier, type KernelId, type TrainResult } from '../../services/fixedDigitClassifier';

const ASSET_ID = '80396753-7fc8-4f55-9188-bddbdb828169';
const SIZE = 28;
const DRAW_SIZE = 336;
type Pixels = number[][];
type Kernel = { id: KernelId; name: string; matrix: number[][] };

const KERNELS: Kernel[] = [
  { id: 'edge', name: '边缘', matrix: [[-1, -1, -1], [-1, 8, -1], [-1, -1, -1]] },
  { id: 'vertical', name: '竖边', matrix: [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]] },
  { id: 'horizontal', name: '横边', matrix: [[-1, -2, -1], [0, 0, 0], [1, 2, 1]] },
  { id: 'corner', name: '角点检测', matrix: [[1, -2, 1], [-2, 4, -2], [1, -2, 1]] },
];
const SAMPLES = [
  { label: '7', src: moduleAssetUrl('mnist/7/60000.jpg') },
  { label: '2', src: moduleAssetUrl('mnist/2/60035.jpg') },
  { label: '6', src: moduleAssetUrl('mnist/6/60011.jpg') },
];
const emptyPixels = (): Pixels => Array.from({ length: SIZE }, () => Array(SIZE).fill(0) as number[]);
const percent = (value: number) => `${(value * 100).toFixed(1)}%`;

function readPixels(canvas: HTMLCanvasElement): Pixels {
  const small = document.createElement('canvas');
  small.width = SIZE;
  small.height = SIZE;
  const context = small.getContext('2d', { willReadFrequently: true });
  if (!context) return emptyPixels();
  context.drawImage(canvas, 0, 0, SIZE, SIZE);
  const data = context.getImageData(0, 0, SIZE, SIZE).data;
  return Array.from({ length: SIZE }, (_, row) => Array.from({ length: SIZE }, (_, col) => {
    const offset = (row * SIZE + col) * 4;
    return (data[offset] + data[offset + 1] + data[offset + 2]) / (3 * 255);
  }));
}

/** 3×3 valid correlation, ReLU, then area-average from 26×26 to 8×8. */
function featureMap(image: Pixels, matrix: number[][]): number[][] {
  const response = Array.from({ length: 26 }, (_, row) => Array.from({ length: 26 }, (_, col) => {
    let sum = 0;
    for (let ky = 0; ky < 3; ky += 1) for (let kx = 0; kx < 3; kx += 1) sum += image[row + ky][col + kx] * matrix[ky][kx];
    return Math.max(0, sum);
  }));
  return Array.from({ length: 8 }, (_, row) => Array.from({ length: 8 }, (_, col) => {
    const y0 = Math.floor(row * 26 / 8);
    const y1 = Math.floor((row + 1) * 26 / 8);
    const x0 = Math.floor(col * 26 / 8);
    const x1 = Math.floor((col + 1) * 26 / 8);
    let sum = 0;
    for (let y = y0; y < y1; y += 1) for (let x = x0; x < x1; x += 1) sum += response[y][x];
    return sum / ((y1 - y0) * (x1 - x0));
  }));
}

function predict(classifier: Classifier, maps: Record<KernelId, number[][]>): number[] | null {
  const features = classifier.kernels.flatMap((id) => maps[id].flat());
  if (features.length !== classifier.mean.length || features.length !== classifier.std.length || features.length !== classifier.weights.length) return null;
  const logits = classifier.bias.map((bias, category) => features.reduce((sum, value, index) =>
    sum + ((value - classifier.mean[index]) / classifier.std[index]) * (classifier.weights[index]?.[category] ?? 0), bias));
  const largest = Math.max(...logits);
  const exponentials = logits.map((value) => Math.exp(value - largest));
  const total = exponentials.reduce((sum, value) => sum + value, 0);
  return exponentials.map((value) => value / total);
}

function ClassifierDiagram({ dimension }: { dimension: number }) {
  const inputY = [38, 80, 122, 164, 206];
  const outputY = Array.from({length:10},(_,i)=>20+i*22);
  return <div shuku-edit-id="e-77ab9c63-fcfd-4935-be55-90abe0cdd75b" className="min-w-0">
    <svg shuku-edit-id="e-2d0251dd-71cb-4d8f-99f7-ae4c4d1805a6" viewBox="0 0 320 244" className="mx-auto block h-[250px] w-full max-w-full" role="img" aria-label={`展平后的 ${dimension} 项特征连接到 10 个输出类别；图中只画出部分节点`}>
      <g shuku-edit-id="e-9603dfc8-7017-407a-9fa9-af9826d0a384" stroke="#a5b8d2" strokeWidth="1.2" opacity=".55">
        {inputY.flatMap((from, input) => outputY.map((to, output) => <line shuku-edit-id="e-4f7413f8-05ae-4313-a62a-e0127b1b3b0d" key={`${input}-${output}`} x1="55" y1={from} x2="265" y2={to} />))}
      </g>
      {inputY.map((y, index) => <circle shuku-edit-id="e-f77ea714-b71e-4ebc-ba7a-f8f39768a63a" key={`i-${index}`} cx="55" cy={y} r="11" fill="#e9f2ff" stroke="#3571bc" strokeWidth="2" />)}
      {outputY.map((y, index) => <circle shuku-edit-id="e-8f29e47e-27df-48cc-bd56-ad5e73b9af30" key={`o-${index}`} cx="265" cy={y} r="8" fill="#fff0e8" stroke="#ee7742" strokeWidth="2" />)}
      <circle shuku-edit-id="e-2915270a-d55a-4ef0-a5f2-08808d73a6d3" cx="55" cy="229" r="2" fill="#355a8b" />
      <circle shuku-edit-id="e-dbef8eb9-b6f1-42ef-996b-b0ed14ddd1f2" cx="55" cy="237" r="2" fill="#355a8b" />


    </svg>
    <div shuku-edit-id="e-fbf361af-e4e6-4b40-8841-5b89f1ad5f88" className="flex justify-between gap-[8px]">
      <Typography shuku-edit-id="e-8adb0402-1a02-4bb4-94e0-a82fac3d20c6" as="span" variant="bodySmall" tone="accent">输入</Typography>
      <Typography shuku-edit-id="e-514daaa0-e2be-45fe-985a-f60ede9e15dd" as="span" variant="bodySmall" tone="accent">输出</Typography>
    </div>
  </div>;
}

function FeaturePile({ children, cards, count, onTurn, turn, label }: { children: React.ReactNode; cards: React.ReactNode[]; count: number; onTurn: (direction: number) => void; turn: number; label: string }) {
  const surface = useRef<HTMLDivElement>(null);
  const lastWheel = useRef(0);
  useEffect(() => {
    const element = surface.current;
    if (!element) return;
    const wheel = (event: WheelEvent) => {
      if (count < 2 || Math.abs(event.deltaY) < 3) return;
      event.preventDefault();
      if (Date.now() - lastWheel.current < 420) return;
      lastWheel.current = Date.now();
      onTurn(event.deltaY > 0 ? 1 : -1);
    };
    element.addEventListener('wheel', wheel, { passive: false });
    return () => element.removeEventListener('wheel', wheel);
  }, [count, onTurn]);
  return <div shuku-edit-id="e-e3c6eea6-6dec-4db1-a261-9ed397c6d0c9" ref={surface} className="vfl-fixed-pile" tabIndex={0} role="group" aria-label={label} onKeyDown={event => { if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); onTurn(event.key === 'ArrowDown' ? 1 : -1); } }}>
    <Button className="vfl-fixed-pile-arrow" disabled={count < 2} aria-label={`上一张${label.startsWith('卷积核') ? '卷积核' : '特征图'}`} onClick={() => onTurn(-1)}><svg shuku-edit-id="e-ccffbfe2-2467-4e1f-acec-026cdecac19c" viewBox="0 0 24 24" aria-hidden="true"><path shuku-edit-id="e-159d351f-8fe7-4e2f-a947-d2888c1ffb0a" d="m6 15 6-6 6 6"/></svg></Button>
    <div shuku-edit-id="e-b367a3ce-351d-4ae8-b7ef-23de9628e5bd" className="vfl-fixed-pile-stack">
      {count > 1 && <div shuku-edit-id="e-113a04bb-863f-4450-a16d-6d5895eb7858" className="vfl-fixed-pile-ghost before" aria-hidden="true">{cards[count-1]}</div>}
      <div shuku-edit-id="e-ec3d115b-1457-408c-ab24-a0ec9c5f7e5e" key={turn} className={`vfl-fixed-pile-front${turn ? ' turning' : ''}`}>{children}</div>
      {count > 1 && <div shuku-edit-id="e-2768f6f8-d791-4777-9515-8c090634c5a0" className="vfl-fixed-pile-ghost after" aria-hidden="true">{cards[1]}</div>}
    </div>
    <Button className="vfl-fixed-pile-arrow" disabled={count < 2} aria-label={`下一张${label.startsWith('卷积核') ? '卷积核' : '特征图'}`} onClick={() => onTurn(1)}><svg shuku-edit-id="e-a33b3a5b-46f9-42c1-9d6c-ea25e505425d" viewBox="0 0 24 24" aria-hidden="true"><path shuku-edit-id="e-bc88de3f-e861-4c99-82f0-60b1b7d4e7a1" d="m6 9 6 6 6-6"/></svg></Button>
  </div>;
}

function KernelCard({ kernel }: { kernel: Kernel }) { return <div shuku-edit-id="e-d55beb3b-2a46-4e00-b3b4-6cbc51c456c2" className="vfl-fixed-kernel">{kernel.matrix.flat().map((value,i)=><Typography shuku-edit-id="e-69a1f1dd-974f-498a-817d-442bf2546527" as="span" variant="bodySmall" tone={value>0 ? 'accent' : value<0 ? 'danger' : 'muted'} key={i}>{Number.isInteger(value) ? value : value.toFixed(2)}</Typography>)}</div>; }
function MapCard({ map, label }: { map: number[][]; label: string }) { const max = Math.max(.001,...map.flat()); return <div shuku-edit-id="e-37651d38-4c39-4047-abfd-896067c9f64b" className="vfl-fixed-map" role="img" aria-label={`${label}卷积核的真实池化响应图`}>{map.flat().map((value,i)=><span shuku-edit-id="e-303228f2-d54d-4442-97f5-2af57fde02a5" key={i} style={{backgroundColor:`rgba(231,96,35,${value/max})`}}/>)}</div>; }
export function FixedDigitPage() {
  const [pileIndex, setPileIndex] = useState(0);
  const [pileTurn, setPileTurn] = useState(0);
  const abortRef = useRef<AbortController | null>(null);
  useEffect(() => () => abortRef.current?.abort(), []);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const requestRef = useRef(0);
  const [pixels, setPixels] = useState<Pixels>(emptyPixels);
  const [sample, setSample] = useState('7');
  const [selected, setSelected] = useState<KernelId[]>(['edge']);
  const [result, setResult] = useState<TrainResult | null>(null);
  const [training, setTraining] = useState(false);
  const [error, setError] = useState('');
  const [hasInk, setHasInk] = useState(false);

  const loadSample = useCallback((digit: typeof SAMPLES[number]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      const context = canvas.getContext('2d');
      if (!context) return;
      context.imageSmoothingEnabled = false;
      context.fillStyle = '#000';
      context.fillRect(0, 0, DRAW_SIZE, DRAW_SIZE);
      context.drawImage(image, 0, 0, DRAW_SIZE, DRAW_SIZE);
      setPixels(readPixels(canvas));
      setSample(digit.label);
      setHasInk(true);
      setError('');
    };
    image.onerror = () => setError('MNIST 样本加载失败。');
    image.src = digit.src;
  }, []);
  useEffect(() => { loadSample(SAMPLES[0]); }, [loadSample]);

  const maps = useMemo(() => Object.fromEntries(KERNELS.map((kernel) => [kernel.id, featureMap(pixels, kernel.matrix)])) as Record<KernelId, number[][]>, [pixels]);
  const selectedKernels = KERNELS.filter(kernel => selected.includes(kernel.id));
  const cardIndex = pileIndex % selectedKernels.length;
  const displayKernels = [...selectedKernels.slice(cardIndex), ...selectedKernels.slice(0, cardIndex)];
  const activeKernel = displayKernels[0];
  const turnPile = useCallback((direction: number) => { setPileIndex(index => (index + direction + selected.length) % selected.length); setPileTurn(turn => turn + 1); }, [selected.length]);
  const activeMap = maps[activeKernel.id];
  const dimension = selected.length * 64;
  const probabilities = useMemo(() => result && hasInk ? predict(result.classifier, maps) : null, [result, hasInk, maps]);
  const prediction = probabilities ? probabilities.indexOf(Math.max(...probabilities)) : -1;

  function toggleKernel(id: KernelId) {
    setSelected((current) => {
      if (current.includes(id) && current.length === 1) return current;
      return current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
    });
    abortRef.current?.abort();
    setPileIndex(0);
    requestRef.current += 1;
    setResult(null);
    setTraining(false);
    setError('');
  }

  function point(event: ReactPointerEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: (event.clientX - rect.left) * DRAW_SIZE / rect.width, y: (event.clientY - rect.top) * DRAW_SIZE / rect.height };
  }
  function beginDrawing(event: ReactPointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;
    canvas.setPointerCapture(event.pointerId);
    if (sample !== '手写') {
      context.fillStyle = '#000';
      context.fillRect(0, 0, DRAW_SIZE, DRAW_SIZE);
      setSample('手写');
    }
    const at = point(event);
    context.fillStyle = '#f7fbff';
    context.beginPath();
    context.arc(at.x, at.y, 16, 0, 2 * Math.PI);
    context.fill();
    lastPointRef.current = at;
    drawingRef.current = true;
    setHasInk(true);
    setPixels(readPixels(canvas));
  }
  function continueDrawing(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return;
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;
    const at = point(event);
    const previous = lastPointRef.current ?? at;
    context.strokeStyle = '#f7fbff';
    context.lineWidth = 30;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.beginPath();
    context.moveTo(previous.x, previous.y);
    context.lineTo(at.x, at.y);
    context.stroke();
    lastPointRef.current = at;
    setPixels(readPixels(canvas));
  }
  function endDrawing() { drawingRef.current = false; lastPointRef.current = null; }
  function clearDrawing() {
    const context = canvasRef.current?.getContext('2d');
    if (!context) return;
    context.fillStyle = '#000';
    context.fillRect(0, 0, DRAW_SIZE, DRAW_SIZE);
    setPixels(emptyPixels());
    setSample('手写');
    setHasInk(false);
    setError('');
    canvasRef.current?.focus();
  }
  async function train() {
    if (training) return;
    const request = ++requestRef.current;
    setTraining(true);
    setError('');
    try {
      const abort = new AbortController(); abortRef.current = abort;
      const trained = await trainFixedDigitClassifier(selected, abort.signal);
      if (request === requestRef.current) setResult(trained);
    } catch (reason) {
      if (request === requestRef.current) setError(`训练失败：${reason instanceof Error ? reason.message : '未知错误'}`);
    } finally {
      if (request === requestRef.current) setTraining(false);
    }
  }

  return <ContentBlock shuku-edit-id="e-c6303c16-8701-432f-bded-4bc6664414c2" className="vfl-fixed-page" headingLevel={1} title="固定卷积特征的数字分类" subtitle="用固定卷积核描述笔画的局部结构，再训练分类器学习特征与数字类别的关系。">
    <div shuku-edit-id="e-87caa88b-7b71-4010-80b2-fab30641598d" className="vfl-fixed-toolbar">
      <Button variant="primary" disabled={training} loading={training} onClick={train}><Typography shuku-edit-id="e-9c5a830a-fd28-4ca0-b762-f64dc5bda68e" as="span" variant="body" tone="inherit">{training ? '回放中…' : '训练分类器'}</Typography></Button>
      <Typography shuku-edit-id="e-853cd5f2-a0df-475d-8c04-8b299ba5e10e" variant="bodySmall" tone="muted">多选卷积核</Typography>
      <div shuku-edit-id="e-eeb47298-2699-46df-87fc-ab0908fc538d" className="vfl-fixed-tags" role="group" aria-label="选择固定卷积核">{KERNELS.map(kernel=><Button key={kernel.id} variant={selected.includes(kernel.id) ? 'primary' : 'default'} active={selected.includes(kernel.id)} aria-pressed={selected.includes(kernel.id)} onClick={()=>toggleKernel(kernel.id)}><Typography shuku-edit-id="e-32e0f79f-ef7d-4452-8325-0aeacd3b63ac" as="span" variant="bodySmall" tone="inherit">{kernel.name}</Typography></Button>)}</div>
      <div shuku-edit-id="e-14c1d2f0-dc07-4d96-8bd9-1b6a19a5d2a3" className="vfl-fixed-metric"><Typography shuku-edit-id="e-1da5debc-e593-4518-b48b-690f0816bc62" variant="bodySmall" tone="accent">训练 ACC</Typography><Typography shuku-edit-id="e-a8262c46-5fb4-47bd-ba8a-374474b3f9ce" variant="body" tone="accent">{result ? percent(result.train_accuracy) : '—'}</Typography></div>
      <div shuku-edit-id="e-6f68c0af-777b-4f46-a1d5-9574ce8d5b6b" className="vfl-fixed-metric"><Typography shuku-edit-id="e-daed8f72-6e8b-43e5-9c8f-6aab7094d19a" variant="bodySmall" tone="success">验证 ACC</Typography><Typography shuku-edit-id="e-967ae4a8-50c5-4118-b1bd-25e6eac3b16e" variant="body" tone="success">{result ? percent(result.val_accuracy) : '—'}</Typography></div>
    </div>
    <div shuku-edit-id="e-cc4aa4af-1f8a-4bea-b088-0501ff31132a" className="vfl-fixed-flow">
      <section shuku-edit-id="e-38abb79e-2430-4411-b68b-3672f90877c7" className="vfl-fixed-stage vfl-fixed-extraction" aria-label="固定卷积特征提取">
        <div shuku-edit-id="e-210cc286-7e76-464d-8da4-5463a21b0639" className="vfl-fixed-heading"><Typography shuku-edit-id="e-2c9b8610-ffd1-4e57-84ff-668f6d7709ae" as="span" variant="bodySmall" tone="inherit">1</Typography><Typography shuku-edit-id="e-10505cd1-531b-459a-9297-7b440482d828" as="h2" variant="h3" tone="accent">特征提取</Typography></div>
        <div shuku-edit-id="e-5b9513f1-18a5-4247-b412-9c16b432acc6" className="vfl-fixed-extraction-row">
          <div shuku-edit-id="e-49079e1d-839d-416d-a06d-10b5e29b0382" className="vfl-fixed-object">
            <canvas shuku-edit-id="e-9c6a1c49-903a-4e79-919e-429d97b28033" ref={canvasRef} width={DRAW_SIZE} height={DRAW_SIZE} tabIndex={0} onPointerDown={beginDrawing} onPointerMove={continueDrawing} onPointerUp={endDrawing} onPointerCancel={endDrawing} aria-label="手写数字画布；按住鼠标书写"/>
            <Typography shuku-edit-id="e-686aa25c-5b94-4286-8cea-9eafec1d8a17" variant="bodySmall" tone="muted">{sample === '手写' ? '手写输入' : `MNIST 数字 ${sample}`}</Typography><div shuku-edit-id="e-f595ee94-092f-4a43-9ba2-67d316ecb635" className="vfl-fixed-input-actions"><Button onClick={()=>loadSample(SAMPLES[(SAMPLES.findIndex(item=>item.label===sample)+1)%SAMPLES.length])}><Typography shuku-edit-id="e-ad777018-731f-4c0e-badd-3530313e2f11" as="span" variant="bodySmall" tone="inherit">切换</Typography></Button><Button onClick={clearDrawing}><Typography shuku-edit-id="e-6b584d72-3865-4249-908d-a8c9523f89c6" as="span" variant="bodySmall" tone="inherit">清空</Typography></Button></div>
          </div>
          <span shuku-edit-id="e-f6c6ea78-b3bd-4b6c-bc7d-f16766518dd8" className="vfl-fixed-arrow" aria-hidden="true"/>
          <div shuku-edit-id="e-85db255f-9911-414d-b885-990bc2be6be3" className="vfl-fixed-object">
            <FeaturePile cards={displayKernels.map(kernel=><KernelCard key={kernel.id} kernel={kernel}/>)} count={selected.length} onTurn={turnPile} turn={pileTurn} label="卷积核卡堆；滚轮或上下方向键切换"><KernelCard kernel={activeKernel}/><Typography shuku-edit-id="e-b271e1bd-9607-4936-a414-3fe1f8f1e13a" variant="bodySmall" tone="accent">{activeKernel.name}</Typography></FeaturePile>

          </div>
          <span shuku-edit-id="e-018234a3-9223-494e-aaa1-344368b1419a" className="vfl-fixed-arrow" aria-hidden="true"/>
          <div shuku-edit-id="e-edaa6e3b-9e03-40bc-8b87-7206974bf20f" className="vfl-fixed-object">
            <FeaturePile cards={displayKernels.map(kernel=><MapCard key={kernel.id} map={maps[kernel.id]} label={kernel.name}/>)} count={selected.length} onTurn={turnPile} turn={pileTurn} label="特征图卡堆；滚轮或上下方向键切换"><MapCard map={activeMap} label={activeKernel.name}/><Typography shuku-edit-id="e-9deae728-4d26-40ea-8807-cf9ca1adab0b" variant="bodySmall" tone="accent">{activeKernel.name}</Typography></FeaturePile>

          </div>
        </div>

      </section>
      <span shuku-edit-id="e-c9027ec6-5633-475b-92f3-5da371469610" className="vfl-fixed-arrow" aria-hidden="true"/>
      <section shuku-edit-id="e-6f9b63c8-20c5-49aa-85d6-5e7a97728638" className="vfl-fixed-stage vfl-fixed-classifier" aria-label="后端分类器"><div shuku-edit-id="e-58aad3f5-de1f-4e66-995a-e99262ecae3a" className="vfl-fixed-heading"><Typography shuku-edit-id="e-917d8c1f-da3a-4837-a692-7be382d07b5e" as="span" variant="bodySmall" tone="inherit">2</Typography><Typography shuku-edit-id="e-86fa252f-7313-4bf5-974f-4c48e999e9f8" as="h2" variant="h3" tone="accent">分类器</Typography></div><div shuku-edit-id="e-b5d7b49f-19a6-4bc2-842b-2dc073d310ba" className="vfl-fixed-diagram"><ClassifierDiagram dimension={dimension}/></div></section>
      <span shuku-edit-id="e-ae4190ad-a24c-4a41-b593-8165a3106d59" className="vfl-fixed-arrow" aria-hidden="true"/>
      <section shuku-edit-id="e-afe704b5-f327-4a7d-b1c2-bb3fce2aa262" className="vfl-fixed-stage vfl-fixed-results" aria-label="分类结果"><div shuku-edit-id="e-89cb8095-23a6-4fd9-9bc4-3da2f39c504b" className="vfl-fixed-heading"><Typography shuku-edit-id="e-7bd63bbf-ec89-42c5-8310-7e17c70312e3" as="span" variant="bodySmall" tone="inherit">3</Typography><Typography shuku-edit-id="e-bb15d895-1f01-4169-9203-08fbd3952d12" as="h2" variant="h3" tone="accent">数字类别</Typography></div><div shuku-edit-id="e-fd9d9ad4-b5a3-447a-bd93-1a2426ff495e" className="vfl-fixed-probabilities">{Array.from({length:10},(_,category)=><div shuku-edit-id="e-f7f661f0-02da-485b-972c-ceae29d8260e" key={category}><Typography shuku-edit-id="e-0eaa1917-e192-4af4-98ae-6faf9c5b2cd4" as="span" variant="bodySmall" tone="accent">{category}</Typography><span shuku-edit-id="e-9979f583-a035-421f-8cdf-dc27132247eb" className="vfl-fixed-track"><span shuku-edit-id="e-3874dc0e-d3f1-4b20-adba-b0f534c91502" style={{width:`${(probabilities?.[category] ?? 0)*100}%`}}/></span><Typography shuku-edit-id="e-004d261c-2a32-465f-a334-a50f17de3f5d" as="span" variant="bodySmall" tone="muted">{probabilities ? percent(probabilities[category] ?? 0) : '—'}</Typography></div>)}</div><div shuku-edit-id="e-3232093e-1344-48db-a3a9-1a8239ccfd02" className="vfl-fixed-prediction" aria-live="polite"><Typography shuku-edit-id="e-8dfac5cd-9749-4fcc-8fac-77fd391c77c9" variant="body" tone="accent">预测：{prediction<0 ? '等待训练' : prediction}</Typography></div></section>
    </div>
    <div shuku-edit-id="e-b7998598-bd78-4e2a-80f5-c39318f5b893" className="vfl-fixed-note">{error ? <Typography shuku-edit-id="e-97e1177a-11f6-493d-8d58-b7588a7864d7" variant="bodySmall" tone="danger" role="alert">{error}</Typography> : <><Typography shuku-edit-id="e-b41849c9-faf6-417b-b751-ca950bde8c38" variant="bodySmall" tone="accent">固定卷积核提取局部特征；训练仅更新分类器参数。</Typography><Typography shuku-edit-id="e-15c85f26-04a7-4571-b9c3-1f943f301697" variant="bodySmall" tone="muted">28×28 图像经卷积与 ReLU 得到 26×26 响应，再分区取平均，形成 8×8 特征图。</Typography></>}</div>
  </ContentBlock>;
}
