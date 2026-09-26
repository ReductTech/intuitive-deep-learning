import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { ContentBlock, Typography } from '../../../shared/react';
import backgroundUrl from '../../assets/layerd_scene/bg.png';
import ufoUrl from '../../assets/layerd_scene/ufo.png';
import pillarUrl from '../../assets/layerd_scene/pillar.png';
import foliageUrl from '../../assets/layerd_scene/dark_foliage.png';
import './TranslationEquivariancePage.css';

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
  const [ready, setReady] = useState(false);

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
    setPosition({ x: Math.max(.07, Math.min(.93, (event.clientX - rect.left) / rect.width)), y: Math.max(.08, Math.min(.92, (event.clientY - rect.top) / rect.height)) });
  };
  const ufoStyle = { left: `${position.x * 100}%`, top: `${position.y * 100}%` } as CSSProperties;

  return <ContentBlock headingLevel={1} className="ck-translation" title="平移等变性" subtitle="输入中的目标移到哪里，固定卷积核产生的对应响应也移到哪里。">
    <div className="ck-translation__workspace">
      <section className="ck-translation__panel ck-translation__input-panel">
        <header><Typography as="h2" variant="h3" tone="accent">1　输入场景</Typography></header>
        <div className="ck-translation__scene" ref={sceneRef} onPointerMove={moveUfo} aria-label="移动鼠标可控制中间景深的 UFO，前景柱子和树叶会遮挡它">
          <img className="ck-translation__background" src={backgroundUrl} alt="夜晚的城堡和桥梁背景" draggable="false" />
          <img className="ck-translation__ufo" src={ufoUrl} alt="可随鼠标平移的 UFO" style={ufoStyle} draggable="false" />
          <img className="ck-translation__pillar" src={pillarUrl} alt="前景柱子" draggable="false" />
          <img className="ck-translation__foliage" src={foliageUrl} alt="前景树叶" draggable="false" />
        </div>
        <Typography variant="bodySmall" tone="muted">移动鼠标控制 UFO；柱子和树叶位于它的前方。</Typography>
      </section>
      <section className="ck-translation__panel ck-translation__kernel-panel">
        <header><Typography as="h2" variant="h3" tone="accent">2　固定卷积核</Typography></header>
        <div className="ck-translation__kernel" role="img" aria-label="四邻域 Laplacian 卷积核，中心为负四，上下左右为一，四角为零">
          {LAPLACIAN_KERNEL.flatMap((row, rowIndex) => row.map((value, colIndex) => <span className={value > 0 ? 'is-positive' : value < 0 ? 'is-negative' : 'is-zero'} key={`${rowIndex}-${colIndex}`}><Typography as="span" variant="body" tone="inherit">{value}</Typography></span>))}
        </div>
        <div className="ck-translation__kernel-note"><Typography variant="bodySmall" tone="accent">Laplacian · 检测亮度边界</Typography><Typography variant="bodySmall" tone="muted">同一组权重在整张图上滑动。</Typography></div>
      </section>
      <section className="ck-translation__panel ck-translation__output-panel">
        <header><Typography as="h2" variant="h3" tone="accent">3　输出特征图</Typography></header>
        <canvas ref={heatmapRef} className="ck-translation__heatmap" width={MAP_WIDTH} height={MAP_HEIGHT} role="img" aria-label="当前可见场景的灰度图经过 Laplacian 卷积得到的实时边界响应强度图" />
        <Typography variant="bodySmall" tone="muted">亮处表示更强的局部亮度变化；背景边界也会保留。</Typography>
      </section>
    </div>
    <div className="ck-translation__summary"><Typography as="strong" variant="h3" tone="accent">结论</Typography><Typography variant="body" tone="accent">UFO 平移时，响应位置随之平移；进入前景遮挡区域时，响应可能减弱。</Typography></div>
  </ContentBlock>;
}
