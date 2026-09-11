import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { Button, LessonStage, NoticeStrip, RangeControl, Typography } from '../../shared/react';
import './SlidePage.css';

interface Point {
  x: number;
  y: number;
}

const VIEW_WIDTH = 1000;
const VIEW_HEIGHT = 430;
const SAMPLE_COUNT = 101;
const DEFAULT_NEURON_COUNT = 16;
const MAX_NEURON_COUNT = SAMPLE_COUNT - 2;
const TRAINING_DURATION = 720;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function toCanvas(point: Point) {
  return {
    x: ((point.x + 1) / 2) * VIEW_WIDTH,
    y: ((1 - point.y) / 2) * VIEW_HEIGHT,
  };
}

function pathFor(points: readonly Point[]) {
  return points.map((point, index) => {
    const canvas = toCanvas(point);
    return `${index === 0 ? 'M' : 'L'} ${canvas.x.toFixed(2)} ${canvas.y.toFixed(2)}`;
  }).join(' ');
}

function resampleDrawing(points: readonly Point[]): Point[] {
  if (points.length < 2) return [];
  const bins = Array.from({ length: SAMPLE_COUNT }, () => ({ sum: 0, count: 0 }));
  points.forEach((point) => {
    const index = Math.round(((clamp(point.x, -1, 1) + 1) / 2) * (SAMPLE_COUNT - 1));
    bins[index].sum += clamp(point.y, -1, 1);
    bins[index].count += 1;
  });
  const known = bins
    .map((bin, index) => bin.count ? { index, y: bin.sum / bin.count } : null)
    .filter((entry): entry is { index: number; y: number } => entry !== null);
  if (known.length < 2) return [];

  return bins.map((_, index) => {
    let left = known[0];
    let right = known[known.length - 1];
    for (let cursor = 0; cursor < known.length; cursor += 1) {
      if (known[cursor].index <= index) left = known[cursor];
      if (known[cursor].index >= index) {
        right = known[cursor];
        break;
      }
    }
    const span = right.index - left.index;
    const ratio = span === 0 ? 0 : (index - left.index) / span;
    return {
      x: -1 + (2 * index) / (SAMPLE_COUNT - 1),
      y: left.y + (right.y - left.y) * ratio,
    };
  });
}

function knots(neuronCount: number) {
  return Array.from(
    { length: neuronCount },
    (_, index) => -1 + (2 * (index + 1)) / (neuronCount + 1),
  );
}

function features(x: number, responsePoints: readonly number[]) {
  return [1, x, ...responsePoints.map((point) => Math.max(0, x - point))];
}

function predict(coefficients: readonly number[], x: number, responsePoints: readonly number[]) {
  const row = features(x, responsePoints);
  return row.reduce((sum, value, index) => sum + value * (coefficients[index] ?? 0), 0);
}

function lossFor(coefficients: readonly number[], target: readonly Point[], responsePoints: readonly number[]) {
  return target.reduce((sum, point) => {
    const error = predict(coefficients, point.x, responsePoints) - point.y;
    return sum + error * error;
  }, 0) / Math.max(target.length, 1);
}

function interpolateTarget(target: readonly Point[], x: number) {
  if (!target.length) return 0;
  const position = ((clamp(x, -1, 1) + 1) / 2) * (target.length - 1);
  const leftIndex = Math.floor(position);
  const rightIndex = Math.min(target.length - 1, Math.ceil(position));
  const ratio = position - leftIndex;
  return target[leftIndex].y + (target[rightIndex].y - target[leftIndex].y) * ratio;
}

/**
 * A one-hidden-layer ReLU network is a continuous piecewise-linear function:
 *   f(x) = c + sx + sum(a_i * ReLU(x - k_i)).
 * Once the response points k_i are chosen, the weights can be recovered directly
 * from the changes in slope. This is stable, fast, and exact at every chosen knot.
 */
function solveReluSpline(target: readonly Point[], responsePoints: readonly number[]) {
  const nodes = [
    { x: -1, y: interpolateTarget(target, -1) },
    ...responsePoints.map((x) => ({ x, y: interpolateTarget(target, x) })),
    { x: 1, y: interpolateTarget(target, 1) },
  ];
  const slopes = nodes.slice(0, -1).map((node, index) => {
    const next = nodes[index + 1];
    return (next.y - node.y) / (next.x - node.x);
  });
  const initialSlope = slopes[0] ?? 0;
  const bias = nodes[0].y - initialSlope * nodes[0].x;
  const hingeWeights = responsePoints.map((_, index) => slopes[index + 1] - slopes[index]);
  return [bias, initialSlope, ...hingeWeights];
}

export interface ReluApproximationLabPageProps {
  onComplete: () => void;
}

export function ReluApproximationLabPage({ onComplete }: ReluApproximationLabPageProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const drawingRef = useRef(false);
  const rawRef = useRef<Point[]>([]);
  const animationRef = useRef<number | null>(null);
  const [raw, setRaw] = useState<Point[]>([]);
  const [target, setTarget] = useState<Point[]>([]);
  const [coefficients, setCoefficients] = useState<number[]>([]);
  const [epoch, setEpoch] = useState(0);
  const [loss, setLoss] = useState<number | null>(null);
  const [training, setTraining] = useState(false);
  const [neuronCount, setNeuronCount] = useState(DEFAULT_NEURON_COUNT);
  const responsePoints = useMemo(() => knots(neuronCount), [neuronCount]);

  const pointFromEvent = useCallback((event: ReactPointerEvent<SVGSVGElement>): Point => {
    const svg = event.currentTarget;
    const screenMatrix = svg.getScreenCTM();
    if (screenMatrix) {
      const local = new DOMPoint(event.clientX, event.clientY).matrixTransform(screenMatrix.inverse());
      return {
        x: clamp((local.x / VIEW_WIDTH) * 2 - 1, -1, 1),
        y: clamp(1 - (local.y / VIEW_HEIGHT) * 2, -1, 1),
      };
    }
    const bounds = svg.getBoundingClientRect();
    return {
      x: clamp(((event.clientX - bounds.left) / bounds.width) * 2 - 1, -1, 1),
      y: clamp(1 - ((event.clientY - bounds.top) / bounds.height) * 2, -1, 1),
    };
  }, []);

  const cancelTraining = useCallback(() => {
    if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);
    animationRef.current = null;
    setTraining(false);
  }, []);

  useEffect(() => () => {
    if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);
  }, []);

  const startDrawing = (event: ReactPointerEvent<SVGSVGElement>) => {
    cancelTraining();
    event.currentTarget.setPointerCapture(event.pointerId);
    const point = pointFromEvent(event);
    drawingRef.current = true;
    rawRef.current = [point];
    setRaw([point]);
    setTarget([]);
    setCoefficients([]);
    setEpoch(0);
    setLoss(null);
  };

  const continueDrawing = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (!drawingRef.current) return;
    const point = pointFromEvent(event);
    const previous = rawRef.current[rawRef.current.length - 1];
    if (previous && Math.hypot(point.x - previous.x, point.y - previous.y) < 0.008) return;
    rawRef.current = [...rawRef.current, point];
    setRaw(rawRef.current);
  };

  const finishDrawing = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    const sampled = resampleDrawing(rawRef.current);
    setTarget(sampled);
    if (sampled.length) setRaw([]);
  };

  const clear = () => {
    cancelTraining();
    rawRef.current = [];
    setRaw([]);
    setTarget([]);
    setCoefficients([]);
    setEpoch(0);
    setLoss(null);
  };

  const train = () => {
    if (!target.length) return;
    cancelTraining();
    setTraining(true);
    const solved = solveReluSpline(target, responsePoints);
    const starting = coefficients.length === solved.length
      ? coefficients
      : Array.from({ length: solved.length }, () => 0);
    const startedAt = performance.now();

    const runFrame = (now: number) => {
      const progress = clamp((now - startedAt) / TRAINING_DURATION, 0, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = solved.map((value, index) => starting[index] + (value - starting[index]) * eased);
      const currentLoss = lossFor(current, target, responsePoints);
      setCoefficients([...current]);
      setEpoch(Math.round(progress * 100));
      setLoss(currentLoss);
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(runFrame);
      } else {
        animationRef.current = null;
        setTraining(false);
        onComplete();
      }
    };
    animationRef.current = requestAnimationFrame(runFrame);
  };

  const changeNeuronCount = (nextCount: number) => {
    cancelTraining();
    setNeuronCount(nextCount);
    setCoefficients([]);
    setEpoch(0);
    setLoss(null);
  };

  const prediction = useMemo(
    () => coefficients.length
      ? Array.from({ length: SAMPLE_COUNT }, (_, index) => {
        const x = -1 + (2 * index) / (SAMPLE_COUNT - 1);
        return { x, y: predict(coefficients, x, responsePoints) };
      })
      : [],
    [coefficients, responsePoints],
  );
  const targetPath = pathFor(target.length ? target : raw);
  const predictionPath = pathFor(prediction);

  return (
    <LessonStage
      className="ng-relu-approximation-lab"
      title="足够多带有 ReLU 的神经元，就能逼近任意曲线"
      description="在画布上画出一条目标曲线，再让浏览器直接训练一个由 ReLU 神经元组成的小网络。"
      descriptionVariant="bodySmall"
      actions={(
        <div className="af-react-actions">
          <Button variant="primary" disabled={!target.length || training} onClick={train}>{training ? '训练中…' : '训练网络'}</Button>
          <Button disabled={!target.length && !raw.length} onClick={clear}>重新绘制</Button>
        </div>
      )}
    >
      <section className="ng-relu-drawing-panel">
        <header className="ng-relu-drawing-panel__head">
          <div>
            <Typography as="h3" variant="subtitle" tone="main">画一条你想让网络学习的曲线</Typography>
            <Typography variant="bodySmall" tone="muted">按住并拖动即可绘制；再次落笔会替换当前目标。</Typography>
          </div>
          <div className="ng-relu-drawing-panel__legend" aria-label="图例">
            <Typography as="span" variant="bodySmall" tone="accent">目标曲线</Typography>
            <Typography as="span" variant="bodySmall" tone="warning">模型输出</Typography>
          </div>
        </header>
        <div className="ng-relu-drawing-panel__controls">
          <RangeControl
            label="ReLU 神经元数量"
            min={4}
            max={MAX_NEURON_COUNT}
            step={1}
            value={neuronCount}
            suffix=" 个"
            onChange={(event) => changeNeuronCount(Number(event.currentTarget.value))}
          />
          <Typography variant="bodySmall" tone="muted">神经元越多，可用来贴近曲线的折点越密。</Typography>
        </div>
        <div className="ng-relu-drawing-board">
          {!target.length && !raw.length && (
            <Typography className="ng-relu-drawing-board__prompt" variant="subtitle" tone="muted">在画布上拖动，画出任意曲线</Typography>
          )}
          <svg
            ref={svgRef}
            className="ng-relu-drawing-board__svg"
            viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
            preserveAspectRatio="none"
            role="img"
            aria-label="可自由绘制目标曲线并显示 ReLU 网络拟合结果的画布"
            onPointerDown={startDrawing}
            onPointerMove={continueDrawing}
            onPointerUp={finishDrawing}
            onPointerCancel={finishDrawing}
          >
            <g className="ng-relu-drawing-board__grid" aria-hidden="true">
              {[.2, .4, .6, .8].map((ratio) => <line key={`v-${ratio}`} x1={VIEW_WIDTH * ratio} x2={VIEW_WIDTH * ratio} y1="0" y2={VIEW_HEIGHT} />)}
              {[.2, .4, .6, .8].map((ratio) => <line key={`h-${ratio}`} x1="0" x2={VIEW_WIDTH} y1={VIEW_HEIGHT * ratio} y2={VIEW_HEIGHT * ratio} />)}
              <line className="is-axis" x1={VIEW_WIDTH / 2} x2={VIEW_WIDTH / 2} y1="0" y2={VIEW_HEIGHT} />
              <line className="is-axis" x1="0" x2={VIEW_WIDTH} y1={VIEW_HEIGHT / 2} y2={VIEW_HEIGHT / 2} />
            </g>
            {targetPath && <path className="ng-relu-drawing-board__target" d={targetPath} />}
            {predictionPath && <path className="ng-relu-drawing-board__prediction" d={predictionPath} />}
          </svg>
        </div>
      </section>
      <NoticeStrip tone={loss !== null && loss < 0.012 ? 'green' : 'blue'}>
        <Typography variant="bodySmall" tone="inherit">
          {!target.length
            ? '先画出目标曲线；训练完全在浏览器中完成，不会上传绘制内容。'
            : loss === null
              ? `目标已经记录。点击“训练网络”，让 ${neuronCount} 个 ReLU 神经元开始拟合。`
              : `${neuronCount} 个 ReLU 神经元 · 拟合进度 ${epoch}% · 当前误差 ${loss.toFixed(4)}`}
        </Typography>
      </NoticeStrip>
    </LessonStage>
  );
}



