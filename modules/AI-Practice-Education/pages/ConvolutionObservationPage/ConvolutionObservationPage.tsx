import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, ContentBlock, moduleAssetUrl, Typography } from '../../../shared/react';
import { WormholeIcon } from '../../components/WormholeLessonFrame';
import outline from '../../outlines.json';
import {
  CYCLE_DURATION_MS, IMAGE_SIZE, IMAGE_EXAMPLES, TILE_DURATION_MS, SCAN_DURATION_MS,
  TILE_COUNT, TILE_SIZE, TILES_PER_ROW, rgbaToGray, edgeMagnitude, type KernelDirection,
} from './convolutionModel';
import './ConvolutionObservationPage.css';

type Sample = { color: Uint8ClampedArray; gray: Float32Array };
type ScanFrame = { pattern: number; tiles: number; phase: 'scanning' | 'holding' };

async function loadSample(file: string): Promise<Sample> {
  const image = new Image();
  image.crossOrigin = 'anonymous';
  image.src = moduleAssetUrl(outline.moduleIdentity.id, `images/edge-examples/${file}`);
  await image.decode();
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = IMAGE_SIZE;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('无法读取示例图像');
  context.drawImage(image, 0, 0, IMAGE_SIZE, IMAGE_SIZE);
  const color = context.getImageData(0, 0, IMAGE_SIZE, IMAGE_SIZE).data;
  return { color, gray: rgbaToGray(color) };
}

function ImagePlane({ values, color, tiles, label }: {
  values: Float32Array; color?: Uint8ClampedArray; tiles: number; label: string;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const context = canvas.current?.getContext('2d');
    if (!context) return;
    const pixels = context.createImageData(IMAGE_SIZE, IMAGE_SIZE);
    if (color) pixels.data.set(color);
    else for (let y = 0; y < IMAGE_SIZE; y++) for (let x = 0; x < IMAGE_SIZE; x++) {
      const pixel = y * IMAGE_SIZE + x;
      const tile = Math.floor(y / TILE_SIZE) * TILES_PER_ROW + Math.floor(x / TILE_SIZE);
      const brightness = tile < tiles ? values[pixel] * 255 : 0;
      pixels.data[pixel * 4] = pixels.data[pixel * 4 + 1] = pixels.data[pixel * 4 + 2] = brightness;
      pixels.data[pixel * 4 + 3] = 255;
    }
    context.putImageData(pixels, 0, 0);
  }, [values, color, tiles]);
  const cursor = {
    left: `${tiles % TILES_PER_ROW / TILES_PER_ROW * 100}%`,
    top: `${Math.floor(tiles / TILES_PER_ROW) / TILES_PER_ROW * 100}%`,
    width: `${100 / TILES_PER_ROW}%`, height: `${100 / TILES_PER_ROW}%`,
  };
  return (
    <div className="llmpe-conv-plane" data-plane={color ? 'input' : 'output'}>
      <canvas ref={canvas} width={IMAGE_SIZE} height={IMAGE_SIZE} role="img" aria-label={label} />
      {tiles < TILE_COUNT && <span className="llmpe-conv-scanblock" style={cursor} aria-hidden="true" />}
    </div>
  );
}

export function ConvolutionObservationPage() {
  const root = useRef<HTMLElement>(null);
  const [samples, setSamples] = useState<Sample[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [direction, setDirection] = useState<KernelDirection>('vertical');
  const [frame, setFrame] = useState<ScanFrame>({ pattern: 0, tiles: 0, phase: 'scanning' });
  const currentPattern = useRef(0);

  useEffect(() => {
    let cancelled = false;
    setLoadError(false);
    Promise.all(IMAGE_EXAMPLES.map(example => loadSample(example.file)))
      .then(loaded => { if (!cancelled) setSamples(loaded); })
      .catch(() => { if (!cancelled) setLoadError(true); });
    return () => { cancelled = true; };
  }, [retry]);

  useEffect(() => {
    if (!samples) return;
    let visible = false, elapsed = 0, last: number | undefined, animation = 0;
    const firstPattern = currentPattern.current;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const resetClock = () => { last = undefined; };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting && entry.intersectionRatio >= .25; resetClock(); }, { threshold: .25 });
    if (root.current) observer.observe(root.current);
    document.addEventListener('visibilitychange', resetClock);
    setFrame({ pattern: firstPattern, tiles: reduced.matches ? TILE_COUNT : 0, phase: reduced.matches ? 'holding' : 'scanning' });
    function tick(now: number) {
      if (visible && !document.hidden) {
        if (last !== undefined) elapsed += now - last;
        const cycle = Math.floor(elapsed / CYCLE_DURATION_MS);
        const position = elapsed % CYCLE_DURATION_MS;
        const pattern = (firstPattern + cycle) % IMAGE_EXAMPLES.length;
        const tiles = Math.min(TILE_COUNT, Math.floor(position / TILE_DURATION_MS));
        const phase = position >= SCAN_DURATION_MS ? 'holding' : 'scanning';
        currentPattern.current = pattern;
        setFrame(previous => previous.pattern === pattern && previous.tiles === tiles && previous.phase === phase ? previous : { pattern, tiles, phase });
      }
      last = now;
      animation = requestAnimationFrame(tick);
    }
    if (!reduced.matches) animation = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(animation); observer.disconnect(); document.removeEventListener('visibilitychange', resetClock); };
  }, [direction, samples]);

  const input = samples?.[frame.pattern];
  const output = useMemo(() => input ? edgeMagnitude(input.gray, direction) : new Float32Array(IMAGE_SIZE ** 2), [input, direction]);
  function selectDirection(next: KernelDirection) {
    if (next === direction) return;
    setFrame(previous => ({ ...previous, tiles: 0, phase: 'scanning' }));
    setDirection(next);
  }

  return (
    <ContentBlock ref={root} className="llmpe-conv-page" headingLevel={1}
      title={outline.pages[10].title} subtitle="以边缘检测为例：先观察图像处理的效果"
      bodyClassName="llmpe-conv-body" data-kernel={direction} data-pattern={frame.pattern}
      data-tiles={frame.tiles} data-phase={frame.phase} data-ready={Boolean(samples)}>
      <div className="llmpe-conv-content">
        <section className="llmpe-conv-experiment" aria-label="卷积边缘实验">
          <Typography as="h2" variant="h2" tone="accent">卷积边缘实验</Typography>
          {!samples ? <div className="llmpe-conv-loading" role="status">
            <Typography variant="body" tone="muted">{loadError ? '示例图像加载失败，请重试。' : '正在加载示例图像…'}</Typography>
            {loadError && <Button onClick={() => setRetry(value => value + 1)}>重试</Button>}
          </div> : <div className="llmpe-conv-stage">
            <div className="llmpe-conv-image-group">
              <Typography as="h3" variant="h3" tone="accent" align="center">输入图像</Typography>
              <ImagePlane values={input!.gray} color={input!.color} tiles={frame.tiles} label={`输入图像：${IMAGE_EXAMPLES[frame.pattern].name}`} />
            </div>
            <div className="llmpe-conv-kernel-group">
              <Typography as="h3" variant="h3" tone="accent" align="center">观察方向</Typography>
              <div className="llmpe-conv-direction" role="img" aria-label={`${direction === 'vertical' ? '竖向' : '横向'}边缘示意`}>
                <span className={`llmpe-conv-direction-lines${direction === 'horizontal' ? ' is-horizontal' : ''}`} aria-hidden="true"><i /><i /><i /></span>
              </div>
              <div className="llmpe-conv-switch" role="group" aria-label="切换边缘检测方向">
                <Button variant={direction === 'vertical' ? 'primary' : 'default'} aria-pressed={direction === 'vertical'} onClick={() => selectDirection('vertical')}><Typography as="span" variant="bodySmall" tone="inherit">竖向边缘</Typography></Button>
                <Button variant={direction === 'horizontal' ? 'primary' : 'default'} aria-pressed={direction === 'horizontal'} onClick={() => selectDirection('horizontal')}><Typography as="span" variant="bodySmall" tone="inherit">横向边缘</Typography></Button>
              </div>
            </div>
            <div className="llmpe-conv-image-group">
              <Typography as="h3" variant="h3" tone="accent" align="center">边缘响应强度</Typography>
              <ImagePlane values={output} tiles={frame.tiles} label={`${IMAGE_EXAMPLES[frame.pattern].name}的${direction === 'vertical' ? '竖向' : '横向'}边缘响应，已生成${frame.tiles}块`} />
            </div>
          </div>}
        </section>
        <aside className="llmpe-conv-sidebar" aria-label="科普教育的优势">
          <Typography as="h2" variant="h2" tone="accent">科普教育的优势</Typography>
          {([
            ['light', '直观', '用熟悉的事物帮助理解'],
            ['book', '低门槛', '不需要太多专业知识'],
            ['heart', '激发兴趣', '让复杂的概念变得有趣'],
          ] as const).map(([kind, title, text]) => (
            <div className="llmpe-conv-benefit" key={title}>
              <span className="llmpe-conv-icon"><WormholeIcon kind={kind} /></span>
              <div><Typography as="h3" variant="h3" tone="accent">{title}</Typography><Typography variant="bodySmall" tone="muted">{text}</Typography></div>
            </div>
          ))}
        </aside>
      </div>
      <footer className="llmpe-conv-conclusion"><Typography variant="body" tone="accent" align="center">同一幅图像，卷积核不同，响应的边缘也不同</Typography></footer>
    </ContentBlock>
  );
}
