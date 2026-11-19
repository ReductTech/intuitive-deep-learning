import bgAsset0 from "../../../../../assets/workflow/convolution-course/layerd_scene/bg.webp";
import ufoAsset1 from "../../../../../assets/workflow/convolution-course/layerd_scene/ufo.webp";
import pillarAsset2 from "../../../../../assets/workflow/convolution-course/layerd_scene/pillar.webp";
import dark_foliageAsset3 from "../../../../../assets/workflow/convolution-course/layerd_scene/dark_foliage.webp";
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { ContentBlock, Typography } from "@shuku/course-style/react";
import './TranslationEquivariancePage.css';

const backgroundUrl = bgAsset0;
const ufoUrl = ufoAsset1;
const pillarUrl = pillarAsset2;
const foliageUrl = dark_foliageAsset3;

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

  return <ContentBlock shuku-edit-id="e-c56f3a9a-7257-4a84-af2d-7c1dd973da60" headingLevel={1} className="cg-copy-ck-translation" title="平移等变性" subtitle="输入中的目标移到哪里，固定卷积核产生的对应响应也移到哪里。">
    <div shuku-edit-id="e-095b4a1e-9260-4c1b-a770-1bb61b028a71" className="cg-copy-ck-translation__workspace">
      <section shuku-edit-id="e-9d0d03bb-9a40-4731-b1b9-8fa8febe63d9" className="cg-copy-ck-translation__panel cg-copy-ck-translation__input-panel">
        <header shuku-edit-id="e-871724d1-06b8-418a-be6f-621838b65228"><Typography shuku-edit-id="e-f141333a-43a8-4e81-9b2c-c9a97e199204" as="h2" variant="h3" tone="accent">1　输入场景</Typography></header>
        <div shuku-edit-id="e-3572f662-129b-4c80-b037-3da52b7dc82f" className="cg-copy-ck-translation__scene" ref={sceneRef} onPointerEnter={(event) => { pointerInsideRef.current = true; moveUfo(event); }} onPointerMove={moveUfo} onPointerLeave={() => { pointerInsideRef.current = false; }} aria-label="UFO 自动绕圈飞行；移动鼠标可接管轨迹，离开后继续绕圈，前景柱子和树叶会遮挡它">
          <img shuku-edit-id="e-96113d4e-c14f-45aa-9406-c3d9c876d694" className="cg-copy-ck-translation__background" src={backgroundUrl} alt="夜晚的城堡和桥梁背景" draggable="false" />
          <img shuku-edit-id="e-7a3d6ae9-1029-4568-99d3-3da692609783" className="cg-copy-ck-translation__ufo" src={ufoUrl} alt="可随鼠标平移的 UFO" style={ufoStyle} draggable="false" />
          <img shuku-edit-id="e-6c6e06da-02c3-416a-952d-70fd85cbf9a0" className="cg-copy-ck-translation__pillar" src={pillarUrl} alt="前景柱子" draggable="false" />
          <img shuku-edit-id="e-0ccd39b3-eca3-49d2-8403-3b42a5eabe76" className="cg-copy-ck-translation__foliage" src={foliageUrl} alt="前景树叶" draggable="false" />
        </div>
        <Typography shuku-edit-id="e-4ed19aa9-bddc-4589-b6bb-ef41480198b8" variant="body" tone="muted">移动鼠标控制 UFO</Typography>
      </section>
      <section shuku-edit-id="e-d5b5d550-570e-4648-bc1c-dcd598887a9b" className="cg-copy-ck-translation__panel cg-copy-ck-translation__kernel-panel">
        <header shuku-edit-id="e-b62eda91-be0a-461b-923b-8b326513a99d"><Typography shuku-edit-id="e-214919e5-ecc2-4f01-b0bc-71068982a4b9" as="h2" variant="h3" tone="accent">2　固定卷积核</Typography></header>
        <div shuku-edit-id="e-03c78ae0-f87c-4400-ac40-7ffe77adc623" className="cg-copy-ck-translation__kernel" role="img" aria-label="四邻域 Laplacian 卷积核，中心为负四，上下左右为一，四角为零">
          {LAPLACIAN_KERNEL.flatMap((row, rowIndex) => row.map((value, colIndex) => <span shuku-edit-id="e-1f34a821-09e0-4f06-86ad-0cc0c829fecb" className={value > 0 ? 'is-positive' : value < 0 ? 'is-negative' : 'is-zero'} key={`${rowIndex}-${colIndex}`}><Typography shuku-edit-id="e-2cb4f7c2-a954-4836-9ca7-8a95811beb5c" as="span" variant="body" tone="inherit">{value}</Typography></span>))}
        </div>
        <div shuku-edit-id="e-a3d03eb7-b207-49c9-b65c-2e8f4ad7d793" className="cg-copy-ck-translation__kernel-note"><Typography shuku-edit-id="e-f73d639d-58f0-4e06-8175-73ae4d99efc8" variant="bodySmall" tone="accent">Laplacian · 检测亮度边界</Typography><Typography shuku-edit-id="e-80ead38b-ee2a-443b-a1a8-a6e49e035761" variant="bodySmall" tone="muted">同一组权重在整张图上滑动。</Typography></div>
      </section>
      <section shuku-edit-id="e-4cf72d4d-21ae-4d75-9c80-de4e95d9a356" className="cg-copy-ck-translation__panel cg-copy-ck-translation__output-panel">
        <header shuku-edit-id="e-697deaa5-55f6-42ea-b163-1b80baac4586"><Typography shuku-edit-id="e-adf5b8bd-b6f5-42fc-a010-84d7d690a966" as="h2" variant="h3" tone="accent">3　输出特征图</Typography></header>
        <div shuku-edit-id="e-8bc4b38b-1826-496d-b462-cce880094646" className="cg-copy-ck-translation__heatmap-frame">
          <canvas shuku-edit-id="e-4bb244bd-c850-44f4-b3ee-c879df07d99b" ref={heatmapRef} className="cg-copy-ck-translation__heatmap" width={MAP_WIDTH} height={MAP_HEIGHT} role="img" aria-label="当前可见场景的灰度图经过 Laplacian 卷积得到的实时边界响应强度图" />
          <span shuku-edit-id="e-10d80cae-e9bb-4ec4-82f2-07370e0d9d5d" className="cg-copy-ck-translation__heatmap-badge" tabIndex={0} aria-describedby="cg-copy-ck-translation-heatmap-tip">热力图</span>
          <span shuku-edit-id="e-bef65d00-f06d-4814-94d8-8dae63903a1a" className="cg-copy-ck-translation__heatmap-tooltip" id="cg-copy-ck-translation-heatmap-tip" role="tooltip">颜色表示响应强度，越暖越强。</span>
        </div>
        <Typography shuku-edit-id="e-46e7a14e-c67c-44ff-8fd1-22c758815104" variant="body" tone="muted">更亮的区域意味着更强的局部特征响应</Typography>
      </section>
    </div>
    <div shuku-edit-id="e-58d2e3a2-b7cb-42d4-8865-e2173372f751" className="cg-copy-ck-translation__summary"><Typography shuku-edit-id="e-d86f466f-3090-42bd-ae4f-4b7ca93a32ec" as="strong" variant="h3" tone="accent">结论</Typography><Typography shuku-edit-id="e-6b1d92df-dfcb-4f11-90eb-656cc615861d" variant="body" tone="accent">UFO 平移时，响应位置随之平移；进入前景遮挡区域时，响应可能减弱。</Typography></div>
  </ContentBlock>;
}
