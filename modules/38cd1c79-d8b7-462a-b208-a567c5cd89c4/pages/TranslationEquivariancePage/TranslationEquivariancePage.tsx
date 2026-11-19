import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { ContentBlock, Typography } from "@shuku/course-style/react";
import './TranslationEquivariancePage.css';

const moduleAssetId = '38cd1c79-d8b7-462a-b208-a567c5cd89c4';
const backgroundUrl = moduleAssetUrl("layerd_scene/bg.webp");
const ufoUrl = moduleAssetUrl("layerd_scene/ufo.webp");
const pillarUrl = moduleAssetUrl("layerd_scene/pillar.webp");
const foliageUrl = moduleAssetUrl("layerd_scene/dark_foliage.webp");

const MAP_WIDTH = 80;
const MAP_HEIGHT = 58;
const LAPLACIAN_KERNEL = [[0, 1, 0], [1, -4, 1], [0, 1, 0]];
interface Position { x: number; y: number; }
interface SceneImages { background: HTMLImageElement; ufo: HTMLImageElement; pillar: HTMLImageElement; foliage: HTMLImageElement; }

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
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

  return <ContentBlock shuku-edit-id="e-ea6c9c92-aed0-421a-9a69-4d009e4660b1" headingLevel={1} className="ck-translation" title="平移等变性" subtitle="输入中的目标移到哪里，固定卷积核产生的对应响应也移到哪里。">
    <div shuku-edit-id="e-49192cca-ef28-4ab3-b065-542c23cdca42" className="ck-translation__workspace">
      <section shuku-edit-id="e-2c1da587-bf75-46a6-8ebe-7ecb64d410cc" className="ck-translation__panel ck-translation__input-panel">
        <header shuku-edit-id="e-205109b8-ddd4-4757-a6de-9a15a72156df"><Typography shuku-edit-id="e-84fb98b8-b681-4ce0-ac76-fac62c168341" as="h2" variant="h3" tone="accent">1　输入场景</Typography></header>
        <div shuku-edit-id="e-79977cc1-6146-49ae-a1ca-8bb1429ec955" className="ck-translation__scene" ref={sceneRef} onPointerEnter={(event) => { pointerInsideRef.current = true; moveUfo(event); }} onPointerMove={moveUfo} onPointerLeave={() => { pointerInsideRef.current = false; }} aria-label="UFO 自动绕圈飞行；移动鼠标可接管轨迹，离开后继续绕圈，前景柱子和树叶会遮挡它">
          <img shuku-edit-id="e-e1bec1b0-67fa-4bac-9bc8-32ab31d2423b" className="ck-translation__background" src={backgroundUrl} alt="夜晚的城堡和桥梁背景" draggable="false" />
          <img shuku-edit-id="e-4601e6b8-d3ff-4938-a0a8-ee6634077cae" className="ck-translation__ufo" src={ufoUrl} alt="可随鼠标平移的 UFO" style={ufoStyle} draggable="false" />
          <img shuku-edit-id="e-5f549f11-12cf-456b-abd5-ff4379c5c736" className="ck-translation__pillar" src={pillarUrl} alt="前景柱子" draggable="false" />
          <img shuku-edit-id="e-ec96feed-c893-4722-ae82-31ac653b607f" className="ck-translation__foliage" src={foliageUrl} alt="前景树叶" draggable="false" />
        </div>
        <Typography shuku-edit-id="e-60725f73-96d3-46e9-b7c0-712f6c7a21ee" variant="body" tone="muted">移动鼠标控制 UFO</Typography>
      </section>
      <section shuku-edit-id="e-743b9d2d-d80d-45cb-bee7-5ce6c2acf492" className="ck-translation__panel ck-translation__kernel-panel">
        <header shuku-edit-id="e-89aa7e42-431f-425f-9acb-ea7e99657061"><Typography shuku-edit-id="e-35cc7e32-f9da-43c7-91f3-e72e7f94d03d" as="h2" variant="h3" tone="accent">2　固定卷积核</Typography></header>
        <div shuku-edit-id="e-e89d76dd-af30-457e-a5b1-98d904c4eb31" className="ck-translation__kernel" role="img" aria-label="四邻域 Laplacian 卷积核，中心为负四，上下左右为一，四角为零">
          {LAPLACIAN_KERNEL.flatMap((row, rowIndex) => row.map((value, colIndex) => <span shuku-edit-id="e-cd887cc9-67c7-4cdb-9066-10f559386345" className={value > 0 ? 'is-positive' : value < 0 ? 'is-negative' : 'is-zero'} key={`${rowIndex}-${colIndex}`}><Typography shuku-edit-id="e-64654224-7667-4491-94fc-c90f32b22652" as="span" variant="body" tone="inherit">{value}</Typography></span>))}
        </div>
        <div shuku-edit-id="e-02a121a3-2afc-40f7-b089-4bfd9fe63ec7" className="ck-translation__kernel-note"><Typography shuku-edit-id="e-f6be7e7d-713d-4c96-87e9-e66606fe1467" variant="bodySmall" tone="accent">Laplacian · 检测亮度边界</Typography><Typography shuku-edit-id="e-d00e94cd-697b-42e5-aaa1-fb606400bbbc" variant="bodySmall" tone="muted">同一组权重在整张图上滑动。</Typography></div>
      </section>
      <section shuku-edit-id="e-244d3e8b-b3cf-47c5-8e61-8280cd4de564" className="ck-translation__panel ck-translation__output-panel">
        <header shuku-edit-id="e-560cf964-3dad-4f70-9e0e-871e809f87a5"><Typography shuku-edit-id="e-8f1fb559-5989-4e98-8f81-f5010b90005c" as="h2" variant="h3" tone="accent">3　输出特征图</Typography></header>
        <div shuku-edit-id="e-d29ce2f8-46da-4bf3-8e07-fb1cd7ebdb68" className="ck-translation__heatmap-frame">
          <canvas shuku-edit-id="e-f2f974c1-7458-4e7f-80c8-b39316fb8ed2" ref={heatmapRef} className="ck-translation__heatmap" width={MAP_WIDTH} height={MAP_HEIGHT} role="img" aria-label="当前可见场景的灰度图经过 Laplacian 卷积得到的实时边界响应强度图" />
          <span shuku-edit-id="e-13e6ad53-94f5-4739-aade-ee07da42fb6f" className="ck-translation__heatmap-badge" tabIndex={0} aria-describedby="ck-translation-heatmap-tip">热力图</span>
          <span shuku-edit-id="e-7257cccc-a8ca-4b65-93e9-2ccd065cf5ec" className="ck-translation__heatmap-tooltip" id="ck-translation-heatmap-tip" role="tooltip">颜色表示响应强度，越暖越强。</span>
        </div>
        <Typography shuku-edit-id="e-d9984583-2162-43c3-a312-aac8c1b5df2e" variant="body" tone="muted">更亮的区域意味着更强的局部特征响应</Typography>
      </section>
    </div>
    <div shuku-edit-id="e-308cf6ad-b465-4e19-ad67-8c20c8bb49cd" className="ck-translation__summary"><Typography shuku-edit-id="e-abd12548-a8f3-4d6e-9399-bd8974543825" as="strong" variant="h3" tone="accent">结论</Typography><Typography shuku-edit-id="e-ef6f785c-fccc-4adf-9103-402a7958c709" variant="body" tone="accent">UFO 平移时，响应位置随之平移；进入前景遮挡区域时，响应可能减弱。</Typography></div>
  </ContentBlock>;
}
