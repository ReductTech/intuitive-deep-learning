import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import { creatorGuideAssetUrl } from '../../../../../creatorGuideAssets';
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { ContentBlock, Typography } from "@shuku/course-style/react";
import './TranslationEquivariancePage.css';

const moduleAssetId = '444f8951-dd2e-42dc-94e5-c5a878618631';
const backgroundUrl = creatorGuideAssetUrl(moduleAssetId, 'workflow/convolution-course/layerd_scene/bg.jpg');
const ufoUrl = creatorGuideAssetUrl(moduleAssetId, 'workflow/convolution-course/layerd_scene/ufo.png');
const pillarUrl = creatorGuideAssetUrl(moduleAssetId, 'workflow/convolution-course/layerd_scene/pillar.png');
const foliageUrl = creatorGuideAssetUrl(moduleAssetId, 'workflow/convolution-course/layerd_scene/dark_foliage.png');

const MAP_WIDTH = 80;
const MAP_HEIGHT = 58;
const LAPLACIAN_KERNEL = [[0, 1, 0], [1, -4, 1], [0, 1, 0]];
interface Position { x: number; y: number; }
interface SceneImages { background: HTMLImageElement; ufo: HTMLImageElement; pillar: HTMLImageElement; foliage: HTMLImageElement; }

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function heatColor(value: number): [number, number, number] {
  const stops: [number, number, number][] = [[8, 29, 88], [27, 73, 172], [39, 137, 244], [27, 221, 215], [252, 226, 64], [255, 100, 50]];
  const scaled = Math.max(0, Math.min(1, value)) * (stops.length - 1);
  const index = Math.min(stops.length - 2, Math.floor(scaled));
  const t = scaled - index;
  return stops[index].map((channel, component) => Math.round(channel + (stops[index + 1][component] - channel) * t)) as [number, number, number];
}

function renderResponse(canvas: HTMLCanvasElement, source: HTMLCanvasElement, images: SceneImages, position: Position) {
  const sourceContext = source.getContext('2d', { willReadFrequently: true });
  const outputContext = canvas.getContext('2d');
  if (!sourceContext || !outputContext) return;
  const w = MAP_WIDTH, h = MAP_HEIGHT;
  sourceContext.clearRect(0, 0, w, h);
  sourceContext.drawImage(images.background, 0, 0, w, h);
  const ufoWidth = w * .2;
  const ufoHeight = ufoWidth * 869 / 1700;
  const ufoScale = images.ufo.naturalWidth / 2048;
  sourceContext.drawImage(images.ufo, 175 * ufoScale, 608 * ufoScale, 1700 * ufoScale, 869 * ufoScale, position.x * w - ufoWidth / 2, position.y * h - ufoHeight / 2, ufoWidth, ufoHeight);
  sourceContext.drawImage(images.pillar, 0, 0, w * .34, h);
  const foliageSize = w * .37;
  sourceContext.drawImage(images.foliage, w - foliageSize, h - foliageSize, foliageSize, foliageSize);
  const pixels = sourceContext.getImageData(0, 0, w, h).data;
  const grayscale = new Float32Array(w * h);
  for (let index = 0; index < grayscale.length; index += 1) {
    const red = pixels[index * 4], green = pixels[index * 4 + 1], blue = pixels[index * 4 + 2];
    grayscale[index] = (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255;
  }
  const output = outputContext.createImageData(w, h);
  for (let y = 0; y < h; y += 1) for (let x = 0; x < w; x += 1) {
    let response = 0;
    for (let ky = -1; ky <= 1; ky += 1) for (let kx = -1; kx <= 1; kx += 1) {
      const sampleY = Math.max(0, Math.min(h - 1, y + ky));
      const sampleX = Math.max(0, Math.min(w - 1, x + kx));
      response += grayscale[sampleY * w + sampleX] * LAPLACIAN_KERNEL[ky + 1][kx + 1];
    }
    // 全程使用相同的响应范围，移动目标时不会逐帧重新拉伸亮度。
    const [red, green, blue] = heatColor(Math.abs(response) / 0.55);
    const offset = (y * w + x) * 4;
    output.data[offset] = red;
    output.data[offset + 1] = green;
    output.data[offset + 2] = blue;
    output.data[offset + 3] = 255;
  }
  outputContext.putImageData(output, 0, 0);
}

export function TranslationEquivariancePage() {
  const sceneRef = useRef<HTMLDivElement>(null);
  const heatmapRef = useRef<HTMLCanvasElement>(null);
  const sourceRef = useRef<HTMLCanvasElement | null>(null);
  const imagesRef = useRef<SceneImages | null>(null);
  const [position, setPosition] = useState<Position>({ x: .57, y: .52 });
  const positionRef = useRef<Position>({ x: .57, y: .52 });
  const pointerInsideRef = useRef(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let frame = 0;
    let lastUpdate = 0;
    const startedAt = performance.now();
    const animate = (now: number) => {
      if (!pointerInsideRef.current && now - lastUpdate >= 33) {
        const angle = (now - startedAt) * .00075;
        const target = { x: .57 + .23 * Math.cos(angle), y: .43 + .12 * Math.sin(angle) };
        const current = positionRef.current;
        const next = { x: current.x + (target.x - current.x) * .075, y: current.y + (target.y - current.y) * .075 };
        positionRef.current = next;
        setPosition(next);
        lastUpdate = now;
      }
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([loadImage(backgroundUrl), loadImage(ufoUrl), loadImage(pillarUrl), loadImage(foliageUrl)]).then(([background, ufo, pillar, foliage]) => {
      if (!active) return;
      imagesRef.current = { background, ufo, pillar, foliage };
      const source = document.createElement('canvas');
      source.width = MAP_WIDTH;
      source.height = MAP_HEIGHT;
      sourceRef.current = source;
      setReady(true);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (ready && heatmapRef.current && sourceRef.current && imagesRef.current) renderResponse(heatmapRef.current, sourceRef.current, imagesRef.current, position);
  }, [position, ready]);

  const moveUfo = (event: PointerEvent<HTMLDivElement>) => {
    const scene = sceneRef.current;
    if (!scene) return;
    const rect = scene.getBoundingClientRect();
    const next = { x: Math.max(.07, Math.min(.93, (event.clientX - rect.left) / rect.width)), y: Math.max(.08, Math.min(.92, (event.clientY - rect.top) / rect.height)) };
    positionRef.current = next;
    setPosition(next);
  };
  const ufoStyle = { left: `${position.x * 100}%`, top: `${position.y * 100}%` } as CSSProperties;

  return <ContentBlock shuku-edit-id="e-5ed240ce-6fb3-4fe1-a457-920963bd7c59" headingLevel={1} className="aipe-replay-cg-copy-ck-translation" title="平移等变性" subtitle="输入中的目标移到哪里，固定卷积核产生的对应响应也移到哪里。">
    <div shuku-edit-id="e-a8d440a6-065c-47ff-909a-61296ad61fcb" className="aipe-replay-cg-copy-ck-translation__workspace">
      <section shuku-edit-id="e-78d11835-6966-425a-ab2a-e124918f9370" className="aipe-replay-cg-copy-ck-translation__panel aipe-replay-cg-copy-ck-translation__input-panel">
        <header shuku-edit-id="e-6107a40f-b6cc-4f25-b2e1-3c76eec7d2ae"><Typography shuku-edit-id="e-1d8f27f5-fde9-487a-8303-698598f13656" as="h2" variant="h3" tone="accent">1　输入场景</Typography></header>
        <div shuku-edit-id="e-dc71d006-0f4f-49d3-a924-b49ad4c11048" className="aipe-replay-cg-copy-ck-translation__scene" ref={sceneRef} onPointerEnter={(event) => { pointerInsideRef.current = true; moveUfo(event); }} onPointerMove={moveUfo} onPointerLeave={() => { pointerInsideRef.current = false; }} aria-label="UFO 自动绕圈飞行；移动鼠标可接管轨迹，离开后继续绕圈，前景柱子和树叶会遮挡它">
          <img shuku-edit-id="e-0c307133-5bec-4fbd-ad9f-7d20534bc08a" className="aipe-replay-cg-copy-ck-translation__background" src={backgroundUrl} alt="夜晚的城堡和桥梁背景" draggable="false" />
          <img shuku-edit-id="e-1446b7bb-0568-46eb-9293-a6e766706f93" className="aipe-replay-cg-copy-ck-translation__ufo" src={ufoUrl} alt="可随鼠标平移的 UFO" style={ufoStyle} draggable="false" />
          <img shuku-edit-id="e-c733221a-e01e-4a3a-88ae-a43bc579af9e" className="aipe-replay-cg-copy-ck-translation__pillar" src={pillarUrl} alt="前景柱子" draggable="false" />
          <img shuku-edit-id="e-b6a5c4bb-3230-487f-97c1-4d9c9fbe8b02" className="aipe-replay-cg-copy-ck-translation__foliage" src={foliageUrl} alt="前景树叶" draggable="false" />
        </div>
        <Typography shuku-edit-id="e-ad195ed6-3155-4256-a8e6-6c2946257120" variant="body" tone="muted">移动鼠标控制 UFO</Typography>
      </section>
      <section shuku-edit-id="e-9c60bc37-53b8-489f-bfe1-9c634c412545" className="aipe-replay-cg-copy-ck-translation__panel aipe-replay-cg-copy-ck-translation__kernel-panel">
        <header shuku-edit-id="e-dc0bff2f-c36a-4477-8e62-51bde29acafe"><Typography shuku-edit-id="e-4554b777-325c-422a-b677-35ca25f583d6" as="h2" variant="h3" tone="accent">2　固定卷积核</Typography></header>
        <div shuku-edit-id="e-ec7a0b09-cd99-4e12-bc18-b43c45c8e9a3" className="aipe-replay-cg-copy-ck-translation__kernel" role="img" aria-label="四邻域 Laplacian 卷积核，中心为负四，上下左右为一，四角为零">
          {LAPLACIAN_KERNEL.flatMap((row, rowIndex) => row.map((value, colIndex) => <span shuku-edit-id="e-013231de-413a-4e84-acf2-70941ffc0d74" className={value > 0 ? 'is-positive' : value < 0 ? 'is-negative' : 'is-zero'} key={`${rowIndex}-${colIndex}`}><Typography shuku-edit-id="e-d0669ea6-5985-4712-8e3e-a8bace7763b0" as="span" variant="body" tone="inherit">{value}</Typography></span>))}
        </div>
        <div shuku-edit-id="e-d4287593-ff1c-4bee-8b05-3d2592934494" className="aipe-replay-cg-copy-ck-translation__kernel-note"><Typography shuku-edit-id="e-6ed251e8-08b0-4817-9baf-d2f705a9adc3" variant="bodySmall" tone="accent">Laplacian · 检测亮度边界</Typography><Typography shuku-edit-id="e-537dbb62-c181-46cc-be48-609e17acfb71" variant="bodySmall" tone="muted">同一组权重在整张图上滑动。</Typography></div>
      </section>
      <section shuku-edit-id="e-520cd9d3-7687-493e-aef2-984468e15710" className="aipe-replay-cg-copy-ck-translation__panel aipe-replay-cg-copy-ck-translation__output-panel">
        <header shuku-edit-id="e-a91bd7de-4117-4295-8530-c54f4193c7f3"><Typography shuku-edit-id="e-acd6c8b4-1605-48f1-93ec-6a02383d37d3" as="h2" variant="h3" tone="accent">3　输出特征图</Typography></header>
        <div shuku-edit-id="e-d8f1aa91-4272-428c-9dee-92d0456ad74e" className="aipe-replay-cg-copy-ck-translation__heatmap-frame">
          <canvas shuku-edit-id="e-979163a1-8f4b-4cbb-b8a4-62eca11dd5da" ref={heatmapRef} className="aipe-replay-cg-copy-ck-translation__heatmap" width={MAP_WIDTH} height={MAP_HEIGHT} role="img" aria-label="当前可见场景的灰度图经过 Laplacian 卷积得到的实时边界响应强度图" />
          <span shuku-edit-id="e-3043d075-f1d5-47e8-9da9-4f62b16a9e50" className="aipe-replay-cg-copy-ck-translation__heatmap-badge" tabIndex={0} aria-describedby="aipe-replay-cg-copy-ck-translation-heatmap-tip">热力图</span>
          <span shuku-edit-id="e-b4a76fcf-8355-422e-be24-3f6cf07784bc" className="aipe-replay-cg-copy-ck-translation__heatmap-tooltip" id="aipe-replay-cg-copy-ck-translation-heatmap-tip" role="tooltip">颜色表示响应强度，越暖越强。</span>
        </div>
        <Typography shuku-edit-id="e-189f661e-52cb-41b8-a6e5-31bf1cb61d6c" variant="body" tone="muted">更亮的区域意味着更强的局部特征响应</Typography>
      </section>
    </div>
    <div shuku-edit-id="e-0025cf9b-f177-4df5-a77b-c4975ed58345" className="aipe-replay-cg-copy-ck-translation__summary"><Typography shuku-edit-id="e-728108df-89b5-4a7e-979b-c60b36370bee" as="strong" variant="h3" tone="accent">结论</Typography><Typography shuku-edit-id="e-5445c945-2479-43bf-afc8-649635612aa9" variant="body" tone="accent">UFO 平移时，响应位置随之平移；进入前景遮挡区域时，响应可能减弱。</Typography></div>
  </ContentBlock>;
}
