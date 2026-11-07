import type { CSSProperties } from 'react';
import { Button, ContentBlock, MathFormulaBlock, MathFormulaStatic, Typography } from '../../../shared/react';
import { ChoiceButtons, useActivityState, type ActivityProps } from '../../components/AttentionActivity';
import { useTranslationPage } from '../../components/useTranslationPage';
import { getTranslationTeachingStep, TRANSLATION_TEACHING_ROWS } from '../../model/translationTeaching';
import './AttentionTranslationContextPage.css';

interface ContextActivity { row: number; visited: number[] }
const INITIAL: ContextActivity = { row: 0, visited: [0] };
const isRow = (value: unknown): value is number => typeof value === 'number' && Number.isInteger(value) && value >= 0 && value < 3;
function valid(value: unknown): value is ContextActivity {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const state = value as Partial<ContextActivity>;
  return isRow(state.row) && Array.isArray(state.visited) && state.visited.length > 0 && state.visited.length <= 3
    && state.visited.every(isRow) && state.visited.includes(state.row) && new Set(state.visited).size === state.visited.length;
}
const WIDTH = 720;
const HEIGHT = 360;
const WORD_X = Array.from({ length: 6 }, (_, index) => 2 + index * 120);
const place = (x: number, y: number, width: number, height: number): CSSProperties => ({
  left: `${x / WIDTH * 100}%`, top: `${y / HEIGHT * 100}%`, width: `${width / WIDTH * 100}%`, height: `${height / HEIGHT * 100}%`,
});

export function AttentionTranslationContextPage(props: ActivityProps) {
  const [state, setState] = useActivityState('C17-campus-context', INITIAL, valid);
  const done = state.visited.length >= 2;
  const { root, mathReady, canAct } = useTranslationPage(done, props);
  const step = getTranslationTeachingStep(state.row);
  const changeRow = (value: string) => {
    const row = Number(value);
    if (!canAct() || !isRow(row)) return;
    setState(current => current.row === row ? current : { row, visited: [...new Set([...current.visited, row])] });
  };
  return <ContentBlock ref={root} headingLevel={1} title="翻译讲解稿：每一步读取什么？"
    subtitle="同一句英文，每一步读取哪里？"
    className="attn-context-page" bodyClassName="attn-context-body" data-activity="C17"
    data-activity-complete={done} data-context-row={state.row} data-context-weights={JSON.stringify(step.weights)}
    data-capture-ready={mathReady} aria-busy={!mathReady}
    onKeyDown={event => { if ([' ', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) event.stopPropagation(); }}>
    <div className="attn-context-comparison">
      {[false, true].map(dynamic => <section className="attn-context-column" key={String(dynamic)} data-context-mode={dynamic ? 'dynamic' : 'fixed'}>
        <Typography variant="h3" tone="accent">{dynamic ? '逐步读取' : '固定摘要'}</Typography>
        <Typography variant="bodySmall" tone="muted">{dynamic ? '按当前状态重新读取' : '整句编码，初始化状态'}</Typography>
        <div className="attn-context-diagram" role="img" aria-label={dynamic
          ? `手设示意：目标步${step.target}，六项读取比例${step.weights.join('、')}，按比例汇聚为当前上下文。目标词不作为注意力输入。`
          : `固定摘要示意：同一句英文先编码为C，开始时初始化解码状态；观察目标步${step.target}时C保持不变。`}>
          <svg className="attn-context-wires" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="none" aria-hidden="true">
            {WORD_X.map((x, index) => <path key={index} className={dynamic ? 'attn-context-att-wire' : 'attn-context-fixed-wire'}
              d={`M ${x + 53} ${dynamic ? 114 : 78} L 220 245`}
              style={dynamic ? { strokeWidth: 2 + step.weights[index] * 13, opacity: .16 + step.weights[index] * .84 } : undefined}/>) }
            <path className="attn-context-decoder-wire" d="M 338 285 H 496"/>
            <polygon className="attn-context-arrow" points="510,285 496,277 496,293"/>
          </svg>
          {step.sourceTokens.map((word, index) => <div key={index} className="attn-context-word-group"
            style={place(WORD_X[index], 18, 106, 98)} data-context-source={index}>
            <div className="attn-context-word" style={dynamic ? { background: `color-mix(in srgb, var(--ui-accent) ${6 + step.weights[index] * 40}%, var(--ui-bg-card))` } : undefined}>
              <Typography variant="bodySmall" align="center">{word}</Typography>
            </div>
            {dynamic && <Typography variant="bodySmall" align="center" tone={step.weights[index] >= .25 ? 'accent' : 'muted'} data-context-weight={step.weights[index]}>{step.weights[index].toFixed(2)}</Typography>}
          </div>)}
          <div className="attn-context-node is-context" style={place(100, 245, 238, 82)} data-context-node="context">
            <MathFormulaBlock appearance="plain" ariaLabel={dynamic ? `当前上下文c${step.contextIndex}` : '固定摘要C'}>
              <MathFormulaStatic latex={dynamic ? `c_{${step.contextIndex}}` : 'C'}/>
            </MathFormulaBlock>
            <Typography variant="bodySmall" tone="accent">{dynamic ? '当前上下文' : '固定摘要'}</Typography>
          </div>
          <div className="attn-context-arrow-label" style={place(340, 232, 165, 44)}>
            <Typography variant="bodySmall" align="center" tone="muted">{dynamic ? '每一步读取' : '仅用于初始化'}</Typography>
          </div>
          <div className="attn-context-node is-decoder" style={place(510, 234, 205, 104)} data-context-node="decoder">
            <Typography variant="h3" tone="accent">解码器</Typography>
            <Typography variant="bodySmall">目标：{step.target}</Typography>
          </div>
        </div>
        <Typography variant="bodySmall" tone="muted">{dynamic ? '换一步，重新读取原句。' : '后续靠状态传递。'}</Typography>
      </section>)}
    </div>
    <footer className="attn-context-footer">
      <div className="attn-context-targets"><Typography variant="bodySmall" tone="accent">观察目标步</Typography>
        <ChoiceButtons label="选择翻译目标步" value={String(state.row)} onChange={changeRow}
          options={TRANSLATION_TEACHING_ROWS.map((word, index) => ({ value: String(index), label: word }))}/>
        <Button onClick={() => { if (canAct()) setState(INITIAL); }}><Typography as="span" variant="bodySmall" tone="inherit">重新比较</Typography></Button>
      </div>
      <Typography variant="bodySmall" tone="muted">手设权重；目标词仅标记步骤，不作输入。</Typography>
    </footer>
  </ContentBlock>;
}
