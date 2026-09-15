import { useCallback, useRef, useState, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent } from 'react';
import './BiasThresholdTheoryPage.css';
import { ContentBlock, Question, Typography, type QuestionCheckResult } from '../../../shared/react';
import { formatScore, useLesson, weightedSum } from '../../LessonContext';

const RANGE_MIN = 0;
const RANGE_MAX = 3;
/** 0–3 的中点，也是这一类分类的正确答案。 */
const RANGE_MIDPOINT = 1.5;
/** 分界点吸附的刻度。 */
const BOUNDARY_STEP = 0.05;

interface AxisMarker {
  value: number;
  label: string;
  tone: 'green' | 'red' | 'neutral';
}

interface ClassificationAxisProps {
  min: number;
  max: number;
  boundary: number;
  ticks: number[];
  leftLabel: string;
  rightLabel: string;
  markers?: AxisMarker[];
  boundaryLabel?: string;
  className?: string;
  /** 反侧区域的文字色：默认用危险色，用 accent 表示“只是另一类，不是错误”。 */
  negativeTone?: 'danger' | 'accent';
  /** 传入后分界线可拖动，取值范围为 [min, max]。 */
  onBoundaryChange?: (value: number) => void;
  onBoundaryDragStart?: () => void;
  showBoundary?: boolean;
  /** 首次拖动前的轻提示。 */
  pulsing?: boolean;
  /** 分界线不可用时的占位说明。 */
  note?: string;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function snapBoundary(value: number, min: number, max: number) {
  return Number(clamp(Math.round(value / BOUNDARY_STEP) * BOUNDARY_STEP, min, max).toFixed(2));
}

function axisPosition(value: number, min: number, max: number) {
  return Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
}

function ClassificationAxis({
  min,
  max,
  boundary,
  ticks,
  leftLabel,
  rightLabel,
  markers = [],
  boundaryLabel,
  className = '',
  negativeTone = 'danger',
  onBoundaryChange,
  onBoundaryDragStart,
  showBoundary = true,
  pulsing = false,
  note,
}: ClassificationAxisProps) {
  const axisRef = useRef<HTMLDivElement | null>(null);
  const holdingRef = useRef(false);
  const [holding, setHolding] = useState(false);
  const boundaryPosition = axisPosition(boundary, min, max);
  const draggable = Boolean(onBoundaryChange);
  const style = { '--ng-boundary-position': `${boundaryPosition}%` } as CSSProperties;

  const valueFromPointer = useCallback((clientX: number) => {
    const rect = axisRef.current?.getBoundingClientRect();
    if (!rect || !rect.width) return boundary;
    return snapBoundary(min + clamp((clientX - rect.left) / rect.width, 0, 1) * (max - min), min, max);
  }, [boundary, max, min]);

  const commit = useCallback((value: number) => {
    onBoundaryDragStart?.();
    onBoundaryChange?.(value);
  }, [onBoundaryChange, onBoundaryDragStart]);

  const startDrag = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!draggable) return;
    event.preventDefault();
    holdingRef.current = true;
    setHolding(true);
    event.currentTarget.setPointerCapture(event.pointerId);
    commit(valueFromPointer(event.clientX));
  };

  const moveDrag = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!draggable || !holdingRef.current) return;
    event.preventDefault();
    commit(valueFromPointer(event.clientX));
  };

  const endDrag = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!holdingRef.current) return;
    holdingRef.current = false;
    setHolding(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (!draggable) return;
    const deltas: Record<string, number> = { ArrowLeft: -BOUNDARY_STEP, ArrowDown: -BOUNDARY_STEP, ArrowRight: BOUNDARY_STEP, ArrowUp: BOUNDARY_STEP };
    const delta = deltas[event.key];
    if (delta !== undefined) {
      // 方向键在 PPT 里用于翻页、在 Blog 里用于推进课程，这里必须停止继续冒泡。
      event.preventDefault();
      event.stopPropagation();
      commit(snapBoundary(boundary + delta, min, max));
      return;
    }
    if (event.key !== 'Home' && event.key !== 'End') return;
    event.preventDefault();
    event.stopPropagation();
    commit(event.key === 'Home' ? min : max);
  };

  const boundaryClassName = `ng-bias-axis__boundary${boundaryPosition <= 2 ? ' is-at-start' : boundaryPosition >= 98 ? ' is-at-end' : ''}${draggable ? ' is-draggable' : ''}${holding ? ' is-holding' : ''}${draggable && pulsing ? ' is-pulsing' : ''}`;
  // 区间太窄时藏起区域标签，避免文字被裁成半截。
  const zoneLabelFits = (share: number) => share >= 18;
  const boundaryBody = (
    <>
      {boundaryLabel && <Typography as="span" variant="bodySmall" tone="warning" wrap="nowrap">{boundaryLabel}</Typography>}
      <i />
      {draggable && <span className="ng-bias-axis__grip" aria-hidden="true" />}
    </>
  );

  return (
    <div className={`ng-bias-axis ${className}`.trim()} style={style} ref={axisRef}>
      <div className="ng-bias-axis__zones" aria-hidden="true">
        <span className="ng-bias-axis__zone ng-bias-axis__zone--negative">
          {leftLabel && zoneLabelFits(boundaryPosition) && <Typography as="span" variant="bodySmall" tone={negativeTone}>{leftLabel}</Typography>}
        </span>
        <span className="ng-bias-axis__zone ng-bias-axis__zone--positive">
          {rightLabel && zoneLabelFits(100 - boundaryPosition) && <Typography as="span" variant="bodySmall" tone="success">{rightLabel}</Typography>}
        </span>
      </div>

      <div className="ng-bias-axis__line" aria-hidden="true" />
      {note && <Typography as="span" variant="bodySmall" tone="muted" className="ng-bias-axis__note">{note}</Typography>}
      {showBoundary && (draggable ? (
        <button
          type="button"
          className={boundaryClassName}
          role="slider"
          aria-label="分类分界线"
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={boundary}
          aria-valuetext={`分界点 ${formatScore(boundary)}`}
          data-ng-bias-handle
          onPointerDown={startDrag}
          onPointerMove={moveDrag}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onKeyDown={handleKeyDown}
        >
          {boundaryBody}
        </button>
      ) : (
        <div className={boundaryClassName} aria-hidden="true">{boundaryBody}</div>
      ))}

      <div className="ng-bias-axis__ticks" aria-hidden="true">
        {ticks.map((tick) => (
          <Typography as="span" variant="bodySmall" tone="main" key={tick} style={{ left: `${axisPosition(tick, min, max)}%` }}>
            {tick}
          </Typography>
        ))}
      </div>

      {markers.map((marker) => {
        const markerPosition = axisPosition(marker.value, min, max);
        return (
          <div className={`ng-bias-axis__marker ng-bias-axis__marker--${marker.tone}`} style={{ left: `${markerPosition}%` }} key={marker.label}>
            <Typography as="span" variant="bodySmall" tone={marker.tone === 'green' ? 'success' : marker.tone === 'red' ? 'danger' : 'main'} wrap="nowrap">
              {marker.label}
            </Typography>
            <i aria-hidden="true" />
          </div>
        );
      })}
    </div>
  );
}

function NaturalBoundaryFigure() {
  return (
    <div className="ng-bias-natural-figure">
      <div className="ng-bias-natural-figure__labels">
        <Typography as="span" variant="bodySmall" tone="danger">一类</Typography>
        <Typography as="span" variant="bodySmall" tone="success">另一类</Typography>
      </div>
      <ClassificationAxis min={-1} max={1} boundary={0} ticks={[0]} leftLabel="负数" rightLabel="非负数" boundaryLabel="天然分界点" />
    </div>
  );
}

export function BiasNaturalBoundaryPage() {
  const { scenario, state } = useLesson();
  const values = scenario.factors.map((factor, index) => state.values[index] ?? factor.suggestedValue);
  const outputY = weightedSum(scenario, values);

  return (
    <ContentBlock
      headingLevel={1}
      className="ng-bias-page ng-bias-boundary-page"
      title="矩阵计算之后，如何形成分类判断？"
      subtitle="矩阵计算最终得到一个数值。神经元需要根据这个数值，将输入划分为两类。"
    >
      <div className="ng-bias-boundary-story">
        <section className="ng-bias-concept ng-bias-concept--natural">
          <header className="ng-bias-concept__head">
            <Typography as="span" variant="h3" tone="accent" className="ng-bias-concept__number">1</Typography>
            <div>
              <Typography as="h2" variant="h3" tone="main">正负号可以承担分类</Typography>
              <Typography variant="bodySmall" tone="muted">0 左侧为负数，右侧为非负数</Typography>
            </div>
          </header>
          <NaturalBoundaryFigure />
          <div className="ng-bias-concept__takeaway">
            <Typography variant="body" tone="accent">当结果分布在 0 的两侧时，符号可以直接区分两类。</Typography>
          </div>
        </section>

        <div className="ng-bias-boundary-story__turn" aria-hidden="true">
          <span />
          <Typography as="span" variant="bodySmall" tone="warning">问题在于</Typography>
          <span />
        </div>

        <section className="ng-bias-concept ng-bias-concept--problem">
          <header className="ng-bias-concept__head">
            <Typography as="span" variant="h3" tone="warning" className="ng-bias-concept__number">2</Typography>
            <div>
              <Typography as="h2" variant="h3" tone="main">现在，所有结果都在 0 的右侧</Typography>
              <Typography variant="bodySmall" tone="muted">当前输入与权重均为 0–1，加权和 y 的取值范围为 0–3</Typography>
            </div>
          </header>
          <div className="ng-bias-range-figure">
            <Typography as="span" variant="bodySmall" tone="warning" className="ng-bias-range-figure__zero-note">0 的左侧没有结果</Typography>
            <ClassificationAxis
              min={-0.75}
              max={3}
              boundary={0}
              ticks={[0, 1, 2, 3]}
              leftLabel="空"
              rightLabel="y 的全部可能范围：0–3"
              boundaryLabel="原来的分界点"
              markers={[{ value: outputY, label: `当前 y = ${formatScore(outputY)}`, tone: 'green' }]}
            />
          </div>
          <div className="ng-bias-concept__takeaway ng-bias-concept__takeaway--problem">
            <Typography variant="body" tone="main">
              没有 bias 时，结果不会跨过 0，因而无法形成有效分类。
            </Typography>
          </div>
        </section>
      </div>
    </ContentBlock>
  );
}

export function BiasThresholdTheoryPage({ onComplete }: { onComplete?: () => void }) {
  const { scenario, state } = useLesson();
  const values = scenario.factors.map((factor, index) => state.values[index] ?? factor.suggestedValue);
  const outputY = weightedSum(scenario, values);
  const [answeredCorrectly, setAnsweredCorrectly] = useState(false);
  const [boundary, setBoundary] = useState(RANGE_MIDPOINT);
  const [boundaryDragged, setBoundaryDragged] = useState(false);
  const completedRef = useRef(false);
  const atMidpoint = Math.abs(boundary - RANGE_MIDPOINT) < 0.01;
  const aboveBoundary = outputY >= boundary;
  const tendency = aboveBoundary ? scenario.positiveLabel : scenario.negativeLabel;
  const negativeZone = `输出 0 · ${scenario.negativeLabel}`;
  const positiveZone = `输出 1 · ${scenario.positiveLabel}`;

  const handleCheck = (result: QuestionCheckResult) => {
    if (!result.ok) return;
    setAnsweredCorrectly(true);
    if (!completedRef.current) {
      completedRef.current = true;
      onComplete?.();
    }
  };

  return (
    <ContentBlock
      headingLevel={1}
      className="ng-bias-page ng-bias-choice-page"
      title="偏置如何调整分类阈值？"
      subtitle="当加权和的实际范围不跨过 0 时，需要先确定合适的分界点，再用偏置将它移动到 0。"
    >
      <div className="ng-bias-choice-layout">
        <section className="ng-bias-question-pane">
          <Question
            className="ng-bias-midpoint-question"
            type="choice"
            typeLabel="先预测"
            textVariant="body"
            title={`加权和范围为 ${RANGE_MIN}–${RANGE_MAX}，分类边界应设置在哪里？`}
            answer="1.50"
            persistenceKey="neuron-guide:bias-midpoint-v1"
            onCheck={handleCheck}
            feedback={{
              initial: '若希望两类区间的长度相同，分界点应落在范围中点。',
              correct: '正好在 0–3 的中点，两侧区间各占 50%。',
              wrong: '再看一次 0–3：哪一个位置能把整段平均分成两半？',
            }}
            options={[
              { key: 'A', value: '0', label: '0', wrongFeedback: '0 仍在范围起点，左侧没有任何可能结果。' },
              { key: 'B', value: '1.00', label: '1.00', wrongFeedback: '1.00 会把范围分成 1 和 2 两段，并不相等。' },
              { key: 'C', value: '1.50', label: '1.50' },
              { key: 'D', value: '3.00', label: '3.00', wrongFeedback: '3.00 在范围终点，右侧没有任何可能结果。' },
            ]}
          />
        </section>

        <section className={`ng-bias-answer-pane${answeredCorrectly ? ' is-revealed' : ''}`} aria-live="polite">
          <header className="ng-bias-answer-pane__head">
            <div className="ng-bias-answer-pane__rule">
              <Typography as="span" variant="bodySmall" tone="success">分类规则</Typography>
              <Typography as="h2" variant="h3" tone="main">加权和越过分界点，判为「输出 1」</Typography>
            </div>
          </header>

          <div className="ng-bias-answer-pane__visual">
            <div className="ng-bias-axis-head">
              <Typography as="span" variant="bodySmall" tone="muted">加权和 y 的全部可能范围：0–3</Typography>
              <Typography as="span" variant="bodySmall" tone={answeredCorrectly ? (atMidpoint ? 'success' : 'warning') : 'muted'}>
                {answeredCorrectly
                  ? atMidpoint
                    ? '分界点已在中点：两侧正好各占一半'
                    : `把分界线拖到 0–3 的中点 ${formatScore(RANGE_MIDPOINT)}`
                  : '选对答案后，这里的分界线就可以拖动'}
              </Typography>
            </div>
            <ClassificationAxis
              min={RANGE_MIN}
              max={RANGE_MAX}
              boundary={answeredCorrectly ? boundary : RANGE_MIN}
              ticks={[0, 1, 2, 3]}
              negativeTone="accent"
              leftLabel={answeredCorrectly ? negativeZone : ''}
              rightLabel={answeredCorrectly ? positiveZone : ''}
              boundaryLabel={answeredCorrectly ? `分界点 ${formatScore(boundary)}` : undefined}
              markers={answeredCorrectly ? [{
                value: outputY,
                label: `y = ${formatScore(outputY)}`,
                tone: 'neutral',
              }] : []}
              onBoundaryChange={answeredCorrectly ? setBoundary : undefined}
              onBoundaryDragStart={() => setBoundaryDragged(true)}
              showBoundary={answeredCorrectly}
              pulsing={!boundaryDragged}
              note={answeredCorrectly ? undefined : '分界线待解锁'}
              className={`ng-bias-axis--answer${answeredCorrectly ? '' : ' ng-bias-axis--locked'}`}
            />
          </div>

          <div className="ng-bias-answer-pane__result">
            {answeredCorrectly ? (
              <div className="ng-bias-answer-pane__decision">
                <Typography as="strong" variant="h3" tone={aboveBoundary ? 'success' : 'accent'}>
                  {`y = ${formatScore(outputY)} ${aboveBoundary ? '≥' : '<'} ${formatScore(boundary)}`}
                </Typography>
                <Typography as="strong" variant="body" tone="main">{`倾向“${tendency}”`}</Typography>
              </div>
            ) : (
              <div className="ng-bias-answer-pane__waiting">
                <span aria-hidden="true">?</span>
                <Typography variant="body" tone="muted">选择正确答案后，这里会显示可拖动的分界线。</Typography>
              </div>
            )}
          </div>
        </section>
      </div>
    </ContentBlock>
  );
}
