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

  return <ContentBlock shuku-edit-id="e-a933b2f5-1541-495a-97e3-a586fe454348" headingLevel={1} className="aipe-replay-cg-copy-ck-translation" title="平移等变性" subtitle="输入中的目标移到哪里，固定卷积核产生的对应响应也移到哪里。">
    <div shuku-edit-id="e-668287db-36ee-4eea-a9a4-7e29541973e8" className="aipe-replay-cg-copy-ck-translation__workspace">
      <section shuku-edit-id="e-4aa40c8e-318c-491e-928c-594c2722073a" className="aipe-replay-cg-copy-ck-translation__panel aipe-replay-cg-copy-ck-translation__input-panel">
        <header shuku-edit-id="e-e1740bff-7e67-4f2e-b313-af628dea494b"><Typography shuku-edit-id="e-ad6f9cfe-8122-4d87-9afb-8dff806f514e" as="h2" variant="h3" tone="accent">1　输入场景</Typography></header>
        <div shuku-edit-id="e-d582c1de-40fa-49e8-a499-75fdab57f2ba" className="aipe-replay-cg-copy-ck-translation__scene" ref={sceneRef} onPointerEnter={(event) => { pointerInsideRef.current = true; moveUfo(event); }} onPointerMove={moveUfo} onPointerLeave={() => { pointerInsideRef.current = false; }} aria-label="UFO 自动绕圈飞行；移动鼠标可接管轨迹，离开后继续绕圈，前景柱子和树叶会遮挡它">
          <img shuku-edit-id="e-86febb1c-4f38-4a29-b5c3-867cbbe4c1c4" className="aipe-replay-cg-copy-ck-translation__background" src={backgroundUrl} alt="夜晚的城堡和桥梁背景" draggable="false" />
          <img shuku-edit-id="e-b91fad21-8742-4bf9-86c0-1b98f296d50f" className="aipe-replay-cg-copy-ck-translation__ufo" src={ufoUrl} alt="可随鼠标平移的 UFO" style={ufoStyle} draggable="false" />
          <img shuku-edit-id="e-8d634d7d-3f3e-4f98-8148-18446dbabe9d" className="aipe-replay-cg-copy-ck-translation__pillar" src={pillarUrl} alt="前景柱子" draggable="false" />
          <img shuku-edit-id="e-2b6d1c91-68ac-4d74-b6c7-7cd3c75fbc64" className="aipe-replay-cg-copy-ck-translation__foliage" src={foliageUrl} alt="前景树叶" draggable="false" />
        </div>
        <Typography shuku-edit-id="e-651084d1-4405-4033-b4e6-64c4fad36048" variant="body" tone="muted">移动鼠标控制 UFO</Typography>
      </section>
      <section shuku-edit-id="e-ec0a3e43-71a2-4905-8cdf-6e1d03b20ab0" className="aipe-replay-cg-copy-ck-translation__panel aipe-replay-cg-copy-ck-translation__kernel-panel">
        <header shuku-edit-id="e-26a409d1-1d41-407d-8b8b-25e21831e747"><Typography shuku-edit-id="e-6e19b9cc-67f7-4b16-9a82-fbbf5fb1ec16" as="h2" variant="h3" tone="accent">2　固定卷积核</Typography></header>
        <div shuku-edit-id="e-c65869ab-28b2-4408-b12f-1858b48cfa18" className="aipe-replay-cg-copy-ck-translation__kernel" role="img" aria-label="四邻域 Laplacian 卷积核，中心为负四，上下左右为一，四角为零">
          {LAPLACIAN_KERNEL.flatMap((row, rowIndex) => row.map((value, colIndex) => <span shuku-edit-id="e-6fe34df3-34c5-44d4-af24-4fafa97f0f26" className={value > 0 ? 'is-positive' : value < 0 ? 'is-negative' : 'is-zero'} key={`${rowIndex}-${colIndex}`}><Typography shuku-edit-id="e-bb93c82d-3c71-469d-bf94-5d04778a1535" as="span" variant="body" tone="inherit">{value}</Typography></span>))}
        </div>
        <div shuku-edit-id="e-83e719c4-07fe-4232-913d-ce61ee7cf65c" className="aipe-replay-cg-copy-ck-translation__kernel-note"><Typography shuku-edit-id="e-6ebe5223-05ff-437f-8608-444359a90df5" variant="bodySmall" tone="accent">Laplacian · 检测亮度边界</Typography><Typography shuku-edit-id="e-a35beff8-7e82-4766-a525-8b8a9d29152a" variant="bodySmall" tone="muted">同一组权重在整张图上滑动。</Typography></div>
      </section>
      <section shuku-edit-id="e-14ec407d-3db1-4783-a60a-577adf484e76" className="aipe-replay-cg-copy-ck-translation__panel aipe-replay-cg-copy-ck-translation__output-panel">
        <header shuku-edit-id="e-a503eaea-eb2c-4acc-9f2d-0c3060b53333"><Typography shuku-edit-id="e-18d99dd7-c230-4554-b7dc-f52656994594" as="h2" variant="h3" tone="accent">3　输出特征图</Typography></header>
        <div shuku-edit-id="e-377196f0-1b36-47bd-a933-7379f4fda1d6" className="aipe-replay-cg-copy-ck-translation__heatmap-frame">
          <canvas shuku-edit-id="e-5f079433-458a-45a1-a3d2-da29b12e8d7a" ref={heatmapRef} className="aipe-replay-cg-copy-ck-translation__heatmap" width={MAP_WIDTH} height={MAP_HEIGHT} role="img" aria-label="当前可见场景的灰度图经过 Laplacian 卷积得到的实时边界响应强度图" />
          <span shuku-edit-id="e-f812a4e1-0fc2-4e20-b1c3-91090c44d939" className="aipe-replay-cg-copy-ck-translation__heatmap-badge" tabIndex={0} aria-describedby="aipe-replay-cg-copy-ck-translation-heatmap-tip">热力图</span>
          <span shuku-edit-id="e-c8051151-bec4-4515-b77e-7124248e59f6" className="aipe-replay-cg-copy-ck-translation__heatmap-tooltip" id="aipe-replay-cg-copy-ck-translation-heatmap-tip" role="tooltip">颜色表示响应强度，越暖越强。</span>
        </div>
        <Typography shuku-edit-id="e-9e4ff2ef-f93d-4bcf-a1a4-ec2a9658e208" variant="body" tone="muted">更亮的区域意味着更强的局部特征响应</Typography>
      </section>
    </div>
    <div shuku-edit-id="e-a8f1f595-76e3-4ed1-86c5-b8f18b28b765" className="aipe-replay-cg-copy-ck-translation__summary"><Typography shuku-edit-id="e-62077dc3-6469-455e-95dc-05a69773e3df" as="strong" variant="h3" tone="accent">结论</Typography><Typography shuku-edit-id="e-9e515df6-0efa-4884-a16d-faccc0104180" variant="body" tone="accent">UFO 平移时，响应位置随之平移；进入前景遮挡区域时，响应可能减弱。</Typography></div>
  </ContentBlock>;
}
