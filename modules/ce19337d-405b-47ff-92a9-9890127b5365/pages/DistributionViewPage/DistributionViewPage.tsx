import moduleAssetOutline from '../../outlines.json';
import { moduleAssetUrl } from "@shuku/course-runtime/react/assets";
import {
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { ContentBlock, Typography } from "@shuku/course-style/react";
import './DistributionViewPage.css';

const faceOne = moduleAssetUrl("images/distribution-modeling/face-1.webp");
const faceTwo = moduleAssetUrl("images/distribution-modeling/face-2.webp");
const faceThree = moduleAssetUrl("images/distribution-modeling/face-3.webp");
const faceFour = moduleAssetUrl("images/distribution-modeling/face-4.webp");
const faceFive = moduleAssetUrl("images/distribution-modeling/face-5.webp");
const faceSix = moduleAssetUrl("images/distribution-modeling/face-6.webp");
const anomalyThreeEyes = moduleAssetUrl("images/distribution-modeling/anomaly-three-eyes.webp");
const anomalyRandomFeatures = moduleAssetUrl("images/distribution-modeling/anomaly-random-features.webp");
const anomalyFaceCar = moduleAssetUrl("images/distribution-modeling/anomaly-face-car.webp");

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
    <ContentBlock shuku-edit-id="e-1fd24020-27ce-4a69-830c-6a4b21270026"
      headingLevel={1}
      className="vg-shared-page vg-distribution-page"
      title="什么样的图像，更可能出现在真实世界中？"
      subtitle="拖动候选图像点 x，观察它在当前人脸数据分布中的可能性如何变化。"
    >
      <div shuku-edit-id="e-00a25e17-beef-4700-85f3-9d8cc5d2d984"
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
        <div shuku-edit-id="e-e43c98c4-3daa-42d2-b6a9-bf8f1173569a" className="vg-distribution-page__stage-head">
          <Typography shuku-edit-id="e-50316a4b-96e7-46d0-a63e-7b58087e90ba" as="span" variant="bodySmall" tone="muted">高维图像空间的二维示意</Typography>
          <div shuku-edit-id="e-2b396dda-0036-46cc-a9c9-8664dee02e07" className="vg-distribution-page__legend" aria-label="概率区域图例">
            <Typography shuku-edit-id="e-5bc5870c-af3f-4b93-8bd7-748c50a8e402" as="span" variant="bodySmall" tone="accent">高概率区域</Typography>
            <Typography shuku-edit-id="e-516e86ba-7cf6-443c-b58b-9398085508ca" as="span" variant="bodySmall" tone="danger">低概率区域</Typography>
          </div>
        </div>

        <div shuku-edit-id="e-dc2d3913-744f-4a41-9e82-32f517804f47" className="vg-distribution-page__density" aria-hidden="true">
          <span shuku-edit-id="e-da68f6af-ac58-4dfb-bbbc-6d8638c91179" className="vg-distribution-page__contour vg-distribution-page__contour--outer" />
          <span shuku-edit-id="e-0aae94d5-39ee-4c79-ad15-34524ea39a30" className="vg-distribution-page__contour vg-distribution-page__contour--middle" />
          <span shuku-edit-id="e-b7138b62-9a52-4376-8624-eddf4e36a52d" className="vg-distribution-page__contour vg-distribution-page__contour--inner" />
        </div>
        <Typography shuku-edit-id="e-a064b702-9b8b-40f5-aaa3-50548f9f6b88" className="vg-distribution-page__density-label" variant="bodySmall" tone="accent">
          真实人脸聚集区
        </Typography>
        <Typography shuku-edit-id="e-23201396-2764-4010-9927-ca55204e2501" className="vg-distribution-page__rare-label" variant="bodySmall" tone="danger">
          真实数据中很少出现
        </Typography>

        {realSamples.map((sample) => (
          <figure shuku-edit-id="e-0b20a62c-305c-4800-bd29-4eab6c1eaaeb"
            className="vg-distribution-page__sample vg-distribution-page__sample--real"
            key={sample.src}
            style={{ '--sample-x': `${sample.x}%`, '--sample-y': `${sample.y}%` } as CSSProperties}
          >
            <img shuku-edit-id="e-cc042a6b-9632-4f79-ab04-fdd0de5bcd4b" src={sample.src} alt={sample.label} draggable={false} />
          </figure>
        ))}

        {lowProbabilitySamples.map((sample) => (
          <figure shuku-edit-id="e-e6a534dc-676e-4f4f-ab75-33bfd0ef92af"
            className="vg-distribution-page__sample vg-distribution-page__sample--rare"
            key={sample.src}
            style={{ '--sample-x': `${sample.x}%`, '--sample-y': `${sample.y}%` } as CSSProperties}
          >
            <img shuku-edit-id="e-dd9b8fa0-ea49-4e3c-addc-b09cb320bba3" src={sample.src} alt={sample.label} draggable={false} />
          </figure>
        ))}

        <div shuku-edit-id="e-5c751d88-51b4-42eb-8065-bfd87d16eb8d"
          className={`vg-distribution-page__candidate is-${band}`}
          style={{
            '--candidate-x': `${point.x}%`,
            '--candidate-y': `${point.y}%`,
            '--candidate-strength': probability.toFixed(3),
          } as CSSProperties}
          aria-live="polite"
        >
          <span shuku-edit-id="e-4c285eab-8245-458b-9fdc-de95167641e8" className="vg-distribution-page__candidate-ring" aria-hidden="true" />
          <Typography shuku-edit-id="e-a0d0dc72-c75c-4250-9a4a-ca2c4247ee0a" as="strong" variant="body" tone="inherit" className="vg-distribution-page__candidate-symbol">x</Typography>
          <div shuku-edit-id="e-f1914d7c-429b-4c78-a55e-5802ee2214d1" className="vg-distribution-page__candidate-copy">
            <Typography shuku-edit-id="e-7275de52-1bb7-41c6-b4be-042fe76ec51d" as="strong" variant="bodySmall" tone="inherit">{bandCopy[band].label}</Typography>
            <Typography shuku-edit-id="e-e6a10f1a-5679-470a-ac19-0e9054d1d00c" as="span" variant="bodySmall" tone="inherit">p_data(x) ≈ {probability.toFixed(2)}</Typography>
          </div>
        </div>
      </div>

      <footer shuku-edit-id="e-2e478c1f-4433-43d2-901f-a9da78063c64" className={`vg-distribution-page__insight${complete ? ' is-complete' : ''}`} aria-live="polite">
        <div shuku-edit-id="e-ff670513-4225-41cb-9d1c-fb42b33f2cab" className="vg-distribution-page__insight-copy">
          <Typography shuku-edit-id="e-56b76eb8-247a-4ec6-be38-456e8b3abf7e" as="strong" variant="h3" tone={complete ? 'success' : band === 'low' ? 'danger' : 'accent'}>
            {complete ? '真实图像集中在有结构的高概率区域。' : bandCopy[band].label}
          </Typography>
          <Typography shuku-edit-id="e-970e5244-f63c-46c4-a5db-e378ec796699" variant="bodySmall" tone="muted">
            {complete
              ? '这张概率地图称为真实数据分布 p_data(x)；生成模型要学习它，并从高概率区域中取出样本。'
              : bandCopy[band].description}
          </Typography>
        </div>
        <div shuku-edit-id="e-61bef05d-81d3-4584-9bc7-d6a4683ae488" className="vg-distribution-page__progress" aria-label="探索进度">
          <Typography shuku-edit-id="e-6b0d71f1-d02a-430e-83a8-814693ea1f00" as="span" variant="bodySmall" tone={visited.high ? 'success' : 'muted'} className={visited.high ? 'is-visited' : ''}>
            {visited.high ? '✓' : '○'} 高概率区域
          </Typography>
          <Typography shuku-edit-id="e-3c791331-332f-4b40-8b43-7b33d740434c" as="span" variant="bodySmall" tone={visited.low ? 'success' : 'muted'} className={visited.low ? 'is-visited' : ''}>
            {visited.low ? '✓' : '○'} 低概率区域
          </Typography>
        </div>
      </footer>
    </ContentBlock>
  );
}
