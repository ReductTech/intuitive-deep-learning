import { moduleIdentity } from '../../outlines.json';
import { moduleAssetUrl } from '../../../shared/react/assets';
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import {
  Button,
  Callout,
  ContentBlock,
  NoticeStrip,
  Typography,
} from '../../../shared/react';
const bottleFront = moduleAssetUrl(moduleIdentity.id, "recycling/camera-views/bottle-front.png");
import './FeatureMapsPage.css';

type FeatureId = 'edge' | 'texture' | 'shape';
type HotspotId = 'cap' | 'edge' | 'label';

interface ProbePoint {
  x: number;
  y: number;
}

interface FeatureSpec {
  id: FeatureId;
  channel: string;
  label: string;
  description: string;
  color: readonly [number, number, number];
}

interface Hotspot {
  id: HotspotId;
  label: string;
  point: ProbePoint;
}

const MAP_WIDTH = 228;
const MAP_HEIGHT = 296;
const INITIAL_PROBE: ProbePoint = { x: .5, y: .14 };

const featureSpecs: FeatureSpec[] = [
  {
    id: 'edge',
    channel: '通道 1',
    label: '轮廓响应',
    description: '明暗边界越明显，响应越强',
    color: [242, 139, 73],
  },
  {
    id: 'texture',
    channel: '通道 2',
    label: '纹理响应',
    description: '局部细节变化越密集，响应越强',
    color: [137, 104, 191],
  },
  {
    id: 'shape',
    channel: '通道 3',
    label: '局部形状',
    description: '较大范围的结构变化会被保留',
    color: [74, 139, 196],
  },
];

const hotspots: Hotspot[] = [
  { id: 'cap', label: '瓶盖', point: { x: .5, y: .14 } },
  { id: 'edge', label: '瓶身边缘', point: { x: .31, y: .43 } },
  { id: 'label', label: '标签区域', point: { x: .5, y: .58 } },
];

function clamp(value: number, minimum = 0, maximum = 1) {
  return Math.max(minimum, Math.min(maximum, value));
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.decoding = 'async';
    image.addEventListener('load', () => resolve(image), { once: true });
    image.addEventListener('error', reject, { once: true });
    image.src = src;
  });
}

function boxBlur(source: Float32Array, width: number, height: number, radius: number) {
  const integral = new Float32Array((width + 1) * (height + 1));
  for (let y = 0; y < height; y += 1) {
    let rowSum = 0;
    for (let x = 0; x < width; x += 1) {
      rowSum += source[y * width + x];
      integral[(y + 1) * (width + 1) + x + 1] = integral[y * (width + 1) + x + 1] + rowSum;
    }
  }

  const output = new Float32Array(width * height);
  for (let y = 0; y < height; y += 1) {
    const top = Math.max(0, y - radius);
    const bottom = Math.min(height - 1, y + radius);
    for (let x = 0; x < width; x += 1) {
      const left = Math.max(0, x - radius);
      const right = Math.min(width - 1, x + radius);
      const sum = integral[(bottom + 1) * (width + 1) + right + 1]
        - integral[top * (width + 1) + right + 1]
        - integral[(bottom + 1) * (width + 1) + left]
        + integral[top * (width + 1) + left];
      output[y * width + x] = sum / ((right - left + 1) * (bottom - top + 1));
    }
  }
  return output;
}

function normalizeFeature(values: Float32Array) {
  const samples = Array.from(values).sort((left, right) => left - right);
  const ceiling = samples[Math.floor(samples.length * .985)] || 1;
  const normalized = new Float32Array(values.length);
  for (let index = 0; index < values.length; index += 1) {
    normalized[index] = Math.pow(clamp(values[index] / ceiling), .72);
  }
  return normalized;
}

function buildFeatureMaps(image: HTMLImageElement) {
  const source = document.createElement('canvas');
  source.width = MAP_WIDTH;
  source.height = MAP_HEIGHT;
  const context = source.getContext('2d', { willReadFrequently: true });
  if (!context) return [] as Float32Array[];
  context.drawImage(image, 0, 0, MAP_WIDTH, MAP_HEIGHT);
  const pixels = context.getImageData(0, 0, MAP_WIDTH, MAP_HEIGHT).data;
  const grayscale = new Float32Array(MAP_WIDTH * MAP_HEIGHT);
  for (let index = 0; index < grayscale.length; index += 1) {
    const pixelIndex = index * 4;
    grayscale[index] = pixels[pixelIndex] * .299 + pixels[pixelIndex + 1] * .587 + pixels[pixelIndex + 2] * .114;
  }

  const edge = new Float32Array(grayscale.length);
  for (let y = 1; y < MAP_HEIGHT - 1; y += 1) {
    for (let x = 1; x < MAP_WIDTH - 1; x += 1) {
      const topLeft = grayscale[(y - 1) * MAP_WIDTH + x - 1];
      const top = grayscale[(y - 1) * MAP_WIDTH + x];
      const topRight = grayscale[(y - 1) * MAP_WIDTH + x + 1];
      const left = grayscale[y * MAP_WIDTH + x - 1];
      const right = grayscale[y * MAP_WIDTH + x + 1];
      const bottomLeft = grayscale[(y + 1) * MAP_WIDTH + x - 1];
      const bottom = grayscale[(y + 1) * MAP_WIDTH + x];
      const bottomRight = grayscale[(y + 1) * MAP_WIDTH + x + 1];
      const horizontal = -topLeft + topRight - 2 * left + 2 * right - bottomLeft + bottomRight;
      const vertical = -topLeft - 2 * top - topRight + bottomLeft + 2 * bottom + bottomRight;
      edge[y * MAP_WIDTH + x] = Math.hypot(horizontal, vertical);
    }
  }

  const fineBlur = boxBlur(grayscale, MAP_WIDTH, MAP_HEIGHT, 2);
  const middleBlur = boxBlur(grayscale, MAP_WIDTH, MAP_HEIGHT, 5);
  const broadBlur = boxBlur(grayscale, MAP_WIDTH, MAP_HEIGHT, 14);
  const texture = new Float32Array(grayscale.length);
  const shape = new Float32Array(grayscale.length);
  for (let index = 0; index < grayscale.length; index += 1) {
    texture[index] = Math.abs(grayscale[index] - fineBlur[index]);
    shape[index] = Math.abs(middleBlur[index] - broadBlur[index]);
  }

  return [normalizeFeature(edge), normalizeFeature(texture), normalizeFeature(shape)];
}

function drawFeatureMap(canvas: HTMLCanvasElement, values: Float32Array, color: readonly [number, number, number]) {
  canvas.width = MAP_WIDTH;
  canvas.height = MAP_HEIGHT;
  const context = canvas.getContext('2d');
  if (!context) return;
  const output = context.createImageData(MAP_WIDTH, MAP_HEIGHT);
  const background: readonly [number, number, number] = [31, 49, 78];
  for (let index = 0; index < values.length; index += 1) {
    const strength = values[index];
    const pixelIndex = index * 4;
    output.data[pixelIndex] = Math.round(background[0] + (color[0] - background[0]) * strength);
    output.data[pixelIndex + 1] = Math.round(background[1] + (color[1] - background[1]) * strength);
    output.data[pixelIndex + 2] = Math.round(background[2] + (color[2] - background[2]) * strength);
    output.data[pixelIndex + 3] = 255;
  }
  context.putImageData(output, 0, 0);
}

function sampleResponse(values: Float32Array, point: ProbePoint) {
  const centerX = Math.round(point.x * (MAP_WIDTH - 1));
  const centerY = Math.round(point.y * (MAP_HEIGHT - 1));
  let total = 0;
  let count = 0;
  for (let row = -3; row <= 3; row += 1) {
    for (let column = -3; column <= 3; column += 1) {
      const x = Math.max(0, Math.min(MAP_WIDTH - 1, centerX + column));
      const y = Math.max(0, Math.min(MAP_HEIGHT - 1, centerY + row));
      total += values[y * MAP_WIDTH + x];
      count += 1;
    }
  }
  return count ? total / count : 0;
}

export interface FeatureMapsPageProps {
  onComplete?: () => void;
}

export function FeatureMapsPage({ onComplete }: FeatureMapsPageProps) {
  const completedRef = useRef(false);
  const mapValuesRef = useRef<Float32Array[]>([]);
  const canvasRefs = useRef<Array<HTMLCanvasElement | null>>([]);
  const [mapsReady, setMapsReady] = useState(false);
  const [probePoint, setProbePoint] = useState<ProbePoint>(INITIAL_PROBE);
  const [responses, setResponses] = useState([0, 0, 0]);
  const [visited, setVisited] = useState<Set<HotspotId>>(() => new Set());
  const completed = visited.size === hotspots.length;
  const strongestIndex = useMemo(() => responses.reduce(
    (strongest, value, index, values) => value > values[strongest] ? index : strongest,
    0,
  ), [responses]);

  useEffect(() => {
    let cancelled = false;
    void loadImage(bottleFront).then((image) => {
      if (cancelled) return;
      mapValuesRef.current = buildFeatureMaps(image);
      setMapsReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!mapsReady) return;
    featureSpecs.forEach((spec, index) => {
      const canvas = canvasRefs.current[index];
      const values = mapValuesRef.current[index];
      if (canvas && values) drawFeatureMap(canvas, values, spec.color);
    });
  }, [mapsReady]);

  useEffect(() => {
    if (!mapsReady) return;
    setResponses(mapValuesRef.current.map((values) => sampleResponse(values, probePoint)));
  }, [mapsReady, probePoint]);

  useEffect(() => {
    if (!completed || completedRef.current) return;
    completedRef.current = true;
    onComplete?.();
  }, [completed, onComplete]);

  const updateVisited = (point: ProbePoint) => {
    const nearby = hotspots.filter((hotspot) => Math.hypot(point.x - hotspot.point.x, point.y - hotspot.point.y) < .13);
    if (!nearby.length) return;
    setVisited((current) => {
      const next = new Set(current);
      nearby.forEach((hotspot) => next.add(hotspot.id));
      return next.size === current.size ? current : next;
    });
  };

  const setProbe = (point: ProbePoint) => {
    const next = { x: clamp(point.x, .04, .96), y: clamp(point.y, .05, .95) };
    setProbePoint(next);
    updateVisited(next);
  };

  const moveProbe = (event: ReactPointerEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    setProbe({
      x: (event.clientX - bounds.left) / bounds.width,
      y: (event.clientY - bounds.top) / bounds.height,
    });
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    moveProbe(event);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) moveProbe(event);
  };

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const step = event.shiftKey ? .05 : .015;
    const offset = {
      ArrowLeft: { x: -step, y: 0 },
      ArrowRight: { x: step, y: 0 },
      ArrowUp: { x: 0, y: -step },
      ArrowDown: { x: 0, y: step },
    }[event.key];
    if (!offset) return;
    event.preventDefault();
    setProbe({ x: probePoint.x + offset.x, y: probePoint.y + offset.y });
  };

  return (
    <ContentBlock
      headingLevel={1}
      className="rtg-feature-maps"
      title="特征图里存的是什么？"
      subtitle="移动同一个观察点，比较不同通道对轮廓、纹理和局部形状的响应。"
    >
      <div className="rtg-feature-maps__experiment">
        <section className="rtg-feature-maps__source-stage" aria-labelledby="rtg-feature-source-title">
          <header className="rtg-feature-maps__section-head">
            <Typography as="span" variant="bodySmall" tone="warning">输入图像</Typography>
            <Typography as="h2" variant="h3" tone="accent" id="rtg-feature-source-title">把探针放到不同位置</Typography>
          </header>

          <div className="rtg-feature-maps__source-photo">
            <div
              className="rtg-feature-maps__source-frame"
              role="button"
              tabIndex={0}
              aria-label="塑料瓶照片。拖动探针，或使用方向键移动探针。"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onKeyDown={handleKeyDown}
            >
              <img src={bottleFront} alt="统一背景下的透明塑料瓶正面照片" />
              <span
                className="rtg-feature-maps__source-probe"
                style={{ left: probePoint.x * 100 + '%', top: probePoint.y * 100 + '%' }}
                aria-hidden="true"
              />
            </div>
          </div>

          <div className="rtg-feature-maps__hotspots" role="group" aria-label="推荐观察位置">
            {hotspots.map((hotspot, index) => {
              const active = Math.hypot(probePoint.x - hotspot.point.x, probePoint.y - hotspot.point.y) < .035;
              const checked = visited.has(hotspot.id);
              return (
                <Button
                  key={hotspot.id}
                  className={'rtg-feature-maps__hotspot-button' + (checked ? ' is-visited' : '')}
                  variant={active ? 'primary' : 'default'}
                  active={active}
                  hint={index === 0 && visited.size === 0}
                  aria-pressed={active}
                  onClick={() => setProbe(hotspot.point)}
                >
                  <span className="rtg-feature-maps__hotspot-dot" aria-hidden="true" />
                  <Typography as="strong" variant="bodySmall" tone="inherit">{hotspot.label}</Typography>
                </Button>
              );
            })}
          </div>
        </section>

        <div className="rtg-feature-maps__transform" aria-label="卷积加激活生成多个特征通道">
          <div className="rtg-feature-maps__transform-arrow" aria-hidden="true" />
          <div className="rtg-feature-maps__filter-stack" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <Typography as="strong" variant="body" tone="accent">卷积＋激活</Typography>
          <Typography variant="bodySmall" tone="muted">不同卷积核关注不同线索</Typography>
          <div className="rtg-feature-maps__transform-arrow" aria-hidden="true" />
        </div>

        <section className="rtg-feature-maps__maps-stage" aria-labelledby="rtg-feature-maps-title">
          <header className="rtg-feature-maps__section-head">
            <Typography as="span" variant="bodySmall" tone="warning">中间表示</Typography>
            <Typography as="h2" variant="h3" tone="accent" id="rtg-feature-maps-title">同一位置，多个通道</Typography>
          </header>

          <div className="rtg-feature-maps__maps-grid">
            {featureSpecs.map((spec, index) => (
              <article
                key={spec.id}
                className={'rtg-feature-maps__map-card rtg-feature-maps__map-card--' + spec.id + (strongestIndex === index ? ' is-strongest' : '')}
              >
                <header>
                  <Typography as="span" variant="bodySmall" tone="muted">{spec.channel}</Typography>
                  <Typography as="h3" variant="body" tone="accent">{spec.label}</Typography>
                </header>
                <div className="rtg-feature-maps__map-frame">
                  <canvas
                    ref={(canvas) => { canvasRefs.current[index] = canvas; }}
                    width={MAP_WIDTH}
                    height={MAP_HEIGHT}
                    aria-label={spec.label + '的卷积响应示意图'}
                  />
                  <span
                    className="rtg-feature-maps__map-probe"
                    style={{ left: probePoint.x * 100 + '%', top: probePoint.y * 100 + '%' }}
                    aria-hidden="true"
                  />
                </div>
                <div className="rtg-feature-maps__response">
                  <Typography variant="bodySmall" tone="muted">当前位置响应</Typography>
                  <Typography as="output" variant="h3" tone={strongestIndex === index ? 'warning' : 'accent'}>
                    {Math.round(responses[index] * 100)}
                  </Typography>
                </div>
                <Typography variant="bodySmall" tone="muted">{spec.description}</Typography>
              </article>
            ))}
          </div>

          <Callout
            tone="orange"
            label="当前最强"
            text={featureSpecs[strongestIndex].label + '。换一个位置，最强通道也可能改变。'}
          />
        </section>
      </div>

      {completed ? (
        <NoticeStrip tone="green" role="status" aria-live="polite">
          <Typography variant="body" tone="inherit">
            一张特征图记录一种视觉线索在各个位置的响应。多个通道合在一起，组成网络当前的中间表示。
          </Typography>
        </NoticeStrip>
      ) : (
        <NoticeStrip tone="blue" role="status" aria-live="polite">
          <Typography variant="body" tone="inherit">
            已检查 {visited.size} / {hotspots.length} 个位置。依次查看瓶盖、瓶身边缘和标签区域。
          </Typography>
        </NoticeStrip>
      )}
    </ContentBlock>
  );
}
