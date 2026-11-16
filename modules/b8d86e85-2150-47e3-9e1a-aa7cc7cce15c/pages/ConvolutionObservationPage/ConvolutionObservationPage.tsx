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
    <div shuku-edit-id="e-a2a7a32c-ca00-4ef2-b858-a98e5aa36a73" className="llmpe-conv-plane" data-plane={color ? 'input' : 'output'}>
      <canvas shuku-edit-id="e-172a1311-d292-42a7-9dc8-6a90faa7da7a" ref={canvas} width={IMAGE_SIZE} height={IMAGE_SIZE} role="img" aria-label={label} />
      {tiles < TILE_COUNT && <span shuku-edit-id="e-530aff57-b7d9-48db-aff5-8c3254f8d7b3" className="llmpe-conv-scanblock" style={cursor} aria-hidden="true" />}
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
    <ContentBlock shuku-edit-id="e-9ea854bd-9a10-4121-8e71-8c37c3374489" ref={root} className="llmpe-conv-page" headingLevel={1}
      title={outline.pages.find(page => page.id === 'af2c0a55-e6a7-41f8-a8d4-e5cda1b314cf')!.title} subtitle="以边缘检测为例：先观察图像处理的效果"
      bodyClassName="llmpe-conv-body" data-kernel={direction} data-pattern={frame.pattern}
      data-tiles={frame.tiles} data-phase={frame.phase} data-ready={Boolean(samples)}>
      <div shuku-edit-id="e-d318728e-9f16-4ece-ae48-f9151e7e4629" className="llmpe-conv-content">
        <section shuku-edit-id="e-373e4441-a9cc-4b91-8d50-19e4636c9073" className="llmpe-conv-experiment" aria-label="卷积边缘实验">
          <Typography shuku-edit-id="e-ca70a697-f74c-4d96-a026-6ae6e4aae676" as="h2" variant="h2" tone="accent">卷积边缘实验</Typography>
          {!samples ? <div shuku-edit-id="e-ed2e38ae-beaf-47a2-af53-0b1105006430" className="llmpe-conv-loading" role="status">
            <Typography shuku-edit-id="e-753f8b66-d5ee-46a9-8c2c-91c9522a4a94" variant="body" tone="muted">{loadError ? '示例图像加载失败，请重试。' : '正在加载示例图像…'}</Typography>
            {loadError && <Button onClick={() => setRetry(value => value + 1)}>重试</Button>}
          </div> : <div shuku-edit-id="e-4dfee1a3-a06a-4ddc-95a2-af8d4517cb29" className="llmpe-conv-stage">
            <div shuku-edit-id="e-f90284fa-95e9-4cbf-ad0f-f80ceb887ef8" className="llmpe-conv-image-group">
              <Typography shuku-edit-id="e-d8453318-cba2-4b8c-a694-959d77e25f61" as="h3" variant="h3" tone="accent" align="center">输入图像</Typography>
              <ImagePlane values={input!.gray} color={input!.color} tiles={frame.tiles} label={`输入图像：${IMAGE_EXAMPLES[frame.pattern].name}`} />
            </div>
            <div shuku-edit-id="e-a0260c7b-b6b6-412a-83cf-09088db615f4" className="llmpe-conv-kernel-group">
              <Typography shuku-edit-id="e-a4bffc96-f71e-4121-b92d-054ae2ee595b" as="h3" variant="h3" tone="accent" align="center">观察方向</Typography>
              <div shuku-edit-id="e-7bbaa597-19b6-4137-aada-342a432502b7" className="llmpe-conv-direction" role="img" aria-label={`${direction === 'vertical' ? '竖向' : '横向'}边缘示意`}>
                <span shuku-edit-id="e-7cc359bc-b2c3-4d87-82a6-8c9510344557" className={`llmpe-conv-direction-lines${direction === 'horizontal' ? ' is-horizontal' : ''}`} aria-hidden="true"><i shuku-edit-id="e-d08797e3-cb1e-4fc8-b231-0b43cc6057ea" /><i shuku-edit-id="e-2eceb62f-9a0b-4d6c-b57a-d31ab7a7866f" /><i shuku-edit-id="e-5af33f2c-c53b-4611-8018-0dc7607fa93d" /></span>
              </div>
              <div shuku-edit-id="e-7c95209b-75c9-4427-ab61-bb786d05e636" className="llmpe-conv-switch" role="group" aria-label="切换边缘检测方向">
                <Button variant={direction === 'vertical' ? 'primary' : 'default'} aria-pressed={direction === 'vertical'} onClick={() => selectDirection('vertical')}><Typography shuku-edit-id="e-fef35cf7-d3f6-457a-bdcf-322f3927d031" as="span" variant="bodySmall" tone="inherit">竖向边缘</Typography></Button>
                <Button variant={direction === 'horizontal' ? 'primary' : 'default'} aria-pressed={direction === 'horizontal'} onClick={() => selectDirection('horizontal')}><Typography shuku-edit-id="e-0f0f871c-1e1e-4e39-ba93-f1970b4d9e74" as="span" variant="bodySmall" tone="inherit">横向边缘</Typography></Button>
              </div>
            </div>
            <div shuku-edit-id="e-3afb48c4-a70e-47b8-8091-66cd47081a98" className="llmpe-conv-image-group">
              <Typography shuku-edit-id="e-616fdd8d-cd84-4838-8890-ed3dfdf0be1f" as="h3" variant="h3" tone="accent" align="center">边缘响应强度</Typography>
              <ImagePlane values={output} tiles={frame.tiles} label={`${IMAGE_EXAMPLES[frame.pattern].name}的${direction === 'vertical' ? '竖向' : '横向'}边缘响应，已生成${frame.tiles}块`} />
            </div>
          </div>}
        </section>
        <aside shuku-edit-id="e-564e44b2-c413-45c8-9101-5412d0862774" className="llmpe-conv-sidebar" aria-label="科普教育的优势">
          <Typography shuku-edit-id="e-5656ca1e-7ab5-49d8-a467-abc277af3a4d" as="h2" variant="h2" tone="accent">科普教育的优势</Typography>
          {([
            ['light', '直观', '用熟悉的事物帮助理解'],
            ['book', '低门槛', '不需要太多专业知识'],
            ['heart', '激发兴趣', '让复杂的概念变得有趣'],
          ] as const).map(([kind, title, text]) => (
            <div shuku-edit-id="e-1fccb0ef-e567-487c-8371-fee1ddcd4a57" className="llmpe-conv-benefit" key={title}>
              <span shuku-edit-id="e-7d1e06a0-bde9-457a-8a9b-85141d5a83eb" className="llmpe-conv-icon"><WormholeIcon kind={kind} /></span>
              <div shuku-edit-id="e-77be688c-f17f-486a-ac73-215bbd911168"><Typography shuku-edit-id="e-7f3b7b49-bb78-4c42-b06c-7574e289f3f7" as="h3" variant="h3" tone="accent">{title}</Typography><Typography shuku-edit-id="e-eb1ac4bb-4c10-4165-bd13-e1978d93700e" variant="bodySmall" tone="muted">{text}</Typography></div>
            </div>
          ))}
        </aside>
      </div>
      <footer shuku-edit-id="e-94c68066-a54e-49b0-a168-1f9b99e1e734" className="llmpe-conv-conclusion"><Typography shuku-edit-id="e-02d43611-8b0d-41f6-9168-7bcc5744ab36" variant="body" tone="accent" align="center">同一幅图像，卷积核不同，响应的边缘也不同</Typography></footer>
    </ContentBlock>
  );
}
