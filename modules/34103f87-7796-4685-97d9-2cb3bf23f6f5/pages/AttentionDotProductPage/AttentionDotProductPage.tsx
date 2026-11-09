import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { ContentBlock, Button, MathFormulaBlock, MathFormulaStatic, RangeControl, Typography } from "@shuku/course-style/react";
import { useAttentionLesson } from '../../model/AttentionLessonContext';
import { computeDotProduct, hasCompletedDotProduct, type DotProductAction } from '../../model/dotProduct';
import { QKV_TASKS } from '../../model/qkvRole';
import './AttentionDotProductPage.css';
import '../../components/AttentionRange.css';

const ORIGIN = { x: 450, y: 350 };
const UNIT = 235;
const ARC_RADIUS = 78;

export function AttentionDotProductPage({ onComplete, isComplete }: { onComplete: () => void; isComplete: boolean }) {
  const { qkv, dotProduct: state, dispatchDotProduct } = useAttentionLesson();
  const root = useRef<HTMLElement>(null);
  const [active, setActive] = useState(false);
  const [mathReady, setMathReady] = useState(false);
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

  useEffect(() => {
    let mounted = true;
    void customElements.whenDefined('math-field').then(() => { if (mounted) setMathReady(true); });
    return () => { mounted = false; };
  }, []);
  useLayoutEffect(() => {
    const element = root.current;
    if (!element) return;
    const sync = () => {
      const hidden = Boolean(element.closest('[aria-hidden="true"], [hidden]'));
      element.inert = hidden;
      setActive(!hidden && !document.hidden);
    };
    const observer = new MutationObserver(sync);
    for (let ancestor: HTMLElement | null = element; ancestor; ancestor = ancestor.parentElement) {
      observer.observe(ancestor, { attributes: true, attributeFilter: ['aria-hidden', 'hidden'] });
    }
    document.addEventListener('visibilitychange', sync);
    sync();
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', sync); };
  }, []);
  useEffect(() => {
    if (active && done && !isComplete) onComplete();
  }, [active, done, isComplete, onComplete]);
  const change = (action: DotProductAction) => {
    if (active && !document.hidden && !root.current?.closest('[aria-hidden="true"], [hidden]')) dispatchDotProduct(action);
  };

  return <ContentBlock ref={root} title="点积评分：方向和长度的作用" headingLevel={1}
    subtitle="用手设二维向量，比较方向与长度。"
    className="attn-dot-page" bodyClassName="attn-dot-body"
    data-activity="C04" data-activity-complete={done}
    data-capture-ready={mathReady} aria-busy={!mathReady}
    data-dot-theta={state.theta} data-dot-length={state.keyLength} data-dot-score={score}
    data-dot-complete={done} data-dot-example={current.id}>
    <div className="attn-dot-main">
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
          <path className="attn-dot-reference" d="M 685 350 A 235 235 0 0 0 215 350" />
          <path className="attn-dot-axis" d="M 55 350 H 845 M 450 405 V 12" />
          <path className="attn-dot-projection" d={`M ${x} ${y} V ${ORIGIN.y}`} />
          <path className="attn-dot-score-projection" d={`M ${ORIGIN.x} ${ORIGIN.y} H ${x}`} />
          {state.theta > 0 && <>
            <path className="attn-dot-sector" d={`M ${ORIGIN.x} ${ORIGIN.y} L ${ORIGIN.x + ARC_RADIUS} ${ORIGIN.y} ${arc.slice(arc.indexOf('A'))} Z`} />
            <path className="attn-dot-angle" d={arc} />
          </>}
          <line className="attn-dot-q" x1={ORIGIN.x} y1={ORIGIN.y} x2={ORIGIN.x + UNIT} y2={ORIGIN.y} markerEnd={`url(#${markerId}-q)`} />
          <line className="attn-dot-k" x1={ORIGIN.x} y1={ORIGIN.y} x2={x} y2={y} markerEnd={`url(#${markerId}-k)`} />
          <circle className="attn-dot-origin" cx={ORIGIN.x} cy={ORIGIN.y} r="6" />
          <foreignObject x="642" y="369" width="224" height="62"><Typography as="div" variant="bodySmall" className="attn-dot-query-label">Q · 长度 1</Typography></foreignObject>
          <foreignObject x={x + (y < 70 ? 20 : -18)} y={Math.max(8,y - 60)} width="90" height="62"><Typography as="div" variant="h3" className="attn-dot-key-label">K</Typography></foreignObject>
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

    <footer className="attn-dot-footer">
      <div className="attn-dot-formula-section">
      <Typography variant="bodySmall" tone="muted">规则</Typography>
      <MathFormulaBlock appearance="plain" className="attn-dot-formula" ariaLabel="Q点乘K，等于Q长度乘K长度乘夹角的余弦">
        <MathFormulaStatic latex={String.raw`\boldsymbol{q}\!\cdot\!\boldsymbol{k}=\lVert\boldsymbol{q}\rVert\,\lVert\boldsymbol{k}\rVert\cos\theta`} />
      </MathFormulaBlock>
      </div>
      <div className="attn-dot-formula-section attn-dot-substitution">
      <Typography variant="bodySmall" tone="muted">代入</Typography>
      <MathFormulaBlock appearance="plain" className="attn-dot-formula" ariaLabel={`1乘${state.keyLength}乘cos${state.theta}度，约等于${scoreText}`}>
        <MathFormulaStatic latex={numericFormula} />
      </MathFormulaBlock>
      </div>
    </footer>
    <Typography variant="bodySmall" tone="muted">分数≠读取比例。</Typography>
  </ContentBlock>;
}
