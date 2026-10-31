import { ATTENTION_PAGE_COUNT, formatCoursePageNumber } from '../../model/coursePageNumber';
import { useEffect, useId, useLayoutEffect, useRef } from 'react';
import { ContentBlock, Button, MathFormulaBlock, MathFormulaStatic, RangeControl, Typography } from '../../../shared/react';
import { useAttentionLesson } from '../../model/AttentionLessonContext';
import { computeDotProduct, hasCompletedDotProduct, type DotProductAction } from '../../model/dotProduct';
import { QKV_TASKS } from '../../model/qkvRole';
import { AttentionReadingFlow } from '../../components/AttentionReadingFlow';
import './AttentionDotProductPage.css';
import '../../components/AttentionRange.css';

const ORIGIN = { x: 450, y: 340 };
const UNIT = 185;
const ARC_RADIUS = 64;

export function AttentionDotProductPage({ onComplete, isComplete }: { onComplete: () => void; isComplete: boolean }) {
  const { qkv, dotProduct: state, dispatchDotProduct } = useAttentionLesson();
  const root = useRef<HTMLElement>(null);
  const markerId = `attention-dot-${useId()}`;
  const current = QKV_TASKS.find(({ id }) => id === qkv.task) ?? QKV_TASKS[2];
  const { k, score, cosine } = computeDotProduct(state.theta, state.keyLength);
  const done = hasCompletedDotProduct(state);
  const x = ORIGIN.x + k[0] * UNIT;
  const y = ORIGIN.y - k[1] * UNIT;
  const arcX = ORIGIN.x + ARC_RADIUS * cosine;
  const arcY = ORIGIN.y - ARC_RADIUS * k[1] / state.keyLength;
  const arc = `M ${ORIGIN.x + ARC_RADIUS} ${ORIGIN.y} A ${ARC_RADIUS} ${ARC_RADIUS} 0 0 0 ${arcX} ${arcY}`;
  const scoreText = score.toFixed(2).replace('-', '−');
  const numericFormula = `1\\times ${state.keyLength.toFixed(1)}\\times\\cos ${state.theta}^\\circ \\approx ${score.toFixed(2)}`;

  useLayoutEffect(() => {
    if (root.current) root.current.inert = Boolean(root.current.closest('[aria-hidden="true"]'));
  }, []);
  useEffect(() => {
    if (done && !isComplete && !root.current?.closest('[aria-hidden="true"]')) onComplete();
  }, [done, isComplete, onComplete]);
  const change = (action: DotProductAction) => {
    if (!root.current?.closest('[aria-hidden="true"]')) dispatchDotProduct(action);
  };

  return <article ref={root} className="attn-dot-page" aria-label="点积评分：方向与长度"
    data-dot-theta={state.theta} data-dot-length={state.keyLength} data-dot-score={score} data-dot-complete={done} data-dot-example={current.id}>
    <ContentBlock title="点积评分：方向和长度的作用" headingLevel={1} className="attn-page-content">

    <div className="attn-dot-content"><AttentionReadingFlow active="score"/><div className="attn-dot-main">
      <div className="attn-dot-visual">
        <div className="attn-dot-examples">
          <Typography variant="body" className="attn-dot-query-example">Q · {current.question}</Typography>
          <Typography variant="body" className="attn-dot-key-example">K · {current.clue}</Typography>
        </div>
        <svg className="attn-dot-plot" viewBox="0 0 900 460" role="img"
          aria-label={`Q长度为1；K长度为${state.keyLength}；夹角${state.theta}度；点积分数${scoreText}`}>
          <defs>
            <marker id={`${markerId}-q`} markerWidth="16" markerHeight="16" refX="12" refY="8" orient="auto" markerUnits="userSpaceOnUse"><path d="M 2 1 L 13 8 L 2 15 Z" className="attn-dot-q-head" /></marker>
            <marker id={`${markerId}-k`} markerWidth="14" markerHeight="14" refX="11" refY="7" orient="auto" markerUnits="userSpaceOnUse"><path d="M 1 1 L 12 7 L 1 13 Z" className="attn-dot-k-head" /></marker>
          </defs>
          <path className="attn-dot-reference" d="M 635 340 A 185 185 0 0 0 265 340" />
          <path className="attn-dot-axis" d="M 105 340 H 795 M 450 395 V 40" />
          <path className="attn-dot-projection" d={`M ${x} ${y} V ${ORIGIN.y}`} />
          <path className="attn-dot-score-projection" d={`M ${ORIGIN.x} ${ORIGIN.y} H ${x}`} />
          {state.theta > 0 && <>
            <path className="attn-dot-sector" d={`M ${ORIGIN.x} ${ORIGIN.y} L ${ORIGIN.x + ARC_RADIUS} ${ORIGIN.y} ${arc.slice(arc.indexOf('A'))} Z`} />
            <path className="attn-dot-angle" d={arc} />
          </>}
          <line className="attn-dot-q" x1={ORIGIN.x} y1={ORIGIN.y} x2={ORIGIN.x + UNIT} y2={ORIGIN.y} markerEnd={`url(#${markerId}-q)`} />
          <line className="attn-dot-k" x1={ORIGIN.x} y1={ORIGIN.y} x2={x} y2={y} markerEnd={`url(#${markerId}-k)`} />
          <circle className="attn-dot-origin" cx={ORIGIN.x} cy={ORIGIN.y} r="6" />
          <foreignObject x="592" y="359" width="224" height="62"><Typography as="div" variant="bodySmall" className="attn-dot-query-label">Q · 长度 1</Typography></foreignObject>
          <foreignObject x={x - 18} y={y - 64} width="90" height="62"><Typography as="div" variant="h3" className="attn-dot-key-label">K</Typography></foreignObject>
        </svg>
      </div>

      <section className="attn-dot-controls" aria-label="调整方向与长度" onKeyDown={(event) => {
        if ([' ', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown'].includes(event.key)) event.stopPropagation();
      }}>
        <RangeControl controlClassName="attn-linked-range" prefix="= " label="夹角 θ" aria-label="夹角 θ" value={state.theta} min={0} max={180} step={1} digits={0} suffix="°" scale={['0°', '90°', '180°']}
          onChange={(event) => change({ type: 'set-theta', value: event.currentTarget.valueAsNumber })} />
        <RangeControl controlClassName="attn-linked-range" prefix="= " label="K 长度" aria-label="K 长度" value={state.keyLength} min={0.5} max={1.4} step={0.1} digits={1} scale={['0.5', '1.4']}
          onChange={(event) => change({ type: 'set-length', value: event.currentTarget.valueAsNumber })} />
        <div className="attn-dot-score-panel">
          <div className="attn-dot-score-heading">
            <Typography variant="bodySmall" tone="accent">匹配分数</Typography>
            <Typography as="output" variant="h2" tone="accent" className="attn-dot-score-number" aria-label={`匹配分数 ${scoreText}`}>{scoreText}</Typography>
          </div>
          <div className="attn-dot-score-track" aria-hidden="true">
            <div className="attn-dot-score-fill" style={{ left: `${Math.min(50, 50 + score / 2.8 * 100)}%`, width: `${Math.abs(score) / 2.8 * 100}%` }} />
            <div className="attn-dot-score-zero" />
          </div>
          <div className="attn-dot-score-scale" aria-hidden="true"><Typography variant="bodySmall" tone="muted">−1.4</Typography><Typography variant="bodySmall" tone="muted">0</Typography><Typography variant="bodySmall" tone="muted">1.4</Typography></div>
        </div>
        <div className="attn-dot-reset-row"><Button onClick={() => change({ type: 'reset' })}><Typography as="span" variant="bodySmall" tone="inherit">重置</Typography></Button></div>
      </section>
    </div>

    </div><footer className="attn-dot-footer">
      <div className="attn-dot-formula-section">
      <Typography variant="bodySmall" tone="muted">计算规则</Typography>
      <MathFormulaBlock className="attn-dot-formula" ariaLabel="Q点乘K，等于Q长度乘K长度乘夹角的余弦">
        <MathFormulaStatic latex={String.raw`\boldsymbol{q}\!\cdot\!\boldsymbol{k}=\lVert\boldsymbol{q}\rVert\,\lVert\boldsymbol{k}\rVert\cos\theta`} />
      </MathFormulaBlock>
      </div>
      <div className="attn-dot-formula-section attn-dot-substitution">
      <Typography variant="bodySmall" tone="muted">当前代入</Typography>
      <MathFormulaBlock className="attn-dot-formula" ariaLabel={`1乘${state.keyLength}乘cos${state.theta}度，约等于${scoreText}`}>
        <MathFormulaStatic latex={numericFormula} />
      </MathFormulaBlock>
      </div>
    </footer>
    </ContentBlock>
  </article>;
}
