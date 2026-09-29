import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';
import { Button, ContentBlock, moduleAssetUrl, Typography } from '../../../shared/react';
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
  { id: 'diag_down', name: '斜边 /', matrix: [[0, 1, 2], [-1, 0, 1], [-2, -1, 0]] },
  { id: 'diag_up', name: '斜边 \\', matrix: [[2, 1, 0], [1, 0, -1], [0, -1, -2]] },
  { id: 'center', name: '中心墨迹', matrix: [[0, 1 / 8, 0], [1 / 8, 4 / 8, 1 / 8], [0, 1 / 8, 0]] },
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
  const outputY = [38, 80, 122, 164, 206];
  return <div className="min-w-0">
    <svg viewBox="0 0 320 244" className="mx-auto block h-[250px] w-full max-w-full" role="img" aria-label={`展平后的 ${dimension} 项特征连接到 11 个输出类别；图中只画出部分节点`}>
      <g stroke="#a5b8d2" strokeWidth="1.2" opacity=".55">
        {inputY.flatMap((from, input) => outputY.map((to, output) => <line key={`${input}-${output}`} x1="55" y1={from} x2="265" y2={to} />))}
      </g>
      {inputY.map((y, index) => <circle key={`i-${index}`} cx="55" cy={y} r="11" fill="#e9f2ff" stroke="#3571bc" strokeWidth="2" />)}
      {outputY.map((y, index) => <circle key={`o-${index}`} cx="265" cy={y} r="11" fill="#fff0e8" stroke="#ee7742" strokeWidth="2" />)}
      <circle cx="55" cy="229" r="2" fill="#355a8b" />
      <circle cx="55" cy="237" r="2" fill="#355a8b" />
      <circle cx="265" cy="229" r="2" fill="#b45a32" />
      <circle cx="265" cy="237" r="2" fill="#b45a32" />
    </svg>
    <div className="flex justify-between gap-[8px]">
      <Typography as="span" variant="bodySmall" tone="accent">输入 · {dimension} 维</Typography>
      <Typography as="span" variant="bodySmall" tone="accent">输出 · 11 类</Typography>
    </div>
  </div>;
}

export function FixedDigitPage() {
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
  const activeKernel = KERNELS.find((kernel) => kernel.id === selected[selected.length - 1]) ?? KERNELS[0];
  const activeMap = maps[activeKernel.id];
  const mapMaximum = Math.max(0.001, ...activeMap.flat());
  const dimension = selected.length * 64;
  const probabilities = useMemo(() => result && hasInk ? predict(result.classifier, maps) : null, [result, hasInk, maps]);
  const prediction = probabilities ? probabilities.indexOf(Math.max(...probabilities)) : -1;

  function toggleKernel(id: KernelId) {
    setSelected((current) => {
      if (current.includes(id) && current.length === 1) return current;
      return current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
    });
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
    if (training || !hasInk) return;
    const request = ++requestRef.current;
    setTraining(true);
    setError('');
    try {
      const trained = await trainFixedDigitClassifier(selected, pixels);
      if (request === requestRef.current) setResult(trained);
    } catch (reason) {
      if (request === requestRef.current) setError(`训练失败：${reason instanceof Error ? reason.message : '未知错误'}`);
    } finally {
      if (request === requestRef.current) setTraining(false);
    }
  }

  return <ContentBlock
    className="box-border h-[900px] w-[1600px] overflow-hidden bg-[#fcfdff]"
    headingLevel={1}
    title="固定卷积特征的数字分类"
    subtitle="先用人工设计的固定卷积核提取局部特征，再训练后端分类器完成数字识别。"
  >
    <div className="mx-auto mt-[14px] flex h-[70px] w-[1430px] max-w-full items-center justify-between gap-[16px] rounded-[17px] border border-[#cee0f6] bg-[#f7fbff] px-[18px]">
      <Button variant="primary" loading={training} disabled={!result && !hasInk} onClick={result ? clearDrawing : train} className="!min-w-[174px] !rounded-[11px] !px-[19px]"><Typography as="span" variant="body" tone="inherit">{training ? '训练中…' : result ? '尝试手写' : '训练分类器'}</Typography></Button>
      <Typography as="span" variant="body" tone="accent" className="rounded-full bg-[#e5f1ff] px-[16px]">卷积核固定</Typography>
      <Typography as="span" variant="body" tone="accent">训练集 {result ? percent(result.train_accuracy) : '—'}</Typography>
      <Typography as="span" variant="body" tone="success">验证集 {result ? percent(result.val_accuracy) : '—'}</Typography>
    </div>
    <div className="mx-auto mt-[13px] grid h-[506px] w-[1430px] max-w-full gap-[12px]" style={{ gridTemplateColumns: 'minmax(0, 1.32fr) minmax(0, 1fr) minmax(0, .92fr)' }}>
      <section className="flex min-h-0 min-w-0 max-w-full flex-col rounded-[19px] border border-[#d4e5f8] bg-white p-[15px]" aria-label="固定卷积特征提取">
        <div className="flex items-center gap-[12px]"><span className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-full bg-[#2c69bf] text-white"><Typography as="span" variant="body" tone="inherit">1</Typography></span><Typography as="h2" variant="body" tone="accent" className="m-0 font-bold">固定卷积特征提取</Typography></div>
        <Typography as="p" variant="bodySmall" tone="muted" className="mb-0 mt-[2px]">卷积核由人设定，训练时数值不变。</Typography>
        <div className="mt-[9px] grid grid-cols-3 gap-[6px]" role="group" aria-label="选择固定卷积核">
          {KERNELS.map((kernel) => <Button key={kernel.id} variant="default" onClick={() => toggleKernel(kernel.id)} aria-pressed={selected.includes(kernel.id)} className={`!min-w-0 !rounded-[10px] !px-[5px] !py-[4px] ${selected.includes(kernel.id) ? '!border-[#8cb4e5] !bg-[#e9f2ff] !text-[#1e4d84]' : '!border-[#d3e0ee] !bg-white !text-[#547091]'}`}><Typography as="span" variant="bodySmall" tone="inherit">{selected.includes(kernel.id) ? '✓ ' : ''}{kernel.name}</Typography></Button>)}
        </div>
        <div className="mt-auto grid min-h-0 min-w-0 items-center gap-[8px] pb-[3px]" style={{ gridTemplateColumns: 'minmax(0, 1.07fr) minmax(0, .87fr) minmax(0, 1fr)' }}>
          <div className="min-w-0 text-center">
            <Typography as="p" variant="bodySmall" tone="accent" className="m-0">输入图像 · 28×28</Typography>
            <canvas ref={canvasRef} width={DRAW_SIZE} height={DRAW_SIZE} tabIndex={0} onPointerDown={beginDrawing} onPointerMove={continueDrawing} onPointerUp={endDrawing} onPointerCancel={endDrawing} aria-label="手写数字画布；按住鼠标书写" className="mx-auto mt-[8px] block aspect-square w-full max-w-[190px] touch-none rounded-[9px] border border-[#d3e0f0] bg-black [image-rendering:pixelated]" />
            <Typography as="p" variant="bodySmall" tone="muted" className="mb-0 mt-[4px]">{sample === '手写' ? '手写输入' : `MNIST 数字 ${sample}`}</Typography>
          </div>
          <div className="min-w-0 text-center">
            <Typography as="p" variant="bodySmall" tone="accent" className="m-0">固定核 · 3×3</Typography>
            <div className="mx-auto mt-[20px] grid aspect-square w-full max-w-[150px] grid-cols-3 grid-rows-3 gap-[2px] rounded-[8px] border border-[#cddbef] bg-[#cddbef] p-[3px]">
              {activeKernel.matrix.flat().map((value, index) => <div key={index} className={`grid min-w-0 place-items-center rounded-[3px] ${value > 0 ? 'bg-[#ffeadc] text-[#ba511b]' : value < 0 ? 'bg-white text-[#244b7d]' : 'bg-[#f3f6fa] text-[#6980a0]'}`}><Typography as="span" variant="bodySmall" tone="inherit">{Number.isInteger(value) ? value : value.toFixed(2)}</Typography></div>)}
            </div>
            <Typography as="p" variant="bodySmall" tone="muted" className="mb-0 mt-[4px]">{activeKernel.name}</Typography>
          </div>
          <div className="min-w-0 text-center">
            <Typography as="p" variant="bodySmall" tone="accent" className="m-0">池化特征图 · 8×8</Typography>
            <div className="mx-auto mt-[8px] grid aspect-square w-full max-w-[190px] grid-cols-8 grid-rows-8 gap-[1px] rounded-[8px] border border-[#d3e0f0] bg-[#fff5eb] p-[4px]" role="img" aria-label={`${activeKernel.name}卷积核的真实池化响应图`}>
              {activeMap.flat().map((value, index) => <span key={index} style={{ backgroundColor: `rgba(231, 96, 35, ${(value / mapMaximum).toFixed(3)})` } as CSSProperties} />)}
            </div>
            <Typography as="p" variant="bodySmall" tone="muted" className="mb-0 mt-[4px]">26×26 → 8×8</Typography>
          </div>
        </div>
      </section>
      <section className="flex min-h-0 min-w-0 max-w-full flex-col rounded-[19px] border border-[#d4e5f8] bg-white p-[15px]" aria-label="后端分类器">
        <div className="flex items-center gap-[12px]"><span className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-full bg-[#2c69bf] text-white"><Typography as="span" variant="body" tone="inherit">2</Typography></span><Typography as="h2" variant="body" tone="accent" className="m-0 font-bold">后端分类器</Typography></div>
        <Typography as="p" variant="bodySmall" tone="muted" className="mb-0 mt-[2px]">展平特征图，学习与类别对应的权重。</Typography>
        <div className="mt-[10px] flex h-[48px] items-center justify-center rounded-[10px] bg-[#eaf3ff]">
          <Typography as="p" variant="body" tone="accent" className="m-0">{selected.length} 张 8×8 特征图 → {dimension} 维</Typography>
        </div>
        <div className="my-auto"><ClassifierDiagram dimension={dimension} /></div>
      </section>
      <section className="flex min-h-0 min-w-0 max-w-full flex-col rounded-[19px] border border-[#d4e5f8] bg-white p-[15px]" aria-label="分类结果">
        <div className="flex items-center gap-[12px]"><span className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-full bg-[#2c69bf] text-white"><Typography as="span" variant="body" tone="inherit">3</Typography></span><Typography as="h2" variant="body" tone="accent" className="m-0 font-bold">分类结果</Typography></div>
        <Typography as="p" variant="bodySmall" tone="muted" className="mb-0 mt-[2px]">十个数字类别，另设一个拒识类别。</Typography>
        <div className="mt-[10px] grid gap-[2px]" aria-label="各类别概率">
          {Array.from({ length: 11 }, (_, category) => <div key={category} className={`grid h-[25px] min-w-0 items-center gap-[6px] rounded-[5px] px-[5px] ${prediction === category ? 'bg-[#fff0e6]' : ''}`} style={{ gridTemplateColumns: '25px minmax(0, 1fr) 48px' }}>
            <Typography as="span" variant="bodySmall" tone={prediction === category ? 'warning' : 'accent'}>{category === 10 ? '拒' : category}</Typography>
            <span className="h-[13px] overflow-hidden rounded-[4px] bg-[#edf1f6]"><span className="block h-full rounded-[4px] bg-[#ee783d]" style={{ width: `${(probabilities?.[category] ?? 0) * 100}%` }} /></span>
            <Typography as="span" variant="bodySmall" tone={prediction === category ? 'warning' : 'muted'}>{probabilities ? percent(probabilities[category] ?? 0) : '—'}</Typography>
          </div>)}
        </div>
        <div className="mt-auto rounded-[11px] border border-[#ffc9ac] bg-[#fff6f0] px-[10px] py-[7px] text-center" aria-live="polite">
          <Typography as="p" variant="body" tone="warning" className="m-0 font-bold">预测：{prediction < 0 ? '等待训练' : prediction === 10 ? '拒识' : prediction}</Typography>
        </div>
      </section>
    </div>
    <div className="mx-auto mt-[11px] flex h-[63px] w-[1430px] max-w-full items-center justify-center rounded-[15px] border border-[#d5e5f8] bg-[#edf5ff] px-[18px] text-center">
      {error
        ? <Typography as="p" variant="bodySmall" tone="danger" wrap="truncate" role="alert" title={error} className="m-0">{error}</Typography>
        : <Typography as="p" variant="body" tone="accent" className="m-0">卷积核的数值由人固定；学习发生在后端分类器。</Typography>}
    </div>
  </ContentBlock>;
}
