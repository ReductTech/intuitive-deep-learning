import { moduleIdentity } from '../../outlines.json';
import { moduleAssetUrl } from '../../../shared/react/assets';
import { useEffect, useRef, useState, type KeyboardEvent, type MouseEvent } from 'react';
import { Button, ContentBlock, Typography } from '../../../shared/react';
import { useCompleteOnce } from '../../hooks/useCompleteOnce';
const bottleFront = moduleAssetUrl(moduleIdentity.id, "recycling/camera-views/bottle-front.png");
const bottleAngle = moduleAssetUrl(moduleIdentity.id, "recycling/camera-views/bottle-angle-45.png");
import './PixelRepresentationPage.css';

type Condition = 'angle' | 'light' | 'distance' | 'background';
type Rgb = readonly [number, number, number];
type Point = { x: number; y: number };
type Photos = Record<Condition | 'original', ImageData>;
const WIDTH = 256;
const HEIGHT = 332;
const INITIAL_POINT = { x: 128, y: 48 };
const conditions: { id: Condition; label: string; photo: string }[] = [
  { id: 'angle', label: '换角度', photo: '斜侧面拍摄' },
  { id: 'light', label: '改光线', photo: '降低亮度 · 模拟' },
  { id: 'distance', label: '拉远距离', photo: '瓶子变小 · 模拟' },
  { id: 'background', label: '换背景', photo: '更换背景 · 模拟' },
];
const clues = [
  { label: '瓶口边缘', description: '局部边缘组成瓶口的形状', values: ['0.82', '0.26', '0.71', '…'] },
  { label: '透明材质线索', description: '透光、反光与明暗变化', values: ['0.64', '0.77', '0.19', '…'] },
  { label: '弧形轮廓', description: '局部曲线组成瓶身结构', values: ['0.35', '0.68', '0.89', '…'] },
];

function loadPhoto(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('图片加载失败'));
    image.src = src;
  });
}

// The manually outlined silhouette is only for the background-change illustration.
// It is not a learned segmentation mask or an extracted model feature.
function bottleSilhouette() {
  const path = new Path2D();
  path.moveTo(110, 20);
  path.lineTo(148, 20);
  path.lineTo(148, 46);
  path.bezierCurveTo(149, 65, 174, 76, 174, 104);
  path.lineTo(174, 278);
  path.bezierCurveTo(173, 307, 164, 311, 127, 311);
  path.bezierCurveTo(92, 311, 84, 307, 84, 278);
  path.lineTo(84, 104);
  path.bezierCurveTo(84, 77, 108, 64, 110, 46);
  path.closePath();
  return path;
}

function makePhotos(front: HTMLImageElement, angle: HTMLImageElement): Photos {
  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('无法读取图片像素');
  const draw = (image: HTMLImageElement) => {
    context.clearRect(0, 0, WIDTH, HEIGHT);
    context.drawImage(image, 0, 0, WIDTH, HEIGHT);
    return context.getImageData(0, 0, WIDTH, HEIGHT);
  };
  const original = draw(front);
  const angled = draw(angle);
  const light = new ImageData(new Uint8ClampedArray(original.data), WIDTH, HEIGHT);
  for (let index = 0; index < light.data.length; index += 4) {
    for (let channel = 0; channel < 3; channel++) light.data[index + channel] *= .56;
  }
  context.fillStyle = '#d5d4d0';
  context.fillRect(0, 0, WIDTH, HEIGHT);
  context.drawImage(front, WIDTH * .16, HEIGHT * .16, WIDTH * .68, HEIGHT * .68);
  const distance = context.getImageData(0, 0, WIDTH, HEIGHT);
  const gradient = context.createLinearGradient(0, 0, WIDTH, HEIGHT);
  gradient.addColorStop(0, '#cfddd0');
  gradient.addColorStop(1, '#6e9982');
  context.fillStyle = gradient;
  context.fillRect(0, 0, WIDTH, HEIGHT);
  context.save();
  context.clip(bottleSilhouette());
  context.drawImage(front, 0, 0, WIDTH, HEIGHT);
  context.restore();
  const background = context.getImageData(0, 0, WIDTH, HEIGHT);
  return { original, angle: angled, light, distance, background };
}

function sample(photo: ImageData | undefined, point: Point): Rgb | undefined {
  if (!photo) return undefined;
  const offset = (point.y * WIDTH + point.x) * 4;
  return [photo.data[offset], photo.data[offset + 1], photo.data[offset + 2]];
}

function RgbReadout({ rgb }: { rgb?: Rgb }) {
  return <div className="rtg-pixel-representation__rgb">
    <span className="rtg-pixel-representation__swatch" style={{ background: rgb ? `rgb(${rgb.join(',')})` : '#eef3fb' }} aria-hidden="true" />
    <Typography as="code" variant="bodySmall" tone="accent">RGB [{rgb ? rgb.join(', ') : '—, —, —'}]</Typography>
  </div>;
}

export interface PixelRepresentationPageProps { onComplete?: () => void }

export function PixelRepresentationPage({ onComplete }: PixelRepresentationPageProps) {
  const [step, setStep] = useState<0 | 1>(0);
  const [condition, setCondition] = useState<Condition>('angle');
  const [changed, setChanged] = useState(false);
  const [point, setPoint] = useState<Point>(INITIAL_POINT);
  const [photos, setPhotos] = useState<Photos>();
  const [error, setError] = useState(false);
  const [clue, setClue] = useState(0);
  const originalRef = useRef<HTMLCanvasElement>(null);
  const changedRef = useRef<HTMLCanvasElement>(null);
  const questionRef = useRef<HTMLDivElement>(null);
  const featureTitleRef = useRef<HTMLHeadingElement>(null);
  const previousStep = useRef(step);
  useCompleteOnce(step === 1, onComplete);
  const selected = conditions.find(item => item.id === condition)!;
  const baseline = sample(photos?.original, point);
  const current = sample(photos?.[changed ? condition : 'original'], point);
  const pixelStatus = !photos
    ? (error ? '图片加载失败，请刷新重试。' : '正在读取真实像素…')
    : '';

  useEffect(() => {
    if (previousStep.current === step) return;
    previousStep.current = step;
    if (step === 1) featureTitleRef.current?.focus();
    else questionRef.current?.querySelector('button')?.focus();
  }, [step]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([loadPhoto(bottleFront), loadPhoto(bottleAngle)])
      .then(([front, angle]) => { if (!cancelled) setPhotos(makePhotos(front, angle)); })
      .catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!photos) return;
    originalRef.current?.getContext('2d')?.putImageData(photos.original, 0, 0);
    changedRef.current?.getContext('2d')?.putImageData(photos[changed ? condition : 'original'], 0, 0);
  }, [photos, changed, condition, step]);

  const chooseCondition = (next: Condition) => {
    setCondition(next);
    setChanged(true);
    setPoint(next === 'background' ? { x: 45, y: 126 } : INITIAL_POINT);
  };
  const inspect = (event: MouseEvent<HTMLCanvasElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    setPoint({ x: Math.max(0, Math.min(WIDTH - 1, Math.floor((event.clientX - bounds.left) / bounds.width * WIDTH))),
      y: Math.max(0, Math.min(HEIGHT - 1, Math.floor((event.clientY - bounds.top) / bounds.height * HEIGHT))) });
  };
  const inspectKeys = (event: KeyboardEvent<HTMLCanvasElement>) => {
    const movement: Record<string, Point> = { ArrowLeft: { x: -1, y: 0 }, ArrowRight: { x: 1, y: 0 }, ArrowUp: { x: 0, y: -1 }, ArrowDown: { x: 0, y: 1 } };
    if (!(event.key in movement)) return;
    event.preventDefault();
    event.stopPropagation();
    setPoint(previous => ({ x: Math.max(0, Math.min(WIDTH - 1, previous.x + movement[event.key].x)),
      y: Math.max(0, Math.min(HEIGHT - 1, previous.y + movement[event.key].y)) }));
  };
  const probe = <span className="rtg-pixel-representation__probe" aria-hidden="true" style={{ left: `${(point.x + .5) / WIDTH * 100}%`, top: `${(point.y + .5) / HEIGHT * 100}%` }} />;

  return <ContentBlock className="rtg-pixel-representation" headingLevel={1}
    onKeyDown={event => { if (event.key === ' ' && (event.target as Element).closest('button')) event.stopPropagation(); }}
    title="能否仅通过原始像素数字逐个比较来进行可靠分类？"
    subtitle="像素数字容易变化；模型需要从中学习更稳定、更适合分类的线索。">
    {step === 0 ? <div className="rtg-pixel-representation__controls">
      <Typography variant="bodySmall" tone="warning">① 换一种拍法</Typography>
      <div className="rtg-pixel-representation__conditions" role="group" aria-label="改变一种拍摄条件">
        {conditions.map(item => <Button key={item.id} disabled={!photos} data-condition={item.id}
          active={changed && condition === item.id} variant={changed && condition === item.id ? 'primary' : 'default'}
          aria-pressed={changed && condition === item.id} onClick={() => chooseCondition(item.id)}>{item.label}</Button>)}
      </div>
      <Button onClick={() => { setChanged(false); setPoint(INITIAL_POINT); }} disabled={!photos}>恢复原图</Button>
    </div> : <ol className="rtg-pixel-representation__flow" aria-label="从像素到表示">
      {['原始像素', '网络逐层加工', '特征表示'].map((label, index) => <li key={label}>
        <Typography variant="body" tone={index === 2 ? 'success' : 'accent'}>{index + 1} · {label}</Typography>
      </li>)}
    </ol>}

    {step === 0 ? <div className="rtg-pixel-representation__comparison" data-stage="pixels" id="rtg-pixel-representation-main-stage">
      <div className="rtg-pixel-representation__photos">
        <figure className="rtg-pixel-representation__photo">
          <Typography as="figcaption" variant="body" tone="accent">原始照片</Typography>
          <div className="rtg-pixel-representation__photo-area"><div className="rtg-pixel-representation__picture">
            <canvas ref={originalRef} width={WIDTH} height={HEIGHT} role="img" tabIndex={0} aria-label="原始瓶子照片，点击或用方向键选择画面位置" onClick={inspect} onKeyDown={inspectKeys} />
            {photos && probe}
          </div></div>
          <RgbReadout rgb={baseline} />
        </figure>
        <figure className="rtg-pixel-representation__photo">
          <Typography as="figcaption" variant="body" tone={changed ? 'warning' : 'accent'}>{changed ? selected.photo : '先点上方按钮'}</Typography>
          <div className="rtg-pixel-representation__photo-area"><div className="rtg-pixel-representation__picture">
            <canvas ref={changedRef} width={WIDTH} height={HEIGHT} role="img" tabIndex={0} aria-label="改变拍摄条件后的瓶子照片，点击或用方向键选择画面位置" onClick={inspect} onKeyDown={inspectKeys} />
            {photos && probe}
          </div></div>
          <RgbReadout rgb={current} />
        </figure>
      </div>
      <aside className="rtg-pixel-representation__insight" aria-live="polite" aria-atomic="true">
        <div className="rtg-pixel-representation__takeaway">
          <Typography as="p" variant="h1" tone="accent">{changed ? '像素变了，' : '换个拍法，'}</Typography>
          <Typography as="p" variant="h1" tone="success">{changed ? '仍是塑料瓶' : '类别会变吗？'}</Typography>
        </div>
        <div ref={questionRef} className="rtg-pixel-representation__question-wrap">
          <Button variant="primary" className="rtg-pixel-representation__question"
            data-action="open-features" disabled={!photos} aria-expanded={false}
            aria-controls="rtg-pixel-representation-main-stage" onClick={() => setStep(1)}>
            <Typography as="span" variant="body" tone="inherit">看看模型学什么</Typography>
            <svg className="rtg-pixel-representation__arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 12h16m-7-7 7 7-7 7" />
            </svg>
          </Button>
        </div>
      </aside>
      <Typography className="rtg-pixel-representation__sample-caption" variant="bodySmall" tone="muted">
        同一坐标 ({point.x}, {point.y}) · 点照片取样
      </Typography>
    </div> : <div className="rtg-pixel-representation__representation" data-stage="features" id="rtg-pixel-representation-main-stage">
      <figure className="rtg-pixel-representation__photo rtg-pixel-representation__annotated">
        <Typography as="figcaption" variant="body" tone="accent">照片里有哪些有用线索？</Typography>
        <div className="rtg-pixel-representation__photo-area"><div className="rtg-pixel-representation__picture">
          <canvas ref={originalRef} width={WIDTH} height={HEIGHT} role="img" aria-label="塑料瓶照片，人工高亮选中的视觉线索" />
          <svg className="rtg-pixel-representation__annotations" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} aria-hidden="true">
            {clue === 0 && <g className="rtg-pixel-representation__highlight"><rect x="106" y="18" width="45" height="32" rx="8" /><path d="M108 43 Q129 48 149 43 M113 49 L110 59 M145 49 L148 59" /></g>}
            {clue === 1 && <g className="rtg-pixel-representation__highlight"><rect x="88" y="66" width="79" height="48" rx="14" /><rect x="87" y="188" width="79" height="70" rx="14" /><path d="M98 76 L96 102 M154 204 L155 244" /></g>}
            {clue === 2 && <g className="rtg-pixel-representation__highlight"><path d="M109 52 C108 70 85 77 85 109 L85 278 Q87 308 127 308 Q170 308 172 278 L172 109 C172 78 148 69 147 52" /></g>}
          </svg>
        </div></div>
      </figure>
      <section className="rtg-pixel-representation__clues" aria-label="网络可以学习的视觉线索">
        <Typography as="h2" ref={featureTitleRef} tabIndex={-1} className="rtg-pixel-representation__feature-title" variant="h3" tone="accent">从颜色到边缘、材质与形状</Typography>
        <Typography variant="bodySmall" tone="muted">点击线索，看照片中的对应区域。</Typography>
        <div className="rtg-pixel-representation__clue-buttons">
          {clues.map((item, index) => <Button className="rtg-pixel-representation__clue-button" key={item.label} data-clue={index}
            active={clue === index} aria-pressed={clue === index} onClick={() => setClue(index)}>
            <Typography as="span" variant="body" tone={clue === index ? 'success' : 'accent'}>{item.label}</Typography>
            <Typography as="span" variant="bodySmall" tone="muted">{item.description}</Typography>
          </Button>)}
        </div>
      </section>
      <aside className="rtg-pixel-representation__definition" aria-live="polite" aria-atomic="true">
        <div className="rtg-pixel-representation__definition-copy">
          <Typography as="h2" variant="h1" tone="success">特征表示</Typography>
          <Typography variant="body" tone="accent">网络将像素加工成用于分类的中间数字。</Typography>
        </div>
        <div className="rtg-pixel-representation__feature-values">
          <div className="rtg-pixel-representation__vector" role="group" aria-label="特征表示的示意数字，非概率、非模型实测">
            {clues[clue].values.map((value, index) => <Typography as="code" key={index} variant="body" tone="success">{value}</Typography>)}
          </div>
        </div>
      </aside>
    </div>}

    {(step === 1 || pixelStatus) && <footer className={'rtg-pixel-representation__footer' + (step === 0 ? ' rtg-pixel-representation__footer--statement' : '')}>
      {step === 0 && <Typography variant="bodySmall" tone="muted" role="status" aria-live="polite">{pixelStatus}</Typography>}
      {step === 1 && <div className="rtg-pixel-representation__actions"><Button onClick={() => setStep(0)}>再看像素</Button></div>}
    </footer>}
  </ContentBlock>;
}
