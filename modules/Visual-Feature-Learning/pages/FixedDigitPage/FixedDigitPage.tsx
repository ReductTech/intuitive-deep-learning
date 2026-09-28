import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';
import { Button, ContentBlock, moduleAssetUrl, Typography } from '../../../shared/react';
import { trainFixedDigitClassifier, type Classifier, type KernelId, type TrainResult } from '../../services/fixedDigitClassifier';
import './FixedDigitPage.css';

const ASSET_ID = '80396753-7fc8-4f55-9188-bddbdb828169';
const SIZE = 28;
const DRAW_SIZE = 336;

type Pixels = number[][];
type Kernel = { id: KernelId; name: string; matrix: number[][] };

const KERNELS: Kernel[] = [
  { id: 'edge', name: '轮廓', matrix: [[-1, -1, -1], [-1, 8, -1], [-1, -1, -1]] },
  { id: 'vertical', name: '竖向', matrix: [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]] },
  { id: 'horizontal', name: '横向', matrix: [[-1, -2, -1], [0, 0, 0], [1, 2, 1]] },
  { id: 'diag_down', name: '斜向 /', matrix: [[0, 1, 2], [-1, 0, 1], [-2, -1, 0]] },
  { id: 'diag_up', name: '斜向 \\', matrix: [[2, 1, 0], [1, 0, -1], [0, -1, -2]] },
  { id: 'center', name: '中心墨迹', matrix: [[0, 1 / 8, 0], [1 / 8, 4 / 8, 1 / 8], [0, 1 / 8, 0]] },
];

const SAMPLES = [
  { label: '6', src: moduleAssetUrl(ASSET_ID, 'digits/6.png') },
  { label: '2', src: moduleAssetUrl(ASSET_ID, 'digits/2.png') },
  { label: '8', src: moduleAssetUrl(ASSET_ID, 'digits/8.png') },
];

const emptyPixels = (): Pixels => Array.from({ length: SIZE }, () => Array(SIZE).fill(0) as number[]);

function readPixels(canvas: HTMLCanvasElement): Pixels {
  const small = document.createElement('canvas');
  small.width = SIZE;
  small.height = SIZE;
  const context = small.getContext('2d', { willReadFrequently: true });
  if (!context) return emptyPixels();
  context.drawImage(canvas, 0, 0, SIZE, SIZE);
  const data = context.getImageData(0, 0, SIZE, SIZE).data;
  return Array.from({ length: SIZE }, (_, row) => Array.from({ length: SIZE }, (_, col) => {
    const index = (row * SIZE + col) * 4;
    return Number(((data[index] + data[index + 1] + data[index + 2]) / (3 * 255)).toFixed(4));
  }));
}

/** Mirrors the existing service: 3×3 valid correlation, ReLU, then area-average to 8×8. */
function featureMap(image: Pixels, matrix: number[][]): number[][] {
  const response = Array.from({ length: 26 }, (_, row) => Array.from({ length: 26 }, (_, col) => {
    let total = 0;
    for (let ky = 0; ky < 3; ky += 1) {
      for (let kx = 0; kx < 3; kx += 1) total += image[row + ky][col + kx] * matrix[ky][kx];
    }
    return Math.max(0, total);
  }));
  return Array.from({ length: 8 }, (_, row) => Array.from({ length: 8 }, (_, col) => {
    const rowStart = Math.floor(row * 26 / 8);
    const rowEnd = Math.floor((row + 1) * 26 / 8);
    const colStart = Math.floor(col * 26 / 8);
    const colEnd = Math.floor((col + 1) * 26 / 8);
    let sum = 0;
    for (let y = rowStart; y < rowEnd; y += 1) {
      for (let x = colStart; x < colEnd; x += 1) sum += response[y][x];
    }
    return sum / ((rowEnd - rowStart) * (colEnd - colStart));
  }));
}

function predict(classifier: Classifier, maps: Record<KernelId, number[][]>): number[] | null {
  const features = classifier.kernels.flatMap((id) => maps[id].flat());
  if (features.length !== classifier.mean.length || features.length !== classifier.std.length || features.length !== classifier.weights.length) return null;
  const scores = classifier.bias.map((bias, classIndex) => features.reduce((sum, value, index) =>
    sum + ((value - classifier.mean[index]) / classifier.std[index]) * (classifier.weights[index]?.[classIndex] ?? 0), bias));
  const largest = Math.max(...scores);
  const exp = scores.map((score) => Math.exp(score - largest));
  const total = exp.reduce((sum, value) => sum + value, 0);
  return exp.map((value) => value / total);
}

function percent(value: number) { return `${(value * 100).toFixed(1)}%`; }

export function FixedDigitPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const positionRef = useRef<{ x: number; y: number } | null>(null);
  const requestRef = useRef(0);
  const [pixels, setPixels] = useState<Pixels>(emptyPixels);
  const [sample, setSample] = useState('6');
  const [selected, setSelected] = useState<KernelId[]>(KERNELS.map((kernel) => kernel.id));
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
    image.onerror = () => setError('手写样本未能载入。仍可在画布上自己写一个数字。');
    image.src = digit.src;
  }, []);

  useEffect(() => { loadSample(SAMPLES[0]); }, [loadSample]);

  const maps = useMemo(() => Object.fromEntries(KERNELS.map((kernel) => [kernel.id, featureMap(pixels, kernel.matrix)])) as Record<KernelId, number[][]>, [pixels]);
  const probabilities = useMemo(() => result ? predict(result.classifier, maps) : null, [result, maps]);
  const prediction = probabilities ? probabilities.indexOf(Math.max(...probabilities)) : -1;
  const bestProbability = prediction >= 0 ? probabilities?.[prediction] ?? 0 : 0;

  const toggleKernel = (id: KernelId) => {
    setSelected((current) => {
      if (current.includes(id) && current.length === 1) return current;
      const next = current.includes(id) ? current.filter((item) => item !== id) : KERNELS.map((item) => item.id).filter((item) => current.includes(item) || item === id);
      return next;
    });
    requestRef.current += 1;
    setResult(null);
    setTraining(false);
    setError('');
  };

  const pointFromEvent = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: (event.clientX - rect.left) * DRAW_SIZE / rect.width, y: (event.clientY - rect.top) * DRAW_SIZE / rect.height };
  };

  const beginDrawing = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    if (sample !== '手写') {
      context.fillStyle = '#000';
      context.fillRect(0, 0, DRAW_SIZE, DRAW_SIZE);
      setSample('手写');
    }
    const point = pointFromEvent(event);
    context.fillStyle = '#f7fbff';
    context.beginPath();
    context.arc(point.x, point.y, 16, 0, Math.PI * 2);
    context.fill();
    positionRef.current = point;
    drawingRef.current = true;
    setHasInk(true);
    setPixels(readPixels(canvas));
    setError('');
  };

  const continueDrawing = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;
    const point = pointFromEvent(event);
    const previous = positionRef.current ?? point;
    context.strokeStyle = '#f7fbff';
    context.lineWidth = 30;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.beginPath();
    context.moveTo(previous.x, previous.y);
    context.lineTo(point.x, point.y);
    context.stroke();
    positionRef.current = point;
    setPixels(readPixels(canvas));
  };

  const stopDrawing = () => { drawingRef.current = false; positionRef.current = null; };

  const clearDrawing = () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;
    context.fillStyle = '#000';
    context.fillRect(0, 0, DRAW_SIZE, DRAW_SIZE);
    setPixels(emptyPixels());
    setSample('手写');
    setHasInk(false);
    setError('');
  };

  const train = async () => {
    if (training || !hasInk) return;
    const currentRequest = ++requestRef.current;
    setTraining(true);
    setError('');
    try {
      const trained = await trainFixedDigitClassifier(selected, pixels);
      if (currentRequest !== requestRef.current) return;
      setResult(trained);
    } catch (reason) {
      if (currentRequest === requestRef.current) setError(`真实训练未完成：${reason instanceof Error ? reason.message : '未知错误'}`);
    } finally {
      if (currentRequest === requestRef.current) setTraining(false);
    }
  };

  return (
    <ContentBlock className="vfl-opening" headingLevel={1} title="固定特征的数字分类" subtitle="如果卷积核一笔都不改，机器还能学会辨认你的手写数字吗？">
      <div className="vfl-opening__stage">
        <section className="vfl-opening__ink" aria-label="手写数字输入">
          <div className="vfl-opening__section-head">
            <Typography as="span" variant="bodySmall" tone="inherit">01 / 输入</Typography>
            <Typography as="span" variant="bodySmall" tone="inherit">28 × 28 像素</Typography>
          </div>
          <div className="vfl-opening__drawing-frame">
            <canvas ref={canvasRef} width={DRAW_SIZE} height={DRAW_SIZE} aria-label="手写数字画布；按住鼠标或触屏书写" onPointerDown={beginDrawing} onPointerMove={continueDrawing} onPointerUp={stopDrawing} onPointerCancel={stopDrawing} />
            <span className="vfl-opening__corner vfl-opening__corner--tl" aria-hidden="true" />
            <span className="vfl-opening__corner vfl-opening__corner--br" aria-hidden="true" />
          </div>
          <div className="vfl-opening__sample-row">
            <Typography as="span" variant="bodySmall" tone="inherit">试试这些真实笔迹</Typography>
            <div className="vfl-opening__sample-buttons" role="group" aria-label="手写数字样本">
              {SAMPLES.map((digit) => <Button key={digit.label} active={sample === digit.label} onClick={() => loadSample(digit)} aria-label={`查看数字 ${digit.label} 的真实手写样本`}>{digit.label}</Button>)}
              <Button onClick={clearDrawing}>自己写</Button>
            </div>
          </div>
        </section>

        <section className="vfl-opening__features" aria-label="固定卷积核与特征图">
          <div className="vfl-opening__section-head">
            <Typography as="span" variant="bodySmall" tone="accent">02 / 固定的眼睛</Typography>
            <span className="vfl-opening__lock" aria-hidden="true">◆</span>
          </div>
          <Typography as="h2" variant="h3" tone="accent">同一张图，六种看法</Typography>
          <Typography variant="bodySmall" tone="muted">选择参与训练的卷积核。亮起的位置，是它们从笔画中提取的响应。</Typography>
          <div className="vfl-opening__maps">
            {KERNELS.map((kernel) => {
              const active = selected.includes(kernel.id);
              const map = maps[kernel.id];
              const maximum = Math.max(0.001, ...map.flat());
              return <button key={kernel.id} type="button" className={`vfl-opening__map${active ? ' is-selected' : ''}`} aria-pressed={active} onClick={() => toggleKernel(kernel.id)}>
                <span className="vfl-opening__map-top"><Typography as="span" variant="bodySmall" tone="inherit">{kernel.name}</Typography><span className="vfl-opening__map-mark" aria-hidden="true">{active ? '✓' : '+'}</span></span>
                <span className="vfl-opening__map-grid" aria-hidden="true">{map.flat().map((value, index) => <i key={index} style={{ '--vfl-cell': (value / maximum).toFixed(3) } as CSSProperties} />)}</span>
              </button>;
            })}
          </div>
          <div className="vfl-opening__fixed-note"><Typography as="span" variant="bodySmall" tone="accent">卷积核数值固定</Typography><span aria-hidden="true" /><Typography as="span" variant="bodySmall" tone="muted">训练时不会更新</Typography></div>
        </section>

        <section className="vfl-opening__decision" aria-label="分类器训练与结果">
          <div className="vfl-opening__section-head"><Typography as="span" variant="bodySmall" tone="inherit">03 / 学习判断</Typography></div>
          <Typography as="h2" variant="h3" tone="inherit">只训练分类器</Typography>
          <Typography variant="bodySmall" tone="inherit">让它学习如何组合左边的固定特征。</Typography>
          <div className="vfl-opening__prediction" aria-live="polite">
            <Typography as="span" variant="bodySmall" tone="inherit">当前预测</Typography>
            <Typography as="strong" variant="display" tone="inherit">{prediction < 0 ? '？' : prediction === 10 ? '拒识' : prediction}</Typography>
            <Typography as="span" variant="bodySmall" tone="inherit">{prediction < 0 ? '等待训练' : `该结果的概率 ${percent(bestProbability)}`}</Typography>
          </div>
          <div className="vfl-opening__probabilities" aria-label="各类别概率">
            {Array.from({ length: 11 }, (_, digit) => <div className={`vfl-opening__probability${prediction === digit ? ' is-top' : ''}`} key={digit}>
              <Typography as="span" variant="bodySmall" tone="inherit">{digit === 10 ? '—' : digit}</Typography>
              <span className="vfl-opening__probability-track"><i style={{ height: `${(probabilities?.[digit] ?? 0) * 100}%` }} /></span>
            </div>)}
          </div>
          <Button variant="primary" loading={training} disabled={!hasInk} onClick={train} className="vfl-opening__train">{training ? '真实训练进行中…' : result ? '重新训练分类器' : '训练分类器 →'}</Button>
          {result && <Typography variant="bodySmall" tone="inherit" className="vfl-opening__metric">验证集准确率 {percent(result.val_accuracy)} · {result.val_count.toLocaleString()} 张</Typography>}
          {error && <Typography variant="bodySmall" tone="danger" className="vfl-opening__error" role="alert">{error}</Typography>}
        </section>
      </div>
      <div className="vfl-opening__takeaway"><span className="vfl-opening__takeaway-line" aria-hidden="true" /><Typography as="p" variant="body" tone="accent">固定卷积核负责看，分类器负责学。</Typography><Typography as="span" variant="bodySmall" tone="muted">下一步：当“看”的方式不合适，会发生什么？</Typography></div>
    </ContentBlock>
  );
}
