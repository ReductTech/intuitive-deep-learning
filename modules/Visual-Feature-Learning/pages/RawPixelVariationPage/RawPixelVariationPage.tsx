import { useEffect, useRef, useState } from 'react';
import { ContentBlock, moduleAssetUrl, Typography } from '../../../shared/react';
import { MNIST_INK_THRESHOLD } from '../../services/mnistFeatures';
import './RawPixelVariationPage.css';

const ASSET_ID = '80396753-7fc8-4f55-9188-bddbdb828169';
const samples = [
  { name: 'A', file: 'mnist/3/60030.png' },
  { name: 'B', file: 'mnist/3/60032.png' },
] as const;
const IMAGE_SIZE = 28;

type Difference = { different: number; total: number; foreground: number };

function loadSample(file: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`MNIST image failed to load: ${file}`));
    image.src = moduleAssetUrl(ASSET_ID, file);
  });
}

function inkPixels(image: HTMLImageElement): boolean[] {
  const canvas = document.createElement('canvas');
  canvas.width = IMAGE_SIZE;
  canvas.height = IMAGE_SIZE;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return [];
  context.drawImage(image, 0, 0, IMAGE_SIZE, IMAGE_SIZE);
  const pixels = context.getImageData(0, 0, IMAGE_SIZE, IMAGE_SIZE).data;
  return Array.from({ length: IMAGE_SIZE * IMAGE_SIZE }, (_, index) => {
    const offset = index * 4;
    return (pixels[offset] + pixels[offset + 1] + pixels[offset + 2]) / 3 >= MNIST_INK_THRESHOLD;
  });
}

function DigitSample({ name, file }: (typeof samples)[number]) {
  return <figure className="vfl-pixel__sample">
    <Typography as="h2" variant="h3" tone="accent">样本 {name}</Typography>
    <div className="vfl-pixel__image-frame">
      <img src={moduleAssetUrl(ASSET_ID, file)} alt={`MNIST 数据集中的手写数字 3，样本 ${name}`} />
    </div>
    <figcaption><Typography as="span" variant="bodySmall" tone="muted">真实 MNIST 样本 · 标签 3</Typography></figcaption>
  </figure>;
}

export function RawPixelVariationPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [difference, setDifference] = useState<Difference | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all(samples.map((sample) => loadSample(sample.file))).then(([left, right]) => {
      if (!active || !canvasRef.current) return;
      const a = inkPixels(left);
      const b = inkPixels(right);
      const context = canvasRef.current.getContext('2d');
      if (!context || a.length !== IMAGE_SIZE * IMAGE_SIZE || b.length !== IMAGE_SIZE * IMAGE_SIZE) return;
      const map = context.createImageData(IMAGE_SIZE, IMAGE_SIZE);
      let different = 0;
      let foreground = 0;
      for (let index = 0; index < a.length; index += 1) {
        const mismatch = a[index] !== b[index];
        if (mismatch) different += 1;
        if (a[index] || b[index]) foreground += 1;
        const offset = index * 4;
        map.data[offset] = mismatch ? 255 : 12;
        map.data[offset + 1] = mismatch ? 137 : 20;
        map.data[offset + 2] = mismatch ? 49 : 38;
        map.data[offset + 3] = 255;
      }
      context.putImageData(map, 0, 0);
      setDifference({ different, total: a.length, foreground });
    }).catch(() => { if (active) setDifference(null); });
    return () => { active = false; };
  }, []);

  const percent = difference ? (difference.different / difference.total * 100).toFixed(1) : null;
  return <ContentBlock
    className="vfl-pixel"
    headingLevel={1}
    title="直接比较像素可靠吗？"
    subtitle="即使类别相同，书写位置与笔画形态的变化也会产生逐像素差异。"
  >
    <section className="vfl-pixel__comparison" aria-label="两个真实 MNIST 数字 3 的逐像素对比">
      <DigitSample {...samples[0]} />
      <div className="vfl-pixel__difference">
        <Typography as="h2" variant="h3" tone="accent">二值化墨迹差异图</Typography>
        <div className="vfl-pixel__map-frame">
          <canvas ref={canvasRef} width={IMAGE_SIZE} height={IMAGE_SIZE} role="img" aria-label="橙色像素表示两个样本在这个位置的墨迹状态不同" />
        </div>
        <Typography as="p" variant="h3" tone="accent" className="vfl-pixel__count">
          {difference ? <><strong>{difference.different}</strong> / {difference.total} 格不同 · <strong>{percent}%</strong></> : '正在计算像素差异…'}
        </Typography>
        <Typography as="p" variant="bodySmall" tone="muted" className="vfl-pixel__legend">橙色：不一致　深色：一致</Typography>
      </div>
      <DigitSample {...samples[1]} />
    </section>
    <div className="vfl-pixel__takeaway">
      <div className="vfl-pixel__icon" aria-hidden="true">!</div>
      <div>
        <Typography as="p" variant="h3" tone="accent">同类数字也可能存在多处墨迹位置差异。</Typography>
        <Typography as="p" variant="bodySmall" tone="muted">
          {difference ? `以灰度值 ≥ ${MNIST_INK_THRESHOLD} 判定墨迹；${difference.foreground} 个位置至少出现一次墨迹，其中 ${difference.different} 个位置仅一张图有墨迹。` : `以灰度值 ≥ ${MNIST_INK_THRESHOLD} 判定墨迹。`}
        </Typography>
      </div>
    </div>
  </ContentBlock>;
}
