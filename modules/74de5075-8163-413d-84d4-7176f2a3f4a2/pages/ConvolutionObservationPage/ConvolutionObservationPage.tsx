import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, ContentBlock, Typography } from "@shuku/course-style/react";
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
  image.src = moduleAssetUrl(`images/edge-examples/${file}`);
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
    <div shuku-edit-id="e-359bcf13-d2db-4675-aa8e-4a54c087c476" className="llmpe-conv-plane" data-plane={color ? 'input' : 'output'}>
      <canvas shuku-edit-id="e-c98eb4cb-5124-4155-89f2-9e66379cee9b" ref={canvas} width={IMAGE_SIZE} height={IMAGE_SIZE} role="img" aria-label={label} />
      {tiles < TILE_COUNT && <span shuku-edit-id="e-7542b6c3-1e97-47cf-86c8-bd8e5542a500" className="llmpe-conv-scanblock" style={cursor} aria-hidden="true" />}
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
    <ContentBlock shuku-edit-id="e-3b020bb7-4b46-4546-aa77-701abea905f9" ref={root} className="llmpe-conv-page" headingLevel={1}
      title={outline.pages.find(page => page.id === '4b73bf56-5848-4873-8e5d-80739c8cbcb0')!.title} subtitle="以边缘检测为例：先观察图像处理的效果"
      bodyClassName="llmpe-conv-body" data-kernel={direction} data-pattern={frame.pattern}
      data-tiles={frame.tiles} data-phase={frame.phase} data-ready={Boolean(samples)}>
      <div shuku-edit-id="e-7b501b42-401f-4476-8af5-ae37233bb306" className="llmpe-conv-content">
        <section shuku-edit-id="e-5870bc05-99b8-49b8-be31-93a0a469adf6" className="llmpe-conv-experiment" aria-label="卷积边缘实验">
          <Typography shuku-edit-id="e-0f237f5b-782f-4dc1-901a-2c052a9dbeb9" as="h2" variant="h2" tone="accent">卷积边缘实验</Typography>
          {!samples ? <div shuku-edit-id="e-aae9806e-db4b-410a-85c0-5a5ed716d472" className="llmpe-conv-loading" role="status">
            <Typography shuku-edit-id="e-889e9d44-aec3-496a-8662-6bf873a58f80" variant="body" tone="muted">{loadError ? '示例图像加载失败，请重试。' : '正在加载示例图像…'}</Typography>
            {loadError && <Button onClick={() => setRetry(value => value + 1)}>重试</Button>}
          </div> : <div shuku-edit-id="e-8c2c18f2-ec29-47fb-a9eb-78c80a0d9fc6" className="llmpe-conv-stage">
            <div shuku-edit-id="e-5db6a8e9-592d-416c-b8ae-1b9746d7aeb2" className="llmpe-conv-image-group">
              <Typography shuku-edit-id="e-39817e77-473d-47d0-9175-d5e973eac58f" as="h3" variant="h3" tone="accent" align="center">输入图像</Typography>
              <ImagePlane values={input!.gray} color={input!.color} tiles={frame.tiles} label={`输入图像：${IMAGE_EXAMPLES[frame.pattern].name}`} />
            </div>
            <div shuku-edit-id="e-e5ee0ddd-c947-4e15-aff1-eb1713e72761" className="llmpe-conv-kernel-group">
              <Typography shuku-edit-id="e-305c344b-53f2-4b86-810a-77a096f8efce" as="h3" variant="h3" tone="accent" align="center">观察方向</Typography>
              <div shuku-edit-id="e-05938165-1678-44de-a45b-952ab8f0ecf5" className="llmpe-conv-direction" role="img" aria-label={`${direction === 'vertical' ? '竖向' : '横向'}边缘示意`}>
                <span shuku-edit-id="e-9ac0fa5c-ecc5-4234-8010-91e5a4e6e492" className={`llmpe-conv-direction-lines${direction === 'horizontal' ? ' is-horizontal' : ''}`} aria-hidden="true"><i shuku-edit-id="e-a8f02197-c922-4a41-a6d9-a33555f23b5e" /><i shuku-edit-id="e-969719c6-9e89-4df7-a9e0-6ab895e7da05" /><i shuku-edit-id="e-14706aea-a6d8-470f-9f25-f4a2836de6d0" /></span>
              </div>
              <div shuku-edit-id="e-d5e11e41-2855-4761-bb11-b7c5b03477c3" className="llmpe-conv-switch" role="group" aria-label="切换边缘检测方向">
                <Button variant={direction === 'vertical' ? 'primary' : 'default'} aria-pressed={direction === 'vertical'} onClick={() => selectDirection('vertical')}><Typography shuku-edit-id="e-0b6339ae-437a-467e-97a8-5bea42557054" as="span" variant="bodySmall" tone="inherit">竖向边缘</Typography></Button>
                <Button variant={direction === 'horizontal' ? 'primary' : 'default'} aria-pressed={direction === 'horizontal'} onClick={() => selectDirection('horizontal')}><Typography shuku-edit-id="e-2c0b564f-6018-463b-a972-f2cb35776e96" as="span" variant="bodySmall" tone="inherit">横向边缘</Typography></Button>
              </div>
            </div>
            <div shuku-edit-id="e-b1be420e-4185-4b6d-ad8a-fb321f455679" className="llmpe-conv-image-group">
              <Typography shuku-edit-id="e-499880ff-e61c-4d41-acd1-902162e3ed87" as="h3" variant="h3" tone="accent" align="center">边缘响应强度</Typography>
              <ImagePlane values={output} tiles={frame.tiles} label={`${IMAGE_EXAMPLES[frame.pattern].name}的${direction === 'vertical' ? '竖向' : '横向'}边缘响应，已生成${frame.tiles}块`} />
            </div>
          </div>}
        </section>
        <aside shuku-edit-id="e-de98334d-82c4-40e8-9c90-b8bf3fa86373" className="llmpe-conv-sidebar" aria-label="科普教育的优势">
          <Typography shuku-edit-id="e-0ebbc8da-018d-4fa4-9b24-3e928a4445fe" as="h2" variant="h2" tone="accent">科普教育的优势</Typography>
          {([
            ['light', '直观', '用熟悉的事物帮助理解'],
            ['book', '低门槛', '不需要太多专业知识'],
            ['heart', '激发兴趣', '让复杂的概念变得有趣'],
          ] as const).map(([kind, title, text]) => (
            <div shuku-edit-id="e-ebb3adab-6b31-4ea4-ab2b-9a916691e9ff" className="llmpe-conv-benefit" key={title}>
              <span shuku-edit-id="e-5864f28c-052f-4ece-a798-7b2404ba0e7b" className="llmpe-conv-icon"><WormholeIcon kind={kind} /></span>
              <div shuku-edit-id="e-3d1d8a28-3efe-4ea2-aad4-183c9325717e"><Typography shuku-edit-id="e-cf31811b-646d-43f8-ac74-d5d17dcc1365" as="h3" variant="h3" tone="accent">{title}</Typography><Typography shuku-edit-id="e-b8cb42f6-1814-4e94-9be0-aa1927211219" variant="bodySmall" tone="muted">{text}</Typography></div>
            </div>
          ))}
        </aside>
      </div>
      <footer shuku-edit-id="e-ea88313b-856b-41f4-b8c5-55671d70cf61" className="llmpe-conv-conclusion"><Typography shuku-edit-id="e-2c2a0e07-0e16-4de3-8637-37c9bb18e54d" variant="body" tone="accent" align="center">同一幅图像，卷积核不同，响应的边缘也不同</Typography></footer>
    </ContentBlock>
  );
}
