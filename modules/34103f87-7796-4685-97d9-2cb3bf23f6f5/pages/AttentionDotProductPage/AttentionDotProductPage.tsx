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

  return <ContentBlock shuku-edit-id="e-045e08c9-0428-4dbb-80de-dce2838c81a5" ref={root} title="点积评分：方向和长度的作用" headingLevel={1}
    subtitle="用手设二维向量，比较方向与长度。"
    className="attn-dot-page" bodyClassName="attn-dot-body"
    data-activity="C04" data-activity-complete={done}
    data-capture-ready={mathReady} aria-busy={!mathReady}
    data-dot-theta={state.theta} data-dot-length={state.keyLength} data-dot-score={score}
    data-dot-complete={done} data-dot-example={current.id}>
    <div shuku-edit-id="e-48bf975d-8a6d-4619-b1e8-152e77ba02a5" className="attn-dot-main">
      <div shuku-edit-id="e-7b7fff74-44b9-4895-9c51-c38c65c6b4bd" className="attn-dot-visual">
        <div shuku-edit-id="e-f7b0c18c-5fe4-43a9-be69-f7be530db2c3" className="attn-dot-examples">
          <Typography shuku-edit-id="e-9e1216ff-f11b-4a18-861e-0eebacc2c60c" variant="body" className="attn-dot-query-example">Q · {current.question}</Typography>
          <Typography shuku-edit-id="e-1b1c83f8-4343-4940-a280-8f1a0ece46f9" variant="body" className="attn-dot-key-example">K · {current.clue}</Typography>
        </div>
        <svg shuku-edit-id="e-bfe60292-f18c-49e4-aaf6-781c26af17dc" className="attn-dot-plot" viewBox="0 0 900 460" role="img"
          aria-label={`Q长度为1；K长度为${state.keyLength}；夹角${state.theta}度；点积分数${scoreText}`}>
          <defs shuku-edit-id="e-51219689-f0b3-4c75-9463-8b65e772a7ed">
            <marker shuku-edit-id="e-187799d1-8f57-4ec6-a371-a031b8905d39" id={`${markerId}-q`} markerWidth="16" markerHeight="16" refX="12" refY="8" orient="auto" markerUnits="userSpaceOnUse"><path shuku-edit-id="e-92069528-f5f3-4a5c-b260-5f8d36ae4cf4" d="M 2 1 L 13 8 L 2 15 Z" className="attn-dot-q-head" /></marker>
            <marker shuku-edit-id="e-c9c49321-f567-4423-8d1b-969415958b7d" id={`${markerId}-k`} markerWidth="14" markerHeight="14" refX="11" refY="7" orient="auto" markerUnits="userSpaceOnUse"><path shuku-edit-id="e-63518d4f-b46c-40b8-a2a7-6e3a0a741cd0" d="M 1 1 L 12 7 L 1 13 Z" className="attn-dot-k-head" /></marker>
          </defs>
          <path shuku-edit-id="e-d8d07629-28df-4a5a-908e-b7a8f63c23cc" className="attn-dot-reference" d="M 685 350 A 235 235 0 0 0 215 350" />
          <path shuku-edit-id="e-6d83d936-74e8-45fb-adfd-5df33f877fbe" className="attn-dot-axis" d="M 55 350 H 845 M 450 405 V 12" />
          <path shuku-edit-id="e-8002d219-afcc-43ea-bb2d-34c0f85787de" className="attn-dot-projection" d={`M ${x} ${y} V ${ORIGIN.y}`} />
          <path shuku-edit-id="e-29a63830-60b3-459c-99c3-34fd018e1889" className="attn-dot-score-projection" d={`M ${ORIGIN.x} ${ORIGIN.y} H ${x}`} />
          {state.theta > 0 && <>
            <path shuku-edit-id="e-2df66ed9-dd7f-4306-bbf5-09b1e6898e94" className="attn-dot-sector" d={`M ${ORIGIN.x} ${ORIGIN.y} L ${ORIGIN.x + ARC_RADIUS} ${ORIGIN.y} ${arc.slice(arc.indexOf('A'))} Z`} />
            <path shuku-edit-id="e-30891125-1062-4629-9b3b-752e31792d36" className="attn-dot-angle" d={arc} />
          </>}
          <line shuku-edit-id="e-55dc5239-2ecb-4740-998e-7e352dcfc33d" className="attn-dot-q" x1={ORIGIN.x} y1={ORIGIN.y} x2={ORIGIN.x + UNIT} y2={ORIGIN.y} markerEnd={`url(#${markerId}-q)`} />
          <line shuku-edit-id="e-397404a8-23dc-410c-8ea6-6bb0a3470afc" className="attn-dot-k" x1={ORIGIN.x} y1={ORIGIN.y} x2={x} y2={y} markerEnd={`url(#${markerId}-k)`} />
          <circle shuku-edit-id="e-e26d0f22-8dba-4da6-8441-a646e3fa2240" className="attn-dot-origin" cx={ORIGIN.x} cy={ORIGIN.y} r="6" />
          <foreignObject shuku-edit-id="e-462edc06-0d97-44fe-8577-c9d8f514ee06" x="642" y="369" width="224" height="62"><Typography shuku-edit-id="e-3cdf1234-e593-4bd5-ad35-3cb67e9a4848" as="div" variant="bodySmall" className="attn-dot-query-label">Q · 长度 1</Typography></foreignObject>
          <foreignObject shuku-edit-id="e-e1902cb5-6ef6-42af-9077-af1853c3f108" x={x + (y < 70 ? 20 : -18)} y={Math.max(8,y - 60)} width="90" height="62"><Typography shuku-edit-id="e-a1149877-8434-4d83-bdd7-b1286a9bf900" as="div" variant="h3" className="attn-dot-key-label">K</Typography></foreignObject>
        </svg>
      </div>

      <section shuku-edit-id="e-99bf564f-c74f-4de5-9aef-125be2cad25d" className="attn-dot-controls" aria-label="调整方向与长度" onKeyDown={(event) => {
        if ([' ', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown'].includes(event.key)) event.stopPropagation();
      }}>
        <RangeControl controlClassName="attn-linked-range" prefix="= " label="夹角 θ" aria-label="夹角 θ" value={state.theta} min={0} max={180} step={1} digits={0} suffix="°" scale={['0°', '90°', '180°']}
          onChange={(event) => change({ type: 'set-theta', value: event.currentTarget.valueAsNumber })} />
        <RangeControl controlClassName="attn-linked-range" prefix="= " label="K 长度" aria-label="K 长度" value={state.keyLength} min={0.5} max={1.4} step={0.1} digits={1} scale={['0.5', '1.4']}
          onChange={(event) => change({ type: 'set-length', value: event.currentTarget.valueAsNumber })} />
        <div shuku-edit-id="e-267da409-2d97-449f-b83b-6acd63bd610e" className="attn-dot-score-panel">
          <div shuku-edit-id="e-340f2f18-6e1c-4dab-89be-9528ca19a7ff" className="attn-dot-score-heading">
            <Typography shuku-edit-id="e-077a6190-7f0d-43fc-846f-465bf5c0859c" variant="bodySmall" tone="accent">匹配分数</Typography>
            <Typography shuku-edit-id="e-34067790-fc12-4aa6-8785-5d0fdb34a86a" as="output" variant="h2" tone="accent" className="attn-dot-score-number" aria-label={`匹配分数 ${scoreText}`}>{scoreText}</Typography>
          </div>
          <div shuku-edit-id="e-3ab18437-e2e7-4bb7-bb16-aad135485378" className="attn-dot-score-track" aria-hidden="true">
            <div shuku-edit-id="e-d9b91de1-356b-4619-8a5e-55a55f985d7a" className="attn-dot-score-fill" style={{ left: `${Math.min(50, 50 + score / 2.8 * 100)}%`, width: `${Math.abs(score) / 2.8 * 100}%` }} />
            <div shuku-edit-id="e-46274e26-9aa9-431b-975c-0813950f1199" className="attn-dot-score-zero" />
          </div>
          <div shuku-edit-id="e-e399abec-830c-4395-9165-b8261b029acf" className="attn-dot-score-scale" aria-hidden="true"><Typography shuku-edit-id="e-fa05a5e0-5eb5-4b9d-961d-8b3488c9807a" variant="bodySmall" tone="muted">−1.4</Typography><Typography shuku-edit-id="e-25ea1315-1b03-447f-82e2-25064d889567" variant="bodySmall" tone="muted">0</Typography><Typography shuku-edit-id="e-59114762-7110-46a2-9359-0de94b5dddc0" variant="bodySmall" tone="muted">1.4</Typography></div>
        </div>
        <div shuku-edit-id="e-12a4b0df-8116-4fb1-bf57-797452c1d62c" className="attn-dot-reset-row"><Button onClick={() => change({ type: 'reset' })}><Typography shuku-edit-id="e-395f04a7-1870-4856-ab0e-2c0a4a58ed91" as="span" variant="bodySmall" tone="inherit">重置</Typography></Button></div>
      </section>
    </div>

    <footer shuku-edit-id="e-5882eca9-bb78-42b0-afd9-08992f6af721" className="attn-dot-footer">
      <div shuku-edit-id="e-deddd238-63b4-4e94-9d85-4083bf1d9a24" className="attn-dot-formula-section">
      <Typography shuku-edit-id="e-debbc5f1-05bf-48cc-965f-0d5e04bc1f34" variant="bodySmall" tone="muted">规则</Typography>
      <MathFormulaBlock appearance="plain" className="attn-dot-formula" ariaLabel="Q点乘K，等于Q长度乘K长度乘夹角的余弦">
        <MathFormulaStatic latex={String.raw`\boldsymbol{q}\!\cdot\!\boldsymbol{k}=\lVert\boldsymbol{q}\rVert\,\lVert\boldsymbol{k}\rVert\cos\theta`} />
      </MathFormulaBlock>
      </div>
      <div shuku-edit-id="e-37dcdb11-6909-48aa-8a6b-bbe509848a29" className="attn-dot-formula-section attn-dot-substitution">
      <Typography shuku-edit-id="e-84d8deee-acb3-4901-aa2d-8588f8c8ebae" variant="bodySmall" tone="muted">代入</Typography>
      <MathFormulaBlock appearance="plain" className="attn-dot-formula" ariaLabel={`1乘${state.keyLength}乘cos${state.theta}度，约等于${scoreText}`}>
        <MathFormulaStatic latex={numericFormula} />
      </MathFormulaBlock>
      </div>
    </footer>
    <Typography shuku-edit-id="e-b8128549-0def-4d93-880a-516bc6e41fa5" variant="bodySmall" tone="muted">分数≠读取比例。</Typography>
  </ContentBlock>;
}
