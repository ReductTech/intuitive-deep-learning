import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { ContentBlock, Typography } from "@shuku/course-style/react";
import './TranslationEquivariancePage.css';

const moduleAssetId = 'b8d86e85-2150-47e3-9e1a-aa7cc7cce15c';
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

  return <ContentBlock shuku-edit-id="e-818b7cfd-5d8a-4a0a-88c4-1d16396395e5" headingLevel={1} className="cg-copy-ck-translation" title="平移等变性" subtitle="输入中的目标移到哪里，固定卷积核产生的对应响应也移到哪里。">
    <div shuku-edit-id="e-a38dd029-8fce-4511-9afe-e247fd3ab3b1" className="cg-copy-ck-translation__workspace">
      <section shuku-edit-id="e-d3d64911-a8f8-4196-b00c-5d4e62e28182" className="cg-copy-ck-translation__panel cg-copy-ck-translation__input-panel">
        <header shuku-edit-id="e-0b943b87-7aa3-4e88-a57d-7080e63e03d2"><Typography shuku-edit-id="e-5ea53f02-b9db-423c-9837-35059065d4a5" as="h2" variant="h3" tone="accent">1　输入场景</Typography></header>
        <div shuku-edit-id="e-689a9c08-ad08-4507-9062-eda8a755960e" className="cg-copy-ck-translation__scene" ref={sceneRef} onPointerEnter={(event) => { pointerInsideRef.current = true; moveUfo(event); }} onPointerMove={moveUfo} onPointerLeave={() => { pointerInsideRef.current = false; }} aria-label="UFO 自动绕圈飞行；移动鼠标可接管轨迹，离开后继续绕圈，前景柱子和树叶会遮挡它">
          <img shuku-edit-id="e-42b640dc-b433-475b-b5f6-aa8103ed28c3" className="cg-copy-ck-translation__background" src={backgroundUrl} alt="夜晚的城堡和桥梁背景" draggable="false" />
          <img shuku-edit-id="e-4b14097d-9ac1-410f-8dd3-89573042874f" className="cg-copy-ck-translation__ufo" src={ufoUrl} alt="可随鼠标平移的 UFO" style={ufoStyle} draggable="false" />
          <img shuku-edit-id="e-612f6608-a62c-4fb6-add2-567c8fc01f40" className="cg-copy-ck-translation__pillar" src={pillarUrl} alt="前景柱子" draggable="false" />
          <img shuku-edit-id="e-97e535fc-86bf-48f2-bf69-7852d349922b" className="cg-copy-ck-translation__foliage" src={foliageUrl} alt="前景树叶" draggable="false" />
        </div>
        <Typography shuku-edit-id="e-f25d9a5b-d876-4643-9ed8-4fa3147ec696" variant="body" tone="muted">移动鼠标控制 UFO</Typography>
      </section>
      <section shuku-edit-id="e-61eabc7e-761d-4a6e-96dc-56a87c2f37a6" className="cg-copy-ck-translation__panel cg-copy-ck-translation__kernel-panel">
        <header shuku-edit-id="e-e5caccba-7b65-4c4b-a9f5-5854965a25ab"><Typography shuku-edit-id="e-d91eb1dd-5393-4b8a-b47e-74c24415be0b" as="h2" variant="h3" tone="accent">2　固定卷积核</Typography></header>
        <div shuku-edit-id="e-48af668d-3159-4ae3-8a50-8b1107997f55" className="cg-copy-ck-translation__kernel" role="img" aria-label="四邻域 Laplacian 卷积核，中心为负四，上下左右为一，四角为零">
          {LAPLACIAN_KERNEL.flatMap((row, rowIndex) => row.map((value, colIndex) => <span shuku-edit-id="e-a51791cb-95fa-45de-8cd2-d288e09179d9" className={value > 0 ? 'is-positive' : value < 0 ? 'is-negative' : 'is-zero'} key={`${rowIndex}-${colIndex}`}><Typography shuku-edit-id="e-063a1c25-42a2-4711-94ff-17013e68ad08" as="span" variant="body" tone="inherit">{value}</Typography></span>))}
        </div>
        <div shuku-edit-id="e-b91e92d9-8965-414d-bd95-899adc4f4974" className="cg-copy-ck-translation__kernel-note"><Typography shuku-edit-id="e-71d4a924-5871-4dad-91ed-fadd7d80a37e" variant="bodySmall" tone="accent">Laplacian · 检测亮度边界</Typography><Typography shuku-edit-id="e-7a98967c-46d3-4b71-b71a-ce5424a5d314" variant="bodySmall" tone="muted">同一组权重在整张图上滑动。</Typography></div>
      </section>
      <section shuku-edit-id="e-e292ad5a-21dd-4855-a25f-29c50c9787b4" className="cg-copy-ck-translation__panel cg-copy-ck-translation__output-panel">
        <header shuku-edit-id="e-37b08d2f-693f-44ac-a167-6b4cd8f2e3b9"><Typography shuku-edit-id="e-26f81df8-db02-4bbc-a75c-e75c27115b48" as="h2" variant="h3" tone="accent">3　输出特征图</Typography></header>
        <div shuku-edit-id="e-1245863d-1134-41ad-be0e-5446ae07643e" className="cg-copy-ck-translation__heatmap-frame">
          <canvas shuku-edit-id="e-82536b6d-f696-4300-acb6-710dd59dfd46" ref={heatmapRef} className="cg-copy-ck-translation__heatmap" width={MAP_WIDTH} height={MAP_HEIGHT} role="img" aria-label="当前可见场景的灰度图经过 Laplacian 卷积得到的实时边界响应强度图" />
          <span shuku-edit-id="e-646a328d-095f-4d26-9467-5c22d8706c9e" className="cg-copy-ck-translation__heatmap-badge" tabIndex={0} aria-describedby="cg-copy-ck-translation-heatmap-tip">热力图</span>
          <span shuku-edit-id="e-265aaab2-174b-4af1-8014-5e2ad26c2fd6" className="cg-copy-ck-translation__heatmap-tooltip" id="cg-copy-ck-translation-heatmap-tip" role="tooltip">颜色表示响应强度，越暖越强。</span>
        </div>
        <Typography shuku-edit-id="e-08526f15-865e-4dea-b85f-2d6915d2a32b" variant="body" tone="muted">更亮的区域意味着更强的局部特征响应</Typography>
      </section>
    </div>
    <div shuku-edit-id="e-193941d8-231f-4233-a070-9e02ef1e5c0b" className="cg-copy-ck-translation__summary"><Typography shuku-edit-id="e-b440d812-c14f-4ead-995e-f94a7430dd5c" as="strong" variant="h3" tone="accent">结论</Typography><Typography shuku-edit-id="e-2297160f-20f1-448f-bf5b-995f3875f184" variant="body" tone="accent">UFO 平移时，响应位置随之平移；进入前景遮挡区域时，响应可能减弱。</Typography></div>
  </ContentBlock>;
}
