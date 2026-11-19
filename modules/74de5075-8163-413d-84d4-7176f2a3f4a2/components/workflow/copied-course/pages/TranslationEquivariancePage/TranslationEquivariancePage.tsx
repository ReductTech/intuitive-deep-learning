import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { ContentBlock, Typography } from "@shuku/course-style/react";
import './TranslationEquivariancePage.css';

const moduleAssetId = '74de5075-8163-413d-84d4-7176f2a3f4a2';
const backgroundUrl = moduleAssetUrl("workflow/convolution-course/layerd_scene/bg.webp");
const ufoUrl = moduleAssetUrl("workflow/convolution-course/layerd_scene/ufo.webp");
const pillarUrl = moduleAssetUrl("workflow/convolution-course/layerd_scene/pillar.webp");
const foliageUrl = moduleAssetUrl("workflow/convolution-course/layerd_scene/dark_foliage.webp");

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

  return <ContentBlock shuku-edit-id="e-36cfa2f3-ded5-4f19-8b18-45a0a119fa92" headingLevel={1} className="cg-copy-ck-translation" title="平移等变性" subtitle="输入中的目标移到哪里，固定卷积核产生的对应响应也移到哪里。">
    <div shuku-edit-id="e-8b54881e-2947-4811-85aa-9b61def56950" className="cg-copy-ck-translation__workspace">
      <section shuku-edit-id="e-68451c3a-0668-4736-83cf-2d5ee59d1196" className="cg-copy-ck-translation__panel cg-copy-ck-translation__input-panel">
        <header shuku-edit-id="e-24aeb851-97f6-4be7-ad1a-96fff37105be"><Typography shuku-edit-id="e-89e4400a-6213-412b-9c7e-d49dd9a2f90d" as="h2" variant="h3" tone="accent">1　输入场景</Typography></header>
        <div shuku-edit-id="e-1944c095-7356-453b-b3c9-e2567f5cffcb" className="cg-copy-ck-translation__scene" ref={sceneRef} onPointerEnter={(event) => { pointerInsideRef.current = true; moveUfo(event); }} onPointerMove={moveUfo} onPointerLeave={() => { pointerInsideRef.current = false; }} aria-label="UFO 自动绕圈飞行；移动鼠标可接管轨迹，离开后继续绕圈，前景柱子和树叶会遮挡它">
          <img shuku-edit-id="e-e8661e08-22cb-4e7b-8635-e17189b22c22" className="cg-copy-ck-translation__background" src={backgroundUrl} alt="夜晚的城堡和桥梁背景" draggable="false" />
          <img shuku-edit-id="e-e7d38833-3cc2-443e-b5bd-3c08818a1b3d" className="cg-copy-ck-translation__ufo" src={ufoUrl} alt="可随鼠标平移的 UFO" style={ufoStyle} draggable="false" />
          <img shuku-edit-id="e-d84f075f-894c-4530-88e2-8ae9f30ee28a" className="cg-copy-ck-translation__pillar" src={pillarUrl} alt="前景柱子" draggable="false" />
          <img shuku-edit-id="e-66053d8c-471a-403c-aa2d-0755e1799829" className="cg-copy-ck-translation__foliage" src={foliageUrl} alt="前景树叶" draggable="false" />
        </div>
        <Typography shuku-edit-id="e-b508439f-f4e1-426b-9d26-f774944723ef" variant="body" tone="muted">移动鼠标控制 UFO</Typography>
      </section>
      <section shuku-edit-id="e-8e915982-b2f1-4946-85a8-4833abd6a8c5" className="cg-copy-ck-translation__panel cg-copy-ck-translation__kernel-panel">
        <header shuku-edit-id="e-69ff2ab9-e502-492b-94df-3e669bdd6ec0"><Typography shuku-edit-id="e-812ac9c7-35cf-4305-b0f8-306ef4110f2b" as="h2" variant="h3" tone="accent">2　固定卷积核</Typography></header>
        <div shuku-edit-id="e-c625cc5e-c925-4e79-aa85-c7dd959293b6" className="cg-copy-ck-translation__kernel" role="img" aria-label="四邻域 Laplacian 卷积核，中心为负四，上下左右为一，四角为零">
          {LAPLACIAN_KERNEL.flatMap((row, rowIndex) => row.map((value, colIndex) => <span shuku-edit-id="e-5938a3db-784c-487c-8479-9144af68b55d" className={value > 0 ? 'is-positive' : value < 0 ? 'is-negative' : 'is-zero'} key={`${rowIndex}-${colIndex}`}><Typography shuku-edit-id="e-682c06c3-8940-4064-8931-78ee71dc2c4e" as="span" variant="body" tone="inherit">{value}</Typography></span>))}
        </div>
        <div shuku-edit-id="e-330e6282-1c81-4210-895d-cbf063bbeeb0" className="cg-copy-ck-translation__kernel-note"><Typography shuku-edit-id="e-954f5fc4-79ae-4d09-940a-8a2b10bd5aad" variant="bodySmall" tone="accent">Laplacian · 检测亮度边界</Typography><Typography shuku-edit-id="e-269daf8b-51d6-436e-bae8-105bd2cbbb64" variant="bodySmall" tone="muted">同一组权重在整张图上滑动。</Typography></div>
      </section>
      <section shuku-edit-id="e-b3c0d944-e07b-4f68-aeb8-b23f74403baa" className="cg-copy-ck-translation__panel cg-copy-ck-translation__output-panel">
        <header shuku-edit-id="e-da4d651d-12aa-4691-be42-92f9244f6b58"><Typography shuku-edit-id="e-605b4072-9105-446a-91dd-be96d45220a1" as="h2" variant="h3" tone="accent">3　输出特征图</Typography></header>
        <div shuku-edit-id="e-ad707878-31de-48f8-af89-20d8e641a339" className="cg-copy-ck-translation__heatmap-frame">
          <canvas shuku-edit-id="e-1afdd2ab-1d2d-4a73-9fa7-11ec1122212e" ref={heatmapRef} className="cg-copy-ck-translation__heatmap" width={MAP_WIDTH} height={MAP_HEIGHT} role="img" aria-label="当前可见场景的灰度图经过 Laplacian 卷积得到的实时边界响应强度图" />
          <span shuku-edit-id="e-2655871a-eddf-4336-972e-9e3fd9c26098" className="cg-copy-ck-translation__heatmap-badge" tabIndex={0} aria-describedby="cg-copy-ck-translation-heatmap-tip">热力图</span>
          <span shuku-edit-id="e-68ec370a-d277-45cf-9916-f93aa0fd8835" className="cg-copy-ck-translation__heatmap-tooltip" id="cg-copy-ck-translation-heatmap-tip" role="tooltip">颜色表示响应强度，越暖越强。</span>
        </div>
        <Typography shuku-edit-id="e-3c1550d4-597d-4949-9fe5-9024a4bcb285" variant="body" tone="muted">更亮的区域意味着更强的局部特征响应</Typography>
      </section>
    </div>
    <div shuku-edit-id="e-6652a391-9ae3-4599-9943-25187e70fa4e" className="cg-copy-ck-translation__summary"><Typography shuku-edit-id="e-dc57e6d8-978d-419c-bd84-b0fd504c3b72" as="strong" variant="h3" tone="accent">结论</Typography><Typography shuku-edit-id="e-b686d6d4-3580-4e75-a9f4-7b6af356d353" variant="body" tone="accent">UFO 平移时，响应位置随之平移；进入前景遮挡区域时，响应可能减弱。</Typography></div>
  </ContentBlock>;
}
