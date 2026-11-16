import { moduleIdentity } from '../../outlines.json';
import { moduleAssetUrl } from "@shuku/course-runtime/react/assets";
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type MouseEvent } from 'react';
import { Button, ContentBlock, NoticeStrip, Typography } from "@shuku/course-style/react";
import { useCompleteOnce } from '../../hooks/useCompleteOnce';
const bottleImage = moduleAssetUrl("recycling/bottle-upright.jpg");
import './ImageNumbersPage.css';

type Rgb = readonly [number, number, number];
type Point = { x: number; y: number };
type SamplingLink = { width: number; height: number; upper: string; lower: string };
const SIZE = 224;
const PATCH_SIZE = 8;
const INITIAL_POINT: Point = { x: 112, y: 16 };
const channels = [
  { name: '红', letter: 'R', color: '#da4854' },
  { name: '绿', letter: 'G', color: '#168354' },
  { name: '蓝', letter: 'B', color: '#346fe3' },
] as const;
const steps = ['放大看像素', '拆开红、绿、蓝', '从数字到类别'];
const tips = [
  '先看像素颜色，右侧显示选中位置的 R、G、B；再点同一像素展开三张数字表。点照片可换个观察位置。',
  '三张表记录同一块 8 × 8 区域。点击通道按钮或后层表格将它置前；点格子联动查看同一位置的三个数。',
  '改变拍摄条件，许多像素数字都会改变——为什么我们仍能认出同一个瓶子？下一页继续观察。',
];

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function rgbAt(data: ImageData, x: number, y: number): Rgb {
  const index = (y * SIZE + x) * 4;
  return [data.data[index], data.data[index + 1], data.data[index + 2]];
}

function pixelLabelColor(rgb: Rgb) {
  const linear = rgb.map(value => {
    const normalized = value / 255;
    return normalized <= .04045 ? normalized / 12.92 : ((normalized + .055) / 1.055) ** 2.4;
  });
  const luminance = .2126 * linear[0] + .7152 * linear[1] + .0722 * linear[2];
  return luminance > .179 ? '#000' : '#fff';
}

function ChannelTable({ channel, pixels, selected, depth, onSelect, onBringFront }: {
  channel: number; pixels: Rgb[]; selected: number; depth: number;
  onSelect: (index: number) => void; onBringFront: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const context = canvasRef.current?.getContext('2d');
    if (!context) return;
    const cell = 64;
    context.clearRect(0, 0, 512, 512);
    for (let index = 0; index < PATCH_SIZE ** 2; index += 1) {
      const rgb = pixels[index];
      if (!rgb) continue;
      const value = rgb[channel];
      const color: [number, number, number] = [0, 0, 0];
      color[channel] = value;
      const x = (index % PATCH_SIZE) * cell;
      const y = Math.floor(index / PATCH_SIZE) * cell;
      context.fillStyle = `rgb(${color.join(',')})`;
      context.fillRect(x, y, cell, cell);
      context.strokeStyle = 'rgba(255,255,255,.15)';
      context.lineWidth = 1;
      context.strokeRect(x + .5, y + .5, cell - 1, cell - 1);
      // Data labels belong to the numeric visualization, rather than the page type scale.
      context.font = '32px Consolas, monospace';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillStyle = pixelLabelColor(color);
      context.fillText(String(value), x + cell / 2, y + cell / 2);
    }
    const x = (selected % PATCH_SIZE) * cell;
    const y = Math.floor(selected / PATCH_SIZE) * cell;
    context.strokeStyle = '#ffd065';
    context.lineWidth = 4;
    context.strokeRect(x + 3, y + 3, cell - 6, cell - 6);
  }, [channel, pixels, selected]);

  const selectCell = (event: MouseEvent<HTMLCanvasElement>) => {
    if (depth !== 0) { onBringFront(); return; }
    const bounds = event.currentTarget.getBoundingClientRect();
    const col = clamp(Math.floor((event.clientX - bounds.left) / bounds.width * PATCH_SIZE), 0, PATCH_SIZE - 1);
    const row = clamp(Math.floor((event.clientY - bounds.top) / bounds.height * PATCH_SIZE), 0, PATCH_SIZE - 1);
    onSelect(row * PATCH_SIZE + col);
  };
  const selectWithKeyboard = (event: KeyboardEvent<HTMLCanvasElement>) => {
    const movement: Record<string, Point> = { ArrowLeft: { x: -1, y: 0 }, ArrowRight: { x: 1, y: 0 }, ArrowUp: { x: 0, y: -1 }, ArrowDown: { x: 0, y: 1 } };
    if (!(event.key in movement)) return;
    event.preventDefault();
    if (depth !== 0) { onBringFront(); return; }
    const col = clamp(selected % PATCH_SIZE + movement[event.key].x, 0, PATCH_SIZE - 1);
    const row = clamp(Math.floor(selected / PATCH_SIZE) + movement[event.key].y, 0, PATCH_SIZE - 1);
    onSelect(row * PATCH_SIZE + col);
  };

  return (
    <figure shuku-edit-id="e-e51725bf-b602-4a03-833f-3612c9adccec" className={'rtg-image-numbers__channel' + (depth === 0 ? ' is-front' : '')}
      data-channel={channels[channel].letter} data-depth={depth}
      style={{ '--channel-color': channels[channel].color, '--stack-depth': depth, zIndex: 3 - depth } as CSSProperties}>
      <canvas shuku-edit-id="e-3e67400a-5a74-45ef-a26d-adbb79da3e4c" ref={canvasRef} width={512} height={512} tabIndex={depth === 0 ? 0 : -1} role="img" aria-hidden={depth !== 0}
        aria-label={`${channels[channel].name}通道的 8 × 8 数字表，点击或用方向键选择像素`}
        onClick={selectCell} onKeyDown={selectWithKeyboard} />
    </figure>
  );
}

export function ImageNumbersPage({ onComplete }: { onComplete?: () => void }) {
  const [step, setStep] = useState(0);
  const [point, setPoint] = useState<Point>(INITIAL_POINT);
  const [selected, setSelected] = useState(36);
  // A default highlight is not a first click: each pixel must be explicitly inspected.
  const [inspectedPixel, setInspectedPixel] = useState<number | null>(null);
  const [frontChannel, setFrontChannel] = useState(0);
  const [samplingLink, setSamplingLink] = useState<SamplingLink | null>(null);
  const [data, setData] = useState<ImageData | null>(null);
  const [imageError, setImageError] = useState(false);
  const photoRef = useRef<HTMLCanvasElement>(null);
  const experimentRef = useRef<HTMLDivElement>(null);
  const probeRef = useRef<HTMLSpanElement>(null);
  const splitTitleRef = useRef<HTMLHeadingElement>(null);
  useCompleteOnce(step === 2, onComplete);

  useEffect(() => {
    if (step === 1) splitTitleRef.current?.focus();
  }, [step]);

  useLayoutEffect(() => {
    if (step === 2 || !data) { setSamplingLink(null); return; }
    const experiment = experimentRef.current;
    const probe = probeRef.current;
    const target = experiment?.querySelector<HTMLElement>(step === 0
      ? '.rtg-image-numbers__mosaic' : '.rtg-image-numbers__channel.is-front canvas');
    if (!experiment || !probe || !target) return;
    function updateLink() {
      if (!experiment || !probe || !target) return;
      const bounds = experiment.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;
      const sourceBounds = probe.getBoundingClientRect();
      const targetBounds = target.getBoundingClientRect();
      const scaleX = bounds.width / experiment.offsetWidth;
      const scaleY = bounds.height / experiment.offsetHeight;
      const x = (value: number) => Number(((value - bounds.left) / scaleX).toFixed(2));
      const y = (value: number) => Number(((value - bounds.top) / scaleY).toFixed(2));
      const next: SamplingLink = {
        width: experiment.offsetWidth, height: experiment.offsetHeight,
        upper: `M ${x(sourceBounds.right)} ${y(sourceBounds.top)} L ${x(targetBounds.left)} ${y(targetBounds.top)}`,
        lower: `M ${x(sourceBounds.right)} ${y(sourceBounds.bottom)} L ${x(targetBounds.left)} ${y(targetBounds.bottom)}`,
      };
      setSamplingLink(current => current?.upper === next.upper && current.lower === next.lower &&
        current.width === next.width && current.height === next.height ? current : next);
    }
    // Track the actual moving layer during the split/switch, including scaled PPTs.
    let frame = 0;
    const until = performance.now() + 850;
    const track = () => { updateLink(); if (performance.now() < until) frame = requestAnimationFrame(track); };
    const observer = new ResizeObserver(updateLink);
    observer.observe(experiment);
    observer.observe(target);
    window.addEventListener('resize', updateLink);
    track();
    return () => { cancelAnimationFrame(frame); observer.disconnect(); window.removeEventListener('resize', updateLink); };
  }, [step, frontChannel, data, point.x, point.y]);

  useEffect(() => {
    let cancelled = false;
    const image = new Image();
    image.onload = () => {
      if (cancelled) return;
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = SIZE;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      if (!context) { setImageError(true); return; }
      const scale = Math.min(SIZE / image.naturalWidth, SIZE / image.naturalHeight);
      const width = image.naturalWidth * scale;
      const height = image.naturalHeight * scale;
      context.fillStyle = '#fff';
      context.fillRect(0, 0, SIZE, SIZE);
      context.drawImage(image, (SIZE - width) / 2, (SIZE - height) / 2, width, height);
      setData(context.getImageData(0, 0, SIZE, SIZE));
    };
    image.onerror = () => { if (!cancelled) setImageError(true); };
    image.src = bottleImage;
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (data) photoRef.current?.getContext('2d')?.putImageData(data, 0, 0);
  }, [data]);

  const origin = { x: clamp(point.x - 4, 0, SIZE - PATCH_SIZE), y: clamp(point.y - 4, 0, SIZE - PATCH_SIZE) };
  const pixels = useMemo(() => data ? Array.from({ length: 64 }, (_, index) =>
    rgbAt(data, clamp(point.x - 4, 0, SIZE - PATCH_SIZE) + index % 8,
      clamp(point.y - 4, 0, SIZE - PATCH_SIZE) + Math.floor(index / 8))) : [], [data, point]);
  const rgb = pixels[selected];
  const selectedPoint = { x: origin.x + selected % 8, y: origin.y + Math.floor(selected / 8) };
  const changePoint = (nextPoint: Point) => { setPoint(nextPoint); setSelected(36); setInspectedPixel(null); };
  const advance = () => {
    if (step === 0) setFrontChannel(0);
    setInspectedPixel(null);
    setStep(current => Math.min(current + 1, 2));
  };
  const inspectPixel = (index: number) => {
    if (index === selected && index === inspectedPixel) {
      advance();
      return;
    }
    setSelected(index);
    setInspectedPixel(index);
  };
  const inspectPhoto = (event: MouseEvent<HTMLCanvasElement>) => {
    if (step === 2 || !data) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    changePoint({
      x: clamp(Math.floor((event.clientX - bounds.left) / bounds.width * SIZE), 0, SIZE - 1),
      y: clamp(Math.floor((event.clientY - bounds.top) / bounds.height * SIZE), 0, SIZE - 1),
    });
  };
  const inspectWithKeyboard = (event: KeyboardEvent<HTMLCanvasElement>) => {
    if (step === 2 || !data) return;
    const movement: Record<string, Point> = { ArrowLeft: { x: -1, y: 0 }, ArrowRight: { x: 1, y: 0 }, ArrowUp: { x: 0, y: -1 }, ArrowDown: { x: 0, y: 1 } };
    if (!(event.key in movement)) return;
    event.preventDefault();
    changePoint({ x: clamp(point.x + movement[event.key].x, 0, 223), y: clamp(point.y + movement[event.key].y, 0, 223) });
  };

  return (
    <ContentBlock shuku-edit-id="e-cd24d4b0-37f7-4f9c-adf6-588b8281b567" className="rtg-image-numbers" headingLevel={1}
      title="计算机是怎样“看”一张塑料瓶照片的？"
      subtitle="你看见一个塑料瓶，计算机读到的是每个位置的红、绿、蓝数值。"
      onKeyDown={(event) => {
        const target = event.target as Element;
        if ((event.key === ' ' && target.closest('button')) ||
          (event.key.startsWith('Arrow') && target.tagName === 'CANVAS')) event.stopPropagation();
        if (event.key === 'Escape' && inspectedPixel !== null) {
          setInspectedPixel(null);
          event.stopPropagation();
        }
      }}>
      <ol shuku-edit-id="e-a9d669dd-7604-42f8-8eb2-8deec0a76a68" className="rtg-image-numbers__steps" aria-label="图片解剖的三个步骤">
        {steps.map((label, index) => <li shuku-edit-id="e-63213a80-e6bf-4102-86f7-f6447895bbc1" key={label} className={step === index ? 'is-current' : step > index ? 'is-done' : ''} aria-current={step === index ? 'step' : undefined}>
          <Typography shuku-edit-id="e-cc533aca-ca75-477a-9168-ceb80df64d53" as="span" variant="bodySmall" tone="inherit">{index + 1} · {label}</Typography>
        </li>)}
      </ol>

      <div shuku-edit-id="e-3b4a2655-cd2b-4dc6-9164-f7f523e8f650" className="rtg-image-numbers__experiment" data-step={step} ref={experimentRef}
        data-sample-region={`${origin.x},${origin.y},${PATCH_SIZE},${PATCH_SIZE}`}>
        {samplingLink && step < 2 && <svg shuku-edit-id="e-14fb0cda-1a52-47bb-9624-dd7a4a6fdf99" className="rtg-image-numbers__sampling-link" aria-hidden="true"
          viewBox={`0 0 ${samplingLink.width} ${samplingLink.height}`} preserveAspectRatio="none">
          <path shuku-edit-id="e-e53887e4-c739-4166-8391-be558ea2283c" d={samplingLink.upper} /><path shuku-edit-id="e-bc625431-0dc8-4af6-a1c7-17ce61834f88" d={samplingLink.lower} />
        </svg>}
        <figure shuku-edit-id="e-23cde35a-5841-4237-8596-34e3e70b02b6" className="rtg-image-numbers__photo">
          <Typography shuku-edit-id="e-ff2cb7d3-9253-4fc9-844e-ecc33c9ede71" variant="body" tone="accent">你眼里的照片</Typography>
          <div shuku-edit-id="e-21a6914e-f3ab-4e54-ae6c-1052e6ad056e" className="rtg-image-numbers__photo-area">
            <div shuku-edit-id="e-4b332f20-49a4-4df8-abdb-e5c1f97c8cff" className="rtg-image-numbers__photo-frame">
              <canvas shuku-edit-id="e-f741ad5f-fd2e-437c-af03-e306c10f32a9" ref={photoRef} width={SIZE} height={SIZE} role="img" tabIndex={step < 2 ? 0 : undefined}
                aria-label="224 × 224 的塑料瓶照片，点击或用方向键移动观察位置"
                onClick={inspectPhoto} onKeyDown={inspectWithKeyboard} />
              {data && step < 2 && <span shuku-edit-id="e-a484b562-01f5-4fb6-bfdf-e4f19bab4ae6" ref={probeRef} className="rtg-image-numbers__probe" aria-hidden="true" style={{ left: `${origin.x / SIZE * 100}%`, top: `${origin.y / SIZE * 100}%`, width: `${PATCH_SIZE / SIZE * 100}%`, height: `${PATCH_SIZE / SIZE * 100}%` }} />}
            </div>
          </div>
          <Typography shuku-edit-id="e-d6646519-90a2-4d97-ae22-8110484b1254" as="figcaption" variant="bodySmall" tone="muted">等比例放入 224 × 224 的画布</Typography>
        </figure>

        <section shuku-edit-id="e-f90e9414-7fba-4f8c-823c-ad22eb6cf896" className="rtg-image-numbers__view" aria-label="从照片到数字的可视化">
          {step === 0 && <div shuku-edit-id="e-cb079610-bbed-448b-a875-1fb52bd96307" className="rtg-image-numbers__mosaic-view rtg-image-numbers__reveal">
            <Typography shuku-edit-id="e-d234abcf-5710-4f00-bc33-212067e7c363" variant="body" tone="inherit">放大选中的 8 × 8 像素</Typography>
            <div shuku-edit-id="e-adee9b75-6bdb-482c-b6a1-a4a7ed1db6d8" className="rtg-image-numbers__mosaic">
              {pixels.map((color, index) => <button shuku-edit-id="e-55480fb5-b1b3-447e-8226-c10bebcc239d" type="button" key={index}
                className={index === selected ? 'is-selected' + (inspectedPixel === index ? ' is-ready' : '') : ''} style={{ background: `rgb(${color.join(',')})` }}
                aria-label={`像素 ${origin.x + index % 8}, ${origin.y + Math.floor(index / 8)}，红 ${color[0]}，绿 ${color[1]}，蓝 ${color[2]}`}
                aria-describedby={inspectedPixel === index ? 'rtg-image-numbers-pixel-prompt' : undefined}
                aria-pressed={index === selected} onClick={() => inspectPixel(index)} />)}
              {data && inspectedPixel === selected && <Typography shuku-edit-id="e-8b1fdc6e-b249-43bd-90b5-d7087b277fcf"
                as="span" variant="bodySmall" tone="inherit" role="tooltip"
                id="rtg-image-numbers-pixel-prompt" className="rtg-image-numbers__pixel-prompt"
                data-placement={Math.floor(selected / PATCH_SIZE) < 2 ? 'below' : 'above'}
                style={{
                  left: `clamp(144px, ${(selected % PATCH_SIZE + .5) / PATCH_SIZE * 100}%, calc(100% - 144px))`,
                  top: `${(Math.floor(selected / PATCH_SIZE) + (Math.floor(selected / PATCH_SIZE) < 2 ? 1 : 0)) / PATCH_SIZE * 100}%`,
                }}
              >再点一次，拆开 RGB →</Typography>}
              {!data && <Typography shuku-edit-id="e-0c2a7996-d362-48d4-96d4-300fdf23c217" variant="bodySmall" tone="inherit">{imageError ? '图片加载失败，请刷新重试' : '正在读取图片…'}</Typography>}
            </div>
            <Typography shuku-edit-id="e-bddc38e8-7bbe-414f-ac04-1250822c105a" variant="bodySmall" tone="inherit">先看颜色，拆开后再看 RGB 数字</Typography>
          </div>}
          {step === 1 && <div shuku-edit-id="e-9f02020e-9486-430b-bc7a-15b0ee7d5fca" className="rtg-image-numbers__tables-view">
            <div shuku-edit-id="e-806ddc93-b7c1-41fc-8162-a81b573f5918" className="rtg-image-numbers__channel-controls" role="group" aria-label="选择要置前的 RGB 通道">
              {channels.map((channel, index) => <button shuku-edit-id="e-5e21ff00-9194-41cf-951f-cc444eb423e8" type="button" key={channel.letter}
                className={'rtg-image-numbers__channel-switch' + (frontChannel === index ? ' is-front' : '')}
                style={{ '--channel-color': channel.color } as CSSProperties}
                aria-pressed={frontChannel === index} onClick={() => setFrontChannel(index)}>
                <Typography shuku-edit-id="e-d290b76d-5308-47d3-aeca-6a527c0abc5e" as="strong" variant="bodySmall" tone="inherit">{channel.letter} · {channel.name}</Typography>
                <span shuku-edit-id="e-c12b53d6-8f10-4789-b7f7-5d679c7b372b" className="rtg-image-numbers__channel-dot" aria-hidden="true" />
              </button>)}
            </div>
            <div shuku-edit-id="e-8871ee9b-fa95-48a6-bf38-bb3c4fd24464" className="rtg-image-numbers__tables">
              {channels.map((channel, index) => <ChannelTable key={channel.letter} channel={index} pixels={pixels} selected={selected}
                depth={(index - frontChannel + channels.length) % channels.length}
                onSelect={setSelected} onBringFront={() => setFrontChannel(index)} />)}
            </div>
            <Typography shuku-edit-id="e-4eef5c97-a4b3-4427-90c5-8a67bf47c629" as="h2" ref={splitTitleRef} tabIndex={-1} variant="bodySmall" tone="muted" className="rtg-image-numbers__split-title">同一区域的三张 8 × 8 数字表，黄色框始终对应同一像素。</Typography>
          </div>}
          {step === 2 && <div shuku-edit-id="e-bda662b9-d4e0-4024-bc53-ac9dd580fec4" className="rtg-image-numbers__total-view rtg-image-numbers__reveal">
            <Typography shuku-edit-id="e-82c9483b-7c54-469a-bf71-6a32c5d20de7" variant="body" tone="accent">整张彩色图片，一共有多少个数？</Typography>
            <div shuku-edit-id="e-945fbbb5-b05e-45a9-921f-85345eb50451" className="rtg-image-numbers__count-row">
              <div shuku-edit-id="e-1de75557-5bce-4f5d-a816-e2f5d77c89c0"><Typography shuku-edit-id="e-b5fc2452-7916-49e8-ba18-6ffa1f0e9e87" variant="h2" tone="accent">50,176</Typography><Typography shuku-edit-id="e-b80e7b34-0e81-4ec2-9e0f-094d01b5972d" variant="bodySmall" tone="muted">224 × 224 个像素</Typography></div>
              <Typography shuku-edit-id="e-77136544-cbac-4d33-9789-178d71a0918e" variant="h3" tone="muted">×</Typography>
              <div shuku-edit-id="e-daa6dcd2-5a7b-4b8a-8da6-4b0fc79bcf5f"><Typography shuku-edit-id="e-61779edf-3b51-41a1-964a-a683d86cbbae" variant="h2" tone="accent">3</Typography><Typography shuku-edit-id="e-12ac10a1-bd6d-43df-972b-fccf25df5774" variant="bodySmall" tone="muted">每个像素有 3 个数</Typography></div>
            </div>
            <div shuku-edit-id="e-3e618b2c-c608-480b-b992-0796e27ded1e" className="rtg-image-numbers__total">
              <Typography shuku-edit-id="e-fb70a771-3164-4ec4-a929-ec0771363f70" variant="display" tone="accent">150,528</Typography>
              <Typography shuku-edit-id="e-37af1a04-d2e5-4cb8-b169-fe073a1b290f" variant="body" tone="accent">个数字</Typography>
            </div>
            <Typography shuku-edit-id="e-57563d25-beea-450f-a1c1-b4c84733079f" variant="bodySmall" tone="muted">这些数字记录颜色，还没有直接写着“塑料瓶”。</Typography>
          </div>}
        </section>

        <aside shuku-edit-id="e-1a578ca1-c119-42dd-a404-abf61e01a9f5" className="rtg-image-numbers__inspector" aria-live="polite" aria-atomic="true">
          {step < 2 && <>
            <Typography shuku-edit-id="e-d419257f-838a-4b6e-bfba-eb7d04925a75" variant="bodySmall" tone="muted">选中的像素 · ({selectedPoint.x}, {selectedPoint.y})</Typography>
            <div shuku-edit-id="e-9ecc86e8-f00a-4053-968a-caf7763136cb" className="rtg-image-numbers__swatch" style={{ background: rgb ? `rgb(${rgb.join(',')})` : '#eef3fb' }} aria-label={rgb ? `像素颜色 rgb(${rgb.join(',')})` : '图片尚未加载'} />
            <div shuku-edit-id="e-a3a89821-a8a9-4183-a09d-df6573bc0811" className="rtg-image-numbers__readings">
              {channels.map((channel, index) => <div shuku-edit-id="e-6507a2d3-5b41-45c4-b89a-34bb3a343753" className="rtg-image-numbers__reading" key={channel.letter} style={{ color: channel.color }}>
                <Typography shuku-edit-id="e-4ec5c087-902b-413a-ab35-c0794187b550" as="strong" variant="body" tone="inherit">{channel.letter} · {channel.name}</Typography>
                <Typography shuku-edit-id="e-c8ef90ea-0b5f-4602-bd85-570ad87b9823" as="strong" variant="h3" tone="inherit">{rgb?.[index] ?? '—'}</Typography>
                <div shuku-edit-id="e-48a4604c-bef7-4203-8b18-3804db679106" className="rtg-image-numbers__bar" aria-hidden="true"><span shuku-edit-id="e-31a76b4f-c3fe-4316-90eb-96b52147b43f" style={{ width: `${(rgb?.[index] ?? 0) / 255 * 100}%`, background: channel.color }} /></div>
              </div>)}
              <div shuku-edit-id="e-f3280a71-868a-4d34-a15d-0bb3bb12aef2" className="rtg-image-numbers__range"><Typography shuku-edit-id="e-53f2815a-dbf4-488d-9d73-e7905fb35164" variant="bodySmall" tone="muted">0 · 最低</Typography><Typography shuku-edit-id="e-5f8dbe28-1134-4286-a346-a22cacb1c962" variant="bodySmall" tone="muted">255 · 最高</Typography></div>
            </div>
          </>}
          {step === 2 && <div shuku-edit-id="e-9b3021ac-2a74-4e20-9395-3de7ddcedaf6" className="rtg-image-numbers__prediction rtg-image-numbers__reveal">
            <Typography shuku-edit-id="e-2095030a-a7a9-4de9-8deb-84898b918628" variant="bodySmall" tone="warning">图像识别要学会的事</Typography>
            <Typography shuku-edit-id="e-81ea30a0-1903-43ef-a341-3b924fdbb052" variant="h3" tone="accent">从数字中认出物体</Typography>
            <Typography shuku-edit-id="e-0cd84e68-5295-41e2-8b17-3fb727cdc14d" variant="body" tone="muted">150,528 个数字</Typography>
            <div shuku-edit-id="e-5f041704-0462-4124-af0b-e251fe79ae90" className="rtg-image-numbers__arrow" aria-hidden="true" />
            <div shuku-edit-id="e-c22ad213-e38a-4aa0-b685-c5c493a89a50" className="rtg-image-numbers__model"><Typography shuku-edit-id="e-e9a3617e-1332-483d-9540-5421a7cd30b5" variant="bodySmall" tone="accent">经过训练的识别模型</Typography></div>
            <div shuku-edit-id="e-07e4e76a-40a1-49a5-ba89-12097f00e1a7" className="rtg-image-numbers__arrow" aria-hidden="true" />
            <Typography shuku-edit-id="e-ea04f226-3b0b-4321-a277-3be16f858d5e" variant="h2" tone="success">“塑料瓶”</Typography>
            <Typography shuku-edit-id="e-a31ffba2-15e9-41ab-883a-bb32b077af83" variant="bodySmall" tone="muted">过程示意；模型通过训练学会利用颜色、边缘和形状等线索。</Typography>
          </div>}
        </aside>
      </div>

      <footer shuku-edit-id="e-18dcbdf2-0953-4a64-8c2f-5e5df81efff1" className={'rtg-image-numbers__footer' + (step === 0 ? ' rtg-image-numbers__footer--inspect' : '')}>
        <NoticeStrip tone={imageError ? 'orange' : step === 2 ? 'green' : 'blue'} role="status">
          <Typography shuku-edit-id="e-f29a2b7b-ff75-40ac-a794-d4baaaf48722" variant="bodySmall" tone="inherit">{imageError ? '图片加载失败，请刷新页面后重新尝试。' : tips[step]}</Typography>
        </NoticeStrip>
        {step > 0 && <div shuku-edit-id="e-d3e87717-6dbe-4c3a-82e1-1c4942f10dc8" className="rtg-image-numbers__actions">
          <Button onClick={() => { setStep(0); setFrontChannel(0); changePoint(INITIAL_POINT); }}>重看</Button>
          {step === 1 && <Button variant="primary" disabled={!data} onClick={advance}>看看整张图片 →</Button>}
        </div>}
      </footer>
    </ContentBlock>
  );
}
