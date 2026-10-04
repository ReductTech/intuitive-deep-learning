import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { Button, ContentBlock, moduleAssetUrl, Typography } from '../../../shared/react';
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
  { label: '7', src: moduleAssetUrl(ASSET_ID, 'mnist/7/60000.png') },
  { label: '2', src: moduleAssetUrl(ASSET_ID, 'mnist/2/60035.png') },
  { label: '6', src: moduleAssetUrl(ASSET_ID, 'mnist/6/60011.png') },
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
  return <div className="min-w-0">
    <svg viewBox="0 0 320 244" className="mx-auto block h-[250px] w-full max-w-full" role="img" aria-label={`展平后的 ${dimension} 项特征连接到 10 个输出类别；图中只画出部分节点`}>
      <g stroke="#a5b8d2" strokeWidth="1.2" opacity=".55">
        {inputY.flatMap((from, input) => outputY.map((to, output) => <line key={`${input}-${output}`} x1="55" y1={from} x2="265" y2={to} />))}
      </g>
      {inputY.map((y, index) => <circle key={`i-${index}`} cx="55" cy={y} r="11" fill="#e9f2ff" stroke="#3571bc" strokeWidth="2" />)}
      {outputY.map((y, index) => <circle key={`o-${index}`} cx="265" cy={y} r="8" fill="#fff0e8" stroke="#ee7742" strokeWidth="2" />)}
      <circle cx="55" cy="229" r="2" fill="#355a8b" />
      <circle cx="55" cy="237" r="2" fill="#355a8b" />
      
      
    </svg>
    <div className="flex justify-between gap-[8px]">
      <Typography as="span" variant="bodySmall" tone="accent">输入</Typography>
      <Typography as="span" variant="bodySmall" tone="accent">输出</Typography>
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
  return <div ref={surface} className="vfl-fixed-pile" tabIndex={0} role="group" aria-label={label} onKeyDown={event => { if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); onTurn(event.key === 'ArrowDown' ? 1 : -1); } }}>
    <Button className="vfl-fixed-pile-arrow" disabled={count < 2} aria-label={`上一张${label.startsWith('卷积核') ? '卷积核' : '特征图'}`} onClick={() => onTurn(-1)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 15 6-6 6 6"/></svg></Button>
    <div className="vfl-fixed-pile-stack">
      {count > 1 && <div className="vfl-fixed-pile-ghost before" aria-hidden="true">{cards[count-1]}</div>}
      <div key={turn} className={`vfl-fixed-pile-front${turn ? ' turning' : ''}`}>{children}</div>
      {count > 1 && <div className="vfl-fixed-pile-ghost after" aria-hidden="true">{cards[1]}</div>}
    </div>
    <Button className="vfl-fixed-pile-arrow" disabled={count < 2} aria-label={`下一张${label.startsWith('卷积核') ? '卷积核' : '特征图'}`} onClick={() => onTurn(1)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></Button>
  </div>;
}

function KernelCard({ kernel }: { kernel: Kernel }) { return <div className="vfl-fixed-kernel">{kernel.matrix.flat().map((value,i)=><Typography as="span" variant="bodySmall" tone={value>0 ? 'accent' : value<0 ? 'danger' : 'muted'} key={i}>{Number.isInteger(value) ? value : value.toFixed(2)}</Typography>)}</div>; }
function MapCard({ map, label }: { map: number[][]; label: string }) { const max = Math.max(.001,...map.flat()); return <div className="vfl-fixed-map" role="img" aria-label={`${label}卷积核的真实池化响应图`}>{map.flat().map((value,i)=><span key={i} style={{backgroundColor:`rgba(231,96,35,${value/max})`}}/>)}</div>; }
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

  return <ContentBlock className="vfl-fixed-page" headingLevel={1} title="固定卷积特征的数字分类" subtitle="用固定卷积核描述笔画的局部结构，再训练分类器学习特征与数字类别的关系。">
    <div className="vfl-fixed-toolbar">
      <Button variant="primary" disabled={training} loading={training} onClick={train}><Typography as="span" variant="body" tone="inherit">{training ? '训练中…' : '训练分类器'}</Typography></Button>
      <Typography variant="bodySmall" tone="muted">多选卷积核</Typography>
      <div className="vfl-fixed-tags" role="group" aria-label="选择固定卷积核">{KERNELS.map(kernel=><Button key={kernel.id} variant={selected.includes(kernel.id) ? 'primary' : 'default'} active={selected.includes(kernel.id)} aria-pressed={selected.includes(kernel.id)} onClick={()=>toggleKernel(kernel.id)}><Typography as="span" variant="bodySmall" tone="inherit">{kernel.name}</Typography></Button>)}</div>
      <div className="vfl-fixed-metric"><Typography variant="bodySmall" tone="accent">训练 ACC</Typography><Typography variant="body" tone="accent">{result ? percent(result.train_accuracy) : '—'}</Typography></div>
      <div className="vfl-fixed-metric"><Typography variant="bodySmall" tone="success">验证 ACC</Typography><Typography variant="body" tone="success">{result ? percent(result.val_accuracy) : '—'}</Typography></div>
    </div>
    <div className="vfl-fixed-flow">
      <section className="vfl-fixed-stage vfl-fixed-extraction" aria-label="固定卷积特征提取">
        <div className="vfl-fixed-heading"><Typography as="span" variant="bodySmall" tone="inherit">1</Typography><Typography as="h2" variant="h3" tone="accent">特征提取</Typography></div>
        <div className="vfl-fixed-extraction-row">
          <div className="vfl-fixed-object">
            <canvas ref={canvasRef} width={DRAW_SIZE} height={DRAW_SIZE} tabIndex={0} onPointerDown={beginDrawing} onPointerMove={continueDrawing} onPointerUp={endDrawing} onPointerCancel={endDrawing} aria-label="手写数字画布；按住鼠标书写"/>
            <Typography variant="bodySmall" tone="muted">{sample === '手写' ? '手写输入' : `MNIST 数字 ${sample}`}</Typography><div className="vfl-fixed-input-actions"><Button onClick={()=>loadSample(SAMPLES[(SAMPLES.findIndex(item=>item.label===sample)+1)%SAMPLES.length])}><Typography as="span" variant="bodySmall" tone="inherit">切换</Typography></Button><Button onClick={clearDrawing}><Typography as="span" variant="bodySmall" tone="inherit">清空</Typography></Button></div>
          </div>
          <span className="vfl-fixed-arrow" aria-hidden="true"/>
          <div className="vfl-fixed-object">
            <FeaturePile cards={displayKernels.map(kernel=><KernelCard key={kernel.id} kernel={kernel}/>)} count={selected.length} onTurn={turnPile} turn={pileTurn} label="卷积核卡堆；滚轮或上下方向键切换"><KernelCard kernel={activeKernel}/><Typography variant="bodySmall" tone="accent">{activeKernel.name}</Typography></FeaturePile>
            
          </div>
          <span className="vfl-fixed-arrow" aria-hidden="true"/>
          <div className="vfl-fixed-object">
            <FeaturePile cards={displayKernels.map(kernel=><MapCard key={kernel.id} map={maps[kernel.id]} label={kernel.name}/>)} count={selected.length} onTurn={turnPile} turn={pileTurn} label="特征图卡堆；滚轮或上下方向键切换"><MapCard map={activeMap} label={activeKernel.name}/><Typography variant="bodySmall" tone="accent">{activeKernel.name}</Typography></FeaturePile>
            
          </div>
        </div>
        
      </section>
      <span className="vfl-fixed-arrow" aria-hidden="true"/>
      <section className="vfl-fixed-stage vfl-fixed-classifier" aria-label="后端分类器"><div className="vfl-fixed-heading"><Typography as="span" variant="bodySmall" tone="inherit">2</Typography><Typography as="h2" variant="h3" tone="accent">分类器</Typography></div><div className="vfl-fixed-diagram"><ClassifierDiagram dimension={dimension}/></div></section>
      <span className="vfl-fixed-arrow" aria-hidden="true"/>
      <section className="vfl-fixed-stage vfl-fixed-results" aria-label="分类结果"><div className="vfl-fixed-heading"><Typography as="span" variant="bodySmall" tone="inherit">3</Typography><Typography as="h2" variant="h3" tone="accent">数字类别</Typography></div><div className="vfl-fixed-probabilities">{Array.from({length:10},(_,category)=><div key={category}><Typography as="span" variant="bodySmall" tone="accent">{category}</Typography><span className="vfl-fixed-track"><span style={{width:`${(probabilities?.[category] ?? 0)*100}%`}}/></span><Typography as="span" variant="bodySmall" tone="muted">{probabilities ? percent(probabilities[category] ?? 0) : '—'}</Typography></div>)}</div><div className="vfl-fixed-prediction" aria-live="polite"><Typography variant="body" tone="accent">预测：{prediction<0 ? '等待训练' : prediction}</Typography></div></section>
    </div>
    <div className="vfl-fixed-note">{error ? <Typography variant="bodySmall" tone="danger" role="alert">{error}</Typography> : <><Typography variant="bodySmall" tone="accent">固定卷积核提取局部特征；训练仅更新分类器参数。</Typography><Typography variant="bodySmall" tone="muted">28×28 图像经卷积与 ReLU 得到 26×26 响应，再分区取平均，形成 8×8 特征图。</Typography></>}</div>
  </ContentBlock>;
}
