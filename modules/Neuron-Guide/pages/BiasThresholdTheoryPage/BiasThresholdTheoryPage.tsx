import { useRef, useState, type CSSProperties } from 'react';
import './BiasThresholdTheoryPage.css';
import { ContentBlock, Question, Typography, type QuestionCheckResult } from '../../../shared/react';
import { formatScore, useLesson, weightedSum } from '../../LessonContext';

interface AxisMarker {
  value: number;
  label: string;
  tone: 'green' | 'red';
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
}: ClassificationAxisProps) {
  const boundaryPosition = axisPosition(boundary, min, max);
  const style = { '--ng-boundary-position': `${boundaryPosition}%` } as CSSProperties;

  return (
    <div className={`ng-bias-axis ${className}`.trim()} style={style}>
      <div className="ng-bias-axis__zones" aria-hidden="true">
        <span className="ng-bias-axis__zone ng-bias-axis__zone--negative">
          <Typography as="span" variant="body" tone="danger">{leftLabel}</Typography>
        </span>
        <span className="ng-bias-axis__zone ng-bias-axis__zone--positive">
          <Typography as="span" variant="body" tone="success">{rightLabel}</Typography>
        </span>
      </div>

      <div className="ng-bias-axis__line" aria-hidden="true" />
      <div className={`ng-bias-axis__boundary${boundaryPosition <= 2 ? ' is-at-start' : boundaryPosition >= 98 ? ' is-at-end' : ''}`} aria-hidden="true">
        {boundaryLabel && <Typography as="span" variant="bodySmall" tone="warning" wrap="nowrap">{boundaryLabel}</Typography>}
        <i />
      </div>

      <div className="ng-bias-axis__ticks" aria-hidden="true">
        {ticks.map((tick) => (
          <Typography as="span" variant="bodySmall" tone="main" key={tick} style={{ left: `${axisPosition(tick, min, max)}%` }}>
            {tick}
          </Typography>
        ))}
      </div>

      {markers.map((marker) => (
        <div
          className={`ng-bias-axis__marker ng-bias-axis__marker--${marker.tone}`}
          style={{ left: `${axisPosition(marker.value, min, max)}%` }}
          key={marker.label}
        >
          <Typography as="span" variant="bodySmall" tone={marker.tone === 'green' ? 'success' : 'danger'} wrap="nowrap">
            {marker.label}
          </Typography>
          <i aria-hidden="true" />
        </div>
      ))}
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
      title="0，为什么是天然的分类边界？"
      subtitle="对于二分类，我们自然希望一类落在 0 左侧，另一类落在 0 右侧。"
    >
      <div className="ng-bias-boundary-story">
        <section className="ng-bias-concept ng-bias-concept--natural">
          <header className="ng-bias-concept__head">
            <Typography as="span" variant="h3" tone="accent" className="ng-bias-concept__number">1</Typography>
            <div>
              <Typography as="h2" variant="h3" tone="main">只看正负，就能分成两类</Typography>
              <Typography variant="bodySmall" tone="muted">0 左侧是负数，右侧是非负数</Typography>
            </div>
          </header>
          <NaturalBoundaryFigure />
          <div className="ng-bias-concept__takeaway">
            <Typography variant="body" tone="accent">数值跨过 0，符号就能承担分类。</Typography>
          </div>
        </section>

        <div className="ng-bias-boundary-story__turn" aria-hidden="true">
          <span />
          <Typography as="span" variant="bodySmall" tone="warning">可是</Typography>
          <span />
        </div>

        <section className="ng-bias-concept ng-bias-concept--problem">
          <header className="ng-bias-concept__head">
            <Typography as="span" variant="h3" tone="warning" className="ng-bias-concept__number">2</Typography>
            <div>
              <Typography as="h2" variant="h3" tone="main">现在，所有结果都在 0 的右侧</Typography>
              <Typography variant="bodySmall" tone="muted">输入与权重都在 0–1，加权和 y 只能落在 0–3</Typography>
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
              没有 b 时，无论输入如何变化，结果都不会跨过 0。
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
  const completedRef = useRef(false);
  const tendency = outputY >= 1.5 ? scenario.positiveLabel : scenario.negativeLabel;

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
      title="这道题的分界点，应该放在哪里？"
      subtitle="加权和的范围是 0–3。先做出判断，再看 bias 如何把这个位置对准 0。"
    >
      <div className="ng-bias-choice-layout">
        <section className="ng-bias-question-pane">
          <div className="ng-bias-question-pane__context">
            <Typography as="span" variant="bodySmall" tone="muted">已知范围</Typography>
            <div className="ng-bias-question-pane__range">
              <Typography as="strong" variant="h2" tone="accent">0</Typography>
              <span aria-hidden="true" />
              <Typography as="strong" variant="h2" tone="accent">3</Typography>
            </div>
            <Typography variant="bodySmall" tone="muted">希望两类拥有相同大小的判断区间</Typography>
          </div>

          <Question
            className="ng-bias-midpoint-question"
            type="choice"
            typeLabel="先预测"
            title="你会把分界点放在哪个位置？"
            answer="1.50"
            persistenceKey="neuron-guide:bias-midpoint-v1"
            onCheck={handleCheck}
            feedback={{
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
            <div>
              <Typography as="span" variant="bodySmall" tone="success">判断规则</Typography>
              <Typography as="h2" variant="h3" tone="main">达到总上限的 50% 才输出 1</Typography>
            </div>
            <div className="ng-bias-answer-pane__calculation">
              <Typography as="span" variant="bodySmall" tone="muted">3 × 50%</Typography>
              <Typography as="strong" variant="h2" tone={answeredCorrectly ? 'success' : 'muted'}>
                {answeredCorrectly ? '= 1.50' : '= ?'}
              </Typography>
            </div>
          </header>

          <div className="ng-bias-answer-pane__visual">
            <ClassificationAxis
              min={0}
              max={3}
              boundary={answeredCorrectly ? 1.5 : 0}
              ticks={[0, 1, 2, 3]}
              leftLabel={answeredCorrectly ? '输出 0' : ''}
              rightLabel={answeredCorrectly ? '输出 1' : ''}
              boundaryLabel={answeredCorrectly ? '分界点 1.50' : undefined}
              markers={answeredCorrectly ? [{
                value: outputY,
                label: `你的 y = ${formatScore(outputY)}`,
                tone: outputY >= 1.5 ? 'green' : 'red',
              }] : []}
              className="ng-bias-axis--answer"
            />
          </div>

          <div className="ng-bias-answer-pane__result">
            {answeredCorrectly ? (
              <>
                <div className="ng-bias-answer-pane__decision">
                  <Typography as="strong" variant="h3" tone={outputY >= 1.5 ? 'success' : 'danger'}>
                    {formatScore(outputY)} {outputY >= 1.5 ? '≥' : '<'} 1.50
                  </Typography>
                  <Typography as="strong" variant="body" tone="main">倾向“{tendency}”</Typography>
                </div>
                <div className="ng-bias-answer-pane__bias">
                  <Typography variant="bodySmall" tone="muted">在公式 y + b = 0 中，分界点写作 −b</Typography>
                  <Typography as="strong" variant="h3" tone="accent">−b = 1.50　→　b = −1.50</Typography>
                  <Typography variant="bodySmall" tone="warning">bias 把原始分界点 1.50 移回了 0</Typography>
                </div>
              </>
            ) : (
              <div className="ng-bias-answer-pane__waiting">
                <span aria-hidden="true">?</span>
                <Typography variant="body" tone="muted">选择后，这里会显示新的分类边界。</Typography>
              </div>
            )}
          </div>
        </section>
      </div>
    </ContentBlock>
  );
}
