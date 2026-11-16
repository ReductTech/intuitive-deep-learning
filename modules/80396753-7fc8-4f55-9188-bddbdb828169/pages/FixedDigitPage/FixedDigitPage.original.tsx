import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';
import { Button, ContentBlock, Typography } from "@shuku/course-style/react";
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
  { label: '6', src: moduleAssetUrl('digits/6.jpg') },
  { label: '2', src: moduleAssetUrl('digits/2.jpg') },
  { label: '8', src: moduleAssetUrl('digits/8.jpg') },
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
    <ContentBlock shuku-edit-id="e-cb0eb956-bcb4-433a-98b4-2e5f224fd551" className="vfl-opening relative grid h-full min-h-0 min-w-0 grid-rows-[auto_minmax(0,1fr)] gap-[14px] overflow-hidden border-t-4 border-t-lesson-accent px-[34px] pb-[24px] pt-[30px]" headingLevel={1} title="固定特征的数字分类" subtitle="如果卷积核一笔都不改，机器还能学会辨认你的手写数字吗？">
      <div shuku-edit-id="e-3a828a02-7b17-431c-b6c8-2db6f35add51" className="vfl-opening__stage grid min-h-0 min-w-0 grid-cols-[minmax(0,400px)_minmax(0,1fr)_minmax(0,340px)] overflow-hidden rounded-[22px] border">
        <section shuku-edit-id="e-27341c84-2a21-4829-b091-222d87b38e19" className="vfl-opening__ink relative flex min-h-0 min-w-0 flex-col items-stretch px-[22px] pb-[20px] pt-[18px]" aria-label="手写数字输入">
          <div shuku-edit-id="e-d75f5035-fc27-4dfa-bd47-cf20bcc0c974" className="vfl-opening__section-head flex min-h-[37px] items-center justify-between gap-[8px]">
            <Typography shuku-edit-id="e-95ba8682-b46d-404e-9156-93eea76944c6" as="span" variant="bodySmall" tone="inherit">01 / 输入</Typography>
            <Typography shuku-edit-id="e-8f55b322-7313-4e17-8091-f82ec56bbd39" as="span" variant="bodySmall" tone="inherit">28 × 28 像素</Typography>
          </div>
          <div shuku-edit-id="e-1f4231a2-78a2-437a-aba5-5fa0b29b399b" className="vfl-opening__drawing-frame relative my-auto aspect-square w-[min(100%,336px)] self-center rounded-[16px] border">
            <canvas shuku-edit-id="e-add82e81-fc50-4372-970f-63be430acb6f" className="relative block h-full w-full touch-none rounded-[16px]" ref={canvasRef} width={DRAW_SIZE} height={DRAW_SIZE} aria-label="手写数字画布；按住鼠标或触屏书写" onPointerDown={beginDrawing} onPointerMove={continueDrawing} onPointerUp={stopDrawing} onPointerCancel={stopDrawing} />
            <span shuku-edit-id="e-88e7cf6b-9340-4b66-8531-8b7b2053ff65" className="vfl-opening__corner vfl-opening__corner--tl" aria-hidden="true" />
            <span shuku-edit-id="e-49a43811-363b-4706-a91f-ee3c14cb5631" className="vfl-opening__corner vfl-opening__corner--br" aria-hidden="true" />
          </div>
          <div shuku-edit-id="e-c0285e84-2760-472d-bf07-f788927ed925" className="vfl-opening__sample-row grid gap-[8px]">
            <Typography shuku-edit-id="e-3183846d-598e-4b73-b4f9-ae332f98864a" as="span" variant="bodySmall" tone="inherit">试试这些真实笔迹</Typography>
            <div shuku-edit-id="e-7fdb987f-126b-41a0-b2ea-22ec5c610925" className="vfl-opening__sample-buttons flex gap-[8px]" role="group" aria-label="手写数字样本">
              {SAMPLES.map((digit) => <Button key={digit.label} active={sample === digit.label} onClick={() => loadSample(digit)} aria-label={`查看数字 ${digit.label} 的真实手写样本`}>{digit.label}</Button>)}
              <Button onClick={clearDrawing}>自己写</Button>
            </div>
          </div>
        </section>

        <section shuku-edit-id="e-2148c424-f6c5-435c-ae4a-a6a0f0cb73ff" className="vfl-opening__features relative flex min-h-0 min-w-0 flex-col gap-[10px] px-[24px] pb-[20px] pt-[18px]" aria-label="固定卷积核与特征图">
          <div shuku-edit-id="e-6cc9ffa9-9908-4c55-a0e4-7410b8d5d42d" className="vfl-opening__section-head flex min-h-[37px] items-center justify-between gap-[8px]">
            <Typography shuku-edit-id="e-c1de6f25-d200-44b3-8ff6-2df07a6e12d2" as="span" variant="bodySmall" tone="accent">02 / 固定的眼睛</Typography>
            <span shuku-edit-id="e-23b4802c-dd44-44b3-931d-ee4630b8d330" className="vfl-opening__lock" aria-hidden="true">◆</span>
          </div>
          <Typography shuku-edit-id="e-097979cf-d29e-4812-aac2-f99dc40e330f" as="h2" variant="h3" tone="accent">同一张图，六种看法</Typography>
          <Typography shuku-edit-id="e-d35d2aab-d304-4d65-bfd8-9a304b61a7d3" variant="bodySmall" tone="muted">选择参与训练的卷积核。亮起的位置，是它们从笔画中提取的响应。</Typography>
          <div shuku-edit-id="e-14dfb026-a132-48f1-a880-5b61d07ba3d6" className="vfl-opening__maps my-[2px] grid min-h-0 min-w-0 flex-1 grid-cols-3 grid-rows-2 gap-[10px]">
            {KERNELS.map((kernel) => {
              const active = selected.includes(kernel.id);
              const map = maps[kernel.id];
              const maximum = Math.max(0.001, ...map.flat());
              return <button shuku-edit-id="e-c948227e-cfec-436a-8af7-25f4834829e2" key={kernel.id} type="button" className={`vfl-opening__map grid min-h-0 min-w-0 cursor-pointer grid-rows-[auto_minmax(0,1fr)] gap-[5px] rounded-[12px] border px-[10px] py-[8px]${active ? ' is-selected' : ''}`} aria-pressed={active} onClick={() => toggleKernel(kernel.id)}>
                <span shuku-edit-id="e-f879b1b5-4b18-4b60-be91-d66508a81d53" className="vfl-opening__map-top flex min-w-0 items-center justify-between gap-[2px]"><Typography shuku-edit-id="e-d8dd255f-f527-46b3-ab50-7b5e238dba53" as="span" variant="bodySmall" tone="inherit">{kernel.name}</Typography><span shuku-edit-id="e-a0824db4-ff46-4d52-9eaa-545bc1d0cc8e" className="vfl-opening__map-mark grid h-[22px] w-[22px] flex-none place-items-center rounded-full" aria-hidden="true">{active ? '✓' : '+'}</span></span>
                <span shuku-edit-id="e-3ba4a835-db4a-47ea-8cfc-eb527d44adb4" className="vfl-opening__map-grid grid aspect-square w-[min(100%,112px)] grid-cols-8 grid-rows-8 justify-self-center self-center gap-px rounded-[4px] border p-[3px]" aria-hidden="true">{map.flat().map((value, index) => <i shuku-edit-id="e-3a96d293-e51d-40df-af93-e2505dd5bf8b" key={index} style={{ '--vfl-cell': (value / maximum).toFixed(3) } as CSSProperties} />)}</span>
              </button>;
            })}
          </div>
          <div shuku-edit-id="e-9138d064-66af-4b26-9ebc-bbd30d2ff472" className="vfl-opening__fixed-note flex min-h-[38px] items-center justify-center gap-[12px] border-t"><Typography shuku-edit-id="e-2f1db601-89f4-4501-babc-9792eea47b40" as="span" variant="bodySmall" tone="accent">卷积核数值固定</Typography><span shuku-edit-id="e-c5d03286-1821-4670-a4f6-3f367eac620d" aria-hidden="true" /><Typography shuku-edit-id="e-0ba4bf14-9a98-465b-98a2-d99951b49650" as="span" variant="bodySmall" tone="muted">训练时不会更新</Typography></div>
        </section>

        <section shuku-edit-id="e-df43eef0-63ee-4fa4-b860-ddcc3e466d38" className="vfl-opening__decision relative flex min-h-0 min-w-0 flex-col gap-[7px] px-[20px] pb-[20px] pt-[18px]" aria-label="分类器训练与结果">
          <div shuku-edit-id="e-50123ccc-cc52-459b-8d98-a31e28ce3f5f" className="vfl-opening__section-head flex min-h-[37px] items-center justify-between gap-[8px]"><Typography shuku-edit-id="e-3162d850-c3c6-4f8a-82fc-df0c1db5d424" as="span" variant="bodySmall" tone="inherit">03 / 学习判断</Typography></div>
          <Typography shuku-edit-id="e-59e65494-656e-4aae-bc86-cb9aebfe4c13" as="h2" variant="h3" tone="inherit">只训练分类器</Typography>
          <Typography shuku-edit-id="e-937e0f9b-be43-4beb-8fc5-980f434facec" variant="bodySmall" tone="inherit">让它学习如何组合左边的固定特征。</Typography>
          <div shuku-edit-id="e-33fc9250-39ae-4e41-8967-02266f85013f" className="vfl-opening__prediction mt-auto grid min-h-[123px] content-center justify-items-center gap-0 rounded-[16px] border" aria-live="polite">
            <Typography shuku-edit-id="e-bdc5d9e3-327a-43ea-b091-f7c00d5a66df" as="span" variant="bodySmall" tone="inherit">当前预测</Typography>
            <Typography shuku-edit-id="e-41c878ec-f5d0-462c-a52d-61f8374f522b" as="strong" variant="display" tone="inherit">{prediction < 0 ? '？' : prediction === 10 ? '拒识' : prediction}</Typography>
            <Typography shuku-edit-id="e-4aa4bf71-284d-4ded-b2a2-89b13ccc3247" as="span" variant="bodySmall" tone="inherit">{prediction < 0 ? '等待训练' : `该结果的概率 ${percent(bestProbability)}`}</Typography>
          </div>
          <div shuku-edit-id="e-40acd7cb-799a-454a-9f98-9c993a58f5d7" className="vfl-opening__probabilities flex min-h-[125px] items-stretch gap-[4px] pt-[6px]" aria-label="各类别概率">
            {Array.from({ length: 11 }, (_, digit) => <div shuku-edit-id="e-b0b037ca-b2b0-46ed-887c-a414491f1c97" className={`vfl-opening__probability flex min-w-0 flex-1 flex-col-reverse items-center${prediction === digit ? ' is-top' : ''}`} key={digit}>
              <Typography shuku-edit-id="e-813db240-3d42-492a-87fc-e5fba22c3213" as="span" variant="bodySmall" tone="inherit">{digit === 10 ? '—' : digit}</Typography>
              <span shuku-edit-id="e-5ee3fab9-e090-47f8-9412-4b43c0f69d3c" className="vfl-opening__probability-track relative block min-h-0 w-full flex-1 overflow-hidden"><i shuku-edit-id="e-70bc0c8b-008b-4079-b82a-b7fd36144fe1" style={{ height: `${(probabilities?.[digit] ?? 0) * 100}%` }} /></span>
            </div>)}
          </div>
          <Button variant="primary" loading={training} disabled={!hasInk} onClick={train} className="vfl-opening__train">{training ? '真实训练进行中…' : result ? '重新回放分类器' : '训练分类器 →'}</Button>
          {result && <Typography shuku-edit-id="e-bdb7e05b-53ea-476d-85d6-705819978fa9" variant="bodySmall" tone="inherit" className="vfl-opening__metric">验证集准确率 {percent(result.val_accuracy)} · {result.val_count.toLocaleString()} 张</Typography>}
          {error && <Typography shuku-edit-id="e-b8123360-186c-4f83-8058-ee31bf01378f" variant="bodySmall" tone="danger" className="vfl-opening__error" role="alert">{error}</Typography>}
        </section>
      </div>
      <div shuku-edit-id="e-91cb447e-e695-448d-94d4-ffa3ce4530f9" className="vfl-opening__takeaway flex min-h-[52px] min-w-0 items-center justify-between gap-[18px] px-[10px]"><span shuku-edit-id="e-d7bec89d-a6a5-419b-b78c-b5b4fe56ebe6" className="vfl-opening__takeaway-line w-[4px] flex-none self-stretch rounded-[4px]" aria-hidden="true" /><Typography shuku-edit-id="e-54e35e05-ab38-4f16-b20f-fcf1fdb740e5" as="p" variant="body" tone="accent">固定卷积核负责看，分类器负责学。</Typography><Typography shuku-edit-id="e-ec140299-209f-4f35-9061-681d032145b9" as="span" variant="bodySmall" tone="muted">下一步：当“看”的方式不合适，会发生什么？</Typography></div>
    </ContentBlock>
  );
}
