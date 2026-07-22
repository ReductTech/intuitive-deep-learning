import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { Callout } from '../../shared/react/feedback/Callout';
import { ContentBlock } from '../../shared/react/layout/ContentBlock';
import { NoticeStrip } from '../../shared/react/feedback/NoticeStrip';
import { ValueTile } from '../../shared/react/learning/ValueTile';
import { emitTelemetry, getTelemetryState } from '../../shared/react/telemetry';

export interface LessonBlockProps {
  onComplete: () => void;
}

const target = 7;
const axisStart = 34;
const axisEnd = 686;
const axisWidth = axisEnd - axisStart;
const predictionStateKey = 'control:number-line-prediction';

function clampPrediction(value: number) {
  return Math.min(10, Math.max(0, Math.round(value * 10) / 10));
}

export function NumberLineBlock({ onComplete }: LessonBlockProps) {
  const [prediction, setPrediction] = useState(1.6);
  const [isDragging, setIsDragging] = useState(false);
  const [hintActive, setHintActive] = useState(true);
  const svgRef = useRef<SVGSVGElement>(null);
  const predictionRef = useRef(prediction);
  const solved = Math.abs(prediction - target) < 0.05;
  const l1 = Math.abs(target - prediction);
  const l2 = l1 ** 2;

  useEffect(() => {
    if (solved) onComplete();
  }, [onComplete, solved]);

  useEffect(() => { predictionRef.current = prediction; }, [prediction]);

  useEffect(() => {
    let active = true;
    void getTelemetryState<{ value?: number }>(predictionStateKey, 'loss-guide-react').then((entry) => {
      const restored = Number(entry?.state?.value);
      if (active && Number.isFinite(restored)) {
        setPrediction(clampPrediction(restored));
        setHintActive(false);
      }
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!isDragging) return undefined;
    const previousCursor = document.body.style.cursor;
    document.body.style.cursor = 'grabbing';
    return () => { document.body.style.cursor = previousCursor; };
  }, [isDragging]);

  const point = axisStart + (prediction / 10) * axisWidth;
  const targetPoint = axisStart + (target / 10) * axisWidth;

  const setPredictionFromPointer = (clientX: number) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const svgX = (clientX - rect.left) * 720 / rect.width;
    const next = clampPrediction((svgX - axisStart) / axisWidth * 10);
    predictionRef.current = next;
    setPrediction(next);
  };
  const beginDrag = (event: PointerEvent<SVGGElement>) => {
    event.preventDefault();
    setHintActive(false);
    svgRef.current?.setPointerCapture(event.pointerId);
    setIsDragging(true);
    setPredictionFromPointer(event.clientX);
  };
  const drag = (event: PointerEvent<SVGSVGElement>) => {
    if (isDragging) setPredictionFromPointer(event.clientX);
  };
  const finishDrag = () => {
    if (!isDragging) return;
    setIsDragging(false);
    emitTelemetry('control_commit', svgRef.current, { state_key: predictionStateKey, state: { value: predictionRef.current }, value: predictionRef.current });
  };
  const adjustByKeyboard = (event: KeyboardEvent<SVGGElement>) => {
    const direction = event.key === 'ArrowLeft' || event.key === 'ArrowDown' ? -1 : event.key === 'ArrowRight' || event.key === 'ArrowUp' ? 1 : 0;
    if (!direction) return;
    event.preventDefault();
    setHintActive(false);
    setPrediction((current) => {
      const next = clampPrediction(current + direction * 0.1);
      emitTelemetry('control_commit', svgRef.current, { state_key: predictionStateKey, state: { value: next }, value: next });
      return next;
    });
  };

  return (
    <ContentBlock className="lg-react-block" title="损失就是距离" subtitle="Loss 衡量真实值和预测值之间差多少。先用一条数轴，把这种差距直接画出来。">
      <Callout tone="orange" label="你的任务" text="拖动绿色预测值，让它与红色真实值重合，把 Loss 缩小到 0。" />
      <div className="lg-react-numberline" aria-label="数轴距离演示">
        <svg ref={svgRef} viewBox="0 0 720 170" role="group" aria-label={`数轴互动：预测值 ${prediction.toFixed(1)}，真实值 ${target}`} onPointerMove={drag} onPointerUp={finishDrag} onPointerCancel={finishDrag} onLostPointerCapture={finishDrag}>
          <line x1={axisStart} y1="96" x2={axisEnd} y2="96" className="lg-react-axis" />
          {Array.from({ length: 11 }, (_, value) => <g key={value}><line x1={axisStart + value * 65.2} y1="88" x2={axisStart + value * 65.2} y2="104" className="lg-react-tick" /><text x={axisStart + value * 65.2} y="128" textAnchor="middle">{value}</text></g>)}
          <line x1={point} y1="61" x2={targetPoint} y2="61" className="lg-react-distance" />
          <circle cx={targetPoint} cy="96" r="12" className="lg-react-target" />
          <g
            className={`lg-react-prediction-control${isDragging ? ' is-dragging' : ''}`}
            role="slider"
            tabIndex={0}
            aria-label="预测值"
            aria-valuemin={0}
            aria-valuemax={10}
            aria-valuenow={prediction}
            aria-valuetext={`预测值 ${prediction.toFixed(1)}`}
            data-telemetry-manual
            onPointerDown={beginDrag}
            onKeyDown={adjustByKeyboard}
          >
            {hintActive && <circle cx={point} cy="96" r="22" className="edu-attention-hint" />}
            <circle cx={point} cy="96" r="12" className="lg-react-prediction" />
          </g>
          <text x={targetPoint} y="42" textAnchor="middle">真实值 7</text>
          <text x={point} y="151" textAnchor="middle">预测值 {prediction.toFixed(1)}</text>
        </svg>
      </div>
      <div className="lg-react-value-grid"><ValueTile tone="orange" label="L1 Loss = |真实值 - 预测值|" value={l1.toFixed(1)} /><ValueTile tone="blue" label="L2 Loss = (真实值 - 预测值)²" value={l2.toFixed(1)} /></div>
      <NoticeStrip tone={solved ? 'green' : 'orange'} lead={solved ? '阶段完成：' : '操作提醒：'}>{solved ? '预测值已贴近真实值，Loss 变成 0。' : '拖动绿色预测值，让它贴近红色真实值。'}</NoticeStrip>
    </ContentBlock>
  );
}
