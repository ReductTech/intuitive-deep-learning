import type { CSSProperties } from 'react';
import { Button, ContentBlock, MathFormulaBlock, MathFormulaStatic, Typography } from "@shuku/course-style/react";
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
  return <ContentBlock shuku-edit-id="e-cf39448f-4ec2-4025-be7d-ff1b22d947a1" ref={root} headingLevel={1} title="翻译讲解稿：每一步读取什么？"
    subtitle="同一句英文，每一步读取哪里？"
    className="attn-context-page" bodyClassName="attn-context-body" data-activity="C17"
    data-activity-complete={done} data-context-row={state.row} data-context-weights={JSON.stringify(step.weights)}
    data-capture-ready={mathReady} aria-busy={!mathReady}
    onKeyDown={event => { if ([' ', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) event.stopPropagation(); }}>
    <div shuku-edit-id="e-268048f0-2cba-40af-b5e4-424eb3b3919b" className="attn-context-comparison">
      {[false, true].map(dynamic => <section shuku-edit-id="e-19959f21-86c1-425c-8ee7-61a9743dd805" className="attn-context-column" key={String(dynamic)} data-context-mode={dynamic ? 'dynamic' : 'fixed'}>
        <Typography shuku-edit-id="e-3aeb358c-4990-4588-8f2d-4d3a519e7677" variant="h3" tone="accent">{dynamic ? '逐步读取' : '固定摘要'}</Typography>
        <Typography shuku-edit-id="e-74893f4b-f007-48d3-aaa5-5b3120b33df3" variant="bodySmall" tone="muted">{dynamic ? '按当前状态重新读取' : '整句编码，初始化状态'}</Typography>
        <div shuku-edit-id="e-7205e755-cdf1-49f1-9a2f-274a50f2051a" className="attn-context-diagram" role="img" aria-label={dynamic
          ? `手设示意：目标步${step.target}，六项读取比例${step.weights.join('、')}，按比例汇聚为当前上下文。目标词不作为注意力输入。`
          : `固定摘要示意：同一句英文先编码为C，开始时初始化解码状态；观察目标步${step.target}时C保持不变。`}>
          <svg shuku-edit-id="e-2ed412a3-b453-439f-9f99-6e03f3a406b0" className="attn-context-wires" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="none" aria-hidden="true">
            {WORD_X.map((x, index) => <path shuku-edit-id="e-607f501f-e0ec-46ab-8ae5-e05ab0b0b5db" key={index} className={dynamic ? 'attn-context-att-wire' : 'attn-context-fixed-wire'}
              d={`M ${x + 53} ${dynamic ? 114 : 78} L 220 245`}
              style={dynamic ? { strokeWidth: 2 + step.weights[index] * 13, opacity: .16 + step.weights[index] * .84 } : undefined}/>) }
            <path shuku-edit-id="e-948eacb5-c411-480a-a3b2-7fa980a74847" className="attn-context-decoder-wire" d="M 338 285 H 496"/>
            <polygon shuku-edit-id="e-07a9d7dd-179c-4b61-9b49-3ee25671aca4" className="attn-context-arrow" points="510,285 496,277 496,293"/>
          </svg>
          {step.sourceTokens.map((word, index) => <div shuku-edit-id="e-36443c6f-c5a7-44d1-8fee-0d5ff12005c6" key={index} className="attn-context-word-group"
            style={place(WORD_X[index], 18, 106, 98)} data-context-source={index}>
            <div shuku-edit-id="e-d9f5149f-652f-4124-a132-f59b1f3a8a8f" className="attn-context-word" style={dynamic ? { background: `color-mix(in srgb, var(--ui-accent) ${6 + step.weights[index] * 40}%, var(--ui-bg-card))` } : undefined}>
              <Typography shuku-edit-id="e-bcfa93ad-2ac2-4d88-b289-2422b57f448d" variant="bodySmall" align="center">{word}</Typography>
            </div>
            {dynamic && <Typography shuku-edit-id="e-a60e6e49-fc1d-4f78-8a7c-15bc3b2041ba" variant="bodySmall" align="center" tone={step.weights[index] >= .25 ? 'accent' : 'muted'} data-context-weight={step.weights[index]}>{step.weights[index].toFixed(2)}</Typography>}
          </div>)}
          <div shuku-edit-id="e-ab42daef-ec51-4960-bed7-0ba471fed721" className="attn-context-node is-context" style={place(100, 245, 238, 82)} data-context-node="context">
            <MathFormulaBlock appearance="plain" ariaLabel={dynamic ? `当前上下文c${step.contextIndex}` : '固定摘要C'}>
              <MathFormulaStatic latex={dynamic ? `c_{${step.contextIndex}}` : 'C'}/>
            </MathFormulaBlock>
            <Typography shuku-edit-id="e-3e6754ef-2840-4c0f-8d07-dd447618dc92" variant="bodySmall" tone="accent">{dynamic ? '当前上下文' : '固定摘要'}</Typography>
          </div>
          <div shuku-edit-id="e-bea336fa-fcec-47c6-ae2f-aa255bc7d58e" className="attn-context-arrow-label" style={place(340, 232, 165, 44)}>
            <Typography shuku-edit-id="e-a8c2d8c7-1ed8-4578-b72b-04cd8c510fa5" variant="bodySmall" align="center" tone="muted">{dynamic ? '每一步读取' : '仅用于初始化'}</Typography>
          </div>
          <div shuku-edit-id="e-b6090b21-656d-43f3-8066-e756dae20cf5" className="attn-context-node is-decoder" style={place(510, 234, 205, 104)} data-context-node="decoder">
            <Typography shuku-edit-id="e-e81bc7f9-8c59-4c80-83ab-343651783b3d" variant="h3" tone="accent">解码器</Typography>
            <Typography shuku-edit-id="e-74b88ca0-2e85-4ee7-8833-c65a8f8ccab4" variant="bodySmall">目标：{step.target}</Typography>
          </div>
        </div>
        <Typography shuku-edit-id="e-acf70fd2-e7fd-4f40-9398-1858ffc1c712" variant="bodySmall" tone="muted">{dynamic ? '换一步，重新读取原句。' : '后续靠状态传递。'}</Typography>
      </section>)}
    </div>
    <footer shuku-edit-id="e-88233846-cbcb-4a66-93df-6060d17d9b03" className="attn-context-footer">
      <div shuku-edit-id="e-0727361b-c328-4a5c-90b1-f8d66e9c458a" className="attn-context-targets"><Typography shuku-edit-id="e-5977e7a7-b077-48dd-8c60-4badd0c1048b" variant="bodySmall" tone="accent">观察目标步</Typography>
        <ChoiceButtons label="选择翻译目标步" value={String(state.row)} onChange={changeRow}
          options={TRANSLATION_TEACHING_ROWS.map((word, index) => ({ value: String(index), label: word }))}/>
        <Button onClick={() => { if (canAct()) setState(INITIAL); }}><Typography shuku-edit-id="e-76d49325-ec1e-44cc-a08d-98ab59f1b366" as="span" variant="bodySmall" tone="inherit">重新比较</Typography></Button>
      </div>
      <Typography shuku-edit-id="e-3822b76c-59ad-4db4-b39a-caf7f709a890" variant="bodySmall" tone="muted">手设权重；目标词仅标记步骤，不作输入。</Typography>
    </footer>
  </ContentBlock>;
}
