import { moduleIdentity } from '../../outlines.json';
import { moduleAssetUrl } from "@shuku/course-runtime/react/assets";
import { useEffect, useRef, useState, type KeyboardEvent, type MouseEvent } from 'react';
import { Button, ContentBlock, Typography } from "@shuku/course-style/react";
import { useCompleteOnce } from '../../hooks/useCompleteOnce';
const bottleFront = moduleAssetUrl("recycling/camera-views/bottle-front.jpg");
const bottleAngle = moduleAssetUrl("recycling/camera-views/bottle-angle-45.jpg");
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
  return <div shuku-edit-id="e-c67b3b83-2dbb-4876-878d-6143d1b9a8d9" className="rtg-pixel-representation__rgb">
    <span shuku-edit-id="e-1b6761db-7174-41a9-8d00-072ac11058e7" className="rtg-pixel-representation__swatch" style={{ background: rgb ? `rgb(${rgb.join(',')})` : '#eef3fb' }} aria-hidden="true" />
    <Typography shuku-edit-id="e-d882db58-0d57-4cc1-b543-7377626e2768" as="code" variant="bodySmall" tone="accent">RGB [{rgb ? rgb.join(', ') : '—, —, —'}]</Typography>
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
  const probe = <span shuku-edit-id="e-01fccbf4-b534-4550-b2f1-9b110707fd77" className="rtg-pixel-representation__probe" aria-hidden="true" style={{ left: `${(point.x + .5) / WIDTH * 100}%`, top: `${(point.y + .5) / HEIGHT * 100}%` }} />;

  return <ContentBlock shuku-edit-id="e-6ee57479-3210-4cdb-a9f6-18e12297c5aa" className="rtg-pixel-representation" headingLevel={1}
    onKeyDown={event => { if (event.key === ' ' && (event.target as Element).closest('button')) event.stopPropagation(); }}
    title="能否仅通过原始像素数字逐个比较来进行可靠分类？"
    subtitle="像素数字容易变化；模型需要从中学习更稳定、更适合分类的线索。">
    {step === 0 ? <div shuku-edit-id="e-48e18565-f1f2-4ae2-82f8-4aaaa61f7fea" className="rtg-pixel-representation__controls">
      <Typography shuku-edit-id="e-c3f75c9e-e8d5-486e-bb2d-4aa75a1d28dd" variant="bodySmall" tone="warning">① 换一种拍法</Typography>
      <div shuku-edit-id="e-7f174f50-cd7c-4735-b740-691ea4abf480" className="rtg-pixel-representation__conditions" role="group" aria-label="改变一种拍摄条件">
        {conditions.map(item => <Button key={item.id} disabled={!photos} data-condition={item.id}
          active={changed && condition === item.id} variant={changed && condition === item.id ? 'primary' : 'default'}
          aria-pressed={changed && condition === item.id} onClick={() => chooseCondition(item.id)}>{item.label}</Button>)}
      </div>
      <Button onClick={() => { setChanged(false); setPoint(INITIAL_POINT); }} disabled={!photos}>恢复原图</Button>
    </div> : <ol shuku-edit-id="e-1ad7ce78-c1c6-4990-9598-4f15126aa2fc" className="rtg-pixel-representation__flow" aria-label="从像素到表示">
      {['原始像素', '网络逐层加工', '特征表示'].map((label, index) => <li shuku-edit-id="e-b47eed1f-ae5b-4a46-858c-e33467e4b606" key={label}>
        <Typography shuku-edit-id="e-0e177322-ec24-4a40-ab81-e6095a8a9d9e" variant="body" tone={index === 2 ? 'success' : 'accent'}>{index + 1} · {label}</Typography>
      </li>)}
    </ol>}

    {step === 0 ? <div shuku-edit-id="e-ee6b258f-5829-4212-88a7-00e05def8809" className="rtg-pixel-representation__comparison" data-stage="pixels" id="rtg-pixel-representation-main-stage">
      <div shuku-edit-id="e-bd68ffe7-01fe-4312-9f25-fa21efdf1910" className="rtg-pixel-representation__photos">
        <figure shuku-edit-id="e-1711e709-6e0c-473a-bc0d-e68135be7d46" className="rtg-pixel-representation__photo">
          <Typography shuku-edit-id="e-a8484509-9811-4383-b9b8-dcde1cfde699" as="figcaption" variant="body" tone="accent">原始照片</Typography>
          <div shuku-edit-id="e-8bec12a7-59d6-4be9-a312-42f8d2464970" className="rtg-pixel-representation__photo-area"><div shuku-edit-id="e-55e0e88b-0383-4593-9e28-070e0f55c67c" className="rtg-pixel-representation__picture">
            <canvas shuku-edit-id="e-a4c22512-f7b4-469e-b646-bbb7ec223048" ref={originalRef} width={WIDTH} height={HEIGHT} role="img" tabIndex={0} aria-label="原始瓶子照片，点击或用方向键选择画面位置" onClick={inspect} onKeyDown={inspectKeys} />
            {photos && probe}
          </div></div>
          <RgbReadout rgb={baseline} />
        </figure>
        <figure shuku-edit-id="e-43a8c693-cf36-4614-8427-ff271fa3a3da" className="rtg-pixel-representation__photo">
          <Typography shuku-edit-id="e-0ebdf566-dd11-4dbf-9705-ca613e63eaa9" as="figcaption" variant="body" tone={changed ? 'warning' : 'accent'}>{changed ? selected.photo : '先点上方按钮'}</Typography>
          <div shuku-edit-id="e-dcdf9ffd-a663-4ba9-9d8c-aa550a33d332" className="rtg-pixel-representation__photo-area"><div shuku-edit-id="e-f3463d61-bbef-412d-85f7-b06f1c1b6bf7" className="rtg-pixel-representation__picture">
            <canvas shuku-edit-id="e-619918da-6491-4ed8-a48a-6217733fb0da" ref={changedRef} width={WIDTH} height={HEIGHT} role="img" tabIndex={0} aria-label="改变拍摄条件后的瓶子照片，点击或用方向键选择画面位置" onClick={inspect} onKeyDown={inspectKeys} />
            {photos && probe}
          </div></div>
          <RgbReadout rgb={current} />
        </figure>
      </div>
      <aside shuku-edit-id="e-cb7139fd-2df5-4cf1-9812-76a2fa42240d" className="rtg-pixel-representation__insight" aria-live="polite" aria-atomic="true">
        <div shuku-edit-id="e-d6a4cc6a-41b5-40ca-afb4-9302cb3a84ad" className="rtg-pixel-representation__takeaway">
          <Typography shuku-edit-id="e-f6bfcaab-e5d9-4ac1-abb1-9b6d1555e41f" as="p" variant="h1" tone="accent">{changed ? '像素变了，' : '换个拍法，'}</Typography>
          <Typography shuku-edit-id="e-a993ff33-89e1-479b-9cc4-9102ebff576b" as="p" variant="h1" tone="success">{changed ? '仍是塑料瓶' : '类别会变吗？'}</Typography>
        </div>
        <div shuku-edit-id="e-02e08e65-49dd-4b05-bc2f-14f47989a07b" ref={questionRef} className="rtg-pixel-representation__question-wrap">
          <Button variant="primary" className="rtg-pixel-representation__question"
            data-action="open-features" disabled={!photos} aria-expanded={false}
            aria-controls="rtg-pixel-representation-main-stage" onClick={() => setStep(1)}>
            <Typography shuku-edit-id="e-0e60c920-47ba-495c-a8b7-930c081b4570" as="span" variant="body" tone="inherit">看看模型学什么</Typography>
            <svg shuku-edit-id="e-ca7729fe-b0bb-476a-a55f-cc2e822cc0e9" className="rtg-pixel-representation__arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path shuku-edit-id="e-77ded696-36c0-4792-a8de-7e094a15e2f2" d="M4 12h16m-7-7 7 7-7 7" />
            </svg>
          </Button>
        </div>
      </aside>
      <Typography shuku-edit-id="e-ead1e655-42a9-4c0f-971e-d201ab21b792" className="rtg-pixel-representation__sample-caption" variant="bodySmall" tone="muted">
        同一坐标 ({point.x}, {point.y}) · 点照片取样
      </Typography>
    </div> : <div shuku-edit-id="e-2e46fcc5-389d-44ae-9c5d-083814bcf7e5" className="rtg-pixel-representation__representation" data-stage="features" id="rtg-pixel-representation-main-stage">
      <figure shuku-edit-id="e-39e1342f-0f19-4871-99c6-bddf1f7348a3" className="rtg-pixel-representation__photo rtg-pixel-representation__annotated">
        <Typography shuku-edit-id="e-2752618d-9399-4f8f-b442-83b0186394af" as="figcaption" variant="body" tone="accent">照片里有哪些有用线索？</Typography>
        <div shuku-edit-id="e-eff17ea6-0750-4487-b730-4c62124d0879" className="rtg-pixel-representation__photo-area"><div shuku-edit-id="e-27d62666-07b1-4554-9df4-7db2e7ddbcf9" className="rtg-pixel-representation__picture">
          <canvas shuku-edit-id="e-b19f0b45-dd91-4b9c-a96d-b539117211b3" ref={originalRef} width={WIDTH} height={HEIGHT} role="img" aria-label="塑料瓶照片，人工高亮选中的视觉线索" />
          <svg shuku-edit-id="e-c513c6d7-8e65-4e70-9265-06c6423e5f10" className="rtg-pixel-representation__annotations" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} aria-hidden="true">
            {clue === 0 && <g shuku-edit-id="e-44200fd0-89c0-40d3-b352-97895aa6915e" className="rtg-pixel-representation__highlight"><rect shuku-edit-id="e-4c094d0b-2d31-475c-89de-9c121089f3b4" x="106" y="18" width="45" height="32" rx="8" /><path shuku-edit-id="e-829d748f-9b3f-4807-a2d0-62a0987bb158" d="M108 43 Q129 48 149 43 M113 49 L110 59 M145 49 L148 59" /></g>}
            {clue === 1 && <g shuku-edit-id="e-ee8b82b7-3401-49a7-9931-d8737858da04" className="rtg-pixel-representation__highlight"><rect shuku-edit-id="e-0d758a43-9159-4423-90c6-8b19fa75ac19" x="88" y="66" width="79" height="48" rx="14" /><rect shuku-edit-id="e-2bb5175c-1c86-4c8a-b037-ddade454d2bb" x="87" y="188" width="79" height="70" rx="14" /><path shuku-edit-id="e-202f35a0-2038-4e1a-af2b-ed0c35b278f3" d="M98 76 L96 102 M154 204 L155 244" /></g>}
            {clue === 2 && <g shuku-edit-id="e-d2a07dfe-391b-4367-85c9-4a8750a3409e" className="rtg-pixel-representation__highlight"><path shuku-edit-id="e-350df4ca-946c-4060-8266-1c7a99017fae" d="M109 52 C108 70 85 77 85 109 L85 278 Q87 308 127 308 Q170 308 172 278 L172 109 C172 78 148 69 147 52" /></g>}
          </svg>
        </div></div>
      </figure>
      <section shuku-edit-id="e-3e3c3631-fefa-472e-9561-7fd89600af1d" className="rtg-pixel-representation__clues" aria-label="网络可以学习的视觉线索">
        <Typography shuku-edit-id="e-2c679451-f774-4eb3-97aa-a15e8c393d16" as="h2" ref={featureTitleRef} tabIndex={-1} className="rtg-pixel-representation__feature-title" variant="h3" tone="accent">从颜色到边缘、材质与形状</Typography>
        <Typography shuku-edit-id="e-058872f0-a2bb-4f3c-8fdf-2e272f485f45" variant="bodySmall" tone="muted">点击线索，看照片中的对应区域。</Typography>
        <div shuku-edit-id="e-e2f9baeb-4886-4690-b43e-fc3d0c4c4d02" className="rtg-pixel-representation__clue-buttons">
          {clues.map((item, index) => <Button className="rtg-pixel-representation__clue-button" key={item.label} data-clue={index}
            active={clue === index} aria-pressed={clue === index} onClick={() => setClue(index)}>
            <Typography shuku-edit-id="e-24b2762e-0221-42a1-86b7-570bc486afe3" as="span" variant="body" tone={clue === index ? 'success' : 'accent'}>{item.label}</Typography>
            <Typography shuku-edit-id="e-e9f82c01-01b0-4ca5-9854-bd661294ba33" as="span" variant="bodySmall" tone="muted">{item.description}</Typography>
          </Button>)}
        </div>
      </section>
      <aside shuku-edit-id="e-bdbfb157-5112-4be2-9480-b9d33e4aadae" className="rtg-pixel-representation__definition" aria-live="polite" aria-atomic="true">
        <div shuku-edit-id="e-76d7683c-5b1c-4b30-8ee3-8cbd677b9a4e" className="rtg-pixel-representation__definition-copy">
          <Typography shuku-edit-id="e-f11a5091-ab69-4df1-8d46-4144a99c3635" as="h2" variant="h1" tone="success">特征表示</Typography>
          <Typography shuku-edit-id="e-2b272bde-ebdb-4ab5-915b-0d74c3fe6719" variant="body" tone="accent">网络将像素加工成用于分类的中间数字。</Typography>
        </div>
        <div shuku-edit-id="e-54b13f11-48fe-4406-9281-aaab28bd6803" className="rtg-pixel-representation__feature-values">
          <div shuku-edit-id="e-1fe8e1a0-1473-45d4-bab1-81705e9c0e6a" className="rtg-pixel-representation__vector" role="group" aria-label="特征表示的示意数字，非概率、非模型实测">
            {clues[clue].values.map((value, index) => <Typography shuku-edit-id="e-120b12eb-ad15-47c1-8630-07aebd14598b" as="code" key={index} variant="body" tone="success">{value}</Typography>)}
          </div>
        </div>
      </aside>
    </div>}

    {(step === 1 || pixelStatus) && <footer shuku-edit-id="e-81742be4-5f9f-4e21-af72-8102aad161f1" className={'rtg-pixel-representation__footer' + (step === 0 ? ' rtg-pixel-representation__footer--statement' : '')}>
      {step === 0 && <Typography shuku-edit-id="e-8fd7575c-8c62-4411-b463-c5dde4ecff80" variant="bodySmall" tone="muted" role="status" aria-live="polite">{pixelStatus}</Typography>}
      {step === 1 && <div shuku-edit-id="e-7461e617-646e-43b0-a2b4-cb5283698a62" className="rtg-pixel-representation__actions"><Button onClick={() => setStep(0)}>再看像素</Button></div>}
    </footer>}
  </ContentBlock>;
}
