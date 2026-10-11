import {
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { ContentBlock, Typography } from '../../../shared/react';
import faceOne from '../../assets/distribution-modeling/face-1.png';
import faceTwo from '../../assets/distribution-modeling/face-2.png';
import faceThree from '../../assets/distribution-modeling/face-3.png';
import faceFour from '../../assets/distribution-modeling/face-4.png';
import faceFive from '../../assets/distribution-modeling/face-5.png';
import faceSix from '../../assets/distribution-modeling/face-6.png';
import anomalyThreeEyes from '../../assets/distribution-modeling/anomaly-three-eyes.png';
import anomalyRandomFeatures from '../../assets/distribution-modeling/anomaly-random-features.png';
import anomalyFaceCar from '../../assets/distribution-modeling/anomaly-face-car.png';
import './DistributionViewPage.css';

interface Point {
  x: number;
  y: number;
}

type ProbabilityBand = 'high' | 'middle' | 'low';

const INITIAL_POINT: Point = { x: 67, y: 52 };
const MOVE_STEP = 3;

const realSamples = [
  { src: faceOne, x: 15, y: 24, label: '真实人脸样本 1' },
  { src: faceTwo, x: 31, y: 20, label: '真实人脸样本 2' },
  { src: faceThree, x: 48, y: 25, label: '真实人脸样本 3' },
  { src: faceFour, x: 22, y: 56, label: '真实人脸样本 4' },
  { src: faceFive, x: 39, y: 59, label: '真实人脸样本 5' },
  { src: faceSix, x: 55, y: 53, label: '真实人脸样本 6' },
] as const;

const lowProbabilitySamples = [
  { src: anomalyThreeEyes, x: 76, y: 23, label: '三只眼睛的异常人脸' },
  { src: anomalyRandomFeatures, x: 89, y: 27, label: '五官随机分布的异常人脸' },
  { src: anomalyFaceCar, x: 83, y: 61, label: '人脸与汽车混合的异常图像' },
] as const;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function probabilityAt(point: Point) {
  const horizontal = (point.x - 36) / 34;
  const vertical = (point.y - 49) / 38;
  return Math.exp(-1.2 * (horizontal * horizontal + vertical * vertical));
}

function probabilityBand(probability: number): ProbabilityBand {
  if (probability >= 0.55) return 'high';
  if (probability <= 0.25) return 'low';
  return 'middle';
}

const bandCopy: Record<ProbabilityBand, { label: string; description: string }> = {
  high: {
    label: '较高概率',
    description: '这里聚集着符合当前人脸数据共同结构的图像。',
  },
  middle: {
    label: '概率正在降低',
    description: '越远离真实样本聚集区，这类图像在数据中越少见。',
  },
  low: {
    label: '低概率',
    description: '这些像素组合可以存在，但在当前人脸数据中很少出现。',
  },
};

export interface DistributionViewPageProps {
  onComplete?: () => void;
}

export function DistributionViewPage({ onComplete }: DistributionViewPageProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const completedRef = useRef(false);
  const [point, setPoint] = useState<Point>(INITIAL_POINT);
  const [dragging, setDragging] = useState(false);
  const [visited, setVisited] = useState({ high: false, low: false });
  const probability = probabilityAt(point);
  const band = probabilityBand(probability);
  const complete = visited.high && visited.low;

  const recordVisit = (nextBand: ProbabilityBand) => {
    if (nextBand === 'middle') return;
    setVisited((current) => {
      const next = {
        high: current.high || nextBand === 'high',
        low: current.low || nextBand === 'low',
      };
      if (next.high && next.low && !completedRef.current) {
        completedRef.current = true;
        onComplete?.();
      }
      return next;
    });
  };

  const updatePoint = (next: Point) => {
    const normalized = {
      x: clamp(next.x, 8, 92),
      y: clamp(next.y, 10, 90),
    };
    setPoint(normalized);
    recordVisit(probabilityBand(probabilityAt(normalized)));
  };

  const pointFromEvent = (event: ReactPointerEvent<HTMLDivElement>): Point => {
    const bounds = event.currentTarget.getBoundingClientRect();
    return {
      x: ((event.clientX - bounds.left) / bounds.width) * 100,
      y: ((event.clientY - bounds.top) / bounds.height) * 100,
    };
  };

  const startDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    draggingRef.current = true;
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
    updatePoint(pointFromEvent(event));
  };

  const continueDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    updatePoint(pointFromEvent(event));
  };

  const finishDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    draggingRef.current = false;
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const moveWithKeyboard = (event: KeyboardEvent<HTMLDivElement>) => {
    const movement: Record<string, Point> = {
      ArrowLeft: { x: -MOVE_STEP, y: 0 },
      ArrowRight: { x: MOVE_STEP, y: 0 },
      ArrowUp: { x: 0, y: -MOVE_STEP },
      ArrowDown: { x: 0, y: MOVE_STEP },
    };
    const delta = movement[event.key];
    if (!delta) return;
    event.preventDefault();
    updatePoint({ x: point.x + delta.x, y: point.y + delta.y });
  };

  return (
    <ContentBlock
      headingLevel={1}
      className="vg-distribution-page"
      title="什么样的图像，更可能出现在真实世界中？"
      subtitle="拖动候选图像点 x，观察它在当前人脸数据分布中的可能性如何变化。"
    >
      <div
        ref={stageRef}
        className={`vg-distribution-page__stage is-${band}${dragging ? ' is-dragging' : ''}`}
        onPointerDown={startDrag}
        onPointerMove={continueDrag}
        onPointerUp={finishDrag}
        onPointerCancel={finishDrag}
        onKeyDown={moveWithKeyboard}
        tabIndex={0}
        role="application"
        aria-label="高维图像空间的二维示意。拖动或使用方向键移动候选图像点 x，探索真实人脸数据的高概率和低概率区域。"
      >
        <div className="vg-distribution-page__stage-head">
          <Typography as="span" variant="bodySmall" tone="muted">高维图像空间的二维示意</Typography>
          <div className="vg-distribution-page__legend" aria-label="概率区域图例">
            <Typography as="span" variant="bodySmall" tone="accent">高概率区域</Typography>
            <Typography as="span" variant="bodySmall" tone="danger">低概率区域</Typography>
          </div>
        </div>

        <div className="vg-distribution-page__density" aria-hidden="true">
          <span className="vg-distribution-page__contour vg-distribution-page__contour--outer" />
          <span className="vg-distribution-page__contour vg-distribution-page__contour--middle" />
          <span className="vg-distribution-page__contour vg-distribution-page__contour--inner" />
        </div>
        <Typography className="vg-distribution-page__density-label" variant="bodySmall" tone="accent">
          真实人脸聚集区
        </Typography>
        <Typography className="vg-distribution-page__rare-label" variant="bodySmall" tone="danger">
          真实数据中很少出现
        </Typography>

        {realSamples.map((sample) => (
          <figure
            className="vg-distribution-page__sample vg-distribution-page__sample--real"
            key={sample.src}
            style={{ '--sample-x': `${sample.x}%`, '--sample-y': `${sample.y}%` } as CSSProperties}
          >
            <img src={sample.src} alt={sample.label} draggable={false} />
          </figure>
        ))}

        {lowProbabilitySamples.map((sample) => (
          <figure
            className="vg-distribution-page__sample vg-distribution-page__sample--rare"
            key={sample.src}
            style={{ '--sample-x': `${sample.x}%`, '--sample-y': `${sample.y}%` } as CSSProperties}
          >
            <img src={sample.src} alt={sample.label} draggable={false} />
          </figure>
        ))}

        <div
          className={`vg-distribution-page__candidate is-${band}`}
          style={{
            '--candidate-x': `${point.x}%`,
            '--candidate-y': `${point.y}%`,
            '--candidate-strength': probability.toFixed(3),
          } as CSSProperties}
          aria-live="polite"
        >
          <span className="vg-distribution-page__candidate-ring" aria-hidden="true" />
          <Typography as="strong" variant="body" tone="inherit" className="vg-distribution-page__candidate-symbol">x</Typography>
          <div className="vg-distribution-page__candidate-copy">
            <Typography as="strong" variant="bodySmall" tone="inherit">{bandCopy[band].label}</Typography>
            <Typography as="span" variant="bodySmall" tone="inherit">p_data(x) ≈ {probability.toFixed(2)}</Typography>
          </div>
        </div>
      </div>

      <footer className={`vg-distribution-page__insight${complete ? ' is-complete' : ''}`} aria-live="polite">
        <div className="vg-distribution-page__insight-copy">
          <Typography as="strong" variant="h3" tone={complete ? 'success' : band === 'low' ? 'danger' : 'accent'}>
            {complete ? '真实图像集中在有结构的高概率区域。' : bandCopy[band].label}
          </Typography>
          <Typography variant="bodySmall" tone="muted">
            {complete
              ? '这张概率地图称为真实数据分布 p_data(x)；生成模型要学习它，并从高概率区域中取出样本。'
              : bandCopy[band].description}
          </Typography>
        </div>
        <div className="vg-distribution-page__progress" aria-label="探索进度">
          <Typography as="span" variant="bodySmall" tone={visited.high ? 'success' : 'muted'} className={visited.high ? 'is-visited' : ''}>
            {visited.high ? '✓' : '○'} 高概率区域
          </Typography>
          <Typography as="span" variant="bodySmall" tone={visited.low ? 'success' : 'muted'} className={visited.low ? 'is-visited' : ''}>
            {visited.low ? '✓' : '○'} 低概率区域
          </Typography>
        </div>
      </footer>
    </ContentBlock>
  );
}
