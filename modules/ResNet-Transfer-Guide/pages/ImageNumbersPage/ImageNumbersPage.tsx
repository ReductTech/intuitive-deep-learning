import { moduleIdentity } from '../../outlines.json';
import { moduleAssetUrl } from '../../../shared/react/assets';
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type MouseEvent } from 'react';
import { Button, ContentBlock, NoticeStrip, Typography } from '../../../shared/react';
import { useCompleteOnce } from '../../hooks/useCompleteOnce';
const bottleImage = moduleAssetUrl(moduleIdentity.id, "recycling/bottle-upright.png");
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
    <figure className={'rtg-image-numbers__channel' + (depth === 0 ? ' is-front' : '')}
      data-channel={channels[channel].letter} data-depth={depth}
      style={{ '--channel-color': channels[channel].color, '--stack-depth': depth, zIndex: 3 - depth } as CSSProperties}>
      <canvas ref={canvasRef} width={512} height={512} tabIndex={depth === 0 ? 0 : -1} role="img" aria-hidden={depth !== 0}
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
    <ContentBlock className="rtg-image-numbers" headingLevel={1}
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
      <ol className="rtg-image-numbers__steps" aria-label="图片解剖的三个步骤">
        {steps.map((label, index) => <li key={label} className={step === index ? 'is-current' : step > index ? 'is-done' : ''} aria-current={step === index ? 'step' : undefined}>
          <Typography as="span" variant="bodySmall" tone="inherit">{index + 1} · {label}</Typography>
        </li>)}
      </ol>

      <div className="rtg-image-numbers__experiment" data-step={step} ref={experimentRef}
        data-sample-region={`${origin.x},${origin.y},${PATCH_SIZE},${PATCH_SIZE}`}>
        {samplingLink && step < 2 && <svg className="rtg-image-numbers__sampling-link" aria-hidden="true"
          viewBox={`0 0 ${samplingLink.width} ${samplingLink.height}`} preserveAspectRatio="none">
          <path d={samplingLink.upper} /><path d={samplingLink.lower} />
        </svg>}
        <figure className="rtg-image-numbers__photo">
          <Typography variant="body" tone="accent">你眼里的照片</Typography>
          <div className="rtg-image-numbers__photo-area">
            <div className="rtg-image-numbers__photo-frame">
              <canvas ref={photoRef} width={SIZE} height={SIZE} role="img" tabIndex={step < 2 ? 0 : undefined}
                aria-label="224 × 224 的塑料瓶照片，点击或用方向键移动观察位置"
                onClick={inspectPhoto} onKeyDown={inspectWithKeyboard} />
              {data && step < 2 && <span ref={probeRef} className="rtg-image-numbers__probe" aria-hidden="true" style={{ left: `${origin.x / SIZE * 100}%`, top: `${origin.y / SIZE * 100}%`, width: `${PATCH_SIZE / SIZE * 100}%`, height: `${PATCH_SIZE / SIZE * 100}%` }} />}
            </div>
          </div>
          <Typography as="figcaption" variant="bodySmall" tone="muted">等比例放入 224 × 224 的画布</Typography>
        </figure>

        <section className="rtg-image-numbers__view" aria-label="从照片到数字的可视化">
          {step === 0 && <div className="rtg-image-numbers__mosaic-view rtg-image-numbers__reveal">
            <Typography variant="body" tone="inherit">放大选中的 8 × 8 像素</Typography>
            <div className="rtg-image-numbers__mosaic">
              {pixels.map((color, index) => <button type="button" key={index}
                className={index === selected ? 'is-selected' + (inspectedPixel === index ? ' is-ready' : '') : ''} style={{ background: `rgb(${color.join(',')})` }}
                aria-label={`像素 ${origin.x + index % 8}, ${origin.y + Math.floor(index / 8)}，红 ${color[0]}，绿 ${color[1]}，蓝 ${color[2]}`}
                aria-describedby={inspectedPixel === index ? 'rtg-image-numbers-pixel-prompt' : undefined}
                aria-pressed={index === selected} onClick={() => inspectPixel(index)} />)}
              {data && inspectedPixel === selected && <Typography
                as="span" variant="bodySmall" tone="inherit" role="tooltip"
                id="rtg-image-numbers-pixel-prompt" className="rtg-image-numbers__pixel-prompt"
                data-placement={Math.floor(selected / PATCH_SIZE) < 2 ? 'below' : 'above'}
                style={{
                  left: `clamp(144px, ${(selected % PATCH_SIZE + .5) / PATCH_SIZE * 100}%, calc(100% - 144px))`,
                  top: `${(Math.floor(selected / PATCH_SIZE) + (Math.floor(selected / PATCH_SIZE) < 2 ? 1 : 0)) / PATCH_SIZE * 100}%`,
                }}
              >再点一次，拆开 RGB →</Typography>}
              {!data && <Typography variant="bodySmall" tone="inherit">{imageError ? '图片加载失败，请刷新重试' : '正在读取图片…'}</Typography>}
            </div>
            <Typography variant="bodySmall" tone="inherit">先看颜色，拆开后再看 RGB 数字</Typography>
          </div>}
          {step === 1 && <div className="rtg-image-numbers__tables-view">
            <div className="rtg-image-numbers__channel-controls" role="group" aria-label="选择要置前的 RGB 通道">
              {channels.map((channel, index) => <button type="button" key={channel.letter}
                className={'rtg-image-numbers__channel-switch' + (frontChannel === index ? ' is-front' : '')}
                style={{ '--channel-color': channel.color } as CSSProperties}
                aria-pressed={frontChannel === index} onClick={() => setFrontChannel(index)}>
                <Typography as="strong" variant="bodySmall" tone="inherit">{channel.letter} · {channel.name}</Typography>
                <span className="rtg-image-numbers__channel-dot" aria-hidden="true" />
              </button>)}
            </div>
            <div className="rtg-image-numbers__tables">
              {channels.map((channel, index) => <ChannelTable key={channel.letter} channel={index} pixels={pixels} selected={selected}
                depth={(index - frontChannel + channels.length) % channels.length}
                onSelect={setSelected} onBringFront={() => setFrontChannel(index)} />)}
            </div>
            <Typography as="h2" ref={splitTitleRef} tabIndex={-1} variant="bodySmall" tone="muted" className="rtg-image-numbers__split-title">同一区域的三张 8 × 8 数字表，黄色框始终对应同一像素。</Typography>
          </div>}
          {step === 2 && <div className="rtg-image-numbers__total-view rtg-image-numbers__reveal">
            <Typography variant="body" tone="accent">整张彩色图片，一共有多少个数？</Typography>
            <div className="rtg-image-numbers__count-row">
              <div><Typography variant="h2" tone="accent">50,176</Typography><Typography variant="bodySmall" tone="muted">224 × 224 个像素</Typography></div>
              <Typography variant="h3" tone="muted">×</Typography>
              <div><Typography variant="h2" tone="accent">3</Typography><Typography variant="bodySmall" tone="muted">每个像素有 3 个数</Typography></div>
            </div>
            <div className="rtg-image-numbers__total">
              <Typography variant="display" tone="accent">150,528</Typography>
              <Typography variant="body" tone="accent">个数字</Typography>
            </div>
            <Typography variant="bodySmall" tone="muted">这些数字记录颜色，还没有直接写着“塑料瓶”。</Typography>
          </div>}
        </section>

        <aside className="rtg-image-numbers__inspector" aria-live="polite" aria-atomic="true">
          {step < 2 && <>
            <Typography variant="bodySmall" tone="muted">选中的像素 · ({selectedPoint.x}, {selectedPoint.y})</Typography>
            <div className="rtg-image-numbers__swatch" style={{ background: rgb ? `rgb(${rgb.join(',')})` : '#eef3fb' }} aria-label={rgb ? `像素颜色 rgb(${rgb.join(',')})` : '图片尚未加载'} />
            <div className="rtg-image-numbers__readings">
              {channels.map((channel, index) => <div className="rtg-image-numbers__reading" key={channel.letter} style={{ color: channel.color }}>
                <Typography as="strong" variant="body" tone="inherit">{channel.letter} · {channel.name}</Typography>
                <Typography as="strong" variant="h3" tone="inherit">{rgb?.[index] ?? '—'}</Typography>
                <div className="rtg-image-numbers__bar" aria-hidden="true"><span style={{ width: `${(rgb?.[index] ?? 0) / 255 * 100}%`, background: channel.color }} /></div>
              </div>)}
              <div className="rtg-image-numbers__range"><Typography variant="bodySmall" tone="muted">0 · 最低</Typography><Typography variant="bodySmall" tone="muted">255 · 最高</Typography></div>
            </div>
          </>}
          {step === 2 && <div className="rtg-image-numbers__prediction rtg-image-numbers__reveal">
            <Typography variant="bodySmall" tone="warning">图像识别要学会的事</Typography>
            <Typography variant="h3" tone="accent">从数字中认出物体</Typography>
            <Typography variant="body" tone="muted">150,528 个数字</Typography>
            <div className="rtg-image-numbers__arrow" aria-hidden="true" />
            <div className="rtg-image-numbers__model"><Typography variant="bodySmall" tone="accent">经过训练的识别模型</Typography></div>
            <div className="rtg-image-numbers__arrow" aria-hidden="true" />
            <Typography variant="h2" tone="success">“塑料瓶”</Typography>
            <Typography variant="bodySmall" tone="muted">过程示意；模型通过训练学会利用颜色、边缘和形状等线索。</Typography>
          </div>}
        </aside>
      </div>

      <footer className={'rtg-image-numbers__footer' + (step === 0 ? ' rtg-image-numbers__footer--inspect' : '')}>
        <NoticeStrip tone={imageError ? 'orange' : step === 2 ? 'green' : 'blue'} role="status">
          <Typography variant="bodySmall" tone="inherit">{imageError ? '图片加载失败，请刷新页面后重新尝试。' : tips[step]}</Typography>
        </NoticeStrip>
        {step > 0 && <div className="rtg-image-numbers__actions">
          <Button onClick={() => { setStep(0); setFrontChannel(0); changePoint(INITIAL_POINT); }}>重看</Button>
          {step === 1 && <Button variant="primary" disabled={!data} onClick={advance}>看看整张图片 →</Button>}
        </div>}
      </footer>
    </ContentBlock>
  );
}
