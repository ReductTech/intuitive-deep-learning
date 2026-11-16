import { Button, ContentBlock, MathFormulaBlock, MathFormulaStatic, Question, Typography } from "@shuku/course-style/react";
import { LessonCheck, useActivityState, type ActivityProps } from '../../components/AttentionActivity';
import { useTranslationPage } from '../../components/useTranslationPage';
import { computeTranslationPaddingMask, TRANSLATION_MASK_BATCH_SLICES } from '../../model/translationTeaching';
import './AttentionPaddingMaskPage.css';
const formula = (latex: string, label: string) => <MathFormulaBlock appearance="plain" ariaLabel={label}><Typography shuku-edit-id="e-010ceb10-04f3-4a34-b08b-c2b2aa39875e" variant="bodySmall" tone="inherit"><MathFormulaStatic latex={latex}/></Typography></MathFormulaBlock>;
function MaskSlice({ index }: { index: number }) {
  const slice = TRANSLATION_MASK_BATCH_SLICES[index];
  return <section shuku-edit-id="e-77e3e40e-b411-49fd-8289-50c7fe685ebd" className="attn-mask-slice-group" data-mask-sample={index} data-valid-length={slice.validLength}>
    <Typography shuku-edit-id="e-ef849915-ffdc-43ee-a2ce-cbf79d994a0f" variant="bodySmall" align="center">样本 {index + 1} · {slice.validLength} 个有效源位置</Typography>
    <div shuku-edit-id="e-e567bb81-639d-463e-8c4e-c4dbd4314378" className="attn-mask-slice" role="img" aria-label={`${slice.label}，5个查询乘6个源位置，${6 - slice.validLength}列PAD，对所有查询相同`}>
      <span shuku-edit-id="e-040340df-ad7a-4b39-b871-c2e2d7f5d3c1"/>{slice.keyLabels.map((_, column) => <div shuku-edit-id="e-2d00fb0c-96b3-4c7c-b9d0-617988be5247" key={'k'+column} className="attn-mask-axis">{formula(`K_{${column+1}}`, `键${column+1}`)}</div>)}
      {slice.paddingMask.map((row, query) => <div shuku-edit-id="e-e50b92a2-88ed-4334-90ac-bfbbd685e40e" className="attn-mask-grid-row" key={query}>
        <div shuku-edit-id="e-8357894b-c955-4858-8844-87342ae02b92" className="attn-mask-axis">{formula(`Q_{${query+1}}`, `查询${query+1}`)}</div>
        {row.map((masked, column) => <div shuku-edit-id="e-3916e992-3d5d-47b6-91b2-13b6728b7662" key={column} className={'attn-mask-cell'+(masked?' is-padding':'')} data-mask-cell data-masked={masked}/>)}
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
  return <ContentBlock shuku-edit-id="e-a4ced56a-1a70-4264-a4a1-6f502e9f6e28" ref={root} title="填充掩码：不给占位符分配权重" headingLevel={1}
    subtitle="PAD 补齐长度，不提供内容。"
    className="attn-mask-page" bodyClassName="attn-mask-body" data-activity="C18" data-activity-complete={done}
    data-mask-enabled={state.enabled} data-mask-forecast={state.forecast ?? 'pending'} data-mask-seen={state.seen}
    data-mask-weights={JSON.stringify(data.weights)} data-mask-valid-length={data.validLength}
    data-capture-ready={mathReady} aria-busy={!mathReady}
    onKeyDown={event => { if ([' ', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) event.stopPropagation(); }}>
    <section shuku-edit-id="e-5e25019c-2a1b-46a8-9731-4c0719de92d4" className="attn-mask-data">
      <div shuku-edit-id="e-3efdc608-b643-4113-ae38-afd5004a960c" className="attn-mask-table" role="table" aria-label="短句的源位置、手设分数与注意力">
        <div shuku-edit-id="e-8c6aea3e-d32b-4af1-8c9a-951627b6557f" className="attn-mask-table-row is-head" role="row"><Typography shuku-edit-id="e-a5c53d19-62fd-45ae-b6f0-bfe4ad12b6b9" variant="bodySmall" tone="muted" role="rowheader">源词</Typography>
          {data.sourceTokens.map((token, index) => <Typography shuku-edit-id="e-bae04b45-f4b3-480e-8d0a-698f5cf8e19f" key={index} role="columnheader" variant="h3" align="center" tone={index >= data.validLength ? 'muted' : 'main'}>{token}</Typography>)}
        </div>
        <div shuku-edit-id="e-e20813aa-d0e2-46fc-af1b-3bc54e1e3318" className="attn-mask-table-row" role="row"><Typography shuku-edit-id="e-f0d5f6d7-0ed6-46a1-96f6-9a65a9425a84" variant="bodySmall" tone="muted" role="rowheader">Score</Typography>
          {data.scores.map((score, index) => <div shuku-edit-id="e-ead00f18-bd90-4b17-8f62-f531db3a886e" role="cell" key={index} data-mask-score={Number.isFinite(score) ? score : '-Infinity'}>
            {Number.isFinite(score) ? <Typography shuku-edit-id="e-7cdd4663-3c67-4d98-a2c5-fc1c0ebd723b" variant="bodySmall" align="center">{score.toFixed(1)}</Typography> : formula(String.raw`-\infty`, '负无穷')}
          </div>)}
        </div>
        <div shuku-edit-id="e-b27a15da-c59c-4b70-a99f-54b01d5c8d87" className="attn-mask-table-row" role="row"><Typography shuku-edit-id="e-b2d20035-338f-4470-9ca3-2cdcd8e83767" variant="bodySmall" tone="accent" role="rowheader">ATT</Typography>
          {data.weights.map((weight, index) => <Typography shuku-edit-id="e-3061b49f-67c2-4bcb-acc7-adc70226e9b4" role="cell" key={index} variant="body" tone={index >= data.validLength && state.enabled ? 'muted' : 'accent'} align="center" data-mask-weight={weight}>{weight.toFixed(3)}</Typography>)}
        </div>
      </div>
      <Typography shuku-edit-id="e-bb7fa76f-2807-4f17-ac40-a2907d69691f" variant="bodySmall" tone="muted">分数为手设值。开启 Mask 后，PAD 分数在 Softmax 前设为负无穷。</Typography>
    </section>
    {state.enabled ? <section shuku-edit-id="e-312d5a1f-7d36-41a3-bee6-ef3f723e0464" className="attn-mask-batch">
      <div shuku-edit-id="e-42ac1556-2858-4843-9926-8f5141144e0f" className="attn-mask-batch-heading"><Typography shuku-edit-id="e-91d1dc03-232f-4c9a-88e1-d104e316dfe5" variant="bodySmall" tone="accent">源位置 Mask · 灰色为 PAD</Typography>{formula('B=2,\\quad N=5,\\quad L=6', '2个样本、5个查询步、6个源位置')}</div>
      <div shuku-edit-id="e-5121401c-a948-4814-8f9e-9668036ebdc7" className="attn-mask-slices">{[0,1].map(index => <MaskSlice key={index} index={index}/>)}</div>
    </section> : <div shuku-edit-id="e-0839bb5e-bc31-48f7-8209-961793c41959" className="attn-mask-share" aria-live="polite">
      <div shuku-edit-id="e-aefedd94-436d-4f59-a7d4-569cf4da46ad" className="attn-mask-share-reading"><Typography shuku-edit-id="e-cb66db53-ccf6-4f55-8625-6c0aa3d84d89" variant="bodySmall" tone="muted">PAD 当前占比</Typography><Typography shuku-edit-id="e-5ecf11aa-7524-4abd-badc-926aac5042bb" variant="h2" tone="accent">{(data.paddingWeight*100).toFixed(1)}%</Typography><div shuku-edit-id="e-717739b2-77ae-4b00-9d13-85a26dfb351e" className="attn-mask-share-track" aria-hidden="true"><i shuku-edit-id="e-060ce192-f48f-4caf-a9e6-765c978439d1" style={{width: `${data.paddingWeight*100}%`}}/></div></div>
      <figure shuku-edit-id="e-2a67e06a-de5b-44bf-b109-ee56113f8242" className="attn-mask-manuscript" aria-label="讲解稿的六个源位置：五个有效词和一个仅补齐长度的PAD">
        <Typography shuku-edit-id="e-6b18f18a-631b-42b1-bd1c-51d9e75a9a5f" as="figcaption" variant="bodySmall" tone="muted">讲解稿 · 补齐长度</Typography>
        <div shuku-edit-id="e-6ee5997c-323b-48b0-a4d6-06ef541cc685" className="attn-mask-word-slots">{data.sourceTokens.map((token,index)=><div shuku-edit-id="e-6fe6ee50-6cfe-429b-8ce7-df5a52e96aec" key={index} className={index>=data.validLength?'is-padding':''}><Typography shuku-edit-id="e-59db4b9c-55cc-446f-8a1e-959cc6f818b3" variant="body" align="center" tone={index>=data.validLength?'muted':'accent'}>{token}</Typography></div>)}</div>
        <Typography shuku-edit-id="e-dc3f56a3-4c67-45b8-88f5-0d9a7c425101" variant="bodySmall" tone="muted">PAD 只有位置，没有讲解内容。</Typography>
      </figure>
    </div>}
    <footer shuku-edit-id="e-d5801fec-04be-4013-8b25-f194de75aa60" className={'attn-mask-footer'+(state.forecast !== null ? ' has-forecast' : '')}>
      {state.forecast === null ? <Question key={state.attempt} typeLabel="" showFeedback={false}
        persistenceKey={`attention-campus-C18-forecast-${state.attempt}`} title="PAD 应该分到注意力吗？" answer="no"
        options={[{ value: 'no', label: '不应该' }, { value: 'yes', label: '应该' }]}
        onCheck={result => { const answer = result.answer[0]; if (canAct() && (answer === 'yes' || answer === 'no')) setState(current => ({ ...current, forecast: answer })); }}/>
        : <>
          <div shuku-edit-id="e-425ffeed-3c97-4d96-9690-5259f968886e" className="attn-mask-toolbar"><Button variant="primary" active={state.enabled} aria-pressed={state.enabled} onClick={toggle} data-action="toggle-mask">
            <Typography shuku-edit-id="e-6e5ae88c-0999-49be-af54-a0d639b8a2ae" as="span" variant="bodySmall" tone="inherit">{state.enabled ? '关闭 Mask' : '开启 Mask'}</Typography>
          </Button><Typography shuku-edit-id="e-2b9358df-7fc6-4a52-ae26-0a660ca3fd8a" variant="bodySmall" tone={state.enabled ? 'success' : 'muted'} role="status">{state.enabled ? '已开启 · PAD 权重为 0' : '未开启 · PAD 占用权重'}</Typography>
          <Button onClick={reset} data-action="reset-mask"><Typography shuku-edit-id="e-e3d7da51-473c-4656-b0a7-100d65259760" as="span" variant="bodySmall" tone="inherit">重新观察</Typography></Button></div>
          {state.seen ? <LessonCheck key={state.attempt} id={`C18-campus-axis-${state.attempt}`} title="每一行沿哪个维度分配 ATT？"
            options={[{ value: 'L', label: 'L · 源位置' }, { value: 'N', label: 'N · 查询步', wrongFeedback: '每个查询有自己的一行；这一行在有效源位置之间分配权重。' }]}
            answer="L" correct="沿有效源位置归一化；PAD 权重为0。" done={state.checked}
            onDone={() => { if (canAct()) setState(current => ({ ...current, checked: true })); }}/>
            : <Typography shuku-edit-id="e-ed7360e0-4b16-4ec5-ace2-d0b02299015f" variant="bodySmall" tone="muted">开启 Mask，比较权重。</Typography>}
        </>}
    </footer>
  </ContentBlock>;
}
