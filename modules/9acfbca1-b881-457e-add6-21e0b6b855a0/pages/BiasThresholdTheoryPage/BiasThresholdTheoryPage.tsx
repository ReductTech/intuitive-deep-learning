import { useCallback, useRef, useState, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent } from 'react';
import './BiasThresholdTheoryPage.css';
import { ContentBlock, Question, Typography, type QuestionCheckResult } from "@shuku/course-style/react";
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
  const style = { '--ngtw-boundary-position': `${boundaryPosition}%` } as CSSProperties;

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

  const boundaryClassName = `ngtw-bias-axis__boundary${boundaryPosition <= 2 ? ' is-at-start' : boundaryPosition >= 98 ? ' is-at-end' : ''}${draggable ? ' is-draggable' : ''}${holding ? ' is-holding' : ''}${draggable && pulsing ? ' is-pulsing' : ''}`;
  // 区间太窄时藏起区域标签，避免文字被裁成半截。
  const zoneLabelFits = (share: number) => share >= 18;
  const boundaryBody = (
    <>
      {boundaryLabel && <Typography shuku-edit-id="e-5c41f43b-55b4-4ac0-8d21-f3065241eb29" as="span" variant="bodySmall" tone="warning" wrap="nowrap">{boundaryLabel}</Typography>}
      <i shuku-edit-id="e-5dc32243-1031-4776-8903-c4fff1b62dca" />
      {draggable && <span shuku-edit-id="e-bdb33490-dd6c-46e9-a829-bb9990afce20" className="ngtw-bias-axis__grip absolute bottom-[-2px] left-[50%] flex w-[22px] h-[22px] items-center justify-center gap-[3px] rounded-[50%] bg-[var(--ui-accent-alt)] ml-[-11px]" aria-hidden="true" />}
    </>
  );

  return (
    <div shuku-edit-id="e-c680be47-aa17-4c61-81e0-17ef9916f16c" className={`ngtw-bias-axis relative w-full h-[174px] min-w-0 max-w-full ${className}`.trim()} style={style} ref={axisRef}>
      <div shuku-edit-id="e-7b4a5d37-b047-465d-80db-158b5b65019f" className="ngtw-bias-axis__zones absolute top-[45px] right-0 left-0 grid min-w-0 grid-cols-[var(--ngtw-boundary-position)_minmax(0,_1fr)] rounded-[6px_6px_0_0] overflow-hidden" aria-hidden="true">
        <span shuku-edit-id="e-5e408d7b-8b82-4830-89ed-8af7457627ff" className="ngtw-bias-axis__zone flex min-w-0 max-w-full justify-center overflow-hidden p-[12px_10px] text-center ngtw-bias-axis__zone--negative">
          {leftLabel && zoneLabelFits(boundaryPosition) && <Typography shuku-edit-id="e-3fe65ceb-5c83-4fb8-aff4-7c1240051a24" as="span" variant="bodySmall" tone={negativeTone}>{leftLabel}</Typography>}
        </span>
        <span shuku-edit-id="e-0424151d-f2da-4490-ac21-69cd400c4a1d" className="ngtw-bias-axis__zone flex min-w-0 max-w-full justify-center overflow-hidden p-[12px_10px] text-center ngtw-bias-axis__zone--positive">
          {rightLabel && zoneLabelFits(100 - boundaryPosition) && <Typography shuku-edit-id="e-b3caa845-3039-4df2-a4d4-4828813e841f" as="span" variant="bodySmall" tone="success">{rightLabel}</Typography>}
        </span>
      </div>

      <div shuku-edit-id="e-fe3d5481-703d-4c30-a5e8-ca86c94de160" className="ngtw-bias-axis__line absolute right-0 left-0 h-[3px] rounded-[2px] bg-[var(--ui-accent)]" aria-hidden="true" />
      {note && <Typography shuku-edit-id="e-9f3bf8ac-0621-493c-929f-4928aaaa0227" as="span" variant="bodySmall" tone="muted" className="ngtw-bias-axis__note">{note}</Typography>}
      {showBoundary && (draggable ? (
        <button shuku-edit-id="e-101e8101-7377-4e99-89bf-637ede1fa48a"
          type="button"
          className={boundaryClassName}
          role="slider"
          aria-label="分类分界线"
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={boundary}
          aria-valuetext={`分界点 ${formatScore(boundary)}`}
          data-ngtw-bias-handle
          onPointerDown={startDrag}
          onPointerMove={moveDrag}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onKeyDown={handleKeyDown}
        >
          {boundaryBody}
        </button>
      ) : (
        <div shuku-edit-id="e-a0c98e30-10e5-4b46-9e67-3b258ded7db2" className={boundaryClassName} aria-hidden="true">{boundaryBody}</div>
      ))}

      <div shuku-edit-id="e-33b33e2d-f4be-4d04-9805-d7fe81ca0c06" className="ngtw-bias-axis__ticks" aria-hidden="true">
        {ticks.map((tick) => (
          <Typography shuku-edit-id="e-cd41f648-cc60-4dc1-96ee-2c713264f771" as="span" variant="bodySmall" tone="main" key={tick} style={{ left: `${axisPosition(tick, min, max)}%` }}>
            {tick}
          </Typography>
        ))}
      </div>

      {markers.map((marker) => {
        const markerPosition = axisPosition(marker.value, min, max);
        return (
          <div shuku-edit-id="e-b6452978-30a1-4a68-99e2-ecbaf661f223" className={`ngtw-bias-axis__marker absolute flex min-w-0 max-w-full flex-col items-center gap-[6px] ngtw-bias-axis__marker--${marker.tone}`} style={{ left: `${markerPosition}%` }} key={marker.label}>
            <Typography shuku-edit-id="e-0cfc802d-5afd-420a-b420-6fec5ed4492f" as="span" variant="bodySmall" tone={marker.tone === 'green' ? 'success' : marker.tone === 'red' ? 'danger' : 'main'} wrap="nowrap">
              {marker.label}
            </Typography>
            <i shuku-edit-id="e-44ba4291-ca5c-44e8-9eac-d1bbcf3183fb" aria-hidden="true" />
          </div>
        );
      })}
    </div>
  );
}

function NaturalBoundaryFigure() {
  return (
    <div shuku-edit-id="e-03b39cc4-f444-4335-85d6-4d18a80eaf87" className="ngtw-bias-natural-figure">
      <div shuku-edit-id="e-11110937-cb28-4b23-9353-1dab3f5c75b5" className="ngtw-bias-natural-figure__labels grid min-w-0 grid-cols-[repeat(2,_minmax(0,_1fr))] text-center">
        <Typography shuku-edit-id="e-3d228752-78f6-4037-b30c-72c2670ddfbb" as="span" variant="bodySmall" tone="danger">一类</Typography>
        <Typography shuku-edit-id="e-b473a515-1166-41dd-b5b3-fe5a7bb116f8" as="span" variant="bodySmall" tone="success">另一类</Typography>
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
    <ContentBlock shuku-edit-id="e-5437833b-9300-4685-8727-cf150fe5c319"
      headingLevel={1}
      className="ngtw-bias-page ngtw-bias-boundary-page"
      title="矩阵计算之后，如何形成分类判断？"
      subtitle="矩阵计算最终得到一个数值。神经元需要根据这个数值，将输入划分为两类。"
    >
      <div shuku-edit-id="e-521756e4-4720-4169-8b53-68397534306e" className="ngtw-bias-boundary-story grid w-full h-full min-w-0 min-h-0 max-w-full grid-cols-[minmax(0,_1fr)_72px_minmax(0,_1.08fr)] items-stretch">
        <section shuku-edit-id="e-4d0e4f28-a75e-4258-9058-c87255ddd1b1" className="ngtw-bias-concept grid min-w-0 min-h-0 max-w-full grid-rows-[auto_minmax(0,_1fr)_auto] gap-[24px] p-[28px_30px_26px] ngtw-bias-concept--natural">
          <header shuku-edit-id="e-6884d9b7-af62-4d8e-ba71-d7afd4819049" className="ngtw-bias-concept__head grid min-w-0 max-w-full grid-cols-[54px_minmax(0,_1fr)] items-center gap-[16px]">
            <Typography shuku-edit-id="e-dcdfac5b-6731-4a44-a8d5-23b3387620ab" as="span" variant="h3" tone="accent" className="ngtw-bias-concept__number">1</Typography>
            <div shuku-edit-id="e-bdaf3b21-315a-4317-92d5-ef481edd1617">
              <Typography shuku-edit-id="e-889de5b0-98b1-4cc9-bc45-1ae72deefc02" as="h2" variant="h3" tone="main">正负号可以承担分类</Typography>
              <Typography shuku-edit-id="e-86faeeb6-fbc2-44a6-b4b0-8e3ff2c052f5" variant="bodySmall" tone="muted">0 左侧为负数，右侧为非负数</Typography>
            </div>
          </header>
          <NaturalBoundaryFigure />
          <div shuku-edit-id="e-b4a5503c-4af9-40e2-bd83-f8f71c329cfd" className="ngtw-bias-concept__takeaway min-w-0 p-[14px_18px]">
            <Typography shuku-edit-id="e-6fd6fecd-60b6-47a3-aec8-46337674a19e" variant="body" tone="accent">当结果分布在 0 的两侧时，符号可以直接区分两类。</Typography>
          </div>
        </section>

        <div shuku-edit-id="e-ab5cd788-334f-42de-8ef5-5eb8966aa107" className="ngtw-bias-boundary-story__turn grid min-w-0 grid-rows-[minmax(0,_1fr)_auto_minmax(0,_1fr)] place-items-center gap-[12px]" aria-hidden="true">
          <span shuku-edit-id="e-330d0169-3d49-47a3-9519-dcd51d4d1806" />
          <Typography shuku-edit-id="e-325fb253-7e4d-4d09-a0a6-f25f325c0b25" as="span" variant="bodySmall" tone="warning">问题在于</Typography>
          <span shuku-edit-id="e-3266c565-1395-4cfd-b8b5-fc364d59f864" />
        </div>

        <section shuku-edit-id="e-de2ac79b-ffd0-4656-baf9-287b987f7565" className="ngtw-bias-concept grid min-w-0 min-h-0 max-w-full grid-rows-[auto_minmax(0,_1fr)_auto] gap-[24px] p-[28px_30px_26px] ngtw-bias-concept--problem">
          <header shuku-edit-id="e-a7888c5a-032a-4186-ae0d-3ff407ba4149" className="ngtw-bias-concept__head grid min-w-0 max-w-full grid-cols-[54px_minmax(0,_1fr)] items-center gap-[16px]">
            <Typography shuku-edit-id="e-43ee0c93-6c77-45ea-9641-466c05a10870" as="span" variant="h3" tone="warning" className="ngtw-bias-concept__number">2</Typography>
            <div shuku-edit-id="e-abbb7544-b727-4c0c-9e13-5e0e6e24f498">
              <Typography shuku-edit-id="e-8b72ce0c-8576-42c3-8feb-2c94be366f69" as="h2" variant="h3" tone="main">现在，所有结果都在 0 的右侧</Typography>
              <Typography shuku-edit-id="e-24655c9f-11d0-4eca-87ee-348f7357c9c6" variant="bodySmall" tone="muted">当前输入与权重均为 0–1，加权和 y 的取值范围为 0–3</Typography>
            </div>
          </header>
          <div shuku-edit-id="e-53215258-8114-4e43-b6f2-dbeb7b63ac46" className="ngtw-bias-range-figure relative pt-[28px]">
            <Typography shuku-edit-id="e-b270b951-2636-4828-8d6d-38b6fbbb8e54" as="span" variant="bodySmall" tone="warning" className="ngtw-bias-range-figure__zero-note">0 的左侧没有结果</Typography>
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
          <div shuku-edit-id="e-19ece131-31f7-46ea-9898-9a119e72870e" className="ngtw-bias-concept__takeaway min-w-0 p-[14px_18px] ngtw-bias-concept__takeaway--problem">
            <Typography shuku-edit-id="e-e874a9f0-0899-4f51-8e2a-97a97ef4267d" variant="body" tone="main">
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
    <ContentBlock shuku-edit-id="e-bb238ca2-1df2-48de-be54-30568c347d76"
      headingLevel={1}
      className="ngtw-bias-page ngtw-bias-choice-page"
      title="偏置如何调整分类阈值？"
      subtitle="当加权和的实际范围不跨过 0 时，需要先确定合适的分界点，再用偏置将它移动到 0。"
    >
      <div shuku-edit-id="e-4106729a-c774-4f80-80fd-303d9ef62d9f" className="ngtw-bias-choice-layout grid w-full h-full min-w-0 min-h-0 max-w-full grid-cols-[minmax(0,_.6fr)_minmax(0,_1.4fr)] gap-[28px]">
        <section shuku-edit-id="e-1f8a55a2-5ca1-4afc-bccf-94e75ab0d60f" className="ngtw-bias-question-pane content-center p-[28px_30px]">
          <Question
            className="ngtw-bias-midpoint-question bg-[transparent] p-0"
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

        <section shuku-edit-id="e-f3469950-7939-4d93-95cd-e4f1b2e724d9" className={`ngtw-bias-answer-pane relative grid-rows-[auto_minmax(0,_1fr)_auto] gap-[16px] p-[26px_30px] overflow-hidden${answeredCorrectly ? ' is-revealed' : ''}`} aria-live="polite">
          <header shuku-edit-id="e-bd153ac3-5fbf-4877-9790-02b17cefb837" className="ngtw-bias-answer-pane__head grid min-w-0 grid-cols-[minmax(0,_1fr)] items-center pb-[14px]">
            <div shuku-edit-id="e-0e613330-f43f-4aa0-99a7-d54932ea52b4" className="ngtw-bias-answer-pane__rule grid min-w-0 gap-[4px]">
              <Typography shuku-edit-id="e-9e33392e-f533-470a-96d5-937e3f6863c4" as="span" variant="bodySmall" tone="success">分类规则</Typography>
              <Typography shuku-edit-id="e-a73db99f-4046-4ce1-84f3-e5c98035ad7d" as="h2" variant="h3" tone="main">加权和越过分界点，判为「输出 1」</Typography>
            </div>
          </header>

          <div shuku-edit-id="e-c8820e54-5f3c-47ff-934e-936a557a0e84" className="ngtw-bias-answer-pane__visual grid min-w-0 min-h-0 max-w-full content-center gap-[12px]">
            <div shuku-edit-id="e-657f1fcf-0091-40c1-8b6c-85a9770e6b91" className="ngtw-bias-axis-head flex min-w-0 items-baseline justify-between gap-[16px]">
              <Typography shuku-edit-id="e-1b15fdeb-a9ff-4ec4-8744-bd0cfd70d7aa" as="span" variant="bodySmall" tone="muted">加权和 y 的全部可能范围：0–3</Typography>
              <Typography shuku-edit-id="e-203b5b71-be5a-4667-847a-cc6e8fd5a80e" as="span" variant="bodySmall" tone={answeredCorrectly ? (atMidpoint ? 'success' : 'warning') : 'muted'}>
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
              className={`ngtw-bias-axis--answer h-[216px]${answeredCorrectly ? '' : ' ngtw-bias-axis--locked'}`}
            />
          </div>

          <div shuku-edit-id="e-739e5de3-b440-46bd-974c-ae5503200d9c" className="ngtw-bias-answer-pane__result grid min-w-0 min-h-0 max-w-full content-center pt-[14px]">
            {answeredCorrectly ? (
              <div shuku-edit-id="e-db5650d8-2047-4e10-9d8c-a01dd2a28d31" className="ngtw-bias-answer-pane__decision flex min-w-0 max-w-full items-center justify-between gap-[18px]">
                <Typography shuku-edit-id="e-b8e22b52-4855-42e8-b47d-52e61fd8a78a" as="strong" variant="h3" tone={aboveBoundary ? 'success' : 'accent'}>
                  {`y = ${formatScore(outputY)} ${aboveBoundary ? '≥' : '<'} ${formatScore(boundary)}`}
                </Typography>
                <Typography shuku-edit-id="e-ba586ec9-ab88-4b30-a2a2-c4c7e3219078" as="strong" variant="body" tone="main">{`倾向“${tendency}”`}</Typography>
              </div>
            ) : (
              <div shuku-edit-id="e-d7fd15da-8ad3-43a2-a857-86d712761a48" className="ngtw-bias-answer-pane__waiting grid min-w-0 justify-items-center gap-[9px] text-center">
                <span shuku-edit-id="e-aeacc919-b60f-4298-9af3-6cc239da2cab" aria-hidden="true">?</span>
                <Typography shuku-edit-id="e-bdc8fc45-e1e6-47b4-abf7-6ce11d347ec8" variant="body" tone="muted">选择正确答案后，这里会显示可拖动的分界线。</Typography>
              </div>
            )}
          </div>
        </section>
      </div>
    </ContentBlock>
  );
}

