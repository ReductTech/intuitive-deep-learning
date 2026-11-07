import { Button, ContentBlock, MathFormulaBlock, MathFormulaStatic, Question, Typography } from '../../../shared/react';
import { LessonCheck, useActivityState, type ActivityProps } from '../../components/AttentionActivity';
import { useTranslationPage } from '../../components/useTranslationPage';
import { computeTranslationPaddingMask, TRANSLATION_MASK_BATCH_SLICES } from '../../model/translationTeaching';
import './AttentionPaddingMaskPage.css';
const formula = (latex: string, label: string) => <MathFormulaBlock appearance="plain" ariaLabel={label}><Typography variant="bodySmall" tone="inherit"><MathFormulaStatic latex={latex}/></Typography></MathFormulaBlock>;
function MaskSlice({ index }: { index: number }) {
  const slice = TRANSLATION_MASK_BATCH_SLICES[index];
  return <section className="attn-mask-slice-group" data-mask-sample={index} data-valid-length={slice.validLength}>
    <Typography variant="bodySmall" align="center">样本 {index + 1} · {slice.validLength} 个有效源位置</Typography>
    <div className="attn-mask-slice" role="img" aria-label={`${slice.label}，5个查询乘6个源位置，${6 - slice.validLength}列PAD，对所有查询相同`}>
      <span/>{slice.keyLabels.map((_, column) => <div key={'k'+column} className="attn-mask-axis">{formula(`K_{${column+1}}`, `键${column+1}`)}</div>)}
      {slice.paddingMask.map((row, query) => <div className="attn-mask-grid-row" key={query}>
        <div className="attn-mask-axis">{formula(`Q_{${query+1}}`, `查询${query+1}`)}</div>
        {row.map((masked, column) => <div key={column} className={'attn-mask-cell'+(masked?' is-padding':'')} data-mask-cell data-masked={masked}/>)}
      </div>)}
    </div>
  </section>;
}
interface MaskActivity { forecast: 'yes' | 'no' | null; enabled: boolean; seen: boolean; checked: boolean; attempt: number }
const INITIAL: MaskActivity = { forecast: null, enabled: false, seen: false, checked: false, attempt: 0 };
function valid(value: unknown): value is MaskActivity {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const state = value as Partial<MaskActivity>;
  return (state.forecast === null || state.forecast === 'yes' || state.forecast === 'no')
    && typeof state.enabled === 'boolean' && typeof state.seen === 'boolean' && typeof state.checked === 'boolean'
    && typeof state.attempt === 'number' && Number.isInteger(state.attempt) && state.attempt >= 0
    && (!state.enabled || state.seen) && (!state.checked || state.seen)
    && (state.forecast !== null || !(state.enabled || state.seen || state.checked));
}
export function AttentionPaddingMaskPage(props: ActivityProps) {
  const [state, setState] = useActivityState('C18-campus-mask', INITIAL, valid);
  const done = state.seen && state.checked;
  const { root, mathReady, canAct } = useTranslationPage(done, props);
  const data = computeTranslationPaddingMask(state.enabled);
  const toggle = () => {
    if (!canAct() || state.forecast === null) return;
    setState(current => ({ ...current, enabled: !current.enabled, seen: current.seen || !current.enabled }));
  };
  const reset = () => { if (canAct()) setState(current => ({ ...INITIAL, attempt: current.attempt + 1 })); };
  return <ContentBlock ref={root} title="填充掩码：不给占位符分配权重" headingLevel={1}
    subtitle="PAD 补齐长度，不提供内容。"
    className="attn-mask-page" bodyClassName="attn-mask-body" data-activity="C18" data-activity-complete={done}
    data-mask-enabled={state.enabled} data-mask-forecast={state.forecast ?? 'pending'} data-mask-seen={state.seen}
    data-mask-weights={JSON.stringify(data.weights)} data-mask-valid-length={data.validLength}
    data-capture-ready={mathReady} aria-busy={!mathReady}
    onKeyDown={event => { if ([' ', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) event.stopPropagation(); }}>
    <section className="attn-mask-data">
      <div className="attn-mask-table" role="table" aria-label="短句的源位置、手设分数与注意力">
        <div className="attn-mask-table-row is-head" role="row"><Typography variant="bodySmall" tone="muted" role="rowheader">源词</Typography>
          {data.sourceTokens.map((token, index) => <Typography key={index} role="columnheader" variant="h3" align="center" tone={index >= data.validLength ? 'muted' : 'main'}>{token}</Typography>)}
        </div>
        <div className="attn-mask-table-row" role="row"><Typography variant="bodySmall" tone="muted" role="rowheader">Score</Typography>
          {data.scores.map((score, index) => <div role="cell" key={index} data-mask-score={Number.isFinite(score) ? score : '-Infinity'}>
            {Number.isFinite(score) ? <Typography variant="bodySmall" align="center">{score.toFixed(1)}</Typography> : formula(String.raw`-\infty`, '负无穷')}
          </div>)}
        </div>
        <div className="attn-mask-table-row" role="row"><Typography variant="bodySmall" tone="accent" role="rowheader">ATT</Typography>
          {data.weights.map((weight, index) => <Typography role="cell" key={index} variant="body" tone={index >= data.validLength && state.enabled ? 'muted' : 'accent'} align="center" data-mask-weight={weight}>{weight.toFixed(3)}</Typography>)}
        </div>
      </div>
      <Typography variant="bodySmall" tone="muted">分数为手设值。开启 Mask 后，PAD 分数在 Softmax 前设为负无穷。</Typography>
    </section>
    {state.enabled ? <section className="attn-mask-batch">
      <div className="attn-mask-batch-heading"><Typography variant="bodySmall" tone="accent">源位置 Mask · 灰色为 PAD</Typography>{formula('B=2,\\quad N=5,\\quad L=6', '2个样本、5个查询步、6个源位置')}</div>
      <div className="attn-mask-slices">{[0,1].map(index => <MaskSlice key={index} index={index}/>)}</div>
    </section> : <div className="attn-mask-share" aria-live="polite">
      <div className="attn-mask-share-reading"><Typography variant="bodySmall" tone="muted">PAD 当前占比</Typography><Typography variant="h2" tone="accent">{(data.paddingWeight*100).toFixed(1)}%</Typography><div className="attn-mask-share-track" aria-hidden="true"><i style={{width: `${data.paddingWeight*100}%`}}/></div></div>
      <figure className="attn-mask-manuscript" aria-label="讲解稿的六个源位置：五个有效词和一个仅补齐长度的PAD">
        <Typography as="figcaption" variant="bodySmall" tone="muted">讲解稿 · 补齐长度</Typography>
        <div className="attn-mask-word-slots">{data.sourceTokens.map((token,index)=><div key={index} className={index>=data.validLength?'is-padding':''}><Typography variant="body" align="center" tone={index>=data.validLength?'muted':'accent'}>{token}</Typography></div>)}</div>
        <Typography variant="bodySmall" tone="muted">PAD 只有位置，没有讲解内容。</Typography>
      </figure>
    </div>}
    <footer className={'attn-mask-footer'+(state.forecast !== null ? ' has-forecast' : '')}>
      {state.forecast === null ? <Question key={state.attempt} typeLabel="" showFeedback={false}
        persistenceKey={`attention-campus-C18-forecast-${state.attempt}`} title="PAD 应该分到注意力吗？" answer="no"
        options={[{ value: 'no', label: '不应该' }, { value: 'yes', label: '应该' }]}
        onCheck={result => { const answer = result.answer[0]; if (canAct() && (answer === 'yes' || answer === 'no')) setState(current => ({ ...current, forecast: answer })); }}/>
        : <>
          <div className="attn-mask-toolbar"><Button variant="primary" active={state.enabled} aria-pressed={state.enabled} onClick={toggle} data-action="toggle-mask">
            <Typography as="span" variant="bodySmall" tone="inherit">{state.enabled ? '关闭 Mask' : '开启 Mask'}</Typography>
          </Button><Typography variant="bodySmall" tone={state.enabled ? 'success' : 'muted'} role="status">{state.enabled ? '已开启 · PAD 权重为 0' : '未开启 · PAD 占用权重'}</Typography>
          <Button onClick={reset} data-action="reset-mask"><Typography as="span" variant="bodySmall" tone="inherit">重新观察</Typography></Button></div>
          {state.seen ? <LessonCheck key={state.attempt} id={`C18-campus-axis-${state.attempt}`} title="每一行沿哪个维度分配 ATT？"
            options={[{ value: 'L', label: 'L · 源位置' }, { value: 'N', label: 'N · 查询步', wrongFeedback: '每个查询有自己的一行；这一行在有效源位置之间分配权重。' }]}
            answer="L" correct="沿有效源位置归一化；PAD 权重为0。" done={state.checked}
            onDone={() => { if (canAct()) setState(current => ({ ...current, checked: true })); }}/>
            : <Typography variant="bodySmall" tone="muted">开启 Mask，比较权重。</Typography>}
        </>}
    </footer>
  </ContentBlock>;
}
